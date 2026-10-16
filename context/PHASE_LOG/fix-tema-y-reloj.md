# fix/tema-y-reloj — Y1 (tanda 2026-09-26 c)

Slot `wt1`, puerto 4301. Pendientes P28, P30, P31, P32. Decisiones D166–D168
(`context/decisions/44-tema-y-reloj.md`). Changeset patch `.changeset/tema-y-reloj.md`.

## Hecho
- P28 (D167): `CountriesPractice.tsx` mide con `performance.now()` (inicio, pausa del modal de
  abandonar, `elapsedMs`). `finishedAt` sigue con `new Date()`.
- P31 (D166): `OptionTile` pasa a `transition-[box-shadow,scale]`. Quitar solo `color` (como
  pedía P31/D159) empeoraba el caso: medido 1,1:1 (texto del tema nuevo sobre fondo del viejo,
  pestaña sin fotogramas). Sin ningún color en la transición: 4,66:1 / 6,74:1 al instante.
  Cambio de sensación: el fondo del hover ya no se funde (la sombra sí).
- P32 (D168): bloque `@media (prefers-color-scheme: dark)` para `:root:not([data-theme])` en
  `heroui-theme.css`, valores duplicados del bloque oscuro.
- P30: "Lo que esto no cubre" de `decisions/37-ranking-podio.md` enlaza a
  `decisions/42-modales-ancho-320.md` (D162–D164).

## Verificado
- Navegador: tokens HeroUI = app sin `data-theme` (oscuro y claro); axe limpio (portada y modal
  de configuración, claro/oscuro/sistema oscuro sin `data-theme`); foco visible con Tab; 320 px
  sin scroll horizontal. Contraste de `OptionTile` tras cambiar de tema sin fotogramas.
- P28 solo en código (no se puede cambiar la hora del sistema desde el navegador).
- astro check 0 errores; biome limpio en los archivos tocados; 196 tests pasan; build ok.

## Visto fuera de la unidad (no arreglado)
- `GameTypeToggle` (D159) conserva `background-color` en su transición: tras cambiar de tema
  sin fotogramas da 1,14–1,25:1. Mismo arreglo que D166 o uno global en `ThemeEffects`.
- Tarjetas de continente con `transition` (todo, incluye colores): mismo riesgo.
- `Layout.astro` (comentario del script de tema) solo nombra `variables.css` como respaldo sin
  `data-theme`; ahora también es `heroui-theme.css`.
- `ThemeEffects` hace `localStorage.setItem` directo (fuera de `learning-storage.ts`) y sin
  try/catch: con `localStorage` bloqueado, ese efecto lanza.

## Copy
Sin copy nuevo.
