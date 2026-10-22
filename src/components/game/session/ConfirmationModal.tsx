import { useEffect, useRef } from "react";
import { Button, WRAPPING_BUTTON_TEXT } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface ConfirmationModalProps {
	isOpen: boolean;
	onCancel: () => void;
	onConfirm: () => void;
	/** Todos opcionales, con el texto de "abandonar" de siempre por defecto — así Session/DailyPractice no cambian. */
	title?: string;
	description?: string;
	confirmLabel?: string;
	cancelLabel?: string;
}

export function ConfirmationModal({
	isOpen,
	onCancel,
	onConfirm,
	title = "¿Abandonar la práctica?",
	description = "El progreso de esta partida se perderá y no se guardará ninguna calificación.",
	confirmLabel = "Sí, abandonar",
	cancelLabel = "Continuar practicando",
}: ConfirmationModalProps) {
	const cancelButtonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (isOpen) {
			cancelButtonRef.current?.focus();
		}
	}, [isOpen]);

	return (
		<Modal
			isOpen={isOpen}
			onClose={onCancel}
			role="alertdialog"
			ariaLabelledby="exit-modal-title"
			ariaDescribedby="exit-modal-description"
			className="flex flex-col gap-3.5"
		>
			<div
				className="mx-auto grid size-14 place-items-center rounded-full bg-danger text-display font-black text-danger-soft"
				aria-hidden="true"
			>
				!
			</div>

			{/* Con el texto al 200 % a 320 px (D223) "¿Abandonar" no cabe ni
			    sola en el diálogo: guion donde el navegador sabe y, si no, parte
			    la palabra antes que salirse. Los botones parten su texto en una
			    columna; en dos (desde `44rem`) siguen en una línea, como antes:
			    "Continuar practicando" ocupa parte del padding, pero no sale de
			    su botón, y partido haría el botón más alto (medido a 768–1280). */}
			<h2 id="exit-modal-title" className="hyphens-auto wrap-break-word">
				{title}
			</h2>

			<p id="exit-modal-description">{description}</p>

			<div className="mt-3 grid grid-cols-1 gap-3.5 min-[44rem]:grid-cols-2">
				<Button
					color="neutral"
					ref={cancelButtonRef}
					type="button"
					className={`${WRAPPING_BUTTON_TEXT} min-[44rem]:whitespace-nowrap`}
					onClick={onCancel}
				>
					{cancelLabel}
				</Button>

				<Button
					color="danger"
					type="button"
					className={`${WRAPPING_BUTTON_TEXT} min-[44rem]:whitespace-nowrap`}
					onClick={onConfirm}
				>
					{confirmLabel}
				</Button>
			</div>
		</Modal>
	);
}
