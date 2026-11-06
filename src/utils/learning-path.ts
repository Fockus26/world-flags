import { countries as catalog } from "@/data/countries";
import { type Country, REGIONS } from "@/types/country";
import type {
	CountriesLearningHistory,
	LearningPath,
	LearningPathBatchSize,
	LearningPathCountryProgress,
	LearningPathOrder,
	LearningPathSlot,
	LearningPaths,
	RegionGameScores,
} from "@/types/progress";
import { LEARNING_PATH_BATCH_SIZES } from "@/types/progress";
import { isCatalogCountryCode } from "@/utils/country-catalog";
import { getLocalDateString } from "@/utils/date";
import { calculateRegionAverage } from "@/utils/learning-storage";
import { shuffle } from "@/utils/shuffle";

/**
 * Recorrido por lotes (D185), la parte pura: crear el recorrido, leer en qué
 * lote va y qué toca hoy, registrar un acierto y fusionar dos dispositivos.
 * Guardar y despachar es cosa de `learning-storage.ts` y `useGame`.
 */

/** Aciertos a la primera, en días distintos, para consolidar un país. */
export const PASS_DAYS_TO_CONSOLIDATE = 2;

/**
 * O aciertos a la primera el mismo día, separados al menos
 * `PASS_SPACING_MS` (D235): quien hace varias sesiones al día no tiene que
 * esperar a mañana, pero con un acierto más.
 */
export const SAME_DAY_PASSES_TO_CONSOLIDATE = 3;

/**
 * Separación mínima entre dos aciertos que cuentan (D235). Un país acertado
 * hace menos no sale en la sesión del lote ni suma otro acierto.
 */
export const PASS_SPACING_MS = 4 * 60 * 60 * 1000;

/** Sesiones del lote al día: una, o hasta tres con «Hacer otra sesión hoy» (D235). */
export const MAX_LEARNING_PATH_SESSIONS_PER_DAY = 3;

/** Aciertos con hora que se guardan por país: los que puede necesitar la regla. */
const MAX_STORED_PASSES = 6;

/** Sesiones del lote que se guardan: con las de hoy basta, se dejan unas pocas más. */
const MAX_STORED_SESSIONS = 6;

export const DEFAULT_LEARNING_PATH_BATCH_SIZE: LearningPathBatchSize = 5;

/** Repeticiones SM2 a partir de las cuales un país puede darse por sabido. */
const KNOWN_MIN_REPETITIONS = 2;

/**
 * Nota del continente (la media de sus últimas partidas) que hace falta,
 * además de las repeticiones, para dar un país por sabido (D189): las
 * repeticiones solas no bastan (D185, y antes del #67 los reencolados de una
 * partida también las sumaban).
 */
const KNOWN_REGION_AVERAGE = 10;

const CATALOG_BY_CODE: ReadonlyMap<string, Country> = new Map(
	catalog.map((country) => [country.code, country]),
);

const spanishCollator = new Intl.Collator("es", { sensitivity: "base" });

function sortByRegionThenName(countries: readonly Country[]): Country[] {
	return [...countries].sort(
		(first, second) =>
			REGIONS.indexOf(first.region) - REGIONS.indexOf(second.region) ||
			spanishCollator.compare(first.name, second.name),
	);
}

/** Lo que decide si un país ya se sabe: el historial SM2 y las notas por continente del juego. */
export interface LearningPathKnownCriteria {
	countryHistory: CountriesLearningHistory;
	regionGameScores: RegionGameScores;
}

/** Ya sabido = SM2 con 2+ repeticiones y su continente en 10/10 (D189). Sin nota, no. */
function isKnownCountry(
	country: Country,
	{ countryHistory, regionGameScores }: LearningPathKnownCriteria,
): boolean {
	const repetitions = countryHistory[country.code]?.review?.repetitions ?? 0;

	return (
		repetitions >= KNOWN_MIN_REPETITIONS &&
		calculateRegionAverage(regionGameScores[country.region]) ===
			KNOWN_REGION_AVERAGE
	);
}

/**
 * Añade `added` a los países por aprender según el orden del recorrido: al
 * azar, al final; por continente, todo reordenado por continente y nombre
 * (lo que el catálogo no conoce queda al final, en su orden).
 */
