import { useEffect } from "react";

import { requestFlagPrecache } from "@/utils/flag-precache";

/** La bandera en pantalla y las que vienen detrás (D229). */
export const UPCOMING_FLAGS_AHEAD = 4;

/**
 * Pide al service worker que descargue primero las banderas que la partida va
 * a enseñar enseguida (D229). Se llama al empezar la partida y cada vez que
 * avanza, así que también retoma una precarga que se quedó a medias sin
 * esperar a recargar la página. Con `codes` vacío no hace nada (Capitales no
 * enseña banderas).
 */
export function useUpcomingFlagPrecache(codes: readonly string[]) {
	const key = codes.slice(0, UPCOMING_FLAGS_AHEAD).join(",");

	useEffect(() => {
		if (!key) return;

		void requestFlagPrecache(key.split(","));
	}, [key]);
}
