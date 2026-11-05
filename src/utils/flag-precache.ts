import { countries } from "@/data/countries";

/** Lo que usamos de la Network Information API (no está en los tipos del DOM). */
interface ConnectionInfo {
	saveData?: boolean;
	effectiveType?: string;
}

/**
 * ¿Merece la pena precargar ahora (~3,1 MB)? No, si el usuario pidió ahorrar
 * datos o la conexión es 2G: ahí se queda como antes, con las banderas que ya
 * vio. Sin la API (Safari, Firefox) se precarga: es lo que eligió el dueño.
 */
export function shouldPrecacheFlags(
	connection: ConnectionInfo | undefined,
): boolean {
	if (!connection) return true;
	if (connection.saveData) return false;

	return (
		connection.effectiveType !== "slow-2g" && connection.effectiveType !== "2g"
	);
}

export function getFlagUrl(code: string): string {
	return `/flags/${code}.svg`;
}

export function getFlagUrls(): string[] {
	return countries.map((country) => getFlagUrl(country.code));
}

/**
 * Pide al service worker que guarde en caché las banderas que le falten
 * (D054, D229), para poder practicar sin red cualquier continente, también los
 * que nunca se abrieron. El SW solo descarga las que no tiene y junta las
 * peticiones en una sola precarga, así que llamarla a menudo es barato.
 *
 * `priorityCodes`: las banderas que la partida va a enseñar enseguida; el SW
 * las descarga antes que el resto. Sin service worker no hace nada.
 */
export async function requestFlagPrecache(
	priorityCodes: readonly string[] = [],
): Promise<void> {
	if (!("serviceWorker" in navigator) || !navigator.onLine) return;

	const { connection } = navigator as Navigator & {
		connection?: ConnectionInfo;
	};

	if (!shouldPrecacheFlags(connection)) return;

	const registration = await navigator.serviceWorker.ready;

	registration.active?.postMessage({
		type: "PRECACHE_FLAGS",
		urls: getFlagUrls(),
		priority: priorityCodes.map(getFlagUrl),
	});
}

/**
 * Pide al navegador que no borre la caché por falta de espacio o de uso
 * (Safari la borra tras días sin abrir la web). Solo con la app instalada:
 * ahí Chrome lo concede sin preguntar y Safari no la borra, y en una pestaña
 * normal Firefox sacaría un aviso de permiso que nadie ha pedido.
 */
export async function requestPersistentStorage(): Promise<void> {
	const isInstalled = window.matchMedia?.("(display-mode: standalone)").matches;
	if (!isInstalled || !navigator.storage?.persist) return;

	try {
		if (!(await navigator.storage.persisted()))
			await navigator.storage.persist();
	} catch {
		// Sin permiso o sin la API: la caché sigue funcionando igual.
	}
}
