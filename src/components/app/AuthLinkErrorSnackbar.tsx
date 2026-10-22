import { type FocusEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
	AUTH_LINK_ERROR_COPY,
	type AuthLinkErrorKind,
	readAuthLinkError,
	withoutAuthLinkError,
} from "@/utils/auth-link-error";

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
		const url = new URL(window.location.href);
		const found = readAuthLinkError(url);

		if (!found) return;

		window.history.replaceState(
			window.history.state,
			"",
			withoutAuthLinkError(url),
		);
		setKind(found);
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
			<div className="flex items-start gap-3">
				<span className="shrink-0 text-heading leading-none" aria-hidden="true">
					✉️
				</span>

				<span className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
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
