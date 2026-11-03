import { createAuthClient } from "better-auth/client";

import {
	type AuthEvent,
	type KnownSession,
	nextSessionState,
	type SessionCheck,
} from "@/utils/auth-session-state";
import {
	clearAuthIdentity,
	getAuthIdentity,
	saveAuthIdentity,
	takeLegacySupabaseIdentity,
} from "@/utils/learning-storage";

/**
 * Siempre la URL de la página (cada preview tiene la suya). Al prerenderizar no hay
 * `window`, y sin `baseURL` el cliente lanza al importarse; ahí nunca se llama.
 */
export const authClient = createAuthClient({
	baseURL:
		typeof window === "undefined"
			? import.meta.env.SITE
			: window.location.origin,
});

/** Como la red de seguridad de `GameEffects`: una respuesta colgada no bloquea. */
const SESSION_TIMEOUT_MS = 8_000;

/** Al volver a la app no se pregunta más a menudo que esto. */
const RECHECK_ON_RETURN_MS = 5 * 60_000;

const CHANNEL_NAME = "world-flags-auth";

type AuthListener = (
	event: AuthEvent,
	session: KnownSession | null,
	endedUserId: string | null,
) => void;

const listeners = new Set<AuthListener>();

/** `undefined` hasta la primera respuesta del servidor. */
let known: KnownSession | null | undefined;
let started = false;
let lastCheckAt = 0;
let channel: BroadcastChannel | null = null;
let inFlight: Promise<SessionCheck> | null = null;

async function readSession(fresh: boolean): Promise<SessionCheck> {
	if (typeof navigator !== "undefined" && !navigator.onLine) {
		return { kind: "unreachable" };
	}

	try {
		const { data, error } = await authClient.getSession({
			query: fresh ? { disableCookieCache: true } : undefined,
			fetchOptions: { signal: AbortSignal.timeout(SESSION_TIMEOUT_MS) },
		});

		if (error) {
			return error.status === 401 ? { kind: "none" } : { kind: "unreachable" };
		}

		if (!data) return { kind: "none" };

		return {
			kind: "session",
			session: {
				user: { id: data.user.id, email: data.user.email },
				sessionId: data.session.id,
			},
		};
	} catch {
		return { kind: "unreachable" };
	}
}

function apply(check: SessionCheck): void {
	const stored =
		known === undefined
			? (getAuthIdentity() ?? takeLegacySupabaseIdentity())
			: null;
	const next = nextSessionState(known, stored, check);

	known = next.session;

	if (next.session) saveAuthIdentity(next.session);
	else if (check.kind === "none") clearAuthIdentity();

	if (next.event) {
		for (const listener of listeners) {
			listener(next.event, next.session, next.endedUserId);
		}
	}
}

/** Las peticiones simultáneas comparten respuesta: no se pregunta dos veces. */
function checkSession(fresh = true): Promise<SessionCheck> {
	inFlight ??= readSession(fresh)
		.then((check) => {
			lastCheckAt = Date.now();
			apply(check);

			return check;
		})
		.finally(() => {
			inFlight = null;
		});

	return inFlight;
}

function start(): void {
	if (started) return;

	started = true;

	void checkSession(false);

	window.addEventListener("online", () => void checkSession());

	document.addEventListener("visibilitychange", () => {
		if (
			document.visibilityState === "visible" &&
			Date.now() - lastCheckAt > RECHECK_ON_RETURN_MS
		) {
			void checkSession();
		}
	});

	// El popup de Google y las otras pestañas: la cookie no avisa de sus cambios.
	if (typeof BroadcastChannel !== "undefined") {
		channel = new BroadcastChannel(CHANNEL_NAME);
		channel.onmessage = () => void checkSession();
	}
}

/** Avisa de cada cambio de sesión. Devuelve la función que lo suelta. */
export function subscribeToAuth(listener: AuthListener): () => void {
	listeners.add(listener);

	if (known !== undefined) {
		listener(known ? "SIGNED_IN" : "NO_SESSION", known, null);
	}

	start();

	return () => listeners.delete(listener);
}

/** Tras entrar: esta pestaña se pone al día y las demás lo oyen. */
export async function announceSignIn(): Promise<void> {
	await checkSession();

	channel?.postMessage("changed");
}

/**
 * ¿Sigue la sesión? Para `GameEffects` cuando el servidor rechaza una petición
 * (D210). Sin respuesta se da por buena: no es un rechazo, y el reintento decide.
 */
export async function recheckSession(): Promise<boolean> {
	return (await checkSession()).kind !== "none";
}

/** Marca la sesión como cerrada aquí y en las demás pestañas. */
function endSession(): void {
	apply({ kind: "none" });

	channel?.postMessage("changed");
}

/** Cierre pedido por el usuario. Si el servidor no responde, la sesión sigue. */
export async function signOutOfAccount(): Promise<{ failed: boolean }> {
	try {
		const { error } = await authClient.signOut();

		if (error) return { failed: true };
	} catch {
		return { failed: true };
	}

	endSession();

	return { failed: false };
}

/**
 * El servidor rechazó la sesión dos veces (D210): se cierra en este dispositivo
 * aunque el servidor no llegue a enterarse.
 */
export async function discardRejectedSession(): Promise<void> {
	try {
		await authClient.signOut();
	} catch {
		// La cookie caduca sola; aquí la sesión ya no se usa.
	}

	endSession();
}
