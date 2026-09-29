# D102 · Accesibilidad · Resto de anillos del color del elemento: `RegionOption` = color de la nota mezclado hacia `--foreground` · Implementado

**Resumen:** Resto de anillos del color del elemento: `RegionOption` = color de la nota mezclado hacia `--foreground` (`--app-score-ring`, ≥4,22:1), enlaces y casillas del selector de países `secondary-hover`, racha `primary-hover`, neutros `surface-soft`; `OptionTile`, `GameTypeToggle` y primitivos HeroUI siguen en accent (es su color). Se añade anillo a controles que no marcaban nada (selector de países, "Gestionar sesión", X de avisos de logro)

Cada elemento propio (no HeroUI) usa el color con el que ya se pinta, en su tono
`-hover` cuando es un color de marca:

| Elemento | Color del anillo | Claro | Oscuro |
|---|---|---|---|
| `RegionOption` (tarjeta de continente) | color de su nota mezclado hacia `--foreground` (`--app-score-ring`, misma fórmula que `readableFg`) | ≥4,22 (10 notas) | ≥6,5 |
| `RegionOption` sin nota | `neutral-hover` mezclado igual | 12,9 | 14,5 |
| Enlaces "Todos/Ninguno" del selector de países | `secondary-hover` | 5,0 | 9,22 |
| Casilla de país del selector | `secondary-hover` (su color al marcarla) | 5,0 | 9,22 |
| Badge de racha (`UserSummary`) | `primary-hover` | 6,04 | 8,64 |
| `UserSummary`, avatares del perfil, pestañas del login, "?" del modo, X de avisos, título del tutorial, "Gestionar sesión", desplegable de continente del selector | `surface-soft` (el color del texto) | 16,86 | 14,96 |
| `OptionTile`, `GameTypeToggle` y primitivos HeroUI (pestañas, `Select`, `Switch`, campos, acordeón) | `--focus` = accent, sin cambios: su color **es** el morado de acento | 4,66 (4,01 sobre `--default`) | 5,5–6,6 |

- **Neutros → `surface-soft`**, no el morado ni el gris `text-placeholder`: es el
  color del texto, el que ya usaban `UserSummary` y el hover de los avatares.
  El avatar enfocado pasa de morado (igual que el seleccionado, que es
  `outline-primary`) a `surface-soft` + el mismo levantamiento del hover: foco y
  selección ya no se confunden.
- **Controles que no marcaban nada con el teclado** (el `button { outline: none }`
  global los dejaba sin indicador): casillas y desplegables de continente del
  `CountryPickerModal`, "Gestionar sesión →" (`AccountTab`) y la X de
  `AchievementToasts`. Se les pone el anillo del color que les toca. Era un fallo
  de WCAG 2.4.7 del mismo tema que esta unidad.

**Rama:** `style/foco-y-toque`

_Contexto común de la unidad (antes `23-foco-y-toque.md`): en D101._
