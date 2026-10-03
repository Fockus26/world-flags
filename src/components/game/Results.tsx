import { Trophy } from "iconoir-react";
import { Button } from "@/components/ui/Button";
import { useCountUp } from "@/hooks/useCountUp";
import { useGame } from "@/hooks/useGame";
import { useTheme } from "@/hooks/useTheme";
import { GAME_TYPE_NOUNS, type GameResult } from "@/types/country";
import { formatElapsedTime } from "@/utils/learning-storage";
import { getScopeLabel } from "@/utils/practice-scope";
import {
	getScoreBackgroundColor,
	getScoreColor,
	getScoreMessage,
} from "@/utils/score";
import { RecordConfetti } from "./RecordConfetti";

/**
 * Número de Resultados que cuenta de 0 a `value` (D154). Lo que se ve está
 * `aria-hidden`: un lector de pantalla no debe leer cada fotograma. El valor
 * final va aparte, en una región `aria-live` visualmente oculta que está
 * vacía mientras cuenta y se llena una sola vez al terminar (con movimiento
 * reducido, justo después de montar). Debajo del número animado va el final
 * invisible, apilado en la misma celda: reserva su ancho desde el principio y
 * el círculo no crece mientras cuenta ("0.00" → "1:23.45").
 */
function CountUpNumber({
	value,
	format,
	className,
}: {
	value: number;
	format: (value: number) => string;
	className: string;
}) {
	const countUp = useCountUp(value);
	const finalLabel = format(value);

	return (
		<>
			<strong aria-hidden="true" className={`grid ${className}`}>
				<span className="invisible col-start-1 row-start-1">{finalLabel}</span>
				<span className="col-start-1 row-start-1">{format(countUp.value)}</span>
			</strong>
			<span className="sr-only" aria-live="polite">
				{countUp.done ? finalLabel : ""}
			</span>
		</>
	);
}

function formatCount(value: number): string {
	return String(Math.round(value));
}

interface ResultsProps {
	result: GameResult;
	onRestart: () => void;
	onExit: () => void;
}

function CompetitiveResults({
	result,
}: {
	result: Extract<GameResult, { mode: "competitive" }>;
}) {
	const noun = GAME_TYPE_NOUNS[result.gameType];

	// Rush de Países que terminó por rendición (D033): no hay mejor tiempo
	// que mostrar (solo se registra al completar el 100%), así que el
	// resumen es cuántos se encontraron, no cuánto tardó.
	if (!result.completed) {
		return (
			<>
				<p className="m-0 text-text-placeholder">Rush terminado</p>

				<h1 className="my-[0.35rem] mb-2 text-heading-sm leading-[1.08] text-surface-soft sm:text-stat">
					Te rendiste
				</h1>

				<div className="my-4 flex h-26 w-auto min-w-26 shrink-0 flex-col place-items-center justify-center rounded-full border-[0.45rem] border-primary-border bg-primary-soft px-5 text-primary sm:my-6 sm:h-[clamp(7.5rem,20vw,9rem)] sm:min-w-[clamp(7.5rem,20vw,9rem)]">
					<CountUpNumber
						value={result.correctAnswers}
						format={(count) => `${formatCount(count)}/${result.totalCountries}`}
						className="text-heading-sm leading-none tabular-nums whitespace-nowrap sm:text-stat-sm"
					/>
					<span className="mt-1 text-tiny font-bold">encontrados</span>
				</div>

				<p className="m-0 max-w-lg leading-[1.6] text-text-placeholder">
					Encontraste{" "}
					<strong>
						{result.correctAnswers} de {result.totalCountries} {noun}
					</strong>
					.
				</p>
			</>
		);
	}

	return (
		<>
			<p className="m-0 text-text-placeholder">Rush terminado</p>

			<h1 className="my-[0.35rem] mb-2 text-heading-sm leading-[1.08] text-surface-soft sm:text-stat">
				¡Completado!
			</h1>

			{/* Lo que se ve de la fanfarria de récord (D146): el sonido nunca es
			    la única señal (D082). Insignia con zoom-in y confeti (D155),
			    montados en el mismo render en que `finishGame` pide el sonido
			    `record`. */}
			{result.isNewRecord && (
				<>
					<RecordConfetti />
					<p className="m-0 inline-flex items-center gap-1.5 rounded-full border border-medal-gold bg-medal-gold-soft px-3 py-1 font-bold text-medal-gold motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-50 motion-safe:duration-300 motion-safe:ease-out">
						<Trophy className="size-4 shrink-0" aria-hidden="true" />
						¡Nuevo récord!
					</p>
				</>
			)}

			<div className="my-4 flex h-26 w-auto min-w-26 shrink-0 flex-col place-items-center justify-center rounded-full border-[0.45rem] border-primary-border bg-primary-soft px-5 text-primary sm:my-6 sm:h-[clamp(7.5rem,20vw,9rem)] sm:min-w-[clamp(7.5rem,20vw,9rem)]">
				<CountUpNumber
					value={result.elapsedMs}
					format={formatElapsedTime}
					className="text-heading-sm leading-none tabular-nums whitespace-nowrap sm:text-stat-sm"
				/>
				<span className="mt-1 text-tiny font-bold">tiempo</span>
			</div>

			<p className="m-0 max-w-lg leading-[1.6] text-text-placeholder">
				Recorriste{" "}
				<strong>
					{result.totalCountries} {noun}
				</strong>{" "}
				en <strong>{formatElapsedTime(result.elapsedMs)}</strong>.
			</p>
		</>
	);
}

