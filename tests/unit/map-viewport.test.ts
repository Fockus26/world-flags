/**
 * La cámara del mapa (`utils/map-viewport.ts`). Cubre:
 *
 * - No se puede salir del mundo: ni reducir más que el mapa entero, ni
 *   arrastrar hasta enseñar lo de fuera, ni ampliar sin límite.
 * - Ampliar deja quieto el punto bajo el cursor o el pellizco.
 * - Encuadrar una caja la deja entera a la vista, con su margen.
 * - Pantalla ↔ mapa es ida y vuelta.
 * - Las flechas del teclado llegan a todos los países del mapa real, y
 *   "derecha" no salta a algo que está sobre todo arriba.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { countries } from "@/data/countries";
import worldMapJson from "@/data/world-map.json";
import type { WorldMapData } from "@/types/world-map";
import {
	clampView,
	type Direction,
	findClosest,
	findNeighbor,
	fitBox,
	getFocusBox,
	getMaxScale,
	getMinScale,
	getWorldView,
	getZoom,
	isVisible,
	MAX_ZOOM,
	type Point,
	panBy,
	toMap,
	toScreen,
	unionBoxes,
	zoomAt,
} from "@/utils/map-viewport";

const worldMap = worldMapJson as unknown as WorldMapData;
const MAP = { width: 10_000, height: 4_437 };
/** Un móvil en vertical: el mapa cabe a lo ancho y sobra alto. */
const PHONE = { width: 360, height: 480 };
/** Un lienzo más apaisado que el mapa: cabe a lo alto y sobra ancho. */
const WIDE = { width: 1600, height: 400 };

const near = (actual: number, expected: number, message?: string) =>
	assert.ok(Math.abs(actual - expected) < 1e-6, message ?? `${actual}`);

describe("cámara del mapa", () => {
	test("el mundo entero cabe en el lienzo y queda centrado", () => {
		for (const canvas of [PHONE, WIDE]) {
			const view = getWorldView(MAP, canvas);

			assert.ok(MAP.width * view.scale <= canvas.width + 1e-6);
			assert.ok(MAP.height * view.scale <= canvas.height + 1e-6);
			assert.deepEqual(toScreen([5_000, 2_218.5], view, canvas), [
				canvas.width / 2,
				canvas.height / 2,
			]);
			near(getZoom(view, MAP, canvas), 1);
		}
	});

	test("no se reduce más que el mundo entero ni se amplía más que el tope", () => {
		const tooFar = clampView({ center: [0, 0], scale: 1e-9 }, MAP, PHONE);
		const tooClose = clampView({ center: [0, 0], scale: 1e9 }, MAP, PHONE);

		near(tooFar.scale, getMinScale(MAP, PHONE));
		near(tooClose.scale, getMaxScale(MAP, PHONE));
		near(getZoom(tooClose, MAP, PHONE), MAX_ZOOM);
	});

	test("arrastrando no se ve nada de fuera del mapa", () => {
		const start = zoomAt(getWorldView(MAP, PHONE), 8, [180, 240], MAP, PHONE);
		const view = panBy(start, 1e6, 1e6, MAP, PHONE);
		const [left, top] = toMap([0, 0], view, PHONE);

		near(left, 0);
		near(top, 0);

		const opposite = panBy(start, -1e6, -1e6, MAP, PHONE);
		const [right, bottom] = toMap([PHONE.width, PHONE.height], opposite, PHONE);

		near(right, MAP.width);
		near(bottom, MAP.height);
	});

	test("en el eje donde el mapa no llena el lienzo, va centrado", () => {
		const view = panBy(getWorldView(MAP, PHONE), 50, 90, MAP, PHONE);

		assert.deepEqual(view.center, [MAP.width / 2, MAP.height / 2]);
	});

	test("arrastrar mueve el mapa lo mismo que el dedo", () => {
		const start = zoomAt(getWorldView(MAP, PHONE), 10, [180, 240], MAP, PHONE);
		const grabbed = toMap([100, 200], start, PHONE);
		const view = panBy(start, 30, -20, MAP, PHONE);
		const [x, y] = toScreen(grabbed, view, PHONE);

		near(x, 130);
		near(y, 180);
	});

	test("ampliar deja quieto el punto bajo el cursor", () => {
		const start = zoomAt(getWorldView(MAP, PHONE), 6, [180, 240], MAP, PHONE);
		const anchor: Point = [250, 260];
		const before = toMap(anchor, start, PHONE);
		const view = zoomAt(start, 2, anchor, MAP, PHONE);
		const after = toMap(anchor, view, PHONE);

		near(view.scale, start.scale * 2);
		near(after[0], before[0]);
		near(after[1], before[1]);
	});

	test("pantalla y mapa son ida y vuelta", () => {
		const view = zoomAt(getWorldView(MAP, WIDE), 5, [900, 120], MAP, WIDE);
		const [x, y] = toScreen(toMap([321, 123], view, WIDE), view, WIDE);

		near(x, 321);
		near(y, 123);
	});

	test("encuadrar una caja la deja entera a la vista, con su margen", () => {
		const padding = 24;
		const europe = unionBoxes(
			["pt", "fi", "gr", "is"].map((code) => worldMap.countries[code].bbox),
		);
		assert.ok(europe);

		const view = fitBox(europe, MAP, PHONE, padding);
		const [x0, y0] = toScreen([europe[0], europe[1]], view, PHONE);
		const [x1, y1] = toScreen([europe[2], europe[3]], view, PHONE);

		assert.ok(x0 >= padding - 1e-6 && x1 <= PHONE.width - padding + 1e-6);
		assert.ok(y0 >= padding - 1e-6 && y1 <= PHONE.height - padding + 1e-6);
		assert.ok(getZoom(view, MAP, PHONE) > 3);
		assert.ok(isVisible(worldMap.countries.de.centroid, view, PHONE));
		assert.ok(!isVisible(worldMap.countries.br.centroid, view, PHONE));
	});

	test("encuadrar un punto no rompe: queda a la ampliación máxima", () => {
		const view = fitBox(worldMap.countries.tv.bbox, MAP, PHONE, 24);

		near(getZoom(view, MAP, PHONE), MAX_ZOOM);
		assert.ok(isVisible(worldMap.countries.tv.centroid, view, PHONE));
	});

	test("volar a un continente no lo estira por un país enorme ni por el corte del mapa", () => {
		const boxOf = (region: string) =>
			getFocusBox(
				countries
					.filter((country) => country.region === region)
					.map(({ code }) => worldMap.countries[code].bbox),
			);
		const europe = boxOf("europe");
		const oceania = boxOf("oceania");
		assert.ok(europe && oceania);

		// Sin Rusia, Europa acaba antes de los Urales; con Kiribati en Tarawa,
		// Oceanía no cruza el mapa.
		assert.ok(europe[2] - europe[0] < MAP.width / 4, `${europe}`);
		assert.ok(oceania[2] - oceania[0] < MAP.width / 3, `${oceania}`);
		// Con tres países o menos no se quita ninguno.
		assert.deepEqual(
			getFocusBox([worldMap.countries.us.bbox, worldMap.countries.mx.bbox]),
			unionBoxes([worldMap.countries.us.bbox, worldMap.countries.mx.bbox]),
		);
	});

	test("sin cajas no hay unión", () => {
		assert.equal(unionBoxes([]), undefined);
	});
});

