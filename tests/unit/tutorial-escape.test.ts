import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { isLostFocusEscape } from "@/components/game/tutorial/tutorial-escape";

// D193: Escape cierra el recorrido aunque el foco se haya caído a <body>.
describe("isLostFocusEscape", () => {
	const body = { name: "body" };
	const inside = { name: "input" };

	test("Escape con el foco en <body>: lo atiende el recorrido", () => {
		assert.equal(
			isLostFocusEscape({
				key: "Escape",
				defaultPrevented: false,
				activeElement: body,
				body,
			}),
			true,
		);
	});

	test("Escape sin elemento activo: también", () => {
		assert.equal(
			isLostFocusEscape({
				key: "Escape",
				defaultPrevented: false,
				activeElement: null,
				body,
			}),
			true,
		);
	});

	test("Escape con el foco en un elemento: lo deja a React Aria (o al diálogo de encima)", () => {
		assert.equal(
			isLostFocusEscape({
				key: "Escape",
				defaultPrevented: false,
				activeElement: inside,
				body,
			}),
			false,
		);
	});

	test("Escape ya atendido: no cierra dos veces", () => {
		assert.equal(
			isLostFocusEscape({
				key: "Escape",
				defaultPrevented: true,
				activeElement: body,
				body,
			}),
			false,
		);
	});

	test("otras teclas: nada", () => {
		assert.equal(
			isLostFocusEscape({
				key: "1",
				defaultPrevented: false,
				activeElement: body,
				body,
			}),
			false,
		);
	});
});
