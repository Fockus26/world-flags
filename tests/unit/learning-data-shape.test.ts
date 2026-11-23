import { describe, expect, test } from "bun:test";

import {
	findShapeProblem,
	MAX_COLUMN_CHARS,
} from "@/server/data/learning-data-shape";

describe("findShapeProblem (P60)", () => {
	test("acepta objetos y la lista de sesiones", () => {
		expect(findShapeProblem("profile", { name: "a" })).toBeNull();
		expect(findShapeProblem("session_history", [{ a: 1 }])).toBeNull();
		expect(findShapeProblem("last_configuration", null)).toBeNull();
	});

	test("rechaza el tipo de arriba equivocado", () => {
		expect(findShapeProblem("profile", [])).not.toBeNull();
		expect(findShapeProblem("profile", "x")).not.toBeNull();
		expect(findShapeProblem("stats", 3)).not.toBeNull();
		expect(findShapeProblem("session_history", {})).not.toBeNull();
	});

	test("rechaza lo que pasa del tope", () => {
		const big = { blob: "x".repeat(MAX_COLUMN_CHARS) };
		expect(findShapeProblem("achievements", big)).toBe("demasiado grande");
	});

	test("rechaza el anidamiento excesivo", () => {
		let deep: Record<string, unknown> = {};
		for (let i = 0; i < 40; i++) deep = { d: deep };
		expect(findShapeProblem("stats", deep)).toBe("anidada de más");
	});
});
