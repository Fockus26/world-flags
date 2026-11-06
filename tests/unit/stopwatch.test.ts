/**
 * Formato del cronómetro del rush (D232).
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { formatStopwatch } from "@/utils/stopwatch";

describe("formatStopwatch", () => {
	test("siempre m:ss, también por debajo del minuto", () => {
		assert.equal(formatStopwatch(0), "0:00");
		assert.equal(formatStopwatch(8_900), "0:08");
		assert.equal(formatStopwatch(59_999), "0:59");
		assert.equal(formatStopwatch(60_000), "1:00");
		assert.equal(formatStopwatch(3_599_000), "59:59");
	});

	test("pasa de la hora sin cambiar de formato (castigos)", () => {
		assert.equal(formatStopwatch(3_600_000), "60:00");
		assert.equal(formatStopwatch(6_330_000), "105:30");
	});

	test("nunca negativo", () => {
		assert.equal(formatStopwatch(-8_600), "0:00");
	});

	test("cabe en 6 caracteres hasta 999:59", () => {
		assert.ok(formatStopwatch(6_330_000).length <= 6);
		assert.ok(formatStopwatch(59_999_000).length <= 6);
	});
});
