import { db } from "@/server/db/client";
import { pushSubscriptions } from "@/server/db/schema";
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

const isText = (value: unknown, max = MAX_FIELD_LENGTH): value is string =>
	typeof value === "string" && value.length > 0 && value.length <= max;

/** El servidor manda ahí los recordatorios: solo un servicio push real, por https. */
function isPushEndpoint(value: unknown): value is string {
	if (!isText(value, MAX_ENDPOINT_LENGTH)) return false;

	try {
		return new URL(value).protocol === "https:";
	} catch {
		return false;
	}
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
		!isText(p256dh) ||
		!isText(auth) ||
		(userId !== null && !isText(userId))
	) {
		return badRequest("Faltan campos");
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

	await db
		.insert(pushSubscriptions)
		.values({ deviceId, ...values })
		.onConflictDoUpdate({ target: pushSubscriptions.deviceId, set: values });

	return json({ ok: true });
});
