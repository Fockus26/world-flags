import { and, eq, ne, sql } from "drizzle-orm";

import { db } from "@/server/db/client";
import { pushSubscriptions, rateLimit } from "@/server/db/schema";
import {
	badRequest,
	getSessionUserId,
	json,
	readJsonObject,
	withErrorHandling,
} from "@/server/http";

export const prerender = false;

const MAX_FIELD_LENGTH = 512;
const MAX_ENDPOINT_LENGTH = 2048;
const DEFAULT_REMINDER_HOUR = 19;

/** La clave pública (65 bytes) y el secreto (16) de la suscripción, en base64url. */
const P256DH_PATTERN = /^[A-Za-z0-9_-]{87}=?$/;
const AUTH_PATTERN = /^[A-Za-z0-9_-]{22}(==)?$/;

/** Los servicios push de Chrome y derivados, Firefox, Edge y Safari. */
const PUSH_SERVICE_HOSTS = [
	/^fcm\.googleapis\.com$/,
	/^android\.googleapis\.com$/,
	/^[a-z0-9.-]+\.push\.services\.mozilla\.com$/,
	/^[a-z0-9.-]+\.notify\.windows\.com$/,
	/^[a-z0-9.-]+\.push\.apple\.com$/,
];

/** Altas por IP y minuto: de sobra para un jugador, que hace una por dispositivo. */
const MAX_SUBSCRIPTIONS_PER_MINUTE = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

const isText = (value: unknown, max = MAX_FIELD_LENGTH): value is string =>
	typeof value === "string" && value.length > 0 && value.length <= max;

/**
 * El servidor manda ahí los recordatorios: solo un servicio push real, por https. Con
 * una dirección cualquiera, el cron haría peticiones a lo que alguien le dijera.
 */
function isPushEndpoint(value: unknown): value is string {
	if (!isText(value, MAX_ENDPOINT_LENGTH)) return false;

	try {
		const { protocol, hostname } = new URL(value);

		return (
			protocol === "https:" &&
			PUSH_SERVICE_HOSTS.some((host) => host.test(hostname))
		);
	} catch {
		return false;
	}
}

/**
 * ¿Se pasó esta IP del límite? Sin sesión, nada más frena estas altas. Va en la tabla del
 * límite de Better Auth porque cada instancia de función tiene su memoria. Vercel siempre
 * pone la cabecera; sin ella (en local) no se limita.
 */
async function isOverRateLimit(request: Request): Promise<boolean> {
	const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

	if (!ip) return false;

	const now = Date.now();
	const windowStart = now - RATE_LIMIT_WINDOW_MS;

	const [row] = await db
		.insert(rateLimit)
		.values({ key: `push-subscribe:${ip}`, count: 1, lastRequest: now })
		.onConflictDoUpdate({
			target: rateLimit.key,
			set: {
				count: sql`case when rate_limit.last_request < ${windowStart}::bigint then 1 else rate_limit.count + 1 end`,
				lastRequest: sql`case when rate_limit.last_request < ${windowStart}::bigint then ${now}::bigint else rate_limit.last_request end`,
			},
		})
		.returning({ count: rateLimit.count });

	return (row?.count ?? 0) > MAX_SUBSCRIPTIONS_PER_MINUTE;
}

/**
 * Alta o cambio de una suscripción Web Push. Los invitados también pueden: el
 * dispositivo es de nadie. Si viene una cuenta, tiene que ser la de la sesión: sin esto,
 * cualquiera podría atribuir su suscripción a otro. `push_subscriptions` no tiene ruta
 * de lectura: solo la usa el cron.
 */
export const POST = withErrorHandling(async (request) => {
	const body = await readJsonObject(request);

	if (!body) return badRequest("Cuerpo no válido");

	const { deviceId, userId, endpoint, p256dh, auth, timezone, reminderHour } =
		body;

	if (
		!isText(deviceId) ||
		!isPushEndpoint(endpoint) ||
		typeof p256dh !== "string" ||
		!P256DH_PATTERN.test(p256dh) ||
		typeof auth !== "string" ||
		!AUTH_PATTERN.test(auth) ||
		(userId !== null && !isText(userId))
	) {
		return badRequest("Faltan campos");
	}

	if (await isOverRateLimit(request)) {
		return json({ message: "Demasiados intentos" }, 429);
	}

	if (userId !== null && userId !== (await getSessionUserId(request))) {
		return json({ message: "La cuenta no coincide con la sesión" }, 401);
	}

	const values = {
		endpoint,
		p256dh,
		authKey: auth,
		userId,
		timezone: isText(timezone) ? timezone : "UTC",
		reminderHour:
			Number.isInteger(reminderHour) &&
			(reminderHour as number) >= 0 &&
			(reminderHour as number) <= 23
				? (reminderHour as number)
				: DEFAULT_REMINDER_HOUR,
		updatedAt: new Date(),
	};

	// El mismo navegador con otro id de dispositivo (borró los datos del sitio).
	await db
		.delete(pushSubscriptions)
		.where(
			and(
				eq(pushSubscriptions.endpoint, endpoint),
				ne(pushSubscriptions.deviceId, deviceId),
			),
		);

	/**
	 * Quien solo conoce el id de un dispositivo no le cambia a una cuenta el endpoint ni el
	 * dueño: hace falta el endpoint, que es secreto, o que la fila sea de un invitado.
	 */
	await db
		.insert(pushSubscriptions)
		.values({ deviceId, ...values })
		.onConflictDoUpdate({
			target: pushSubscriptions.deviceId,
			set: values,
			where: sql`push_subscriptions.endpoint = excluded.endpoint or push_subscriptions.user_id is null or push_subscriptions.user_id = excluded.user_id`,
		});

	return json({ ok: true });
});
