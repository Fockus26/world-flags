import { useEffect, useRef, useState } from "react";
import { ConfirmationModal } from "@/components/game/session/ConfirmationModal";
import { Header } from "@/components/game/session/Header";
import { GradeButtons } from "@/components/ui/GradeButtons";
import { countries } from "@/data/countries";
import type { DailyPracticeSummary } from "@/hooks/useGame";
import { useGame } from "@/hooks/useGame";
import { useGameEndNotice } from "@/hooks/useGameEndNotice";
import { usePracticeQueue } from "@/hooks/usePracticeQueue";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { useUpcomingFlagPrecache } from "@/hooks/useUpcomingFlagPrecache";
import type { GameType } from "@/types/country";
import type { ReviewGrade } from "@/types/progress";
import { isCatalogCountryCode } from "@/utils/country-catalog";
import { toGameView } from "@/utils/learning-storage";
import {
	createClockPauses,
	getElapsedMs,
	pauseClock,
	resumeClock,
} from "@/utils/session-clock";
import { playSound } from "@/utils/sound";
import { CountryClozeCard } from "./countries/CountryClozeCard";
import { SessionGuardLayer } from "./SessionGuardLayer";
import {
	isCardGameType,
	SESSION_CARDS,
	stimulusNeedsLoading,
} from "./session-cards";

interface DailyPracticeProps {
	gameType: GameType;
	countryCodes: string[];
	/** Cola terminada de verdad: cuenta como sesión. */
	onComplete: (summary: DailyPracticeSummary) => void;
	/** Salida a mitad: NO cuenta como sesión. Antes ambas cosas eran el mismo callback. */
	onAbandon: () => void;
}

const GRADE_BY_KEY: Record<string, ReviewGrade> = {
	"1": "again",
	"2": "hard",
	"3": "good",
	"4": "easy",
};

