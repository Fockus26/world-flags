import nodemailer from "nodemailer";

import confirmationHtml from "../../emails/confirmar-registro.html?raw";

/** Copy provisional (CONTENT_CHECKLIST #32). */
const CONFIRMATION_SUBJECT = "Confirma tu correo para empezar en World Flags";

const confirmationText = (url: string) =>
	`¡Ya casi estás dentro!

Gracias por crear tu cuenta. Solo falta confirmar que este correo es tuyo. Abre este enlace:

${url}

Si caduca, pide otro desde la app con «Reenviar correo». Si no has creado ninguna cuenta, ignora este mensaje: sin confirmar, la cuenta no se activa.`;

function createTransport() {
	const host = process.env.SMTP_HOST;

	if (!host) throw new Error("Falta SMTP_HOST para enviar correos.");

	const port = Number(process.env.SMTP_PORT ?? 587);
	const user = process.env.SMTP_USER;

	return nodemailer.createTransport({
		host,
		port,
		secure: port === 465,
		auth: user ? { user, pass: process.env.SMTP_PASS } : undefined,
	});
}

/** El correo de "Confirma tu correo": la plantilla que antes vivía en Supabase. */
export async function sendConfirmationEmail(
	to: string,
	url: string,
): Promise<void> {
	await createTransport().sendMail({
		from: process.env.SMTP_FROM,
		to,
		subject: CONFIRMATION_SUBJECT,
		text: confirmationText(url),
		html: confirmationHtml.replaceAll(
			"{{ .ConfirmationURL }}",
			url.replaceAll("&", "&amp;"),
		),
	});
}
