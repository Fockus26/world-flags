import { countries } from "@/data/countries";
import {
	GAME_TYPES,
	getLeaderboardScope,
	LEADERBOARD_REGIONS,
	type PracticeRegion,
} from "@/types/country";
import { REGION_COUNTRY_COUNTS } from "@/utils/region-stats";

/**
 * Validación del ranking en el servidor (D112–D114, D211, D217, D221). La hace un
 * trigger en `leaderboard_entries` (hoy, la migración
 * `supabase/migrations/20261022120000_leaderboard_nombre_invisible.sql`): este
 * módulo guarda los números de los que sale ese SQL, para que un test los
 * compare con el catálogo, y el código con el que el trigger rechaza. El
 * cliente usa los mismos mínimos para no guardar como mejor marca un tiempo
 * imposible (D139).
 *
 * Tiempo mínimo por respuesta que ningún humano baja en un rush completo
 * (D112). 300 ms × 197 países = 59,1 s en "Todo el mundo": para ganarle hay
 * que escribir sin pensar a más de ~27 teclas por segundo (Países: 1648
 * letras; Banderas: 1648 + un Enter por bandera; Capitales: 1386 + Enter),
 * más del doble del récord de mecanografía sostenida. Es generoso a
 * propósito: mejor dejar pasar un tramposo que rechazar a alguien honesto.
 */
export const LEADERBOARD_MIN_MS_PER_ANSWER = 300;

/**
 * Código del rechazo del trigger. PostgREST convierte un SQLSTATE `PTxyz` en
 * el HTTP `xyz` y lo devuelve tal cual en `error.code` (D113).
 */
export const LEADERBOARD_TIME_REJECTED_CODE = "PT422";

/**
 * Mínimo de un rush completo de `region` (cualquier juego): nº de países del
 * alcance × 300 ms (D112, D138).
 */
export function getRushMinTimeMs(region: PracticeRegion): number {
	const countryCount =
		region === "world" ? countries.length : REGION_COUNTRY_COUNTS[region];

	return countryCount * LEADERBOARD_MIN_MS_PER_ANSWER;
}

/**
 * ¿Un rush completo de `region` pudo durar `elapsedMs`? Lo que no, no se
 * guarda como mejor marca (D139): un salto del reloj a mitad de partida
 * dejaba un tiempo que ninguna partida real mejora y que el servidor
 * rechaza, así que nada más volvía a subir al ranking.
 */
export function isPlausibleRushTime(
	region: PracticeRegion,
	elapsedMs: number,
): boolean {
	return Number.isFinite(elapsedMs) && elapsedMs >= getRushMinTimeMs(region);
}

/**
 * Mínimo de cada scope que se lee hoy: los 3 de "Todo el mundo" y los 24 de
 * continente (D138), todos con `getRushMinTimeMs`. Los scopes viejos
 * ("world", "capitals:world") no tienen mínimo: nadie los lee (D114). Cualquier
 * otro scope, el trigger lo rechaza (D211).
 */
export function getLeaderboardMinimums(): Record<string, number> {
	return Object.fromEntries(
		GAME_TYPES.flatMap((gameType) =>
			LEADERBOARD_REGIONS.map((region) => [
				getLeaderboardScope(gameType, region),
				getRushMinTimeMs(region),
			]),
		),
	);
}

/**
 * Largo máximo del nombre en el ranking (D211): el `maxLength` del campo
 * Nombre. El trigger rechaza un `display_name` más largo (o vacío).
 */
export const LEADERBOARD_DISPLAY_NAME_MAX_LENGTH = 24;

/**
 * Caracteres invisibles que no cuentan como nombre (D221): `trim` no los quita,
 * pero en el ranking se ven como un hueco. Ancho cero y marcas de dirección,
 * rellenos Hangul, el braille en blanco, el separador mongol, los selectores de
 * variante y el guion blando (casi todo `Default_Ignorable_Code_Point` del
 * plano básico). Mezclados con letras sí valen: solo se rechaza un nombre hecho
 * únicamente de esto y de espacios. La migración
 * `20261022120000_leaderboard_nombre_invisible.sql` lleva la misma lista (un
 * test las compara).
 */
export const LEADERBOARD_INVISIBLE_CODE_POINTS: readonly number[] = [
	0x00ad,
	0x034f,
	0x061c,
	0x115f,
	0x1160,
	0x17b4,
	0x17b5,
	...range(0x180b, 0x180f),
	...range(0x200b, 0x200f),
	...range(0x202a, 0x202e),
	...range(0x2060, 0x2064),
	...range(0x2066, 0x206f),
	0x2800,
	0x3164,
	...range(0xfe00, 0xfe0f),
	0xfeff,
	0xffa0,
];

function range(from: number, to: number): number[] {
	return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

const INVISIBLE_CHARS = new Set(
	LEADERBOARD_INVISIBLE_CODE_POINTS.map((code) => String.fromCodePoint(code)),
);

/**
 * ¿El nombre queda en blanco a la vista? Vacío, solo espacios (los de `trim`,
 * D217) o solo invisibles (D221): lo que el trigger rechaza.
 */
export function isBlankDisplayName(name: string): boolean {
	return Array.from(name).every(
		(char) => INVISIBLE_CHARS.has(char) || char.trim() === "",
	);
}

/**
 * El nombre tal como va al ranking (D211): sin espacios en los extremos y
 * cortado a `LEADERBOARD_DISPLAY_NAME_MAX_LENGTH` caracteres (por puntos de
 * código, como `char_length` en Postgres). Un perfil con un nombre más largo
 * (escrito por otra vía) no deja de subir sus marcas; uno que queda en blanco
 * (solo espacios, D217, o solo invisibles, D221) usa `fallback`, porque el
 * trigger lo rechaza.
 */
export function toLeaderboardDisplayName(
	name: string,
	fallback: string,
): string {
	const clamped = Array.from(name.trim())
		.slice(0, LEADERBOARD_DISPLAY_NAME_MAX_LENGTH)
		.join("")
		.trim();

	return isBlankDisplayName(clamped) ? fallback : clamped;
}

/**
 * Cómo acabó la subida de una marca al ranking (`upsertLeaderboardEntry`):
 * `uploaded`, `failed` (red o servidor: se reintenta) o `rejected` (el
 * servidor la rechazó por imposible: es definitivo, D113).
 */
export type LeaderboardUploadResult = "uploaded" | "failed" | "rejected";

/** ¿El servidor rechazó el tiempo? Es definitivo: reintentarlo no sirve (D113). */
export function isLeaderboardTimeRejected(error: { code?: string }): boolean {
	return error.code === LEADERBOARD_TIME_REJECTED_CODE;
}

/**
 * Si una marca que no llegó al ranking se vuelve a intentar (D113): solo
 * cuando falló la red o el servidor, nunca cuando el trigger la rechazó.
 * Va aquí, y no en `cloud-storage.ts`, para probarla sin cargar Supabase.
 */
export function shouldRetryLeaderboardUpload(
	result: LeaderboardUploadResult,
): boolean {
	return result === "failed";
}
