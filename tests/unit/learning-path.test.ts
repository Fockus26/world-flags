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
	getLearningPathStatus,
	mergeLearningPaths,
	normalizeLearningPaths,
	reconcileLearningPathKnown,
	registerLearningPathPass,
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

const neverPracticed = () => false;

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

		const status = getLearningPathStatus(path, {
			isPracticedToday: neverPracticed,
		});
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
		assert.equal(
			getLearningPathStatus(path, { isPracticedToday: neverPracticed })
				.isComplete,
			false,
		);
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
		assert.equal(
			getLearningPathStatus(old, { isPracticedToday: neverPracticed })
				.isComplete,
			true,
		);

		const path = reconcileLearningPathKnown(old, caribbean3());

		assert.deepEqual(path.knownCodes, []);
		assert.deepEqual(path.codes, makePath({ countries: caribbean }).codes);
		assert.equal(
			getLearningPathStatus(path, { isPracticedToday: neverPracticed })
				.isComplete,
			false,
		);
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

		let status = getLearningPathStatus(path, {
			isPracticedToday: neverPracticed,
			today: getLocalDateString(DAY_1),
		});
		assert.equal(status.currentBatchIndex, 0);
		assert.deepEqual(status.todayCodes, first);

		path = passAll(path, first, DAY_1);
		status = getLearningPathStatus(path, {
			isPracticedToday: neverPracticed,
			today: getLocalDateString(DAY_1),
		});
		// Acertados hoy: el mismo lote, nada más que hacer hasta mañana.
		assert.equal(status.currentBatchIndex, 0);
		assert.deepEqual(status.todayCodes, []);

		path = passAll(path, first, DAY_2);
		status = getLearningPathStatus(path, {
			isPracticedToday: neverPracticed,
			today: getLocalDateString(DAY_2),
		});
		assert.equal(status.currentBatchIndex, 1);
		assert.deepEqual(status.todayCodes, second);
	});

	test("lo practicado hoy (aunque se fallara) espera a mañana", () => {
		const path = makePath();
		const [first] = getLearningPathBatches(path);

		const status = getLearningPathStatus(path, {
			isPracticedToday: (code) => code === first[0],
		});

		assert.deepEqual(status.todayCodes, first.slice(1));
		assert.equal(status.pendingCodes.length, first.length);
	});

	test("con todo consolidado, el recorrido está completo", () => {
		let path = makePath();
		path = passAll(path, path.codes, DAY_1);
		path = passAll(path, path.codes, DAY_2);

		const status = getLearningPathStatus(path, {
			isPracticedToday: neverPracticed,
		});
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