describe("foco de teclado en el mapa", () => {
	const candidates = Object.entries(worldMap.countries).map(
		([code, { centroid }]) => ({ code, point: centroid }),
	);
	const DIRECTIONS: Direction[] = ["up", "down", "left", "right"];
	const neighbor = (code: string, direction: Direction) =>
		findNeighbor(
			worldMap.countries[code].centroid,
			direction,
			candidates.filter((candidate) => candidate.code !== code),
		);

	test("el salto va hacia el lado de la flecha", () => {
		for (const { code, point } of candidates) {
			for (const direction of DIRECTIONS) {
				const next = neighbor(code, direction);
				if (!next) continue;

				const [x, y] = worldMap.countries[next].centroid;
				const dx = x - point[0];
				const dy = y - point[1];
				const along = { up: -dy, down: dy, left: -dx, right: dx }[direction];
				const across = direction === "up" || direction === "down" ? dx : dy;

				assert.ok(along > 0, `${code} ${direction} → ${next}`);
				assert.ok(Math.abs(across) <= along, `${code} ${direction} → ${next}`);
			}
		}
	});

	test("vecinos que se saben", () => {
		assert.equal(neighbor("pt", "right"), "es");
		assert.equal(neighbor("mx", "up"), "us");
		assert.equal(neighbor("uy", "up"), "py");
	});

	test("con las flechas se llega a todos los países", () => {
		const reached = new Set(["es"]);
		const queue = ["es"];
		for (let code = queue.shift(); code; code = queue.shift()) {
			for (const direction of DIRECTIONS) {
				const next = neighbor(code, direction);
				if (next && !reached.has(next)) {
					reached.add(next);
					queue.push(next);
				}
			}
		}

		assert.deepEqual(
			candidates.map(({ code }) => code).filter((code) => !reached.has(code)),
			[],
		);
	});

	test("el primer foco es el país más cercano al centro de la vista", () => {
		assert.equal(findClosest(worldMap.countries.fr.centroid, candidates), "fr");
		assert.equal(findClosest([0, 0], []), undefined);
	});
});
