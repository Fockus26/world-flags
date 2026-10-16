# fix/contraste-foco-configuracion — P25 + P27 (tanda 2026-09-26 b, X1)

PR #47 · slot wt1 · changeset patch · decisiones D159–D161
(`context/decisions/41-contraste-foco-configuracion.md`). Sin fila de CONTENT_CHECKLIST (no hay copy nuevo; la #52 reservada queda sin usar).

## Hecho
- P25: `GameTypeToggle` sin `color` en la transición de la etiqueta. Causa: transición
  congelada en `currentTime` 0 sin fotogramas (panel/pestaña no visible) con el color de
  partida; no era un fallo de recálculo de Chrome. 6,63:1 oscuro / 4,66:1 claro.
- P27: `AutoHeight` abierto → `-m-1 overflow-hidden p-1` en su capa interior. Los paneles
  del modal no recortaban (HeroUI les da 8 px de relleno).
- `OptionTile`: solo el comentario; sigue sin subir (D161).

## Verificado
astro check 0 errores, biome limpio, 196 tests, build. Navegador (4301, invitado): contraste
en light/dark/system×2 al cargar, en caliente y al elegir; axe 0 en página y modal; anillo
entero en las 16 opciones a 1024 y 320 px; sin scroll horizontal; layout idéntico.
Sin capturas (panel oculto).

## Observado fuera de la unidad
- `OptionTile` también anima `color` (y `has-checked`): tras cambiar de tema, sin fotogramas,
  su texto se queda a medio camino. Mismo patrón que P25; para quien juega son 150 ms.
- `heroui-theme.css` no tiene bloque `@media (prefers-color-scheme: dark)` para
  `:root:not([data-theme])` (sí `variables.css`): si `localStorage` falla, hasta que
  `ThemeEffects` pone `data-theme`, los tokens de HeroUI van en claro y los de la app en oscuro.
