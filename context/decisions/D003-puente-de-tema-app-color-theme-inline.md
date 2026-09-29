# D003 · Tokens · Puente de tema: `--app-color-*` → `@theme inline` → `--color-*`, y `heroui-theme.css` reescribe los tokens base de HeroUI · Implementado

**Resumen:** Puente de tema: `--app-color-*` → `@theme inline` → `--color-*`, y `heroui-theme.css` reescribe los tokens base de HeroUI con la marca

**Decisión:** Mantener el sistema propio (`variables.css` `--app-color-*` → `theme.css` `@theme inline` → utilidades `--color-*`) y añadir `src/styles/heroui-theme.css` que reescribe los tokens **base** de HeroUI (`--accent`, `--surface`, `--success`, `--danger`, `--radius`, `--font-sans`, …) con esos mismos valores de marca
**Por qué:** Los ~17 consumidores usan `bg-surface`/`text-danger`/etc. y no se quería tocarlos. HeroUI deriva solo `-hover`/`-soft`/`-foreground` vía `color-mix`, así que basta pisar los base

## Sin ID propio, de la misma unidad

**Decisión:** `--btn-contained-fg`: `#ffffff` en claro, `#14121f` en oscuro
**Por qué:** Los fondos de marca en claro son medios/saturados (→ texto blanco); en oscuro son pasteles (→ texto casi negro). Un solo valor por tema cubre los 6 colores

**Decisión:** Botones `soft`/`outline`/`text`: color de texto = `color-mix(in oklab, <color> 62%, var(--foreground))` (`readableFg`). El hover de `soft` **ahonda el tinte suave** en vez de saltar al color pleno
**Por qué:** El color de marca crudo como texto daba ~2.7–4:1 en claro. Saltar a color pleno en hover obligaba a invertir el texto a blanco, y eso dependía de que un `--button-bg` puesto inline se pudiera pisar por clase (frágil). Ahondar el tinte mantiene el texto legible en todos los estados

**Decisión:** `html`/`:root` `background` usa `--background`; se define `--color-text` (= `--foreground`)
**Por qué:** `--color-surface-soft` (que es el color de **texto**) se usaba como fondo de `html` (azul marino en modo claro); `--color-text` no existía y varios headings dependían de heredarlo
