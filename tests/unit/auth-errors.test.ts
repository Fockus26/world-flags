/**
 * Errores de auth en español y contraseña nueva (D212). Lo que se protege:
 *
 * - Cada código que devuelve Supabase en el login y el registro tiene su
 *   mensaje en español; uno desconocido da el genérico, nunca el texto crudo.
 * - Sin red, el mensaje de conexión (D052) aunque haya código.
 * - Un 5xx con la red bien no es "sin conexión": el servicio no responde
 *   (D214). auth-js marca los dos como reintentables.
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
	AUTH_UNAVAILABLE_MESSAGE,
	authErrorField,
	authErrorMessage,
	authTransportFailure,
	isExistingAccountError,
	PASSWORD_BLANK_MESSAGE,
	PASSWORD_TOO_LONG_MESSAGE,
	toAuthErrorLike,
	validateNewPassword,
} from "@/utils/auth-errors";

describe("toAuthErrorLike (Better Auth)", () => {
	test("cada código llega al mensaje y al campo que tocan", () => {
		const cases = [
			["INVALID_EMAIL_OR_PASSWORD", "invalid_credentials", "credentials"],
			["PASSWORD_TOO_SHORT", "weak_password", "password"],
			["PASSWORD_TOO_LONG", "weak_password", "password"],
			["INVALID_EMAIL", "email_address_invalid", "email"],
			["VALIDATION_ERROR", "validation_failed", "credentials"],
		] as const;

		for (const [code, expected, field] of cases) {
			const error = toAuthErrorLike({ code, status: 400 });

			assert.equal(error.code, expected);
			assert.notEqual(authErrorMessage(error, null), AUTH_GENERIC_MESSAGE, code);
			assert.equal(authErrorField(error, null), field, code);
		}
	});

	test("sin confirmar: el código que usa el sondeo de «Revisa tu correo»", () => {
		assert.equal(
			toAuthErrorLike({ code: "EMAIL_NOT_VERIFIED", status: 403 }).code,
			"email_not_confirmed",
		);
	});

	test("correo existente se sigue reconociendo (D212)", () => {
		for (const code of [
			"USER_ALREADY_EXISTS",
			"USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
		]) {
			assert.equal(isExistingAccountError(toAuthErrorLike({ code })), true);
		}
	});

	test("429 es el límite de intentos, aunque no traiga código", () => {
		const error = toAuthErrorLike({ status: 429 });

		assert.equal(error.code, "over_request_rate_limit");
		assert.notEqual(authErrorMessage(error, null), AUTH_GENERIC_MESSAGE);
	});

	test("un código desconocido da el genérico, nunca su texto", () => {
		assert.equal(
			authErrorMessage(toAuthErrorLike({ code: "ALGO_NUEVO" }), null),
			AUTH_GENERIC_MESSAGE,
		);
	});
});

describe("authErrorMessage", () => {
	test("los códigos del login y el registro salen en español", () => {
		assert.equal(
			authErrorMessage({ code: "invalid_credentials" }, null),
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
			const message = authErrorMessage({ code }, null);
			assert.notEqual(message, AUTH_GENERIC_MESSAGE, code);
			assert.doesNotMatch(message, /\b(the|invalid|user|password)\b/i, code);
		}
	});

	test("código desconocido o ausente: el genérico", () => {
		assert.equal(
			authErrorMessage({ code: "unexpected_failure" }, null),
			AUTH_GENERIC_MESSAGE,
		);
		assert.equal(authErrorMessage({}, null), AUTH_GENERIC_MESSAGE);
	});

	test("sin red gana el aviso de conexión", () => {
		assert.equal(
			authErrorMessage({ code: "invalid_credentials" }, "offline"),
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

describe("authTransportFailure (D214)", () => {
	test("reintentable sin respuesta (status 0): sin conexión", () => {
		assert.equal(authTransportFailure({ status: 0 }, true, true), "offline");
		assert.equal(authTransportFailure({}, true, true), "offline");
	});

	test("reintentable con 5xx y red: el servicio no responde", () => {
		for (const status of [502, 503, 504, 520, 530]) {
			assert.equal(
				authTransportFailure({ status }, true, true),
				"unavailable",
				String(status),
			);
		}
	});

	test("navigator.onLine falso: sin conexión aunque haya status", () => {
		assert.equal(authTransportFailure({ status: 503 }, true, false), "offline");
	});

	test("500 no reintentable: el servicio no responde", () => {
		assert.equal(
			authTransportFailure(
				{ code: "unexpected_failure", status: 500 },
				false,
				true,
			),
			"unavailable",
		);
	});

	test("4xx con código: no es de transporte", () => {
		assert.equal(
			authTransportFailure(
				{ code: "invalid_credentials", status: 400 },
				false,
				true,
			),
			null,
		);
	});

	test("cada fallo tiene su mensaje", () => {
		assert.equal(
			authErrorMessage({ status: 503 }, "unavailable"),
			AUTH_UNAVAILABLE_MESSAGE,
		);
		assert.notEqual(AUTH_UNAVAILABLE_MESSAGE, AUTH_OFFLINE_MESSAGE);
		assert.equal(
			authErrorField({ code: "invalid_credentials" }, "unavailable"),
			null,
		);
	});
});

describe("authErrorField", () => {
	test("señala el campo que toca, o ninguno", () => {
		assert.equal(
			authErrorField({ code: "invalid_credentials" }, null),
			"credentials",
		);
		assert.equal(
			authErrorField({ code: "email_address_invalid" }, null),
			"email",
		);
		assert.equal(authErrorField({ code: "weak_password" }, null), "password");
		assert.equal(
			authErrorField({ code: "over_request_rate_limit" }, null),
			null,
		);
		assert.equal(authErrorField({ code: "unexpected_failure" }, null), null);
		assert.equal(authErrorField({}, null), null);
	});

	test("sin red no es culpa de ningún campo", () => {
		assert.equal(
			authErrorField({ code: "invalid_credentials" }, "offline"),
			null,
		);
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
