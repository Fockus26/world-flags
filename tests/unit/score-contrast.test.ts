/**
 * Contraste del color de la nota de Resultados ("/10" y el número) sobre su
 * fondo (D196). Lo que se protege:
 *
 * - En oscuro, las 10 notas dan ≥4,5:1 (texto normal, AA). Antes la nota 1
 *   (rojo) quedaba en el límite.
 * - En oscuro solo se aclara lo que no llegaba: de la 2 a la 10 el color es el
 *   de siempre (L 68 %).
 * - En claro no cambia nada (fuera de esta decisión; ver D196).
 *
 * El contraste se calcula aquí aparte (hsl → sRGB → luminancia WCAG), sin
 * reutilizar el cálculo de `score.ts`.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { getScoreBackgroundColor, getScoreColor } from "../../src/utils/score";

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

	test("contraste en claro (informativo, ver D196)", () => {
		// Las notas 1–2 pasan 4,5:1; de la 3 a la 10 no (2,1–3,8:1). Queda
		// registrado como pendiente en D196: no lo cubre esta decisión.
		const ratios = scores.map((score) =>
			contrast(getScoreColor(score), getScoreBackgroundColor(score)),
		);
		assert.ok(ratios[0] >= 4.5 && ratios[1] >= 4.5);
	});
});
