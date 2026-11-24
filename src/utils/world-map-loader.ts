import worldMapUrl from "@/data/world-map.json?url";
import type { WorldMapData } from "@/types/world-map";
import { shouldPrecacheFlags } from "@/utils/flag-precache";

let worldMapPromise: Promise<WorldMapData> | undefined;

/**
 * El mapa pesa ~100 KB comprimido: se pide solo cuando hace falta, una vez.
 * Si la descarga falla no se recuerda el fallo: la siguiente llamada vuelve a
 * intentarlo (sin red al abrir el juego, con red al pulsar «Reintentar»).
 */
export function loadWorldMap(): Promise<WorldMapData> {
	worldMapPromise ??= fetch(worldMapUrl)
		.then((response) => {
			if (!response.ok) throw new Error(`world-map: ${response.status}`);
			return response.json() as Promise<WorldMapData>;
		})
		.catch((error: unknown) => {
			worldMapPromise = undefined;
			throw error;
		});

	return worldMapPromise;
}

/**
 * Deja el mapa en la caché del service worker para poder jugar Mapa sin red
 * aunque nunca se haya abierto, igual que las banderas (D054). El service
 * worker guarda todo GET propio que pasa por él: basta con pedirlo. Con el mapa
 * ya guardado, o sin service worker al mando, no pide nada.
 */
export async function precacheWorldMap(): Promise<void> {
	if (!navigator.serviceWorker?.controller || !navigator.onLine) return;

	const { connection } = navigator as Navigator & {
		connection?: Parameters<typeof shouldPrecacheFlags>[0];
	};
	if (!shouldPrecacheFlags(connection)) return;

	try {
		if (await caches.match(worldMapUrl)) return;
		await fetch(worldMapUrl);
	} catch {
		// Sin red o sin caché: se reintenta en la siguiente precarga.
	}
}
