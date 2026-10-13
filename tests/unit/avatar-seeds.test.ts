/**
 * Botón de dado de los avatares (D190): tandas de seeds nuevos sin repetidos
 * y el avatar elegido siempre visible en la rejilla.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
	AVATAR_SEEDS,
	createRandomAvatarSeeds,
	withSelectedAvatarSeed,
} from "@/utils/avatar";

/** `random` determinista: recorre una secuencia fija. */
function sequence(values: number[]): () => number {
	let index = 0;
	return () => values[index++ % values.length] ?? 0;
}

describe("createRandomAvatarSeeds", () => {
	test("devuelve tantos seeds como se piden, sin repetidos", () => {
		const seeds = createRandomAvatarSeeds(8);
		assert.equal(seeds.length, 8);
		assert.equal(new Set(seeds).size, 8);
		for (const seed of seeds) assert.match(seed, /^explorer-[a-z0-9]{6}$/);
	});

	test("es determinista con un random inyectado", () => {
		const values = [0.1, 0.5, 0.9, 0.3, 0.7, 0.2, 0.05, 0.95];
		assert.deepEqual(
			createRandomAvatarSeeds(4, sequence(values)),
			createRandomAvatarSeeds(4, sequence(values)),
		);
	});

	test("con un random fijo no entra en bucle y sigue sin repetir", () => {
		const seeds = createRandomAvatarSeeds(8, () => 0);
		assert.equal(seeds.length, 8);
		assert.equal(new Set(seeds).size, 8);
	});

	test("cero seeds es una tanda vacía", () => {
		assert.deepEqual(createRandomAvatarSeeds(0), []);
	});
});

describe("withSelectedAvatarSeed", () => {
	test("si el elegido ya está, la tanda no cambia", () => {
		assert.deepEqual(
			withSelectedAvatarSeed(AVATAR_SEEDS, "explorer-3"),
			AVATAR_SEEDS,
		);
	});

	test("si no está, ocupa la primera casilla y sale el último", () => {
		const result = withSelectedAvatarSeed(AVATAR_SEEDS, "explorer-abc123");
		assert.equal(result.length, AVATAR_SEEDS.length);
		assert.equal(result[0], "explorer-abc123");
		assert.deepEqual(result.slice(1), AVATAR_SEEDS.slice(0, -1));
	});

	test("no muta la tanda original", () => {
		const seeds = ["a", "b"];
		withSelectedAvatarSeed(seeds, "c");
		assert.deepEqual(seeds, ["a", "b"]);
	});

	test("sin elegido (cadena vacía) no inserta nada", () => {
		assert.deepEqual(withSelectedAvatarSeed(["a", "b"], ""), ["a", "b"]);
	});
});
