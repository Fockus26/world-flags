import type { AvatarStyle } from "@/types/progress";

export const AVATAR_SEEDS = [
	"explorer-1",
	"explorer-2",
	"explorer-3",
	"explorer-4",
	"explorer-5",
	"explorer-6",
	"explorer-7",
	"explorer-8",
];

export function getAvatarUrl(style: AvatarStyle, seed: string): string {
	return `https://api.dicebear.com/10.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

const SEED_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const SEED_TOKEN_LENGTH = 6;

/**
 * Tanda de seeds nuevos para el botón de dado (D190). El seed es texto libre
 * (dicebear dibuja cualquiera y ni la base ni el ranking lo restringen), así
 * que basta un sufijo aleatorio: `explorer-k3x9qa`. Sin repetidos dentro de
 * la tanda; si `random` no da para tantos distintos (un `random` fijo en
 * tests), se completa numerando para no quedarse en bucle.
 */
export function createRandomAvatarSeeds(
	count: number,
	random: () => number = Math.random,
): string[] {
	const seeds = new Set<string>();

	for (let attempt = 0; seeds.size < count && attempt < count * 10; attempt++) {
		let token = "";
		for (let i = 0; i < SEED_TOKEN_LENGTH; i++) {
			token += SEED_ALPHABET[Math.floor(random() * SEED_ALPHABET.length)];
		}
		seeds.add(`explorer-${token}`);
	}

	const result = [...seeds];
	for (let i = 0; result.length < count; i++) {
		const fallback = `${result[0] ?? "explorer"}-${i}`;
		if (!result.includes(fallback)) result.push(fallback);
	}

	return result;
}

/**
 * El avatar elegido nunca desaparece de la rejilla (D190): si la tanda no lo
 * trae, ocupa la primera casilla y sale el último de la tanda, así la rejilla
 * sigue teniendo el mismo número de opciones.
 */
export function withSelectedAvatarSeed(
	seeds: readonly string[],
	selectedSeed: string,
): string[] {
	if (!selectedSeed || seeds.includes(selectedSeed)) return [...seeds];
	return [selectedSeed, ...seeds.slice(0, Math.max(seeds.length - 1, 0))];
}
