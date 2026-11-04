import { useEffect } from "react";

import { subscribeToAuth } from "@/lib/auth-session";

import { useAppDispatch, useAppSelector } from "@/store/hooks";

import {
	sessionEndedUnexpectedly,
	setAuthState,
} from "@/store/slices/authSlice";

import { leaderboardCache } from "@/utils/leaderboard-cache";

import { consumeVoluntarySignOut, rememberSession } from "@/utils/session-end";

export function AuthEffects() {
	const dispatch = useAppDispatch();

	const status = useAppSelector((state) => state.auth.status);

	useEffect(() => {
		// Cuenta de la última sesión vista, para saber si cambió de verdad.
		let lastUserId: string | null | undefined;

		return subscribeToAuth((event, session, endedUserId) => {
			const userId = session?.user.id ?? null;

			// Al entrar o salir el ranking se vuelve a pedir (D188).
			if (lastUserId !== undefined && userId !== lastUserId) {
				leaderboardCache.clear();
			}

			// Se cerró una sesión que estaba abierta aquí sin que se pidiera en
			// esta pestaña: se avisa y `GameEffects` aparta lo pendiente (D210).
			// Va antes de `setAuthState`, que es lo que dispara ese logout.
			if (event === "SIGNED_OUT") {
				const wasVoluntary = consumeVoluntarySignOut();

				if (endedUserId && !wasVoluntary) {
					dispatch(sessionEndedUnexpectedly());
				}
			}

			// Qué sesión hay abierta (o cuál se acaba de cerrar): la marca de un
			// cierre pedido solo vale para esa (D224). No se borra al volver a
			// entrar: una pestaña congelada puede procesar después el
			// `SIGNED_OUT` de antes, y la sesión nueva ya no la hereda.
			rememberSession(userId, session?.sessionId ?? null);

			lastUserId = userId;

			dispatch(
				setAuthState({
					user: session?.user ?? null,
					status: session ? "authenticated" : "guest",
				}),
			);
		});
	}, [dispatch]);

	useEffect(() => {
		if (status === "authenticated" && window.opener) {
			window.close();
		}
	}, [status]);

	return null;
}
