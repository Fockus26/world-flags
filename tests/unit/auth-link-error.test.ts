/**
 * Vuelta de un enlace de Auth que falló (D218): se reconoce el error en el
 * hash (flujo implícito) o en la query (PKCE), `otp_expired` tiene su aviso,
 * y la URL se limpia sin perder lo demás.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
	readAuthLinkError,
	withoutAuthLinkError,
} from "@/utils/auth-link-error";

const ORIGIN = "https://world-flags-hazel.vercel.app";
const EXPIRED =
	"error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired";

describe("readAuthLinkError", () => {
	test("enlace caducado en el hash", () => {
		assert.equal(
			readAuthLinkError(new URL(`${ORIGIN}/#${EXPIRED}`)),
			"expired",
		);
	});

	test("enlace caducado en la query (PKCE)", () => {
		assert.equal(
			readAuthLinkError(new URL(`${ORIGIN}/?${EXPIRED}`)),
			"expired",
		);
	});

	test("otro error: aviso genérico", () => {
		assert.equal(
			readAuthLinkError(
				new URL(`${ORIGIN}/#error=server_error&error_description=Algo`),
			),
			"other",
		);
	});

	test("sin error: nada", () => {
		assert.equal(readAuthLinkError(new URL(`${ORIGIN}/`)), null);
		assert.equal(
			readAuthLinkError(new URL(`${ORIGIN}/#access_token=x&type=signup`)),
			null,
		);
	});
});

describe("withoutAuthLinkError", () => {
	test("quita el hash si solo traía el error", () => {
		assert.equal(withoutAuthLinkError(new URL(`${ORIGIN}/#${EXPIRED}`)), "/");
	});

	test("quita también la marca `sb` de Supabase y deja lo ajeno", () => {
		assert.equal(
			withoutAuthLinkError(new URL(`${ORIGIN}/#${EXPIRED}&sb`)),
			"/",
		);
		assert.equal(
			withoutAuthLinkError(new URL(`${ORIGIN}/#${EXPIRED}&sb=&otro=1`)),
			"/#otro=1",
		);
	});

	test("quita el error de la query y conserva lo demás", () => {
		assert.equal(
			withoutAuthLinkError(new URL(`${ORIGIN}/?${EXPIRED}&otro=1#seccion`)),
			"/?otro=1#seccion",
		);
	});
});
