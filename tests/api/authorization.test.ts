/**
 * Las políticas RLS de Supabase, ahora en las rutas: una prueba por política, contra un
 * servidor real y su base. Lo que se protege es que ninguna se pierda en la migración.
 *
 * Uso, con `bun run qa:local -- --port 4399` corriendo:
 *   QA_SITE=http://localhost:4399 DATABASE_URL=<la de qa:local> bun test ./tests/api
 *
 * No va en `bun run test`: necesita servidor y base. Nunca contra la base real: aborta
 * si la URL no es de esta máquina.
 */
import assert from "node:assert/strict";
import { afterAll, beforeAll, describe, test } from "bun:test";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

const SITE = process.env.QA_SITE ?? "http://localhost:4399";
const DATABASE_URL = process.env.DATABASE_URL ?? "";

if (!/@(127\.0\.0\.1|localhost):/.test(DATABASE_URL)) {
	throw new Error("DATABASE_URL tiene que ser la base local de qa:local.");
}

const pool = new Pool({ connectionString: DATABASE_URL });

interface Player {
	id: string;
	cookie: string;
}

const NOW = () => new Date().toISOString();
const PROFILE = { name: "Ana", avatarStyle: "fun-emoji", avatarSeed: "a" };

function request(path: string, player: Player | null, body?: unknown) {
	return fetch(`${SITE}${path}`, {
		method: body === undefined ? "GET" : "POST",
		headers: {
			Origin: SITE,
			...(player ? { Cookie: player.cookie } : {}),
			...(body === undefined ? {} : { "Content-Type": "application/json" }),
		},
		body: body === undefined ? undefined : JSON.stringify(body),
	});
}