function addLearnableCodes(
	order: LearningPathOrder,
	codes: readonly string[],
	added: readonly string[],
): string[] {
	const all = [...codes, ...added];
	if (order === "random") return all;

	const inCatalog: Country[] = [];
	const unknown: string[] = [];
	for (const code of all) {
		const country = CATALOG_BY_CODE.get(code);
		if (country) inCatalog.push(country);
		else unknown.push(code);
	}

	return [
		...sortByRegionThenName(inCatalog).map((country) => country.code),
		...unknown,
	];
}

interface CreateLearningPathOptions extends LearningPathKnownCriteria {
	id: string;
	/** Los países del alcance, ya resueltos (`resolveScopeCountries`). */
	countries: readonly Country[];
	scopeLabel: string;
	order: LearningPathOrder;
	batchSize: LearningPathBatchSize;
	now?: Date;
}

export function createLearningPath({
	id,
	countries,
	scopeLabel,
	order,
	batchSize,
	countryHistory,
	regionGameScores,
	now = new Date(),
}: CreateLearningPathOptions): LearningPath {
	const ordered =
		order === "random" ? shuffle(countries) : sortByRegionThenName(countries);

	const codes: string[] = [];
	const knownCodes: string[] = [];

	for (const country of ordered) {
		(isKnownCountry(country, { countryHistory, regionGameScores })
			? knownCodes
			: codes
		).push(country.code);
	}

	return {
		id,
		createdAt: now.toISOString(),
		scopeLabel,
		order,
		batchSize,
		codes,
		knownCodes,
		progress: {},
	};
}

/**
 * Recalcula los ya sabidos de un recorrido con la regla de hoy (D189): los
 * que ya no la cumplen pasan a los lotes (con su progreso, si lo tenían).
 * Solo degrada, nunca promueve: un país que llega a 10/10 después no sale de
 * los lotes, para que estos no se muevan. Lo que el catálogo no conoce se
 * deja como está. Idempotente; devuelve el mismo objeto si no cambia nada.
 */
export function reconcileLearningPathKnown(
	path: LearningPath,
	criteria: LearningPathKnownCriteria,
): LearningPath {
	const demoted = path.knownCodes.filter((code) => {
		const country = CATALOG_BY_CODE.get(code);
		return country !== undefined && !isKnownCountry(country, criteria);
	});
	if (demoted.length === 0) return path;

	const demotedSet = new Set(demoted);
	const learnable = new Set(path.codes);

	return {
		...path,
		codes: addLearnableCodes(
			path.order,
			path.codes,
			demoted.filter((code) => !learnable.has(code)),
		),
		knownCodes: path.knownCodes.filter((code) => !demotedSet.has(code)),
	};
}

/** Los lotes del recorrido, en orden. Un código que el catálogo ya no conoce se salta. */
export function getLearningPathBatches(path: LearningPath): string[][] {
	const playable = path.codes.filter(isCatalogCountryCode);
	const batches: string[][] = [];

	for (let start = 0; start < playable.length; start += path.batchSize) {
		batches.push(playable.slice(start, start + path.batchSize));
	}

	return batches;
}

export function isLearningPathCountryConsolidated(
	path: LearningPath,
	code: string,
): boolean {
	return (
		path.knownCodes.includes(code) ||
		(path.progress[code]?.consolidatedAt ?? null) !== null
	);
}

export interface LearningPathStatus {
	/** Países del alcance (por aprender + ya sabidos). */
	totalCountries: number;
	consolidatedCount: number;
	batchCount: number;
	/** Índice (desde 0) del lote en curso; `null` con el recorrido completo. */
	currentBatchIndex: number | null;
	/** Los países del lote en curso. */
	currentBatch: string[];
	/** Los del lote en curso que todavía no se han consolidado. */
	pendingCodes: string[];
	/**
	 * Los pendientes que se pueden practicar ahora: sin acierto que cuente en
	 * las últimas 4 h (D235). Lo de otros modos ya no cuenta ni bloquea.
	 */
	todayCodes: string[];
	/** Sesiones del lote terminadas hoy. */
	sessionsToday: number;
	/** La sesión de hoy: la primera del día, con algo que practicar. */
	canStartSession: boolean;
	/** «Hacer otra sesión hoy»: ya hubo una, quedan hasta tres y hay algo que practicar (D235). */
	canStartExtraSession: boolean;
	isComplete: boolean;
}

