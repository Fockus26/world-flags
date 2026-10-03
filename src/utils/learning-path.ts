import { type Country, REGIONS } from "@/types/country";
import type {
	CountriesLearningHistory,
	LearningPath,
	LearningPathBatchSize,
	LearningPathCountryProgress,
	LearningPathOrder,
	LearningPathSlot,
	LearningPaths,
} from "@/types/progress";
import { LEARNING_PATH_BATCH_SIZES } from "@/types/progress";
import { isCatalogCountryCode } from "@/utils/country-catalog";
import { getLocalDateString } from "@/utils/date";
import { shuffle } from "@/utils/shuffle";

/**
 * Recorrido por lotes (D185), la parte pura: crear el recorrido, leer en qué
 * lote va y qué toca hoy, registrar un acierto y fusionar dos dispositivos.
 * Guardar y despachar es cosa de `learning-storage.ts` y `useGame`.
 */

/** Aciertos a la primera, en días distintos, para consolidar un país. */
export const PASS_DAYS_TO_CONSOLIDATE = 2;

export const DEFAULT_LEARNING_PATH_BATCH_SIZE: LearningPathBatchSize = 5;

/** Repeticiones SM2 a partir de las cuales un país ya se sabía al crear el recorrido. */
const KNOWN_MIN_REPETITIONS = 2;

const spanishCollator = new Intl.Collator("es", { sensitivity: "base" });

function sortByRegionThenName(countries: readonly Country[]): Country[] {
	return [...countries].sort(
		(first, second) =>
			REGIONS.indexOf(first.region) - REGIONS.indexOf(second.region) ||
			spanishCollator.compare(first.name, second.name),
	);
}

interface CreateLearningPathOptions {
	id: string;
	/** Los países del alcance, ya resueltos (`resolveScopeCountries`). */
	countries: readonly Country[];
	scopeLabel: string;
	order: LearningPathOrder;
	batchSize: LearningPathBatchSize;
	/** El historial SM2 del juego: lo que ya se sabe no entra en los lotes. */
	countryHistory: CountriesLearningHistory;
	now?: Date;
}

export function createLearningPath({
	id,
	countries,
	scopeLabel,
	order,
	batchSize,
	countryHistory,
	now = new Date(),
}: CreateLearningPathOptions): LearningPath {
	const ordered =
		order === "random" ? shuffle(countries) : sortByRegionThenName(countries);

	const codes: string[] = [];
	const knownCodes: string[] = [];

	for (const country of ordered) {
		const repetitions = countryHistory[country.code]?.review?.repetitions ?? 0;
		(repetitions >= KNOWN_MIN_REPETITIONS ? knownCodes : codes).push(
			country.code,
		);
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
	/** Los pendientes que se pueden practicar hoy: sin acierto hoy y no practicados hoy. */
	todayCodes: string[];
	isComplete: boolean;
}

interface LearningPathStatusOptions {
	/** Si el país ya se practicó hoy (el candado "practicado hoy" del juego). */
	isPracticedToday: (code: string) => boolean;
	today?: string;
}

export function getLearningPathStatus(
	path: LearningPath,
	{ isPracticedToday, today = getLocalDateString() }: LearningPathStatusOptions,
): LearningPathStatus {
	const batches = getLearningPathBatches(path);
	const isConsolidated = (code: string) =>
		isLearningPathCountryConsolidated(path, code);

	const playableKnown = path.knownCodes.filter(isCatalogCountryCode);
	const learnable = batches.flat();
	const consolidatedCount =
		playableKnown.length + learnable.filter(isConsolidated).length;

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
			isComplete: true,
		};
	}

	const currentBatch = batches[currentBatchIndex];
	const pendingCodes = currentBatch.filter((code) => !isConsolidated(code));
	const todayCodes = pendingCodes.filter(
		(code) =>
			!path.progress[code]?.passDays.includes(today) && !isPracticedToday(code),
	);

	return {
		totalCountries: playableKnown.length + learnable.length,
		consolidatedCount,
		batchCount: batches.length,
		currentBatchIndex,
		currentBatch,
		pendingCodes,
		todayCodes,
		isComplete: false,
	};
}

/**
 * Un acierto a la primera de `code`. Cuenta venga de donde venga (la sesión
 * del recorrido, la práctica libre o la diaria): lo que importa es que se
 * sepa en dos días distintos. Devuelve el mismo objeto si no cambia nada.
 */
export function registerLearningPathPass(
	path: LearningPath,
	code: string,
	now: Date = new Date(),
): LearningPath {
	if (!path.codes.includes(code)) return path;
	if (isLearningPathCountryConsolidated(path, code)) return path;

	const today = getLocalDateString(now);
	const previous = path.progress[code]?.passDays ?? [];
	if (previous.includes(today)) return path;

	const passDays = [...previous, today].sort();
	const consolidatedAt =
		passDays.length >= PASS_DAYS_TO_CONSOLIDATE ? now.toISOString() : null;

	return {
		...path,
		progress: { ...path.progress, [code]: { passDays, consolidatedAt } },
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
	const dates = [a?.consolidatedAt, b?.consolidatedAt].filter(
		(value): value is string => typeof value === "string",
	);
	let consolidatedAt = dates.length > 0 ? dates.sort()[0] : null;

	// Un día en cada dispositivo: juntos ya suman dos.
	if (consolidatedAt === null && passDays.length >= PASS_DAYS_TO_CONSOLIDATE) {
		consolidatedAt = `${passDays[passDays.length - 1]}T00:00:00.000Z`;
	}

	return { passDays, consolidatedAt };
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

		return {
			path: {
				...remote.path,
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
 * de acierto); recorridos distintos, gana el último creado o abandonado. Las
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
