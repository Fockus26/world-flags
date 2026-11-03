import {
	findInvalidColumn,
	readLearningData,
	writeLearningData,
} from "@/server/data/learning-data";
import {
	badRequest,
	getSessionUserId,
	json,
	readJsonObject,
	unauthorized,
	withErrorHandling,
} from "@/server/http";

export const prerender = false;

/** Solo la fila de la cuenta de la sesión: `select own data`. */
export const GET = withErrorHandling(async (request) => {
	const userId = await getSessionUserId(request);

	if (!userId) return unauthorized();

	return json({ row: await readLearningData(userId) });
});

/**
 * `insert own data` y `update own data`: el `user_id` sale de la sesión, y si el
 * cuerpo trae uno se rechaza por columna desconocida.
 */
export const POST = withErrorHandling(async (request) => {
	const userId = await getSessionUserId(request);

	if (!userId) return unauthorized();

	const body = await readJsonObject(request);

	if (!body) return badRequest("Cuerpo no válido");

	const { columns, updatedAt, previousVersion } = body;

	if (
		typeof columns !== "object" ||
		columns === null ||
		Array.isArray(columns) ||
		typeof updatedAt !== "string" ||
		Number.isNaN(Date.parse(updatedAt)) ||
		(previousVersion !== null && typeof previousVersion !== "string")
	) {
		return badRequest("Cuerpo no válido");
	}

	const row = columns as Record<string, unknown>;
	const invalid = findInvalidColumn(row);

	if (invalid) return badRequest(`Columna no válida: ${invalid}`);

	if (previousVersion === null && row.profile === undefined) {
		return badRequest("Falta el perfil");
	}

	const written = await writeLearningData(
		userId,
		row,
		updatedAt,
		previousVersion,
	);

	return json({ written });
});
