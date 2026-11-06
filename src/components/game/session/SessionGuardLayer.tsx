import { TriangleFlag } from "iconoir-react";
import { useEffect, useRef } from "react";
import { Button, WRAPPING_BUTTON_TEXT } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { useSessionGuard } from "@/hooks/useSessionGuard";

interface SessionGuardLayerProps {
	guard: ReturnType<typeof useSessionGuard>;
	kind: "rush" | "practice";
	/** "Terminar" tras el aviso de 1 h de la práctica: sale como "Abandonar". */
	onFinishAfterLimit: () => void;
}

/**
 * Lo que se ve de la vigilancia de inactividad y del límite (D231): la
 * partida dormida (45 s, sin bloquear), el "¿Sigues ahí?" (90 s) y, en
 * práctica, el aviso de 1 h. La partida queda tapada mientras hay un aviso
 * (`guard.isCovered`, lo aplica quien la monta).
 *
 * Copy provisional (CONTENT_CHECKLIST, D231).
 */
export function SessionGuardLayer({
	guard,
	kind,
	onFinishAfterLimit,
}: SessionGuardLayerProps) {
	const isAsking = guard.idlePhase === "asking";
	const stayButtonRef = useRef<HTMLButtonElement>(null);
	const continueButtonRef = useRef<HTMLButtonElement>(null);

	// El foco va a la acción segura al abrirse, como en `ConfirmationModal`:
	// sin esto quedaba en el diálogo y Enter no hacía nada (QA de D231).
	useEffect(() => {
		if (isAsking) stayButtonRef.current?.focus();
	}, [isAsking]);

	useEffect(() => {
		if (guard.isLimitWarningOpen) continueButtonRef.current?.focus();
	}, [guard.isLimitWarningOpen]);

	return (
		<>
			{guard.idlePhase === "sleepy" && (
				// Decorativo: no bloquea ni se anuncia (el aviso con texto es el de
				// 90 s). En la esquina de la zona de juego, bajo la cabecera: arriba
				// del todo tapaba "Abandonar".
				<div
					aria-hidden="true"
					className="pointer-events-none absolute top-28 right-6 z-10 flex items-end gap-1 rounded-full border border-surface-border bg-surface px-3 py-1.5 text-surface-soft shadow-md animate-in fade-in-0 duration-500"
				>
					<TriangleFlag className="size-5 -rotate-12 opacity-70" />
					<span className="text-caption font-black italic motion-safe:animate-zzz-float">
						Zzz
					</span>
				</div>
			)}

			<Modal
				isOpen={isAsking}
				onClose={guard.continueAfterIdle}
				// Un clic fuera no cierra: un toque sin querer no es "Sigo aquí".
				// Escape sí.
				isDismissable={false}
				role="alertdialog"
				ariaLabelledby="idle-modal-title"
				ariaDescribedby="idle-modal-description"
				className="flex flex-col gap-3.5"
			>
				<h2 id="idle-modal-title">¿Sigues ahí?</h2>
				<p id="idle-modal-description">
					{kind === "rush"
						? "El tiempo está en pausa. Si no vuelves en unos minutos, la partida se cerrará: lo que has aprendido se guarda, la marca no."
						: "El tiempo está en pausa. Si no vuelves en unos minutos, la práctica se cerrará; lo que has aprendido ya está guardado."}
				</p>
				<Button
					ref={stayButtonRef}
					type="button"
					className={WRAPPING_BUTTON_TEXT}
					onClick={guard.continueAfterIdle}
				>
					Sigo aquí
				</Button>
			</Modal>

			<Modal
				isOpen={guard.isLimitWarningOpen}
				onClose={guard.continueAfterLimit}
				isDismissable={false}
				role="alertdialog"
				ariaLabelledby="limit-modal-title"
				ariaDescribedby="limit-modal-description"
				className="flex flex-col gap-3.5"
			>
				<h2 id="limit-modal-title">Llevas una hora practicando</h2>
				<p id="limit-modal-description">
					Lo que has aprendido ya está guardado. Puedes seguir o terminar por
					hoy.
				</p>
				<div className="mt-3 grid grid-cols-1 gap-3.5 min-[44rem]:grid-cols-2">
					<Button
						ref={continueButtonRef}
						type="button"
						color="neutral"
						className={WRAPPING_BUTTON_TEXT}
						onClick={guard.continueAfterLimit}
					>
						Seguir practicando
					</Button>
					<Button
						type="button"
						className={WRAPPING_BUTTON_TEXT}
						onClick={onFinishAfterLimit}
					>
						Terminar
					</Button>
				</div>
			</Modal>
		</>
	);
}
