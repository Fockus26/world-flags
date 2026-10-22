import type { Session } from "@supabase/supabase-js";

import { useEffect } from "react";

import { supabase } from "@/lib/supabase";

import type { AppDispatch } from "@/store";

import { useAppDispatch, useAppSelector } from "@/store/hooks";

import {
	sessionEndedUnexpectedly,
	setAuthState,
} from "@/store/slices/authSlice";

import { leaderboardCache } from "@/utils/leaderboard-cache";

import {
	consumeVoluntarySignOut,
	forgetVoluntarySignOut,
} from "@/utils/session-end";

function applySession(dispatch: AppDispatch, session: Session | null) {
	dispatch(
		setAuthState({
			user: session?.user ?? null,
			status: session?.user ? "authenticated" : "guest",
		}),
	);
}

export function AuthEffects() {
	const dispatch = useAppDispatch();

	const status = useAppSelector((state) => state.auth.status);

	useEffect(() => {
		// Cuenta de la última sesión vista: `onAuthStateChange` también avisa
		// al refrescar el token, y eso no es cambiar de sesión.
		let lastUserId: string | null | undefined;

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			const userId = session?.user.id ?? null;

			// Al entrar o salir el ranking se vuelve a pedir (D188).
			if (lastUserId !== undefined && userId !== lastUserId) {
				leaderboardCache.clear();
			}

			// Se cerró una sesión que estaba abierta aquí sin que se pidiera en
			// esta pestaña: se avisa y `GameEffects` aparta lo pendiente (D210).
			// Va antes de `applySession`, que es lo que dispara ese logout.
			if (event === "SIGNED_OUT") {
				const wasVoluntary = consumeVoluntarySignOut();

				if (typeof lastUserId === "string" && !wasVoluntary) {
					dispatch(sessionEndedUnexpectedly());
				}
			}

			// Entró alguien que no estaba: un cierre pedido de antes no explica
			// el próximo `SIGNED_OUT` (D219).
			if (event === "SIGNED_IN" && lastUserId === null && userId) {
				forgetVoluntarySignOut();
			}

			lastUserId = userId;
			applySession(dispatch, session);
		});

		return () => {
			subscription.unsubscribe();
		};
	}, [dispatch]);

	useEffect(() => {
		if (status === "authenticated" && window.opener) {
			window.close();
		}
	}, [status]);

	return null;
}
