import type { LearningDataColumn } from "@/utils/learning-data-columns";

/**
 * Forma y tope de cada columna `jsonb` de `user_learning_data` (P60). Sin RLS ni
 * PostgREST, la API es la única barrera: aquí se rechaza lo que la app nunca manda.
 *
 * Solo se mira el tipo de arriba (objeto o lista) y el tamaño, no el contenido: una
 * validación profunda que se quedara atrás de la app rechazaría progreso real.
 */

/** La única columna que es una lista; las demás son objetos. */
const ARRAY_COLUMNS: readonly LearningDataColumn[] = ["session_history"];

/**
 * Tope por columna, en caracteres de su JSON. Una fila real ronda los 50 KB en total;
 * 512 KB por columna deja margen de sobra sin dejar que una cuenta llene la base.
 */
export const MAX_COLUMN_CHARS = 512 * 1024;

/** Tope del cuerpo entero de una subida (todas las columnas juntas). */
export const MAX_BODY_CHARS = 2 * 1024 * 1024;

/** Profundidad máxima de anidamiento: la app no pasa de 6. */
const MAX_DEPTH = 16;

function depthOf(value: unknown, limit: number): number {
	if (typeof value !== "object" || value === null) return 0;
	if (limit <= 0) return 1;

	let deepest = 0;

	for (const child of Object.values(value)) {
		deepest = Math.max(deepest, depthOf(child, limit - 1));
		if (deepest >= limit) break;
	}

	return deepest + 1;
}

/** `null` si vale; si no, por qué no (sin el valor, que no se registra). */
export function findShapeProblem(
	column: LearningDataColumn,
	value: unknown,
): string | null {
	if (value === null) return null; // Los `null` ya los filtra `findInvalidColumn`.

	const isArray = Array.isArray(value);
	const expectsArray = ARRAY_COLUMNS.includes(column);

	if (typeof value !== "object" || isArray !== expectsArray) {
		return expectsArray ? "debe ser una lista" : "debe ser un objeto";
	}

	if (depthOf(value, MAX_DEPTH) > MAX_DEPTH) return "anidada de más";

	if (JSON.stringify(value).length > MAX_COLUMN_CHARS)
		return "demasiado grande";

	return null;
}