async function createPlayer(label: string): Promise<Player> {
	const email = `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
	const password = `clave-${label}-123456`;
	const credentials = { email, password };

	const signUp = await request("/api/auth/sign-up/email", null, {
		...credentials,
		name: "",
	});
	assert.equal(signUp.status, 200);

	const { rows } = await pool.query(
		`update "user" set email_verified = true where email = $1 returning id`,
		[email],
	);

	const signIn = await request("/api/auth/sign-in/email", null, credentials);
	assert.equal(signIn.status, 200);

	const cookie = signIn.headers
		.getSetCookie()
		.map((value) => value.split(";")[0])
		.join("; ");

	return { id: rows[0].id, cookie };
}

const push = (player: Player | null, columns: object, previous: string | null) =>
	request("/api/learning-data", player, {
		columns,
		updatedAt: NOW(),
		previousVersion: previous,
	});

const entry = (scope = "flags:europe@2", bestTimeMs = 20_000) => ({
	scope,
	displayName: "Ana",
	avatarStyle: "fun-emoji",
	avatarSeed: "a",
	bestTimeMs,
});

let ana: Player;
let beto: Player;

beforeAll(async () => {
	ana = await createPlayer("ana");
	beto = await createPlayer("beto");
});

afterAll(() => pool.end());

describe("user_learning_data", () => {
	test("select own data: sin sesión, 401", async () => {
		assert.equal((await request("/api/learning-data", null)).status, 401);
	});

	test("insert own data: sin sesión, 401 y no escribe", async () => {
		assert.equal((await push(null, { profile: PROFILE }, null)).status, 401);
	});

	test("insert own data: un user_id en el cuerpo no suplanta a nadie", async () => {
		const response = await push(
			ana,
			{ profile: PROFILE, user_id: beto.id },
			null,
		);

		assert.equal(response.status, 400);

		const { rows } = await pool.query(
			"select 1 from user_learning_data where user_id = $1",
			[beto.id],
		);
		assert.equal(rows.length, 0);
	});

	test("select own data: cada cuenta ve solo su fila", async () => {
		assert.equal((await push(ana, { profile: PROFILE }, null)).status, 200);

		const own = await (await request("/api/learning-data", ana)).json();
		assert.deepEqual(own.row.profile, PROFILE);

		const other = await (await request("/api/learning-data", beto)).json();
		assert.equal(other.row, null);
	});

	test("update own data: la versión de otro no abre su fila", async () => {
		const { row } = await (await request("/api/learning-data", ana)).json();
		const response = await push(beto, { stats: { hack: 1 } }, row.updated_at);

		assert.deepEqual(await response.json(), { written: false });

		const after = await (await request("/api/learning-data", ana)).json();
		assert.deepEqual(after.row.stats, {});
	});
});

describe("versión de la fila (D210)", () => {
	test("una fila escrita con now() (microsegundos) se puede actualizar", async () => {
		const player = await createPlayer("micro");

		await pool.query(
			"insert into user_learning_data (user_id, profile) values ($1, $2)",
			[player.id, PROFILE],
		);

		const { row } = await (await request("/api/learning-data", player)).json();

		assert.match(row.updated_at, /\.\d{4,6}[+-]\d{2}:\d{2}$/);

		const response = await push(player, { stats: { a: 1 } }, row.updated_at);

		assert.deepEqual(await response.json(), { written: true });
	});

	test("una subida con la versión vieja no pisa nada", async () => {
		const player = await createPlayer("conflicto");

		await push(player, { profile: PROFILE }, null);

		const { row } = await (await request("/api/learning-data", player)).json();

		const first = await push(player, { stats: { d: 1 } }, row.updated_at);
		assert.deepEqual(await first.json(), { written: true });

		const late = await push(player, { stats: { d: 2 } }, row.updated_at);
		assert.deepEqual(await late.json(), { written: false });

		const after = await (await request("/api/learning-data", player)).json();
		assert.deepEqual(after.row.stats, { d: 1 });
	});

	test("crear la fila dos veces: la segunda no escribe", async () => {
		const player = await createPlayer("doble");

		const first = await push(player, { profile: PROFILE }, null);
		assert.deepEqual(await first.json(), { written: true });

		const second = await push(player, { profile: { ...PROFILE, name: "B" } }, null);
		assert.deepEqual(await second.json(), { written: false });
	});

	test("un null en una columna obligatoria se rechaza", async () => {
		const { row } = await (await request("/api/learning-data", ana)).json();

		assert.equal(
			(await push(ana, { profile: null }, row.updated_at)).status,
			400,
		);
	});
});

describe("leaderboard_entries", () => {
	test("publicly readable: sin sesión se lee", async () => {
		const response = await request("/api/leaderboard?scope=flags:europe@2", null);

		assert.equal(response.status, 200);
	});

	test("upsert own entry: sin sesión, 401", async () => {
		assert.equal((await request("/api/leaderboard", null, entry())).status, 401);
	});

	test("upsert own entry: la fila queda a nombre de la sesión", async () => {
		const response = await request("/api/leaderboard", ana, {
			...entry(),
			userId: beto.id,
			user_id: beto.id,
		});

		assert.equal(response.status, 200);

		const { rows } = await pool.query(
			"select user_id from leaderboard_entries where scope = $1 and user_id = $2",
			["flags:europe@2", beto.id],
		);
		assert.equal(rows.length, 0);
	});

	test("update own entry: el perfil solo cambia las filas de la sesión", async () => {
		await request("/api/leaderboard", beto, entry("flags:asia@2", 30_000));

		const response = await request("/api/leaderboard/profile", ana, {
			displayName: "Ana Nueva",
			avatarStyle: "fun-emoji",
			avatarSeed: "b",
		});
		assert.deepEqual(await response.json(), { changed: 1 });

		const { rows } = await pool.query(
			"select display_name from leaderboard_entries where user_id = $1",
			[beto.id],
		);
		assert.equal(rows[0].display_name, "Ana");
	});

	test("update own entry: sin cambios no escribe", async () => {
		const response = await request("/api/leaderboard/profile", ana, {
			displayName: "Ana Nueva",
			avatarStyle: "fun-emoji",
			avatarSeed: "b",
		});

		assert.deepEqual(await response.json(), { changed: 0 });
	});

	test("update own entry: sin sesión, 401", async () => {
		const response = await request("/api/leaderboard/profile", null, {
			displayName: "X",
			avatarStyle: null,
			avatarSeed: null,
		});

		assert.equal(response.status, 401);
	});

	test("el trigger sigue mandando: 422 con PT422", async () => {
		const response = await request(
			"/api/leaderboard",
			ana,
			entry("flags:asia@2", 100),
		);

		assert.equal(response.status, 422);
		assert.equal((await response.json()).code, "PT422");
	});

	test("una marca peor no pisa la mejor (D139)", async () => {
		await request("/api/leaderboard", ana, entry("flags:europe@2", 60_000));

		const { rows } = await pool.query(
			"select best_time_ms from leaderboard_entries where scope = $1 and user_id = $2",
			["flags:europe@2", ana.id],
		);
		assert.equal(rows[0].best_time_ms, 20_000);
	});
});

describe("cuenta importada de Supabase", () => {
	test("entra con su contraseña en bcrypt", async () => {
		const id = crypto.randomUUID();
		const email = `importada-${Date.now()}@example.test`;
		const password = "contraseña-de-supabase";

		await pool.query(
			`insert into "user" (id, name, email, email_verified) values ($1, '', $2, true)`,
			[id, email],
		);
		await pool.query(
			`insert into account (account_id, provider_id, user_id, password) values ($1, 'credential', $2, $3)`,
			[id, id, await bcrypt.hash(password, 10)],
		);

		const wrong = await request("/api/auth/sign-in/email", null, {
			email,
			password: "otra-contraseña",
		});
		assert.equal(wrong.status, 401);

		const right = await request("/api/auth/sign-in/email", null, {
			email,
			password,
		});
		assert.equal(right.status, 200);
		assert.equal((await right.json()).user.id, id);
	});

	test("sin confirmar no entra, aunque la contraseña valga", async () => {
		const id = crypto.randomUUID();
		const email = `sin-confirmar-${Date.now()}@example.test`;
		const password = "contraseña-de-supabase";

		await pool.query(`insert into "user" (id, name, email) values ($1, '', $2)`, [
			id,
			email,
		]);
		await pool.query(
			`insert into account (account_id, provider_id, user_id, password) values ($1, 'credential', $2, $3)`,
			[id, id, await bcrypt.hash(password, 10)],
		);

		const response = await request("/api/auth/sign-in/email", null, {
			email,
			password,
		});
		assert.equal(response.status, 403);
	});
});

describe("app_config", () => {
	test("lectura pública de la mínima, sin sesión", async () => {
		const response = await request("/api/min-version", null);

		assert.equal(response.status, 200);
		assert.deepEqual(await response.json(), { value: "2.0.0" });
	});
});

describe("push_subscriptions", () => {
	const subscription = (deviceId: string, userId: string | null) => ({
		deviceId,
		userId,
		endpoint: `https://push.example.test/${deviceId}`,
		p256dh: "clave",
		auth: "auth",
		timezone: "Europe/Madrid",
		reminderHour: 9,
	});

	test("un invitado se suscribe", async () => {
		const response = await request(
			"/api/push/subscribe",
			null,
			subscription(`invitado-${Date.now()}`, null),
		);

		assert.equal(response.status, 200);
	});

	test("no se puede atribuir la suscripción a otra cuenta", async () => {
		const deviceId = `ajeno-${Date.now()}`;

		for (const player of [null, beto]) {
			const response = await request(
				"/api/push/subscribe",
				player,
				subscription(deviceId, ana.id),
			);

			assert.equal(response.status, 401);
		}

		const { rows } = await pool.query(
			"select 1 from push_subscriptions where device_id = $1",
			[deviceId],
		);
		assert.equal(rows.length, 0);
	});

	test("con la propia cuenta, sí", async () => {
		const response = await request(
			"/api/push/subscribe",
			ana,
			subscription(`propio-${Date.now()}`, ana.id),
		);

		assert.equal(response.status, 200);
	});

	test("solo un endpoint https", async () => {
		const response = await request("/api/push/subscribe", null, {
			...subscription(`http-${Date.now()}`, null),
			endpoint: "http://169.254.169.254/latest",
		});

		assert.equal(response.status, 400);
	});

	test("no hay lectura desde la API", async () => {
		const response = await request("/api/push/subscribe", ana);

		assert.equal(response.status, 404);
	});

	test("el cron exige su secreto", async () => {
		for (const player of [null, ana]) {
			const response = await request(
				"/api/cron/send-daily-reminders",
				player,
				{},
			);

			assert.equal(response.status, 401);
		}
	});
});
