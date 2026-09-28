# Decisiones — Tema del sistema en HeroUI, `OptionTile` sin transición de `color` y reloj de la práctica de Países

> Arreglo, rama `fix/tema-y-reloj` (pendientes P28, P30, P31 y P32; tanda 2026-09-26 c).
> Toca `ui/OptionTile.tsx` (sin cambiar su API), `styles/heroui-theme.css`,
> `session/countries/CountriesPractice.tsx` y la sección "Lo que esto no cubre" de
> `decisions/37-ranking-podio.md` (P30, solo docs). Siguen valiendo D129, D132, D159 y D165.

| ID | Decisión | Razón | Estado |
|---|---|---|---|
| D166 | `OptionTile` ya no anima ningún color del tema: su lista de transición pasa de `color, background-color, border-color, box-shadow, scale` a `box-shadow, scale` (misma duración y curva). El hover y la opción marcada cambian fondo, borde y texto al instante; la sombra del hover y el `scale` del pulsado siguen animados. API sin cambios | Una transición solo avanza mientras la página pinta fotogramas; tras cambiar de tema (o de opción) con la pestaña o el panel sin pintar, se queda en `currentTime` 0 con su valor de partida (P31). Medido en el modal de configuración, pestaña sin `requestAnimationFrame`, cambiando `data-theme`: con `color` en la lista, texto y fondo se quedaban los dos en el tema viejo (≥6,74:1, coherente pero del tema anterior); quitando **solo** `color` como pedía P31 (D159), el texto pasaba al tema nuevo y el fondo no: **1,1:1** en claro, peor que antes. Sin ningún color en la lista: 4,66:1 en claro y 6,74:1 en oscuro al instante, sin transiciones en curso. Alternativa: suprimir todas las transiciones durante el cambio de tema desde `ThemeEffects` (arreglo global que conserva el fundido del hover, pero toca otro archivo y a todos los componentes) | Implementado (`fix/tema-y-reloj`) |
| D167 | La práctica de Países mide con `performance.now()`: el inicio (al montar), la pausa del modal de abandonar y `elapsedMs` al terminar. `finishedAt` sigue siendo fecha real (`new Date()`) | Como `Session` (D132) y `DailyPractice` (D165): `performance.now()` es monótono y un cambio de hora del sistema a mitad de la práctica ya no da un tiempo negativo o de horas. Las tres lecturas usan el mismo reloj, así que las restas siguen cuadrando; en condiciones normales el tiempo final es el mismo. Alternativa: `useRef(performance.now())` como D165; se dejó el `useEffect` con `null` inicial para tocar solo el reloj | Implementado (`fix/tema-y-reloj`) |
| D168 | `heroui-theme.css` suma, dentro de `@layer theme`, un `@media (prefers-color-scheme: dark)` para `:root:not([data-theme])` con los mismos valores que su bloque oscuro, igual que `variables.css`. Los valores quedan duplicados (CSS no deja poner un `@media` en una lista de selectores); un comentario pide cambiar los dos a la vez | Si `localStorage` falla, el script bloqueante de `Layout.astro` deja `<html>` sin `data-theme` hasta que `ThemeEffects` lo pone: `variables.css` ya seguía al sistema y la app salía en oscuro, pero HeroUI (botones, campos, modales) iba en claro. Especificidad: `:root:not([data-theme])` (0,2,0) gana a `:root` (0,1,0), así que no hace falta orden especial. Alternativa: variables intermedias `--wf-dark-*` referenciadas desde los dos bloques (sin duplicar, pero añade una capa de indirección a un archivo que hoy es plano) | Implementado (`fix/tema-y-reloj`) |

## Verificado en el navegador (dev, puerto 4301, como invitado)

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

## Lo que esto no cubre

- `GameTypeToggle` (D159) tiene el mismo fallo que se evita aquí: conserva `background-color`
  en su transición y, tras cambiar de tema sin fotogramas, su texto va con el tema nuevo y el
  fondo con el viejo (1,14–1,25:1 medido). Otra unidad.
- Las tarjetas de continente usan `transition` de Tailwind (incluye `color` y
  `background-color`): mismo riesgo. Otra unidad; el arreglo global sería suprimir las
  transiciones durante el cambio de tema en `ThemeEffects`.
