/**
 * Reintenta el foco cuadro a cuadro hasta que realmente se aplique.
 *
 * Hace falta porque toda sesión de juego monta dentro de una ranura de
 * `PageFlip` mientras esta todavía está de espaldas (giro 3D con
 * `backface-visibility: hidden`): un `.focus()` normal en ese instante no
 * hace nada, el navegador lo ignora porque el elemento no se está pintando
 * todavía. Reintentar en `requestAnimationFrame` hasta que el giro termine
 * (o se agoten los intentos) hace que el foco caiga apenas el elemento pasa
 * a ser visible, sin acoplarse a la duración exacta de la animación.
 */
export function focusWhenVisible(
	element: HTMLElement | null,
	attemptsLeft = 40,
) {
	if (!element) return;
	element.focus();
	if (document.activeElement === element || attemptsLeft <= 0) return;
	requestAnimationFrame(() => focusWhenVisible(element, attemptsLeft - 1));
}

/**
 * Recoge el foco cuando se pierde en `<body>` porque el elemento que lo tenía
 * desapareció (WCAG 2.4.3): un diálogo que se cierra y cuyo disparador ya no
 * existe ("Empezar" cambia "Aprender por lotes" por el panel; React Aria no
 * encuentra a quién devolverlo), o una partida que se abandona o termina y se
 * desmonta entera. Dentro de un diálogo abierto, ver `focusAfterRemoval`.
 *
 * Reintenta cuadro a cuadro (hasta ~1,5 s) porque el diálogo tarda en
 * desmontarse (animación de salida), el destino puede montar un render
 * después o estar todavía de espaldas en el giro de `PageFlip`. Mientras el foco
 * esté en otro sitio válido (dentro del diálogo todavía abierto) no lo toca.
 */
export function focusIfLost(
	getElement: () => HTMLElement | null,
	attemptsLeft = 90,
) {
	const element = getElement();
	const active = document.activeElement;
	if (element && active === element) return;
	if (element && (active === null || active === document.body)) {
		element.focus();
		if (document.activeElement === element) return;
	}
	if (attemptsLeft <= 0) return;
	requestAnimationFrame(() => focusIfLost(getElement, attemptsLeft - 1));
}

/**
 * Pasa el foco a otro elemento cuando el que lo tenía se desmonta (WCAG
 * 2.4.3). A diferencia de `focusIfLost`, no espera a que el foco caiga en
 * `<body>`: dentro de un diálogo, el FocusScope de React Aria lo recoge antes
 * y lo manda a su primer elemento ("Cerrar"). Por eso espera a que `removed`
 * deje de estar en el documento y entonces enfoca el destino, aunque el foco
 * ya esté en otro sitio del diálogo.
 *
 * Caso: "Todos"/"Ninguno" del selector de países, que se cambian uno por
 * otro al pulsarlos. Si `removed` sigue montado (no hacía falta cambiar de
 * botón), no toca nada.
 */
export function focusAfterRemoval(
	removed: HTMLElement,
	getElement: () => HTMLElement | null,
	attemptsLeft = 90,
) {
	if (!removed.isConnected) {
		const element = getElement();
		if (element && document.activeElement !== element) element.focus();
		if (element && document.activeElement === element) return;
	}
	if (attemptsLeft <= 0) return;
	requestAnimationFrame(() =>
		focusAfterRemoval(removed, getElement, attemptsLeft - 1),
	);
}
