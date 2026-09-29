# D147 · Tokens · `--app-color-medal-{gold,silver,bronze}` (+ `-soft`) en claro y oscuro, puente `--color-medal-*` · Implementado

**Resumen:** `--app-color-medal-{gold,silver,bronze}` (+ `-soft`) en claro y oscuro, puente `--color-medal-*`. Cada tono ≥4,5:1 como texto sobre su `-soft` (también con hover), sobre el modal y sobre `primary-soft`

**Decisión:** Tokens `--app-color-medal-{gold,silver,bronze}` y su `-soft` en claro y oscuro, expuestos como `--color-medal-*` (`bg-medal-gold-soft`, `text-medal-gold`, `ring-medal-gold`…). Claro: oro `#835600`/`#fcefc7`, plata `#545d6e`/`#e9edf3`, bronce `#8f481e`/`#f9e4d6`. Oscuro: oro `#f2c94c`/`#3a3015`, plata `#c5ccd8`/`#2c2f3d`, bronce `#eba273`/`#3e2619`. Contraste medido en el navegador (tono de medalla como texto): claro 5,56 / 5,64 / 5,49:1 sobre su `-soft` y 4,89 / 4,96 / 4,81:1 con el hover encima; oscuro 8,20 / 8,22 / 6,65:1 (7,06 / 7,09 / 5,77:1 con hover). Contra el fondo del modal y contra `primary-soft` (tu fila), ≥5,4:1 en claro y ≥6,6:1 en oscuro. El texto normal sobre los `-soft` da ≥11:1
**Por qué:** `COLORS.md` no tenía oro/plata/bronce y `warning` (#d97a13, "Difícil") no da 4,5:1 como texto en claro. Con los tonos a ≥4,5:1 incluso con hover, un mismo token sirve de texto, icono y borde sin casos especiales

**Rama:** `style/ranking-podio`

## Contexto común de la unidad (antes `37-ranking-podio.md`)

> Estilo, rama `style/ranking-podio` (pendiente P21, tanda 2026-09-26). Todo en
> `LeaderboardModal.tsx`, más los tokens de medalla (`variables.css`, `theme.css`).
> Hover solo visual decidido por el dueño (brief de la tanda).

### Demo

`leaderboard-demo.ts` (solo dev, D117) suma dos opciones: `podio` (tu fila en el
puesto 2) y `lejos` (tu fila en el puesto 123; sin número, 150 personas). El número
de personas acepta hasta 200. Sin opciones nuevas, la demo sale igual que antes.

### Lo que esto no cubre

Las dos cosas que quedaron abiertas aquí ya están resueltas en
D162–D164:

- A 320 px, con tu puesto de tres cifras bajo el separador, al nombre de tu fila le
  quedaban ~19 px. Resuelto por D163: bajo `sm` el tiempo va debajo del nombre (107 px
  para el nombre de tu fila), y D164 iguala el skeleton.
- `CountryPickerModal` tenía el mismo tope de 28 rem sin `max-w-none`, así que su
  `34rem` no se aplicaba. Resuelto por D162.
