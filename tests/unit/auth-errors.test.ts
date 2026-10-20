/**
 * Errores de auth en español y contraseña nueva (D212). Lo que se protege:
 *
 * - Cada código que devuelve Supabase en el login y el registro tiene su
 *   mensaje en español; uno desconocido da el genérico, nunca el texto crudo.
 * - Sin red, el mensaje de conexión (D052) aunque haya código.
 * - Registro con correo existente: se reconoce por código (para tratarlo como
 *   un registro nuevo y no revelar el correo).
 * - Contraseña nueva: solo espacios no; más de 72 bytes no (tildes y emojis
 *   cuentan por más de uno); se valida sin recortarla.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
	AUTH_GENERIC_MESSAGE,
	AUTH_OFFLINE_MESSAGE,
	authErrorField,
	authErrorMessage,
	isExistingAccountError,
	PASSWORD_BLANK_MESSAGE,
	PASSWORD_TOO_LONG_MESSAGE,
	validateNewPassword,
} from "@/utils/auth-errors";

describe("authErrorMessage", () => {
	test("los códigos del login y el registro salen en español", () => {
		assert.equal(
			authErrorMessage({ code: "invalid_credentials" }, false),
			"Correo o contraseña incorrectos.",
		);

		for (const code of [
			"email_not_confirmed",
			"weak_password",
			"over_request_rate_limit",
			"over_email_send_rate_limit",
			"email_address_invalid",
			"validation_failed",
			"signup_disabled",
			"user_already_exists",
			"email_exists",
		]) {
			const message = authErrorMessage({ code }, false);
			assert.notEqual(message, AUTH_GENERIC_MESSAGE, code);
			assert.doesNotMatch(message, /\b(the|invalid|user|password)\b/i, code);
		}
	});

	test("código desconocido o ausente: el genérico", () => {
		assert.equal(
			authErrorMessage({ code: "unexpected_failure" }, false),
			AUTH_GENERIC_MESSAGE,
		);
		assert.equal(authErrorMessage({}, false), AUTH_GENERIC_MESSAGE);
	});

	test("sin red gana el aviso de conexión", () => {
		assert.equal(
			authErrorMessage({ code: "invalid_credentials" }, true),
			AUTH_OFFLINE_MESSAGE,
		);
	});

	test("correo existente se reconoce por código", () => {
		assert.equal(isExistingAccountError({ code: "user_already_exists" }), true);
		assert.equal(isExistingAccountError({ code: "email_exists" }), true);
		assert.equal(
			isExistingAccountError({ code: "invalid_credentials" }),
			false,
		);
		assert.equal(isExistingAccountError({}), false);
	});
});

describe("authErrorField", () => {
	test("señala el campo que toca, o ninguno", () => {
		assert.equal(
			authErrorField({ code: "invalid_credentials" }, false),
			"credentials",
		);
		assert.equal(
			authErrorField({ code: "email_address_invalid" }, false),
			"email",
		);
		assert.equal(authErrorField({ code: "weak_password" }, false), "password");
		assert.equal(
			authErrorField({ code: "over_request_rate_limit" }, false),
			null,
		);
		assert.equal(authErrorField({ code: "unexpected_failure" }, false), null);
		assert.equal(authErrorField({}, false), null);
	});

	test("sin red no es culpa de ningún campo", () => {
		assert.equal(authErrorField({ code: "invalid_credentials" }, true), null);
	});
});

describe("validateNewPassword", () => {
	test("solo espacios: rechazada", () => {
		assert.equal(validateNewPassword("      "), PASSWORD_BLANK_MESSAGE);
		assert.equal(validateNewPassword(" \t \n  "), PASSWORD_BLANK_MESSAGE);
	});

	test("con espacios alrededor pero con contenido: válida, sin recortar", () => {
		assert.equal(validateNewPassword("  abc123  "), null);
	});

	test("72 bytes sí, 73 no", () => {
		assert.equal(validateNewPassword("a".repeat(72)), null);
		assert.equal(
			validateNewPassword("a".repeat(73)),
			PASSWORD_TOO_LONG_MESSAGE,
		);
	});

	test("cuenta bytes, no caracteres", () => {
		// "ñ" son 2 bytes en UTF-8: 37 son 74 bytes aunque sean 37 caracteres.
		assert.equal(validateNewPassword("ñ".repeat(36)), null);
		assert.equal(
			validateNewPassword("ñ".repeat(37)),
			PASSWORD_TOO_LONG_MESSAGE,
		);
	});

	test("vacía: la deja al required del formulario", () => {
		assert.equal(validateNewPassword(""), null);
	});
});
