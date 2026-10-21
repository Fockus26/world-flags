import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	requestSync,
	setGuestProgressDiscarded,
} from "@/store/slices/syncSlice";

/**
 * Conexión y sincronización con la nube, para la UI (D050).
 *
 * - `isOnline`: hay conexión con el servidor. No es solo `navigator.onLine`:
 *   un fallo de red real lo pone en `false` aunque el navegador diga lo
 *   contrario.
 * - `hasPendingChanges`: hay progreso de la cuenta guardado solo en este
 *   dispositivo. Nunca se pierde por recargar o cerrar la app; sí por cerrar
 *   sesión (el logout borra los datos locales, D009).
 * - `hasServerError`: hay red, pero la sincronización falla en el servidor.
 * - `requestSync()`: pide sincronizar ya, sin esperar al agrupado de subidas.
 * - `guestProgressDiscarded`: al entrar se descartó lo jugado como invitado
 *   (D056); `dismissGuestProgressNotice()` cierra su aviso (D212).
 */
export function useSyncStatus() {
	const dispatch = useAppDispatch();

	const connectivity = useAppSelector((state) => state.sync.connectivity);
	const hasPendingChanges = useAppSelector(
		(state) => state.sync.hasPendingChanges,
	);
	const hasServerError = useAppSelector((state) => state.sync.hasServerError);
	const lastSyncedAt = useAppSelector((state) => state.sync.lastSyncedAt);
	const guestProgressDiscarded = useAppSelector(
		(state) => state.sync.guestProgressDiscarded,
	);

	return {
		isOnline: connectivity === "online",
		hasPendingChanges,
		hasServerError,
		lastSyncedAt,
		requestSync: () => dispatch(requestSync()),
		guestProgressDiscarded,
		dismissGuestProgressNotice: () =>
			dispatch(setGuestProgressDiscarded(false)),
	};
}
