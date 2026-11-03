import type { LeaderboardEntry } from "@/utils/cloud-storage";

/**
 * Caché del ranking en memoria (D188): reabrir el ranking o ir y volver
 * entre continentes dentro de un minuto no vuelve a pedir la tabla. Solo en
 * memoria (nada persistente): al recargar la página se pide de nuevo.
 *
 * Va aparte de `LeaderboardModal` para probarla sin React ni red: quien
 * carga pasa la función que pide, y el reloj es inyectable.
 *
 * Se invalida donde el ranking cambia por obra del propio usuario, para que
 * nunca vea su tiempo viejo justo después de batirlo: al subir una marca se
 * borra ese scope (`upsertLeaderboardEntry`), y al cambiar nombre o avatar
 * (`syncLeaderboardProfile`) o de sesión (`AuthEffects`) se vacía entera.
 * Quien tenga el ranking a la vista se suscribe (`subscribe`) para enterarse
 * y volver a pedirlo sin que haya que reabrirlo (D198).
 */

/** Cuánto vale una respuesta del ranking antes de volver a pedirla. */
export const LEADERBOARD_CACHE_TTL_MS = 60_000;

interface CachedLeaderboard {
	entries: LeaderboardEntry[];
	fetchedAt: number;
}

export interface LeaderboardCache {
	/** El ranking del scope si se pidió hace menos de `ttlMs`; si no, `null`. */
	peek(scope: string): LeaderboardEntry[] | null;
	/**
	 * El ranking del scope: el de la caché si está fresco; si no, lo pide con
	 * `fetcher`. Dos llamadas mientras la primera está en vuelo comparten la
	 * misma petición. Un error no se guarda: la siguiente llamada reintenta.
	 */
	load(
		scope: string,
		fetcher: (scope: string) => Promise<LeaderboardEntry[]>,
	): Promise<LeaderboardEntry[]>;
	/** Olvida un scope (también la petición en vuelo: su respuesta ya no se guarda). */
	invalidate(scope: string): void;
	/** Olvida todos los scopes. */
	clear(): void;
	/**
	 * Avisa a `listener` cada vez que se invalida un scope (con ese scope) o se
	 * vacía la caché (con `null`: todos). Devuelve la función que deja de
	 * avisar.
	 */
	subscribe(listener: LeaderboardCacheListener): () => void;
}

/** Recibe el scope invalidado, o `null` si se vació la caché entera. */
export type LeaderboardCacheListener = (scope: string | null) => void;

export function createLeaderboardCache({
	now = Date.now,
	ttlMs = LEADERBOARD_CACHE_TTL_MS,
}: {
	now?: () => number;
	ttlMs?: number;
} = {}): LeaderboardCache {
	const cached = new Map<string, CachedLeaderboard>();
	const inFlight = new Map<string, Promise<LeaderboardEntry[]>>();
	const listeners = new Set<LeaderboardCacheListener>();

	// Sobre una copia: un oyente que se da de baja al recibir el aviso no
	// salta al siguiente.
	function notify(scope: string | null) {
		for (const listener of [...listeners]) listener(scope);
	}

	function peek(scope: string): LeaderboardEntry[] | null {
		const hit = cached.get(scope);
		if (!hit) return null;

		if (now() - hit.fetchedAt >= ttlMs) {
			cached.delete(scope);
			return null;
		}

		return hit.entries;
	}

	function load(
		scope: string,
		fetcher: (scope: string) => Promise<LeaderboardEntry[]>,
	): Promise<LeaderboardEntry[]> {
		const fresh = peek(scope);
		if (fresh) return Promise.resolve(fresh);

		const pending = inFlight.get(scope);
		if (pending) return pending;

		const request = fetcher(scope).then(
			(entries) => {
				// Si se invalidó mientras estaba en vuelo, esta respuesta puede
				// traer el tiempo de antes: se entrega a quien la pidió, pero no
				// se guarda.
				if (inFlight.get(scope) === request) {
					inFlight.delete(scope);
					cached.set(scope, { entries, fetchedAt: now() });
				}

				return entries;
			},
			(error: unknown) => {
				if (inFlight.get(scope) === request) inFlight.delete(scope);
				throw error;
			},
		);

		inFlight.set(scope, request);

		return request;
	}

	return {
		peek,
		load,
		invalidate(scope) {
			cached.delete(scope);
			inFlight.delete(scope);
			notify(scope);
		},
		clear() {
			cached.clear();
			inFlight.clear();
			notify(null);
		},
		subscribe(listener) {
			listeners.add(listener);

			return () => {
				listeners.delete(listener);
			};
		},
	};
}

/** La caché de la app: una sola, compartida por cada apertura del ranking. */
export const leaderboardCache = createLeaderboardCache();
