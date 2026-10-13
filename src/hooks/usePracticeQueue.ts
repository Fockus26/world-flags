import { useRef, useState } from "react";
import type { CountriesLearningHistory, ReviewGrade } from "@/types/progress";
import { isCountryLearned } from "@/utils/learning-storage";
import {
	advancePracticeQueue,
	decideRequeue,
	decideReviewCount,
	type PracticeCardState,
	type PracticeQueueState,
	type ReviewSessionPhase,
} from "@/utils/practice-queue";

interface UsePracticeQueueOptions {
	initialCodes: string[];
	countryHistory: CountriesLearningHistory;
	/**
	 * `isFirstAttempt` es true solo la primera vez que se califica ese país en
	 * la sesión (aunque luego se repita). Va en la misma llamada — no en un
	 * callback aparte — para que quien la use pueda resolverlo en un único
	 * despacho de estado (ver comentario en `useGame.ts`).
	 *
	 * `countsForReview` dice si la calificación pasa por SM2 o es un paso de
	 * aprendizaje de un reencolado que no toca la programación (D186, ver
	 * `decideReviewCount`). La primera calificación siempre cuenta.
	 */
	onGrade: (
		code: string,
		grade: ReviewGrade,
		isFirstAttempt: boolean,
		countsForReview: boolean,
	) => void;
	onFinish: () => void;
}

/**
 * Cola de práctica de una sesión (práctica diaria o práctica por continente):
 * al calificar una bandera con "otra vez"/"difícil"/"bien" puede volver a
 * aparecer más adelante en la misma sesión (ver `utils/practice-queue.ts`).
 */
export function usePracticeQueue({
	initialCodes,
	countryHistory,
	onGrade,
	onFinish,
}: UsePracticeQueueOptions) {
	const [totalCount] = useState(initialCodes.length);
	// Cola y turno juntos: avanzan en el mismo despacho (ver
	// `advancePracticeQueue`).
	const [queueState, setQueueState] = useState<PracticeQueueState>(() => ({
		queue: initialCodes,
		turn: 0,
	}));
	// Los códigos (no solo cuántos): la tarjeta cloze de Países los marca en
	// el tablero y los cuenta en el encabezado de cada continente.
	const [completedCodes, setCompletedCodes] = useState<ReadonlySet<string>>(
		() => new Set(),
	);
	const [attemptedCount, setAttemptedCount] = useState(0);

	const cardStateRef = useRef<Record<string, PracticeCardState>>({});
	const reviewPhaseRef = useRef<Record<string, ReviewSessionPhase>>({});
	const attemptedCodesRef = useRef<Set<string>>(new Set());
	const [establishedByCode] = useState<Record<string, boolean>>(() =>
		Object.fromEntries(
			initialCodes.map((code) => [
				code,
				isCountryLearned(countryHistory[code]?.review ?? null),
			]),
		),
	);

	const currentCode = queueState.queue[0] ?? null;

	function grade(gradeValue: ReviewGrade) {
		if (!currentCode) return;

		const isFirstAttempt = !attemptedCodesRef.current.has(currentCode);

		if (isFirstAttempt) {
			attemptedCodesRef.current.add(currentCode);
			setAttemptedCount((value) => value + 1);
		}

		const { countsForReview, nextPhase } = decideReviewCount(
			reviewPhaseRef.current[currentCode],
			gradeValue,
		);
		if (nextPhase) reviewPhaseRef.current[currentCode] = nextPhase;

		onGrade(currentCode, gradeValue, isFirstAttempt, countsForReview);

		const isEstablished = establishedByCode[currentCode] ?? false;
		const { requeue, nextState } = decideRequeue(
			cardStateRef.current[currentCode],
			gradeValue,
			isEstablished,
		);
		cardStateRef.current[currentCode] = nextState;

		if (!requeue) {
			setCompletedCodes((previous) => new Set(previous).add(currentCode));
		}

		const { state: nextQueueState, finished } = advancePracticeQueue(
			queueState,
			requeue,
		);

		// Al terminar la cola se deja como está: la última tarjeta sigue en
		// pantalla hasta que `onFinish` desmonta la sesión.
		if (finished) {
			onFinish();
			return;
		}

		setQueueState(nextQueueState);
	}

	return {
		currentCode,
		/**
		 * Sube en cada calificación. El estado de la tarjeta en pantalla
		 * (guardas, pistas, temporizador) se reinicia por turno: una bandera
		 * reencolada puede volver enseguida con el mismo `currentCode` (D194).
		 */
		turn: queueState.turn,
		totalCount,
		completedCount: completedCodes.size,
		completedCodes,
		attemptedCount,
		grade,
	};
}
