import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "@/utils/auth-session-state";

export type AuthStatus = "guest" | "loading" | "authenticated";

interface AuthState {
	user: AuthUser | null;
	status: AuthStatus;
	/**
	 * La sesión se cerró sin que el usuario lo pidiera aquí (otra pestaña,
	 * token rechazado o caducado, D210). Muestra el aviso hasta cerrarlo o
	 * volver a entrar, y le dice a `GameEffects` que aparte lo pendiente.
	 */
	endedUnexpectedly: boolean;
}

const initialState: AuthState = {
	user: null,
	status: "loading",
	endedUnexpectedly: false,
};

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		setAuthState: (
			state,
			action: PayloadAction<{
				user: AuthUser | null;
				status: AuthStatus;
			}>,
		) => {
			state.user = action.payload.user;
			state.status = action.payload.status;

			if (action.payload.status === "authenticated") {
				state.endedUnexpectedly = false;
			}
		},
		sessionEndedUnexpectedly: (state) => {
			state.endedUnexpectedly = true;
		},
		dismissSessionEndedNotice: (state) => {
			state.endedUnexpectedly = false;
		},
	},
});

export const {
	setAuthState,
	sessionEndedUnexpectedly,
	dismissSessionEndedNotice,
} = authSlice.actions;

export default authSlice.reducer;
