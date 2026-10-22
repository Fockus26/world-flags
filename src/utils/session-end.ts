import {
	clearVoluntarySignOutMark,
	getVoluntarySignOutMark,
	saveVoluntarySignOutMark,
	type VoluntarySignOutMark,
} from "@/utils/learning-storage";

/**
 * ¿El próximo `SIGNED_OUT` lo pidió el usuario en esta pestaña? (D210)
 *
 * Supabase Auth avisa igual de todo cierre de sesión: el del botón, el de otra
 * pestaña (por `BroadcastChannel`), el de un refresco de token fallido o el
 * que fuerza `GameEffects` cuando el servidor rechaza el token. Solo el
 * primero es voluntario; los demás se avisan en pantalla y apartan lo que
 * quedara sin subir. `useAuth().signOut` marca el suyo antes de llamar.
 */
let voluntarySignOut = false;

/** La última sesión que esta pestaña vio abierta (D224). */
export interface SeenSession {
	userId: string;
	/** `session_id` del token de acceso: el mismo mientras se refresca. */
	sessionId: string | null;
	/** `Date.now()` cuando esta pestaña la vio empezar. */
	since: number;
	/** `false` desde su `SIGNED_OUT`: la siguiente que llegue es otra. */
	open: boolean;
}

/**
 * Se conserva tras el `SIGNED_OUT`: `GameEffects` aparta después, en un
 * efecto, y necesita saber qué sesión se cerró.
 */
let lastSession: SeenSession | null = null;

/**
 * `session_id` del JWT de acceso de Supabase, o `null` si no se puede leer.
 * Sin verificar la firma: solo sirve para reconocer la sesión, no para
 * autorizar nada.
 */
export function sessionIdFromAccessToken(
	accessToken: string | null | undefined,
): string | null {
	const payload = accessToken?.split(".")[1];

	if (!payload) return null;

	try {
		const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
		const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
		const claims = JSON.parse(atob(padded)) as { session_id?: unknown };

		return typeof claims.session_id === "string" && claims.session_id
			? claims.session_id
			: null;
	} catch {
		return null;
	}
}

/**
 * Lo que `AuthEffects` ve en cada evento de Auth. Refrescar el token no
 * cambia de sesión; entrar después de un cierre, sí (aunque sea la misma
 * cuenta). Sin sesión, la última queda cerrada pero se recuerda.
 */
export function rememberSession(
	userId: string | null,
	accessToken: string | null,
	now: number = Date.now(),
): void {
	if (!userId) {
		if (lastSession) lastSession = { ...lastSession, open: false };
		return;
	}

	const sessionId = sessionIdFromAccessToken(accessToken);

	if (
		lastSession?.open &&
		lastSession.userId === userId &&
		lastSession.sessionId === sessionId
	) {
		return;
	}

	lastSession = { userId, sessionId, since: now, open: true };
}

/**
 * Marca este cierre como pedido: en esta pestaña (sin aviso, D210) y, para
 * las demás, en `learning-storage` antes de llamar a `signOut` (D219). La
 * compartida nombra la sesión que se pide cerrar (D224).
 */
export function markVoluntarySignOut(
	userId: string | null,
	now: number = Date.now(),
): void {
	voluntarySignOut = true;

	if (!userId) return;

	const sessionId =
		lastSession?.userId === userId ? lastSession.sessionId : null;

	saveVoluntarySignOutMark({ userId, sessionId, at: now });
}

/** Lee la marca de esta pestaña y la borra: vale para un solo cierre. */
export function consumeVoluntarySignOut(): boolean {
	const wasVoluntary = voluntarySignOut;
	voluntarySignOut = false;

	return wasVoluntary;
}

/** `signOut` falló y la sesión sigue abierta: ninguna pestaña debe ver la marca. */
export function cancelVoluntarySignOut(): void {
	voluntarySignOut = false;
	clearVoluntarySignOutMark();
}

/**
 * ¿La marca dice que se pidió cerrar justo la sesión `ended`? Pura (D219,
 * D224). Sin caducidad por tiempo: una pestaña congelada en segundo plano
 * puede procesar el `SIGNED_OUT` mucho después y la marca sigue valiendo.
 *
 * - Con `session_id` en los dos lados, cuenta solo si es la misma sesión:
 *   un cierre involuntario de una sesión posterior (volver a entrar crea
 *   otra) no la hereda.
 * - Si falta (token ilegible), se compara el instante: la marca tiene que
 *   ser de después de que esta pestaña viera empezar esa sesión, y no del
 *   futuro (reloj cambiado).
 *
 * Otra cuenta, o ninguna marca: el cierre se trata como involuntario.
 */
export function isVoluntarySignOutOf(
	mark: VoluntarySignOutMark | null,
	ended: SeenSession | null,
	userId: string,
	now: number,
): boolean {
	if (!mark || mark.userId !== userId) return false;
	if (!ended || ended.userId !== userId) return false;

	if (mark.sessionId && ended.sessionId) {
		return mark.sessionId === ended.sessionId;
	}

	return mark.at >= ended.since && mark.at <= now;
}

/**
 * El cierre que esta pestaña vio como ajeno, ¿lo pidió el usuario en otra?
 * Entonces lo que se juegue como invitado ya no es de la cuenta (D214, D219).
 */
export function wasSignOutRequestedElsewhere(
	userId: string,
	now: number = Date.now(),
): boolean {
	return isVoluntarySignOutOf(
		getVoluntarySignOutMark(),
		lastSession,
		userId,
		now,
	);
}
