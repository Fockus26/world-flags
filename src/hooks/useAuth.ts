import {
	type AuthError,
	isAuthRetryableFetchError,
} from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useAppSelector } from "@/store/hooks";
import {
	authErrorField,
	authErrorMessage,
	isExistingAccountError,
} from "@/utils/auth-errors";
import {
	consumeVoluntarySignOut,
	markVoluntarySignOut,
} from "@/utils/session-end";

/** En español y por `error.code` (D052, D212): nunca el texto crudo de Supabase. */
function toAuthErrorMessage(error: AuthError): string {
	return authErrorMessage(error, isAuthRetryableFetchError(error));
}

/** El campo que señala el error en el formulario (`aria-invalid`, D212). */
function toAuthErrorField(error: AuthError) {
	return authErrorField(error, isAuthRetryableFetchError(error));
}

export function useAuth() {
	const user = useAppSelector((state) => state.auth.user);
	const status = useAppSelector((state) => state.auth.status);

	const signInWithGoogle = async () => {
		const width = 500;
		const height = 600;
		const left = window.screenX + (window.outerWidth - width) / 2;
		const top = window.screenY + (window.outerHeight - height) / 2;

		const popup = window.open(
			"",
			"google-oauth",
			`width=${width},height=${height},left=${left},top=${top}`,
		);

		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo: window.location.origin,
				skipBrowserRedirect: true,
			},
		});

		if (error || !data.url) {
			popup?.close();
			return;
		}

		if (popup) {
			popup.location.href = data.url;
		}
	};

	const signUpWithEmail = async (email: string, password: string) => {
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: { emailRedirectTo: window.location.origin },
		});

		/**
		 * Correo que ya tiene cuenta: con "Confirm email" activo (producción)
		 * Supabase responde como a un registro nuevo, sin identidades; sin él,
		 * con `user_already_exists`. En los dos casos se sigue como un registro
		 * nuevo ("revisa tu correo", con la pista de iniciar sesión si ya
		 * tenías cuenta): decir "ya existe" revelaría qué correos tienen
		 * cuenta (D212).
		 */
		if (error && isExistingAccountError(error)) {
			return { error: null, errorField: null, needsEmailConfirmation: true };
		}

		if (error) {
			return {
				error: toAuthErrorMessage(error),
				errorField: toAuthErrorField(error),
				needsEmailConfirmation: false,
			};
		}

		const isExistingAccount = data.user?.identities?.length === 0;

		if (isExistingAccount) {
			return { error: null, errorField: null, needsEmailConfirmation: true };
		}

		return {
			error: null,
			errorField: null,
			needsEmailConfirmation: !data.session,
		};
	};

	const resendConfirmationEmail = async (email: string) => {
		const { error } = await supabase.auth.resend({
			type: "signup",
			email,
			options: { emailRedirectTo: window.location.origin },
		});

		return {
			error: error ? toAuthErrorMessage(error) : null,
		};
	};

	const signInWithEmail = async (email: string, password: string) => {
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		return {
			error: error ? toAuthErrorMessage(error) : null,
			errorField: error ? toAuthErrorField(error) : null,
		};
	};

	const signOut = async () => {
		// Este cierre lo pidió el usuario: sin aviso de "se cerró tu sesión"
		// (D210). `SIGNED_OUT` llega antes de que `signOut` resuelva; si no
		// llegó (falló), la marca no debe quedar para un cierre posterior.
		markVoluntarySignOut();
		await supabase.auth.signOut();
		consumeVoluntarySignOut();
	};

	return {
		user,
		status,
		signInWithGoogle,
		signUpWithEmail,
		signInWithEmail,
		resendConfirmationEmail,
		signOut,
	};
}
