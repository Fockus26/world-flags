# D197 · SEO · `h1` legible en el HTML prerenderizado, marca "Banderas del Mundo" y metadata social · Implementado

**Resumen:** el `h1` de `Configuration` lleva el título en un `sr-only` mientras carga (el skeleton de D042 sigue igual, `aria-hidden`); la marca canónica es "Banderas del Mundo" ("World Flags" queda como `alternateName`); description, `og:image:alt`/`twitter:image:alt` y `og:locale es_419` con los textos aprobados por el dueño (P47.5–8); JSON-LD con `operatingSystem: "Web"` e `image`; `og-image.png` recomprimida a PNG con paleta (588 → 169 KB, 1200×630).

**Causa (P46):** el informe QA veía "0 headings"; medido sobre el build, el HTML sí trae un `<h1>`, pero el prerender ocurre siempre en carga inicial (`hasHydratedOnce = false`), así que su único contenido era el skeleton: `aria-hidden` con el texto de referencia en `invisible`. Para un lector o un bot que respete eso, un `h1` vacío. No es `useIsClient` (D179): lo decide `useHydration`.

**Decisión:** durante la carga, `<span class="sr-only">{title}</span>` + el skeleton de siempre. Es el título del juego por defecto (Países), el mismo que ya medía el skeleton. Servidor y primer render del cliente coinciden (los dos en carga), así que no hay error de hidratación; al llegar los datos el `h1` pasa a ser el texto real, como antes. La sección está `inert` en carga, así que el lector no oye un título que puede cambiar.

**Alternativas descartadas:**
- `h1` estático en `index.astro` fuera de la isla: `Results` también tiene `h1`, habría dos en pantalla de resultados; y obligaba a bajar el de `Configuration` a `h2`.
- Quitar el skeleton del `h1` y pintar el título por defecto: con un juego guardado distinto se vería "Países" y saltaría a "Banderas" (justo lo que D042 evita).
- Texto real transparente bajo el skeleton: evita el texto duplicado en el HTML crudo, pero axe calcula contraste sobre color transparente.

**Coste aceptado:** en el HTML crudo el texto del `h1` aparece dos veces (el `sr-only` y la referencia invisible del skeleton). Tras hidratar y cargar, una sola.

**Rama:** `fix/seo-metadata`