export function DailyPractice({
	gameType,
	countryCodes,
	onComplete,
	onAbandon,
}: DailyPracticeProps) {
	const { learningData, gradeCountryReview } = useGame();
	const [isRevealed, setIsRevealed] = useState(false);
	// Si la tarjeta actual ya está revelada y a la espera de su nota. Igual que
	// en `Session`: `isRevealed` es el valor del render, así que dos
	// pulsaciones de 1-4 seguidas calificaban dos veces la misma tarjeta. Un
	// ref cambia al momento.
	const isAwaitingGradeRef = useRef(false);
	const [isExitModalOpen, setIsExitModalOpen] = useState(false);
	const correctAnswersRef = useRef(0);
	// Reloj monótono, como el de `Session` (D132): si la hora del sistema
	// cambia a mitad de la práctica, `Date.now()` saltaría y el tiempo final
	// saldría negativo o de horas. El valor inicial se toma al montar (D165).
	const startTimeRef = useRef(performance.now());
	// Mientras la bandera no se ve, el tiempo no cuenta para las estadísticas
	// y no se puede revelar (D230), igual que en `Session`.
	const clockPausesRef = useRef(createClockPauses());
	const [readyCode, setReadyCode] = useState<string | null>(null);
	const gameEndNotice = useGameEndNotice();
	// Inactividad y límite de 1 h (D231), como en `Session`. Salir así no
	// cuenta como sesión (`onAbandon`): lo calificado ya está guardado.
	const guard = useSessionGuard({
		enabled: true,
		kind: "practice",
		onPause: (reason, at) => pauseClock(clockPausesRef.current, reason, at),
		onResume: (reason) => {
			startTimeRef.current += resumeClock(
				clockPausesRef.current,
				reason,
				performance.now(),
			);
		},
		onExit: (reason) => {
			gameEndNotice.show(reason);
			onAbandon();
		},
		getClockMs: () =>
			getElapsedMs(
				startTimeRef.current,
				clockPausesRef.current,
				performance.now(),
			),
	});
	const slotRefs = useRef<Map<string, HTMLLIElement>>(new Map());
	// La cola ya llega sin códigos fuera del catálogo (`getDueCountries`),
	// pero se filtra otra vez aquí: un código sin bandera ni nombre en la
	// cabeza de la cola dejaba la pantalla en blanco, sin cabecera ni "Salir".
	// Se congela al montar, igual que la cola de `usePracticeQueue`.
	const [playableCodes] = useState(() =>
		countryCodes.filter(isCatalogCountryCode),
	);

	const {
		currentCode,
		upcomingCodes,
		totalCount,
		completedCount,
		completedCodes,
		grade,
		defer,
		canDefer,
	} = usePracticeQueue({
		initialCodes: playableCodes,
		countryHistory: toGameView(learningData, gameType).countryHistory,
		onGrade: (code, gradeValue, isFirstAttempt, countsForReview) => {
			// Solo la primera vez que aparece cada bandera, y "otra vez" es el
			// único lapso real: `calculateNextReview` reinicia las repeticiones
			// justamente ahí y no en "difícil".
			if (isFirstAttempt && gradeValue !== "again") {
				correctAnswersRef.current += 1;
			}

			// Sin `markPracticed`: la práctica diaria es un scope aparte del
			// de continentes, y no debe contar como "practicado hoy" para el
			// candado de continentes. Un reencolado puede ser solo un paso de
			// aprendizaje (D186); la primera calificación siempre cuenta, así
			// que el acierto a la primera llega igual a los lotes (D185).
			if (countsForReview) {
				gradeCountryReview(code, gradeValue, gameType, false, isFirstAttempt);
			}
		},
		onFinish: () =>
			onComplete({
				totalCountries: playableCodes.length,
				correctAnswers: correctAnswersRef.current,
				elapsedMs: getElapsedMs(
					startTimeRef.current,
					clockPausesRef.current,
					performance.now(),
				),
				idleMs: guard.getIdleMs(),
			}),
	});

	useUpcomingFlagPrecache(gameType === "flags" ? upcomingCodes : []);

	const currentCountry = countries.find(
		(country) => country.code === currentCode,
	);
	// Países va con su tablero (cloze); los demás, con la tarjeta de su juego (D068).
	const card = isCardGameType(gameType) ? SESSION_CARDS[gameType] : null;
	const isStimulusReady =
		!stimulusNeedsLoading(gameType) ||
		(currentCountry !== undefined && readyCode === currentCountry.code);

	useEffect(() => {
		const now = performance.now();

		if (!isStimulusReady) {
			pauseClock(clockPausesRef.current, "stimulus", now);
			return;
		}

		startTimeRef.current += resumeClock(
			clockPausesRef.current,
			"stimulus",
			now,
		);
	}, [isStimulusReady]);

	/** "Probar otra" (D230): la bandera que no carga va al final, sin calificar. */
	function handleSwap() {
		if (isStimulusReady || isAwaitingGradeRef.current) return;
		defer();
	}

	function reveal() {
		if (!isStimulusReady) return;
		isAwaitingGradeRef.current = true;
		setIsRevealed(true);
	}

	function handleGrade(gradeValue: ReviewGrade) {
		if (!isAwaitingGradeRef.current) return;
		isAwaitingGradeRef.current = false;
		// Aquí no se escribe la respuesta: quien juega revela y se califica,
		// así que el acierto o el fallo es su nota. "Otra vez" es el único
		// lapso (el mismo criterio que cuenta los aciertos arriba) (D083).
		playSound(gradeValue === "again" ? "incorrect" : "correct");
		grade(gradeValue);
		setIsRevealed(false);
	}

	useEffect(() => {
		if (isExitModalOpen) return;
		if (guard.isCovered) return;

		function handleKeyDown(event: KeyboardEvent) {
			if (!isRevealed) {
				if (event.code === "Space" || event.key === "Enter") {
					event.preventDefault();
					reveal();
				}
				return;
			}
			const grade = GRADE_BY_KEY[event.key];
			if (grade) {
				event.preventDefault();
				handleGrade(grade);
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
		// biome-ignore lint/correctness/useExhaustiveDependencies: handleGrade estabilizado por React Compiler (ver docs/components.md)
	}, [isRevealed, isExitModalOpen, handleGrade, reveal, guard.isCovered]);

	// Nada que practicar (la cola quedó vacía tras filtrar): de vuelta a la
	// configuración en vez de una pantalla en blanco. Sale por `onAbandon`,
	// no por `onComplete`: no hubo sesión que registrar.
	const hasCard = currentCountry !== undefined;

	useEffect(() => {
		if (!hasCard) onAbandon();
	}, [hasCard, onAbandon]);

	if (!currentCountry) {
		return null;
	}

	return (
		<>
			<section
				className={`flex h-[min(100%,45rem)] md:h-[min(100%,50rem)] max-h-full w-full max-w-session flex-col overflow-hidden rounded-lg border border-surface-border bg-surface p-[0.85rem] animate-in fade-in-0 slide-in-from-bottom-2 duration-300 min-[44rem]:rounded-2xl min-[44rem]:p-[clamp(1rem,2.5vh,2rem)] relative ${guard.isCovered ? "invisible" : ""}`}
				aria-hidden={guard.isCovered || undefined}
			>
				<SessionGuardLayer
					guard={guard}
					kind="practice"
					onFinishAfterLimit={onAbandon}
				/>
				<Header
					regionLabel="Práctica diaria"
					currentIndex={completedCount}
					totalCountries={totalCount}
					onExit={() => setIsExitModalOpen(true)}
				/>

				<div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_auto] gap-[0.65rem] min-[30rem]:gap-[clamp(0.75rem,2vh,1.5rem)]">
					{card === null ? (
						<CountryClozeCard
							countryCode={currentCountry.code}
							targetState={isRevealed ? "revealed" : "target"}
							completedCodes={completedCodes}
							slotRefs={slotRefs}
						/>
					) : (
						card.renderStimulus(currentCountry, undefined, {
							onReady: () => setReadyCode(currentCountry.code),
							onSwap: canDefer ? handleSwap : undefined,
						})
					)}

					<div className="flex flex-col items-center gap-3">
						{card?.showQuestionInDaily && (
							<p className="m-0 text-center font-extrabold text-surface-soft">
								{card.getQuestion(currentCountry)}
							</p>
						)}
						{!isRevealed ? (
							<button
								type="button"
								onClick={reveal}
								disabled={!isStimulusReady}
								className="m-0 cursor-pointer border-0 bg-transparent p-0 text-center text-body-sm text-text-placeholder animate-in fade-in-0 duration-150 disabled:cursor-not-allowed disabled:opacity-50"
							>
								Presiona{" "}
								<kbd className="hidden rounded-sm border border-surface-border bg-surface-soft px-2 py-[0.15rem] text-label text-secondary-soft min-[44rem]:inline">
									Espacio
								</kbd>{" "}
								<span className="min-[44rem]:hidden">Toca aquí</span>
								<span className="hidden min-[44rem]:inline">para revelar</span>
							</button>
						) : (
							<div className="flex w-full flex-col items-center gap-3 animate-in fade-in-0 slide-in-from-bottom-1 duration-200">
								{/* En Países el nombre ya se ve en el tablero (verde, en su
								    hueco) — repetirlo acá sería redundante. */}
								{card !== null && (
									<p className="m-0 text-center font-extrabold text-heading-sm text-surface-soft">
										{card.getAnswer(currentCountry)}
									</p>
								)}
								{card?.renderAnswerNote && (
									<p className="m-0 max-w-xl text-center text-sm text-text-placeholder">
										{card.renderAnswerNote(currentCountry)}
									</p>
								)}
								<GradeButtons onGrade={handleGrade} />
							</div>
						)}
					</div>
				</div>
			</section>

			<ConfirmationModal
				isOpen={isExitModalOpen}
				onCancel={() => setIsExitModalOpen(false)}
				onConfirm={onAbandon}
			/>
		</>
	);
}
