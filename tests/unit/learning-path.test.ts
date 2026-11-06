/**
 * Aprender por lotes (D185): lotes en orden, consolidar = acierto a la
 * primera en dos días distintos, y la fusión entre dispositivos. Ya sabido =
 * continente en 10/10 + SM2 con 2+ repeticiones, y su recalculo (D189).
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { countries } from "@/data/countries";
import type { Country } from "@/types/country";
import type {
	CountriesLearningHistory,
	LearningPath,
	RegionGameScores,
} from "@/types/progress";
import { getLocalDateString } from "@/utils/date";
import { toLearningDataRow } from "@/utils/learning-data-row";
import {
	createLearningPath,
	getLearningPathBatches,
	getLearningPathReservedCodes,
	getLearningPathStatus,
	isLearningPathCountryConsolidated,
	learningPathSessionCountsTowardLimit,
	meetsLearningPathConsolidation,
	mergeLearningPaths,
	normalizeLearningPaths,
	reconcileLearningPathKnown,
	registerLearningPathPass,
	registerLearningPathSession,
} from "@/utils/learning-path";
import {
	createDefaultLearningData,
	mergeLearningData,
	normalizeLearningData,
	reconcileLearningPath,
	registerLearningPathAttempt,
	saveLearningPath,
} from "@/utils/learning-storage";

Object.assign(globalThis, {
	window: {
		localStorage: {
			getItem: () => null,
			setItem: () => {},
			removeItem: () => {},
		},
	},
});

const DAY_1 = new Date(2026, 8, 1, 10);
const DAY_1_LATER = new Date(2026, 8, 1, 20);
const DAY_2 = new Date(2026, 8, 2, 10);

const oceania: Country[] = countries.filter(
	(country) => country.region === "oceania",
);

const caribbean: Country[] = countries.filter(
	(country) => country.region === "caribbean",
);

/** Historial SM2 con `repetitions` en cada país de `list`. */
function historyWith(
	list: readonly Country[],
	repetitions: number,
): CountriesLearningHistory {
	return Object.fromEntries(
		list.map((country) => [
			country.code,
			{
				review: {
					dueDate: "2026-09-10",
					intervalDays: 6,
					easeFactor: 2.5,
					repetitions,
					lastReviewedAt: DAY_1.toISOString(),
				},
			},
		]),
	);
}

const PERFECT: number[] = [10, 10, 10];

function makePath(
	overrides: Partial<Parameters<typeof createLearningPath>[0]> = {},
): LearningPath {
	return createLearningPath({
		id: "path-1",
		countries: oceania,
		scopeLabel: "Oceanía",
		order: "region",
		batchSize: 5,
		countryHistory: {},
		regionGameScores: {},
		now: DAY_1,
		...overrides,
	});
}

function passAll(path: LearningPath, codes: string[], now: Date) {
	return codes.reduce(
		(current, code) => registerLearningPathPass(current, code, now),
		path,
	);
}

describe("createLearningPath", () => {
	test("reparte el alcance en lotes del tamaño elegido, en orden alfabético", () => {
		const path = makePath();
		const batches = getLearningPathBatches(path);

		assert.equal(path.codes.length, oceania.length);
		assert.equal(batches.length, Math.ceil(oceania.length / 5));
		assert.ok(batches.slice(0, -1).every((batch) => batch.length === 5));

		const names = path.codes.map(
			(code) => oceania.find((country) => country.code === code)?.name ?? "",
		);
		const sorted = [...names].sort(new Intl.Collator("es").compare);
		assert.deepEqual(names, sorted);
	});

	test("lo que ya se sabía (10/10 y 2+ repeticiones) no entra en los lotes, pero cuenta", () => {
		const known = oceania[0].code;
		const path = makePath({
			countryHistory: historyWith([oceania[0]], 2),
			regionGameScores: { oceania: PERFECT },
		});

		assert.deepEqual(path.knownCodes, [known]);
		assert.ok(!path.codes.includes(known));

		const status = getLearningPathStatus(path);
		assert.equal(status.totalCountries, oceania.length);
		assert.equal(status.consolidatedCount, 1);
	});

	test("al azar conserva todos los países del alcance", () => {
		const path = makePath({ order: "random" });

		assert.deepEqual(
			[...path.codes].sort(),
			oceania.map((country) => country.code).sort(),
		);
	});
});

