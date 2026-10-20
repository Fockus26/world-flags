import type { UserLearningData } from "@/types/progress";
import { planSync } from "./learning-storage";

/**
 * La fila de la nube tal como se leyó, con su versión: el `updated_at` que
 * tenía. Una subida solo se escribe si la fila sigue en esa versión (D210).
 */
export interface VersionedLearningData {
	data: UserLearningData;
	version: string;
}

/** Lo que `runVersionedSync` necesita de la nube (en los tests, una fila en memoria). */
export interface VersionedSyncStore {
	read: () => Promise<VersionedLearningData | null>;
	/**
	 * Escribe `data` solo si la fila sigue en la versión de `previous` (sin
	 * `previous`, solo si la fila sigue sin existir). `false`: otro dispositivo
	 * escribió entre la lectura y la subida, y no se tocó nada.
	 */
	write: (
		data: UserLearningData,
		previous: VersionedLearningData | null,
	) => Promise<boolean>;
}

/**
 * Intentos de leer → fusionar → subir antes de rendirse. Cada conflicto
 * significa que otro dispositivo escribió entre medias; con dos o tres
 * dispositivos a la vez, tres vueltas sobran. Si se agotan, la subida falla
 * como cualquier otra y la cola la reintenta (D051).
 */
export const MAX_SYNC_ATTEMPTS = 3;

/** Se agotaron los intentos: la fila cambiaba cada vez entre leer y escribir. */
export class SyncConflictError extends Error {
	constructor() {
		super(
			`La fila cambió entre la lectura y la subida ${MAX_SYNC_ATTEMPTS} veces seguidas`,
		);
		this.name = "SyncConflictError";
	}
}

/**
 * Una sincronización con control de concurrencia optimista (D210): lee la
 * fila, la fusiona con lo local (`planSync`) y la sube **condicionada a la
 * versión leída**. Si otro dispositivo escribió entre medias, la subida no
 * toca nada y se vuelve a leer y fusionar: así su cambio entra en la fusión
 * (con las fechas por campo de D055) en vez de quedar pisado por una subida
 * retrasada que llegó después.
 *
 * Devuelve lo que quedó en la nube y si se descartó lo local (D056).
 */
export async function runVersionedSync(
	store: VersionedSyncStore,
	localData: UserLearningData,
	base: UserLearningData | null,
): Promise<{ data: UserLearningData; discardedLocal: boolean }> {
	for (let attempt = 1; attempt <= MAX_SYNC_ATTEMPTS; attempt++) {
		const remote = await store.read();

		const plan = planSync(remote?.data ?? null, localData, base);

		if (!plan.push || (await store.write(plan.data, remote))) {
			return { data: plan.data, discardedLocal: plan.discardedLocal };
		}
	}

	throw new SyncConflictError();
}

/**
 * La versión que lleva una subida: la hora actual, salvo que coincida con la
 * versión leída (relojes desajustados): entonces un milisegundo más, para que
 * la escritura siguiente de otro dispositivo, condicionada a la versión vieja,
 * no la confunda con la suya.
 */
export function nextVersion(previous: string | null, now = new Date()): string {
	if (previous !== null && Date.parse(previous) === now.getTime()) {
		return new Date(now.getTime() + 1).toISOString();
	}

	return now.toISOString();
}
