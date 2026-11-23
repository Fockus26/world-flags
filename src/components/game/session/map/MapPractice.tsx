import { useEffect, useRef, useState } from "react";
import { WorldMap } from "@/components/game/map/WorldMap";
import { ConfirmationModal } from "@/components/game/session/ConfirmationModal";
import { Header } from "@/components/game/session/Header";
import { SessionGuardLayer } from "@/components/game/session/SessionGuardLayer";
import type { SessionRuntime } from "@/components/game/session/session-runtime";
import { Button } from "@/components/ui/Button";
import { FeedbackMessage } from "@/components/ui/FeedbackMessage";
import { GradeButtons } from "@/components/ui/GradeButtons";
import { countries as catalog } from "@/data/countries";
import { useCardCountdown } from "@/hooks/useCardCountdown";
import { useGameEndNotice } from "@/hooks/useGameEndNotice";
import { usePracticeQueue } from "@/hooks/usePracticeQueue";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import {
	type AnswerStatus,
	DEFAULT_TIMER_DURATION,
	REGIONS,
	type Region,
} from "@/types/country";
import type { ReviewGrade } from "@/types/progress";
import { getFlagUrl } from "@/utils/flag-precache";
import { toGameView } from "@/utils/learning-storage";
import { getScopeLabel } from "@/utils/practice-scope";
import { calculateScore } from "@/utils/score";
import {
	createClockPauses,
	getElapsedMs,
	pauseClock,
	resumeClock,
} from "@/utils/session-clock";
import { playSound } from "@/utils/sound";

const GRADE_BY_KEY: Record<string, ReviewGrade> = {
	"1": "again",
	"2": "hard",
	"3": "good",
	"4": "easy",
};

/** Como en las otras prácticas: tras «No lo sé» se enseña la respuesta un momento y se califica sola como «otra vez». */
const SKIP_REVEAL_MS = 1500;
/** Toques equivocados que se permiten antes de enseñar dónde está el país. */
const MAX_WRONG_TAPS = 3;

const NAME_BY_CODE = new Map(catalog.map(({ code, name }) => [code, name]));

interface MapPracticeProps {
	/** De dónde sale la partida y a dónde va su resultado (D072), como en `CountriesPractice`. */
	runtime: SessionRuntime;
}

/**
 * Práctica del modo Mapa (D240): sale un país (nombre y bandera) y hay que
 * tocarlo en el mapa. Un toque equivocado dice qué país era ese y deja
 * reintentar; al tercero, o con «No lo sé», el mapa enseña dónde está. Al
 * acertar, la bandera aparece en la silueta y el país queda del color de su
 * continente. Cola, calificación y SM2, los mismos que en las otras prácticas.
 */