describe("ya sabido (D189)", () => {
	test("Caribe con 3/10: aunque tenga 2+ repeticiones, todo va a los lotes", () => {
		const path = makePath({
			countries: caribbean,
			countryHistory: historyWith(caribbean, 3),
			regionGameScores: { caribbean: [3] },
		});

		assert.deepEqual(path.knownCodes, []);
		assert.equal(path.codes.length, caribbean.length);
		assert.equal(getLearningPathStatus(path).isComplete, false);
	});

	test("continente en 10/10 y 2+ repeticiones: ya sabido", () => {
		const path = makePath({
			countries: caribbean,
			countryHistory: historyWith(caribbean, 2),
			regionGameScores: { caribbean: PERFECT },
		});

		assert.equal(path.knownCodes.length, caribbean.length);
		assert.deepEqual(path.codes, []);
	});

	test("10/10 con una sola repetición: a los lotes", () => {
		const path = makePath({
			countries: caribbean,
			countryHistory: historyWith(caribbean, 1),
			regionGameScores: { caribbean: PERFECT },
		});

		assert.deepEqual(path.knownCodes, []);
	});

	test("sin nota del continente: a los lotes", () => {
		const path = makePath({
			countries: caribbean,
			countryHistory: historyWith(caribbean, 5),
		});

		assert.deepEqual(path.knownCodes, []);
	});

	test("una media por debajo de 10 no basta", () => {
		const path = makePath({
			countries: caribbean,
			countryHistory: historyWith(caribbean, 5),
			regionGameScores: { caribbean: [10, 10, 9] },
		});

		assert.deepEqual(path.knownCodes, []);
	});

	test("alcance mixto: cada país mira la nota de su continente", () => {
		const scope = [...oceania, ...caribbean];
		const path = makePath({
			countries: scope,
			countryHistory: historyWith(scope, 2),
			regionGameScores: { oceania: PERFECT, caribbean: [3, 10, 10] },
		});

		assert.deepEqual(
			[...path.knownCodes].sort(),
			oceania.map((country) => country.code).sort(),
		);
		assert.deepEqual(
			[...path.codes].sort(),
			caribbean.map((country) => country.code).sort(),
		);
	});
});

describe("reconcileLearningPathKnown", () => {
	/** Un recorrido que salió completo: todo el Caribe ya sabido. */
	function oldCompletePath(order: "region" | "random" = "region") {
		return makePath({
			countries: caribbean,
			order,
			countryHistory: historyWith(caribbean, 2),
			regionGameScores: { caribbean: PERFECT },
		});
	}

	const caribbean3 = () => ({
		countryHistory: historyWith(caribbean, 2),
		regionGameScores: { caribbean: [3] } satisfies RegionGameScores,
	});

	test("un recorrido viejo completo se reabre, en orden por continente y nombre", () => {
		const old = oldCompletePath();
		assert.equal(getLearningPathStatus(old).isComplete, true);

		const path = reconcileLearningPathKnown(old, caribbean3());

		assert.deepEqual(path.knownCodes, []);
		assert.deepEqual(path.codes, makePath({ countries: caribbean }).codes);
		assert.equal(getLearningPathStatus(path).isComplete, false);
	});

	test("es idempotente y sin cambios devuelve el mismo objeto", () => {
		const once = reconcileLearningPathKnown(oldCompletePath(), caribbean3());

		assert.equal(reconcileLearningPathKnown(once, caribbean3()), once);

		const fine = oldCompletePath();
		assert.equal(
			reconcileLearningPathKnown(fine, {
				countryHistory: historyWith(caribbean, 2),
				regionGameScores: { caribbean: PERFECT },
			}),
			fine,
		);
	});

	test("no promueve: lo que está en los lotes se queda aunque llegue a 10/10", () => {
		const path = makePath({ countries: caribbean });

		assert.equal(
			reconcileLearningPathKnown(path, {
				countryHistory: historyWith(caribbean, 4),
				regionGameScores: { caribbean: PERFECT },
			}),
			path,
		);
	});

	test("por continente, los degradados se intercalan; al azar, van al final", () => {
		const scope = [...oceania, ...caribbean];
		const criteria = {
			countryHistory: historyWith(caribbean, 2),
			regionGameScores: { caribbean: PERFECT },
		};

		const byRegion = makePath({ countries: scope, ...criteria });
		const reopened = reconcileLearningPathKnown(byRegion, caribbean3());
		assert.deepEqual(reopened.codes, makePath({ countries: scope }).codes);

		const random = makePath({ countries: scope, order: "random", ...criteria });
		const reopenedRandom = reconcileLearningPathKnown(random, caribbean3());
		assert.deepEqual(reopenedRandom.codes, [
			...random.codes,
			...random.knownCodes,
		]);
	});

	test("conserva el progreso de un país degradado", () => {
		const old = oldCompletePath();
		const code = old.knownCodes[0];
		const withProgress: LearningPath = {
			...old,
			progress: {
				[code]: { passDays: [getLocalDateString(DAY_1)], consolidatedAt: null },
			},
		};

		const path = reconcileLearningPathKnown(withProgress, caribbean3());
		assert.deepEqual(path.progress, withProgress.progress);
	});

	test("lo que el catálogo no conoce se queda como estaba", () => {
		const old = oldCompletePath();
		const withUnknown: LearningPath = {
			...old,
			knownCodes: ["zz", ...old.knownCodes],
		};

		assert.deepEqual(
			reconcileLearningPathKnown(withUnknown, caribbean3()).knownCodes,
			["zz"],
		);
	});
});

