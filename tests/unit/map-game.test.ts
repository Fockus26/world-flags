/**
 * El juego Mapa en el registro de juegos (D240). Cubre:
 *
 * - Solo tiene práctica: el modo guardado se resuelve a práctica y no hay
 *   scopes de ranking suyos (el servidor no aceptaría una marca de Mapa).
 * - Su progreso vive en `mapGame`, viaja en la columna `map_game`, y
 *   escribirlo no toca el de los otros juegos.
 * - Una cuenta que solo jugó a Mapa cuenta como "con progreso" (si no, el
 *   invitado que entra en ella la pisaría, D056).
 * - El logro de "los tres juegos" sigue siendo de tres.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
	COMPETITIVE_GAME_TYPES,
	GAME_TYPES,
	hasCompetitiveMode,
	resolveGameMode,
} from "@/types/country";
import type { GameProgress, UserLearningData } from "@/types/progress";
import { collectLeaderboardMarks } from "@/utils/leaderboard-upload";
import { getLeaderboardMinimums } from "@/utils/leaderboard-validation";
import { toLearningDataRow } from "@/utils/learning-data-row";
import {
	DEFAULT_DATA,
	hasLearningProgress,
	normalizeLearningData,
	toGameView,
} from "@/utils/learning-storage";

const practiced = "2026-11-23";

/** Unos datos vacíos con `progress` en el juego Mapa, sin pasar por el almacenamiento. */
function withMapProgress(progress: Partial<GameProgress>): UserLearningData {
	return {
		...DEFAULT_DATA,
		mapGame: { ...DEFAULT_DATA.mapGame, ...progress },
	};
}

describe("juego Mapa", () => {
	test("solo tiene práctica", () => {
		assert.ok(GAME_TYPES.includes("map"));
		assert.equal(hasCompetitiveMode("map"), false);
		assert.equal(resolveGameMode("map", "competitive"), "practice");
		assert.equal(resolveGameMode("map", "practice"), "practice");

		for (const gameType of COMPETITIVE_GAME_TYPES) {
			assert.equal(resolveGameMode(gameType, "competitive"), "competitive");
		}
	});

	test("no tiene scopes de ranking ni sube marcas", () => {
		const scopes = Object.keys(getLeaderboardMinimums());

		assert.equal(scopes.length, 27);
		assert.deepEqual(
			scopes.filter((scope) => scope.startsWith("map")),
			[],
		);

		const withTime = withMapProgress({ regionBestTimes: { world: 999_999 } });
		assert.deepEqual(collectLeaderboardMarks(withTime), []);
	});

	test("su progreso va a `mapGame` y a la columna `map_game`, sin tocar los demás juegos", () => {
		const data = withMapProgress({ lastPracticeByCountry: { bo: practiced } });

		assert.deepEqual(data.mapGame.lastPracticeByCountry, { bo: practiced });
		assert.deepEqual(data.lastPracticeByCountry, {});
		assert.deepEqual(data.countriesGame, DEFAULT_DATA.countriesGame);
		assert.deepEqual(data.capitalsGame, DEFAULT_DATA.capitalsGame);
		assert.deepEqual(toGameView(data, "map").lastPracticeByCountry, {
			bo: practiced,
		});
		assert.deepEqual(toLearningDataRow(data).map_game, data.mapGame);
	});

	test("unos datos viejos sin `mapGame` se normalizan con el juego vacío", () => {
		const { mapGame: _removed, ...old } = DEFAULT_DATA;
		const normalized = normalizeLearningData(old as typeof DEFAULT_DATA);

		assert.deepEqual(normalized.mapGame, DEFAULT_DATA.mapGame);
	});

	test("una cuenta que solo jugó a Mapa tiene progreso", () => {
		const data = withMapProgress({ countryHistory: { bo: { review: null } } });

		assert.equal(hasLearningProgress(DEFAULT_DATA), false);
		assert.equal(hasLearningProgress(data), true);
	});
});
