import type { UserLearningData } from "@/types/progress";
import {
	SUB_GAME_KEYS,
	SUB_GAME_TYPES,
	type SubGameType,
} from "./learning-storage";

/**
 * La columna de `user_learning_data` de cada juego con sub-objeto propio
 * (D028, D061). Una columna nueva aquí exige su SQL en `supabase/` corrido
 * ANTES de desplegar: si el `select` pide una columna que no existe, falla y
 * toda cuenta autenticada se queda en `local` sin sincronizar (D044/D050).
 */
export const SUB_GAME_COLUMNS = {
	countries: "countries_game",
	capitals: "capitals_game",
} as const satisfies Record<SubGameType, string>;

/** Las columnas de datos de la fila (sin `user_id` ni `updated_at`). */
export type LearningDataRow = Record<string, unknown>;

/**
 * `UserLearningData` → columnas de `user_learning_data`. Se enumeran
 * columnas, no se sube la fila a ciegas: un cliente viejo que no conoce un
 * juego no manda su columna, y Postgres conserva lo que ya había (D028).
 */
export function toLearningDataRow(data: UserLearningData): LearningDataRow {
	return {
		profile: data.profile,
		country_history: data.countryHistory,
		region_game_scores: data.regionGameScores,
		region_best_times: data.regionBestTimes,
		last_configuration: data.lastConfiguration,
		last_practice_by_country: data.lastPracticeByCountry,
		...Object.fromEntries(
			SUB_GAME_TYPES.map((gameType) => [
				SUB_GAME_COLUMNS[gameType],
				data[SUB_GAME_KEYS[gameType]],
			]),
		),
		achievements: data.achievements,
		stats: data.stats,
		session_history: data.sessionHistory,
		daily_reminder: data.dailyReminder,
		field_updated_at: {
			profile: data.fieldUpdatedAt.profile,
			lastConfiguration: data.fieldUpdatedAt.lastConfiguration,
			regionGameScores: data.regionGameScoresUpdatedAt,
		},
		learning_paths: data.learningPaths,
	};
}

/**
 * Las columnas de `data` que difieren de lo que ya hay en la nube
 * (`previous`). Sin `previous` (la fila no existe) van todas. Se sube con un
 * UPDATE, que solo toca las columnas que recibe (ver `pushLearningData`), y
 * ahorra subir la fila entera (~50–80 KB) cada vez que cambia una nota.
 */
export function pickChangedColumns(
	data: UserLearningData,
	previous: UserLearningData | null,
): LearningDataRow {
	const row = toLearningDataRow(data);

	if (!previous) return row;

	const previousRow = toLearningDataRow(previous);

	return Object.fromEntries(
		Object.entries(row).filter(
			([column, value]) =>
				JSON.stringify(value) !== JSON.stringify(previousRow[column]),
		),
	);
}