describe("consolidar", () => {
	test("dos aciertos el mismo día no consolidan; uno al día siguiente sí", () => {
		const code = makePath().codes[0];
		let path = registerLearningPathPass(makePath(), code, DAY_1);
		path = registerLearningPathPass(path, code, DAY_1_LATER);

		assert.deepEqual(path.progress[code].passDays, [getLocalDateString(DAY_1)]);
		assert.equal(path.progress[code].consolidatedAt, null);

		path = registerLearningPathPass(path, code, DAY_2);
		assert.equal(path.progress[code].consolidatedAt, DAY_2.toISOString());
	});

	test("un país fuera del recorrido no cambia nada", () => {
		const path = makePath();

		assert.equal(registerLearningPathPass(path, "fr", DAY_1), path);
	});
});

describe("getLearningPathStatus", () => {
	test("el lote siguiente se abre cuando el anterior está entero consolidado", () => {
		let path = makePath();
		const [first, second] = getLearningPathBatches(path);

		let status = getLearningPathStatus(path, { now: DAY_1 });
		assert.equal(status.currentBatchIndex, 0);
		assert.deepEqual(status.todayCodes, first);

		path = passAll(path, first, DAY_1);
		status = getLearningPathStatus(path, { now: DAY_1 });
		// Acertados hace nada: el mismo lote, nada que hacer durante 4 h.
		assert.equal(status.currentBatchIndex, 0);
		assert.deepEqual(status.todayCodes, []);

		path = passAll(path, first, DAY_2);
		status = getLearningPathStatus(path, { now: DAY_2 });
		assert.equal(status.currentBatchIndex, 1);
		assert.deepEqual(status.todayCodes, second);
	});

	test("lo de otros modos ya no bloquea; un acierto de hace menos de 4 h sí (D235)", () => {
		let path = makePath();
		const [first] = getLearningPathBatches(path);
		path = registerLearningPathPass(path, first[0], DAY_1);

		const soon = getLearningPathStatus(path, {
			now: new Date(DAY_1.getTime() + 3 * 3_600_000),
		});
		assert.deepEqual(soon.todayCodes, first.slice(1));
		assert.equal(soon.pendingCodes.length, first.length);

		const later = getLearningPathStatus(path, {
			now: new Date(DAY_1.getTime() + 4 * 3_600_000),
		});
		assert.deepEqual(later.todayCodes, first);
	});

	test("con todo consolidado, el recorrido está completo", () => {
		let path = makePath();
		path = passAll(path, path.codes, DAY_1);
		path = passAll(path, path.codes, DAY_2);

		const status = getLearningPathStatus(path, { now: DAY_2 });
		assert.equal(status.isComplete, true);
		assert.equal(status.currentBatchIndex, null);
		assert.equal(status.consolidatedCount, oceania.length);
	});
});

