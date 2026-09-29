# D104 · UX · Auditoría táctil (emulación `mobile`): qué muestra cada elemento interactivo principal al tocarlo · Implementado

Comprobado con reglas `:active` que casan con el elemento fuera de
`@media (hover: hover)` (`matchMedia('(hover: hover)')` = `false`) y, para HeroUI,
disparando `pointerdown` táctil y leyendo el fondo computado:

| Elemento | Al tocar |
|---|---|
| Tarjetas de continente (`RegionOption`) | fondo de la nota, anillo de 2 px, levantamiento (y el `active:` propio de escala) |
| `OptionTile` (modo, orden, dificultad, temporizador, tema) | `--default-hover` |
| `UserSummary` y su barra (`group-hover`) | `surface-hover` / `surface` |
| Badge de racha | escala 110 % |
| Avatares del perfil | levantamiento + anillo `surface-soft` |
| "Gestionar sesión", pestañas del login, X de avisos | texto `surface-soft` |
| Enlaces del selector de países | `secondary-hover` |
| Iconos de la cabecera, botones de modales, "Comenzar", "Abandonar", resultados | estado pulsado de HeroUI (ya existía) |
| Selector de juego (`GameTypeToggle`) | no tiene hover propio: nada que replicar |
| Tablero de Países | sus casillas no son interactivas: nada que replicar |

**Rama:** `style/foco-y-toque`

_Contexto común de la unidad (antes `23-foco-y-toque.md`): en D101._
