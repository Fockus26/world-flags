/**
 * Control de concurrencia de las subidas (D210): `runVersionedSync` contra una
 * fila en memoria que se comporta como la nube (UPDATE condicionado al
 * `updated_at` leído, INSERT que falla si la fila ya existe). Cubre el
 * hallazgo del QA funcional del 2026-10-20: una subida retrasada de otro
 * dispositivo pisaba un cambio de configuración más reciente.
 *
 * También el apartado de lo pendiente cuando la sesión se cierra sola
 * (`savePendingAccountData`/`restorePendingAccountData`) y la marca de
 * cierre voluntario (`session-end.ts`). Y, con D214, que lo jugado como
 * invitado tras ese cierre involuntario se sume a lo apartado al volver a
 * entrar, en vez de perderse sin aviso.
 */
import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";

import type { UserLearningData } from "@/types/progress";
import {
	createDefaultLearningData,
	detachGuestFromPendingAccount,
	getLearningData,
	getSyncBase,
	getVoluntarySignOutMark,
	registerRegionGame,
	restorePendingAccountData,
	saveSyncBase,
	setAsideOtherAccountData,
	saveLearningData,
	savePendingAccountData,
	saveReviewResult,
	saveUserProfile,
	updateLastConfiguration,
} from "@/utils/learning-storage";
import {
	cancelVoluntarySignOut,
	consumeVoluntarySignOut,
	isVoluntarySignOutOf,
	markVoluntarySignOut,
	rememberSession,
	wasSignOutRequestedElsewhere,
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

		// Mientras tanto, el invitado no juega (datos vacíos).
		saveLearningData(createDefaultLearningData());

		assert.deepEqual(restorePendingAccountData("user-a"), {
			restored: true,
			discardedGuest: null,
		});
		assert.deepEqual(getLearningData().regionGameScores.asia, [8]);
		assert.deepEqual(getLearningData().regionGameScores.europe, [7]);
		assert.equal(getLearningData().profile.name, "Alejandro");
		assert.equal(JSON.stringify(getSyncBase("user-a")), JSON.stringify(base));
		// Se repone una sola vez.
		assert.equal(restorePendingAccountData("user-a").restored, false);
	});

	test("otra cuenta no lo toma, y se conserva para la suya", () => {
		const base = sharedData();
		const pending = registerRegionGame(base, "asia", 8, T_B);

		savePendingAccountData("user-a", pending, base);

		assert.equal(restorePendingAccountData("user-b").restored, false);
		assert.equal(getSyncBase("user-b"), null);
		assert.equal(restorePendingAccountData("user-a").restored, true);
	});
});

describe("entra otra cuenta con los datos de una en este navegador (D227)", () => {
	test("lo local no pasa a la nueva: se aparta y vuelve con la suya", () => {
		const base = sharedData();
		const local = registerRegionGame(base, "asia", 8, T_B);

		saveLearningData(local);
		saveSyncBase("user-a", base);

		setAsideOtherAccountData("user-b");

		assert.deepEqual(getLearningData().regionGameScores, {});
		assert.equal(getSyncBase("user-a"), null);

		assert.equal(restorePendingAccountData("user-b").restored, false);
		assert.equal(restorePendingAccountData("user-a").restored, true);
		assert.deepEqual(getLearningData().regionGameScores.asia, [8]);
		assert.equal(JSON.stringify(getSyncBase("user-a")), JSON.stringify(base));
	});

	test("con la base de la misma cuenta, o sin base, no aparta nada", () => {
		const local = registerRegionGame(sharedData(), "asia", 8, T_B);

		saveLearningData(local);

		setAsideOtherAccountData("user-a");
		assert.deepEqual(getLearningData().regionGameScores.asia, [8]);

		saveSyncBase("user-a", local);

		setAsideOtherAccountData("user-a");
		assert.deepEqual(getLearningData().regionGameScores.asia, [8]);
		assert.equal(restorePendingAccountData("user-a").restored, false);
	});
});

