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
 * Cuánto de una racha sin actividad corrió en el reloj de la partida y es
 * inactividad: nada si no llegó a dormirse (es pensar), y como mucho hasta el
 * "¿Sigues ahí?", porque desde ahí el reloj está en pausa. Se descuenta de las
 * estadísticas de tiempo jugado; en el rush, la marca lo incluye (los primeros
 * 90 s cuentan: no es una pausa gratis).
 */
export function getIdleInClock(idleMs: number): number {
	if (idleMs < IDLE_SLEEP_MS) return 0;

	return Math.min(idleMs, IDLE_ASK_MS);
}

/**
 * Para pausar el reloj de la partida con efecto desde que empezó el "¿Sigues
 * ahí?", aunque se detecte tarde (pestaña oculta, equipo suspendido):
 * cuántos ms hacia atrás desde ahora.
 */
export function getAskOverdueMs(idleMs: number): number {
	return Math.max(0, idleMs - IDLE_ASK_MS);
}

export function hasReachedSessionLimit(
	startedAt: number,
	now: number,
): boolean {
	return now - startedAt >= SESSION_LIMIT_MS;
}
