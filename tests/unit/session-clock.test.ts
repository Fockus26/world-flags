/**
 * Reloj de la partida con varias pausas a la vez y "Probar otra" (D230).
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
	deferCurrentCard,
	moveCardToEnd,
} from "@/utils/practice-queue";
import {
	createClockPauses,
	getElapsedMs,
	isClockPaused,
	pauseClock,
	resumeClock,
} from "@/utils/session-clock";

describe("pausas del reloj", () => {
	test("una pausa sola devuelve lo que duró", () => {
		const pauses = createClockPauses();
		pauseClock(pauses, "stimulus", 1_000);

		assert.equal(isClockPaused(pauses), true);
		assert.equal(resumeClock(pauses, "stimulus", 4_000), 3_000);
		assert.equal(isClockPaused(pauses), false);
	});

	test("pausas que se solapan se descuentan una sola vez", () => {
		const pauses = createClockPauses();
		pauseClock(pauses, "stimulus", 1_000);
		pauseClock(pauses, "exit", 2_000);

		// Aún queda el modal abierto: el reloj sigue parado.
		assert.equal(resumeClock(pauses, "stimulus", 3_000), 0);
		assert.equal(isClockPaused(pauses), true);
		assert.equal(resumeClock(pauses, "exit", 6_000), 5_000);
	});

	test("soltar una pausa que no estaba no cambia nada", () => {
		const pauses = createClockPauses();

		assert.equal(resumeClock(pauses, "stimulus", 5_000), 0);
		pauseClock(pauses, "advance", 6_000);
		assert.equal(resumeClock(pauses, "exit", 7_000), 0);
		assert.equal(isClockPaused(pauses), true);
	});

	test("pausar dos veces por lo mismo no reinicia la pausa", () => {
		const pauses = createClockPauses();
		pauseClock(pauses, "stimulus", 1_000);
		pauseClock(pauses, "stimulus", 2_000);

		assert.equal(resumeClock(pauses, "stimulus", 3_000), 2_000);
	});

	test("el tiempo transcurrido no cuenta la pausa en curso", () => {
		const pauses = createClockPauses();

		assert.equal(getElapsedMs(0, pauses, 5_000), 5_000);
		pauseClock(pauses, "stimulus", 5_000);
		assert.equal(getElapsedMs(0, pauses, 9_000), 5_000);
	});

	test("una pausa con efecto atrás no empieza antes de la anterior", () => {
		const pauses = createClockPauses();
		pauseClock(pauses, "advance", 1_000);
		assert.equal(resumeClock(pauses, "advance", 2_000), 1_000);
		// El "¿Sigues ahí?" detectado tarde pide pausar desde 500: ya estaba
		// descontado hasta 2 000.
		pauseClock(pauses, "idle", 500);
		assert.equal(resumeClock(pauses, "idle", 5_000), 3_000);
	});

	test("la espera de la primera bandera no cuenta", () => {
		// La sesión arranca el reloj y la pausa a la vez; al verse la bandera,
		// el inicio se corre lo que duró la espera.
		const pauses = createClockPauses();
		let start = 100;
		pauseClock(pauses, "stimulus", 100);
		start += resumeClock(pauses, "stimulus", 2_100);

		assert.equal(getElapsedMs(start, pauses, 5_100), 3_000);
	});
});

describe("Probar otra", () => {
	test("la tarjeta va al final y el resto no cambia de orden", () => {
		assert.deepEqual(moveCardToEnd(["a", "b", "c", "d"], 1), [
			"a",
			"c",
			"d",
			"b",
		]);
	});

	test("la última, o un índice fuera de la lista, la deja igual", () => {
		assert.deepEqual(moveCardToEnd(["a", "b"], 1), ["a", "b"]);
		assert.deepEqual(moveCardToEnd(["a", "b"], 5), ["a", "b"]);
		assert.deepEqual(moveCardToEnd(["a", "b"], -1), ["a", "b"]);
	});

	test("en la cola de práctica sube el turno, sin calificar", () => {
		assert.deepEqual(deferCurrentCard({ queue: ["fr", "de", "it"], turn: 3 }), {
			queue: ["de", "it", "fr"],
			turn: 4,
		});
	});

	test("con una sola tarjeta no hay otra: la cola queda igual", () => {
		const state = { queue: ["fr"], turn: 2 };

		assert.equal(deferCurrentCard(state), state);
	});
});
