# D170 · Accesibilidad · Cambio de tema sin transiciones: `ThemeEffects` pone `data-theme-switching` en `<html>`, cambia `data-theme` · Implementado

**Resumen:** Cambio de tema sin transiciones: `ThemeEffects` pone `data-theme-switching` en `<html>`, cambia `data-theme`, fuerza el recálculo (`offsetHeight`) y lo quita; `global.css` anula `transition` mientras tanto. Ningún color se queda congelado a medio camino en una pestaña oculta (1,1–1,25:1 de D159/D166). Global: vale para `GameTypeToggle`, tarjetas de continente y lo que venga

Una transición de color solo avanza mientras la página pinta fotogramas: en una pestaña
oculta, un cambio de tema la deja congelada en el color viejo, mezclada con fondos que ya
son del tema nuevo (1,1–1,25:1 medido en D159/D166, `GameTypeToggle` y `OptionTile`).

- `ThemeEffects` pone `data-theme-switching` en `<html>`, cambia `data-theme`, fuerza el
  recálculo de estilos (`offsetHeight`) y quita el atributo en el mismo tick. La regla de
  `global.css` `[data-theme-switching] * { transition: none !important }` hace que ningún
  color se funda durante ese recálculo; al quitarla, no queda ningún cambio pendiente que
  pueda arrancar una transición.
- Solo si el tema cambia de verdad: al cargar, el script bloqueante de `Layout.astro` ya lo
  puso y el efecto no toca nada.
- Arreglo global: vale para `GameTypeToggle` (que conserva `background-color` en su
  transición, D159), las tarjetas de continente (`transition` de Tailwind) y cualquier
  componente futuro. Permitiría devolver a `OptionTile` el fundido del fondo que quitó D166
  (#50); no se hace aquí para no chocar con ese PR.
- Alternativa: quitar los colores de la transición componente a componente (D159, D166).
  Pierde los fundidos al pasar el ratón y hay que acordarse en cada componente nuevo.

**Rama:** `fix/tema-transiciones-y-almacenamiento`

## Contexto común de la unidad (antes `46-tema-transiciones-y-almacenamiento.md`)

> Unidad `fix/tema-transiciones-y-almacenamiento` (2026-09-28), pendientes P34 y P35 de
> `plans/pendientes.md`, fila #8 de `CONTENT_CHECKLIST.md` y P33 (umbrales de logros
> confirmados por el dueño). Cubre D170–D172.
