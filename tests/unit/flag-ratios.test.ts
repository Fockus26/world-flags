/**
 * Proporciones de las banderas (`data/flag-ratios.ts`): con ellas se coloca la
 * bandera sobre la silueta del mapa (D242). Si una no es la de su SVG, la
 * bandera deja parte del país sin cubrir o se sale de más.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { countries } from "@/data/countries";
import { getFlagRatio } from "@/data/flag-ratios";

/** La proporción con la que el navegador pinta el SVG: `width`/`height` si los trae; si no, su `viewBox`. */
function readRatio(code: string): number {
	const svg = readFileSync(`public/flags/${code}.svg`, "utf8");
	const tag = svg.match(/<svg[^>]*>/)?.[0] ?? "";
	const width = tag.match(/\swidth="([\d.]+)(?:px)?"/)?.[1];
	const height = tag.match(/\sheight="([\d.]+)(?:px)?"/)?.[1];
	if (width && height) return Number(width) / Number(height);

	const viewBox = tag
		.match(/viewBox="([^"]+)"/)?.[1]
		.trim()
		.split(/[\s,]+/);
	assert.ok(viewBox, `${code}.svg no trae ni medidas ni viewBox`);
	return Number(viewBox[2]) / Number(viewBox[3]);
}

test("la proporción de cada bandera es la de su SVG", () => {
	const wrong = countries
		.map(({ code }) => ({ code, expected: readRatio(code) }))
		.filter(
			({ code, expected }) => Math.abs(getFlagRatio(code) - expected) > 0.001,
		)
		.map(({ code, expected }) => `${code}: ${expected.toFixed(4)}`);

	assert.deepEqual(wrong, []);
});
