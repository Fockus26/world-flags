# 48 — Borde de los campos con 3:1 en tema claro

> Unidad `fix/borde-campos-contraste` (2026-09-28). Hallazgo 4 de "Hallazgos pre-existentes
> de QA" en `CURRENT_PHASE.md` (visto en D027, `decisions/06-ajustes-logros.md`). Cubre D174.

## D174 — `--field-border` claro = `#817bab`

`#9c96c4` (D005) daba 2,77:1 contra blanco, por debajo del 3:1 de WCAG 1.4.11 que su propio
comentario reclamaba; contra el relleno del campo (`#e2dff1`, D027) solo 2,12:1.

| Candidato | sobre `#fff` | sobre `background` `#f2f1f8` | sobre `field-background` `#e2dff1` |
|---|---|---|---|
| `#9c96c4` (antes) | 2,77 | 2,47 | 2,12 |
| `#857fb0` | 3,71 | 3,31 | 2,84 |
| **`#817bab`** | **3,92** | **3,49** | **3,00** |

Se elige el más claro que da ≥3:1 contra los tres: se mantiene la familia lila y el borde no
se vuelve protagonista. Oscuro sin cambios: `#6f6a94` da 3,39:1 sobre `surface` `#1b1930`.
El hover (`--field-border-hover`) lo deriva HeroUI del mismo token.
