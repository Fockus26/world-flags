import { eq } from "drizzle-orm";

import { db } from "@/server/db/client";
import { appConfig } from "@/server/db/schema";
import { json, withErrorHandling } from "@/server/http";

export const prerender = false;

const MIN_VERSION_KEY = "min_version";

/**
 * `app_config lectura pública`, solo la clave que usa la app: la tabla no se expone
 * entera y no hay ruta de escritura (se edita a mano, en la base). Se pide a cada
 * jugador al volver a la pestaña: un minuto de caché en Vercel evita una consulta por cada uno.
 */
export const GET = withErrorHandling(async () => {
	const [row] = await db
		.select({ value: appConfig.value })
		.from(appConfig)
		.where(eq(appConfig.key, MIN_VERSION_KEY));

	return json({ value: row?.value ?? null }, 200, {
		"Cache-Control": "public, max-age=0, s-maxage=60",
	});
});
