# D166 · Accesibilidad · `OptionTile` sin transición de ningún color del tema (queda `box-shadow, scale`) · Implementado

**Resumen:** `OptionTile` sin transición de ningún color del tema (queda `box-shadow, scale`): quitar solo `color` como D159 dejaba texto nuevo sobre fondo viejo (1,1:1) al cambiar de tema sin fotogramas; ahora 4,66:1 en claro y 6,74:1 en oscuro al instante

**Decisión:** `OptionTile` ya no anima ningún color del tema: su lista de transición pasa de `color, background-color, border-color, box-shadow, scale` a `box-shadow, scale` (misma duración y curva). El hover y la opción marcada cambian fondo, borde y texto al instante; la sombra del hover y el `scale` del pulsado siguen animados. API sin cambios
**Por qué:** Una transición solo avanza mientras la página pinta fotogramas; tras cambiar de tema (o de opción) con la pestaña o el panel sin pintar, se queda en `currentTime` 0 con su valor de partida (P31). Medido en el modal de configuración, pestaña sin `requestAnimationFrame`, cambiando `data-theme`: con `color` en la lista, texto y fondo se quedaban los dos en el tema viejo (≥6,74:1, coherente pero del tema anterior); quitando **solo** `color` como pedía P31 (D159), el texto pasaba al tema nuevo y el fondo no: **1,1:1** en claro, peor que antes. Sin ningún color en la lista: 4,66:1 en claro y 6,74:1 en oscuro al instante, sin transiciones en curso. Alternativa: suprimir todas las transiciones durante el cambio de tema desde `ThemeEffects` (arreglo global que conserva el fundido del hover, pero toca otro archivo y a todos los componentes)

**Rama:** `fix/tema-y-reloj`

## Contexto común de la unidad (antes `44-tema-y-reloj.md`)

> Arreglo, rama `fix/tema-y-reloj` (pendientes P28, P30, P31 y P32; tanda 2026-09-26 c).
> Toca `ui/OptionTile.tsx` (sin cambiar su API), `styles/heroui-theme.css`,
> `session/countries/CountriesPractice.tsx` y la sección "Lo que esto no cubre" de
> D147–D150 (P30, solo docs). Siguen valiendo D129, D132, D159 y D165.

### Verificado en el navegador (dev, puerto 4301, como invitado)

- D168: con la emulación en oscuro y `data-theme` quitado de `<html>`, los tokens de HeroUI
  (`--background` #14121f, `--accent` #9b8bff, `--field-background` #2b2740…) coinciden con los
  de la app (`--app-color-primary` #9b8bff); en claro sin `data-theme`, los dos en claro; con
  `data-theme="light"` y el sistema en oscuro, HeroUI sigue en claro. axe-core 4.10 sin
  violaciones en ese estado (portada y modal de configuración).
- D166: modal de configuración, pestaña "Juego" (16 `OptionTile`), pestaña sin fotogramas.
  Cambiando `data-theme` claro↔oscuro, contraste mínimo leído al instante: 4,66:1 en claro y
  6,74:1 en oscuro, sin transiciones en curso. axe limpio en claro y oscuro. Foco visible con
  Tab, sin scroll horizontal a 320 px.
- D167: sin probar en el navegador (cambiar la hora del sistema no se puede desde aquí); revisado
  en código: las tres lecturas del reloj usan `performance.now()`.

### Lo que esto no cubre

- `GameTypeToggle` (D159) tiene el mismo fallo que se evita aquí: conserva `background-color`
  en su transición y, tras cambiar de tema sin fotogramas, su texto va con el tema nuevo y el
  fondo con el viejo (1,14–1,25:1 medido). Otra unidad.
- Las tarjetas de continente usan `transition` de Tailwind (incluye `color` y
  `background-color`): mismo riesgo. Otra unidad; el arreglo global sería suprimir las
  transiciones durante el cambio de tema en `ThemeEffects`.
