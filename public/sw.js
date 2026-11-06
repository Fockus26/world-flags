const CACHE_NAME = "banderas-cache-v4";
const OFFLINE_URL = "/";

// Versión de la app que trae este service worker: siempre la de
// `package.json` (lo exige `tests/unit/sw-version.test.ts`, D107). Así cada
// versión cambia al menos un byte de este archivo, el navegador instala un
// service worker nuevo y la app ofrece "Actualizar" a las pestañas abiertas
// con la anterior; si no, seguirían con el bundle viejo. Antes solo cambiaba
// cuando alguien se acordaba de tocar un comentario (la última vez, 1.2.0).
// `CACHE_NAME` no cambia a propósito: las banderas ya precargadas (D054)
// siguen valiendo.
const APP_VERSION = "2.11.1";

// Sin `skipWaiting()` automático a propósito: así el service worker nuevo se
// queda "esperando" (`registration.waiting`) en vez de tomar el control de
// golpe, y la app puede ofrecer el botón "Actualizar" (ver
// `useServiceWorkerUpdate.ts`) en vez de recargar sin avisar. Solo salta a
// activarse cuando ese botón manda el mensaje de abajo.
//
// La excepción, una sola vez por navegador (D227): los service workers anteriores
// a la API propia cachean todo GET del mismo origen, también `/api/*`, y mientras
// sigan al mando la sesión va una recarga por detrás. El primero que no lo hace
// toma el control sin esperar al botón; la marca evita que lo repitan los siguientes.
const API_BYPASS_MARKER = "/__sw-api-bypass";

async function install() {
	const cache = await caches.open(CACHE_NAME);

	await cache.add(OFFLINE_URL);

	if (await cache.match(API_BYPASS_MARKER)) return;

	await cache.put(API_BYPASS_MARKER, new Response("1"));
	self.skipWaiting();
}

self.addEventListener("install", (event) => {
	event.waitUntil(install());
});

// Solo banderas propias: el mensaje viene de la página, pero se valida igual.
const FLAG_URL_PATTERN = /^\/flags\/[a-z0-9-]+\.svg$/;

// Precarga de banderas (D054, D229): la app manda la lista del catálogo y aquí
// se descargan las que falten en caché. Idempotente: con todo guardado no pide
// nada. Antes iba una a una, sin límite de espera y se paraba en el primer
// fallo: con una red que se cuelga o un solo error se quedaba a medias hasta
// la siguiente carga de la página.
//
// - Varias a la vez (`PRECACHE_CONCURRENCY`), cada una con su límite de espera.
// - Un fallo no para el resto: la bandera vuelve a la cola y se reintenta en la
//   siguiente pasada, tras una espera creciente.
// - Muchos fallos seguidos = la red no responde: se corta la pasada y se espera,
//   en vez de gastar un límite de espera por cada bandera que queda.
// - `priority`: las banderas que la partida va a enseñar enseguida pasan
//   delante, también si ya hay una precarga en marcha.
// - Una sola precarga a la vez; cada mensaje nuevo se suma a la que corre. Dura
//   como mucho `PRECACHE_RUN_MS` (el navegador corta antes las esperas largas
//   de un service worker); lo que falte sigue con el siguiente mensaje.
const PRECACHE_CONCURRENCY = 5;
const PRECACHE_TIMEOUT_MS = 8_000;
const PRECACHE_MAX_CONSECUTIVE_FAILURES = 10;
const PRECACHE_BACKOFF_MS = [2_000, 4_000, 8_000, 15_000, 30_000];
const PRECACHE_RUN_MS = 4 * 60_000;

const precacheState = { pending: [], run: null };

function queueFlags(urls, priority) {
	if (priority) {
		const queued = new Set(urls);
		precacheState.pending = [
			...urls,
			...precacheState.pending.filter((url) => !queued.has(url)),
		];
		return;
	}

	const queued = new Set(precacheState.pending);
	precacheState.pending.push(...urls.filter((url) => !queued.has(url)));
}

async function fetchFlagIntoCache(cache, url) {
	const controller = new AbortController();
	// El límite cubre también el cuerpo: `cache.put` lo lee con la misma señal.
	const timeoutId = setTimeout(() => controller.abort(), PRECACHE_TIMEOUT_MS);

	try {
		const response = await fetch(url, { signal: controller.signal });
		if (!response.ok) return false;

		await cache.put(url, response);
		return true;
	} catch {
		return false;
	} finally {
		clearTimeout(timeoutId);
	}
}

