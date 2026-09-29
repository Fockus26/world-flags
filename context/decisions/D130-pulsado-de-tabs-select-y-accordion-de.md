# D130 · UX · Pulsado de `Tabs`, `Select` y `Accordion` de HeroUI = su hover, con `[data-pressed="true"]` (React Aria) en `@layer components` · Implementado

**Resumen:** Pulsado de `Tabs`, `Select` y `Accordion` de HeroUI = su hover, con `[data-pressed="true"]` (React Aria) en `@layer components`. La variante `hover` de D103 suma `&[data-pressed="true"]`: los `hover:` sobre primitivos de React Aria (acordeón de Novedades) se ven al tocar aunque no llegue `:active`. Sin hover pegado

- Su hover viene del CSS de HeroUI dentro de `@media (hover: hover)`; la variante
  `hover` redefinida (D103) no llega ahí, así que al tocar en el móvil no se veía
  nada.
- **Qué se añade (en `@layer components`, detrás del CSS de HeroUI):**
  - `.tabs__tab[data-pressed="true"]` (sin elegir ni deshabilitada): `opacity: .7`,
    como su hover.
  - `.select__trigger[data-pressed="true"]`: `--field-hover` y
    `--field-border-hover`, como su hover (y `--select-trigger-bg-hover` en la
    variante `secondary`, que hoy no se usa).
  - `.accordion__trigger[data-pressed="true"]` (cerrado): la misma mezcla del 3 %
    de su hover (y `--default` en la variante `surface`, que hoy no se usa).
- **`[data-pressed]` y no `:active`:** lo pone React Aria mientras dura la
  pulsación (dedo, ratón o Intro/Espacio) y lo quita al soltar o al cancelar: no
  hay hover pegado. No depende de que el navegador aplique `:active` (iOS Safari
  no siempre lo hace). Las mismas exclusiones que su hover (pestaña elegida,
  acordeón abierto, deshabilitado).
- **La variante `hover` de `src/` también casa con `[data-pressed="true"]`.** El
  acordeón de Novedades no usa el hover de HeroUI sino `hover:bg-surface-hover`
  (utilidad, gana a `components`). Con la regla de arriba sola, al tocar se veía
  el 3 % de HeroUI y no su hover real. Se suma `&[data-pressed="true"]` a
  `@custom-variant hover` (D103): cualquier `hover:` puesto sobre un primitivo de
  React Aria se ve al tocar aunque `:active` no llegue. En elementos que no son de
  React Aria el atributo no existe y no cambia nada; en los que sí, coincide con
  `:active` en el tiempo.
- **Medido (emulación `mobile`, `matchMedia('(hover: hover)')` = `false`,
  `pointerdown` táctil y `pointercancel`):**

  | Elemento | Reposo | Pulsado | Tras soltar |
  |---|---|---|---|
  | Pestaña "Juego" (sin elegir) | opacidad 1 | **0,7** | 1 |
  | Disparador del `Select` "Qué practicar" | `--field` | **`--field-hover`** + borde `--field-border-hover` | `--field` |
  | Versión de Novedades (cerrada y abierta) | transparente | **`surface-hover`** (`#262238` en oscuro) | transparente |

- La pulsación táctil de las pestañas no las elige hasta soltar (React Aria), así
  que el estado pulsado sí llega a verse.

**Rama:** `fix/foco-transicion-y-pulsado`

_Contexto común de la unidad (antes `31-foco-transicion-pulsado.md`): en D129._
