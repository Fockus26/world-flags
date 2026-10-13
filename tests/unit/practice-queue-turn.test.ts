/**
 * La cola de práctica avanza por turnos (D194). Una bandera reencolada sin
 * nada detrás vuelve enseguida con el mismo código: si quien la muestra
 * reiniciara su estado por código (guard de calificación, pistas,
 * temporizador), el reinicio no correría y la sesión se colgaba (P55).
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { ReviewGrade } from "@/types/progress";
import {
	advancePracticeQueue,
	decideRequeue,
	type PracticeCardState,
	type PracticeQueueState,
} from "@/utils/practice-queue";

describe("advancePracticeQueue", () => {
	test("cola de 1 con reencolado: vuelve la misma bandera y el turno avanza", () => {
		const { state, finished } = advancePracticeQueue(
			{ queue: ["cr"], turn: 4 },
			true,
		);

		assert.equal(finished, false);
		assert.deepEqual(state.queue, ["cr"]);
		assert.equal(state.turn, 5);
	});

	test("sin reencolado pasa a la siguiente y el turno avanza", () => {
		const { state, finished } = advancePracticeQueue(
			{ queue: ["cr", "pa", "ni"], turn: 0 },
			false,
		);

		assert.equal(finished, false);
		assert.deepEqual(state.queue, ["pa", "ni"]);
		assert.equal(state.turn, 1);
	});

	test("la última sin reencolar termina la sesión", () => {
		const { finished } = advancePracticeQueue(
			{ queue: ["cr"], turn: 9 },
			false,
		);

		assert.equal(finished, true);
	});

	test("el reencolado no cambia la regla de posición (D186)", () => {
		const { state } = advancePracticeQueue(
			{ queue: ["a", "b", "c", "d", "e"], turn: 0 },
			true,
		);

		assert.deepEqual(state.queue, ["b", "c", "d", "a", "e"]);
	});
});

/**
 * Lo que hace `usePracticeQueue` + la pantalla de Países: cada turno libera
 * el guard de calificación; se califica siempre con la misma nota.
 */
function playUntilFinished(
	codes: readonly string[],
	grade: ReviewGrade,
	isEstablished: boolean,
): { gradedCodes: string[]; finished: boolean } {
	let state: PracticeQueueState = { queue: codes, turn: 0 };
	const cardStates: Record<string, PracticeCardState> = {};
	const gradedCodes: string[] = [];
	let isGrading = false;
	let resetTurn = -1;

	for (let step = 0; step < 100; step++) {
		// Efecto de reinicio: depende del turno, no del código.
		if (resetTurn !== state.turn) {
			resetTurn = state.turn;
			isGrading = false;
		}
		if (isGrading) return { gradedCodes, finished: false };
		isGrading = true;

		const code = state.queue[0];
		gradedCodes.push(code);
		const { requeue, nextState } = decideRequeue(
			cardStates[code],
			grade,
			isEstablished,
		);
		cardStates[code] = nextState;

		const result = advancePracticeQueue(state, requeue);
		if (result.finished) return { gradedCodes, finished: true };
		state = result.state;
	}

	return { gradedCodes, finished: false };
}

describe("sesión completa con reencolados", () => {
	test("lote de 5 nuevos, todo 'Bien': la última vuelve sola y la sesión termina", () => {
		const { gradedCodes, finished } = playUntilFinished(
			["a", "b", "c", "d", "e"],
			"good",
			false,
		);

		assert.equal(finished, true);
		// Cada bandera nueva se ve dos veces con "Bien" (D186); la última,
		// dos veces seguidas.
		assert.equal(gradedCodes.length, 10);
		assert.deepEqual(gradedCodes.slice(-2), ["e", "e"]);
	});

	test("una sola bandera con 'Otra vez': se repite seguida hasta el tope y termina", () => {
		const { gradedCodes, finished } = playUntilFinished(["cr"], "again", false);

		assert.equal(finished, true);
		assert.deepEqual(gradedCodes, ["cr", "cr", "cr"]);
	});
});
