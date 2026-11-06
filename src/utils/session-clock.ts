/**
 * Pausas del reloj de una partida (D230). Varias cosas pueden pararlo a la vez
 * (la transición entre banderas, el modal de abandonar, una bandera que no
 * carga) y cada una lo suelta por su cuenta: el reloj solo vuelve a correr
 * cuando no queda ninguna, y el tiempo parado se descuenta una sola vez.
 *
 * Todo en `performance.now()`, como el resto del reloj (D132).
 */
export type ClockPauseReason =
	| "advance"
	| "exit"
	| "surrender"
	| "stimulus"
	| "idle"
	| "limit";

export interface ClockPauses {
	reasons: Set<ClockPauseReason>;
	/** Cuándo empezó la pausa en curso; `null` si el reloj corre. */
	pausedAt: number | null;
	/** Cuándo terminó la última pausa: una pausa con efecto atrás no empieza antes (D231). */
	resumedAt: number | null;
}

export function createClockPauses(): ClockPauses {
	return { reasons: new Set(), pausedAt: null, resumedAt: null };
}

/**
 * Para el reloj. `now` puede ser del pasado (el "¿Sigues ahí?" que se detecta
 * tarde, D231): nunca antes de que terminara la pausa anterior, para no
 * descontar dos veces el mismo tramo.
 */
export function pauseClock(
	pauses: ClockPauses,
	reason: ClockPauseReason,
	now: number,
): void {
	if (pauses.reasons.size === 0) {
		pauses.pausedAt = Math.max(now, pauses.resumedAt ?? now);
	}
	pauses.reasons.add(reason);
}

/**
 * Suelta una pausa. Devuelve los ms que el reloj estuvo parado si con esta ya
 * no queda ninguna (hay que sumarlos al inicio de la partida); si no, 0.
 */
export function resumeClock(
	pauses: ClockPauses,
	reason: ClockPauseReason,
	now: number,
): number {
	if (!pauses.reasons.delete(reason)) return 0;
	if (pauses.reasons.size > 0 || pauses.pausedAt === null) return 0;

	const pausedMs = now - pauses.pausedAt;
	pauses.pausedAt = null;
	pauses.resumedAt = now;

	return Math.max(0, pausedMs);
}

export function isClockPaused(pauses: ClockPauses): boolean {
	return pauses.reasons.size > 0;
}

/** Tiempo de juego hasta `now`, sin contar la pausa en curso. */
export function getElapsedMs(
	startTime: number,
	pauses: ClockPauses,
	now: number,
): number {
	const effectiveNow = pauses.pausedAt ?? now;

	return Math.max(0, effectiveNow - startTime);
}
