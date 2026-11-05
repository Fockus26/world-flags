import { useEffect } from "react";

import {
	requestFlagPrecache,
	requestPersistentStorage,
} from "@/utils/flag-precache";

/**
 * Espera antes de pedir la precarga: la primera carga (bundle, datos, la
 * bandera de la sesión) va primero y ~3 MB de banderas no compiten con ella.
 */
const PRECACHE_DELAY_MS = 5_000;

/**
 * Precarga de las 197 banderas para jugar sin conexión (D054, D229). Se pide
 * tras `PRECACHE_DELAY_MS`, al volver la red y al volver a la pestaña: una red
 * intermitente no siempre dispara `online`, y en el móvil la app pasa mucho
 * tiempo en segundo plano. Las partidas la piden también (ver
 * `useUpcomingFlagPrecache`). El service worker solo descarga las que faltan.
 */
export function FlagPrecacheEffects() {
	useEffect(() => {
		const request = () => void requestFlagPrecache();
		const requestWhenVisible = () => {
			if (document.visibilityState === "visible") request();
		};

		const timeoutId = setTimeout(() => {
			request();
			void requestPersistentStorage();
		}, PRECACHE_DELAY_MS);

		window.addEventListener("online", request);
		document.addEventListener("visibilitychange", requestWhenVisible);

		return () => {
			clearTimeout(timeoutId);
			window.removeEventListener("online", request);
			document.removeEventListener("visibilitychange", requestWhenVisible);
		};
	}, []);

	return null;
}
