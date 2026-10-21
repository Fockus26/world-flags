import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * Estado de la conexión y de la sincronización con la nube (D050). Efímero:
 * no se persiste. Lo que sobrevive a una recarga sin conexión son los datos y
 * la base de sincronización en `localStorage` (`learning-storage.ts`); de ahí
 * se vuelve a derivar `hasPendingChanges` al hidratar.
 */
interface SyncState {
	/**
	 * `navigator.onLine` y sus eventos, corregidos por el resultado real de
	 * cada petición: un fallo de red pasa a `offline` aunque el navegador diga
	 * lo contrario, y una sincronización buena vuelve a `online`.
	 */
	connectivity: "online" | "offline";
	/** Cambios de este dispositivo que la nube aún no tiene (solo con cuenta). */
	hasPendingChanges: boolean;
	/** El último intento llegó al servidor y falló (500, permisos…): hay red, no hay sync. */
	hasServerError: boolean;
	/** Última sincronización buena (ISO). También re-dispara lo que se quedó sin subir, como el ranking. */
	lastSyncedAt: string | null;
	/** Contador: alguien pidió sincronizar ya (volver la red, cerrar sesión). */
	syncRequestId: number;
	/**
	 * Al entrar en una cuenta con progreso se descartó lo jugado como invitado
	 * en este dispositivo (D056). Se avisa hasta que lo cierren (D212).
	 */
	guestProgressDiscarded: boolean;
}

const initialState: SyncState = {
	connectivity: "online",
	hasPendingChanges: false,
	hasServerError: false,
	lastSyncedAt: null,
	syncRequestId: 0,
	guestProgressDiscarded: false,
};

const syncSlice = createSlice({
	name: "sync",

	initialState,

	reducers: {
		setConnectivity: (state, action: PayloadAction<"online" | "offline">) => {
			state.connectivity = action.payload;
		},

		setHasPendingChanges: (state, action: PayloadAction<boolean>) => {
			state.hasPendingChanges = action.payload;
		},

		syncSucceeded: (state, action: PayloadAction<string>) => {
			state.connectivity = "online";
			state.hasServerError = false;
			state.lastSyncedAt = action.payload;
		},

		syncFailed: (state, action: PayloadAction<"network" | "server">) => {
			if (action.payload === "network") {
				state.connectivity = "offline";
			} else {
				// El servidor respondió: hay conexión, lo que falla es la sync.
				state.connectivity = "online";
				state.hasServerError = true;
			}
		},

		requestSync: (state) => {
			state.syncRequestId += 1;
		},

		setGuestProgressDiscarded: (state, action: PayloadAction<boolean>) => {
			state.guestProgressDiscarded = action.payload;
		},

		/** Sin cuenta no hay nada pendiente ni nada que sincronizar. */
		resetSync: (state) => {
			state.hasPendingChanges = false;
			state.hasServerError = false;
			state.lastSyncedAt = null;
		},
	},
});

export const {
	setConnectivity,
	setHasPendingChanges,
	syncSucceeded,
	syncFailed,
	requestSync,
	resetSync,
	setGuestProgressDiscarded,
} = syncSlice.actions;

export default syncSlice.reducer;
