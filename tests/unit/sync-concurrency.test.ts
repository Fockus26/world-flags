/**
 * Control de concurrencia de las subidas (D210): `runVersionedSync` contra una
 * fila en memoria que se comporta como la nube (UPDATE condicionado al
 * `updated_at` leído, INSERT que falla si la fila ya existe). Cubre el
 * hallazgo del QA funcional del 2026-10-20: una subida retrasada de otro
 * dispositivo pisaba un cambio de configuración más reciente.
 *
 * También el apartado de lo pendiente cuando la sesión se cierra sola
 * (`savePendingAccountData`/`restorePendingAccountData`) y la marca de
 * cierre voluntario (`session-end.ts`).
 */
import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";

import type { UserLearningData } from "@/types/progress";
import {
	createDefaultLearningData,
	getLearningData,
	getSyncBase,
	registerRegionGame,
	restorePendingAccountData,
	saveLearningData,
	savePendingAccountData,
	saveUserProfile,
	updateLastConfiguration,
} from "@/utils/learning-storage";
import {
	consumeVoluntarySignOut,
	markVoluntarySignOut,
} from "@/utils/session-end";
import {
	MAX_SYNC_ATTEMPTS,
	nextVersion,
	runVersionedSync,
	SyncConflictError,
	type VersionedLearningData,
	type VersionedSyncStore,
} from "@/utils/sync-attempts";

class MemoryStorage {
	private items = new Map<string, string>();

	getItem(key: string) {
		return this.items.get(key) ?? null;
	}

	setItem(key: string, value: string) {
		this.items.set(key, value);
	}

	removeItem(key: string) {
		this.items.delete(key);
	}

	clear() {
		this.items.clear();
	}
}

const storage = new MemoryStorage();

Object.assign(globalThis, { window: { localStorage: storage } });

beforeEach(() => storage.clear());

const T0 = "2026-10-20T15:20:00.000Z";
const T_B = "2026-10-20T15:22:15.000Z";
const T_A = "2026-10-20T15:22:38.000Z";

/** Copia profunda: la "nube" no comparte objetos con quien la lee. */
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/**
 * La fila de `user_learning_data` en memoria. `version` hace de `updated_at`;
 * `writes` cuenta las escrituras que llegaron a aplicarse.
 */
function createCloud(initial: UserLearningData | null) {
	let row: VersionedLearningData | null = initial
		? { data: clone(initial), version: "v0" }
		: null;
	let counter = 0;
	let writes = 0;

	return {
		get row() {
			return row;
		},
		get writes() {
			return writes;
		},
		/** Lo que hace `fetchRemoteLearningData`. */
		read: async () => (row ? clone(row) : null),
		/** Lo que hace `pushLearningData`: UPDATE con `updated_at = leído` o INSERT. */
		write: async (
			data: UserLearningData,
			previous: VersionedLearningData | null,
		) => {
			const matches = previous
				? row?.version === previous.version
				: row === null;

			if (!matches) return false;

			counter += 1;
			writes += 1;
			row = { data: clone(data), version: `v${counter}` };

			return true;
		},
	};
}

type Cloud = ReturnType<typeof createCloud>;

/** Lo que ya está en la nube y en los dos dispositivos. */
function sharedData(): UserLearningData {
	let data = createDefaultLearningData();

	data = registerRegionGame(data, "europe", 7, T0);
	data = saveUserProfile(data, { ...data.profile, name: "Alejandro" }, T0);
	data = updateLastConfiguration(data, { mode: "practice" }, T0);

	return data;
}

/**
 * Un dispositivo cuya subida se queda retenida entre la lectura y la
 * escritura (red lenta): lee ya, y escribe cuando se llama a `release`.
 */
function delayedStore(cloud: Cloud) {
	let release: () => void = () => {};
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});
	let firstWrite = true;

	const store: VersionedSyncStore = {
		read: cloud.read,
		write: async (data, previous) => {
			if (firstWrite) {
				firstWrite = false;
				await gate;
			}

			return cloud.write(data, previous);
		},
	};

	return { store, release: () => release() };
}

