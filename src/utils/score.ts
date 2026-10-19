export function calculateScore(
	correctAnswers: number,
	totalCountries: number,
): number {
	if (totalCountries <= 0) {
		return 1;
	}

	const rawScore = Math.round((correctAnswers / totalCountries) * 10);

	return Math.min(10, Math.max(1, rawScore));
}

/**
 * Contraste mínimo del color de la nota sobre su fondo en oscuro (D196).
 * Pide 4,5:1 (texto "/10"); se deja un margen porque la nota 1 daba 4,55:1
 * con L 68 % y en pantalla, durante la entrada, se medía 4,39:1.
 */
const DARK_SCORE_MIN_CONTRAST = 4.8;

function scoreHue(score: number): number {
	const normalizedScore = Math.min(10, Math.max(1, score));
	const progress = (normalizedScore - 1) / 9;

	return Math.round(progress * 120);
}

/** Luminancia relativa (WCAG 2.x) de un `hsl()` con s y l en %. */
function hslLuminance(hue: number, saturation: number, lightness: number) {
	const s = saturation / 100;
	const l = lightness / 100;
	const a = s * Math.min(l, 1 - l);
	const channel = (n: number) => {
		const k = (n + hue / 30) % 12;
		const value = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));

		return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
	};

	return 0.2126 * channel(0) + 0.7152 * channel(8) + 0.0722 * channel(4);
}

/**
 * Luminosidad del color de la nota en oscuro: 68 % salvo en los tonos que
 * con ella no llegan a `DARK_SCORE_MIN_CONTRAST` contra su fondo (en la
 * práctica, el rojo de la nota 1), que se aclaran lo justo. Las demás notas
 * no cambian de aspecto.
 */
function darkScoreLightness(hue: number): number {
	const background = hslLuminance(hue, 48, 22);
	let lightness = 68;

	while (
		lightness < 90 &&
		(hslLuminance(hue, 72, lightness) + 0.05) / (background + 0.05) <
			DARK_SCORE_MIN_CONTRAST
	) {
		lightness += 1;
	}

	return lightness;
}

export function getScoreColor(score: number, isDark = false): string {
	const hue = scoreHue(score);
	const lightness = isDark ? darkScoreLightness(hue) : 42;

	return `hsl(${hue} 72% ${lightness}%)`;
}

/**
 * Parte del color de la nota que va hacia el texto en claro (P58, D204). El
 * color de la nota en claro (L 42 %) daba 2,1–3,8:1 sobre su fondo; mezclado
 * con `--foreground` al 58 % queda entre 4,91:1 (nota 6) y 8,37:1 (nota 1).
 * Con 62 % (lo de `Button`), la nota 6 se quedaba justo en 4,50:1, sin margen.
 */
const LIGHT_SCORE_TEXT_MIX = 58;

/**
 * Color del número y de "/10" en Resultados. En oscuro, el de la nota tal cual
 * (D196, ya pasa AA). En claro, mezclado hacia el texto: conserva el tono y
 * llega a 4,5:1. El borde del círculo sigue con `getScoreColor`.
 */
export function getScoreTextColor(score: number, isDark = false): string {
	const color = getScoreColor(score, isDark);

	return isDark
		? color
		: `color-mix(in oklab, ${color} ${LIGHT_SCORE_TEXT_MIX}%, var(--foreground))`;
}

export function getScoreBackgroundColor(score: number, isDark = false): string {
	const hue = scoreHue(score);
	const lightness = isDark ? 22 : 94;
	const saturation = isDark ? 48 : 72;

	return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

export function getScoreMessage(score: number): string {
	if (score === 10) {
		return "Dominio excelente";
	}

	if (score >= 8) {
		return "Muy buen resultado";
	}

	if (score >= 6) {
		return "Buen progreso";
	}

	if (score >= 4) {
		return "Necesitas seguir practicando";
	}

	return "Conviene repetir esta región";
}
