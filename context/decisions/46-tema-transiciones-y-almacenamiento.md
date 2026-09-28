# 46 — Cambio de tema sin transiciones, tema por `learning-storage` y badges legibles

> Unidad `fix/tema-transiciones-y-almacenamiento` (2026-09-28), pendientes P34 y P35 de
> `plans/pendientes.md`, fila #8 de `CONTENT_CHECKLIST.md` y P33 (umbrales de logros
> confirmados por el dueño). Cubre D170–D172.

## D170 — Cambio de tema sin transiciones

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

## D171 — La preferencia de tema pasa por `learning-storage.ts`

`ThemeEffects` y `themeSlice` leían y escribían `localStorage` directamente (regla de
persistencia de `CLAUDE.md`) y sin `try/catch`: con el almacenamiento bloqueado, el efecto
lanzaba. Ahora usan `getStoredThemePreference()` / `saveThemePreference()`, que valen
"system" y no recuerdan nada si no hay acceso, sin lanzar. La clave sigue siendo `"theme"`,
la que lee el script bloqueante de `Layout.astro` (su comentario ya nombra también
`heroui-theme.css`, D168).

## D172 — Texto de los badges contadores sobre el morado

Los contadores de los iconos (menú ⋮ y racha/logros de `UserSummary`) usaban
`text-primary-soft` sobre `bg-primary`: 3,97:1 en claro (fila #8). Pasan a
`text-accent-foreground`, el token de texto sobre el morado de D106/D142: 4,65:1 en claro y
6,74:1 en oscuro. Alternativa (la de la fila #8): fondo `primary-hover` en claro; se descarta
porque el anillo de foco es de ese mismo color.

## Umbrales de logros (P33)

El dueño confirmó el 2026-09-28 los umbrales propuestos de `src/utils/achievements.ts`
(15 min, 20 banderas, 5 sesiones, 500 aciertos, 90 % tras 200, 30 días, 100 días,
10 horas): se quitan los marcadores `🔸 a confirmar`. Sin cambio de cifras.
