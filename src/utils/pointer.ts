/** Margen para que llegue el segundo clic de un doble clic (el umbral del sistema suele ser ~500 ms). */
const DOUBLE_CLICK_TAIL_MS = 800;

/** Cuánto puede moverse el puntero entre los dos clics de un doble clic (o los dos toques de un doble toque). */
const DOUBLE_CLICK_SLOP_PX = 16;

const SWALLOWED_MOUSE_EVENTS = [
	"mousedown",
	"mouseup",
	"click",
	"dblclick",
] as const;

/** El último `pointerdown`: dónde y cuándo empezó el clic que cerró el diálogo. */
let lastPointerDown = { time: Number.NEGATIVE_INFINITY, x: 0, y: 0 };

const shield = {
	/** Hasta cuándo un `pointerdown` cerca de `x`/`y` es la segunda mitad del doble clic. */
	pointerUntil: Number.NEGATIVE_INFINITY,
	x: 0,
	y: 0,
	/** Hasta cuándo se descartan los eventos de ratón con `detail > 1`. */
	mouseUntil: Number.NEGATIVE_INFINITY,
	/** El puntero cuyo `pointerdown` se descartó: su `pointerup` tampoco pasa. */
	pointerId: null as number | null,
};

let isTracking = false;

function swallow(event: Event) {
	event.preventDefault();
	event.stopImmediatePropagation();
}

function handlePointerDown(event: PointerEvent) {
	const isTail =
		event.timeStamp < shield.pointerUntil &&
		Math.abs(event.clientX - shield.x) <= DOUBLE_CLICK_SLOP_PX &&
		Math.abs(event.clientY - shield.y) <= DOUBLE_CLICK_SLOP_PX;
	if (isTail) {
		// Una sola vez: un tercer clic ya no es "el resto" del que cerró.
		shield.pointerUntil = Number.NEGATIVE_INFINITY;
		shield.pointerId = event.pointerId;
		swallow(event);
		return;
	}
	lastPointerDown = {
		time: event.timeStamp,
		x: event.clientX,
		y: event.clientY,
	};
}

function handlePointerUp(event: PointerEvent) {
	if (event.pointerId !== shield.pointerId) return;
	shield.pointerId = null;
	swallow(event);
}

function handleMouseEvent(event: MouseEvent) {
	if (event.detail > 1 && event.timeStamp < shield.mouseUntil) swallow(event);
}

/**
 * Empieza a anotar dónde cae cada `pointerdown` (en captura, sin tocarlo). Lo
 * llama el `Modal` al abrirse, así el clic que lo cierre ya queda anotado.
 */
export function trackPointerDowns() {
	if (isTracking) return;
	isTracking = true;
	window.addEventListener("pointerdown", handlePointerDown, true);
	window.addEventListener("pointerup", handlePointerUp, true);
	for (const type of SWALLOWED_MOUSE_EVENTS) {
		window.addEventListener(type, handleMouseEvent, true);
	}
}

/**
 * Se traga el resto de un doble clic que empezó en un diálogo que ya se
 * cerró. El primer clic en "Sí, abandonar" o "Empezar" desmonta el diálogo y
 * el segundo cae en lo que había debajo (una casilla de continente,
 * "Comenzar práctica", "Seguir aprendiendo"…): con esto un doble clic hace
 * lo mismo que un clic.
 *
 * Hay que cortar el `pointerdown` del segundo clic, no solo su `click`: los
 * botones de React Aria empiezan la pulsación en `pointerdown` y, si el
 * `click` no les llega, lo disparan ellos mismos a los 80 ms. Como el
 * `pointerdown` no dice si es el segundo de una ráfaga, se reconoce como lo
 * hace el sistema: poco después y casi en el mismo sitio que el que cerró el
 * diálogo. Un clic en otro sitio, aunque llegue enseguida, pasa normal.
 * Además se descartan los `mousedown`/`click`… con `detail > 1`, por si el
 * puntero se movió algo más que el margen.
 *
 * No depende de que el componente que lo arma siga montado (abandonar una
 * partida desmonta el diálogo junto con ella). Si el diálogo se cerró sin
 * puntero (Escape), solo arma lo de `detail > 1`.
 */
export function swallowDoubleClickTail() {
	const now = performance.now();
	shield.mouseUntil = now + DOUBLE_CLICK_TAIL_MS;
	if (now - lastPointerDown.time > DOUBLE_CLICK_TAIL_MS) return;
	shield.pointerUntil = now + DOUBLE_CLICK_TAIL_MS;
	shield.x = lastPointerDown.x;
	shield.y = lastPointerDown.y;
}
