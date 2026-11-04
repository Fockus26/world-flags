import { sql } from "drizzle-orm";
import {
	bigint,
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	primaryKey,
	smallint,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

/**
 * Esquema de la base en el VPS. Las tablas de la app son las de Supabase, con sus
 * mismos nombres y tipos, para que la copia de datos sea directa. Las de auth son las
 * de Better Auth con ids UUID: los importados conservan el de `auth.users`, y así
 * cada fila sigue apuntando a la misma persona.
 */

const timestamptz = (name: string) =>
	timestamp(name, { withTimezone: true, mode: "date" });

export const user = pgTable("user", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull().default(false),
	image: text("image"),
	createdAt: timestamptz("created_at").notNull().defaultNow(),
	updatedAt: timestamptz("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const session = pgTable(
	"session",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		expiresAt: timestamptz("expires_at").notNull(),
		token: text("token").notNull().unique(),
		createdAt: timestamptz("created_at").notNull().defaultNow(),
		updatedAt: timestamptz("updated_at")
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: uuid("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = pgTable(
	"account",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: uuid("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: timestamptz("access_token_expires_at"),
		refreshTokenExpiresAt: timestamptz("refresh_token_expires_at"),
		scope: text("scope"),
		password: text("password"),
		createdAt: timestamptz("created_at").notNull().defaultNow(),
		updatedAt: timestamptz("updated_at")
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = pgTable(
	"verification",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamptz("expires_at").notNull(),
		createdAt: timestamptz("created_at").notNull().defaultNow(),
		updatedAt: timestamptz("updated_at")
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [index("verification_identifier_idx").on(table.identifier)],
);

/** Límite de intentos en base: en memoria no serviría entre funciones de Vercel. */
export const rateLimit = pgTable("rate_limit", {
	id: uuid("id").primaryKey().defaultRandom(),
	key: text("key").notNull().unique(),
	count: integer("count").notNull(),
	lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

export const appConfig = pgTable("app_config", {
	key: text("key").primaryKey(),
	value: text("value").notNull(),
	updatedAt: timestamptz("updated_at").notNull().defaultNow(),
});

export const leaderboardEntries = pgTable(
	"leaderboard_entries",
	{
		userId: uuid("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		scope: text("scope").notNull(),
		displayName: text("display_name").notNull(),
		bestTimeMs: integer("best_time_ms").notNull(),
		updatedAt: timestamptz("updated_at").notNull().defaultNow(),
		avatarStyle: text("avatar_style"),
		avatarSeed: text("avatar_seed"),
	},
	(table) => [
		primaryKey({ columns: [table.userId, table.scope] }),
		index("leaderboard_entries_scope_time_idx").on(
			table.scope,
			table.bestTimeMs,
		),
	],
);

export const pushSubscriptions = pgTable("push_subscriptions", {
	deviceId: text("device_id").primaryKey(),
	userId: uuid("user_id").references(() => user.id, { onDelete: "cascade" }),
	endpoint: text("endpoint").notNull().unique(),
	p256dh: text("p256dh").notNull(),
	authKey: text("auth_key").notNull(),
	timezone: text("timezone").notNull().default("UTC"),
	reminderHour: smallint("reminder_hour").notNull().default(19),
	createdAt: timestamptz("created_at").notNull().defaultNow(),
	updatedAt: timestamptz("updated_at").notNull().defaultNow(),
});

const emptyObject = sql`'{}'::jsonb`;

export const userLearningData = pgTable("user_learning_data", {
	userId: uuid("user_id")
		.primaryKey()
		.references(() => user.id, { onDelete: "cascade" }),
	profile: jsonb("profile").notNull(),
	countryHistory: jsonb("country_history").notNull().default(emptyObject),
	regionGameScores: jsonb("region_game_scores").notNull().default(emptyObject),
	lastConfiguration: jsonb("last_configuration"),
	/**
	 * La versión de la fila (D210): se compara por igualdad exacta. En `string`
	 * para que no pase por `Date`, que perdería los microsegundos de `now()` y
	 * haría que ninguna subida coincidiera.
	 */
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
		.notNull()
		.defaultNow(),
	lastPracticeByCountry: jsonb("last_practice_by_country")
		.notNull()
		.default(emptyObject),
	regionBestTimes: jsonb("region_best_times").notNull().default(emptyObject),
	achievements: jsonb("achievements").notNull().default(emptyObject),
	stats: jsonb("stats").notNull().default(emptyObject),
	sessionHistory: jsonb("session_history").notNull().default(sql`'[]'::jsonb`),
	countriesGame: jsonb("countries_game").notNull().default(emptyObject),
	dailyReminder: jsonb("daily_reminder").notNull().default(emptyObject),
	fieldUpdatedAt: jsonb("field_updated_at").notNull().default(emptyObject),
	capitalsGame: jsonb("capitals_game").notNull().default(emptyObject),
	learningPaths: jsonb("learning_paths").notNull().default(emptyObject),
});
