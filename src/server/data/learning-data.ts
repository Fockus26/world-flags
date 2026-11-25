import { and, eq, sql } from "drizzle-orm";

import {
	LEARNING_DATA_COLUMNS,
	type LearningDataColumn,
	type LearningDataResponse,
} from "@/utils/learning-data-columns";

import { db } from "../db/client";
import { userLearningData as table } from "../db/schema";
import { findShapeProblem } from "./learning-data-shape";

/** Columna de la API → columna de Drizzle. No compila si falta alguna. */
const COLUMNS = {
	profile: table.profile,
	country_history: table.countryHistory,
	region_game_scores: table.regionGameScores,
	region_best_times: table.regionBestTimes,
	last_configuration: table.lastConfiguration,
	last_practice_by_country: table.lastPracticeByCountry,
	countries_game: table.countriesGame,
	capitals_game: table.capitalsGame,
	map_game: table.mapGame,
	achievements: table.achievements,
	stats: table.stats,
	session_history: table.sessionHistory,
	daily_reminder: table.dailyReminder,
	field_updated_at: table.fieldUpdatedAt,
	learning_paths: table.learningPaths,
} as const satisfies Record<LearningDataColumn, unknown>;

/** La propiedad de Drizzle de cada columna, para `insert` y `update`. */
const PROPERTIES = {
	profile: "profile",
	country_history: "countryHistory",
	region_game_scores: "regionGameScores",
	region_best_times: "regionBestTimes",
	last_configuration: "lastConfiguration",
	last_practice_by_country: "lastPracticeByCountry",
	countries_game: "countriesGame",
	capitals_game: "capitalsGame",
	map_game: "mapGame",
	achievements: "achievements",
	stats: "stats",
	session_history: "sessionHistory",
	daily_reminder: "dailyReminder",
	field_updated_at: "fieldUpdatedAt",
	learning_paths: "learningPaths",
} as const satisfies Record<
	LearningDataColumn,
	keyof typeof table.$inferInsert
>;

const NULLABLE_COLUMNS: readonly LearningDataColumn[] = ["last_configuration"];

export function isLearningDataColumn(
	column: string,
): column is LearningDataColumn {
	return (LEARNING_DATA_COLUMNS as readonly string[]).includes(column);
}

/**
 * Un `null` en una columna `jsonb` se guardaría como el JSON `null`, no como NULL, y
 * se saltaría el `not null`: se comprueba aquí, junto con la forma y el tope de
 * `learning-data-shape.ts`. Devuelve la primera que no vale.
 */
export function findInvalidColumn(
	columns: Record<string, unknown>,
): string | null {
	for (const [column, value] of Object.entries(columns)) {
		if (!isLearningDataColumn(column)) return column;

		if (
			value === undefined ||
			(value === null && !NULLABLE_COLUMNS.includes(column))
		) {
			return column;
		}

		const problem = findShapeProblem(column, value);

		if (problem) return `${column} (${problem})`;
	}

	return null;
}

/**
 * La versión como texto ISO con sus microsegundos, el formato que daba PostgREST. Sin
 * pasar por `Date`, que los perdería: la comparación de D210 es por igualdad exacta y
 * ninguna subida sobre una fila escrita con `now()` coincidiría.
 */
const versionAsText = sql<string>`to_json(${table.updatedAt}) #>> '{}'`;

export async function readLearningData(
	userId: string,
): Promise<LearningDataResponse | null> {
	const [row] = await db
		.select({ ...COLUMNS, updated_at: versionAsText })
		.from(table)
		.where(eq(table.userId, userId));

	return row ?? null;
}

function toValues(columns: Record<string, unknown>) {
	return Object.fromEntries(
		Object.entries(columns).map(([column, value]) => [
			PROPERTIES[column as LearningDataColumn],
			value,
		]),
	);
}

/**
 * Subida condicionada a la versión leída (D210). `false`: otro dispositivo escribió
 * entre medias (o creó la fila) y no se tocó nada; quien llama vuelve a leer y fusionar.
 */
export async function writeLearningData(
	userId: string,
	columns: Record<string, unknown>,
	updatedAt: string,
	previousVersion: string | null,
): Promise<boolean> {
	if (previousVersion) {
		const written = await db
			.update(table)
			.set({ ...toValues(columns), updatedAt })
			.where(
				and(eq(table.userId, userId), eq(table.updatedAt, previousVersion)),
			)
			.returning({ userId: table.userId });

		return written.length > 0;
	}

	const written = await db
		.insert(table)
		.values({
			...toValues(columns),
			userId,
			updatedAt,
		} as typeof table.$inferInsert)
		.onConflictDoNothing({ target: table.userId })
		.returning({ userId: table.userId });

	return written.length > 0;
}
