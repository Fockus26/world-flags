import { inArray } from "drizzle-orm";
import webpush from "web-push";

import { db } from "@/server/db/client";
import { pushSubscriptions } from "@/server/db/schema";
import { json, withErrorHandling } from "@/server/http";

export const prerender = false;

/** Un servicio push que no contesta no retiene a los demás: el temporizador corta a 60 s. */
const PUSH_TIMEOUT_MS = 10_000;

/** Hora local (0-23) de `timezone` en este instante. `Intl` ya sabe manejar DST; una resta de offset fijo no. */
function localHourInTimezone(timezone: string): number | null {
	try {
		const formatted = new Intl.DateTimeFormat("en-US", {
			timeZone: timezone,
			hour: "numeric",
			hour12: false,
		}).format(new Date());

		// "24" a medianoche en algunos locales/runtimes; se normaliza a 0.
		return Number.parseInt(formatted, 10) % 24;
	} catch {
		return null;
	}
}

/**
 * El recordatorio diario, a quien tenga `reminder_hour` == la hora actual EN SU zona
 * horaria. Se llama una vez por hora: así cada usuario lo recibe a SU hora local sin 24
 * trabajos distintos. La llama un temporizador en el VPS (`drizzle/README.md`), con
 * `CRON_SECRET`: sin él esto dejaría a cualquiera disparar envíos a discreción.
 */
export const POST = withErrorHandling(async (request) => {
	const cronSecret = process.env.CRON_SECRET;

	if (
		!cronSecret ||
		request.headers.get("authorization") !== `Bearer ${cronSecret}`
	) {
		return json({ message: "No autorizado" }, 401);
	}

	const subscriptions = await db.select().from(pushSubscriptions);

	const due = subscriptions.filter(
		(row) => localHourInTimezone(row.timezone) === row.reminderHour,
	);

	if (due.length === 0) return json({ sent: 0, stale: 0, failed: 0 });

	webpush.setVapidDetails(
		process.env.VAPID_SUBJECT ?? "",
		process.env.PUBLIC_VAPID_PUBLIC_KEY ?? "",
		process.env.VAPID_PRIVATE_KEY ?? "",
	);

	const payload = JSON.stringify({
		title: "¿Practicamos un rato?",
		body: "Tu racha te está esperando en World Flags.",
	});

	const staleDeviceIds: string[] = [];

	let sent = 0;
	let failed = 0;

	await Promise.all(
		due.map(async (row) => {
			try {
				await webpush.sendNotification(
					{
						endpoint: row.endpoint,
						keys: { p256dh: row.p256dh, auth: row.authKey },
					},
					payload,
					{ timeout: PUSH_TIMEOUT_MS },
				);

				sent += 1;
			} catch (sendError) {
				// 404/410 = la suscripción ya no existe en el navegador
				// (desinstalada, permiso revocado, endpoint expirado): se borra
				// para no reintentar para siempre. Cualquier otro error se
				// registra y se deja para el siguiente cron.
				const statusCode = (sendError as { statusCode?: number }).statusCode;

				if (statusCode === 404 || statusCode === 410) {
					staleDeviceIds.push(row.deviceId);
				} else {
					failed += 1;

					console.error(
						`Failed to send push to device ${row.deviceId}:`,
						sendError,
					);
				}
			}
		}),
	);

	if (staleDeviceIds.length > 0) {
		await db
			.delete(pushSubscriptions)
			.where(inArray(pushSubscriptions.deviceId, staleDeviceIds));
	}

	return json({ sent, stale: staleDeviceIds.length, failed });
});
