import type { ReviewGrade } from "@/types/progress";

/**
 * Cuántas veces seguidas se puede calificar una misma bandera con la misma
 * nota antes de dejar de repetirla en esta sesión (estilo Anki, simplificado):
 *
 * - "Otra vez": hasta 3 veces seguidas.
 * - "Difícil": hasta 2 veces seguidas.
 * - "Bien": 1 vez si el país ya estaba establecido en la memoria (aprendido
 *   antes de esta sesión), 2 si todavía no.
 * - "Fácil": nunca se repite.
 */
function maxConsecutiveForGrade(
	grade: ReviewGrade,
	isEstablished: boolean,
): number {
	switch (grade) {
		case "again":
			return 3;
		case "hard":
			return 2;
		case "good":
			return isEstablished ? 1 : 2;
		case "easy":
			return 1;
	}
}

export interface PracticeCardState {
	lastGrade: ReviewGrade;
	streak: number;
}

export interface GradeDecision {
	requeue: boolean;
	nextState: PracticeCardState;
}

export function decideRequeue(
	previousState: PracticeCardState | undefined,
	grade: ReviewGrade,
	isEstablished: boolean,
): GradeDecision {
	const streak =
		previousState?.lastGrade === grade ? previousState.streak + 1 : 1;
	const nextState: PracticeCardState = { lastGrade: grade, streak };
	const requeue = streak < maxConsecutiveForGrade(grade, isEstablished);

	return { requeue, nextState };
}

/**
 * Qué pasó ya con una bandera en SM2 durante esta sesión: "lapsed" si lo
 * último que contó fue un "Otra vez", "passed" si fue un acierto.
 */
export type ReviewSessionPhase = "lapsed" | "passed";

export interface ReviewCountDecision {
	countsForReview: boolean;
	nextPhase: ReviewSessionPhase | undefined;
}

/**
 * Si una calificación de la sesión pasa por SM2 (`calculateNextReview`) o es
 * solo un paso de aprendizaje, como en Anki (D186). Una bandera avanza como
 * mucho un paso por sesión: los aciertos repetidos no la adelantan más (dos
 * "Bien" a un país nuevo no lo mandan a 6 días el mismo día), pero un "Otra
 * vez" sí cuenta como fallo, y el acierto que llegue después de ese fallo
 * también. Varios "Otra vez" sin acierto entre medio son un solo fallo.
 */
export function decideReviewCount(
	phase: ReviewSessionPhase | undefined,
	grade: ReviewGrade,
): ReviewCountDecision {
	const gradePhase: ReviewSessionPhase =
		grade === "again" ? "lapsed" : "passed";
	const countsForReview = phase !== gradePhase;

	return {
		countsForReview,
		nextPhase: countsForReview ? gradePhase : phase,
	};
}

const REQUEUE_OFFSET = 3;

/** Reinserta una bandera en la cola, unas posiciones más adelante (no inmediatamente). */
export function insertRequeuedCard(
	queue: readonly string[],
	code: string,
	offset: number = REQUEUE_OFFSET,
): string[] {
	const insertAt = Math.min(offset, queue.length);
	const next = [...queue];
	next.splice(insertAt, 0, code);

	return next;
}
