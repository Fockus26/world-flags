/**
 * Las columnas de datos de `user_learning_data`: lo único que la API deja leer y
 * escribir (sin `user_id`, que sale de la sesión, ni `updated_at`, la versión). Aparte
 * de `learning-data-row.ts` para que el servidor no importe `learning-storage`.
 */
export const LEARNING_DATA_COLUMNS = [
	"profile",
	"country_history",
	"region_game_scores",
	"region_best_times",
	"last_configuration",
	"last_practice_by_country",
	"countries_game",
	"capitals_game",
	"map_game",
	"achievements",
	"stats",
	"session_history",
	"daily_reminder",
	"field_updated_at",
	"learning_paths",
] as const;

export type LearningDataColumn = (typeof LEARNING_DATA_COLUMNS)[number];

/** La fila tal como la devuelve `GET /api/learning-data`. */
export type LearningDataResponse = Record<LearningDataColumn, unknown> & {
	/** La versión de la fila (D210), con sus microsegundos: se compara exacta. */
	updated_at: string;
};
