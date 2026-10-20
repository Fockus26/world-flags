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

export function markVoluntarySignOut(): void {
	voluntarySignOut = true;
}

/** Lee la marca y la borra: vale para un solo cierre. */
export function consumeVoluntarySignOut(): boolean {
	const wasVoluntary = voluntarySignOut;
	voluntarySignOut = false;

	return wasVoluntary;
}
