/**
 * Mensajes de los errores de Auth para quien juega (D212).
 *
 * Se decide por `error.code`, nunca por el texto: el texto del servidor está en
 * inglés y cambia entre versiones. Un código desconocido da un mensaje
 * genérico en español: el texto crudo no llega nunca a la pantalla.
 *
 * Copy provisional (D212, CONTENT_CHECKLIST).
 */

/**
 * Sin red, el navegador da un "Failed to fetch" en inglés: se cambia por un
 * mensaje que diga lo que pasa (D052).
 */
export const AUTH_OFFLINE_MESSAGE =
	"Sin conexión. Inténtalo de nuevo cuando vuelvas a estar en línea.";

/**
 * Con red, pero el servicio de cuentas responde con un 5xx (caído, en
 * mantenimiento): no es "sin conexión" (D214). Copy provisional.
 */
export const AUTH_UNAVAILABLE_MESSAGE =
	"El servicio de cuentas no responde ahora mismo. Prueba de nuevo en un momento.";

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

/** Lo mínimo de un error de Auth que hace falta para elegir el mensaje. */
export interface AuthErrorLike {
	code?: string;
	status?: number;
}

/** Los códigos de Better Auth, en los nombres que usa el resto de la app. */
const CODES_FROM_BETTER_AUTH: Record<string, string> = {
	INVALID_EMAIL_OR_PASSWORD: "invalid_credentials",
	EMAIL_NOT_VERIFIED: "email_not_confirmed",
	PASSWORD_TOO_SHORT: "weak_password",
	PASSWORD_TOO_LONG: "weak_password",
	INVALID_EMAIL: "email_address_invalid",
	VALIDATION_ERROR: "validation_failed",
	USER_ALREADY_EXISTS: "user_already_exists",
	USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "user_already_exists",
};

/** El límite de intentos responde 429, sin código propio. */
export function toAuthErrorLike(error: AuthErrorLike): AuthErrorLike {
	if (error.status === 429) {
		return { code: "over_request_rate_limit", status: 429 };
	}

	return {
		code: error.code
			? (CODES_FROM_BETTER_AUTH[error.code] ?? error.code)
			: undefined,
		status: error.status,
	};
}

/** Sin respuesta (`status` 0) o un servicio que puede volver: 502–504 y 520–530. */
export function isRetryableAuthStatus(status: number | undefined): boolean {
	const code = status ?? 0;

	return (
		code === 0 ||
		code === 502 ||
		code === 503 ||
		code === 504 ||
		(code >= 520 && code <= 530)
	);
}

/**
 * Fallo de transporte, no de lo que escribió quien juega: sin red o el
 * servicio caído. `null` si la respuesta llegó y trae su código.
 */
export type AuthTransportFailure = "offline" | "unavailable";

/**
 * "Reintentable" (`isRetryableAuthStatus`) es tanto un fallo de red (`status`
 * 0) como un 502/503/504 o un 520–530 del servidor.
 * Solo lo primero es "sin conexión"; un 5xx con la red bien es el servicio
 * que no responde (D214). `online` es `navigator.onLine`.
 */
export function authTransportFailure(
	error: AuthErrorLike,
	isRetryable: boolean,
	online: boolean,
): AuthTransportFailure | null {
	const status = error.status ?? 0;

	if (isRetryable) {
		return !online || status === 0 ? "offline" : "unavailable";
	}

	if (status >= 500) return "unavailable";

	return null;
}

export function authErrorMessage(
	error: AuthErrorLike,
	failure: AuthTransportFailure | null,
): string {
	if (failure === "offline") return AUTH_OFFLINE_MESSAGE;
	if (failure === "unavailable") return AUTH_UNAVAILABLE_MESSAGE;

	return (
		(error.code && AUTH_MESSAGES_BY_CODE[error.code]) || AUTH_GENERIC_MESSAGE
	);
}

/**
 * Qué campo del formulario señala el error (`aria-invalid`), si alguno:
 * "credentials" son el correo y la contraseña a la vez (el servidor no dice cuál
 * falló). Los de red, límites o servidor no son culpa de ningún campo.
 */
export type AuthErrorField = "email" | "password" | "credentials";

const AUTH_FIELDS_BY_CODE: Record<string, AuthErrorField> = {
	invalid_credentials: "credentials",
	validation_failed: "credentials",
	email_address_invalid: "email",
	weak_password: "password",
};

export function authErrorField(
	error: AuthErrorLike,
	failure: AuthTransportFailure | null,
): AuthErrorField | null {
	if (failure || !error.code) return null;

	return AUTH_FIELDS_BY_CODE[error.code] ?? null;
}

/** Registro con un correo que ya tiene cuenta (con "Confirm email" apagado). */
export function isExistingAccountError(error: AuthErrorLike): boolean {
	return error.code === "user_already_exists" || error.code === "email_exists";
}

/** Límite de bcrypt, que mantienen las cuentas importadas: cuenta bytes, no caracteres. */
export const PASSWORD_MAX_BYTES = 72;

export const PASSWORD_BLANK_MESSAGE =
	"La contraseña no puede ser solo espacios.";

export const PASSWORD_TOO_LONG_MESSAGE =
	"La contraseña es demasiado larga: como máximo 72 caracteres (las tildes y los emojis cuentan por más de uno).";

/**
 * Lo que el servidor no comprueba o comprueba con un mensaje en inglés, antes de
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
