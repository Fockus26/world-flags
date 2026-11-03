import {
	AVATAR_STYLES,
	type AvatarStyle,
	type UserLearningData,
	type UserProfile,
} from "@/types/progress";
import { leaderboardCache } from "./leaderboard-cache";
import {
	isLeaderboardTimeRejected,
	type LeaderboardUploadResult,
	toLeaderboardDisplayName,
} from "./leaderboard-validation";
import type { LearningDataResponse } from "./learning-data-columns";
import { pickChangedColumns, SUB_GAME_COLUMNS } from "./learning-data-row";
import {
	DEFAULT_PROFILE,
	normalizeLearningData,
	SUB_GAME_KEYS,
	SUB_GAME_TYPES,
} from "./learning-storage";
import {
	nextVersion,
	runVersionedSync,
	type VersionedLearningData,
} from "./sync-attempts";

/**
 * Tope de `syncLearningData`. El GET normal tarda menos de un segundo; 10 s
 * dan margen a una red lenta y a una función de Vercel que arranca en frío.
 * Pasado el tope, `GameEffects` sigue con los datos locales, sin subir nada, y
 * reintenta más tarde (D045).
 */
const SYNC_TIMEOUT_MS = 10_000;

/**
 * Fallo de una petición a la nube, con su causa ya clasificada (D050):
 *
 * - `network`: no hubo respuesta del servidor — sin red, `fetch` rechazado, o
 *   el tope de 10 s. Es "sin conexión" aunque `navigator.onLine` diga lo
 *   contrario, que miente a menudo (wifi sin salida a internet, portal cautivo).
 * - `server`: el servidor respondió con un error (500, permisos, esquema).
 *   Hay red; lo que falla es la sincronización.
 *
 * `sessionRejected`: el servidor no aceptó la sesión (401). No se arregla
 * reintentando sin más: `GameEffects` la comprueba y, si sigue igual, la cierra
 * (D210).
 */
export class CloudRequestError extends Error {
	readonly kind: "network" | "server";
	readonly sessionRejected: boolean;

	constructor(
		kind: "network" | "server",
		message: string,
		cause?: unknown,
		sessionRejected = false,
	) {
		super(message, { cause });
		this.name = "CloudRequestError";
		this.kind = kind;
		this.sessionRejected = sessionRejected;
	}
}

/** ¿El servidor rechazó la sesión (y no hay que reintentar sin más)? */
export function isSessionRejected(error: unknown): boolean {
	return error instanceof CloudRequestError && error.sessionRejected;
}

/** ¿El fallo es falta de conexión (y no un error del servidor)? */
export function isNetworkFailure(error: unknown): boolean {
	if (error instanceof CloudRequestError) return error.kind === "network";

	return typeof navigator !== "undefined" && !navigator.onLine;
}

/**
 * Se registra en consola solo un fallo del servidor inesperado. Sin red es un
 * estado que la UI ya comunica (D050); un token rechazado se refresca y se
 * reintenta solo (D210), y quien lo maneja registra únicamente si el último
 * intento también falla (D214).
 */
function shouldLogCloudError(error: CloudRequestError): boolean {
	return error.kind === "server" && !error.sessionRejected;
}

function toCloudRequestError(
	error: { message: string; code?: string },
	status: number,
	action: string,
): CloudRequestError {
	const isNetwork =
		status === 0 || (typeof navigator !== "undefined" && !navigator.onLine);

	return new CloudRequestError(
		isNetwork ? "network" : "server",
		`${action}: ${error.message}`,
		error,
		!isNetwork && status === 401,
	);
}

/** Lo que devuelve una llamada a `/api/*`: nunca lanza, salvo que se aborte. */
interface ApiResult<T> {
	data: T | null;
	error: { message: string; code?: string } | null;
	/** `0`: no hubo respuesta. */
	status: number;
}

/**
 * Una llamada a la API de la app. La sesión va en su cookie. Sin respuesta,
 * `status` 0: lo que `toCloudRequestError` clasifica como sin conexión.
 */
async function apiRequest<T>(
	path: string,
	options: { body?: unknown; signal?: AbortSignal } = {},
): Promise<ApiResult<T>> {
	const { body, signal } = options;

	try {
		const response = await fetch(path, {
			signal,
			...(body === undefined
				? {}
				: {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(body),
					}),
		});

		const payload: unknown = await response.json().catch(() => null);

		if (response.ok) {
			return { data: payload as T, error: null, status: response.status };
		}

		const { message, code } = (payload ?? {}) as {
			message?: string;
			code?: string;
		};

		return {
			data: null,
			error: { message: message ?? `HTTP ${response.status}`, code },
			status: response.status,
		};
	} catch (cause) {
		return {
			data: null,
			error: {
				message: cause instanceof Error ? cause.message : "Sin respuesta",
			},
			status: 0,
		};
	}
}