function PracticeResults({
	result,
}: {
	result: Extract<GameResult, { mode: "practice" }>;
}) {
	const isDark = useTheme().resolvedTheme === "dark";
	const scoreColor = getScoreColor(result.score, isDark);
	const scoreBackground = getScoreBackgroundColor(result.score, isDark);
	const percentage = Math.round(
		(result.correctAnswers / result.totalCountries) * 100,
	);

	return (
		<>
			<p className="m-0 text-text-placeholder">Práctica terminada</p>

			<h1 className="my-[0.35rem] mb-2 text-heading-sm leading-[1.08] text-surface-soft sm:text-stat">
				{getScoreMessage(result.score)}
			</h1>

			<div
				className="my-4 flex size-26 shrink-0 place-items-center justify-center rounded-full border-[0.45rem] sm:my-6 sm:size-[clamp(7.5rem,20vw,9rem)]"
				style={{
					borderColor: scoreColor,
					backgroundColor: scoreBackground,
					color: scoreColor,
				}}
			>
				<CountUpNumber
					value={result.score}
					format={formatCount}
					className="text-display leading-none tabular-nums sm:text-score"
				/>
				<span className="mt-[-0.35rem] text-body-sm font-bold">/10</span>
			</div>

			<p className="m-0 max-w-lg leading-[1.6] text-text-placeholder">
				Acertaste{" "}
				<strong>
					{result.correctAnswers} de {result.totalCountries}
				</strong>{" "}
				{GAME_TYPE_NOUNS[result.gameType]} a la primera, equivalente al{" "}
				{percentage}%.
			</p>
		</>
	);
}

export function Results({ result, onRestart, onExit }: ResultsProps) {
	const scopeLabel = getScopeLabel(result.scope);
	const { getLearningPathOverview } = useGame();
	// Sesión de aprender por lotes (D185): en vez del alcance (unos países
	// sueltos), el avance del aprendizaje; y "repetir" es seguir con lo que
	// toque hoy, si queda algo.
	const learningPath = result.isLearningPath
		? getLearningPathOverview(result.gameType)
		: null;
	const learningPathTodayCount = learningPath?.status.todayCodes.length ?? 0;
	const canRestart = !learningPath || learningPathTodayCount > 0;

	return (
		<section className="relative flex max-h-full w-[min(100%,38rem)] flex-col items-center overflow-auto rounded-2xl border border-surface-border bg-surface p-4 text-center shadow-xl sm:p-[clamp(1.5rem,4vh,2.5rem)]">
			{result.mode === "competitive" ? (
				<CompetitiveResults result={result} />
			) : (
				<PracticeResults result={result} />
			)}

			{learningPath ? (
				<p className="mt-3 mb-0 text-body-sm text-text-placeholder">
					Aprender por lotes · <strong>{learningPath.path.scopeLabel}</strong>:{" "}
					{learningPath.status.isComplete
						? "¡completado!"
						: `lote ${(learningPath.status.currentBatchIndex ?? 0) + 1} de ${learningPath.status.batchCount}`}
					, {learningPath.status.consolidatedCount} de{" "}
					{learningPath.status.totalCountries} consolidados.
					{!learningPath.status.isComplete &&
						learningPathTodayCount === 0 &&
						" Vuelve mañana para seguir."}
				</p>
			) : (
				result.scope.type !== "world" && (
					<p className="mt-3 mb-0 text-body-sm text-text-placeholder">
						Esto se guardó para <strong>{scopeLabel}</strong>.
					</p>
				)
			)}

			{/* Los avisos de logro ya no van aquí: salen como snackbar
			    (`AchievementToasts`, montado en `FlagGame`) en el momento en que
			    se desbloquean, incluso a mitad de partida. */}

			<div
				className={`mt-6 grid w-full max-w-md gap-3 sm:mt-8 ${canRestart ? "grid-cols-2" : "grid-cols-1"}`}
			>
				<Button color="neutral" type="button" onClick={onExit}>
					Volver al inicio
				</Button>

				{canRestart && (
					<Button color="primary" type="button" onClick={onRestart}>
						{learningPath
							? `Seguir aprendiendo (${learningPathTodayCount})`
							: "Repetir práctica"}
					</Button>
				)}
			</div>
		</section>
	);
}
