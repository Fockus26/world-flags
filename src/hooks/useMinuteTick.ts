import { useEffect, useState } from "react";

const MINUTE_MS = 60_000;

/**
 * La hora actual, que se renueva cada minuto y al volver a la pestaña. Para lo
 * que depende de la hora y nada más lo cambia: el panel de lotes (D235) tiene
 * que ofrecer «Hacer otra sesión hoy» cuando pasan las 4 h, aunque la pantalla
 * de inicio siga abierta sin tocarla.
 *
 * Es estado y no un `new Date()` en el render a propósito: React Compiler
 * memoiza los cálculos por sus entradas, y una hora leída dentro se quedaría
 * congelada. Pásala como entrada (`getLearningPathOverview(gameType, now)`).
 */
export function useMinuteTick(): Date {
	const [now, setNow] = useState(() => new Date());

	useEffect(() => {
		const refresh = () => setNow(new Date());
		const handleVisibility = () => {
			if (document.visibilityState === "visible") refresh();
		};
		const intervalId = window.setInterval(refresh, MINUTE_MS);
		document.addEventListener("visibilitychange", handleVisibility);

		return () => {
			window.clearInterval(intervalId);
			document.removeEventListener("visibilitychange", handleVisibility);
		};
	}, []);

	return now;
}
