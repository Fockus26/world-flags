# D129 · Accesibilidad · `transition-colors` sin `outline-color`: regla `.transition-colors` · Implementado

**Resumen:** `transition-colors` sin `outline-color`: regla `.transition-colors` en `@layer utilities` de `global.css` que redefine solo `transition-property` (lista de Tailwind 4.3 menos `outline-color`). El anillo de foco ya no sale del color del texto. `@utility transition-colors` no sirve: se funde con la de Tailwind y gana la original. Los 10 consumidores no se tocan

- **Problema.** La utilidad `transition-colors` de Tailwind 4.3 anima `color,
  background-color, border-color, outline-color, text-decoration-color, fill,
  stroke` y los tres `--tw-gradient-*`. El color del contorno por defecto es
  `currentColor`: al enfocar con el teclado, el anillo (`focus-visible:outline-*`
  o `has-focus-visible:outline-*`) aparecía del color del texto y viraba a su
  color en 150–180 ms.
- **Arreglo global en `global.css`**, no en los 10 componentes que la usan
  (`ConnectivitySnackbar`, `AchievementToasts`, `AccountTab`, `AuthSection`,
  `CountryPickerModal`, `GameTypeToggle`, `RegionOption`, `UserSummary`, `Timer`,
  `ui/OptionTile`; W6 y W8 tocan algunos en esta tanda): una regla
  `.transition-colors` en `@layer utilities` que solo redefine
  `transition-property` con la misma lista menos `outline-color`. Curva y duración
  siguen saliendo de la utilidad original y de `duration-*`/`ease-*`.
- **Por qué no `@utility transition-colors`:** probado. Tailwind no sustituye la
  utilidad propia; funde las dos en una sola regla y la `transition-property`
  original queda detrás y gana. La regla en `@layer utilities` sale al final de
  la capa (comprobado en el CSS compilado: la generada en la posición ~427 k, la
  nuestra en ~446 k) y con la misma especificidad gana por orden.
- **Medido (navegador):** los 13 elementos `.transition-colors` de la pantalla
  de configuración tienen `transition-property` sin `outline-color`; cambiar su
  `outline-color` no crea ninguna transición (control: con la lista original sí
  crea una de `outline-color`). Al tabular a la opción de `GameTypeToggle`, el
  anillo sale ya en `--focus` sin animación y la duración sigue en 150 ms.
- **Fuera de alcance, a propósito:** `Avatar` usa
  `transition-[outline-color,transform,translate]`: ahí el contorno existe siempre
  (`outline-3`) y animar su color es el efecto de hover buscado. Los primitivos de
  HeroUI pintan su anillo con `box-shadow` (`focus-ring` = `ring-2 ring-focus`),
  no con `outline`, y sus `transition`/`transition-all` van en indicadores no
  enfocables: nada que tocar. Nadie en `src/` usa `transition` a secas ni
  `transition-all` sobre un elemento con anillo de `outline`.

**Rama:** `fix/foco-transicion-y-pulsado`

## Contexto común de la unidad (antes `31-foco-transicion-pulsado.md`)

> Unidad `fix/foco-transicion-y-pulsado` (tanda del 2026-09-24, W7). Cubre D129–D131.
> Pendientes P3, P4 y P6 de `context/plans/pendientes.md`. Sigue a
> D101–D104 (D101–D104).
