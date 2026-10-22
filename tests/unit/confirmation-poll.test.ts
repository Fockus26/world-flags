/**
 * Sondeo de "Revisa tu correo" (D214). Lo que se protege:
 *
 * - Espera creciente 8 s × 1,5 hasta 60 s.
 * - En 5 min caben muchos menos intentos que el límite de Supabase (30 por
 *   5 min y por IP), y en la ventana de 10 min, también.
 * - Dos `invalid_credentials` seguidos paran el sondeo (registro repetido con
 *   otra contraseña); cualquier otro resultado reinicia la cuenta.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
	nextPollState,
	POLL_MAX_DELAY_MS,
	POLL_WINDOW_MS,
	pollAttemptsWithin,
	pollDelay,
} from "@/utils/confirmation-poll";

describe("pollDelay", () => {
	test("crece ×1,5 desde 8 s y se queda en 60 s", () => {
		assert.equal(pollDelay(0), 8_000);
		assert.equal(pollDelay(1), 12_000);
		assert.equal(pollDelay(2), 18_000);
		assert.equal(pollDelay(3), 27_000);
		assert.equal(pollDelay(4), 40_500);
		assert.equal(pollDelay(5), POLL_MAX_DELAY_MS);
		assert.equal(pollDelay(50), POLL_MAX_DELAY_MS);
	});

	test("muy por debajo del límite de Supabase (30 cada 5 min)", () => {
		assert.ok(pollAttemptsWithin(5 * 60_000) <= 10);
		assert.ok(pollAttemptsWithin(POLL_WINDOW_MS) <= 15);
		assert.ok(pollAttemptsWithin(POLL_WINDOW_MS) > 5);
	});
});

describe("nextPollState", () => {
	test("dos invalid_credentials seguidos paran el sondeo", () => {
		const first = nextPollState(0, "invalid_credentials");
		assert.deepEqual(first, { invalidStreak: 1, stop: null });

		const second = nextPollState(first.invalidStreak, "invalid_credentials");
		assert.deepEqual(second, { invalidStreak: 2, stop: "credentials" });
	});

	test("sin confirmar, red o límite: sigue y reinicia la cuenta", () => {
		for (const code of [
			"email_not_confirmed",
			"over_request_rate_limit",
			"unexpected_failure",
		]) {
			assert.deepEqual(nextPollState(1, code), {
				invalidStreak: 0,
				stop: null,
			});
		}
	});
});
