/**
 * Aprender por lotes (D185): lotes en orden, consolidar = acierto a la
 * primera en dos días distintos, y la fusión entre dispositivos.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { countries } from "@/data/countries";
import type { Country } from "@/types/country";
import type { CountriesLearningHistory, LearningPath } from "@/types/progress";
import { getLocalDateString } from "@/utils/date";
import { toLearningDataRow } from "@/utils/learning-data-row";
import {
	createLearningPath,
	getLearningPathBatches,
	getLearningPathStatus,
	mergeLearningPaths,
	normalizeLearningPaths,
	registerLearningPathPass,
} from "@/utils/learning-path";
import {
	createDefaultLearningData,
	mergeLearningData,
	normalizeLearningData,
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

const neverPracticed = () => false;

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

	test("lo que ya se sabía (2+ repeticiones) no entra en los lotes, pero cuenta", () => {
		const known = oceania[0].code;
		const history: CountriesLearningHistory = {
			[known]: {
				review: {
					dueDate: "2026-09-10",
					intervalDays: 6,
					easeFactor: 2.5,
					repetitions: 2,
					lastReviewedAt: DAY_1.toISOString(),
				},
			},
		};
		const path = makePath({ countryHistory: history });

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
