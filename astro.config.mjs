// @ts-check

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
]) {
	process.env[key] ??= fileEnv[key];
}

// Dominio de producción (Vercel). Si cambia, actualizar también el `Sitemap:`
// de `public/robots.txt`.
const SITE_URL = "https://world-flags-hazel.vercel.app";

// https://astro.build/config
export default defineConfig({
	site: SITE_URL,
	// `/` sigue prerenderizada; solo `/api/*` corre en funciones (`prerender = false`).
	adapter: vercel(),
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
