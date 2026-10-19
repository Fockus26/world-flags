/**
 * Contraste del color de la nota de Resultados ("/10" y el número) sobre su
 * fondo (D196). Lo que se protege:
 *
 * - En oscuro, las 10 notas dan ≥4,5:1 (texto normal, AA). Antes la nota 1
 *   (rojo) quedaba en el límite.
 * - En oscuro solo se aclara lo que no llegaba: de la 2 a la 10 el color es el
 *   de siempre (L 68 %).
 * - En claro, el color de la nota (borde) no cambia; el texto del círculo
 *   (`getScoreTextColor`) se mezcla hacia `--foreground` y da ≥4,5:1 en las
 *   10 notas (P58, D204).
 *
 * El contraste se calcula aquí aparte (hsl → sRGB → luminancia WCAG), sin
 * reutilizar el cálculo de `score.ts`.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
	getScoreBackgroundColor,
	getScoreColor,
	getScoreTextColor,
} from "../../src/utils/score";

function parseHsl(value: string): [number, number, number] {
	const match =
		/^hsl\((\d+(?:\.\d+)?) (\d+(?:\.\d+)?)% (\d+(?:\.\d+)?)%\)$/.exec(value);
	assert.ok(match, `hsl() inesperado: ${value}`);
	return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function hslToRgb([h, s, l]: [number, number, number]): number[] {
	const sat = s / 100;
	const light = l / 100;
	const chroma = (1 - Math.abs(2 * light - 1)) * sat;
	const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = light - chroma / 2;
	const [r, g, b] =
		h < 60
			? [chroma, x, 0]
			: h < 120
				? [x, chroma, 0]
				: h < 180
					? [0, chroma, x]
					: [0, x, chroma];
	return [r + m, g + m, b + m];
}

function luminance(rgb: number[]): number {
	const [r, g, b] = rgb.map((c) =>
		c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
	);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(fg: string, bg: string): number {
	const a = luminance(hslToRgb(parseHsl(fg)));
	const b = luminance(hslToRgb(parseHsl(bg)));
	return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

// `--foreground` en claro (`heroui-theme.css`): el texto principal.
const LIGHT_FOREGROUND = [0x1c / 255, 0x1b / 255, 0x2e / 255];

function linear(c: number): number {
	return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function gamma(c: number): number {
	const v = Math.min(1, Math.max(0, c));
	return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
}

function toOklab(rgb: number[]): number[] {
	const [r, g, b] = rgb.map(linear);
	const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
	return [
		0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
		1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
		0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
	];
}

function fromOklab([L, A, B]: number[]): number[] {
	const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
	const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
	const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
	return [
		4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
	].map(gamma);
}

/** Resuelve `color-mix(in oklab, hsl(...) N%, var(--foreground))` en claro. */
function resolveLightMix(value: string): number[] {
	const match =
		/^color-mix\(in oklab, (hsl\([^)]+\)) (\d+)%, var\(--foreground\)\)$/.exec(
			value,
		);
	assert.ok(match, `color-mix() inesperado: ${value}`);
	const weight = Number(match[2]) / 100;
	const a = toOklab(hslToRgb(parseHsl(match[1])));
	const b = toOklab(LIGHT_FOREGROUND);
	return fromOklab(a.map((v, i) => v * weight + b[i] * (1 - weight)));
}

const scores = Array.from({ length: 10 }, (_, index) => index + 1);

describe("color de la nota en oscuro", () => {
	for (const score of scores) {
		test(`nota ${score}: ≥4,5:1 sobre su fondo`, () => {
			const ratio = contrast(
				getScoreColor(score, true),
				getScoreBackgroundColor(score, true),
			);
			assert.ok(ratio >= 4.5, `nota ${score}: ${ratio.toFixed(2)}:1`);
		});
	}

	test("la nota 1 se aclara; de la 2 a la 10 siguen en L 68 %", () => {
		assert.ok(parseHsl(getScoreColor(1, true))[2] > 68);
		for (const score of scores.slice(1)) {
			assert.equal(parseHsl(getScoreColor(score, true))[2], 68);
		}
	});

	test("los fondos no cambian", () => {
		for (const score of scores) {
			assert.equal(parseHsl(getScoreBackgroundColor(score, true))[2], 22);
		}
	});
});

describe("color de la nota en claro", () => {
	test("sin cambios: L 42 % sobre L 94 %", () => {
		for (const score of scores) {
			assert.equal(parseHsl(getScoreColor(score))[2], 42);
			assert.equal(parseHsl(getScoreBackgroundColor(score))[2], 94);
		}
	});

	for (const score of scores) {
		test(`nota ${score}: el texto del círculo da ≥4,5:1 sobre su fondo`, () => {
			const text = luminance(resolveLightMix(getScoreTextColor(score)));
			const background = luminance(
				hslToRgb(parseHsl(getScoreBackgroundColor(score))),
			);
			const ratio =
				(Math.max(text, background) + 0.05) /
				(Math.min(text, background) + 0.05);
			assert.ok(ratio >= 4.5, `nota ${score}: ${ratio.toFixed(2)}:1`);
		});
	}

	test("en oscuro el texto es el color de la nota tal cual", () => {
		for (const score of scores) {
			assert.equal(getScoreTextColor(score, true), getScoreColor(score, true));
		}
	});
});
