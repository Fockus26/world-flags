/**
 * Inactividad y límite de una partida (D231).
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { getPlayedMs } from "@/utils/learning-storage";
import {
	getAskPauseAt,
	getIdleInClock,
	getIdlePhase,
	hasReachedSessionLimit,
	IDLE_ASK_MS,
	IDLE_EXIT_MS,
	IDLE_SLEEP_MS,
	SESSION_LIMIT_MS,
} from "@/utils/session-guard";

describe("fases de inactividad", () => {
	test("45 s se duerme, 90 s pregunta, 5 min sale", () => {
		assert.equal(IDLE_SLEEP_MS, 45_000);
		assert.equal(IDLE_ASK_MS, 90_000);
		assert.equal(IDLE_EXIT_MS, 300_000);

		assert.equal(getIdlePhase(0), "active");
		assert.equal(getIdlePhase(44_999), "active");
		assert.equal(getIdlePhase(45_000), "sleepy");
		assert.equal(getIdlePhase(89_999), "sleepy");
		assert.equal(getIdlePhase(90_000), "asking");
		assert.equal(getIdlePhase(299_999), "asking");
		assert.equal(getIdlePhase(300_000), "expired");
	});

	test("volver tras horas suspendido sale directamente", () => {
		assert.equal(getIdlePhase(3 * 60 * 60_000), "expired");
	});
});

describe("inactividad que corre en el reloj", () => {
	test("pensar menos de 45 s no es inactividad", () => {
		assert.equal(getIdleInClock(30_000), 0);
	});

	test("dormida: cuenta entera, hasta los 90 s del aviso", () => {
		assert.equal(getIdleInClock(60_000), 60_000);
		assert.equal(getIdleInClock(90_000), 90_000);
		assert.equal(getIdleInClock(150_000), 90_000);
	});

	test("con el reloj parado por otra cosa no hay inactividad que descontar", () => {
		// 60 s con el modal de abandonar abierto: el reloj avanzó unos ms.
		assert.equal(getIdleInClock(9), 0);
		// Tras rendirse, el reloj está parado.
		assert.equal(getIdleInClock(0), 0);
	});

	test("la pausa del aviso se fecha en el reloj monótono, nunca después de ahora", () => {
		assert.equal(getAskPauseAt(200_000, 50_000), 140_000);
		assert.equal(getAskPauseAt(100_000, 50_000), 100_000);
		// Equipo en reposo sin que avance performance.now: la hora de pared
		// saltó, pero la pausa no puede quitar tiempo ya jugado.
		assert.equal(getAskPauseAt(63_000, 60_000), 63_000);
	});
});

describe("límite de 1 h de tiempo real", () => {
	test("llega a la hora exacta", () => {
		assert.equal(SESSION_LIMIT_MS, 3_600_000);
		assert.equal(hasReachedSessionLimit(1_000, 1_000 + 3_599_999), false);
		assert.equal(hasReachedSessionLimit(1_000, 1_000 + 3_600_000), true);
	});
});

describe("tiempo jugado de las estadísticas", () => {
	test("resta la inactividad; los registros viejos no traen idleMs", () => {
		assert.equal(getPlayedMs({ elapsedMs: 120_000, idleMs: 90_000 }), 30_000);
		assert.equal(getPlayedMs({ elapsedMs: 120_000 }), 120_000);
		assert.equal(getPlayedMs({ elapsedMs: null }), 0);
		assert.equal(getPlayedMs({ elapsedMs: 10_000, idleMs: 50_000 }), 0);
	});
});
