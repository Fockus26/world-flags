import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FeedbackMessage } from "@/components/ui/FeedbackMessage";
import { useAuth } from "@/hooks/useAuth";
import {
	nextPollState,
	POLL_WINDOW_MS,
	type PollStopReason,
	pollDelay,
} from "@/utils/confirmation-poll";

interface EmailConfirmationPendingProps {
	email: string;
	password: string;
	onCancel: () => void;
}

/**
 * Copy provisional (D214, CONTENT_CHECKLIST). Neutro: no dice si el correo ya
 * tenía cuenta, solo con qué se entra.
 */
const CREDENTIALS_MESSAGE =
	"No pudimos entrar con la contraseña que acabas de escribir. Abre el enlace del correo, que te hace entrar, o inicia sesión con la contraseña con la que creaste la cuenta.";

const TIMEOUT_MESSAGE =
	"Ya no lo comprobamos desde aquí. Abre el enlace del correo para entrar o, si ya lo abriste, pulsa «Ya confirmé».";

const NOT_CONFIRMED_MESSAGE =
	"Tu correo aún no consta como confirmado. Abre el enlace que te enviamos (mira también en spam).";

export function EmailConfirmationPending({
	email,
	password,
	onCancel,
}: EmailConfirmationPendingProps) {
	const { signInWithEmail, resendConfirmationEmail } = useAuth();
	const [resendState, setResendState] = useState<
		"idle" | "sending" | "sent" | "error"
	>("idle");
	const [resendError, setResendError] = useState<string | null>(null);
	const [stopReason, setStopReason] = useState<PollStopReason | null>(null);
	const [isChecking, setIsChecking] = useState(false);
	const [checkMessage, setCheckMessage] = useState<string | null>(null);

	/**
	 * Sondeo con espera creciente y tope (D214, `confirmation-poll.ts`). Con
	 * la pestaña oculta no se sondea: al volver se respeta lo que quedaba de
	 * la espera, para no gastar intentos por cambiar de pestaña.
	 */
	// biome-ignore lint/correctness/useExhaustiveDependencies: signInWithEmail está estabilizado por React Compiler (ver docs/components.md)
	useEffect(() => {
		const deadline = Date.now() + POLL_WINDOW_MS;
		let attempt = 0;
		let invalidStreak = 0;
		let lastCheckAt = Date.now();
		let timeoutId: number | undefined;
		let inFlight = false;
		let finished = false;

		const stop = (reason: PollStopReason) => {
			finished = true;
			window.clearTimeout(timeoutId);
			setStopReason(reason);
		};

		const schedule = () => {
			window.clearTimeout(timeoutId);

			if (finished || document.hidden || inFlight) return;

			const now = Date.now();

			if (now >= deadline) {
				stop("timeout");
				return;
			}

			const dueAt = Math.min(lastCheckAt + pollDelay(attempt), deadline);

			timeoutId = window.setTimeout(check, Math.max(0, dueAt - now));
		};

		async function check() {
			if (finished || inFlight) return;

			if (Date.now() >= deadline) {
				stop("timeout");
				return;
			}

			inFlight = true;
			lastCheckAt = Date.now();

			const { errorCode } = await signInWithEmail(email, password);

			inFlight = false;

			// Entró: `AuthSection` cambia de vista y esto se desmonta.
			if (finished || errorCode === null) return;

			attempt += 1;

			const next = nextPollState(invalidStreak, errorCode);

			invalidStreak = next.invalidStreak;

			if (next.stop) {
				stop(next.stop);
				return;
			}

			schedule();
		}

		document.addEventListener("visibilitychange", schedule);

		schedule();

		return () => {
			finished = true;
			window.clearTimeout(timeoutId);
			document.removeEventListener("visibilitychange", schedule);
		};
	}, [email, password]);

	/** Una comprobación a mano, cuando el sondeo ya paró por tiempo. */
	async function handleCheckNow() {
		if (isChecking) return;

		setIsChecking(true);
		setCheckMessage(null);

		const { error, errorCode } = await signInWithEmail(email, password);

		setIsChecking(false);

		if (errorCode === "invalid_credentials") {
			setCheckMessage(CREDENTIALS_MESSAGE);
		} else if (errorCode === "email_not_confirmed") {
			setCheckMessage(NOT_CONFIRMED_MESSAGE);
		} else if (error) {
			setCheckMessage(error);
		}
	}

	async function handleResend() {
		setResendState("sending");
		setResendError(null);
		const { error } = await resendConfirmationEmail(email);

		// Solo se confirma el reenvío si Supabase lo aceptó: puede rechazarlo por
		// límite de envíos, dirección no autorizada en el mailer integrado o red.
		if (error) {
			setResendError(error);
			setResendState("error");
			return;
		}

		setResendState("sent");
	}

	const statusMessage =
		checkMessage ??
		(stopReason === "credentials"
			? CREDENTIALS_MESSAGE
			: stopReason === "timeout"
				? TIMEOUT_MESSAGE
				: null);

	return (
		<div className="flex flex-col items-center gap-3 py-2 text-center">
			{stopReason === null && (
				<div
					className="size-10 animate-spin rounded-full border-[3px] border-surface-soft border-t-(--color-primary)"
					aria-hidden="true"
				/>
			)}

			<h3 className="m-0 text-surface-soft">Revisa tu correo</h3>

			{/* Copy provisional (D214): la pantalla ya no promete cerrarse sola
			    siempre; el enlace del correo es lo que hace entrar. */}
			<p className="m-0 text-text-placeholder text-label leading-normal">
				Te enviamos un enlace de confirmación a <strong>{email}</strong>. Al
				abrirlo, entrarás directamente.
				{stopReason === null &&
					" Esta pantalla también lo comprueba durante unos minutos."}
			</p>

			{/* Un correo que ya tenía cuenta llega aquí igual que uno nuevo, para
			    no revelar qué correos existen (D212). Copy provisional. */}
			<p className="m-0 text-text-placeholder text-caption leading-normal">
				Si ya tenías una cuenta con este correo, no te llegará nada: pulsa «Usar
				otro correo» e inicia sesión.
			</p>

			{/* Siempre montado: el cambio de texto se anuncia (WCAG 4.1.3). */}
			<p role="status" className="m-0 text-surface-soft text-label">
				{statusMessage ?? ""}
			</p>

			<div className="mt-2 flex flex-wrap justify-center gap-2">
				{stopReason === "timeout" && (
					<Button type="button" onClick={handleCheckNow}>
						{isChecking ? "Comprobando…" : "Ya confirmé"}
					</Button>
				)}

				<Button
					color="secondary"
					type="button"
					onClick={handleResend}
					disabled={resendState === "sending"}
				>
					{resendState === "sent" ? "Correo reenviado" : "Reenviar correo"}
				</Button>

				<Button color="secondary" type="button" onClick={onCancel}>
					Usar otro correo
				</Button>
			</div>

			{resendState === "error" && resendError && (
				<FeedbackMessage variant="danger" size="sm" role="alert">
					No se pudo reenviar el correo: {resendError}
				</FeedbackMessage>
			)}

			<p role="status" className="sr-only">
				{resendState === "sent" ? `Te reenviamos el correo a ${email}.` : ""}
			</p>
		</div>
	);
}
