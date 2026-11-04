/**
 * La sesión según lo que responde el servidor. Lo que se protege:
 *
 * - Sin respuesta, una cuenta sigue siendo esa cuenta: si pareciera invitado, su
 *   progreso sin subir dejaría de apartarse (D050, D056).
 * - Una caída a mitad de partida no cambia nada.
 * - Solo la respuesta "no hay sesión" la cierra, y entonces se avisa de qué cuenta
 *   era: `AuthEffects` avisa y `GameEffects` aparta lo pendiente (D210).
 * - Comprobar la misma sesión no avisa: `GameEffects` cancelaría su sincronización.
 * - Quien venía de Supabase sin sesión aquí recibe el aviso de volver a entrar.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
	type KnownSession,
	nextSessionState,
} from "@/utils/auth-session-state";

const session: KnownSession = {
	user: { id: "user-a", email: "a@example.test" },
	sessionId: "s1",
};

describe("nextSessionState: primera respuesta", () => {
	test("con sesión: entra", () => {
		const next = nextSessionState(undefined, null, {
			kind: "session",
			session,
		});

		assert.equal(next.event, "SIGNED_IN");
		assert.equal(next.session, session);
	});

	test("sin respuesta y con identidad guardada: sigue como cuenta", () => {
		const next = nextSessionState(undefined, session, { kind: "unreachable" });

		assert.equal(next.event, "SIGNED_IN");
		assert.equal(next.session, session);
		assert.equal(next.endedUserId, null);
	});

	test("sin respuesta y sin identidad: invitado, sin aviso", () => {
		const next = nextSessionState(undefined, null, { kind: "unreachable" });

		assert.equal(next.event, "NO_SESSION");
		assert.equal(next.session, null);
		assert.equal(next.endedUserId, null);
	});

	test("sin sesión e invitado de siempre: sin aviso", () => {
		const next = nextSessionState(undefined, null, { kind: "none" });

		assert.equal(next.event, "NO_SESSION");
		assert.equal(next.endedUserId, null);
	});

	test("sin sesión y con identidad (caducó, o venía de Supabase): se avisa", () => {
		const next = nextSessionState(
			undefined,
			{ user: session.user, sessionId: null },
			{ kind: "none" },
		);

		assert.equal(next.event, "SIGNED_OUT");
		assert.equal(next.session, null);
		assert.equal(next.endedUserId, "user-a");
	});
});

describe("nextSessionState: a mitad de partida", () => {
	test("la misma sesión no avisa y conserva el objeto", () => {
		const next = nextSessionState(session, null, {
			kind: "session",
			session: { ...session, user: { ...session.user } },
		});

		assert.equal(next.event, null);
		assert.equal(next.session, session);
	});

	test("sin respuesta no cambia nada, ni como cuenta ni como invitado", () => {
		for (const known of [session, null]) {
			const next = nextSessionState(known, null, { kind: "unreachable" });

			assert.equal(next.event, null);
			assert.equal(next.session, known);
		}
	});

	test("otra sesión de la misma cuenta avisa", () => {
		const next = nextSessionState(session, null, {
			kind: "session",
			session: { ...session, sessionId: "s2" },
		});

		assert.equal(next.event, "SIGNED_IN");
		assert.equal(next.session?.sessionId, "s2");
	});

	test("pasar de la identidad guardada a la sesión real, si es la misma, no avisa", () => {
		const next = nextSessionState(session, null, { kind: "session", session });

		assert.equal(next.event, null);
	});

	test("se cerró: dice qué cuenta era", () => {
		const next = nextSessionState(session, null, { kind: "none" });

		assert.equal(next.event, "SIGNED_OUT");
		assert.equal(next.session, null);
		assert.equal(next.endedUserId, "user-a");
	});

	test("invitado que sigue siéndolo: sin aviso", () => {
		const next = nextSessionState(null, null, { kind: "none" });

		assert.equal(next.event, null);
		assert.equal(next.endedUserId, null);
	});
});