describe("subidas con control de concurrencia (D210)", () => {
	test("una subida retrasada no pisa un cambio más reciente de otro dispositivo", async () => {
		const base = sharedData();
		const cloud = createCloud(base);

		// B: juega una partida y en el camino deja la configuración en
		// competitivo (fecha 15:22:15). Su subida se queda retenida.
		let localB = registerRegionGame(base, "asia", 8, T_B);
		localB = updateLastConfiguration(localB, { mode: "competitive" }, T_B);
		const deviceB = delayedStore(cloud);
		const syncB = runVersionedSync(deviceB.store, localB, base);

		// Deja que B lea antes de que A escriba.
		await Promise.resolve();

		// A: cambia el modo a práctica (fecha posterior, 15:22:38) y sube.
		const localA = updateLastConfiguration(base, { mode: "practice" }, T_A);
		await runVersionedSync(cloud, localA, base);

		assert.equal(cloud.row?.data.fieldUpdatedAt.lastConfiguration, T_A);

		// Sale la subida de B: la fila ya no está en la versión que leyó, así
		// que no se escribe; B vuelve a leer, fusiona y sube.
		deviceB.release();
		const resultB = await syncB;

		const final = cloud.row?.data;

		// Gana la configuración de A (más reciente) y se conserva la partida de B.
		assert.equal(final?.lastConfiguration?.mode, "practice");
		assert.equal(final?.fieldUpdatedAt.lastConfiguration, T_A);
		assert.deepEqual(final?.regionGameScores.asia, [8]);
		assert.deepEqual(final?.regionGameScores.europe, [7]);
		// Lo que B adopta como base es lo que quedó en la nube.
		assert.equal(JSON.stringify(resultB.data), JSON.stringify(final));
		assert.equal(cloud.writes, 2);
	});

	test("el orden de llegada no cambia el resultado", async () => {
		const base = sharedData();

		let localB = registerRegionGame(base, "asia", 8, T_B);
		localB = updateLastConfiguration(localB, { mode: "competitive" }, T_B);
		const localA = updateLastConfiguration(base, { mode: "practice" }, T_A);

		// B primero, luego A.
		const cloud1 = createCloud(base);
		await runVersionedSync(cloud1, localB, base);
		await runVersionedSync(cloud1, localA, base);

		// A primero, luego B.
		const cloud2 = createCloud(base);
		await runVersionedSync(cloud2, localA, base);
		await runVersionedSync(cloud2, localB, base);

		assert.equal(
			JSON.stringify(cloud1.row?.data),
			JSON.stringify(cloud2.row?.data),
		);
		assert.equal(cloud1.row?.data.lastConfiguration?.mode, "practice");
	});

	test("sin cambios que aportar no se escribe", async () => {
		const base = sharedData();
		const cloud = createCloud(base);

		const result = await runVersionedSync(cloud, base, base);

		assert.equal(cloud.writes, 0);
		assert.equal(JSON.stringify(result.data), JSON.stringify(base));
	});

	test("dos dispositivos crean la fila a la vez: el segundo fusiona en vez de pisar", async () => {
		const cloud = createCloud(null);

		const localA = registerRegionGame(
			createDefaultLearningData(),
			"europe",
			9,
			T_A,
		);
		const localB = registerRegionGame(
			createDefaultLearningData(),
			"asia",
			6,
			T_B,
		);

		// B lee "sin fila", A crea la fila, luego sale el INSERT de B.
		const deviceB = delayedStore(cloud);
		const syncB = runVersionedSync(deviceB.store, localB, null);
		await Promise.resolve();
		await runVersionedSync(cloud, localA, null);
		deviceB.release();
		const resultB = await syncB;

		// La cuenta ya tiene progreso y B no tiene base: lo suyo era de
		// invitado y se descarta (D056), pero la fila de A sigue entera.
		assert.equal(resultB.discardedLocal, true);
		assert.deepEqual(cloud.row?.data.regionGameScores.europe, [9]);
		assert.equal(cloud.writes, 1);
	});

	test("si la fila cambia en cada vuelta, se rinde y la cola reintenta más tarde", async () => {
		const base = sharedData();
		const local = updateLastConfiguration(base, { mode: "competitive" }, T_B);
		let reads = 0;

		const store: VersionedSyncStore = {
			read: async () => {
				reads += 1;
				return { data: clone(base), version: `v${reads}` };
			},
			write: async () => false,
		};

		await assert.rejects(
			runVersionedSync(store, local, base),
			SyncConflictError,
		);
		assert.equal(reads, MAX_SYNC_ATTEMPTS);
	});

	test("la versión nueva nunca coincide con la leída", () => {
		const now = new Date(T_A);

		assert.equal(nextVersion(null, now), T_A);
		assert.equal(nextVersion(T_B, now), T_A);
		// Mismo instante con otro formato (como lo devuelve Postgres).
		assert.equal(
			nextVersion("2026-10-20T15:22:38+00:00", now),
			"2026-10-20T15:22:38.001Z",
		);
	});
});

describe("lo pendiente de una sesión cerrada sola (D210)", () => {
	test("vuelve como datos locales y base al entrar con la misma cuenta", () => {
		const base = sharedData();
		const pending = registerRegionGame(base, "asia", 8, T_B);

		savePendingAccountData("user-a", pending, base);

		// Mientras tanto, el invitado juega en este dispositivo.
		saveLearningData(createDefaultLearningData());

		assert.equal(restorePendingAccountData("user-a"), true);
		assert.deepEqual(getLearningData().regionGameScores.asia, [8]);
		assert.equal(JSON.stringify(getSyncBase("user-a")), JSON.stringify(base));
		// Se repone una sola vez.
		assert.equal(restorePendingAccountData("user-a"), false);
	});

	test("otra cuenta no lo toma, y se conserva para la suya", () => {
		const base = sharedData();
		const pending = registerRegionGame(base, "asia", 8, T_B);

		savePendingAccountData("user-a", pending, base);

		assert.equal(restorePendingAccountData("user-b"), false);
		assert.equal(getSyncBase("user-b"), null);
		assert.equal(restorePendingAccountData("user-a"), true);
	});
});

describe("marca de cierre voluntario", () => {
	test("vale para un solo cierre", () => {
		assert.equal(consumeVoluntarySignOut(), false);

		markVoluntarySignOut();

		assert.equal(consumeVoluntarySignOut(), true);
		assert.equal(consumeVoluntarySignOut(), false);
	});
});