describe("mergeLearningPaths", () => {
	test("el mismo recorrido suma los días de acierto de cada dispositivo", () => {
		const code = makePath().codes[0];
		const remote = {
			flags: {
				path: registerLearningPathPass(makePath(), code, DAY_1),
				updatedAt: DAY_1.toISOString(),
			},
		};
		const local = {
			flags: {
				path: registerLearningPathPass(makePath(), code, DAY_2),
				updatedAt: DAY_1.toISOString(),
			},
		};

		const merged = mergeLearningPaths(remote, local).flags?.path;
		assert.deepEqual(merged?.progress[code].passDays, [
			getLocalDateString(DAY_1),
			getLocalDateString(DAY_2),
		]);
		assert.notEqual(merged?.progress[code].consolidatedAt, null);
	});

	test("recorridos distintos: gana el último creado o abandonado", () => {
		const remote = {
			flags: { path: makePath(), updatedAt: DAY_1.toISOString() },
		};
		const local = { flags: { path: null, updatedAt: DAY_2.toISOString() } };

		assert.equal(mergeLearningPaths(remote, local).flags?.path, null);
		assert.equal(mergeLearningPaths(local, remote).flags?.path, null);
	});

	test("es idempotente", () => {
		const remote = {
			flags: {
				path: registerLearningPathPass(makePath(), makePath().codes[1], DAY_1),
				updatedAt: DAY_1.toISOString(),
			},
		};
		const local = {
			flags: {
				path: registerLearningPathPass(makePath(), makePath().codes[2], DAY_2),
				updatedAt: DAY_1.toISOString(),
			},
		};
		const once = mergeLearningPaths(remote, local);

		assert.deepEqual(mergeLearningPaths(once, local), once);
	});

	test("ya sabidos distintos: gana la intersección y converge", () => {
		const scope = [...oceania, ...caribbean];
		const old = makePath({
			countries: scope,
			countryHistory: historyWith(scope, 2),
			regionGameScores: { oceania: PERFECT, caribbean: PERFECT },
		});
		const recalculated = reconcileLearningPathKnown(old, {
			countryHistory: historyWith(scope, 2),
			regionGameScores: { oceania: PERFECT, caribbean: [3] },
		});
		const slot = (path: LearningPath) => ({
			flags: { path, updatedAt: DAY_1.toISOString() },
		});

		// Un dispositivo ya recalculó; el otro sigue con los ya sabidos viejos.
		const pulled = mergeLearningPaths(slot(old), slot(recalculated));
		const pushed = mergeLearningPaths(slot(recalculated), slot(old));

		assert.deepEqual(pulled.flags?.path, recalculated);
		assert.deepEqual(JSON.stringify(pulled), JSON.stringify(pushed));
		assert.deepEqual(mergeLearningPaths(pulled, slot(old)), pulled);
	});
});

describe("almacenamiento y sincronización", () => {
	test("normaliza datos viejos (sin la columna) a sin recorridos", () => {
		assert.deepEqual(normalizeLearningData({}).learningPaths, {});
		assert.deepEqual(normalizeLearningPaths({}), {});
		assert.deepEqual(normalizeLearningPaths({ flags: { path: 3 } }), {});
	});

	test("un recorrido sobrevive a normalizar lo guardado", () => {
		const data = saveLearningPath(
			createDefaultLearningData(),
			"capitals",
			makePath(),
			DAY_1,
		);

		assert.deepEqual(
			normalizeLearningData(structuredClone(data)).learningPaths,
			data.learningPaths,
		);
	});

	test("un acierto cuenta solo en el recorrido de su juego", () => {
		const path = makePath();
		const data = saveLearningPath(
			createDefaultLearningData(),
			"capitals",
			path,
			DAY_1,
		);

		assert.equal(
			registerLearningPathAttempt(data, "flags", path.codes[0], DAY_1),
			data,
		);

		const updated = registerLearningPathAttempt(
			data,
			"capitals",
			path.codes[0],
			DAY_1,
		);
		assert.deepEqual(
			updated.learningPaths.capitals?.path?.progress[path.codes[0]].passDays,
			[getLocalDateString(DAY_1)],
		);
	});

	test("guardar el recalculo no cambia updatedAt y un acierto ya cuenta", () => {
		const old = makePath({
			countries: caribbean,
			countryHistory: historyWith(caribbean, 2),
			regionGameScores: { caribbean: PERFECT },
		});
		const data = {
			...saveLearningPath(createDefaultLearningData(), "flags", old, DAY_1),
			countryHistory: historyWith(caribbean, 2),
			regionGameScores: { caribbean: [3] },
		};

		const reconciled = reconcileLearningPath(data, "flags");
		assert.equal(
			reconciled.learningPaths.flags?.updatedAt,
			DAY_1.toISOString(),
		);
		assert.deepEqual(reconciled.learningPaths.flags?.path?.knownCodes, []);
		assert.equal(reconcileLearningPath(reconciled, "flags"), reconciled);

		const code = caribbean[0].code;
		const passed = registerLearningPathAttempt(data, "flags", code, DAY_2);
		assert.deepEqual(
			passed.learningPaths.flags?.path?.progress[code].passDays,
			[getLocalDateString(DAY_2)],
		);
	});

	test("mergeLearningData fusiona los recorridos y la fila los sube", () => {
		const path = makePath();
		const base = saveLearningPath(
			createDefaultLearningData(),
			"flags",
			path,
			DAY_1,
		);
		const remote = registerLearningPathAttempt(
			base,
			"flags",
			path.codes[0],
			DAY_1,
		);
		const local = registerLearningPathAttempt(
			base,
			"flags",
			path.codes[0],
			DAY_2,
		);

		const merged = mergeLearningData(remote, local, base);
		assert.equal(
			merged.learningPaths.flags?.path?.progress[path.codes[0]].passDays.length,
			2,
		);
		assert.deepEqual(
			toLearningDataRow(merged).learning_paths,
			merged.learningPaths,
		);
	});
});

