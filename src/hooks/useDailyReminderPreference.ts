import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setLearningData } from "@/store/slices/gameSlice";
import type { ExplainedDailyReminderResult } from "@/utils/daily-reminder-explanations";
import { saveDailyReminderAnswer } from "@/utils/learning-storage";
import {
	isSubscribedToDailyReminder,
	subscribeToDailyReminder,
	unsubscribeFromDailyReminder,
} from "@/utils/push-notifications";

/**
 * El interruptor "Notificaciones" de la pestaña Juego: activa o apaga el
 * recordatorio diario **en este dispositivo**.
 *
 * El estado se lee del navegador (permiso + suscripción Push), no de
 * `dailyReminder.optedIn`: esa respuesta viaja con la cuenta, pero la
 * suscripción es de cada navegador. Al cambiarlo también se guarda como
 * respuesta, así el aviso tras la partida no vuelve a preguntar.
 *
 * `enabled` es `null` mientras se consulta al navegador.
 */
export function useDailyReminderPreference() {
	const dispatch = useAppDispatch();
	const { user } = useAuth();
	const learningData = useAppSelector((state) => state.game.learningData);

	const [enabled, setEnabledState] = useState<boolean | null>(null);
	const [problem, setProblem] = useState<
		ExplainedDailyReminderResult | "unsubscribe-failed" | null
	>(null);
	// Un segundo clic mientras el primero sigue en curso no lanza otra petición.
	const isWorkingRef = useRef(false);

	useEffect(() => {
		let cancelled = false;

		isSubscribedToDailyReminder().then((subscribed) => {
			if (!cancelled) setEnabledState(subscribed);
		});

		return () => {
			cancelled = true;
		};
	}, []);

	const rememberAnswer = (optedIn: boolean) => {
		dispatch(setLearningData(saveDailyReminderAnswer(learningData, optedIn)));
	};

	const enable = async () => {
		// La petición de permiso va antes de cualquier otra cosa: tiene que
		// salir dentro del gesto del clic o el navegador no enseña su diálogo
		// (D126).
		const pending = subscribeToDailyReminder(user?.id ?? null);
		setProblem(null);

		const result = await pending;

		if (result === "subscribed") {
			setEnabledState(true);
			rememberAnswer(true);
			return;
		}

		// Cerrar el diálogo del navegador sin elegir deja todo como estaba.
		if (result !== "dismissed") setProblem(result);
	};

	const disable = async () => {
		setProblem(null);

		if (await unsubscribeFromDailyReminder()) {
			setEnabledState(false);
			rememberAnswer(false);
			return;
		}

		setProblem("unsubscribe-failed");
	};

	const setEnabled = (next: boolean) => {
		if (isWorkingRef.current || next === enabled) return;

		isWorkingRef.current = true;
		const pending = next ? enable() : disable();
		pending.finally(() => {
			isWorkingRef.current = false;
		});
	};

	return { enabled, problem, setEnabled };
}
