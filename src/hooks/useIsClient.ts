import { useSyncExternalStore } from "react";

// Nada que escuchar: el valor no cambia una vez montado el árbol.
function subscribe() {
	return () => {};
}

function getSnapshot() {
	return true;
}

/** Astro prerenderiza la isla en el build: ahí vale `false`. */
function getServerSnapshot() {
	return false;
}

/**
 * `false` en el HTML que Astro genera en el build y durante la hidratación;
 * `true` justo después, ya en el navegador (D179).
 *
 * Para lo que depende de la fecha o de la zona horaria de quien juega (el
 * calendario de racha): pintado en el build saldría con el día y la zona de
 * Vercel (UTC), el texto no coincidiría con el del cliente y React volvería a
 * pintar la isla entera (error #418). Con `useSyncExternalStore` la
 * hidratación usa `getServerSnapshot` y el valor real llega en el render
 * siguiente, sin efecto ni `useState`.
 */
export function useIsClient() {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
