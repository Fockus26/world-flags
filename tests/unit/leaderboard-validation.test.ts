/**
 * Validación del ranking en el servidor (D112–D114). Lo que se protege:
 *
 * - Los mínimos por scope salen del catálogo: cada uno de los 27 scopes
 *   vigentes (3 juegos × "Todo el mundo" y 8 continentes, D138) tiene el
 *   suyo, y es nº de países del alcance × 300 ms.
 * - Son generosos: batirlos exige teclear más rápido que cualquier humano.
 * - El SQL del trigger (la última migración que lo redefine, D211) dice los
 *   mismos números, rechaza los scopes sin ranking salvo los dos viejos
 *   (D114), y limita nombre y avatar a lo que acepta la app.
 * - El cliente no guarda como mejor marca un tiempo bajo el mínimo (D139).
 * - Un rechazo del servidor es definitivo (no se reintenta); un fallo de red
 *   o de servidor sí se reintenta (D050, D113).
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import { CAPITALS } from "@/data/capitals";
import { countries } from "@/data/countries";
import {
	GAME_TYPES,
	type GameType,
	getLeaderboardScope,
	LEADERBOARD_REGIONS,
	LEADERBOARD_SCOPES,
	REGIONS,
} from "@/types/country";
import { AVATAR_STYLES } from "@/types/progress";
import {
	getLeaderboardMinimums,
	getRushMinTimeMs,
	isBlankDisplayName,
	isLeaderboardTimeRejected,
	isPlausibleRushTime,
	LEADERBOARD_DISPLAY_NAME_MAX_LENGTH,
	LEADERBOARD_INVISIBLE_CODE_POINTS,
	LEADERBOARD_MIN_MS_PER_ANSWER,
	LEADERBOARD_TIME_REJECTED_CODE,
	shouldRetryLeaderboardUpload,
	toLeaderboardDisplayName,
} from "@/utils/leaderboard-validation";

const MIGRATIONS_DIR = join(
	dirname(fileURLToPath(import.meta.url)),
	"..",
	"..",
	"supabase",
	"migrations",
);

/** La última migración que redefine la función del trigger (D211, D217). */
const SQL_PATH = join(
	MIGRATIONS_DIR,
	readdirSync(MIGRATIONS_DIR)
		.filter((file) => file.endsWith(".sql"))
		.sort()
		.filter((file) =>
			readFileSync(join(MIGRATIONS_DIR, file), "utf8").includes(
				"create or replace function public.leaderboard_entries_validate_time()",
			),
		)
		.at(-1) ?? "",
);

/**
 * Teclas por segundo sostenidas que ningún humano alcanza (récord ≈ 17–20).
 * Era 25 con solo "Todo el mundo"; con los continentes (D138) el más justo es
 * Países de Sudamérica, 23,1 teclas/s (nombres cortos: Perú, Chile…), y
 * Capitales de Asia, 24,8. Siguen por encima del récord con margen.
 */
const INHUMAN_KEYS_PER_SECOND = 22;

/** Lo mínimo que se teclea en "Fácil": sin tildes ni signos (ver `normalize-answer.ts`). */
function typedLength(value: string): number {
	return value
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[\s.,'-]/g, "").length;
}

describe("mínimos del ranking", () => {
	test("los 27 scopes vigentes tienen mínimo = países del alcance × 300 ms", () => {
		const minimums = getLeaderboardMinimums();

		assert.equal(Object.keys(minimums).length, 27);

		for (const gameType of GAME_TYPES) {
			assert.equal(
				minimums[LEADERBOARD_SCOPES[gameType]],
				countries.length * LEADERBOARD_MIN_MS_PER_ANSWER,
			);

			for (const region of REGIONS) {
				const regionCount = countries.filter(
					(country) => country.region === region,
				).length;

				assert.equal(
					minimums[getLeaderboardScope(gameType, region)],
					regionCount * LEADERBOARD_MIN_MS_PER_ANSWER,
				);
			}
		}
	});

	test("los scopes viejos no tienen mínimo (D114)", () => {
		const minimums = getLeaderboardMinimums();

		for (const scope of ["world", "capitals:world", "flags:europe"]) {
			assert.equal(minimums[scope], undefined);
		}
	});

	test("batir el mínimo exige teclear a un ritmo inhumano", () => {
		const minimums = getLeaderboardMinimums();
		const keysByScope: Record<string, number> = {};

		for (const region of LEADERBOARD_REGIONS) {
			const inScope = countries.filter(
				(country) => region === "world" || country.region === region,
			);
			const countryKeys = inScope.reduce(
				(total, country) => total + typedLength(country.name),
				0,
			);
			const capitalKeys = inScope.reduce((total, country) => {
				const capital = CAPITALS[country.code];
				const options = [capital.name, ...(capital.accepted ?? [])];
				return total + Math.min(...options.map(typedLength));
			}, 0);

			// Países acepta solo al escribir; Banderas y Capitales, con Enter.
			const keys: Record<GameType, number> = {
				countries: countryKeys,
				flags: countryKeys + inScope.length,
				capitals: capitalKeys + inScope.length,
			};

			for (const gameType of GAME_TYPES) {
				keysByScope[getLeaderboardScope(gameType, region)] = keys[gameType];
			}
		}

		for (const [scope, minTimeMs] of Object.entries(minimums)) {
			const keysPerSecond = keysByScope[scope] / (minTimeMs / 1000);
			assert.ok(
				keysPerSecond > INHUMAN_KEYS_PER_SECOND,
				`${scope}: ${keysPerSecond.toFixed(1)} teclas/s no es inhumano`,
			);
		}
	});

	test("el SQL del trigger usa los mismos mínimos", () => {
		const sql = readFileSync(SQL_PATH, "utf8");
		const functionBody = sql.slice(0, sql.indexOf("create trigger"));
		const sqlMinimums = Object.fromEntries(
			[...functionBody.matchAll(/when '([^']+)' then (\d+)/g)].map(
				([, scope, minTimeMs]) => [scope, Number(minTimeMs)],
			),
		);

		assert.deepEqual(sqlMinimums, getLeaderboardMinimums());
		assert.ok(sql.includes(`errcode = '${LEADERBOARD_TIME_REJECTED_CODE}'`));
	});
});

