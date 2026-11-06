/**
 * Dos pestañas del mismo navegador (D236): lo que guarda una entra en la otra
 * con `adoptOtherTabLearningData` antes de que vuelva a escribir, en vez de
 * pisarse. Hallazgo del QA funcional de D235 (repro 23): dos sesiones del lote,
 * una en cada pestaña, contaban 1 y se perdían los aciertos de la primera.
 *
 * Un solo proceso hace de "esta pestaña" (el estado del módulo, lo último que
 * leyó o escribió); la otra pestaña es una escritura directa en `localStorage`.
 */
import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";

import type { LearningPath, UserLearningData } from "@/types/progress";
import {
	adoptOtherTabLearningData,
	createDefaultLearningData,
	createSessionRecord,
	fromGameView,
	getLearningData,
	isFromOtherTab,
	registerLearningPathAttempt,
	registerLearningPathSessionDone,
	registerSessionOutcome,
	saveLearningData,
	saveLearningPath,
	saveReviewResult,
	saveSyncBase,
	saveUserProfile,
	toGameView,
} from "@/utils/learning-storage";

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

const KEY = "world-flags-learning-data";
const storage = new MemoryStorage();

Object.assign(globalThis, { window: { localStorage: storage } });

beforeEach(() => storage.clear());

const DAY = new Date("2026-09-10T08:00:00.000Z");
const minutes = (n: number) => new Date(DAY.getTime() + n * 60_000);

function session(finishedAt: Date, correct: number) {
	return createSessionRecord({
		finishedAt: finishedAt.toISOString(),
		mode: "practice",
		gameType: "flags",
		scopeKey: "oceania",
		scopeLabel: "Oceanía",
		totalCountries: 5,
		correctAnswers: correct,
		skippedAnswers: 0,
		score: 8,
		elapsedMs: 60_000,
	});
}

const PATH: LearningPath = {
	id: "path-1",
	createdAt: DAY.toISOString(),
	scopeLabel: "Oceanía",
	order: "region",
	batchSize: 5,
	codes: ["au", "nz", "fj", "pg", "ws", "to"],
	knownCodes: [],
	progress: {},
};

/** Lo que las dos pestañas tienen al abrirse: el mismo lote recién creado. */
function shared(): UserLearningData {
	return saveLearningPath(createDefaultLearningData(), "flags", PATH, DAY);
}

/** Una sesión del lote en una pestaña: aciertos, repasos SM2 y el registro. */
function playBatchSession(
	data: UserLearningData,
	codes: string[],
	at: Date,
): UserLearningData {
	let next = data;
	for (const code of codes) {
		next = saveReviewResult(next, code, "good");
		next = registerLearningPathAttempt(next, "flags", code, at);
	}
	next = registerSessionOutcome(next, session(at, codes.length));
	return registerLearningPathSessionDone(next, "flags", at);
}

/** Esta pestaña guarda `data` (lo último que conoce). */
function thisTabHas(data: UserLearningData): UserLearningData {
	saveLearningData(data);
	return data;
}

/** La otra pestaña escribe `data` encima, sin pasar por este módulo. */
function otherTabWrites(data: UserLearningData): string {
	const raw = JSON.stringify(data);
	storage.setItem(KEY, raw);
	return raw;
}

