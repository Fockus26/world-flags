import { waitUntil } from "@vercel/functions";
import bcrypt from "bcryptjs";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { verifyPassword } from "better-auth/crypto";

import { db } from "./db/client";
import { account, rateLimit, session, user, verification } from "./db/schema";
import { sendConfirmationEmail } from "./email";

/**
 * URL de la app en este despliegue. En producción, `BETTER_AUTH_URL`; en un preview
 * no hay URL fija: kit-deploy pone la suya en `KIT_DEPLOY_PREVIEW_URL` (ya con
 * `https://`) y Vercel, mientras siga de respaldo, en `VERCEL_URL`/`VERCEL_BRANCH_URL`.
 * Es la que tienen que llevar los enlaces.
 */
function deploymentOrigins(): string[] {
	const vercel = [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]
		.filter((host): host is string => Boolean(host))
		.map((host) => `https://${host}`);
	const kitDeploy = process.env.KIT_DEPLOY_PREVIEW_URL;
	return kitDeploy ? [kitDeploy, ...vercel] : vercel;
}

const baseURL = process.env.BETTER_AUTH_URL ?? deploymentOrigins()[0];

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_SECRET;

export const auth = betterAuth({
	baseURL,
	secret: process.env.BETTER_AUTH_SECRET,
	trustedOrigins: deploymentOrigins(),
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: { user, session, account, verification, rateLimit },
	}),
	advanced: {
		// Los ids de Supabase son UUID: los importados conservan el suyo.
		database: { generateId: "uuid" },
		// El correo se manda sin esperarlo: si no, un registro nuevo tardaría más que
		// uno con correo ya usado y delataría qué correos tienen cuenta (D212). En una
		// función de Vercel, sin `waitUntil` el envío moriría al responder; en el servidor
		// Node del VPS el proceso sigue vivo y `waitUntil` no hace nada (la promesa ya corre).
		backgroundTasks: { handler: waitUntil },
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		minPasswordLength: 6,
		maxPasswordLength: 72,
		password: {
			// Las contraseñas importadas de Supabase están en bcrypt; las nuevas, en el
			// formato de Better Auth. Cada usuario pasa al nuevo al cambiar la suya.
			verify: ({ hash, password }) =>
				hash.startsWith("$2")
					? bcrypt.compare(password, hash)
					: verifyPassword({ hash, password }),
		},
	},
	emailVerification: {
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		sendVerificationEmail: ({ user: { email }, url }) =>
			sendConfirmationEmail(email, url),
	},
	socialProviders:
		googleClientId && googleClientSecret
			? {
					google: {
						clientId: googleClientId,
						clientSecret: googleClientSecret,
					},
				}
			: {},
	account: {
		// Como Supabase: entrar con Google usa la cuenta de ese correo si ya está
		// confirmada. Si no lo está, Better Auth lo rechaza: así nadie reserva un correo
		// ajeno con una contraseña para heredar luego la cuenta de su dueño.
		accountLinking: { enabled: true, trustedProviders: ["google"] },
	},
	session: {
		expiresIn: 60 * 60 * 24 * 60,
		updateAge: 60 * 60 * 24,
		// Cada subida comprueba la sesión: esto evita una consulta por subida. Un cierre
		// de sesión en otro dispositivo tarda como mucho este tiempo en notarse aquí.
		cookieCache: { enabled: true, maxAge: 5 * 60 },
	},
	rateLimit: {
		// En memoria no serviría: cada función de Vercel tendría su propio contador.
		storage: "database",
		customRules: {
			// El sondeo de "Revisa tu correo" entra aquí (D214): 30 por 5 min, como Supabase.
			"/sign-in/email": { window: 300, max: 30 },
			"/sign-up/email": { window: 300, max: 10 },
			"/send-verification-email": { window: 300, max: 5 },
		},
	},
});
