/**
 * La subida a la nube manda solo las columnas que cambiaron (`pickChangedColumns`):
 * sin fila previa van todas; con fila previa, solo el delta.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
	pickChangedColumns,
	SUB_GAME_COLUMNS,
	toLearningDataRow,
} from "@/utils/learning-data-row";
import { createDefaultLearningData } from "@/utils/learning-storage";

describe("pickChangedColumns", () => {
	test("sin fila previa sube todas las columnas", () => {
		const data = createDefaultLearningData();

		assert.deepEqual(pickChangedColumns(data, null), toLearningDataRow(data));
	});

	test("la fila incluye la columna de cada juego con sub-objeto", () => {
		const row = toLearningDataRow(createDefaultLearningData());

		for (const column of Object.values(SUB_GAME_COLUMNS)) {
			assert.ok(column in row, `falta ${column}`);
		}
	});

	test("sin cambios no sube ninguna columna", () => {
		const data = createDefaultLearningData();

		assert.deepEqual(pickChangedColumns(data, structuredClone(data)), {});
	});

	test("solo sube las columnas que cambiaron", () => {
		const previous = createDefaultLearningData();
		const data = structuredClone(previous);

		data.countryHistory = {
			...data.countryHistory,
			es: { review: null } as (typeof data.countryHistory)[string],
		};
		data.regionGameScoresUpdatedAt = { europe: "2026-09-28T10:00:00.000Z" };

		assert.deepEqual(Object.keys(pickChangedColumns(data, previous)).sort(), [
			"country_history",
			"field_updated_at",
		]);
	});
});