describe("lo demás que valida el trigger (D211)", () => {
	const sql = readFileSync(SQL_PATH, "utf8");

	test("los scopes sin mínimo se rechazan, salvo los dos viejos", () => {
		assert.ok(sql.includes("message = 'leaderboard_scope_rejected'"));
		assert.ok(sql.includes("new.scope in ('world', 'capitals:world')"));
		// Los viejos no son vigentes: si lo fueran, tendrían su mínimo.
		const minimums = getLeaderboardMinimums();
		assert.equal(minimums.world, undefined);
		assert.equal(minimums["capitals:world"], undefined);
	});

	test("el nombre tiene el mismo largo máximo que el campo", () => {
		assert.ok(
			sql.includes(
				`char_length(new.display_name) not between 1 and ${LEADERBOARD_DISPLAY_NAME_MAX_LENGTH}`,
			),
		);
	});

	test("un nombre solo de espacios se rechaza (D217)", () => {
		assert.ok(sql.includes("detail = 'display_name en blanco'"));
	});

	test("lo que el SQL cuenta como en blanco es lo del cliente (D217, D221, D225)", () => {
		const start = sql.indexOf("translate(\n\t\tnew.display_name,");
		assert.ok(start > 0);
		const args = sql.slice(start, sql.indexOf(") = ''", start));
		const sqlBlank = [...args.matchAll(/chr\((\d+)\)/g)].map(([, code]) =>
			Number(code),
		);
		// Espacios de `trim` (D217) + invisibles (D221).
		const jsBlank = new Set<number>(LEADERBOARD_INVISIBLE_CODE_POINTS);
		for (let code = 0; code <= 0xffff; code++) {
			if (String.fromCharCode(code).trim() === "") jsBlank.add(code);
		}

		assert.deepEqual(
			[...sqlBlank].sort((a, b) => a - b),
			[...jsBlank].sort((a, b) => a - b),
		);
	});

	test("los estilos de avatar son los de la app", () => {
		const list = sql.match(/new\.avatar_style not in \(([^)]*)\)/)?.[1] ?? "";
		const sqlStyles = [...list.matchAll(/'([^']+)'/g)].map(([, s]) => s);

		assert.deepEqual(sqlStyles, [...AVATAR_STYLES]);
	});

	test("la fecha la pone el servidor", () => {
		assert.ok(sql.includes("new.updated_at := now();"));
	});
});

describe("nombre que va al ranking (D211)", () => {
	test("se corta a 24 caracteres por puntos de código", () => {
		assert.equal(toLeaderboardDisplayName("a".repeat(30), "X"), "a".repeat(24));
		const emoji = "🌍".repeat(30);
		const clamped = toLeaderboardDisplayName(emoji, "X");
		assert.equal(Array.from(clamped).length, 24);
	});

	test("sin espacios en los extremos y con respaldo si queda vacío", () => {
		assert.equal(toLeaderboardDisplayName("  Ana  ", "X"), "Ana");
		assert.equal(toLeaderboardDisplayName("   ", "Explorador"), "Explorador");
		// Tabulador, salto, espacio duro e ideográfico: también en blanco (D217).
		const blank = String.fromCharCode(0x09, 0x0a, 0xa0, 0x3000);
		assert.equal(toLeaderboardDisplayName(blank, "Explorador"), "Explorador");
		assert.equal(toLeaderboardDisplayName(`${blank}Ana${blank}`, "X"), "Ana");
		assert.equal(
			toLeaderboardDisplayName(`${"a".repeat(23)} b`, "X"),
			"a".repeat(23),
		);
	});
});

