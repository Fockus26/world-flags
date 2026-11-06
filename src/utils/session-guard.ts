/**
 * Inactividad y límite de tiempo de una partida (D231). Puro: el reloj llega
 * de fuera (`Date.now()`, tiempo de pared), para que una pestaña oculta o un
 * equipo suspendido, donde los temporizadores se ralentizan o se paran, se
 * calcule con el tiempo que pasó de verdad al volver.
 */

/** Sin actividad desde hace esto: la bandera se duerme (sin bloquear). */
export const IDLE_SLEEP_MS = 45_000;
/** Desde aquí: "¿Sigues ahí?", con la partida tapada y el reloj en pausa. */
export const IDLE_ASK_MS = 90_000;
/** Desde aquí: la partida se cierra sin marca; lo aprendido se queda. */
export const IDLE_EXIT_MS = 5 * 60_000;
/**
 * Tiempo real máximo de una partida: sin contar castigos ni descontar pausas.
 * El rush termina sin marca; la práctica avisa y deja seguir.
 */
export const SESSION_LIMIT_MS = 60 * 60_000;

export type IdlePhase = "active" | "sleepy" | "asking" | "expired";

export function getIdlePhase(idleMs: number): IdlePhase {
	if (idleMs >= IDLE_EXIT_MS) return "expired";
	if (idleMs >= IDLE_ASK_MS) return "asking";
	if (idleMs >= IDLE_SLEEP_MS) return "sleepy";
	return "active";
}

/**
 * Cuánto de una racha sin actividad es inactividad que corrió en el reloj de
 * la partida. `clockMs` es lo que avanzó ese reloj durante la racha, sin sus
 * pausas (modal de abandonar, bandera que no carga, rendirse, el propio
 * "¿Sigues ahí?"). Si no llegó a 45 s, no es inactividad (es pensar, o el
 * reloj estaba parado por otra cosa); si llegó, cuenta entera, hasta 90 s.
 * Se descuenta de las estadísticas de tiempo jugado; en el rush, la marca lo
 * incluye (los primeros 90 s cuentan: no es una pausa gratis).
 */
export function getIdleInClock(clockMs: number): number {
	if (clockMs < IDLE_SLEEP_MS) return 0;

	return Math.min(clockMs, IDLE_ASK_MS);
}

/**
 * Desde cuándo (en `performance.now()`, el reloj de la partida) cuenta la
 * pausa del "¿Sigues ahí?": los 90 s tras la última actividad, aunque se
 * detecte tarde. Nunca después de ahora. Todo en el reloj monótono: una
 * duración de `Date.now()` restada a `performance.now()` restaba a la marca
 * el salto de la hora del sistema o el reposo de un equipo en el que
 * `performance.now()` no avanza (QA de D231).
 */
export function getAskPauseAt(
	nowPerf: number,
	lastActivityPerf: number,
): number {
	return Math.min(nowPerf, lastActivityPerf + IDLE_ASK_MS);
}

export function hasReachedSessionLimit(
	startedAt: number,
	now: number,
): boolean {
	return now - startedAt >= SESSION_LIMIT_MS;
}