export function MapPractice({ runtime }: MapPracticeProps) {
	const { activeGame, learningData, exitGame, finishGame, gradeCountryReview } =
		runtime;

	const countries = activeGame?.countries ?? [];
	const timerDuration =
		activeGame?.configuration.timerDuration ?? DEFAULT_TIMER_DURATION;
	const isTimedPractice = activeGame?.configuration.timerEnabled ?? false;

	const [answerStatus, setAnswerStatus] = useState<AnswerStatus>("idle");
	const [wrongCode, setWrongCode] = useState<string>();
	const [wrongTaps, setWrongTaps] = useState(0);
	const [correctAnswers, setCorrectAnswers] = useState(0);
	const [isExitModalOpen, setIsExitModalOpen] = useState(false);
	const [isSkipPending, setIsSkipPending] = useState(false);

	const firstAttemptResultsRef = useRef<Record<string, boolean>>({});
	const skippedAnswersRef = useRef(0);
	// `performance.now()`, monótono (D167), y las pausas aparte, como en
	// `CountriesPractice`.
	const startTimeRef = useRef<number | null>(null);
	const clockPausesRef = useRef(createClockPauses());
	const isGradingRef = useRef(false);
	const gameEndNotice = useGameEndNotice();
	const guard = useSessionGuard({
		enabled: activeGame !== null,
		kind: "practice",
		onPause: (reason, at) => pauseClock(clockPausesRef.current, reason, at),
		onResume: (reason) => {
			const pausedMs = resumeClock(
				clockPausesRef.current,
				reason,
				performance.now(),
			);
			if (startTimeRef.current !== null) startTimeRef.current += pausedMs;
		},
		onExit: (reason) => {
			gameEndNotice.show(reason);
			exitGame();
		},
		getClockMs: () =>
			startTimeRef.current !== null
				? getElapsedMs(
						startTimeRef.current,
						clockPausesRef.current,
						performance.now(),
					)
				: 0,
	});

	const practiceQueue = usePracticeQueue({
		initialCodes: countries.map((country) => country.code),
		countryHistory: toGameView(learningData, "map").countryHistory,
		onGrade: (code, grade, isFirstAttempt, countsForReview) => {
			if (countsForReview) {
				gradeCountryReview(code, grade, "map", isFirstAttempt);
			}
		},
		onFinish: () => {
			const regionBreakdown: Partial<
				Record<Region, { correct: number; total: number }>
			> = {};

			for (const country of countries) {
				const isCorrect = firstAttemptResultsRef.current[country.code] ?? false;
				const entry = regionBreakdown[country.region] ?? {
					correct: 0,
					total: 0,
				};
				entry.total += 1;
				if (isCorrect) entry.correct += 1;
				regionBreakdown[country.region] = entry;
			}

			finishGame({
				mode: "practice",
				gameType: "map",
				score: calculateScore(correctAnswers, countries.length),
				correctAnswers,
				skippedAnswers: skippedAnswersRef.current,
				finishedAt: new Date().toISOString(),
				elapsedMs:
					startTimeRef.current !== null
						? getElapsedMs(
								startTimeRef.current,
								clockPausesRef.current,
								performance.now(),
							)
						: 0,
				idleMs: guard.getIdleMs(),
				totalCountries: countries.length,
				scope: activeGame?.configuration.scope ?? { type: "world" },
				regionBreakdown,
			});
		},
	});

	const currentCountry = countries.find(
		(country) => country.code === practiceQueue.currentCode,
	);

	/** Solo cuenta el primer resultado de cada país: acertar tras un toque equivocado ya no es "a la primera". */
	function recordFirstAttempt(code: string, isCorrect: boolean) {
		if (code in firstAttemptResultsRef.current) return;
		firstAttemptResultsRef.current[code] = isCorrect;
		if (isCorrect) setCorrectAnswers((value) => value + 1);
	}

	useEffect(() => {
		if (startTimeRef.current === null) {
			startTimeRef.current = performance.now();
		}
	}, []);

	// Turno nuevo (aunque vuelva el mismo país reencolado, D194): todo a cero.
	// biome-ignore lint/correctness/useExhaustiveDependencies: se depende de practiceQueue.turn a propósito, aunque el cuerpo no lo lea
	useEffect(() => {
		isGradingRef.current = false;
	}, [practiceQueue.turn]);

	const timeLeft = useCardCountdown({
		enabled: isTimedPractice,
		duration: timerDuration,
		cardKey: `${practiceQueue.currentCode}:${practiceQueue.turn}`,
		isPaused: answerStatus !== "idle" || isExitModalOpen || guard.isCovered,
		onExpire: handleSkip,
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: handleGrade estabilizado por React Compiler (ver docs/components.md)
	useEffect(() => {
		if (answerStatus === "idle") return;
		if (isExitModalOpen || guard.isCovered || isSkipPending) return;

		function handleKeyDown(event: KeyboardEvent) {
			const grade = GRADE_BY_KEY[event.key];
			if (grade) {
				event.preventDefault();
				handleGrade(grade);
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [answerStatus, isExitModalOpen, isSkipPending, guard.isCovered]);

	if (!activeGame || !currentCountry) {
		return null;
	}

	const scopeLabel =
		activeGame.sessionLabel ?? getScopeLabel(activeGame.configuration.scope);
	const isAnswered = answerStatus !== "idle";

	// Lo ya ubicado en esta partida, más el país de ahora en cuanto se acierta
	// o se enseña. Un país reencolado vuelve sin pintar.
	const foundCodes = new Set(practiceQueue.completedCodes);
	if (isAnswered) foundCodes.add(currentCountry.code);
	const selectableCodes = new Set(
		catalog.map(({ code }) => code).filter((code) => !foundCodes.has(code)),
	);

	// Mientras se busca, el mapa encuadra los continentes de la partida (el
	// mundo entero si son todos). Al acertar o enseñar, vuela al país.
	const sessionRegions = new Set(countries.map((country) => country.region));
	const focusCodes = isAnswered
		? [currentCountry.code]
		: sessionRegions.size === REGIONS.length
			? undefined
			: catalog
					.filter((country) => sessionRegions.has(country.region))
					.map(({ code }) => code);

	function handleOpenExitModal() {
		pauseClock(clockPausesRef.current, "exit", performance.now());
		setIsExitModalOpen(true);
	}

	function handleCancelExit() {
		const pausedMs = resumeClock(
			clockPausesRef.current,
			"exit",
			performance.now(),
		);
		if (startTimeRef.current !== null) startTimeRef.current += pausedMs;
		setIsExitModalOpen(false);
	}

	function handleGrade(grade: ReviewGrade) {
		if (isGradingRef.current) return;
		isGradingRef.current = true;

		practiceQueue.grade(grade);
		setIsSkipPending(false);
		setWrongCode(undefined);
		setWrongTaps(0);
		setAnswerStatus("idle");
	}

	function handleSkip() {
		if (!currentCountry || answerStatus !== "idle") return;

		skippedAnswersRef.current += 1;
		playSound("skip");
		recordFirstAttempt(currentCountry.code, false);
		setWrongCode(undefined);
		setIsSkipPending(true);
		setAnswerStatus("incorrect");
		window.setTimeout(() => handleGrade("again"), SKIP_REVEAL_MS);
	}

	function handleSelect(code: string) {
		if (!currentCountry || answerStatus !== "idle") return;

		if (code === currentCountry.code) {
			playSound("correct");
			recordFirstAttempt(code, true);
			setWrongCode(undefined);
			setAnswerStatus("correct");
			return;
		}

		playSound("incorrect");
		recordFirstAttempt(currentCountry.code, false);
		if (wrongTaps + 1 >= MAX_WRONG_TAPS) {
			setWrongCode(undefined);
			setAnswerStatus("incorrect");
		} else {
			setWrongCode(code);
		}
		setWrongTaps(wrongTaps + 1);
	}

	return (
		<>
			<section
				className={`relative flex h-full max-h-full w-full max-w-232 flex-col gap-3 overflow-hidden rounded-lg border border-surface-border bg-surface p-[0.85rem] min-[44rem]:rounded-2xl min-[44rem]:p-[clamp(1rem,2.5vh,2rem)] ${guard.isCovered ? "invisible" : ""}`}
				aria-hidden={guard.isCovered || undefined}
			>
				<SessionGuardLayer
					guard={guard}
					kind="practice"
					onFinishAfterLimit={exitGame}
				/>
				<Header
					regionLabel={scopeLabel}
					currentIndex={practiceQueue.completedCount}
					totalCountries={practiceQueue.totalCount}
					timeLeft={isTimedPractice ? timeLeft : undefined}
					timerDuration={isTimedPractice ? timerDuration : undefined}
					onExit={handleOpenExitModal}
				/>

				{/* Para quien no ve el mapa (D239): este juego no se puede jugar
				    con lector de pantalla, y se le dice al entrar. */}
				<p className="sr-only">
					Este juego necesita ver el mapa. Con lector de pantalla, prueba
					Países, Banderas o Capitales.
				</p>

				<div className="flex shrink-0 items-center gap-3">
					{/* Decorativa: el país ya está escrito al lado. */}
					<img
						src={getFlagUrl(currentCountry.code)}
						alt=""
						className="h-10 w-auto shrink-0 rounded-xs border border-surface-border"
					/>
					<p className="font-extrabold text-surface-soft">
						¿Dónde está {currentCountry.name}?
					</p>
				</div>

				<div className="min-h-0 flex-1">
					<WorldMap
						label={`Mapa: busca ${currentCountry.name}`}
						foundCodes={foundCodes}
						selectableCodes={selectableCodes}
						focusCodes={focusCodes}
						onSelect={handleSelect}
						wrongCode={wrongCode}
						celebrateCode={isAnswered ? currentCountry.code : undefined}
						autoFocusKey={practiceQueue.turn}
					/>
				</div>

				<div className="flex shrink-0 flex-col gap-2">
					{answerStatus === "idle" && wrongCode && (
						<FeedbackMessage key={wrongTaps} variant="danger" role="alert">
							Eso es <strong>{NAME_BY_CODE.get(wrongCode)}</strong>. Prueba otra
							vez.
						</FeedbackMessage>
					)}

					{answerStatus === "correct" && (
						<FeedbackMessage variant="success" role="status">
							Correcto:{" "}
							<strong className="text-inherit">{currentCountry.name}</strong>
							{wrongTaps > 0 && `, al intento ${wrongTaps + 1}`}
						</FeedbackMessage>
					)}

					{answerStatus === "incorrect" && (
						<FeedbackMessage variant="danger" role="alert">
							<strong>{currentCountry.name}</strong> está aquí.
						</FeedbackMessage>
					)}

					{isAnswered && !isSkipPending && (
						<GradeButtons onGrade={handleGrade} />
					)}

					{!isAnswered && (
						<Button
							type="button"
							variant="outline"
							color="neutral"
							onClick={handleSkip}
						>
							No lo sé
						</Button>
					)}
				</div>
			</section>

			<ConfirmationModal
				isOpen={isExitModalOpen}
				onCancel={handleCancelExit}
				onConfirm={exitGame}
			/>
		</>
	);
}
