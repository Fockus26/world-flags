/**
 * Cajas de las siluetas de `world-map.json`, sacadas de su trazado. El JSON
 * solo trae la caja del territorio principal de cada país (D237); para saber
 * qué se ve en pantalla y dónde pintar la bandera hacen falta las de todos sus
 * territorios.
 *
 * El trazado es el que escribe `scripts/build-world-map.ts`: subtrazados
 * `M x,y l dx,dy … z`, con el primer punto absoluto y el resto relativos.
 */
import type { Box } from "@/utils/map-viewport";
import { unionBoxes } from "@/utils/map-viewport";

const NUMBER_PATTERN = /-?\d+(?:\.\d+)?/g;

/** La caja de cada subtrazado (cada isla o territorio) de `d`. */
export function getSubpathBoxes(d: string): Box[] {
	const boxes: Box[] = [];

	for (const subpath of d.split("M")) {
		const numbers = subpath.match(NUMBER_PATTERN)?.map(Number) ?? [];
		if (numbers.length < 2) continue;

		let x = numbers[0];
		let y = numbers[1];
		const box: Box = [x, y, x, y];
		for (let index = 2; index + 1 < numbers.length; index += 2) {
			x += numbers[index];
			y += numbers[index + 1];
			if (x < box[0]) box[0] = x;
			if (y < box[1]) box[1] = y;
			if (x > box[2]) box[2] = x;
			if (y > box[3]) box[3] = y;
		}
		boxes.push(box);
	}

	return boxes;
}

/** La caja de la silueta entera, con todos sus territorios. */
export function getPathBox(d: string): Box | undefined {
	return unionBoxes(getSubpathBoxes(d));
}

export function boxesIntersect(a: Box, b: Box): boolean {
	return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}

export function containsBox(outer: Box, inner: Box): boolean {
	return (
		outer[0] <= inner[0] &&
		outer[1] <= inner[1] &&
		outer[2] >= inner[2] &&
		outer[3] >= inner[3]
	);
}

/** `box` con `ratio` veces su tamaño de más por cada lado. */
export function expandBox(box: Box, ratio: number): Box {
	const dx = (box[2] - box[0]) * ratio;
	const dy = (box[3] - box[1]) * ratio;
	return [box[0] - dx, box[1] - dy, box[2] + dx, box[3] + dy];
}

export function getBoxArea(box: Box): number {
	return (box[2] - box[0]) * (box[3] - box[1]);
}

/** Lo que `box` tiene dentro de `limits`. Si no se tocan, una caja sin tamaño en el borde de `limits`. */
export function clampBox(box: Box, limits: Box): Box {
	const clamp = (value: number, min: number, max: number) =>
		Math.min(Math.max(value, min), max);
	return [
		clamp(box[0], limits[0], limits[2]),
		clamp(box[1], limits[1], limits[3]),
		clamp(box[2], limits[0], limits[2]),
		clamp(box[3], limits[1], limits[3]),
	];
}

/**
 * La caja más pequeña de proporción `ratio` (ancho / alto) que cubre `box`,
 * centrada en ella: dónde va una imagen de esa proporción para llenar `box`
 * sin deformarse (lo que sobra queda fuera, a partes iguales).
 */
export function coverBox(box: Box, ratio: number): Box {
	const width = Math.max(box[2] - box[0], (box[3] - box[1]) * ratio);
	const height = width / ratio;
	const centerX = (box[0] + box[2]) / 2;
	const centerY = (box[1] + box[3]) / 2;
	return [
		centerX - width / 2,
		centerY - height / 2,
		centerX + width / 2,
		centerY + height / 2,
	];
}

/**
 * Un territorio se pinta con la misma bandera que otro si queda a menos de
 * esto de él, en proporción al lado mayor del grupo: Tierra del Fuego va con
 * Argentina; Alaska y Hawái llevan cada una su bandera.
 */
const FLAG_GROUP_GAP_RATIO = 0.25;
/**
 * Un territorio grande (más de esta parte del mayor del grupo) solo se une si
 * está casi pegado: las dos islas de Nueva Zelanda comparten bandera; Alaska,
 * que es grande y queda lejos, lleva la suya.
 */
const FLAG_GROUP_LARGE_AREA_RATIO = 0.25;
const FLAG_GROUP_LARGE_GAP_RATIO = 0.05;

function getGap(a: Box, b: Box): number {
	const dx = Math.max(a[0] - b[2], b[0] - a[2], 0);
	const dy = Math.max(a[1] - b[3], b[1] - a[3], 0);
	return Math.hypot(dx, dy);
}

/**
 * Dónde pintar la bandera de un país para que cubra toda su silueta: una caja
 * por grupo de territorios cercanos. Con una sola caja sobre el territorio
 * principal las islas quedaban sin bandera; con una sola sobre todo el país,
 * la de Francia se estiraría hasta la Guayana y en la metrópoli solo se vería
 * una franja.
 */
export function getFlagBoxes(d: string): Box[] {
	// De mayor a menor: cada territorio se une al grupo que tenga más cerca (la
	// distancia se mide al territorio del que nació el grupo) o, si ninguno le
	// queda cerca, empieza uno.
	const territories = getSubpathBoxes(d).sort(
		(a, b) => getBoxArea(b) - getBoxArea(a),
	);
	const groups: { seed: Box; members: Box[] }[] = [];

	for (const territory of territories) {
		let nearest: { seed: Box; members: Box[] } | undefined;
		let nearestGap = Number.POSITIVE_INFINITY;

		for (const group of groups) {
			const { seed } = group;
			const side = Math.max(seed[2] - seed[0], seed[3] - seed[1]);
			const isLarge =
				getBoxArea(territory) > getBoxArea(seed) * FLAG_GROUP_LARGE_AREA_RATIO;
			const reach =
				side * (isLarge ? FLAG_GROUP_LARGE_GAP_RATIO : FLAG_GROUP_GAP_RATIO);
			const gap = getGap(seed, territory);
			if (gap <= reach && gap < nearestGap) {
				nearest = group;
				nearestGap = gap;
			}
		}

		if (nearest) nearest.members.push(territory);
		else groups.push({ seed: territory, members: [] });
	}

	return groups.map(
		({ seed, members }) => unionBoxes([seed, ...members]) ?? seed,
	);
}
