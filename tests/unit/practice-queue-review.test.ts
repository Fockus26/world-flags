/**
 * Los reencolados de una misma sesión cuentan en SM2 como pasos de
 * aprendizaje, al estilo Anki (D186). Lo que se protege:
 *
 * - Una bandera avanza como mucho un paso por sesión: dos "Bien" (o dos
 *   "Difícil") el mismo día no la mandan a 6 días ni le suben dos
 *   repeticiones.
 * - Un "Otra vez" en el reencolado sí cuenta como fallo, y el acierto que
 *   llega después de ese fallo también.
 * - Varios "Otra vez" seguidos son un solo fallo (la facilidad baja una vez).
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { ReviewGrade, ReviewState } from "@/types/progress";
import {
	decideReviewCount,
	type ReviewSessionPhase,
} from "@/utils/practice-queue";
import { calculateNextReview } from "@/utils/spaced-repetition";

const NOW = new Date("2026-10-03T12:00:00Z");

/** Lo que hace `usePracticeQueue` + `gradeCountryReview` en una sesión. */
function playSession(
	initial: ReviewState | null,
	grades: readonly ReviewGrade[],
): { review: ReviewState | null; counted: boolean[] } {
	let review = initial;
	let phase: ReviewSessionPhase | undefined;
	const counted: boolean[] = [];

	for (const grade of grades) {
		const decision = decideReviewCount(phase, grade);
		phase = decision.nextPhase;
		counted.push(decision.countsForReview);
		if (decision.countsForReview) {
			review = calculateNextReview(review, grade, NOW);
		}
	}

	return { review, counted };
}

const ESTABLISHED: ReviewState = {
	dueDate: "2026-10-03",
	intervalDays: 10,
	easeFactor: 2.5,
	repetitions: 3,
	lastReviewedAt: "2026-09-23T12:00:00.000Z",
};

describe("decideReviewCount", () => {
	test("la primera calificación siempre cuenta", () => {
		for (const grade of ["again", "hard", "good", "easy"] as const) {
			assert.equal(decideReviewCount(undefined, grade).countsForReview, true);
		}
	});

	test("un acierto tras otro acierto no cuenta", () => {
		for (const grade of ["hard", "good", "easy"] as const) {
			assert.deepEqual(decideReviewCount("passed", grade), {
				countsForReview: false,
				nextPhase: "passed",
			});
		}
	});

	test("un fallo tras un acierto cuenta, y un acierto tras un fallo también", () => {
		assert.deepEqual(decideReviewCount("passed", "again"), {
			countsForReview: true,
			nextPhase: "lapsed",
		});
		assert.deepEqual(decideReviewCount("lapsed", "good"), {
			countsForReview: true,
			nextPhase: "passed",
		});
	});

	test("un fallo tras otro fallo no cuenta", () => {
		assert.deepEqual(decideReviewCount("lapsed", "again"), {
			countsForReview: false,
			nextPhase: "lapsed",
		});
	});
});

describe("SM2 con reencolados en la misma sesión", () => {
	test("país nuevo, Bien → Bien: vuelve mañana con una repetición", () => {
		const { review, counted } = playSession(null, ["good", "good"]);
		assert.deepEqual(counted, [true, false]);
		assert.equal(review?.repetitions, 1);
		assert.equal(review?.intervalDays, 1);
		assert.equal(review?.dueDate, "2026-10-04");
	});

	test("país nuevo, Difícil → Difícil: una repetición y la facilidad baja una vez", () => {
		const { review } = playSession(null, ["hard", "hard"]);
		assert.equal(review?.repetitions, 1);
		assert.equal(review?.intervalDays, 1);
		assert.equal(review?.easeFactor, 2.35);
	});

	test("país establecido, Difícil → Difícil: el intervalo crece una sola vez", () => {
		const { review } = playSession(ESTABLISHED, ["hard", "hard"]);
		const once = calculateNextReview(ESTABLISHED, "hard", NOW);
		assert.deepEqual(review, once);
		assert.equal(review?.repetitions, 4);
	});

	test("país nuevo, Bien → Otra vez: vuelve mañana como fallado", () => {
		const { review } = playSession(null, ["good", "again"]);
		assert.equal(review?.repetitions, 0);
		assert.equal(review?.dueDate, "2026-10-04");
	});

	test("país nuevo, Otra vez → Bien: vuelve mañana como aprendido", () => {
		const { review } = playSession(null, ["again", "good"]);
		assert.equal(review?.repetitions, 1);
		assert.equal(review?.intervalDays, 1);
		assert.equal(review?.easeFactor, 2.3);
	});

	test("Otra vez ×3 es un solo fallo", () => {
		const { review, counted } = playSession(ESTABLISHED, [
			"again",
			"again",
			"again",
		]);
		assert.deepEqual(counted, [true, false, false]);
		assert.equal(review?.repetitions, 0);
		assert.equal(review?.easeFactor, 2.3);
	});

	test("nunca sube más de una repetición en una sesión", () => {
		const { review } = playSession(null, [
			"good",
			"again",
			"good",
			"hard",
			"good",
		]);
		assert.equal(review?.repetitions, 1);
		assert.equal(review?.intervalDays, 1);
	});
});
