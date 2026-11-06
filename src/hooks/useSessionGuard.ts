import { useEffect, useRef, useState } from "react";

import type { GameEndNotice } from "@/store/slices/gameSlice";
import {
	getAskPauseAt,
	getIdleInClock,
	getIdlePhase,
	hasReachedSessionLimit,
	type IdlePhase,
} from "@/utils/session-guard";

/** Cada cuánto se mira el reloj. Al volver a la pestaña se mira al momento. */
const TICK_MS = 1_000;
/** Movimientos de puntero: como mucho uno por este intervalo cuenta como actividad. */
const POINTER_MOVE_THROTTLE_MS = 1_000;

const ACTIVITY_EVENTS = [
	"keydown",
	"pointerdown",
	"pointermove",
	"touchstart",
	"wheel",
] as const;

/** Cuándo fue la última actividad, en los dos relojes. */
interface ActivityMark {
	/** `Date.now()`: decide las fases (cuenta el reposo del equipo). */
	wall: number;
	/** `performance.now()`: fecha la pausa del "¿Sigues ahí?". */
	perf: number;
	/** Reloj de la partida (sin sus pausas): mide la inactividad que corrió. */
	clock: number;
}

/** Inactividad de la racha en curso que corrió en el reloj de la partida. */
function getStreakIdleMs(mark: ActivityMark, getClockMs: () => number) {
	return getIdleInClock(getClockMs() - mark.clock);
}

/** Cierra la racha sin actividad: suma su inactividad y vuelve a contar desde ahora. */
function closeIdleStreak(
	lastActivity: { current: ActivityMark },
	idleInClock: { current: number },
	getClockMs: () => number,
) {
	idleInClock.current += getStreakIdleMs(lastActivity.current, getClockMs);
	lastActivity.current = {
		wall: Date.now(),
		perf: performance.now(),
		clock: getClockMs(),
	};
}

export interface SessionGuardOptions {
	/** Sin vigilar: la partida guiada del tutorial, o una partida ya terminada. */
	enabled: boolean;
	/** El rush termina al llegar a 1 h; la práctica avisa y deja seguir. */
	kind: "rush" | "practice";
	/**
	 * Para el reloj de la partida. `at` (en `performance.now()`) puede ser del
	 * pasado: el "¿Sigues ahí?" cuenta desde los 90 s aunque se detecte tarde.
	 */
	onPause: (reason: "idle" | "limit", at: number) => void;
	onResume: (reason: "idle" | "limit") => void;
	/** Cierra la partida sin marca; lo aprendido ya está guardado. */
	onExit: (reason: GameEndNotice) => void;
	/**
	 * Tiempo de la partida hasta ahora, sin sus pausas (`getElapsedMs`). La
	 * inactividad que va a `idleMs` es lo que avanzó este reloj durante la
	 * racha: con el reloj parado por otra cosa (modal de abandonar, rendirse,
	 * bandera que no carga) no hay inactividad que descontar.
	 */
	getClockMs: () => number;
}

/**
 * Inactividad y límite de tiempo de una partida (D231). Cuenta como actividad
 * el teclado, el puntero y el toque. Tiempo de pared (`Date.now()`): con la
 * pestaña oculta o el equipo suspendido los temporizadores se paran, y al
 * volver se calcula con lo que pasó de verdad.
 *
 * - 45 s: `sleepy` (la bandera se duerme; no bloquea).
 * - 90 s: `asking` ("¿Sigues ahí?", partida tapada, reloj en pausa desde los
 *   90 s, fechados en `performance.now()`). Se sale con el botón o Escape.
 * - 5 min: cierra la partida (`onExit("idle")`).
 * - 1 h de tiempo real: el rush termina (`onExit("time-limit")`); la práctica
 *   abre un aviso una vez.
 */
