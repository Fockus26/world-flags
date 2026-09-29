import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getStoredThemePreference } from "@/utils/learning-storage";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
	theme: ThemeMode;
	systemPrefersDark: boolean;
}

/**
 * Se leen de una vez al crear el store, no en un efecto de React: si el
 * estado arrancara siempre en "system"/`false` y se corrigiera después vía
 * `dispatch`, un tema guardado explícito ("dark") que no coincide con el
 * `prefers-color-scheme` del sistema produciría un primer render (y
 * `document.documentElement.dataset.theme`) equivocado que se corrige un
 * instante después — el mismo parpadeo que el script bloqueante de
 * `Layout.astro` evita para el primer pintado, pero ahora dentro de React.
 * Ojo: la isla `client:load` sí se evalúa en el build — Astro la prerenderiza
 * (D179) —, y ahí no hay `window`: el guard de abajo y el de
 * `getStoredThemePreference` dejan "system"/`false`. Ese HTML no depende del
 * tema (los colores van por `data-theme`, que pone el script bloqueante de
 * `Layout.astro` antes de pintar), así que no provoca error de hidratación.
 */
function getStoredTheme(): ThemeMode {
	return getStoredThemePreference();
}

function getSystemPrefersDark(): boolean {
	if (typeof window === "undefined") return false;
	return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

const initialState: ThemeState = {
	theme: getStoredTheme(),
	systemPrefersDark: getSystemPrefersDark(),
};

const themeSlice = createSlice({
	name: "theme",
	initialState,
	reducers: {
		setTheme: (state, action: PayloadAction<ThemeMode>) => {
			state.theme = action.payload;
		},

		setSystemPrefersDark: (state, action: PayloadAction<boolean>) => {
			state.systemPrefersDark = action.payload;
		},
	},
});

export const { setTheme, setSystemPrefersDark } = themeSlice.actions;

export default themeSlice.reducer;