describe("nombres invisibles (D221, D225)", () => {
	const reported = [
		0x200b, 0x200c, 0x200d, 0x2060, 0xfeff, 0x3164, 0xffa0, 0x115f, 0x1160,
		0x2800, 0x180e,
	];

	test("cada invisible del hallazgo, solo o repetido, cae al respaldo", () => {
		for (const code of reported) {
			const char = String.fromCodePoint(code);
			assert.equal(isBlankDisplayName(char), true, code.toString(16));
			assert.equal(
				toLeaderboardDisplayName(char.repeat(5), "Explorador"),
				"Explorador",
			);
		}
	});

	test("los de fuera del plano básico también (D225)", () => {
		const supplementary = [
			0xe0001, 0xe0020, 0xe0041, 0xe007f, 0xe0100, 0xe01ef, 0x1d173, 0x1d17a,
			0x1bca0, 0x1bca3,
		];
		for (const code of supplementary) {
			const char = String.fromCodePoint(code);
			assert.equal(isBlankDisplayName(char), true, code.toString(16));
			assert.equal(
				toLeaderboardDisplayName(char.repeat(5), "Explorador"),
				"Explorador",
			);
		}
		// 30 etiquetas: se cortan a 24 caracteres (no unidades UTF-16) y quedan en blanco.
		const tags = String.fromCodePoint(0xe0041).repeat(30);
		assert.equal(toLeaderboardDisplayName(tags, "Explorador"), "Explorador");
		assert.equal(isBlankDisplayName(`A${tags}`), false);
		// La bandera de Inglaterra lleva etiquetas, pero se ve: no está en blanco.
		assert.equal(
			isBlankDisplayName(
				"\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}",
			),
			false,
		);
	});

	test("el SQL los quita con chr de 4 bytes (D225)", () => {
		// En una base UTF-8 `chr(n)` con n > 0xFFFF es un carácter y `translate`
		// trabaja por carácter: basta con que estén en la lista.
		const sql = readFileSync(SQL_PATH, "utf8");
		for (const code of [0xe0020, 0xe007f, 0xe0100, 0xe01ef, 0x1d173]) {
			assert.ok(sql.includes(`chr(${code})`), code.toString(16));
		}
	});

	test("mezclados con espacios también", () => {
		const mixed = " \u200b\u00a0\u3164\t\u2800 ";
		assert.equal(toLeaderboardDisplayName(mixed, "Explorador"), "Explorador");
	});

	test("con letras siguen valiendo, tal cual", () => {
		assert.equal(isBlankDisplayName("A\u200bna"), false);
		assert.equal(toLeaderboardDisplayName("A\u200bna", "X"), "A\u200bna");
		assert.equal(toLeaderboardDisplayName("\u3164Ana", "X"), "\u3164Ana");
	});

	test("si al cortar a 24 solo quedan invisibles, respaldo", () => {
		const name = `${"\u200b".repeat(24)}Ana`;
		assert.equal(toLeaderboardDisplayName(name, "Explorador"), "Explorador");
	});

	test("vacío o espacios siguen en blanco (D217)", () => {
		assert.equal(isBlankDisplayName(""), true);
		assert.equal(isBlankDisplayName("  \u3000"), true);
		assert.equal(isBlankDisplayName("Ana"), false);
	});
});

describe("tiempos imposibles en el cliente (D139)", () => {
	test("un rush por debajo del mínimo de su alcance no es una marca", () => {
		assert.equal(
			isPlausibleRushTime("world", getRushMinTimeMs("world") - 1),
			false,
		);
		assert.equal(isPlausibleRushTime("world", getRushMinTimeMs("world")), true);
		assert.equal(
			isPlausibleRushTime("europe", getRushMinTimeMs("europe") - 1),
			false,
		);
		assert.equal(isPlausibleRushTime("europe", 10 * 60_000), true);
	});

	test("un tiempo negativo o no finito (reloj que salta) nunca vale", () => {
		assert.equal(isPlausibleRushTime("caribbean", -5_000), false);
		assert.equal(isPlausibleRushTime("caribbean", Number.NaN), false);
		assert.equal(
			isPlausibleRushTime("caribbean", Number.POSITIVE_INFINITY),
			false,
		);
	});
});

describe("rechazo del servidor", () => {
	test("reconoce el código del trigger y nada más", () => {
		assert.equal(isLeaderboardTimeRejected({ code: "PT422" }), true);
		assert.equal(isLeaderboardTimeRejected({ code: "P0001" }), false);
		assert.equal(isLeaderboardTimeRejected({ code: "42501" }), false);
		assert.equal(isLeaderboardTimeRejected({}), false);
	});

	test("solo se reintenta lo que falló, no lo rechazado", () => {
		assert.equal(shouldRetryLeaderboardUpload("failed"), true);
		assert.equal(shouldRetryLeaderboardUpload("rejected"), false);
		assert.equal(shouldRetryLeaderboardUpload("uploaded"), false);
	});
});