describe("adoptOtherTabLearningData (D236)", () => {
	test("la sesión de la otra pestaña entra en esta y la siguiente suma, no pisa", () => {
		const start = shared();
		const otherTab = playBatchSession(start, ["au", "nz"], minutes(10));
		const thisTab = thisTabHas(start);

		const adopted = adoptOtherTabLearningData(
			otherTabWrites(otherTab),
			thisTab,
			null,
		);

		assert.ok(adopted, "hay cambios que adoptar");
		assert.ok(isFromOtherTab(adopted), "marcado como llegado de otra pestaña");
		assert.equal(adopted.learningPaths.flags?.path?.sessions?.length, 1);
		assert.ok(adopted.countryHistory.au?.review, "repaso SM2 de la otra");
		assert.equal(adopted.sessionHistory.length, 1);
		// Nada que añadir: no se vuelve a escribir (las pestañas no se contestan).
		assert.equal(storage.getItem(KEY), JSON.stringify(otherTab));

		// Esta pestaña juega su sesión sobre lo adoptado.
		const final = playBatchSession(adopted, ["fj", "pg"], minutes(20));
		const stored = getLearningData();

		assert.equal(stored.learningPaths.flags?.path?.sessions?.length, 2);
		assert.equal(stored.sessionHistory.length, 2);
		assert.equal(stored.stats.totalSessions, 2);
		for (const code of ["au", "nz", "fj", "pg"]) {
			assert.ok(stored.countryHistory[code]?.review, `repaso de ${code}`);
			assert.equal(
				final.learningPaths.flags?.path?.progress[code]?.passes?.length,
				1,
				`acierto de ${code}`,
			);
		}
	});

	test("si las dos escriben casi a la vez, se guarda la unión", () => {
		const start = shared();
		const otherTab = playBatchSession(start, ["au", "nz"], minutes(10));
		// Esta pestaña ya guardó su sesión antes de enterarse de la otra.
		const thisTab = thisTabHas(
			playBatchSession(start, ["fj", "pg"], minutes(11)),
		);

		const adopted = adoptOtherTabLearningData(
			otherTabWrites(otherTab),
			thisTab,
			null,
		);

		assert.ok(adopted);
		const stored = getLearningData();
		assert.equal(stored.learningPaths.flags?.path?.sessions?.length, 2);
		assert.equal(stored.sessionHistory.length, 2);
		assert.equal(stored.stats.totalSessions, 2);
		assert.deepEqual(
			Object.keys(stored.learningPaths.flags?.path?.progress ?? {}).sort(),
			["au", "fj", "nz", "pg"],
		);
		assert.equal(JSON.stringify(stored), JSON.stringify(adopted));
	});

	test("un cambio de perfil de la otra pestaña gana si aquí no cambió", () => {
		const start = thisTabHas(
			saveUserProfile(
				shared(),
				{ ...createDefaultLearningData().profile, name: "Ana" },
				minutes(1).toISOString(),
			),
		);
		const renamed = saveUserProfile(
			start,
			{ ...start.profile, name: "Ale" },
			minutes(5).toISOString(),
		);
		thisTabHas(start);

		const adopted = adoptOtherTabLearningData(
			otherTabWrites(renamed),
			start,
			null,
		);

		assert.equal(adopted?.profile.name, "Ale");
	});

	test("sin novedades, o con la clave borrada, no hace nada", () => {
		const start = thisTabHas(shared());

		assert.equal(
			adoptOtherTabLearningData(otherTabWrites(start), start, null),
			null,
		);
		assert.equal(adoptOtherTabLearningData(null, start, null), null);
		assert.equal(adoptOtherTabLearningData("{roto", start, null), null);
	});

	test("nunca mezcla datos de dueños distintos (invitado y cuenta, D056)", () => {
		const start = shared();
		const account = playBatchSession(start, ["au"], minutes(10));
		const guest = thisTabHas(start);

		// Otra pestaña entró en una cuenta: datos y base de esa cuenta.
		const raw = otherTabWrites(account);
		saveSyncBase("user-1", account);

		assert.equal(adoptOtherTabLearningData(raw, guest, null), null);
		assert.equal(storage.getItem(KEY), raw, "esta pestaña no escribe");

		// La pestaña de esa misma cuenta sí la adopta.
		const adopted = adoptOtherTabLearningData(raw, guest, "user-1");
		assert.equal(adopted?.sessionHistory.length, 1);
	});

	test("una vista de otro juego nunca se guarda: solo su versión corregida (QA de D236)", () => {
		const start = thisTabHas(saveReviewResult(shared(), "fr", "good"));
		const writes: string[] = [];
		const setItem = storage.setItem.bind(storage);
		storage.setItem = (key: string, value: string) => {
			if (key === KEY) writes.push(value);
			setItem(key, value);
		};

		try {
			const view = saveReviewResult(
				toGameView(start, "capitals"),
				"au",
				"good",
			);
			assert.equal(writes.length, 0, "la vista no se escribe");

			const corrected = fromGameView(start, view, "capitals");
			assert.equal(writes.length, 1, "una sola escritura, la corregida");

			const stored = getLearningData();
			assert.equal(stored.countryHistory.au, undefined, "Banderas intacto");
			assert.ok(stored.countryHistory.fr?.review);
			assert.ok(stored.capitalsGame.countryHistory.au?.review);
			assert.equal(JSON.stringify(stored), JSON.stringify(corrected));
			assert.equal(
				Object.getOwnPropertySymbols(corrected).length,
				0,
				"sin la marca de vista",
			);
		} finally {
			storage.setItem = setItem;
		}
	});
});
