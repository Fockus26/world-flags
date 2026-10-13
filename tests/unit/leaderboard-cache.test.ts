/**
 * Caché del ranking (D188): un scope visto hace menos de 60 s no se vuelve a
 * pedir, dos aperturas seguidas comparten la petición, un error no se guarda
 * y subir una marca o cambiar de perfil/sesión la invalida. Quien se
 * suscribe se entera de cada invalidación (D198).
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { LeaderboardEntry } from "@/utils/cloud-storage";
import {
	createLeaderboardCache,
	LEADERBOARD_CACHE_TTL_MS,
} from "@/utils/leaderboard-cache";

const WORLD = "rush_flags_world";
const EUROPE = "rush_flags_europe";

function entry(userId: string, bestTimeMs: number): LeaderboardEntry {
	return { userId, displayName: userId, bestTimeMs, avatar: null };
}

/** Reloj manual y un `fetcher` que cuenta las peticiones por scope. */
function setup() {
	let time = 1_000_000;
	const calls: string[] = [];
	const cache = createLeaderboardCache({ now: () => time });
	const fetcher = async (scope: string) => {
		calls.push(scope);
		return [entry(`${scope}-${calls.length}`, 60_000)];
	};

	return {
		cache,
		fetcher,
		calls,
		advance: (ms: number) => {
			time += ms;
		},
	};
}

describe("leaderboard-cache", () => {
	test("dentro de 60 s devuelve lo guardado sin volver a pedir", async () => {
		const { cache, fetcher, calls, advance } = setup();

		const first = await cache.load(WORLD, fetcher);
		advance(LEADERBOARD_CACHE_TTL_MS - 1);
		const second = await cache.load(WORLD, fetcher);

		assert.deepEqual(calls, [WORLD]);
		assert.equal(second, first);
		assert.equal(cache.peek(WORLD), first);
	});

	test("a los 60 s caduca y se vuelve a pedir", async () => {
		const { cache, fetcher, calls, advance } = setup();

		await cache.load(WORLD, fetcher);
		advance(LEADERBOARD_CACHE_TTL_MS);

		assert.equal(cache.peek(WORLD), null);
		await cache.load(WORLD, fetcher);
		assert.deepEqual(calls, [WORLD, WORLD]);
	});

	test("cada scope va aparte", async () => {
		const { cache, fetcher, calls } = setup();

		await cache.load(WORLD, fetcher);
		await cache.load(EUROPE, fetcher);
		await cache.load(WORLD, fetcher);
		await cache.load(EUROPE, fetcher);

		assert.deepEqual(calls, [WORLD, EUROPE]);
	});

	test("dos cargas seguidas comparten la petición en vuelo", async () => {
		const { cache, fetcher, calls } = setup();

		const [a, b] = await Promise.all([
			cache.load(WORLD, fetcher),
			cache.load(WORLD, fetcher),
		]);

		assert.deepEqual(calls, [WORLD]);
		assert.equal(a, b);
	});

	test("un error no se guarda: la siguiente carga reintenta", async () => {
		const { cache, fetcher, calls } = setup();
		let failures = 0;
		const failing = async () => {
			failures += 1;
			throw new Error("red caída");
		};

		await assert.rejects(cache.load(WORLD, failing), /red caída/);
		assert.equal(cache.peek(WORLD), null);

		await cache.load(WORLD, fetcher);
		assert.equal(failures, 1);
		assert.deepEqual(calls, [WORLD]);
	});

	test("invalidar un scope solo borra ese", async () => {
		const { cache, fetcher, calls } = setup();

		await cache.load(WORLD, fetcher);
		await cache.load(EUROPE, fetcher);
		cache.invalidate(WORLD);

		assert.equal(cache.peek(WORLD), null);
		assert.notEqual(cache.peek(EUROPE), null);
		await cache.load(WORLD, fetcher);
		assert.deepEqual(calls, [WORLD, EUROPE, WORLD]);
	});

	test("vaciar borra todos los scopes", async () => {
		const { cache, fetcher } = setup();

		await cache.load(WORLD, fetcher);
		await cache.load(EUROPE, fetcher);
		cache.clear();

		assert.equal(cache.peek(WORLD), null);
		assert.equal(cache.peek(EUROPE), null);
	});

	test("una respuesta que llega tras invalidar no se guarda", async () => {
		const { cache, fetcher, calls } = setup();
		let resolveOld: (entries: LeaderboardEntry[]) => void = () => {};
		const slow = () =>
			new Promise<LeaderboardEntry[]>((resolve) => {
				resolveOld = resolve;
			});

		const pending = cache.load(WORLD, slow);
		// Se sube una marca nueva mientras la petición vieja sigue en vuelo.
		cache.invalidate(WORLD);
		const fresh = await cache.load(WORLD, fetcher);
		resolveOld([entry("viejo", 90_000)]);
		await pending;

		assert.deepEqual(calls, [WORLD]);
		assert.equal(cache.peek(WORLD), fresh);
	});

	test("invalidar avisa a los suscritos con ese scope", async () => {
		const { cache, fetcher } = setup();
		const seen: (string | null)[] = [];

		await cache.load(WORLD, fetcher);
		cache.subscribe((scope) => seen.push(scope));
		cache.invalidate(WORLD);
		cache.invalidate(EUROPE);

		assert.deepEqual(seen, [WORLD, EUROPE]);
	});

	test("vaciar avisa con null: todos los scopes", () => {
		const { cache } = setup();
		const seen: (string | null)[] = [];

		cache.subscribe((scope) => seen.push(scope));
		cache.clear();

		assert.deepEqual(seen, [null]);
	});

	test("cargar y caducar no avisan", async () => {
		const { cache, fetcher, advance } = setup();
		const seen: (string | null)[] = [];

		cache.subscribe((scope) => seen.push(scope));
		await cache.load(WORLD, fetcher);
		advance(LEADERBOARD_CACHE_TTL_MS);
		cache.peek(WORLD);

		assert.deepEqual(seen, []);
	});

	test("tras darse de baja no llegan más avisos", () => {
		const { cache } = setup();
		const seen: (string | null)[] = [];
		const other: (string | null)[] = [];

		const unsubscribe = cache.subscribe((scope) => seen.push(scope));
		cache.subscribe((scope) => other.push(scope));
		cache.invalidate(WORLD);
		unsubscribe();
		cache.invalidate(WORLD);

		assert.deepEqual(seen, [WORLD]);
		assert.deepEqual(other, [WORLD, WORLD]);
	});

	test("darse de baja dentro del aviso no salta al siguiente", () => {
		const { cache } = setup();
		const seen: string[] = [];

		const unsubscribe = cache.subscribe(() => {
			seen.push("a");
			unsubscribe();
		});
		cache.subscribe(() => seen.push("b"));
		cache.invalidate(WORLD);
		cache.invalidate(WORLD);

		assert.deepEqual(seen, ["a", "b", "b"]);
	});

	test("al recibir el aviso, recargar pide la marca nueva", async () => {
		const { cache, fetcher, calls } = setup();
		const reloaded: LeaderboardEntry[][] = [];

		const first = await cache.load(WORLD, fetcher);
		cache.subscribe((scope) => {
			if (scope === WORLD) {
				cache.load(WORLD, fetcher).then((entries) => reloaded.push(entries));
			}
		});
		cache.invalidate(WORLD);
		await new Promise((resolve) => setTimeout(resolve, 0));

		assert.deepEqual(calls, [WORLD, WORLD]);
		assert.equal(reloaded.length, 1);
		assert.notEqual(reloaded[0], first);
		assert.equal(cache.peek(WORLD), reloaded[0]);
	});
});
