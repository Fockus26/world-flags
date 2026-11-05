/**
 * Precarga de banderas del service worker (D054, D229), con `public/sw.js`
 * cargado en un entorno simulado: caché en memoria y una red que se puede
 * colgar o fallar. Los tiempos se acortan para que el test vaya rápido.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import { getFlagUrls } from "@/utils/flag-precache";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const SOURCE = readFileSync(join(ROOT, "public", "sw.js"), "utf8");

const FAST_TIMINGS: Record<string, string> = {
	PRECACHE_TIMEOUT_MS: "40",
	PRECACHE_BACKOFF_MS: "[10, 50, 100]",
	PRECACHE_RUN_MS: "1_000",
};

type NetworkBehaviour = (url: string, attempt: number) => "ok" | "fail" | "hang";

interface Harness {
	cached: Set<string>;
	requested: string[];
	maxInFlight: number;
	send: (data: unknown) => Promise<void>;
}

function loadServiceWorker(network: NetworkBehaviour): Harness {
	let source = SOURCE;
	for (const [name, value] of Object.entries(FAST_TIMINGS)) {
		const pattern = new RegExp(`const ${name} = [^;]+;`);
		assert.match(source, pattern, `sw.js define ${name}`);
		source = source.replace(pattern, `const ${name} = ${value};`);
	}

	const cached = new Set<string>();
	const requested: string[] = [];
	const attempts = new Map<string, number>();
	let inFlight = 0;
	let maxInFlight = 0;
	const listeners = new Map<string, (event: unknown) => void>();

	const cache = {
		match: async (url: string) => (cached.has(url) ? new Response("") : undefined),
		put: async (url: string, response: Response) => {
			await response.text();
			cached.add(url);
		},
		add: async (url: string) => {
			cached.add(url);
		},
		keys: async () => [],
		delete: async () => true,
	};

	const fakeFetch = (url: string, init?: { signal?: AbortSignal }) => {
		const attempt = (attempts.get(url) ?? 0) + 1;
		attempts.set(url, attempt);
		requested.push(url);
		inFlight += 1;
		maxInFlight = Math.max(maxInFlight, inFlight);
		const behaviour = network(url, attempt);

		return new Promise<Response>((resolve, reject) => {
			const settle = (action: () => void) => {
				inFlight -= 1;
				action();
			};
			init?.signal?.addEventListener("abort", () =>
				settle(() => reject(new DOMException("aborted", "AbortError"))),
			);
			if (behaviour === "hang") return;
			setTimeout(
				() =>
					settle(() =>
						behaviour === "ok"
							? resolve(new Response("<svg/>"))
							: reject(new TypeError("Failed to fetch")),
					),
				1,
			);
		});
	};

	const self = {
		addEventListener: (type: string, listener: (event: unknown) => void) =>
			listeners.set(type, listener),
		skipWaiting: () => {},
		location: { origin: "https://example.test" },
		clients: { claim: () => {} },
		registration: {},
	};

	new Function("self", "caches", "fetch", source)(
		self,
		{ open: async () => cache, keys: async () => [], delete: async () => true },
		fakeFetch,
	);

	return {
		cached,
		requested,
		get maxInFlight() {
			return maxInFlight;
		},
		send: async (data) => {
			const pending: Promise<unknown>[] = [];
			listeners.get("message")?.({
				data,
				waitUntil: (promise: Promise<unknown>) => pending.push(promise),
			});
			await Promise.all(pending);
		},
	};
}

const URLS = getFlagUrls();

describe("precarga de banderas del service worker", () => {
	test("con buena red guarda las 197, varias a la vez", async () => {
		const sw = loadServiceWorker(() => "ok");

		await sw.send({ type: "PRECACHE_FLAGS", urls: URLS });

		assert.equal(sw.cached.size, 197);
		assert.ok(sw.maxInFlight > 1, "descarga en paralelo");
		assert.ok(sw.maxInFlight <= 5, "sin pasar del límite");
	});

	test("un fallo puntual no para el resto y se reintenta", async () => {
		const sw = loadServiceWorker((url, attempt) =>
			url === URLS[9] && attempt === 1 ? "fail" : "ok",
		);

		await sw.send({ type: "PRECACHE_FLAGS", urls: URLS });

		assert.equal(sw.cached.size, 197);
	});

	test("una red colgada se corta con el límite de espera y retoma al volver", async () => {
		let hanging = true;
		let seen = 0;
		const sw = loadServiceWorker(() => {
			seen += 1;
			return hanging && seen > 10 ? "hang" : "ok";
		});
		setTimeout(() => {
			hanging = false;
		}, 150);

		await sw.send({ type: "PRECACHE_FLAGS", urls: URLS });

		assert.equal(sw.cached.size, 197);
	});

	test("las banderas con prioridad van primero, también con la precarga en marcha", async () => {
		const sw = loadServiceWorker(() => "ok");
		const first = sw.send({ type: "PRECACHE_FLAGS", urls: URLS });
		const late = URLS.slice(-2);

		const second = sw.send({ type: "PRECACHE_FLAGS", urls: URLS, priority: late });
		await Promise.all([first, second]);

		assert.equal(sw.cached.size, 197);
		const position = (url: string) => sw.requested.indexOf(url);
		for (const url of late) {
			assert.ok(position(url) < 20, `${url} se pide entre las primeras`);
		}
	});

	test("solo pide lo que falta y nada fuera de /flags", async () => {
		const sw = loadServiceWorker(() => "ok");
		sw.cached.add(URLS[0]);

		await sw.send({
			type: "PRECACHE_FLAGS",
			urls: [URLS[0], URLS[1], "/index.html", "https://evil.example/flags/fr.svg"],
			priority: ["/flags/../sw.js", 42],
		});

		assert.deepEqual(sw.requested, [URLS[1]]);
	});

	test("si la red no vuelve, termina dentro de su tiempo máximo", async () => {
		const sw = loadServiceWorker(() => "fail");
		const started = Date.now();

		await sw.send({ type: "PRECACHE_FLAGS", urls: URLS });

		assert.equal(sw.cached.size, 0);
		assert.ok(Date.now() - started < 3_000);
		// Cada pasada se corta tras unos pocos fallos seguidos: no gasta un
		// intento por cada una de las 197 en cada vuelta.
		assert.ok(sw.requested.length < 197 * 2);
	});
});
