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

/**
 * Cuánto vale la marca compartida de cierre pedido (D219). La otra pestaña la
 * lee en cuanto le llega el `SIGNED_OUT`, que Supabase emite al acabar
 * `signOut` (una petición a Auth): un minuto cubre una red lenta sin dejarla
 * viva para un cierre involuntario posterior, que además exige volver a
 * entrar antes (y entrar la borra).
 */
export const VOLUNTARY_SIGN_OUT_TTL_MS = 60_000;

/**
 * Marca este cierre como pedido: en esta pestaña (sin aviso, D210) y, para
 * las demás, en `learning-storage` antes de llamar a `signOut` (D219).
 */
export function markVoluntarySignOut(
	userId: string | null,
	now: number = Date.now(),
): void {
	voluntarySignOut = true;

	if (userId) saveVoluntarySignOutMark({ userId, at: now });
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

/** Alguien entró: un cierre pedido de antes ya no explica el próximo. */
export function forgetVoluntarySignOut(): void {
	clearVoluntarySignOutMark();
}

/**
 * ¿La marca dice que `userId` pidió cerrar sesión hace poco? Pura (D219). Una
 * marca de otra cuenta, caducada o del futuro (reloj cambiado) no cuenta: ese
 * cierre se trata como involuntario, como antes.
 */
export function isRecentVoluntarySignOut(
	mark: VoluntarySignOutMark | null,
	userId: string,
	now: number,
): boolean {
	if (!mark || mark.userId !== userId) return false;

	const age = now - mark.at;

	return age >= 0 && age <= VOLUNTARY_SIGN_OUT_TTL_MS;
}

/**
 * El cierre que esta pestaña vio como ajeno, ¿lo pidió el usuario en otra?
 * Entonces lo que se juegue como invitado ya no es de la cuenta (D214, D219).
 */
export function wasSignOutRequestedElsewhere(
	userId: string,
	now: number = Date.now(),
): boolean {
	return isRecentVoluntarySignOut(getVoluntarySignOutMark(), userId, now);
}
