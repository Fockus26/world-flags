/**
 * Vuelta de un enlace de Auth que falló (D218). Supabase redirige a la app
 * con el error en el hash (`#error=access_denied&error_code=otp_expired&
 * error_description=…`; en el flujo PKCE, en la query) y auth-js no lo
 * limpia ni avisa: la app cargaba como invitado sin decir nada. Caso real:
 * el primer correo de un registro repetido, cuyo enlace ya no vale.
 */

const ERROR_PARAMS = ["error", "error_code", "error_description"] as const;

function isErrorParam(name: string): boolean {
	return (ERROR_PARAMS as readonly string[]).includes(name);
}

/** Copy provisional (D218, CONTENT_CHECKLIST). */
export const AUTH_LINK_ERROR_COPY = {
	expired: {
		title: "Este enlace ya no vale",
		body: "Usa el del correo más reciente o pide otro.",
	},
	other: {
		title: "No se pudo entrar con el enlace",
		body: "Vuelve a intentarlo desde Perfil y configuración.",
	},
} as const;

export type AuthLinkErrorKind = keyof typeof AUTH_LINK_ERROR_COPY;

/**
 * El error de Auth que trae la URL, o `null`. `otp_expired` es el enlace
 * caducado o ya sustituido; cualquier otro código va al aviso genérico.
 */
export function readAuthLinkError(url: URL): AuthLinkErrorKind | null {
	const hash = new URLSearchParams(url.hash.replace(/^#/, ""));

	for (const params of [hash, url.searchParams]) {
		if (!ERROR_PARAMS.some((name) => params.has(name))) continue;

		return params.get("error_code") === "otp_expired" ? "expired" : "other";
	}

	return null;
}

const MESSAGE_TYPE = "world-flags:auth-link-error";

/** Lo que el popup de Google manda a la ventana que lo abrió. */
export function authLinkErrorMessage(kind: AuthLinkErrorKind) {
	return { type: MESSAGE_TYPE, kind };
}

/** El aviso que pide un mensaje de `postMessage`, o `null` si no es uno. */
export function authLinkErrorFromMessage(
	data: unknown,
): AuthLinkErrorKind | null {
	if (typeof data !== "object" || data === null) return null;

	const { type, kind } = data as { type?: unknown; kind?: unknown };

	if (type !== MESSAGE_TYPE || typeof kind !== "string") return null;

	return Object.hasOwn(AUTH_LINK_ERROR_COPY, kind)
		? (kind as AuthLinkErrorKind)
		: null;
}

/**
 * Error del popup de "Continuar con Google" dicho dentro de Configuración
 * (D224): el botón está ahí, así que no hace falta mandar a otra parte.
 * Copy provisional (CONTENT_CHECKLIST).
 */
export const AUTH_POPUP_ERROR_INLINE_COPY =
	"No se pudo entrar con Google. Vuelve a intentarlo.";

type InlineAuthLinkErrorHandler = (kind: AuthLinkErrorKind) => void;

let inlineHandler: InlineAuthLinkErrorHandler | null = null;

/**
 * `AuthSection`, mientras muestra su formulario dentro del diálogo modal de
 * Configuración, recoge el error del popup (D224). El contenedor de avisos
 * queda fuera del diálogo (`inert`, tapado por el fondo): ni se anunciaba
 * ni se alcanzaba hasta cerrarlo. Devuelve la función que lo suelta.
 */
export function registerInlineAuthLinkError(
	handler: InlineAuthLinkErrorHandler,
): () => void {
	inlineHandler = handler;

	return () => {
		if (inlineHandler === handler) inlineHandler = null;
	};
}

/** Lo entrega a `AuthSection` si está a la vista; `false` si va al aviso. */
export function deliverInlineAuthLinkError(kind: AuthLinkErrorKind): boolean {
	if (!inlineHandler) return false;

	inlineHandler(kind);

	return true;
}

/**
 * La misma URL sin los parámetros de error, para dejar la barra limpia
 * (y que recargar no repita el aviso). Si el hash solo traía el error,
 * se quita entero.
 */
export function withoutAuthLinkError(url: URL): string {
	const clean = new URL(url.href);
	const hash = new URLSearchParams(clean.hash.replace(/^#/, ""));

	for (const name of ERROR_PARAMS) {
		clean.searchParams.delete(name);
	}

	// Un hash que no es de Auth (`#seccion`) se deja tal cual. En el de
	// Auth va también `sb`, la marca de Supabase: se quita con el error.
	if (ERROR_PARAMS.some((name) => hash.has(name))) {
		const rest = clean.hash
			.replace(/^#/, "")
			.split("&")
			.filter((part) => {
				const name = decodeURIComponent(part.split("=")[0] ?? "");
				return name !== "" && name !== "sb" && !isErrorParam(name);
			})
			.join("&");

		clean.hash = rest ? `#${rest}` : "";
	}

	return `${clean.pathname}${clean.search}${clean.hash}`;
}