const HOUR = 3_600_000;
const at = (base: Date, hours: number) =>
	new Date(base.getTime() + hours * HOUR);

describe("consolidar en el mismo día (D235)", () => {
	test("tres aciertos el mismo día separados 4 h consolidan", () => {
		const code = makePath().codes[0];
		const morning = new Date(2026, 8, 1, 8);
		let path = registerLearningPathPass(makePath(), code, morning);
		path = registerLearningPathPass(path, code, at(morning, 4));
		assert.equal(isLearningPathCountryConsolidated(path, code), false);

		path = registerLearningPathPass(path, code, at(morning, 8));
		assert.equal(isLearningPathCountryConsolidated(path, code), true);
		assert.equal(path.progress[code].passDays.length, 1);
		assert.equal(path.progress[code].passes?.length, 3);
	});

	test("un acierto a menos de 4 h del anterior no suma", () => {
		const code = makePath().codes[0];
		const morning = new Date(2026, 8, 1, 8);
		const path = registerLearningPathPass(makePath(), code, morning);

		assert.equal(registerLearningPathPass(path, code, at(morning, 3.9)), path);
	});

	test("dos días distintos siguen consolidando, como antes", () => {
		const code = makePath().codes[0];
		let path = registerLearningPathPass(makePath(), code, DAY_1);
		path = registerLearningPathPass(path, code, DAY_2);

		assert.equal(isLearningPathCountryConsolidated(path, code), true);
	});

	test("la regla: días distintos o tres separados en un mismo día", () => {
		const day = (hour: number) => new Date(2026, 8, 1, hour).toISOString();

		assert.equal(
			meetsLearningPathConsolidation(["2026-09-01", "2026-09-02"]),
			true,
		);
		assert.equal(
			meetsLearningPathConsolidation(
				["2026-09-01"],
				[day(8), day(12), day(16)],
			),
			true,
		);
		// Tres, pero dos demasiado juntos.
		assert.equal(
			meetsLearningPathConsolidation(
				["2026-09-01"],
				[day(8), day(10), day(16)],
			),
			false,
		);
	});

	test("un día de acierto de hoy sin hora (registro viejo) bloquea hoy", () => {
		const path = makePath();
		const code = path.codes[0];
		const legacy: LearningPath = {
			...path,
			progress: {
				[code]: { passDays: [getLocalDateString(DAY_1)], consolidatedAt: null },
			},
		};

		assert.equal(registerLearningPathPass(legacy, code, DAY_1_LATER), legacy);
		const next = registerLearningPathPass(legacy, code, DAY_2);
		assert.equal(isLearningPathCountryConsolidated(next, code), true);
	});
});

