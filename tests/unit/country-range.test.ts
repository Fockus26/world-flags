/**
 * Selección por rango con Shift en «Elegir países» (D233).
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
	applyRangeSelection,
	getVisibleCountryOrder,
} from "@/utils/country-range";

const BY_REGION = {
	europe: ["al", "de", "es", "fr"],
	asia: ["cn", "in", "jp"],
	africa: ["eg", "ma"],
};
const REGIONS = ["europe", "asia", "africa"] as const;

describe("getVisibleCountryOrder", () => {
	test("solo los continentes desplegados, en su orden", () => {
		assert.deepEqual(
			getVisibleCountryOrder(REGIONS, new Set(["africa", "europe"]), BY_REGION),
			["al", "de", "es", "fr", "eg", "ma"],
		);
	});

	test("todos plegados: nada", () => {
		assert.deepEqual(getVisibleCountryOrder(REGIONS, new Set(), BY_REGION), []);
	});
});

describe("applyRangeSelection", () => {
	const order = getVisibleCountryOrder(
		REGIONS,
		new Set(["europe", "asia"]),
		BY_REGION,
	);

	test("marca el rango hacia delante, cruzando continentes", () => {
		const next = applyRangeSelection(new Set(["de"]), order, "de", "in");
		assert.deepEqual([...(next ?? [])].sort(), ["cn", "de", "es", "fr", "in"]);
	});

	test("hacia atrás también", () => {
		const next = applyRangeSelection(new Set(["in"]), order, "in", "es");
		assert.deepEqual([...(next ?? [])].sort(), ["cn", "es", "fr", "in"]);
	});

	test("desmarca si la casilla pulsada estaba marcada", () => {
		const next = applyRangeSelection(
			new Set(["al", "de", "es", "fr"]),
			order,
			"al",
			"es",
		);
		assert.deepEqual([...(next ?? [])], ["fr"]);
	});

	test("salta las bloqueadas por «hoy» sin cambiarlas", () => {
		const isDisabled = (code: string) => code === "es";
		const next = applyRangeSelection(new Set(), order, "de", "cn", isDisabled);
		assert.deepEqual([...(next ?? [])].sort(), ["cn", "de", "fr"]);
	});

	test("conserva lo que hay fuera del rango", () => {
		const next = applyRangeSelection(new Set(["jp", "eg"]), order, "al", "de");
		assert.deepEqual([...(next ?? [])].sort(), ["al", "de", "eg", "jp"]);
	});

	test("sin ancla, o con el ancla plegada: clic normal", () => {
		assert.equal(applyRangeSelection(new Set(), order, null, "de"), null);
		assert.equal(applyRangeSelection(new Set(), order, "eg", "de"), null);
	});

	test("la misma casilla: solo ella", () => {
		const next = applyRangeSelection(new Set(), order, "de", "de");
		assert.deepEqual([...(next ?? [])], ["de"]);
	});
});
