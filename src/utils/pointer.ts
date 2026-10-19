/** Margen para que llegue el segundo clic de un doble clic (el umbral del sistema suele ser ~500 ms). */
const DOUBLE_CLICK_TAIL_MS = 800;

const SWALLOWED_EVENTS = ["mousedown", "mouseup", "click", "dblclick"] as const;

/**
 * Se traga el resto de un doble clic que empezó en un diálogo que ya se
 * cerró. El primer clic en "Sí, abandonar" o "Empezar" desmonta el diálogo y
 * el segundo cae en lo que había debajo (una casilla de continente,
 * "Comenzar práctica"…): con esto un doble clic hace lo mismo que un clic.
 *
 * Solo descarta los clics con `detail > 1` (el segundo y siguientes de una
 * misma ráfaga), en fase de captura y antes que React: un clic nuevo, aunque
 * llegue enseguida, pasa normal. También su `mousedown`, para que no se lleve
 * el foco que acaba de colocar quien cerró el diálogo. Se quita solo pasado el margen, sin depender
 * de que el componente que lo instaló siga montado (abandonar una partida
 * desmonta el diálogo junto con ella).
 */
export function swallowDoubleClickTail() {
	const swallow = (event: MouseEvent) => {
		if (event.detail <= 1) return;
		event.preventDefault();
		event.stopImmediatePropagation();
	};
	for (const type of SWALLOWED_EVENTS) {
		window.addEventListener(type, swallow, true);
	}
	window.setTimeout(() => {
		for (const type of SWALLOWED_EVENTS) {
			window.removeEventListener(type, swallow, true);
		}
	}, DOUBLE_CLICK_TAIL_MS);
}