/**
 * La fila de la cuenta de la sesión, normalizada, con su versión (`updated_at`):
 * la que condiciona la subida siguiente (D210).
 */
export async function fetchRemoteLearningData(
	signal?: AbortSignal,
): Promise<VersionedLearningData | null> {
	const {
		data: response,
		error,
		status,
	} = await apiRequest<{
		row: LearningDataResponse | null;
	}>("/api/learning-data", { signal });

	if (error) {
		const cloudError = toCloudRequestError(
			error,
			status,
			"Failed to fetch remote learning data",
		);

		// Abortada a propósito (timeout o cancelación): quien la abortó ya
		// sabe por qué. Sin red tampoco se registra: es un estado esperado,
		// que la UI ya comunica (D050).
		if (!signal?.aborted && shouldLogCloudError(cloudError)) {
			console.error(cloudError.message, error);
		}

		throw cloudError;
	}

	const row = response?.row;

	if (!row) {
		return null;
	}

	// `jsonb` libre: `normalizeLearningData` valida la forma de todo esto.
	// biome-ignore lint/suspicious/noExplicitAny: jsonb libre, ver arriba
	const data = row as Record<string, any>;

	/**
	 * Pasa por `normalizeLearningData` (el mismo normalizador que usa
	 * localStorage) en vez de mapear a pelo: una fila creada antes de que
	 * existieran estas columnas llega con campos sin definir, y cualquier
	 * lectura posterior de `stats` reventaría. Además así la siembra
	 * retroactiva de días activos también aplica a los datos de la nube.
	 */
	const normalized = normalizeLearningData({
		profile: data.profile,
		countryHistory: data.country_history,
		regionGameScores: data.region_game_scores,
		lastConfiguration: data.last_configuration,
		regionBestTimes: data.region_best_times ?? {},
		lastPracticeByCountry: data.last_practice_by_country ?? {},
		...Object.fromEntries(
			SUB_GAME_TYPES.map((gameType) => [
				SUB_GAME_KEYS[gameType],
				data[SUB_GAME_COLUMNS[gameType]] ?? {},
			]),
		),
		achievements: data.achievements ?? {},
		stats: data.stats ?? undefined,
		sessionHistory: data.session_history ?? [],
		dailyReminder: data.daily_reminder ?? {},
		// Una sola columna (D055) con las fechas de perfil, configuración y
		// notas por continente de Banderas; las de Países viajan dentro de
		// `countries_game`.
		fieldUpdatedAt: {
			profile: data.field_updated_at?.profile ?? null,
			lastConfiguration: data.field_updated_at?.lastConfiguration ?? null,
		},
		regionGameScoresUpdatedAt: data.field_updated_at?.regionGameScores ?? {},
		// `normalizeLearningData` valida la forma: la columna es jsonb libre.
		learningPaths: data.learning_paths ?? {},
	});

	return { data: normalized, version: row.updated_at };
}

/**
 * Sube `data` **condicionada a la versión leída** (D210). Con `previous` (la
 * fila ya existe) es un UPDATE solo de las columnas que cambiaron y solo si
 * `updated_at` sigue siendo el leído; sin él, un INSERT de la fila entera, que
 * no escribe si otro dispositivo la creó mientras tanto. Devuelve `false` cuando
 * no se escribió nada por eso: quien llama vuelve a leer y fusionar.
 *
 * Sin la condición, una subida retrasada (red lenta) pisaba lo que otro
 * dispositivo subió después de leerla: la fusión por fecha de D055 nunca
 * llegaba a ver ese cambio más reciente.
 */
export async function pushLearningData(
	data: UserLearningData,
	previous: VersionedLearningData | null,
	signal?: AbortSignal,
): Promise<boolean> {
	const {
		data: response,
		error,
		status,
	} = await apiRequest<{ written: boolean }>("/api/learning-data", {
		signal,
		body: {
			columns: pickChangedColumns(data, previous?.data ?? null),
			updatedAt: nextVersion(previous?.version ?? null),
			previousVersion: previous?.version ?? null,
		},
	});

	if (error) {
		const cloudError = toCloudRequestError(
			error,
			status,
			"Failed to push learning data",
		);

		if (!signal?.aborted && shouldLogCloudError(cloudError)) {
			console.error(cloudError.message, error);
		}

		throw cloudError;
	}

	return response?.written ?? false;
}

/** Se rechaza en cuanto `signal` se aborta (con su `reason`); si no, nunca termina. */
function rejectOnAbort(signal: AbortSignal): Promise<never> {
	return new Promise((_, reject) => {
		if (signal.aborted) {
			reject(signal.reason);

			return;
		}

		signal.addEventListener("abort", () => reject(signal.reason), {
			once: true,
		});
	});
}

