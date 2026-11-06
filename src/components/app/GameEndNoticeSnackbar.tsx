import { type FocusEvent, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { useGameEndNotice } from "@/hooks/useGameEndNotice";
import type { GameEndNotice } from "@/store/slices/gameSlice";
import { SNACKBAR_TEXT } from "./snackbar-classes";

/** Copy provisional (CONTENT_CHECKLIST, D231). */
const COPY: Record<GameEndNotice, { title: string; body: string }> = {
	idle: {
		title: "Partida cerrada por inactividad",
		body: "Llevabas 5 minutos sin jugar. Lo que aprendiste se ha guardado; la marca no.",
	},
	"time-limit": {
		title: "Partida terminada: pasó una hora",
		body: "Un rush dura como mucho una hora. Lo que aprendiste se ha guardado; la marca no.",
	},
};

/**
 * Por qué se cerró sola la última partida (D231). Sin esto, quien vuelve
 * encontraría la pantalla de inicio sin saber qué pasó. Vive en el
 * contenedor de `SystemSnackbars` (`role="status"`) y se queda hasta
 * "Entendido".
 */
export function GameEndNoticeSnackbar() {
	const { notice, dismiss } = useGameEndNotice();
	const returnFocusRef = useRef<HTMLElement | null>(null);

	if (!notice) return null;

	const copy = COPY[notice];

	function rememberReturnFocus(event: FocusEvent<Element>) {
		const from = event.relatedTarget;
		returnFocusRef.current = from instanceof HTMLElement ? from : null;
	}

	function handleDismiss() {
		const target = returnFocusRef.current;
		if (target?.isConnected) target.focus({ preventScroll: true });
		dismiss();
	}

	return (
		<div className="pointer-events-auto flex w-full flex-col gap-3 rounded-lg border border-primary-border bg-primary-soft p-3 shadow-xl duration-200 animate-in fade-in-0 slide-in-from-top-4">
			<div className="flex flex-wrap items-start gap-3">
				<span className="shrink-0 text-heading leading-none" aria-hidden="true">
					💤
				</span>

				<span className={SNACKBAR_TEXT}>
					<strong className="text-body-sm text-surface-soft">
						{copy.title}
					</strong>
					<span className="text-caption text-text-placeholder">
						{copy.body}
					</span>
				</span>
			</div>

			<div className="flex justify-end">
				<Button
					color="neutral"
					variant="soft"
					fullWidth={false}
					onFocus={rememberReturnFocus}
					onClick={handleDismiss}
				>
					Entendido
				</Button>
			</div>
		</div>
	);
}
