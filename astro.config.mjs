// @ts-check

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// Dominio de producción (Vercel). Si cambia, actualizar también el `Sitemap:`
// de `public/robots.txt`.
const SITE_URL = "https://world-flags-hazel.vercel.app";

// https://astro.build/config
export default defineConfig({
	site: SITE_URL,
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
			include: ["react", "react-dom", "@heroui/react", "react-aria-components", "framer-motion"],
		},
	},
});
