import { useEffect } from "react";

import { store } from "@/store";
import { useAppDispatch } from "@/store/hooks";
import { setLearningData } from "@/store/slices/gameSlice";
import {
	adoptOtherTabLearningData,
	subscribeToOtherTabsLearningData,
} from "@/utils/learning-storage";

/**
 * Con la app abierta en varias pestañas, lo que guarda una entra en las demás
 * antes de que vuelvan a escribir (D236): si no, la siguiente escritura de
 * cualquiera pisaba lo jugado en la otra.
 *
 * `ownerId`: la cuenta ya hidratada de esta pestaña, o `null` si es invitado.
 * `enabled`: solo con los datos ya en pantalla (`hydrationStatus` `ready`);
 * durante una hidratación, la que manda es ella.
 */
export function useOtherTabsLearningData(
	ownerId: string | null,
	enabled: boolean,
): void {
	const dispatch = useAppDispatch();

	useEffect(() => {
		if (!enabled) return;

		return subscribeToOtherTabsLearningData((raw) => {
			const adopted = adoptOtherTabLearningData(
				raw,
				// Lo más reciente del store, no el de un render pasado (ver `useGame`).
				store.getState().game.learningData,
				ownerId,
			);

			if (adopted) dispatch(setLearningData(adopted));
		});
	}, [ownerId, enabled, dispatch]);
}