interface LearningPathStatusOptions {
	now?: Date;
}

/** Los aciertos de un país, en ms; los registros anteriores no traen hora. */
function getPassTimes(progress: LearningPathCountryProgress | undefined) {
	return (progress?.passes ?? [])
		.map((pass) => Date.parse(pass))
		.filter((time) => Number.isFinite(time));
}

/**
 * ¿Hay un acierto que cuente hace menos de 4 h? Un día de acierto de hoy
 * sin hora (registro anterior a D235) cuenta como reciente: no se sabe.
 */
function hasRecentPass(
	progress: LearningPathCountryProgress | undefined,
	now: Date,
): boolean {
	const nowMs = now.getTime();
	const times = getPassTimes(progress);
	// Uno "del futuro" también cuenta como reciente: quien pinta puede tener
	// una hora de hace un rato (`useMinuteTick`) y el acierto ser de ahora.
	if (times.some((time) => nowMs - time < PASS_SPACING_MS)) {
		return true;
	}

	const today = getLocalDateString(now);
	const hasTimedPassToday = times.some(
		(time) => getLocalDateString(new Date(time)) === today,
	);

	return (progress?.passDays.includes(today) ?? false) && !hasTimedPassToday;
}

/**
 * Regla de consolidación (D235): dos aciertos a la primera en días distintos
 * (como siempre, D185), o tres el mismo día separados al menos 4 h.
 */
export function meetsLearningPathConsolidation(
	passDays: readonly string[],
	passes: readonly string[] = [],
): boolean {
	if (new Set(passDays).size >= PASS_DAYS_TO_CONSOLIDATE) return true;

	const byDay = new Map<string, number[]>();
	for (const pass of passes) {
		const time = Date.parse(pass);
		if (!Number.isFinite(time)) continue;
		const day = getLocalDateString(new Date(time));
		byDay.set(day, [...(byDay.get(day) ?? []), time]);
	}

	for (const times of byDay.values()) {
		let count = 0;
		let last = Number.NEGATIVE_INFINITY;
		for (const time of times.sort((a, b) => a - b)) {
			if (time - last >= PASS_SPACING_MS) {
				count += 1;
				last = time;
			}
		}
		if (count >= SAME_DAY_PASSES_TO_CONSOLIDATE) return true;
	}

	return false;
}

/** Sesiones del lote terminadas el día local de `now`. */
export function countLearningPathSessionsToday(
	path: LearningPath,
	now: Date = new Date(),
): number {
	const today = getLocalDateString(now);

	return (path.sessions ?? []).filter((session) => {
		const time = Date.parse(session);
		return (
			Number.isFinite(time) && getLocalDateString(new Date(time)) === today
		);
	}).length;
}

export function getLearningPathStatus(
	path: LearningPath,
	{ now = new Date() }: LearningPathStatusOptions = {},
): LearningPathStatus {
	const batches = getLearningPathBatches(path);
	const isConsolidated = (code: string) =>
		isLearningPathCountryConsolidated(path, code);

	const playableKnown = path.knownCodes.filter(isCatalogCountryCode);
	const learnable = batches.flat();
	const consolidatedCount =
		playableKnown.length + learnable.filter(isConsolidated).length;
	const sessionsToday = countLearningPathSessionsToday(path, now);

	const currentBatchIndex = batches.findIndex((batch) =>
		batch.some((code) => !isConsolidated(code)),
	);

	if (currentBatchIndex === -1) {
		return {
			totalCountries: playableKnown.length + learnable.length,
			consolidatedCount,
			batchCount: batches.length,
			currentBatchIndex: null,
			currentBatch: [],
			pendingCodes: [],
			todayCodes: [],
			sessionsToday,
			canStartSession: false,
			canStartExtraSession: false,
			isComplete: true,
		};
	}

	const currentBatch = batches[currentBatchIndex];
	const pendingCodes = currentBatch.filter((code) => !isConsolidated(code));
	const todayCodes = pendingCodes.filter(
		(code) => !hasRecentPass(path.progress[code], now),
	);
	const hasWork = todayCodes.length > 0;

	return {
		totalCountries: playableKnown.length + learnable.length,
		consolidatedCount,
		batchCount: batches.length,
		currentBatchIndex,
		currentBatch,
		pendingCodes,
		todayCodes,
		sessionsToday,
		canStartSession: hasWork && sessionsToday === 0,
		canStartExtraSession:
			hasWork &&
			sessionsToday > 0 &&
			sessionsToday < MAX_LEARNING_PATH_SESSIONS_PER_DAY,
		isComplete: false,
	};
}