describe("sesiones al día (D235)", () => {
	test("tras la sesión del día solo queda «otra sesión», hasta tres", () => {
		let path = makePath();
		const first = getLearningPathBatches(path)[0];

		let status = getLearningPathStatus(path, { now: DAY_1 });
		assert.equal(status.canStartSession, true);
		assert.equal(status.canStartExtraSession, false);

		// Primera sesión: falla todo (sin aciertos). Queda trabajo, pero ya
		// solo como sesión extra.
		path = registerLearningPathSession(path, DAY_1);
		status = getLearningPathStatus(path, { now: at(DAY_1, 1) });
		assert.equal(status.sessionsToday, 1);
		assert.equal(status.canStartSession, false);
		assert.equal(status.canStartExtraSession, true);
		assert.deepEqual(status.todayCodes, first);

		path = registerLearningPathSession(path, at(DAY_1, 1));
		path = registerLearningPathSession(path, at(DAY_1, 2));
		status = getLearningPathStatus(path, { now: at(DAY_1, 3) });
		assert.equal(status.sessionsToday, 3);
		assert.equal(status.canStartExtraSession, false);

		// Al día siguiente vuelve la sesión normal.
		status = getLearningPathStatus(path, { now: DAY_2 });
		assert.equal(status.sessionsToday, 0);
		assert.equal(status.canStartSession, true);
	});
});

describe("países reservados para la diaria (D235)", () => {
	test("el lote en curso y los futuros sin consolidar; nada sin recorrido", () => {
		let path = makePath();
		const [first, ...rest] = getLearningPathBatches(path);
		path = passAll(path, [first[0]], DAY_1);
		path = passAll(path, [first[0]], DAY_2);

		const reserved = getLearningPathReservedCodes(path);
		assert.equal(reserved.has(first[0]), false);
		assert.equal(reserved.has(first[1]), true);
		assert.equal(reserved.has(rest.flat()[0]), true);
		assert.equal(getLearningPathReservedCodes(null).size, 0);
	});
});

describe("fusión de aciertos con hora y sesiones (D235)", () => {
	test("dos aciertos en un dispositivo y uno en otro, separados 4 h, consolidan", () => {
		const code = makePath().codes[0];
		const morning = new Date(2026, 8, 1, 8);
		let a = registerLearningPathPass(makePath(), code, morning);
		a = registerLearningPathPass(a, code, at(morning, 4));
		const b = registerLearningPathPass(makePath(), code, at(morning, 8));

		const merged = mergeLearningPaths(
			{ flags: { path: a, updatedAt: DAY_1.toISOString() } },
			{ flags: { path: b, updatedAt: DAY_1.toISOString() } },
		).flags?.path;

		assert.ok(merged);
		assert.equal(merged.progress[code].passes?.length, 3);
		assert.equal(isLearningPathCountryConsolidated(merged, code), true);
	});

	test("las sesiones de los dos lados se unen sin repetir", () => {
		const a = registerLearningPathSession(makePath(), DAY_1);
		const b = registerLearningPathSession(
			registerLearningPathSession(makePath(), DAY_1),
			at(DAY_1, 5),
		);

		const merged = mergeLearningPaths(
			{ flags: { path: a, updatedAt: DAY_1.toISOString() } },
			{ flags: { path: b, updatedAt: DAY_1.toISOString() } },
		).flags?.path;

		assert.equal(merged?.sessions?.length, 2);
	});

	test("un lado sin horas (cliente viejo) no borra las del otro", () => {
		const code = makePath().codes[0];
		const withPasses = registerLearningPathPass(makePath(), code, DAY_1);
		const legacy: LearningPath = {
			...makePath(),
			progress: {
				[code]: { passDays: [getLocalDateString(DAY_1)], consolidatedAt: null },
			},
		};

		const merged = mergeLearningPaths(
			{ flags: { path: legacy, updatedAt: DAY_1.toISOString() } },
			{ flags: { path: withPasses, updatedAt: DAY_1.toISOString() } },
		).flags?.path;

		assert.equal(merged?.progress[code].passes?.length, 1);
	});

	test("normalizar conserva horas y sesiones, y acepta registros sin ellas", () => {
		const code = makePath().codes[0];
		const path = registerLearningPathSession(
			registerLearningPathPass(makePath(), code, DAY_1),
			DAY_1,
		);
		const normalized = normalizeLearningPaths(
			JSON.parse(
				JSON.stringify({ flags: { path, updatedAt: DAY_1.toISOString() } }),
			),
		).flags?.path;

		assert.deepEqual(
			normalized?.progress[code].passes,
			path.progress[code].passes,
		);
		assert.deepEqual(normalized?.sessions, path.sessions);

		const old = normalizeLearningPaths({
			flags: {
				path: {
					...makePath(),
					progress: {
						[code]: { passDays: ["2026-09-01"], consolidatedAt: null },
					},
				},
				updatedAt: DAY_1.toISOString(),
			},
		}).flags?.path;
		assert.equal(old?.progress[code].passes, undefined);
		assert.equal(old?.sessions, undefined);
	});
});

