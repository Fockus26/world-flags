import { type FocusEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
	AUTH_LINK_ERROR_COPY,
	type AuthLinkErrorKind,
	authLinkErrorFromMessage,
	authLinkErrorMessage,
	deliverInlineAuthLinkError,
	readAuthLinkError,
	withoutAuthLinkError,
} from "@/utils/auth-link-error";
import { SNACKBAR_TEXT } from "./snackbar-classes";

/** La ventana que abrió esta, si es de la app (mismo origen) y sigue abierta. */
function openerSameOrigin(): Window | null {
	try {
		const opener = window.opener as Window | null;

		return opener &&
			!opener.closed &&
			opener.location.origin === window.location.origin
			? opener
			: null;
	} catch {
		// Otro origen: leer `location` lanza.
		return null;
	}
}

/**
 * Aviso de que el enlace de Auth con el que se llegó no sirvió (D218): el
 * del primer correo de un registro repetido, uno caducado o ya usado.
 * Supabase vuelve con el error en la URL y auth-js no avisa; sin esto la
 * app cargaba como invitado sin decir nada. Al leerlo se limpia la URL,
 * para que recargar no lo repita. Se queda hasta "Entendido".
 *
 * Copy provisional (D218, CONTENT_CHECKLIST). Vive en el contenedor apilable
 * de `SystemSnackbars` (`role="status"`, se anuncia al aparecer). Se lee en
 * un efecto: el build prerenderiza y la URL solo existe en el cliente.
 */
export function AuthLinkErrorSnackbar() {
	const [kind, setKind] = useState<AuthLinkErrorKind | null>(null);
	// Dónde estaba el foco antes de entrar en el aviso: al cerrarlo, el botón
	// desaparece y el foco vuelve allí en vez de caer en `<body>`.
	const returnFocusRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		// Ventana principal: el popup de Google le pasa su error y se cierra.
		function handleMessage(event: MessageEvent) {
			if (event.origin !== window.location.origin) return;

			const found = authLinkErrorFromMessage(event.data);

			// Con Configuración abierta (desde donde se pulsó "Continuar con
			// Google"), el error sale en su formulario: este aviso quedaría
			// detrás del diálogo modal (D224).
			if (found && !deliverInlineAuthLinkError(found)) setKind(found);
		}

		window.addEventListener("message", handleMessage);

		const url = new URL(window.location.href);
		const found = readAuthLinkError(url);

		if (found) {
			window.history.replaceState(
				window.history.state,
				"",
				withoutAuthLinkError(url),
			);

			// Popup de "Entrar con Google" que vuelve con error: el aviso va a
			// la ventana que lo abrió y el popup se cierra (con éxito ya lo
			// cierra `AuthEffects`). Sin `opener` (lo cortó la navegación),
			// el aviso sale aquí.
			const opener = openerSameOrigin();

			if (opener) {
				opener.postMessage(authLinkErrorMessage(found), window.location.origin);
				window.close();
			} else {
				setKind(found);
			}
		}

		return () => window.removeEventListener("message", handleMessage);
	}, []);

	if (!kind) {
		return null;
	}

	const copy = AUTH_LINK_ERROR_COPY[kind];

	function rememberReturnFocus(event: FocusEvent<Element>) {
		const from = event.relatedTarget;

		returnFocusRef.current = from instanceof HTMLElement ? from : null;
	}

	function dismiss() {
		const target = returnFocusRef.current;

		if (target?.isConnected) {
			target.focus({ preventScroll: true });
		}

		setKind(null);
	}

	return (
		<div className="pointer-events-auto flex w-full flex-col gap-3 rounded-lg border border-primary-border bg-primary-soft p-3 shadow-xl duration-200 animate-in fade-in-0 slide-in-from-top-4">
			<div className="flex flex-wrap items-start gap-3">
				<span className="shrink-0 text-heading leading-none" aria-hidden="true">
					✉️
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
					onClick={dismiss}
				>
					Entendido
				</Button>
			</div>
		</div>
	);
}
