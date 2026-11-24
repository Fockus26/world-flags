/**
 * La cámara del mapa (`WorldMap`), sin DOM: qué trozo del mapa se ve y a qué
 * escala. Todo son funciones puras para poder probarlas (`map-viewport.test.ts`).
 *
 * Dos sistemas de coordenadas: las del mapa (unidades de `world-map.json`) y
 * las de pantalla (px desde la esquina del lienzo).
 */

export interface Size {
	width: number;
	height: number;
}

export type Point = [x: number, y: number];
export type Box = [x0: number, y0: number, x1: number, y1: number];

/** `center` es el punto del mapa que cae en el centro del lienzo; `scale`, px por unidad. */
export interface MapView {
	center: Point;
	scale: number;
}

/** Cuántas veces se puede ampliar respecto al mundo entero. */
export const MAX_ZOOM = 60;

/** La escala a la que el mapa entero cabe justo en el lienzo. */
export function getMinScale(map: Size, canvas: Size): number {
	return Math.min(canvas.width / map.width, canvas.height / map.height);
}

export function getMaxScale(map: Size, canvas: Size): number {
	return getMinScale(map, canvas) * MAX_ZOOM;
}

/** Cuánto está ampliado: 1 = el mundo entero. */
export function getZoom(view: MapView, map: Size, canvas: Size): number {
	return view.scale / getMinScale(map, canvas);
}

function clampCenter(
	center: number,
	mapLength: number,
	canvasLength: number,
	scale: number,
) {
	const visible = canvasLength / scale;
	// Si el mapa no llena el lienzo en este eje, va centrado: no hay a dónde ir.
	if (visible >= mapLength) return mapLength / 2;

	return Math.min(Math.max(center, visible / 2), mapLength - visible / 2);
}

/**
 * La vista más cercana a `view` que es válida: escala entre el mundo entero y
 * `MAX_ZOOM`, y sin enseñar nada de fuera del mapa mientras el mapa llene el
 * lienzo. Así nunca se "sale" del mundo al arrastrar.
 */
export function clampView(view: MapView, map: Size, canvas: Size): MapView {
	const scale = Math.min(
		Math.max(view.scale, getMinScale(map, canvas)),
		getMaxScale(map, canvas),
	);

	return {
		scale,
		center: [
			clampCenter(view.center[0], map.width, canvas.width, scale),
			clampCenter(view.center[1], map.height, canvas.height, scale),
		],
	};
}

/** El mundo entero, centrado. */
export function getWorldView(map: Size, canvas: Size): MapView {
	return {
		center: [map.width / 2, map.height / 2],
		scale: getMinScale(map, canvas),
	};
}

/**
 * La vista que encuadra `box` dejando `padding` px libres por cada lado. Un
 * punto (caja sin tamaño, como Tuvalu) queda a la ampliación máxima.
 */
export function fitBox(
	box: Box,
	map: Size,
	canvas: Size,
	padding = 0,
): MapView {
	const [x0, y0, x1, y1] = box;
	const availableWidth = Math.max(canvas.width - padding * 2, 1);
	const availableHeight = Math.max(canvas.height - padding * 2, 1);
	const scale = Math.min(
		availableWidth / Math.max(x1 - x0, Number.EPSILON),
		availableHeight / Math.max(y1 - y0, Number.EPSILON),
	);

	return clampView(
		{ center: [(x0 + x1) / 2, (y0 + y1) / 2], scale },
		map,
		canvas,
	);
}

/** La caja que contiene todas las `boxes`. */
export function unionBoxes(boxes: readonly Box[]): Box | undefined {
	if (boxes.length === 0) return undefined;

	return [
		Math.min(...boxes.map((box) => box[0])),
		Math.min(...boxes.map((box) => box[1])),
		Math.max(...boxes.map((box) => box[2])),
		Math.max(...boxes.map((box) => box[3])),
	];
}

/**
 * La caja a la que volar para ver un grupo de países. Como `unionBoxes`,
 * pero sin los países que por sí solos ocupan más de la mitad del conjunto:
 * Rusia cuenta como Europa y, con ella, "Europa" sería medio mapa.
 */
export function getFocusBox(boxes: readonly Box[]): Box | undefined {
	const all = unionBoxes(boxes);
	if (!all || boxes.length <= 3) return all;

	const maxWidth = (all[2] - all[0]) / 2;
	const maxHeight = (all[3] - all[1]) / 2;
	const fitting = boxes.filter(
		(box) => box[2] - box[0] <= maxWidth && box[3] - box[1] <= maxHeight,
	);

	return fitting.length > 0 ? unionBoxes(fitting) : all;
}

export function toScreen(point: Point, view: MapView, canvas: Size): Point {
	return [
		(point[0] - view.center[0]) * view.scale + canvas.width / 2,
		(point[1] - view.center[1]) * view.scale + canvas.height / 2,
	];
}