/**
 * Sincroniza la cuenta: lee la fila, la fusiona con lo local y sube el
 * resultado si aporta algo. Se usa al hidratar (login, recarga) y para cada
 * subida posterior (D051): subir sin leer antes pisaría lo que otro
 * dispositivo subió mientras tanto. Y la subida va condicionada a la versión
 * leída: si otro escribió entre la lectura y la subida, se vuelve a leer y
 * fusionar (`runVersionedSync`, D210).
 *
 * Qué se hace lo decide `planSync` (pura): cuenta sin progreso → lo local pasa
 * a ser la cuenta; cuenta con progreso y sin `base` (entra un invitado) → lo
 * local se descarta (D056); con `base` (la base de sincronización de este
 * dispositivo, `getSyncBase`) → `mergeLearningData`.
 *
 * Devuelve lo que queda en la nube tras la llamada — la nueva base — y si se
 * descartó lo local.
 *
 * Se rinde a los `SYNC_TIMEOUT_MS` o cuando se aborta `signal` (el efecto
 * que la lanzó se limpió): rechaza, y lo que quedara en vuelo sale abortado,
 * así que una respuesta tardía ya no sube nada a la nube (D045).
 */
export async function syncLearningData(
	localData: UserLearningData,
	base: UserLearningData | null,
	signal?: AbortSignal,
): Promise<SyncResult> {
	// Cuando el navegador dice "sin red", acierta: no se intenta. Si no, el GET
	// fallaría igual, pero tras los reintentos de postgrest (1 + 2 + 4 s): abrir
	// la app sin conexión dejaría ~7 s de skeleton. Al volver la red, el evento
	// `online` dispara el reintento (D050).
	if (typeof navigator !== "undefined" && !navigator.onLine) {
		throw new CloudRequestError("network", "syncLearningData: sin conexión");
	}

	const controller = new AbortController();

	const abortFromCaller = () => controller.abort(signal?.reason);

	const timeoutId = setTimeout(() => {
		controller.abort(
			new CloudRequestError(
				"network",
				`syncLearningData: sin respuesta en ${SYNC_TIMEOUT_MS} ms`,
			),
		);
	}, SYNC_TIMEOUT_MS);

	if (signal?.aborted) {
		abortFromCaller();
	}

	signal?.addEventListener("abort", abortFromCaller, { once: true });

	try {
		/**
		 * La carrera no sobra aunque las peticiones lleven la señal: `apiRequest`
		 * convierte el aborto en un error de red corriente, y aquí tiene que salir
		 * la razón real (el tope de 10 s o la cancelación).
		 */
		return await Promise.race([
			runSync(localData, base, controller.signal),
			rejectOnAbort(controller.signal),
		]);
	} finally {
		clearTimeout(timeoutId);

		signal?.removeEventListener("abort", abortFromCaller);
	}
}

/** Resultado de `syncLearningData`. */
export interface SyncResult {
	/** Lo que queda en la nube: los datos de la cuenta y la nueva base. */
	data: UserLearningData;
	/** Lo local era del invitado y la cuenta ya tenía progreso: se descartó (D056). */
	discardedLocal: boolean;
}

async function runSync(
	localData: UserLearningData,
	base: UserLearningData | null,
	signal: AbortSignal,
): Promise<SyncResult> {
	return runVersionedSync(
		{
			read: () => fetchRemoteLearningData(signal),
			write: (data, previous) => pushLearningData(data, previous, signal),
		},
		localData,
		base,
	);
}

export interface LeaderboardEntry {
	userId: string;
	displayName: string;
	bestTimeMs: number;
	/**
	 * Avatar de la fila (D078). `null` en las filas anteriores a las columnas
	 * `avatar_style`/`avatar_seed`, en las que sube un cliente viejo y con un
	 * estilo que este cliente no conoce: se pinta la inicial del nombre.
	 */
	avatar: { style: AvatarStyle; seed: string } | null;
}

/** Perfil que acompaña al tiempo en cada fila del ranking. */
type LeaderboardProfile = Pick<
	UserProfile,
	"name" | "avatarStyle" | "avatarSeed"
>;

/** El nombre que acepta el trigger del ranking (D211). */
function getLeaderboardDisplayName(profile: LeaderboardProfile): string {
	return toLeaderboardDisplayName(profile.name, DEFAULT_PROFILE.name);
}

function isAvatarStyle(value: unknown): value is AvatarStyle {
	return (AVATAR_STYLES as readonly unknown[]).includes(value);
}

