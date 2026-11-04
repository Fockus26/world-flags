/**
 * Sondeo de "Revisa tu correo" (D214): mientras la pantalla está abierta se
 * prueba a iniciar sesión con la contraseña del registro, para que se cierre
 * sola al confirmar. Cada 8 s sin límite eran 37 intentos cada 5 min, por
 * encima del límite de intentos (30 por 5 min y por IP): justo al confirmar
 * podía dejar al jugador con "Demasiados intentos seguidos".
 *
 * Espera creciente (8 s × 1,5 hasta 60 s), y se deja de sondear a los 10 min
 * (queda "Ya confirmé") o tras dos `invalid_credentials` seguidos: con esa
 * contraseña no se va a entrar nunca (un registro repetido con otra
 * contraseña no la cambia), y entra el enlace del correo.
 */
export const POLL_INITIAL_DELAY_MS = 8_000;
export const POLL_BACKOFF_FACTOR = 1.5;
export const POLL_MAX_DELAY_MS = 60_000;
export const POLL_WINDOW_MS = 10 * 60_000;
export const POLL_MAX_INVALID_CREDENTIALS = 2;

/** Espera antes del intento `attempt` (desde 0). */
export function pollDelay(attempt: number): number {
	return Math.min(
		POLL_INITIAL_DELAY_MS * POLL_BACKOFF_FACTOR ** attempt,
		POLL_MAX_DELAY_MS,
	);
}

/** Cuántos intentos caben en `windowMs` con la pestaña visible todo el rato. */
export function pollAttemptsWithin(windowMs: number): number {
	let elapsed = 0;
	let attempts = 0;

	while (elapsed + pollDelay(attempts) <= windowMs) {
		elapsed += pollDelay(attempts);
		attempts += 1;
	}

	return attempts;
}

/** Por qué se dejó de sondear. */
export type PollStopReason = "timeout" | "credentials";

/** Lo que devuelve `useAuth().signInWithEmail` y le importa al sondeo. */
export interface PollAttemptResult {
	error: string | null;
	errorCode: string | null;
}

/**
 * Qué hacer tras un intento: entró, seguir, o parar y por qué.
 *
 * Se decide por `error`, no por `errorCode` (D218): un fallo de transporte
 * (`AuthRetryableFetchError`, 5xx o red cortada) llega con error y sin
 * código, y tomarlo como "entró" dejaba el sondeo parado para siempre.
 * Ese fallo sigue con la espera creciente como cualquier otro.
 *
 * Solo cuenta `invalid_credentials` seguidos; cualquier otro resultado (sin
 * confirmar, red, límite) reinicia la cuenta.
 */
export function nextPollState(
	invalidStreak: number,
	result: PollAttemptResult,
): {
	invalidStreak: number;
	signedIn: boolean;
	stop: PollStopReason | null;
} {
	if (result.error === null) {
		return { invalidStreak: 0, signedIn: true, stop: null };
	}

	const streak =
		result.errorCode === "invalid_credentials" ? invalidStreak + 1 : 0;

	return {
		invalidStreak: streak,
		signedIn: false,
		stop: streak >= POLL_MAX_INVALID_CREDENTIALS ? "credentials" : null,
	};
}
