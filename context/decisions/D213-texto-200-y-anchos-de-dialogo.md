# D213 · A11y / Tokens · Sin scroll horizontal con el texto al 200 % y anchos de diálogo en tokens · Implementado

**Resumen:** con el tamaño de letra del navegador al 200 % (32 px) y un viewport de 320 px, la página medía 640 px y había scroll horizontal (WCAG 1.4.4/1.4.10). La causa era `html { min-width: 20rem }`: en rem crece con la letra. Se quita; a 320 px con la letra normal no cambia nada (20rem = 320 px = el viewport) y por debajo de 320 la página ya no se recorta.

La sesión también desbordaba: sus rejillas (`Session`, `DailyPractice`, el formulario de respuesta y los dos del tablero de Países) tenían la columna implícita `auto`, que toma el ancho intrínseco del `<input>` (414 px con la letra al 200 %). Llevan `grid-cols-1` (`minmax(0,1fr)`). Los botones "Comprobar"/"Saltar" siguen en `2fr 1fr`, pero el formulario es `@container` y con `@max-3xs:grid-cols-1` se apilan cuando el formulario mide menos de 16rem: en rem, el umbral crece con la letra (a 320 px apilados solo con el texto al 200 %; con letra normal, en fila como antes).

Los anchos mágicos de modales, avisos y sesiones pasan a tokens `--container-*` en `theme.css` (patrón de D208), con el mismo ancho que ya se veía:
- `--container-dialog-sm: min(24rem, 92vw)` — `RequiredUpdateDialog`.
- `--container-dialog: min(28rem, 92vw)` — `ConfigurationModal` y `ReleaseNotesModal`. Pedían 30 y 32rem, pero el `max-w-md` (28rem) de HeroUI los recortaba: medido a 1280 px, 448 px antes y después.
- `--container-dialog-wide: min(34rem, 92vw)` — `CountryPickerModal` y `LeaderboardModal`.
- `--container-dialog-xl: min(58rem, 94vw)` — `AchievementsModal` y los pasos del tutorial.
- `--container-toast: min(22rem, 100vw - 1.5rem)` — `SystemSnackbars` y `AchievementToasts`.
- `--container-session: 58rem` — las cuatro sesiones, como `w-full max-w-session`, y el tope del diálogo del tutorial mientras se juega.

Los de diálogo llevan el `min()` dentro del token (`w-dialog`) en vez de `w-[92vw] max-w-dialog`: así no queda ningún `vw` suelto en las clases y cada diálogo conserva exactamente su ancho.

**Alternativas descartadas:** `min-width: 320px` en px (no crece con la letra, pero no aporta nada: el diseño ya funciona a 320 y por debajo recortaba); subir `Configuración`/`Novedades` a los 30/32rem que pedían el código (cambio visible que nadie pidió); `flex-wrap` con `flex-2`/`flex-1` en los botones (por el padding no da el 2:1 exacto: 573/305 px en vez de 585/293 a 1280).
**Fuera de alcance (informado):** dentro de los modales, con el texto al 200 % a 320 px (equivale a 160 px CSS) la cabecera de Configuración, sus pestañas y algunos botones de cerrar quedan fuera del diálogo; a 640 px con el texto al 200 % (equivale a 320 px CSS) no hay desborde.
**Rama:** `fix/anchos-texto-200`
