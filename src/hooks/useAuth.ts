import {
	announceSignIn,
	authClient,
	signOutOfAccount,
} from "@/lib/auth-session";
import { useAppSelector } from "@/store/hooks";
import {
	type AuthErrorLike,
	authErrorField,
	authErrorMessage,
	authTransportFailure,
	isExistingAccountError,
	isRetryableAuthStatus,
	toAuthErrorLike,
} from "@/utils/auth-errors";
import {
	cancelVoluntarySignOut,
	consumeVoluntarySignOut,
	markVoluntarySignOut,
} from "@/utils/session-end";

/** A dónde vuelven los enlaces de Auth, con éxito o con error en la URL (D218). */
const RETURN_PATH = "/";

/**
 * La llamada al cliente de Better Auth, con el error ya en nuestros códigos. Sin red
 * la llamada puede lanzar en vez de devolver el error: cuenta como `status` 0.
 */
async function callAuth<T>(
	call: () => Promise<{
		data: T | null;
		error: { code?: string; status?: number } | null;
	}>,
): Promise<{ data: T | null; error: AuthErrorLike | null }> {
	try {
		const { data, error } = await call();

		return { data, error: error ? toAuthErrorLike(error) : null };
	} catch {
		return { data: null, error: { status: 0 } };
	}
}

/** Sin red o servicio caído (D214): solo `navigator.onLine` falso o `status` 0 es "sin conexión". */
function toTransportFailure(error: AuthErrorLike) {
	return authTransportFailure(
		error,
		isRetryableAuthStatus(error.status),
		typeof navigator === "undefined" || navigator.onLine,
	);
}

/** En español y por código (D052, D212): nunca el texto crudo del servidor. */
function toAuthErrorMessage(error: AuthErrorLike): string {
	return authErrorMessage(error, toTransportFailure(error));
}

/** El campo que señala el error en el formulario (`aria-invalid`, D212). */
function toAuthErrorField(error: AuthErrorLike) {
	return authErrorField(error, toTransportFailure(error));
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

		const { data, error } = await callAuth(() =>
			authClient.signIn.social({
				provider: "google",
				callbackURL: RETURN_PATH,
				errorCallbackURL: RETURN_PATH,
				disableRedirect: true,
			}),
		);

		if (error || !data?.url) {
			popup?.close();
			return;
		}

		if (popup) {
			popup.location.href = data.url;
		}
	};

	const signUpWithEmail = async (email: string, password: string) => {
		const { error } = await callAuth(() =>
			authClient.signUp.email({
				email,
				password,
				// El nombre del jugador vive en su perfil, no en la cuenta.
				name: "",
				callbackURL: RETURN_PATH,
			}),
		);

		/**
		 * Correo que ya tiene cuenta: Better Auth responde como a un registro nuevo
		 * al exigir confirmación. Si aun así llegara el error, se sigue igual ("revisa
		 * tu correo", con la pista de iniciar sesión si ya tenías cuenta): decir "ya
		 * existe" revelaría qué correos tienen cuenta (D212).
		 */
		if (error && !isExistingAccountError(error)) {
			return {
				error: toAuthErrorMessage(error),
				errorField: toAuthErrorField(error),
				needsEmailConfirmation: false,
			};
		}

		return { error: null, errorField: null, needsEmailConfirmation: true };
	};

	const resendConfirmationEmail = async (email: string) => {
		const { error } = await callAuth(() =>
			authClient.sendVerificationEmail({ email, callbackURL: RETURN_PATH }),
		);

		return {
			error: error ? toAuthErrorMessage(error) : null,
		};
	};

	const signInWithEmail = async (email: string, password: string) => {
		const { error } = await callAuth(() =>
			authClient.signIn.email({ email, password }),
		);

		if (!error) await announceSignIn();

		return {
			error: error ? toAuthErrorMessage(error) : null,
			errorField: error ? toAuthErrorField(error) : null,
			// Para el sondeo de "Revisa tu correo" (D214), que decide por código.
			errorCode: error ? (error.code ?? null) : null,
		};
	};

	const signOut = async () => {
		// Este cierre lo pidió el usuario: sin aviso de "se cerró tu sesión"
		// (D210), y las otras pestañas no suman a la cuenta lo que se juegue
		// después como invitado (D219). `SIGNED_OUT` llega antes de que
		// `signOut` resuelva; si no llegó (falló), la marca no debe quedar para
		// un cierre posterior. La compartida se queda: las otras pestañas
		// pueden leerla mucho después (congeladas), y solo vale para la sesión
		// que se cierra ahora (D224).
		markVoluntarySignOut(user?.id ?? null);
		const { failed } = await signOutOfAccount();

		if (failed) {
			cancelVoluntarySignOut();
		} else {
			consumeVoluntarySignOut();
		}
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
