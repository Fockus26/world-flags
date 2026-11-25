// @ts-nocheck — the `Project` type lives in the portfolio repo (content/types.ts), not here
// Portfolio entry (project-showcase skill). The portfolio copies it to
// content/projects/world-flags.ts and sets `order` there.
import type { Project } from "@/content/types";

export const project: Project = {
	slug: "world-flags",
	order: 0, // set in the portfolio
	name: "World Flags",
	kind: { es: "Juego web instalable", en: "Installable web game" },
	sentence: {
		es: "Aprende los países, banderas y capitales del mundo jugando a diario.",
		en: "Learn the world's countries, flags and capitals by playing daily.",
	},
	summary: {
		es: "Quien juega memoriza los 197 países, sus banderas y capitales, y los ubica en el mapa, con prácticas cortas que repiten lo que está por olvidar. Su progreso lo sigue del teléfono al computador, funciona sin conexión y puede competir contra reloj en un ranking público.",
		en: "Players memorise all 197 countries, their flags and capitals, and find them on the map, through short sessions that bring back what they are about to forget. Progress follows them from phone to computer, it works offline, and they can race the clock on a public ranking.",
	},
	role: {
		es: "Producto propio: idea y desarrollo completo.",
		en: "Own product: concept and full development.",
	},
	stack: ["Astro", "React", "TypeScript", "Postgres", "PWA"],
	links: [
		{ type: "live", url: "https://world-flags.fockus.dev" },
		{ type: "code", url: "https://github.com/Fockus26/world-flags" },
	],
	media: {
		format: "phone",
		video: "/work/world-flags/loop",
		poster: "/work/world-flags/poster.jpg",
	},
	client: { name: "World Flags", named: true },
};