describe("lo jugado como invitado tras el cierre involuntario (D214)", () => {
	test("se suma a lo apartado de la cuenta al volver a entrar", () => {
		const base = saveReviewResult(sharedData(), "fr", "good");
		const pending = registerRegionGame(base, "asia", 8, T_B);

		savePendingAccountData("user-a", pending, base);

		// El logout dejó los datos del invitado vacíos; juega jp y kr.
		let guest = createDefaultLearningData();
		guest = saveReviewResult(guest, "jp", "good");
		guest = saveReviewResult(guest, "kr", "again");

		assert.deepEqual(restorePendingAccountData("user-a"), {
			restored: true,
			discardedGuest: null,
		});

		const restored = getLearningData();

		assert.deepEqual(Object.keys(restored.countryHistory).sort(), [
			"fr",
			"jp",
			"kr",
		]);
		assert.deepEqual(restored.regionGameScores.asia, [8]);
		// Lo que el invitado no tocó no pisa lo de la cuenta.
		assert.equal(restored.profile.name, "Alejandro");
		assert.equal(restored.lastConfiguration?.mode, "practice");
		// La base sigue siendo la de la nube: lo del invitado sale como
		// pendiente de subir.
		assert.equal(JSON.stringify(getSyncBase("user-a")), JSON.stringify(base));
	});

	test("sin cambios pendientes de la cuenta, lo del invitado también vale", () => {
		const base = sharedData();

		savePendingAccountData("user-a", base, base);
		saveReviewResult(createDefaultLearningData(), "jp", "good");

		restorePendingAccountData("user-a");

		assert.ok(getLearningData().countryHistory.jp);
		assert.deepEqual(getLearningData().regionGameScores.europe, [7]);
	});

	test("si otra cuenta entró y salió entre medias, lo del invitado no se suma y se avisa", () => {
		const base = sharedData();

		savePendingAccountData("user-a", base, base);

		// Otra cuenta sale de este dispositivo: lo que venga ya no es de A.
		detachGuestFromPendingAccount();

		const guest = saveReviewResult(createDefaultLearningData(), "jp", "good");

		const result = restorePendingAccountData("user-a");

		assert.equal(result.restored, true);
		assert.equal(JSON.stringify(result.discardedGuest), JSON.stringify(guest));
		assert.equal(getLearningData().countryHistory.jp, undefined);
	});
});

describe("marca de cierre voluntario", () => {
	test("vale para un solo cierre", () => {
		assert.equal(consumeVoluntarySignOut(), false);

		markVoluntarySignOut(null);

		assert.equal(consumeVoluntarySignOut(), true);
		assert.equal(consumeVoluntarySignOut(), false);
	});
});