describe("fechas de un reloj adelantado (QA de D235)", () => {
	const FUTURE = new Date(2027, 10, 6, 8);

	test("un acierto de dentro de un año no bloquea el lote hoy", () => {
		const path = makePath();
		const first = getLearningPathBatches(path)[0];
		const ahead = passAll(path, first, FUTURE);

		const status = getLearningPathStatus(ahead, { now: DAY_2 });
		assert.deepEqual(status.todayCodes, first);
		assert.equal(status.canStartSession, true);
	});

	test("sesiones del futuro no cuentan ni desplazan la de hoy", () => {
		let path = makePath();
		for (let i = 0; i < 6; i++) {
			path = registerLearningPathSession(path, at(FUTURE, i));
		}
		path = registerLearningPathSession(path, DAY_1);

		assert.equal(path.sessions?.includes(DAY_1.toISOString()), true);
		assert.equal(getLearningPathStatus(path, { now: DAY_1 }).sessionsToday, 1);
	});

	test("la fusión descarta lo que viene del futuro", () => {
		const code = makePath().codes[0];
		const ahead = registerLearningPathPass(makePath(), code, FUTURE);
		const merged = mergeLearningPaths(
			{ flags: { path: ahead, updatedAt: DAY_1.toISOString() } },
			{ flags: { path: makePath(), updatedAt: DAY_1.toISOString() } },
			DAY_1,
		).flags?.path;

		assert.equal(merged?.progress[code].passes, undefined);
	});

	test("un acierto de hace 1 min «del futuro» (hora del panel atrasada) sí es reciente", () => {
		const code = makePath().codes[0];
		const path = registerLearningPathPass(makePath(), code, at(DAY_1, 1 / 60));

		assert.equal(
			getLearningPathStatus(path, { now: DAY_1 }).todayCodes.includes(code),
			false,
		);
	});
});

describe("«vuelve en unas horas» o «mañana» (QA de D235)", () => {
	test("de madrugada, sin sesión hoy y con aciertos de hace menos de 4 h: en unas horas", () => {
		const night = new Date(2026, 8, 1, 23);
		const path = registerLearningPathSession(
			passAll(makePath(), getLearningPathBatches(makePath())[0], night),
			night,
		);
		const status = getLearningPathStatus(path, { now: at(night, 2) });

		assert.equal(status.sessionsToday, 0);
		assert.equal(status.canStartSession, false);
		assert.equal(status.canComeBackLater, true);
	});

	test("tras la tercera sesión del día: mañana", () => {
		let path = passAll(
			makePath(),
			getLearningPathBatches(makePath())[0],
			DAY_1,
		);
		for (const hours of [0, 1, 2]) {
			path = registerLearningPathSession(path, at(DAY_1, hours));
		}
		const status = getLearningPathStatus(path, { now: at(DAY_1, 3) });

		assert.equal(status.canComeBackLater, false);
	});
});

describe("repetir los fallados no gasta una de las tres (D235)", () => {
	test("la primera del día cuenta siempre", () => {
		const path = makePath();
		const first = getLearningPathBatches(path)[0];

		assert.equal(
			learningPathSessionCountsTowardLimit(path, first, DAY_1),
			true,
		);
	});

	test("después, solo con los fallados de hoy, no cuenta", () => {
		const path = makePath();
		const [hit, ...missed] = getLearningPathBatches(path)[0];
		const afterFirst = registerLearningPathSession(
			registerLearningPathPass(path, hit, DAY_1),
			DAY_1,
		);

		assert.equal(
			learningPathSessionCountsTowardLimit(afterFirst, missed, at(DAY_1, 0.2)),
			false,
		);
		// A las 4 h vuelve el acertado: va a por su 2.º acierto y cuenta.
		assert.equal(
			learningPathSessionCountsTowardLimit(
				afterFirst,
				[hit, ...missed],
				at(DAY_1, 4),
			),
			true,
		);
	});
});