async function precachePass(cache) {
	const failed = [];
	let succeeded = 0;
	let consecutiveFailures = 0;

	async function worker() {
		while (consecutiveFailures < PRECACHE_MAX_CONSECUTIVE_FAILURES) {
			const url = precacheState.pending.shift();
			if (url === undefined) return;
			if (await cache.match(url)) continue;

			if (await fetchFlagIntoCache(cache, url)) {
				succeeded += 1;
				consecutiveFailures = 0;
			} else {
				failed.push(url);
				consecutiveFailures += 1;
			}
		}
	}

	await Promise.all(Array.from({ length: PRECACHE_CONCURRENCY }, worker));

	return { failed, succeeded };
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runPrecache() {
	const cache = await caches.open(CACHE_NAME);
	const deadline = Date.now() + PRECACHE_RUN_MS;
	let round = 0;

	while (precacheState.pending.length > 0 && Date.now() < deadline) {
		const { failed, succeeded } = await precachePass(cache);

		queueFlags(failed, false);
		if (precacheState.pending.length === 0) return;

		// Si la pasada avanzó, la red funciona: la siguiente espera vuelve a ser corta.
		round = succeeded > 0 ? 0 : round + 1;
		const delay = PRECACHE_BACKOFF_MS[Math.min(round, PRECACHE_BACKOFF_MS.length - 1)];
		if (Date.now() + delay >= deadline) return;

		await wait(delay);
	}
}

function precacheFlags(urls, priorityUrls) {
	queueFlags(urls, false);
	queueFlags(priorityUrls, true);

	if (!precacheState.run) {
		precacheState.run = runPrecache().finally(() => {
			precacheState.run = null;
		});
	}

	return precacheState.run;
}

self.addEventListener("message", (event) => {
	if (event.data?.type === "SKIP_WAITING") {
		self.skipWaiting();
	}

	if (event.data?.type === "PRECACHE_FLAGS" && Array.isArray(event.data.urls)) {
		const isFlagUrl = (url) => typeof url === "string" && FLAG_URL_PATTERN.test(url);
		const urls = event.data.urls.filter(isFlagUrl);
		const priorityUrls = Array.isArray(event.data.priority)
			? event.data.priority.filter(isFlagUrl)
			: [];

		event.waitUntil(precacheFlags(urls, priorityUrls));
	}
});

// Recordatorio diario: `/api/cron/send-daily-reminders` manda un push
// con `{ title, body }` en el payload JSON.
self.addEventListener("push", (event) => {
	let payload = { title: "Banderas del Mundo", body: "Tienes un recordatorio nuevo." };

	try {
		if (event.data) payload = { ...payload, ...event.data.json() };
	} catch {
		// Payload no-JSON: se queda el genérico de arriba.
	}

	event.waitUntil(
		self.registration.showNotification(payload.title, {
			body: payload.body,
			icon: "/pwa-192x192.png",
			badge: "/pwa-192x192.png",
			tag: "daily-reminder",
		}),
	);
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();

	event.waitUntil(
		self.clients.matchAll({ type: "window" }).then((clientList) => {
			for (const client of clientList) {
				if ("focus" in client) return client.focus();
			}
			return self.clients.openWindow("/");
		}),
	);
});

// Lo que un service worker anterior guardó de la API: nadie vuelve a leerlo, y lleva
// datos de la sesión.
async function purgeApiResponses() {
	const cache = await caches.open(CACHE_NAME);
	const requests = await cache.keys();

	await Promise.all(
		requests
			.filter((request) => new URL(request.url).pathname.startsWith("/api/"))
			.map((request) => cache.delete(request)),
	);
}

self.addEventListener("activate", (event) => {
	event.waitUntil(
		Promise.all([
			caches
				.keys()
				.then((keys) =>
					Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
				),
			purgeApiResponses(),
		]),
	);
	self.clients.claim();
});

self.addEventListener("fetch", (event) => {
	const { request } = event;
	if (request.method !== "GET") return;

	// La API, directo a la red: una respuesta suya nunca se cachea y sin red tiene que
	// fallar como fallo de red. Antes que la navegación: los enlaces de Auth
	// (`/api/auth/*`, el del correo y la vuelta de Google) son navegaciones.
	const { origin, pathname } = new URL(request.url);
	if (origin === self.location.origin && pathname.startsWith("/api/")) return;

	// Navegación (el HTML de la app): siempre se intenta la red primero, para
	// que abrir la PWA instalada cargue la última versión (con las últimas
	// referencias a los bundles con hash) en vez de quedarse pegada
	// indefinidamente a una versión vieja cacheada. Solo cae al cache/offline
	// si no hay red.
	if (request.mode === "navigate") {
		event.respondWith(
			fetch(request)
				.then((response) => {
					if (response.ok) {
						const clone = response.clone();
						caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
					}
					return response;
				})
				.catch(() => caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))),
		);
		return;
	}

	// Otros orígenes (avatares de dicebear, Google Fonts): directo a
	// la red, sin pasar por aquí. Nunca se cacheaban, y responderles con la
	// página offline cuando no hay red hacía que un GET ajeno recibiera
	// HTML con 200 en vez de un error de red: la app no podía saber que estaba
	// sin conexión. La caché HTTP del navegador sigue aplicando (un avatar ya
	// visto carga sin red).
	if (new URL(request.url).origin !== self.location.origin) return;

	event.respondWith(
		caches.match(request).then((cached) => {
			const network = fetch(request)
				.then((response) => {
					if (response.ok) {
						const clone = response.clone();
						caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
					}
					return response;
				})
				// Un recurso que no está en caché y no llega (una bandera nunca
				// vista, sin red) falla como fallo de red, no con el HTML de la
				// app — que como imagen o script no sirve de nada.
				.catch(() => cached || Response.error());
			return cached || network;
		}),
	);
});