/**
 * Los países que el recorrido se reserva (D235): los del lote en curso y de
 * los siguientes que no se han consolidado. No salen en la práctica diaria
 * hasta consolidarse; al abandonar el recorrido vuelven solos.
 */
export function getLearningPathReservedCodes(
	path: LearningPath | null,
): Set<string> {
	if (!path) return new Set();

	return new Set(
		path.codes.filter(
			(code) =>
				isCatalogCountryCode(code) &&
				!isLearningPathCountryConsolidated(path, code),
		),
	);
}

/** Una sesión del lote terminada (D235). Se guardan solo las recientes. */
export function registerLearningPathSession(
	path: LearningPath,
	now: Date = new Date(),
): LearningPath {
	const sessions = [...(path.sessions ?? []), now.toISOString()]
		.sort()
		.slice(-MAX_STORED_SESSIONS);

	return { ...path, sessions };
}

/**
 * Un acierto a la primera de `code` en la sesión del lote (D235: solo cuenta
 * ahí; la diaria y la práctica libre ya no). Si hubo otro hace menos de 4 h,
 * no suma. Devuelve el mismo objeto si no cambia nada.
 */
export function registerLearningPathPass(
	path: LearningPath,
	code: string,
	now: Date = new Date(),
): LearningPath {
	if (!path.codes.includes(code)) return path;
	if (isLearningPathCountryConsolidated(path, code)) return path;

	const progress = path.progress[code];
	if (hasRecentPass(progress, now)) return path;

	const today = getLocalDateString(now);
	const previousDays = progress?.passDays ?? [];
	const passDays = previousDays.includes(today)
		? previousDays
		: [...previousDays, today].sort();
	const passes = [...(progress?.passes ?? []), now.toISOString()]
		.sort()
		.slice(-MAX_STORED_PASSES);
	const consolidatedAt = meetsLearningPathConsolidation(passDays, passes)
		? now.toISOString()
		: null;

	return {
		...path,
		progress: {
			...path.progress,
			[code]: { passDays, consolidatedAt, passes },
		},
	};
}

function mergeCountryProgress(
	a: LearningPathCountryProgress | undefined,
	b: LearningPathCountryProgress | undefined,
): LearningPathCountryProgress {
	const passDays = [
		...new Set([...(a?.passDays ?? []), ...(b?.passDays ?? [])]),
	]
		.sort()
		.slice(0, PASS_DAYS_TO_CONSOLIDATE);
	const passes = [...new Set([...(a?.passes ?? []), ...(b?.passes ?? [])])]
		.sort()
		.slice(-MAX_STORED_PASSES);
	const dates = [a?.consolidatedAt, b?.consolidatedAt].filter(
		(value): value is string => typeof value === "string",
	);
	let consolidatedAt = dates.length > 0 ? dates.sort()[0] : null;

	// Juntando los dos lados ya cumple la regla (un día en cada dispositivo, o
	// los aciertos del mismo día repartidos): se consolida con el último.
	if (
		consolidatedAt === null &&
		meetsLearningPathConsolidation(passDays, passes)
	) {
		consolidatedAt =
			passes.at(-1) ?? `${passDays[passDays.length - 1]}T00:00:00.000Z`;
	}

	return passes.length > 0
		? { passDays, consolidatedAt, passes }
		: { passDays, consolidatedAt };
}

