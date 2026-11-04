/**
 * Qué pasa con la sesión según lo que responde el servidor. Puro, sin red ni
 * `localStorage`, para probarlo sin navegador (`auth-session.ts` hace el resto).
 *
 * Con Supabase la sesión vivía en `localStorage` y se leía sin conexión. Con cookie
 * httpOnly el navegador no puede leerla: se guarda aparte quién es el jugador, y sin
 * respuesta del servidor se sigue con esa identidad. Sin eso, una cuenta sin red
 * parecería invitado y dejaría de apartar su progreso (D050, D056).
 */

export interface AuthUser {
	id: string;
	email: string;
}

export interface KnownSession {
	user: AuthUser;
	/** `null` en la identidad heredada de Supabase, que no tiene sesión aquí. */
	sessionId: string | null;
}

/** Qué dijo el servidor. `unreachable`: sin red, sin respuesta o un 5xx. */
export type SessionCheck =
	| { kind: "session"; session: KnownSession }
	| { kind: "none" }
	| { kind: "unreachable" };

export type AuthEvent = "SIGNED_IN" | "SIGNED_OUT" | "NO_SESSION";

export interface SessionTransition {
	/** La sesión que queda; `null` si no hay. */
	session: KnownSession | null;
	/** Qué avisar; `null` si nada cambió. */
	event: AuthEvent | null;
	/** La cuenta que había cuando se cierra, para avisar y apartar lo pendiente. */
	endedUserId: string | null;
}

function isSameSession(a: KnownSession, b: KnownSession): boolean {
	return a.user.id === b.user.id && a.sessionId === b.sessionId;
}

/**
 * `known` es la sesión de esta pestaña: `undefined` hasta la primera respuesta.
 * `stored` es la identidad guardada en este dispositivo, que solo cuenta entonces.
 */
export function nextSessionState(
	known: KnownSession | null | undefined,
	stored: KnownSession | null,
	check: SessionCheck,
): SessionTransition {
	if (check.kind === "session") {
		const unchanged = known && isSameSession(known, check.session);

		return {
			session: unchanged ? known : check.session,
			event: unchanged ? null : "SIGNED_IN",
			endedUserId: null,
		};
	}

	if (check.kind === "unreachable") {
		// Una caída a mitad de partida no cambia nada: la respuesta llegará luego.
		if (known !== undefined) {
			return { session: known, event: null, endedUserId: null };
		}

		return stored
			? { session: stored, event: "SIGNED_IN", endedUserId: null }
			: { session: null, event: "NO_SESSION", endedUserId: null };
	}

	const previous = known === undefined ? stored : known;

	if (previous) {
		return {
			session: null,
			event: "SIGNED_OUT",
			endedUserId: previous.user.id,
		};
	}

	return {
		session: null,
		event: known === undefined ? "NO_SESSION" : null,
		endedUserId: null,
	};
}
