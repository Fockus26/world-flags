/**
 * Copia cuentas y datos de Supabase a la base nueva. Se usa una vez, en el corte
 * (`context/plans/migrate-vps.md` §6), y antes para ensayarlo en una base temporal.
 *
 *   DIRECT_URL=<destino> node scripts/import-from-supabase.ts
 *
 * - En Supabase solo lee, en una transacción `READ ONLY` con una foto coherente.
 * - En el destino escribe todo en una transacción: o queda todo o no queda nada. Se niega
 *   si el destino ya tiene cuentas, y al final compara filas y contenido de cada tabla.
 * - Nunca imprime correos, hashes ni datos: solo conteos.
 *
 * Contraseña de origen: `SUPABASE_DB_PASSWORD`, de `.env.local`. El destino va por el túnel
 * (`ssh -N -L 5433:127.0.0.1:5432 kit-vps`), con `DIRECT_URL` de `kit-db url <base> --direct`.
 */

import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import pg from "pg";

interface Table {
	name: string;
	columns: string[];
	/** Para comparar el contenido en un orden estable. */
	key: string[];
}

/** Las tablas de la app: mismos nombres y tipos a los dos lados. */
const TABLES: Table[] = [
	{
		name: "user_learning_data",
		key: ["user_id"],
		columns: [
			"user_id",
			"profile",
			"country_history",
			"region_game_scores",
			"last_configuration",
			"updated_at",
			"last_practice_by_country",
			"region_best_times",
			"achievements",
			"stats",
			"session_history",
			"countries_game",
			"daily_reminder",
			"field_updated_at",
			"capitals_game",
			"learning_paths",
		],
	},
	{
		name: "leaderboard_entries",
		key: ["user_id", "scope"],
		columns: [
			"user_id",
			"scope",
			"display_name",
			"best_time_ms",
			"updated_at",
			"avatar_style",
			"avatar_seed",
		],
	},
	{
		name: "push_subscriptions",
		key: ["device_id"],
		columns: [
			"device_id",
			"user_id",
			"endpoint",
			"p256dh",
			"auth_key",
			"timezone",
			"reminder_hour",
			"created_at",
			"updated_at",
		],
	},
	{
		name: "app_config",
		key: ["key"],
		columns: ["key", "value", "updated_at"],
	},
];

function readEnv(file: string): Record<string, string> {
	const out: Record<string, string> = {};
	for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
		const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
		if (m) out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
	}
	return out;
}

const targetUrl = process.env.DIRECT_URL;
const password = readEnv(".env.local").SUPABASE_DB_PASSWORD;
if (!targetUrl) throw new Error("Falta DIRECT_URL (el destino).");
if (!password) throw new Error("Falta SUPABASE_DB_PASSWORD en .env.local.");
if (/supabase\.(co|com)/.test(targetUrl)) {
	throw new Error("El destino no puede ser Supabase.");
}

const ref = readFileSync("supabase/.temp/project-ref", "utf8").trim();
const poolerHost = new URL(
	readFileSync("supabase/.temp/pooler-url", "utf8").trim(),
).hostname;

const source = new pg.Client({
	host: poolerHost,
	// 6543: el 5432 del pooler no siempre responde, y aquí basta una transacción.
	port: 6543,
	user: `postgres.${ref}`,
	password,
	database: "postgres",
	ssl: { rejectUnauthorized: false },
});
const target = new pg.Client({ connectionString: targetUrl });

/** Todo como texto: los microsegundos y el `jsonb` llegan exactos, sin pasar por JS. */
const asText = (columns: string[]) =>
	columns.map((column) => `${column}::text as ${column}`).join(", ");

async function copyRows(table: Table): Promise<number> {
	const { rows } = await source.query(
		`select ${asText(table.columns)} from public.${table.name}`,
	);

	for (const row of rows) {
		const placeholders = table.columns.map((_, i) => `$${i + 1}`).join(", ");

		await target.query(
			`insert into public.${table.name} (${table.columns.join(", ")}) values (${placeholders})`,
			table.columns.map((column) => row[column]),
		);
	}

	return rows.length;
}

