/**
 * Cajas de las siluetas del mapa (`utils/map-paths.ts`): de ellas depende qué
 * países se dibujan y que la bandera cubra el país entero.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import worldMapJson from "@/data/world-map.json";
import type { WorldMapData } from "@/types/world-map";
import {
	boxesIntersect,
	containsBox,
	expandBox,
	getFlagBoxes,
	getPathBox,
	getSubpathBoxes,
} from "@/utils/map-paths";

const worldMap = worldMapJson as unknown as WorldMapData;

describe("cajas de un trazado", () => {
	test("lee el primer punto absoluto y los pasos relativos, con y sin coma", () => {
		assert.deepEqual(getSubpathBoxes("M10,20l5,0 0,5-5,0zM100,100l-2-3 4,1z"), [
			[10, 20, 15, 25],
			[98, 97, 102, 100],
		]);
	});

	test("lee decimales", () => {
		assert.deepEqual(getPathBox("M1.5,2l0.5-0.5 1,1.5z"), [1.5, 1.5, 3, 3]);
	});

	test("un trazado vacío no tiene caja", () => {
		assert.equal(getPathBox(""), undefined);
	});

	test("la caja entera de cada país contiene la de su territorio principal", () => {
		for (const [code, { d, bbox }] of Object.entries(worldMap.countries)) {
			if (d === "") continue;
			const box = getPathBox(d);
			assert.ok(box, code);
			// El trazado va redondeado (a la unidad, o a la décima en las islas
			// pequeñas) y la caja del JSON no: una unidad de holgura.
			const loose: [number, number, number, number] = [
				box[0] - 1,
				box[1] - 1,
				box[2] + 1,
				box[3] + 1,
			];
			assert.ok(containsBox(loose, bbox), code);
		}
	});
});

describe("dónde va la bandera", () => {
	test("entre todas las cajas cubren todos los territorios de cada país", () => {
		for (const [code, { d }] of Object.entries(worldMap.countries)) {
			if (d === "") continue;
			const flagBoxes = getFlagBoxes(d);
			for (const territory of getSubpathBoxes(d)) {
				assert.ok(
					flagBoxes.some((box) => containsBox(box, territory)),
					`${code}: un territorio queda sin bandera`,
				);
			}
		}
	});

	test("Argentina lleva una sola bandera, con Tierra del Fuego dentro", () => {
		const { d, bbox } = worldMap.countries.ar;
		const boxes = getFlagBoxes(d);
		assert.equal(boxes.length, 1);
		assert.ok(
			boxes[0][3] > bbox[3],
			"llega más al sur que el territorio principal",
		);
	});

	test("Estados Unidos: el territorio continental y Alaska llevan cada uno su bandera", () => {
		const { d, bbox } = worldMap.countries.us;
		const [mainland, alaska] = getFlagBoxes(d);
		// La caja del JSON va de Alaska a Florida: la del continente es menor.
		assert.ok(mainland[2] - mainland[0] < (bbox[2] - bbox[0]) * 0.8);
		assert.ok(alaska[2] < mainland[2] && alaska[1] < mainland[1]);
	});

	test("Nueva Zelanda: las dos islas comparten bandera", () => {
		const boxes = getFlagBoxes(worldMap.countries.nz.d);
		const [largest] = getSubpathBoxes(worldMap.countries.nz.d).sort(
			(a, b) => (b[2] - b[0]) * (b[3] - b[1]) - (a[2] - a[0]) * (a[3] - a[1]),
		);
		assert.ok(boxes[0][3] - boxes[0][1] > (largest[3] - largest[1]) * 1.3);
	});
});

describe("zona dibujada", () => {
	test("dos cajas que se tocan se cruzan; separadas, no", () => {
		assert.ok(boxesIntersect([0, 0, 10, 10], [10, 10, 20, 20]));
		assert.ok(!boxesIntersect([0, 0, 10, 10], [11, 0, 20, 10]));
	});

	test("ampliar una caja la hace crecer por los cuatro lados", () => {
		assert.deepEqual(expandBox([0, 0, 10, 20], 0.5), [-5, -10, 15, 30]);
	});
});
