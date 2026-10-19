/**
 * `normalizeLearningData` valida el perfil campo a campo: un valor con otro
 * tipo (p. ej. `name` = 123 en el almacenamiento) vuelve al valor por defecto
 * en vez de llegar a la UI y tumbarla (`truncateName` iteraba el nombre).
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { UserLearningData } from "@/types/progress";
import {
	DEFAULT_PROFILE,
	normalizeLearningData,
} from "@/utils/learning-storage";

function normalizeProfile(profile: unknown) {
	return normalizeLearningData({
		profile,
	} as unknown as Partial<UserLearningData>).profile;
}

describe("normalizeLearningData: perfil", () => {
	test("un perfil válido se conserva tal cual", () => {
		const profile = {
			name: "Ana",
			avatarStyle: "fun-emoji",
			avatarSeed: "explorer-3",
		};

		assert.deepEqual(normalizeProfile(profile), profile);
	});

	test("un name que no es texto vuelve al nombre por defecto", () => {
		const profile = normalizeProfile({
			name: 123,
			avatarStyle: "fun-emoji",
			avatarSeed: "explorer-3",
		});

		assert.equal(profile.name, DEFAULT_PROFILE.name);
		assert.equal(profile.avatarStyle, "fun-emoji");
		assert.equal(profile.avatarSeed, "explorer-3");
	});

	test("un estilo de avatar desconocido y una semilla no textual se descartan", () => {
		const profile = normalizeProfile({
			name: "Ana",
			avatarStyle: "no-existe",
			avatarSeed: ["x"],
		});

		assert.deepEqual(profile, {
			name: "Ana",
			avatarStyle: DEFAULT_PROFILE.avatarStyle,
			avatarSeed: DEFAULT_PROFILE.avatarSeed,
		});
	});

	test("sin perfil, o con un perfil que no es un objeto, sale el de por defecto", () => {
		assert.deepEqual(normalizeProfile(undefined), DEFAULT_PROFILE);
		assert.deepEqual(normalizeProfile(null), DEFAULT_PROFILE);
		assert.deepEqual(normalizeProfile("Ana"), DEFAULT_PROFILE);
	});

	test("los campos que faltan se rellenan con los de por defecto", () => {
		assert.deepEqual(normalizeProfile({ name: "Ana" }), {
			...DEFAULT_PROFILE,
			name: "Ana",
		});
	});
});
