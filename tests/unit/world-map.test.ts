/**
 * El mapa generado del modo Mapa (`data/world-map.json`, lo escribe
 * `bun run map:build`). Cubre:
 *
 * - Una entrada por país del catálogo, ni una más: un país sin entrada no se
 *   podría tocar ni preguntar.
 * - Cada país tiene silueta, salvo los que la fuente no trae (Tuvalu), que
 *   solo tienen punto.
 * - Centro y caja dentro del mapa, y el centro dentro de su caja: de ahí
 *   salen el marcador y el vuelo hasta el país.
 * - La caja es la de los territorios principales: la de Francia no cruza el
 *   Atlántico por la Guayana ni la de Kiribati el mapa entero.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { countries } from "@/data/countries";
import worldMapJson from "@/data/world-map.json";
import type { WorldMapData } from "@/types/world-map";

const worldMap: WorldMapData = worldMapJson as unknown as WorldMapData;

/** Países que Natural Earth 1:50m no trae: solo punto. */
const POINT_ONLY = ["tv"];

describe("mapa del mundo", () => {
	test("tiene una entrada por país del catálogo y ninguna más", () => {
		assert.deepEqual(
			Object.keys(worldMap.countries).sort(),
			countries.map(({ code }) => code).sort(),
		);
	});

	test("cada país tiene silueta, salvo los que solo tienen punto", () => {
		const withoutShape = Object.entries(worldMap.countries)
			.filter(([, { d }]) => d === "")
			.map(([code]) => code);

		assert.deepEqual(withoutShape, POINT_ONLY);
	});

	test("las siluetas son trazados cerrados y sin números rotos", () => {
		for (const [code, { d }] of Object.entries(worldMap.countries)) {
			if (d === "") continue;

			assert.match(d, /^M[-\d.,]+l[-\d., ]+z/, code);
			assert.doesNotMatch(d, /NaN|Infinity|e/, code);
			assert.ok(d.endsWith("z"), code);
		}
		assert.match(worldMap.land, /^M/);
	});

	test("cada silueta, al dibujarla, cae dentro del mapa y cubre su caja", () => {
		// Los trazados van en desplazamientos (`l`): un paso mal escrito
		// movería todo lo que viene después. Se rehacen los puntos aquí.
		for (const [code, { d, bbox }] of Object.entries(worldMap.countries)) {
			if (d === "") continue;

			let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];
			for (const subpath of d.split("M").slice(1)) {
				const [start, steps] = subpath.replace("z", "").split("l");
				const numbers = (text: string) =>
					(text.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
				let [x, y] = numbers(start);
				const deltas = numbers(steps);
				assert.equal(deltas.length % 2, 0, code);

				for (let i = -2; i < deltas.length; i += 2) {
					if (i >= 0) {
						x += deltas[i];
						y += deltas[i + 1];
					}
					minX = Math.min(minX, x);
					minY = Math.min(minY, y);
					maxX = Math.max(maxX, x);
					maxY = Math.max(maxY, y);
				}
			}

			// Un punto de margen: la silueta va redondeada y simplificada.
			const margin = 3;
			assert.ok(minX >= -margin && maxX <= worldMap.width + margin, code);
			assert.ok(minY >= -margin && maxY <= worldMap.height + margin, code);
			assert.ok(minX <= bbox[0] + margin && maxX >= bbox[2] - margin, code);
			assert.ok(minY <= bbox[1] + margin && maxY >= bbox[3] - margin, code);
		}
	});

	test("el centro y la caja de cada país caen dentro del mapa", () => {
		const { width, height } = worldMap;

		for (const [code, country] of Object.entries(worldMap.countries)) {
			const [x, y] = country.centroid;
			const [x0, y0, x1, y1] = country.bbox;

			assert.ok(x0 >= 0 && x1 <= width && y0 >= 0 && y1 <= height, code);
			assert.ok(x0 <= x1 && y0 <= y1, code);
			assert.ok(x >= x0 && x <= x1 && y >= y0 && y <= y1, code);
		}
	});

	test("la caja no cruza el mapa por un territorio lejano", () => {
		const widthOf = (code: string) => {
			const [x0, , x1] = worldMap.countries[code].bbox;
			return x1 - x0;
		};

		// Rusia es el país más ancho; nada debería acercarse al mapa entero.
		for (const { code } of countries) {
			assert.ok(widthOf(code) <= widthOf("ru"), code);
		}
		assert.ok(widthOf("fr") < worldMap.width / 20);
		assert.ok(widthOf("ki") < worldMap.width / 20);
	});
});
