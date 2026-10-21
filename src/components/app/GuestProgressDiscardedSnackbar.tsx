import { type FocusEvent, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { useSyncStatus } from "@/hooks/useSyncStatus";

/**
 * Aviso de que lo jugado como invitado no pasó a la cuenta (D212): al entrar
 * en una cuenta que ya tenía progreso se queda el de la cuenta y lo del
 * invitado se descarta entero (D056). Sin aviso, el jugador veía desaparecer
 * su progreso sin saber por qué. Se queda hasta "Entendido".
 *
 * Copy provisional (D212, CONTENT_CHECKLIST). Vive en el contenedor apilable
 * de `SystemSnackbars` (`role="status"`, se anuncia al aparecer).
 */
export function GuestProgressDiscardedSnackbar() {
	const { guestProgressDiscarded: isVisible, dismissGuestProgressNotice } =
		useSyncStatus();
	// Dónde estaba el foco antes de entrar en el aviso: al cerrarlo, el botón
	// desaparece y el foco vuelve allí en vez de caer en `<body>`.
	const returnFocusRef = useRef<HTMLElement | null>(null);

	if (!isVisible) {
		return null;
	}

	function rememberReturnFocus(event: FocusEvent<Element>) {
		const from = event.relatedTarget;

		returnFocusRef.current = from instanceof HTMLElement ? from : null;
	}

	function dismiss() {
		const target = returnFocusRef.current;

		if (target?.isConnected) {
			target.focus({ preventScroll: true });
		}

		dismissGuestProgressNotice();
	}

	return (
		<div className="pointer-events-auto flex w-full flex-col gap-3 rounded-lg border border-primary-border bg-primary-soft p-3 shadow-xl duration-200 animate-in fade-in-0 slide-in-from-top-4">
			<div className="flex items-start gap-3">
				<span className="shrink-0 text-heading leading-none" aria-hidden="true">
					☁️
				</span>

				<span className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
					<strong className="text-body-sm text-surface-soft">
						Se cargó el progreso de tu cuenta
					</strong>
					<span className="text-caption text-text-placeholder">
						Tu cuenta ya tenía progreso, así que lo que jugaste como invitado en
						este dispositivo no se ha guardado.
					</span>
				</span>
			</div>

			<div className="flex justify-end">
				<Button
					color="neutral"
					variant="soft"
					fullWidth={false}
					onFocus={rememberReturnFocus}
					onClick={dismiss}
				>
					Entendido
				</Button>
			</div>
		</div>
	);
}