export function toMap(point: Point, view: MapView, canvas: Size): Point {
	return [
		(point[0] - canvas.width / 2) / view.scale + view.center[0],
		(point[1] - canvas.height / 2) / view.scale + view.center[1],
	];
}

/** Arrastre: el mapa sigue al dedo `dx`, `dy` px. */
export function panBy(
	view: MapView,
	dx: number,
	dy: number,
	map: Size,
	canvas: Size,
): MapView {
	return clampView(
		{
			scale: view.scale,
			center: [
				view.center[0] - dx / view.scale,
				view.center[1] - dy / view.scale,
			],
		},
		map,
		canvas,
	);
}

/**
 * Amplía o reduce `factor` veces dejando quieto el punto del mapa que está
 * bajo `anchor` (el cursor o el centro del pellizco): se entra "hacia" donde
 * se apunta.
 */
export function zoomAt(
	view: MapView,
	factor: number,
	anchor: Point,
	map: Size,
	canvas: Size,
): MapView {
	const scale = Math.min(
		Math.max(view.scale * factor, getMinScale(map, canvas)),
		getMaxScale(map, canvas),
	);
	const anchored = toMap(anchor, view, canvas);

	return clampView(
		{
			scale,
			center: [
				anchored[0] - (anchor[0] - canvas.width / 2) / scale,
				anchored[1] - (anchor[1] - canvas.height / 2) / scale,
			],
		},
		map,
		canvas,
	);
}

/** Si `point` (del mapa) se ve dentro del lienzo, con `margin` px de holgura. */
export function isVisible(
	point: Point,
	view: MapView,
	canvas: Size,
	margin = 0,
): boolean {
	const [x, y] = toScreen(point, view, canvas);

	return (
		x >= margin &&
		x <= canvas.width - margin &&
		y >= margin &&
		y <= canvas.height - margin
	);
}

export type Direction = "up" | "down" | "left" | "right";

const DIRECTION_VECTORS: Record<Direction, Point> = {
	up: [0, -1],
	down: [0, 1],
	left: [-1, 0],
	right: [1, 0],
};

/**
 * El país al que salta el foco de teclado desde `from` al pulsar una flecha:
 * el más cercano de los que quedan hacia ese lado, dentro de un cono de 45°
 * a cada lado de la flecha. Lo desviado de la dirección cuenta doble, para
 * que "derecha" prefiera lo que está a la derecha de verdad.
 */
export function findNeighbor(
	from: Point,
	direction: Direction,
	candidates: ReadonlyArray<{ code: string; point: Point }>,
): string | undefined {
	const [vx, vy] = DIRECTION_VECTORS[direction];
	let best: string | undefined;
	let bestCost = Number.POSITIVE_INFINITY;

	for (const { code, point } of candidates) {
		const dx = point[0] - from[0];
		const dy = point[1] - from[1];
		const along = dx * vx + dy * vy;
		const across = Math.abs(dx * vy - dy * vx);
		if (along <= 0 || across > along) continue;

		const cost = along + across * 2;
		if (cost < bestCost) {
			best = code;
			bestCost = cost;
		}
	}

	return best;
}

/** El país cuyo punto está más cerca de `target`. Para dar el primer foco. */
export function findClosest(
	target: Point,
	candidates: ReadonlyArray<{ code: string; point: Point }>,
): string | undefined {
	let best: string | undefined;
	let bestDistance = Number.POSITIVE_INFINITY;

	for (const { code, point } of candidates) {
		const distance = Math.hypot(point[0] - target[0], point[1] - target[1]);
		if (distance < bestDistance) {
			best = code;
			bestDistance = distance;
		}
	}

	return best;
}

/**
 * La zona del mapa que está dibujada (`box`) y a cuántos px por unidad. El
 * mapa se pinta una vez así y, mientras la vista cambia, el navegador solo
 * mueve y escala esa capa ya pintada (D242).
 */
export interface MapRaster {
	box: Box;
	scale: number;
}

/** Dónde cae en el lienzo la esquina de la capa dibujada y cuánto se escala para enseñar `view`. */
export interface LayerPlacement {
	x: number;
	y: number;
	scale: number;
}

export function getLayerPlacement(
	view: MapView,
	raster: MapRaster,
	canvas: Size,
): LayerPlacement {
	const [x, y] = toScreen([raster.box[0], raster.box[1]], view, canvas);
	return { x, y, scale: view.scale / raster.scale };
}

/** La inversa de `getLayerPlacement`: la vista que se ve con la capa colocada así. */
export function getViewFromPlacement(
	placement: LayerPlacement,
	raster: MapRaster,
	canvas: Size,
): MapView {
	const scale = placement.scale * raster.scale;
	return {
		scale,
		center: [
			raster.box[0] - (placement.x - canvas.width / 2) / scale,
			raster.box[1] - (placement.y - canvas.height / 2) / scale,
		],
	};
}
