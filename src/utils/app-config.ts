import { parseVersion } from "./min-version";

/**
 * Configuración de la app que vive fuera del bundle (tabla `app_config`, D108): se
 * cambia en la base sin desplegar. Hoy solo guarda la versión mínima con la que se
 * puede jugar (D109).
 *
 * Archivo aparte de `cloud-storage.ts` a propósito: aquí no hay cuenta ni
 * progreso, y un fallo no se clasifica ni se muestra — cualquier cosa que no
 * sea una respuesta válida vale "no hay mínima".
 */

/**
 * Tope de la consulta. Es una fila diminuta: lo normal es menos de un
 * segundo. Con red lenta, mejor dejar jugar que esperar (D110): pasado el
 * tope se da por "sin mínima" y se vuelve a mirar al volver a la pestaña.
 */
const MIN_VERSION_TIMEOUT_MS = 5_000;

/**
 * La versión mínima publicada, o `null` si no se pudo saber: sin red, tope
 * agotado, error del servidor, la fila no está o su valor no es
 * `MAJOR.MINOR.PATCH`. Nunca lanza: quien la llama trata `null` como "no bloquear".
 */
export async function fetchMinVersion(): Promise<string | null> {
	try {
		const response = await fetch("/api/min-version", {
			signal: AbortSignal.timeout(MIN_VERSION_TIMEOUT_MS),
		});

		if (!response.ok) return null;

		const { value } = (await response.json()) as { value?: unknown };

		return parseVersion(value);
	} catch {
		return null;
	}
}
