import {
	type ReactNode,
	type RefObject,
	type SubmitEvent,
	useEffect,
	useRef,
} from "react";
import { Button } from "@/components/ui/Button";
import { FeedbackMessage } from "@/components/ui/FeedbackMessage";
import { GradeButtons } from "@/components/ui/GradeButtons";
import { Input } from "@/components/ui/Input";
import type { AnswerStatus, GameMode } from "@/types/country";
import type { ReviewGrade } from "@/types/progress";
import { focusWhenVisible } from "@/utils/focus";
import { ANSWER_INPUT_ID, ANSWER_INPUT_PROPS } from "./answer-input";

interface AnswerFormProps {
	countryName: string;
	answer: string;
	onAnswerChange: (value: string) => void;
	answerStatus: AnswerStatus;
	onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
	onSkip: () => void;
	mode: GameMode;
	onGrade: (grade: ReviewGrade) => void;
	/** Tras un skip en práctica "otra vez" ya quedó decidido: no hace falta elegir. */
	hideGradeButtons?: boolean;
	/** Personalizan la pregunta y el placeholder — por defecto los de Banderas, así `Session` no cambia. */
	label?: string;
	placeholder?: string;
	/** Se añade tras el nombre en el aviso de acierto (p. ej. " con 2 pistas" en la práctica de Países). */
	correctSuffix?: ReactNode;
	/**
	 * Va dentro del aviso de acierto o fallo, debajo de la respuesta (en
	 * Capitales: otras respuestas que valen y la nota). Dentro y no al lado para
	 * que el lector de pantalla lo anuncie con el aviso.
	 */
	answerNote?: ReactNode;
	/** Expone el input real al padre — lo necesita el modo Países como origen de la animación de "vuelo" hacia el tablero. */
	inputRef?: RefObject<HTMLInputElement | null>;
}

export function AnswerForm({
	countryName,
	answer,
	onAnswerChange,
	answerStatus,
	onSubmit,
	onSkip,
	mode,
	onGrade,
	hideGradeButtons,
	label = "¿Qué país representa esta bandera?",
	placeholder = "Escribe el nombre del país",
	correctSuffix,
	answerNote,
	inputRef,
}: AnswerFormProps) {
	const isAnswerChecked = answerStatus !== "idle";
	const internalInputRef = useRef<HTMLInputElement>(null);
	const resolvedInputRef = inputRef ?? internalInputRef;

	useEffect(() => {
		if (answerStatus === "idle") {
			focusWhenVisible(resolvedInputRef.current);
		}
	}, [answerStatus, resolvedInputRef]);

	return (
		<form
			className="@container grid shrink-0 grid-cols-1 gap-[0.45rem] min-[43rem]:gap-[0.65rem]"
			onSubmit={onSubmit}
		>
			<label
				htmlFor={ANSWER_INPUT_ID}
				className="font-extrabold text-surface-soft"
			>
				{label}
			</label>

			<Input
				ref={resolvedInputRef}
				{...ANSWER_INPUT_PROPS}
				id={ANSWER_INPUT_ID}
				value={answer}
				onChange={(event) => onAnswerChange(event.target.value)}
				// `readOnly` + `aria-disabled` en vez de `disabled`: un campo
				// deshabilitado suelta el foco a `<body>` y "Comprobar" desaparece
				// con él (P53). Así el foco se queda aquí, se ve igual de apagado
				// (HeroUI pinta `aria-disabled` como `disabled`) y Tab llega a
				// las calificaciones. Intro no vuelve a comprobar: las partidas
				// ignoran el envío fuera de "idle".
				readOnly={isAnswerChecked}
				aria-disabled={isAnswerChecked || undefined}
				placeholder={placeholder}
			/>

			{answerStatus === "correct" && (
				<FeedbackMessage key="correct" variant="success" role="status">
					Correcto: <strong className="text-inherit">{countryName}</strong>
					{correctSuffix}
					{answerNote}
				</FeedbackMessage>
			)}

			{answerStatus === "incorrect" && (
				<FeedbackMessage key="incorrect" variant="danger" role="alert">
					La respuesta correcta es <strong>{countryName}</strong>
					{answerNote}
				</FeedbackMessage>
			)}

			{isAnswerChecked && mode === "practice" && !hideGradeButtons && (
				<div>
					<GradeButtons onGrade={onGrade} />
				</div>
			)}

			{!isAnswerChecked && (
				// En rem, el umbral crece con la letra: con el texto al 200 % a
				// 320 px los dos botones no caben en fila y se apilan (D213).
				<div className="grid grid-cols-[2fr_1fr] gap-2 @max-3xs:grid-cols-1">
					<Button type="submit" disabled={!answer.trim()}>
						Comprobar
					</Button>
					<Button
						type="button"
						variant="outline"
						color="neutral"
						onClick={onSkip}
					>
						Saltar
					</Button>
				</div>
			)}
		</form>
	);
}