describe("cierre pedido con otras pestañas abiertas (D219, D224)", () => {
	const NOW = Date.parse("2026-10-22T10:00:00.000Z");
	const HOUR = 60 * 60 * 1000;

	/** `AuthEffects` ve abrirse una sesión (cerrando antes la que hubiera). */
	function openSession(userId: string, sessionId: string | null, at: number) {
		rememberSession(null, null, at);
		rememberSession(userId, sessionId, at);
	}

	/**
	 * Lo que hace la pestaña que NO pidió el cierre al ver el `SIGNED_OUT`
	 * (`AuthEffects` y luego `GameEffects`): aparta lo suyo, con
	 * `guestFollows` según la marca.
	 */
	function otherTabSeesSignOut(
		userId: string,
		data: UserLearningData,
		at: number,
	) {
		rememberSession(null, null, at);
		savePendingAccountData(
			userId,
			data,
			data,
			!wasSignOutRequestedElsewhere(userId, at),
		);
	}

	/** Esta pestaña ve el `SIGNED_OUT` y pregunta si se pidió en otra. */
	function endedElsewhere(at: number) {
		rememberSession(null, null, at);
		return wasSignOutRequestedElsewhere("user-a", at);
	}

	beforeEach(() => openSession("user-a", "s1", NOW - HOUR));

	test("la marca compartida se escribe antes del cierre, nombra la sesión y sobrevive a la de la pestaña", () => {
		markVoluntarySignOut("user-a", NOW);

		assert.deepEqual(getVoluntarySignOutMark(), {
			userId: "user-a",
			sessionId: "s1",
			at: NOW,
		});
		// La pestaña que cerró consume solo la suya; las otras aún la leen.
		assert.equal(consumeVoluntarySignOut(), true);
		assert.equal(endedElsewhere(NOW + 500), true);
	});

	test("la otra pestaña aparta sin sumar lo del invitado, aunque escriba después del detach", () => {
		const base = sharedData();

		// Pestaña 2 pide el cierre: marca y, al ver su `SIGNED_OUT`, detach.
		markVoluntarySignOut("user-a", NOW);
		consumeVoluntarySignOut();
		detachGuestFromPendingAccount();

		// Pestaña 1 ve el cierre como ajeno y aparta después (la carrera del QA).
		otherTabSeesSignOut("user-a", base, NOW + 200);

		// Se juega como invitado y se vuelve a entrar con la misma cuenta.
		const guest = saveReviewResult(createDefaultLearningData(), "ca", "good");
		const result = restorePendingAccountData("user-a");

		assert.equal(result.restored, true);
		assert.equal(JSON.stringify(result.discardedGuest), JSON.stringify(guest));
		assert.equal(getLearningData().countryHistory.ca, undefined);
	});

	test("si la otra pestaña aparta antes del detach, el resultado es el mismo", () => {
		const base = sharedData();

		markVoluntarySignOut("user-a", NOW);
		otherTabSeesSignOut("user-a", base, NOW + 50);
		consumeVoluntarySignOut();
		detachGuestFromPendingAccount();

		saveReviewResult(createDefaultLearningData(), "ca", "good");
		const result = restorePendingAccountData("user-a");

		assert.notEqual(result.discardedGuest, null);
		assert.equal(getLearningData().countryHistory.ca, undefined);
	});

	test("una pestaña congelada que procesa el cierre horas después tampoco suma lo del invitado", () => {
		const base = sharedData();

		markVoluntarySignOut("user-a", NOW);
		consumeVoluntarySignOut();
		detachGuestFromPendingAccount();

		otherTabSeesSignOut("user-a", base, NOW + 3 * HOUR);

		saveReviewResult(createDefaultLearningData(), "ca", "good");
		const result = restorePendingAccountData("user-a");

		assert.notEqual(result.discardedGuest, null);
		assert.equal(getLearningData().countryHistory.ca, undefined);
	});

	test("congelada mientras se vuelve a entrar: el SIGNED_OUT atrasado sigue siendo el pedido", () => {
		markVoluntarySignOut("user-a", NOW);
		consumeVoluntarySignOut();

		// La otra pestaña vuelve a entrar (sesión s2) y no borra la marca; la
		// congelada aún recuerda s1 y procesa su `SIGNED_OUT` al despertar.
		assert.equal(endedElsewhere(NOW + 2 * HOUR), true);
	});

	test("congelada: SIGNED_OUT y SIGNED_IN seguidos antes de que GameEffects aparte", () => {
		// Al despertar, `AuthEffects` procesa los dos eventos atrasados (el
		// cierre pedido en otra pestaña y la nueva entrada, sesión s2) antes
		// de que corra el efecto de `GameEffects` que aparta: la sesión que
		// cuenta es la que se cerró, no la que acaba de abrirse.
		markVoluntarySignOut("user-a", NOW);
		consumeVoluntarySignOut();

		rememberSession(null, null, NOW + 2 * HOUR);
		rememberSession("user-a", "s2", NOW + 2 * HOUR);

		assert.equal(
			wasSignOutRequestedElsewhere("user-a", NOW + 2 * HOUR + 10),
			true,
		);
	});

	test("un cierre involuntario de una sesión posterior no hereda la marca", () => {
		const base = sharedData();

		markVoluntarySignOut("user-a", NOW);
		consumeVoluntarySignOut();
		rememberSession(null, null, NOW + 100);

		// Se vuelve a entrar (otra sesión) y, días después, el token se rechaza.
		openSession("user-a", "s2", NOW + HOUR);
		otherTabSeesSignOut("user-a", base, NOW + 72 * HOUR);

		saveReviewResult(createDefaultLearningData(), "ca", "good");
		const result = restorePendingAccountData("user-a");

		assert.equal(result.discardedGuest, null);
		assert.ok(getLearningData().countryHistory.ca);
	});

	test("refrescar el token no cambia de sesión", () => {
		markVoluntarySignOut("user-a", NOW);
		rememberSession("user-a", "s1", NOW + 30_000);

		assert.equal(endedElsewhere(NOW + 60_000), true);
	});

	test("isVoluntarySignOutOf: misma sesión sí; otra sesión, otra cuenta o sin marca, no", () => {
		const mark = { userId: "user-a", sessionId: "s1", at: NOW };
		const ended = {
			userId: "user-a",
			sessionId: "s1",
			since: NOW - HOUR,
			open: false,
		};

		assert.equal(isVoluntarySignOutOf(mark, ended, "user-a", NOW), true);
		assert.equal(
			isVoluntarySignOutOf(mark, ended, "user-a", NOW + 24 * HOUR),
			true,
		);
		assert.equal(
			isVoluntarySignOutOf(mark, { ...ended, sessionId: "s2" }, "user-a", NOW),
			false,
		);
		assert.equal(isVoluntarySignOutOf(mark, ended, "user-b", NOW), false);
		assert.equal(
			isVoluntarySignOutOf(
				{ ...mark, userId: "user-b" },
				{ ...ended, userId: "user-b" },
				"user-a",
				NOW,
			),
			false,
		);
		assert.equal(isVoluntarySignOutOf(null, ended, "user-a", NOW), false);
		assert.equal(isVoluntarySignOutOf(mark, null, "user-a", NOW), false);
	});

	test("isVoluntarySignOutOf sin session_id: compara con el instante de la sesión", () => {
		const mark = { userId: "user-a", sessionId: null, at: NOW };
		const ended = {
			userId: "user-a",
			sessionId: null,
			since: NOW - HOUR,
			open: false,
		};

		assert.equal(
			isVoluntarySignOutOf(mark, ended, "user-a", NOW + 24 * HOUR),
			true,
		);
		// Sesión que empezó después de la marca: es otra, no la hereda.
		assert.equal(
			isVoluntarySignOutOf(
				mark,
				{ ...ended, since: NOW + 1 },
				"user-a",
				NOW + HOUR,
			),
			false,
		);
		// Marca del futuro (reloj cambiado): no cuenta.
		assert.equal(isVoluntarySignOutOf(mark, ended, "user-a", NOW - 1), false);
	});

	test("sin session_id, volver a entrar con la misma cuenta abre otra sesión", () => {
		openSession("user-a", null, NOW - HOUR);
		markVoluntarySignOut("user-a", NOW);
		rememberSession(null, null, NOW + 10);
		rememberSession("user-a", null, NOW + HOUR);

		assert.equal(endedElsewhere(NOW + 2 * HOUR), false);
	});

	test("una marca de antes de D224 (sin sessionId) se lee con sessionId null", () => {
		storage.setItem(
			"world-flags-voluntary-sign-out",
			JSON.stringify({ userId: "user-a", at: NOW }),
		);

		assert.deepEqual(getVoluntarySignOutMark(), {
			userId: "user-a",
			sessionId: null,
			at: NOW,
		});
		// La sesión empezó antes: cuenta por el instante.
		assert.equal(endedElsewhere(NOW + 1), true);
	});

	test("si signOut falla, la marca desaparece", () => {
		markVoluntarySignOut("user-a", NOW);
		cancelVoluntarySignOut();

		assert.equal(consumeVoluntarySignOut(), false);
		assert.equal(getVoluntarySignOutMark(), null);
		assert.equal(endedElsewhere(NOW + 1), false);
	});

	test("una marca corrupta se ignora", () => {
		storage.setItem("world-flags-voluntary-sign-out", "{no es json");

		assert.equal(getVoluntarySignOutMark(), null);
		assert.equal(endedElsewhere(NOW), false);
	});
});