/** Filas y huella del contenido, comparables a los dos lados. */
async function fingerprint(client: pg.Client, table: Table) {
	const { rows } = await client.query(`
		select count(*)::int as count, md5(coalesce(string_agg(
			jsonb_build_array(${table.columns.join(", ")})::text, '|'
			order by ${table.key.join(", ")}
		), '')) as hash
		from public.${table.name}`);

	return rows[0] as { count: number; hash: string };
}

await source.connect();
await target.connect();

try {
	await source.query(
		"begin transaction isolation level repeatable read read only",
	);
	await source.query("set local time zone 'UTC'");
	await target.query("begin");
	await target.query("set local time zone 'UTC'");

	const { rows: existing } = await target.query(
		`select count(*)::int as count from public."user"`,
	);
	if (existing[0].count > 0) {
		throw new Error("El destino ya tiene cuentas: no se importa encima.");
	}

	const { rows: users } = await source.query(`
		select id::text, lower(email) as email, email_confirmed_at is not null as verified,
			coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', '') as name,
			encrypted_password, created_at::text, updated_at::text
		from auth.users
		where deleted_at is null and email is not null`);

	const { rows: identities } = await source.query(`
		select user_id::text, provider, provider_id, created_at::text, updated_at::text
		from auth.identities`);

	const unsupported = identities.filter(
		(i) => i.provider !== "email" && i.provider !== "google",
	);
	if (unsupported.length) {
		throw new Error(`Proveedores sin soporte: ${unsupported.length} identidades.`);
	}

	for (const user of users) {
		await target.query(
			`insert into "user" (id, name, email, email_verified, created_at, updated_at)
			 values ($1, $2, $3, $4, $5, $6)`,
			[
				user.id,
				user.name,
				user.email,
				user.verified,
				user.created_at,
				user.updated_at ?? user.created_at,
			],
		);
	}

	const importedIds = new Set(users.map((user) => user.id));
	const passwords = new Map(
		users.map((user) => [user.id, user.encrypted_password]),
	);
	let accounts = 0;

	for (const identity of identities) {
		if (!importedIds.has(identity.user_id)) continue;

		const isEmail = identity.provider === "email";

		await target.query(
			`insert into account (id, account_id, provider_id, user_id, password, created_at, updated_at)
			 values ($1, $2, $3, $4, $5, $6, $7)`,
			[
				randomUUID(),
				// Better Auth busca la credencial por `provider_id`, y la de Google por su `sub`.
				isEmail ? identity.user_id : identity.provider_id,
				isEmail ? "credential" : "google",
				identity.user_id,
				isEmail ? passwords.get(identity.user_id) || null : null,
				identity.created_at ?? new Date().toISOString(),
				identity.updated_at ?? new Date().toISOString(),
			],
		);
		accounts += 1;
	}

	// El trigger reescribiría `updated_at` y volvería a juzgar filas ya aceptadas. El
	// dueño de la tabla puede apagarlo, y dentro de la transacción no lo ve nadie más.
	await target.query(
		"alter table public.leaderboard_entries disable trigger leaderboard_entries_validate_time",
	);

	console.log(`cuentas: ${users.length} · accesos: ${accounts}`);

	for (const table of TABLES) {
		// Las semillas del destino (min_version) las sustituye el dato real.
		await target.query(`delete from public.${table.name}`);
		await copyRows(table);
	}

	await target.query(
		"alter table public.leaderboard_entries enable trigger leaderboard_entries_validate_time",
	);

	let mismatches = 0;

	for (const table of TABLES) {
		const from = await fingerprint(source, table);
		const to = await fingerprint(target, table);
		const same = from.count === to.count && from.hash === to.hash;

		if (!same) mismatches += 1;

		console.log(
			`${same ? "ok  " : "FAIL"} ${table.name}: ${from.count} → ${to.count} filas, contenido ${from.hash === to.hash ? "igual" : "DISTINTO"}`,
		);
	}

	if (mismatches) throw new Error("El contenido no coincide: no se guarda nada.");

	await target.query("commit");
	console.log("Importación guardada.");
} catch (error) {
	await target.query("rollback").catch(() => {});
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
} finally {
	await source.query("rollback").catch(() => {});
	await source.end();
	await target.end();
}
