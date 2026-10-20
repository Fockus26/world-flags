/**
 * Mensajes de los errores de Supabase Auth para quien juega (D212).
 *
 * Se decide por `error.code`, nunca por el texto: el texto de Supabase está en
 * inglés y cambia entre versiones. Un código desconocido da un mensaje
 * genérico en español: el texto crudo no llega nunca a la pantalla.
 *
 * Copy provisional (D212, CONTENT_CHECKLIST).
 */

/**
 * Sin red, Supabase Auth devuelve un "Failed to fetch" en inglés: se cambia
 * por un mensaje que diga lo que pasa (D052).
 */
export const AUTH_OFFLINE_MESSAGE =
	"Sin conexión. Inténtalo de nuevo cuando vuelvas a estar en línea.";

export const AUTH_GENERIC_MESSAGE =
	"No se pudo completar. Inténtalo de nuevo en unos minutos.";

const AUTH_MESSAGES_BY_CODE: Record<string, string> = {
	invalid_credentials: "Correo o contraseña incorrectos.",
	email_not_confirmed:
		"Aún no has confirmado tu correo. Busca el enlace que te enviamos (mira también en spam).",
	weak_password:
		"La contraseña es demasiado débil. Usa al menos 6 caracteres que no sean solo espacios.",
	over_request_rate_limit:
		"Demasiados intentos seguidos. Espera unos minutos y vuelve a probar.",
	over_email_send_rate_limit:
		"Ya te enviamos varios correos. Espera unos minutos antes de pedir otro.",
	email_address_invalid: "Ese correo no es válido. Revísalo.",
	validation_failed: "Revisa el correo y la contraseña e inténtalo de nuevo.",
	signup_disabled: "Ahora mismo no se pueden crear cuentas nuevas.",
	email_provider_disabled: "Ahora mismo no se puede entrar con correo.",
	// Registro con un correo que ya tiene cuenta. No debería verse: el
	// registro lo trata como uno nuevo para no revelar qué correos existen
	// (`isExistingAccountError`). Por si llega desde otro flujo, neutro.
	user_already_exists:
		"No se pudo crear la cuenta. Si ya tienes una con este correo, inicia sesión.",
	email_exists:
		"No se pudo crear la cuenta. Si ya tienes una con este correo, inicia sesión.",
};

/** Lo mínimo de un `AuthError` que hace falta para elegir el mensaje. */
export interface AuthErrorLike {
	code?: string;
}

export function authErrorMessage(
	error: AuthErrorLike,
	isNetworkError: boolean,
): string {
	if (isNetworkError) return AUTH_OFFLINE_MESSAGE;

	return (
		(error.code && AUTH_MESSAGES_BY_CODE[error.code]) || AUTH_GENERIC_MESSAGE
	);
}

/** Registro con un correo que ya tiene cuenta (con "Confirm email" apagado). */
export function isExistingAccountError(error: AuthErrorLike): boolean {
	return error.code === "user_already_exists" || error.code === "email_exists";
}

/** Límite de bcrypt, que es el de Supabase: cuenta bytes, no caracteres. */
export const PASSWORD_MAX_BYTES = 72;

export const PASSWORD_BLANK_MESSAGE =
	"La contraseña no puede ser solo espacios.";

export const PASSWORD_TOO_LONG_MESSAGE =
	"La contraseña es demasiado larga: como máximo 72 caracteres (las tildes y los emojis cuentan por más de uno).";

/**
 * Lo que Supabase no comprueba o comprueba con un mensaje en inglés, antes de
 * mandar la contraseña nueva. Se recorta solo para validar: la contraseña se
 * guarda tal cual la escribió.
 */
export function validateNewPassword(password: string): string | null {
	if (password.length > 0 && password.trim() === "") {
		return PASSWORD_BLANK_MESSAGE;
	}

	if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) {
		return PASSWORD_TOO_LONG_MESSAGE;
	}

	return null;
}
