import {
	isRejectedByTrigger,
	updateOwnProfile,
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

const isOptionalText = (value: unknown): value is string | null =>
	value === null || typeof value === "string";

/** `Users can update their own leaderboard entry`: nombre y avatar (D079). */
export const POST = withErrorHandling(async (request) => {
	const userId = await getSessionUserId(request);

	if (!userId) return unauthorized();

	const body = await readJsonObject(request);

	if (!body) return badRequest("Cuerpo no válido");

	const { displayName, avatarStyle, avatarSeed } = body;

	if (
		typeof displayName !== "string" ||
		!isOptionalText(avatarStyle) ||
		!isOptionalText(avatarSeed)
	) {
		return badRequest("Cuerpo no válido");
	}

	try {
		const changed = await updateOwnProfile(userId, {
			displayName,
			avatarStyle,
			avatarSeed,
		});

		return json({ changed });
	} catch (error) {
		if (isRejectedByTrigger(error)) {
			return json(
				{ code: LEADERBOARD_TIME_REJECTED_CODE, message: "Perfil rechazado" },
				422,
			);
		}

		throw error;
	}
});