export function useSessionGuard({
	enabled,
	kind,
	onPause,
	onResume,
	onExit,
	getClockMs,
}: SessionGuardOptions) {
	const [idlePhase, setIdlePhase] = useState<IdlePhase>("active");
	const [isLimitWarningOpen, setIsLimitWarningOpen] = useState(false);
	const startedAtRef = useRef(Date.now());
	const lastActivityRef = useRef<ActivityMark>({
		wall: Date.now(),
		perf: performance.now(),
		clock: 0,
	});
	const lastPointerMoveRef = useRef(0);
	/** Inactividad que ya corrió en el reloj, de rachas terminadas. */
	const idleInClockRef = useRef(0);
	const isAskingRef = useRef(false);
	const hasWarnedLimitRef = useRef(false);
	const hasExitedRef = useRef(false);
	const isLimitWarningOpenRef = useRef(false);
	// Los callbacks cambian en cada render; el temporizador lee los últimos.
	const callbacksRef = useRef({ onPause, onResume, onExit, getClockMs });
	useEffect(() => {
		callbacksRef.current = { onPause, onResume, onExit, getClockMs };
	});

	useEffect(() => {
		if (!enabled) return;

		function exit(reason: GameEndNotice) {
			if (hasExitedRef.current) return;
			hasExitedRef.current = true;
			callbacksRef.current.onExit(reason);
		}

		function check() {
			if (hasExitedRef.current) return;

			const now = Date.now();

			if (hasReachedSessionLimit(startedAtRef.current, now)) {
				if (kind === "rush") {
					exit("time-limit");
					return;
				}
				// Con el "¿Sigues ahí?" abierto, el de la hora espera a que se
				// cierre: dos avisos apilados (QA de D231).
				if (!hasWarnedLimitRef.current && !isAskingRef.current) {
					hasWarnedLimitRef.current = true;
					isLimitWarningOpenRef.current = true;
					callbacksRef.current.onPause("limit", performance.now());
					setIsLimitWarningOpen(true);
				}
			}

			const idleMs = now - lastActivityRef.current.wall;
			const phase = getIdlePhase(idleMs);

			if (phase === "expired") {
				exit("idle");
				return;
			}

			// Con el aviso de 1 h abierto no se pregunta encima; a los 5 min sale igual.
			if (isLimitWarningOpenRef.current) return;

			if (phase === "asking" && !isAskingRef.current) {
				isAskingRef.current = true;
				callbacksRef.current.onPause(
					"idle",
					getAskPauseAt(performance.now(), lastActivityRef.current.perf),
				);
			}

			setIdlePhase(phase);
		}

		function handleActivity(event: Event) {
			// Con el "¿Sigues ahí?" abierto solo vale su botón.
			if (isAskingRef.current) return;

			const now = Date.now();
			if (event.type === "pointermove") {
				if (now - lastPointerMoveRef.current < POINTER_MOVE_THROTTLE_MS) {
					return;
				}
				lastPointerMoveRef.current = now;
			}

			closeIdleStreak(lastActivityRef, idleInClockRef, () =>
				callbacksRef.current.getClockMs(),
			);
			setIdlePhase("active");
		}

		function handleVisibility() {
			if (document.visibilityState === "visible") check();
		}

		const intervalId = window.setInterval(check, TICK_MS);
		for (const type of ACTIVITY_EVENTS) {
			window.addEventListener(type, handleActivity, { passive: true });
		}
		document.addEventListener("visibilitychange", handleVisibility);

		return () => {
			window.clearInterval(intervalId);
			for (const type of ACTIVITY_EVENTS) {
				window.removeEventListener(type, handleActivity);
			}
			document.removeEventListener("visibilitychange", handleVisibility);
		};
	}, [enabled, kind]);

	/** "Sigo aquí": vuelve el reloj; los 90 s del aviso cuentan como inactividad. */
	function continueAfterIdle() {
		if (!isAskingRef.current) return;

		isAskingRef.current = false;
		closeIdleStreak(lastActivityRef, idleInClockRef, () =>
			callbacksRef.current.getClockMs(),
		);
		setIdlePhase("active");
		onResume("idle");
	}

	/** Práctica tras 1 h: seguir. No se vuelve a avisar. */
	function continueAfterLimit() {
		isLimitWarningOpenRef.current = false;
		setIsLimitWarningOpen(false);
		closeIdleStreak(lastActivityRef, idleInClockRef, () =>
			callbacksRef.current.getClockMs(),
		);
		onResume("limit");
	}

	return {
		idlePhase,
		isLimitWarningOpen,
		/** La partida está tapada por un aviso: ni se ve ni se juega. */
		isCovered: idlePhase === "asking" || isLimitWarningOpen,
		continueAfterIdle,
		continueAfterLimit,
		/** Inactividad que corrió en el reloj hasta ahora, para `idleMs` del resultado. */
		getIdleMs: () =>
			idleInClockRef.current +
			getStreakIdleMs(lastActivityRef.current, () =>
				callbacksRef.current.getClockMs(),
			),
	};
}
