export const prerender = false;

/**
 * Lo que espera kit-deploy antes de pasar el tráfico al contenedor nuevo, y lo que mira
 * para sus alertas (D243). Barato a propósito: sin base de datos ni sesión, o un parpadeo
 * de Postgres haría que el sitio pareciera caído y se reiniciara.
 */
export function GET(): Response {
	return Response.json(
		{ ok: true, sha: process.env.GIT_SHA ?? null },
		{ headers: { "cache-control": "no-store" } },
	);
}
