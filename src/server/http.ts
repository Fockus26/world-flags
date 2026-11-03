import { auth } from "./auth";

export function json(body: unknown, status = 200, headers?: HeadersInit) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json", ...headers },
	});
}

export const badRequest = (message: string) => json({ message }, 400);

/** El cuerpo como objeto, o `null` si no lo es. */
export async function readJsonObject(
	request: Request,
): Promise<Record<string, unknown> | null> {
	if (!request.headers.get("content-type")?.includes("application/json")) {
		return null;
	}

	try {
		const body: unknown = await request.json();

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

	return session?.user.id ?? null;
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
