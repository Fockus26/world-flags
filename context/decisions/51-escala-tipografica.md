# 51 — Escala tipográfica en tokens

> Unidad `refactor/escala-tipografica` (2026-09-28). Pendiente general de `CURRENT_PHASE.md`
> ("Consolidar la escala tipográfica en tokens"). Cubre D178.

## D178 — 14 tokens `--text-*` en `theme.css`

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
