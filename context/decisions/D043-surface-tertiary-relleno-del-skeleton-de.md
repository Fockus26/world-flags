# D043 · Tokens · `--surface-tertiary` (relleno del `Skeleton` de HeroUI) → `var(--app-color-surface-border)`: sin color nuevo, vira con el tema · Implementado

El `Skeleton` de HeroUI pinta con `--surface-tertiary` (al 70 %, brillo al
100 %), que el repo no puenteaba: quedaba el gris neutro de HeroUI, fuera de la
paleta lavanda. En `heroui-theme.css`: `--surface-tertiary:
var(--app-color-surface-border)` — **no es un color nuevo**, es el tono de los
bordes de tarjeta (`#e2dff1` claro / `#34304a` oscuro), y al ir por `var()`
vira solo con el tema. Aparte del Skeleton, ese token solo lo usan las
variantes "tertiary" de `Card`/`Surface` de HeroUI, que la app no usa.
Contraste del bloque contra la tarjeta ≈1,2:1 (del orden de otros skeletons
habituales): es decorativo, el estado de carga lo comunican `aria-busy` y el
anuncio.

_Contexto común de la unidad (antes `11-skeleton-carga.md`): en D042._