/**
 * Ranking completo de un scope, del más rápido al más lento. Se trae
 * completo (no solo el top N) para poder calcular en qué puesto queda el
 * usuario actual aunque no esté en el top 20 — la tabla
 * `leaderboard_entries` es pública y liviana (nombre, avatar y tiempo), así
 * que esto no debería ser un problema salvo con muchísimos usuarios.
 *
 */
export async function fetchLeaderboard(
	scope: string,
): Promise<LeaderboardEntry[]> {
	const { data, error, status } = await apiRequest<{
		entries: {
			user_id: string;
			display_name: string;
			best_time_ms: number;
			avatar_style: string | null;
			avatar_seed: string | null;
		}[];
	}>(`/api/leaderboard?scope=${encodeURIComponent(scope)}`);

	if (error) {
		const cloudError = toCloudRequestError(
			error,
			status,
			"Failed to fetch leaderboard",
		);

		if (shouldLogCloudError(cloudError)) {
			console.error(cloudError.message, error);
		}

		throw cloudError;
	}

	return (data?.entries ?? []).map((row) => ({
		userId: row.user_id,
		displayName: row.display_name,
		bestTimeMs: row.best_time_ms,
		avatar:
			isAvatarStyle(row.avatar_style) && typeof row.avatar_seed === "string"
				? { style: row.avatar_style, seed: row.avatar_seed }
				: null,
	}));
}

/**
 * Nombre y avatar de todas las filas del usuario en el ranking, sin tocar sus
 * tiempos (D079). Sin esto la fila solo se reescribe al batir la marca, y un
 * cambio de nombre o de avatar no llegaría al ranking.
 *
 * Solo escribe las filas que difieren, y el servidor lo decide: se llama en cada
 * carga (así también se ponen al día las filas subidas por un cliente viejo,
 * sin avatar). Mejor esfuerzo, como el resto del ranking: devuelve si quedó al
 * día, para reintentar tras la siguiente sincronización buena si falló (D050).
 */
export async function syncLeaderboardProfile(
	profile: LeaderboardProfile,
): Promise<boolean> {
	const { data, error, status } = await apiRequest<{ changed: number }>(
		"/api/leaderboard/profile",
		{
			body: {
				displayName: getLeaderboardDisplayName(profile),
				avatarStyle: profile.avatarStyle,
				avatarSeed: profile.avatarSeed,
			},
		},
	);

	if (error) {
		const cloudError = toCloudRequestError(
			error,
			status,
			"Failed to update own leaderboard profile",
		);

		if (shouldLogCloudError(cloudError)) {
			console.error(cloudError.message, error);
		}

		return false;
	}

	// Tus filas cambiaron de nombre o avatar en todos los scopes (D188).
	if (data?.changed) leaderboardCache.clear();

	return true;
}

/**
 * Se llama cuando cambia la mejor marca de un scope (ver la cola de
 * `leaderboard-upload.ts`, D140): reemplaza la fila del usuario en ese scope.
 * Que una marca peor no pise una mejor que ya está en el ranking (p. ej. si
 * el progreso local se perdió) lo resuelve el trigger del servidor con
 * `least(...)` (`supabase/leaderboard-continentes.sql`, D139): así vale
 * también para los clientes viejos y no cuesta una lectura antes de cada
 * subida.
 * Es un "mejor esfuerzo": si falla no debe romper el juego, solo se registra
 * el error. Devuelve cómo acabó: una marca que no subió (`failed`, p. ej. sin
 * conexión) se reintenta con espera creciente (D140); una que el servidor
 * rechazó por imposible (`rejected`, el trigger de `drizzle/0001_*`) no se
 * reintenta: volvería a rechazarse (D113).
 */
export async function upsertLeaderboardEntry(
	scope: string,
	profile: LeaderboardProfile,
	bestTimeMs: number,
): Promise<LeaderboardUploadResult> {
	const { error, status } = await apiRequest("/api/leaderboard", {
		body: {
			scope,
			displayName: getLeaderboardDisplayName(profile),
			avatarStyle: profile.avatarStyle,
			avatarSeed: profile.avatarSeed,
			bestTimeMs,
		},
	});

	if (error) {
		// No es un fallo de la sincronización: el progreso local y la marca
		// se quedan como están, solo no llega al ranking público.
		if (isLeaderboardTimeRejected(error)) {
			console.warn(
				`Leaderboard time rejected by the server (${scope}): ${error.message}`,
			);

			return "rejected";
		}

		const cloudError = toCloudRequestError(
			error,
			status,
			"Failed to update leaderboard entry",
		);

		if (shouldLogCloudError(cloudError)) {
			console.error(cloudError.message, error);
		}

		return "failed";
	}

	// Que al abrir el ranking se vea ya la marca nueva, no la de la caché (D188).
	leaderboardCache.invalidate(scope);

	return "uploaded";
}
