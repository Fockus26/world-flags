# D178 · Tipografía · Escala en tokens `--text-*` de `theme.css` sin interlineado · Implementado

**Resumen:** Escala en tokens `--text-*` de `theme.css` sin interlineado (9 fijos: `micro` 0,625 … `display` 1,8 rem; 5 fluidos: `stat`, `stat-sm`, `score`, `session-title`, `capital`). Sustituye los 21 `text-[Xrem]` y 5 `text-[clamp()]` (±0,8 px como mucho). Fin de la excepción de tamaños arbitrarios

Había 21 tamaños arbitrarios (`text-[0.6rem]` … `text-[1.8rem]`, ~80 usos en 23 archivos) y 5
`text-[clamp(...)]`. Se agrupan en 9 tamaños fijos y 5 fluidos (tabla en `TYPOGRAPHY.md`).

- **Sin `--text-*--line-height`**: Tailwind v4 solo emite `font-size` (comprobado en el
  build: `.text-label{font-size:.85rem}`), igual que los `text-[Xrem]` que sustituye; el
  interlineado no cambia en ningún sitio. Por eso no se mapeó a `text-xs`/`sm`/… de
  Tailwind, que sí traen interlineado.
- Cada grupo toma un valor de su rango; la mayor diferencia es ±0,8 px (0,95 → 0,925 rem,
  1,45 → 1,4 rem, 1,35 → 1,4 rem) y 0,8 px en 1,75 → 1,8 rem.
- Nombres propios (`micro`, `tiny`, `caption`, `label`, `body-sm`, `number`, `heading-sm`,
  `heading`, `display`, `stat`, `stat-sm`, `score`, `session-title`, `capital`) para no pisar
  la escala de Tailwind; ninguno choca con un `--color-*`.
- Regla: cero `text-[Xrem]`; tamaño nuevo = token + fila en `TYPOGRAPHY.md` + decisión.
  Deja de valer la "excepción tolerada" de `CLAUDE.md`.

**Rama:** `refactor/escala-tipografica`

## Contexto común de la unidad (antes `51-escala-tipografica.md`)

> Unidad `refactor/escala-tipografica` (2026-09-28). Pendiente general de `CURRENT_PHASE.md`
> ("Consolidar la escala tipográfica en tokens"). Cubre D178.