function mergeSlot(
	remote: LearningPathSlot | undefined,
	local: LearningPathSlot | undefined,
): LearningPathSlot | undefined {
	if (!remote) return local;
	if (!local) return remote;

	if (remote.path && local.path && remote.path.id === local.path.id) {
		const codes = [
			...new Set([
				...Object.keys(remote.path.progress),
				...Object.keys(local.path.progress),
			]),
		].sort();

		// Ya sabido solo si lo es en los dos lados: el recalculo solo degrada
		// (D189), así que un dispositivo sin recalcular no lo deshace.
		const localKnown = new Set(local.path.knownCodes);
		const knownCodes = remote.path.knownCodes.filter((code) =>
			localKnown.has(code),
		);
		const knownSet = new Set(knownCodes);
		const remoteLearnable = new Set(remote.path.codes);
		const added = [
			...new Set([
				...local.path.codes,
				...remote.path.knownCodes,
				...local.path.knownCodes,
			]),
		].filter((code) => !remoteLearnable.has(code) && !knownSet.has(code));

		const sessions = [
			...new Set([
				...(remote.path.sessions ?? []),
				...(local.path.sessions ?? []),
			]),
		]
			.sort()
			.slice(-MAX_STORED_SESSIONS);

		return {
			path: {
				...remote.path,
				...(sessions.length > 0 ? { sessions } : {}),
				codes:
					added.length > 0
						? addLearnableCodes(remote.path.order, remote.path.codes, added)
						: remote.path.codes,
				knownCodes,
				progress: Object.fromEntries(
					codes.map((code) => [
						code,
						mergeCountryProgress(
							remote.path?.progress[code],
							local.path?.progress[code],
						),
					]),
				),
			},
			updatedAt:
				remote.updatedAt >= local.updatedAt
					? remote.updatedAt
					: local.updatedAt,
		};
	}

	// Recorridos distintos (o uno abandonado): gana el último creado o abandonado.
	return local.updatedAt > remote.updatedAt ? local : remote;
}

/**
 * Por juego: el mismo recorrido en los dos lados suma avances (unión de días
 * y horas de acierto y de sesiones, intersección de ya sabidos); recorridos distintos, gana el último creado o abandonado. Las
 * claves salen ordenadas: la sincronización compara `JSON.stringify`.
 */
export function mergeLearningPaths(
	remote: LearningPaths,
	local: LearningPaths,
): LearningPaths {
	const gameTypes = [
		...new Set([...Object.keys(remote), ...Object.keys(local)]),
	].sort();
	const merged: LearningPaths = {};

	for (const gameType of gameTypes) {
		const slot = mergeSlot(remote[gameType], local[gameType]);
		if (slot) merged[gameType] = slot;
	}

	return merged;
}

function isStringArray(value: unknown): value is string[] {
	return (
		Array.isArray(value) && value.every((item) => typeof item === "string")
	);
}

function normalizePath(raw: unknown): LearningPath | null {
	if (!raw || typeof raw !== "object") return null;
	const path = raw as Partial<LearningPath>;

	if (
		typeof path.id !== "string" ||
		typeof path.createdAt !== "string" ||
		!isStringArray(path.codes) ||
		!LEARNING_PATH_BATCH_SIZES.includes(path.batchSize as LearningPathBatchSize)
	) {
		return null;
	}

	const progress: Record<string, LearningPathCountryProgress> = {};
	for (const [code, entry] of Object.entries(path.progress ?? {})) {
		if (!entry || !isStringArray(entry.passDays)) continue;
		progress[code] = {
			passDays: entry.passDays,
			consolidatedAt:
				typeof entry.consolidatedAt === "string" ? entry.consolidatedAt : null,
			...(isStringArray(entry.passes) ? { passes: entry.passes } : {}),
		};
	}

	return {
		id: path.id,
		createdAt: path.createdAt,
		scopeLabel: typeof path.scopeLabel === "string" ? path.scopeLabel : "",
		order: path.order === "random" ? "random" : "region",
		batchSize: path.batchSize as LearningPathBatchSize,
		codes: path.codes,
		knownCodes: isStringArray(path.knownCodes) ? path.knownCodes : [],
		progress,
		...(isStringArray(path.sessions) ? { sessions: path.sessions } : {}),
	};
}

/**
 * Datos crudos (localStorage o la columna `learning_paths`, que llega como
 * `{}` en una fila anterior a esta versión) → `LearningPaths`. Lo que no
 * tenga forma de recorrido se descarta; un juego desconocido se conserva.
 */
export function normalizeLearningPaths(raw: unknown): LearningPaths {
	if (!raw || typeof raw !== "object") return {};

	const paths: LearningPaths = {};

	for (const [gameType, slot] of Object.entries(
		raw as Record<string, unknown>,
	)) {
		if (!slot || typeof slot !== "object") continue;
		const { path, updatedAt } = slot as Partial<LearningPathSlot>;
		if (typeof updatedAt !== "string") continue;
		paths[gameType] = { path: normalizePath(path), updatedAt };
	}

	return paths;
}
