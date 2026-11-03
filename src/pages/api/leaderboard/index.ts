import {
	isRejectedByTrigger,
	readLeaderboard,
	upsertOwnEntry,
} from "@/server/data/leaderboard";
import {
	badRequest,
	getSessionUserId,
	json,
	readJsonObject,
	unauthorized,
	withErrorHandling,
} from "@/server/http";
import { LEADERBOARD_TIME_REJECTED_CODE } from "@/utils/leaderboard-validation";

export const prerender = false;

const MAX_SCOPE_LENGTH = 64;

const isOptionalText = (value: unknown): value is string | null =>
	value === null || typeof value === "string";

/** `Leaderboard is publicly readable`: sin sesión. */
export const GET = withErrorHandling(async (_request, url) => {
	const scope = url.searchParams.get("scope");

	if (!scope || scope.length > MAX_SCOPE_LENGTH) {
		return badRequest("Scope no válido");
	}

	return json({ entries: await readLeaderboard(scope) });
});

/** Los dos `... their own leaderboard entry`: el `user_id` sale de la sesión. */
export const POST = withErrorHandling(async (request) => {
	const userId = await getSessionUserId(request);

	if (!userId) return unauthorized();

	const body = await readJsonObject(request);

	if (!body) return badRequest("Cuerpo no válido");

	const { scope, displayName, avatarStyle, avatarSeed, bestTimeMs } = body;

	if (
		typeof scope !== "string" ||
		typeof displayName !== "string" ||
		!isOptionalText(avatarStyle) ||
		!isOptionalText(avatarSeed) ||
		!Number.isSafeInteger(bestTimeMs)
	) {
		return badRequest("Cuerpo no válido");
	}

	try {
		await upsertOwnEntry(
			userId,
			scope,
			{ displayName, avatarStyle, avatarSeed },
			bestTimeMs as number,
		);
	} catch (error) {
		// Rechazo del trigger: definitivo, el cliente no lo reintenta (D113).
		if (isRejectedByTrigger(error)) {
			return json(
				{ code: LEADERBOARD_TIME_REJECTED_CODE, message: "Marca rechazada" },
				422,
			);
		}

		throw error;
	}

	return json({ ok: true });
});
