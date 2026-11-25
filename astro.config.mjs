// @ts-check

import node from "@astrojs/node";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { loadEnv } from "vite";

// El código de `src/server/` lee `process.env`, como en Vercel. En local, `astro dev`
// solo deja esas variables en `import.meta.env`: aquí pasan de los `.env*` a `process.env`
// (lo que ya esté definido, como lo que pone `qa:local`, manda).
const fileEnv = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "");
for (const key of [
	"DATABASE_URL",
	"BETTER_AUTH_SECRET",
	"BETTER_AUTH_URL",
	"GOOGLE_CLIENT_ID",
	"GOOGLE_SECRET",
	"SMTP_HOST",
	"SMTP_PORT",
	"SMTP_USER",
	"SMTP_PASS",
	"SMTP_FROM",
	"CRON_SECRET",
	"VAPID_SUBJECT",
	"VAPID_PRIVATE_KEY",
	"PUBLIC_VAPID_PUBLIC_KEY",
]) {
	process.env[key] ??= fileEnv[key];
}

// Dominio de producción (kit-deploy en el VPS, D243). Si cambia, actualizar también el
// `Sitemap:` de `public/robots.txt`.
const SITE_URL = "https://world-flags.fockus.dev";

// https://astro.build/config
export default defineConfig({
	site: SITE_URL,
	// `/` sigue prerenderizada; solo `/api/*` corre en el servidor (`prerender = false`).
	// En el VPS, un servidor Node propio (imagen Docker de kit-deploy, D243). Vercel pone
	// `VERCEL=1` en sus builds: mientras siga como respaldo, construye con su adaptador.
	adapter: process.env.VERCEL ? vercel() : node({ mode: "standalone" }),
	integrations: [
		react({
			babel: {
				plugins: [["babel-plugin-react-compiler"]],
			},
		}),
		sitemap(),
	],
	vite: {
		plugins: [tailwindcss()],
		// react-aria-components (par de HeroUI) debe compartir la misma copia
		// de React que el resto de la isla.
		resolve: {
			dedupe: ["react", "react-dom"],
		},
		// Pre-empaquetar las deps grandes en un solo pase al arrancar. Sin
		// esto, Vite las descubre de forma perezosa y reoptimiza a mitad de
		// carga -> 504 "Outdated Optimize Dep" y la isla no hidrata.
		optimizeDeps: {
			include: ["react", "react-dom", "@heroui/react", "react-aria-components"],
		},
	},
});
