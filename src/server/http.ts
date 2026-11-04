import { ACCOUNT_HEADER } from "@/utils/request-account";

import { auth } from "./auth";

export function json(body: unknown, status = 200, headers?: HeadersInit) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json", ...headers },
	});
}

export const badRequest = (message: string) => json({ message }, 400);

/**
 * Una fecha ISO completa, la única forma en que las manda la app. `Date.parse` acepta
 * más que Postgres ("March 7", "1"), y lo que Postgres no acepta acabaría en un 500.
 */
const TIMESTAMP_PATTERN =
	/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}(:\d{2})?)$/;

export const isTimestamp = (value: unknown): value is string =>
	typeof value === "string" &&
	TIMESTAMP_PATTERN.test(value) &&
	!Number.isNaN(Date.parse(value));

/**
 * El cuerpo como objeto, o `null` si no lo es. El carácter NUL se rechaza aquí, en
 * cualquier campo: Postgres no lo admite ni en texto ni en `jsonb`.
 */
export async function readJsonObject(
	request: Request,
): Promise<Record<string, unknown> | null> {
	if (!request.headers.get("content-type")?.includes("application/json")) {
		return null;
	}

	try {
		const text = await request.text();

		if (text.includes("\\u0000")) return null;

		const body: unknown = JSON.parse(text);

		return typeof body === "object" && body !== null && !Array.isArray(body)
			? (body as Record<string, unknown>)
			: null;
	} catch {
		return null;
	}
}

/**
 * La cuenta de esta petición. **Toda escritura y toda lectura privada sale de aquí**,
 * nunca del cuerpo o de la URL: es lo que sustituye a `auth.uid() = user_id` de las
 * políticas de Supabase.
 */
export async function getSessionUserId(
	request: Request,
): Promise<string | null> {
	const session = await auth.api.getSession({ headers: request.headers });
	const userId = session?.user.id ?? null;
	const expected = request.headers.get(ACCOUNT_HEADER);

	// La pestaña cree ser otra cuenta (`request-account.ts`): lo suyo no va a esta.
	return expected && expected !== userId ? null : userId;
}

/** Sin cuenta: `GameEffects` lo trata como sesión rechazada (D210). */
export const unauthorized = () => json({ message: "Sin sesión" }, 401);

/** Un fallo inesperado: se registra aquí y el cliente no ve el detalle. */
export function withErrorHandling(
	handler: (request: Request, url: URL) => Promise<Response>,
) {
	return async ({ request, url }: { request: Request; url: URL }) => {
		try {
			return await handler(request, url);
		} catch (error) {
			console.error(`${request.method} ${url.pathname} failed:`, error);

			return json({ message: "Error del servidor" }, 500);
		}
	};
}
