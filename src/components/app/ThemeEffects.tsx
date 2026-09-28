import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSystemPrefersDark } from "@/store/slices/themeSlice";
import { saveThemePreference } from "@/utils/learning-storage";

export function ThemeEffects() {
	const dispatch = useAppDispatch();

	const theme = useAppSelector((state) => state.theme.theme);

	const systemPrefersDark = useAppSelector(
		(state) => state.theme.systemPrefersDark,
	);

	const resolvedTheme =
		theme === "system" ? (systemPrefersDark ? "dark" : "light") : theme;

	// Sin lectura inicial de `localStorage`/`matchMedia` aquí: el estado ya
	// arranca correcto desde `themeSlice` (ver el comentario ahí sobre por
	// qué evitarlo corta el parpadeo). Este efecto solo escucha CAMBIOS en
	// vivo del `prefers-color-scheme` mientras la app está abierta.
	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

		const handleChange = (event: MediaQueryListEvent) => {
			dispatch(setSystemPrefersDark(event.matches));
		};

		mediaQuery.addEventListener("change", handleChange);

		return () => {
			mediaQuery.removeEventListener("change", handleChange);
		};
	}, [dispatch]);

	useEffect(() => {
		const root = document.documentElement;

		// Cambio de tema sin transiciones (D170): una transición de color solo
		// avanza mientras la página pinta; en una pestaña oculta se queda
		// congelada en el color del tema viejo, mezclado con fondos ya nuevos
		// (1,1:1 medido, D159/D166). Se apagan todas un instante, se fuerza el
		// recálculo de estilos con el tema nuevo y se vuelven a encender: sin
		// cambio pendiente, ya no arranca ninguna. Solo si el tema cambia de
		// verdad (el script de `Layout.astro` ya lo puso al cargar).
		if (root.dataset.theme !== resolvedTheme) {
			root.dataset.themeSwitching = "";
			root.dataset.theme = resolvedTheme;
			void root.offsetHeight;
			delete root.dataset.themeSwitching;
		}

		saveThemePreference(theme);
	}, [resolvedTheme, theme]);

	return null;
}
