import { and, asc, eq, sql } from "drizzle-orm";

import { LEADERBOARD_TIME_REJECTED_CODE } from "@/utils/leaderboard-validation";

import { db } from "../db/client";
import { leaderboardEntries as table } from "../db/schema";

export interface LeaderboardProfileInput {
	displayName: string;
	avatarStyle: string | null;
	avatarSeed: string | null;
}

/** Público: cualquiera lo lee, con o sin cuenta. */
export function readLeaderboard(scope: string) {
	return db
		.select({
			user_id: table.userId,
			display_name: table.displayName,
			best_time_ms: table.bestTimeMs,
			avatar_style: table.avatarStyle,
			avatar_seed: table.avatarSeed,
		})
		.from(table)
		.where(eq(table.scope, scope))
		.orderBy(asc(table.bestTimeMs));
}

/** La fila de la cuenta en ese scope. El trigger decide qué marca queda (D139, D211). */
export async function upsertOwnEntry(
	userId: string,
	scope: string,
	profile: LeaderboardProfileInput,
	bestTimeMs: number,
): Promise<void> {
	const values = { ...profile, bestTimeMs };

	await db
		.insert(table)
		.values({ userId, scope, ...values })
		.onConflictDoUpdate({
			target: [table.userId, table.scope],
			set: values,
		});
}

/**
 * Nombre y avatar de las filas de la cuenta (D079), solo las que difieren: una carga
 * sin cambios no escribe nada. Devuelve cuántas cambió.
 */
export async function updateOwnProfile(
	userId: string,
	{ displayName, avatarStyle, avatarSeed }: LeaderboardProfileInput,
): Promise<number> {
	const changed = await db
		.update(table)
		.set({ displayName, avatarStyle, avatarSeed })
		.where(
			and(
				eq(table.userId, userId),
				sql`(${table.displayName}, ${table.avatarStyle}, ${table.avatarSeed})
					is distinct from (${displayName}::text, ${avatarStyle}::text, ${avatarSeed}::text)`,
			),
		)
		.returning({ userId: table.userId });

	return changed.length;
}

/** ¿El trigger rechazó la fila? Drizzle envuelve el error de Postgres en `cause`. */
export function isRejectedByTrigger(error: unknown): boolean {
	for (
		let current = error;
		typeof current === "object" && current !== null;
		current = (current as { cause?: unknown }).cause
	) {
		if (
			(current as { code?: unknown }).code === LEADERBOARD_TIME_REJECTED_CODE
		) {
			return true;
		}
	}

	return false;
}
