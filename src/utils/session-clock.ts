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
	/** Cada razón activa y desde cuándo pidió parar el reloj. */
	reasons: Map<ClockPauseReason, number>;
	/** Cuándo empezó la pausa en curso; `null` si el reloj corre. */
	pausedAt: number | null;
	/** Cuándo terminó la última pausa: una pausa con efecto atrás no empieza antes (D231). */
	resumedAt: number | null;
}

export function createClockPauses(): ClockPauses {
	return { reasons: new Map(), pausedAt: null, resumedAt: null };
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
	if (!pauses.reasons.has(reason)) pauses.reasons.set(reason, now);
}

/**
 * Suelta una pausa. Devuelve los ms que el reloj estuvo parado y que hay que
 * sumar al inicio de la partida (0 si sigue parado por otra razón).
 *
 * `maxMs`: lo más que puede durar esta pausa. La transición entre banderas
 * del rush son 900 ms; si la página se congela y su temporizador llega tarde,
 * lo que pase de ahí es tiempo de juego, no una pausa gratis (QA de D231).
 * Si otra pausa empezó más tarde (el "¿Sigues ahí?" de los 90 s), el reloj
 * corre entre las dos.
 */
export function resumeClock(
	pauses: ClockPauses,
	reason: ClockPauseReason,
	now: number,
	maxMs?: number,
): number {
	if (!pauses.reasons.delete(reason)) return 0;
	if (pauses.pausedAt === null) return 0;

	const end =
		maxMs === undefined ? now : Math.min(now, pauses.pausedAt + maxMs);

	if (pauses.reasons.size === 0) {
		const pausedMs = end - pauses.pausedAt;
		pauses.pausedAt = null;
		pauses.resumedAt = end;

		return Math.max(0, pausedMs);
	}

	// Quedan otras: solo si esta pausa se cortó antes de ahora y las que
	// quedan empezaron después del corte, el reloj corrió entre medias.
	if (end >= now) return 0;

	const nextStart = Math.max(end, Math.min(...pauses.reasons.values()));
	if (nextStart <= end) return 0;

	const pausedMs = end - pauses.pausedAt;
	pauses.pausedAt = nextStart;

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
