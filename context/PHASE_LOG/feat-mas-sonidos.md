# feat/mas-sonidos (W4, tanda 2026-09-26) — PR #39

P18 (solo lo recomendado): sonidos `select`, `start`, `skip`, `penalty` y `record` en `src/utils/sound.ts`.
Decisiones D143–D146 (`context/decisions/36-mas-sonidos.md`). Changeset minor (`.changeset/mas-sonidos.md`).

## Hecho
- `select` vía `src/hooks/useSelectSound.ts` en `OptionTile` (API igual), `GameTypeToggle` (las dos formas) y `RegionOption`. Limitador de 50 ms.
- `start` en `useGame.startGame` (éxito) y `startDailyPractice`.
- `skip` en `handleSkip` de `Session` y `CountriesPractice` (antes `incorrect`; D083 sustituido en ese punto).
- `penalty` en `applyPenalty` de `Session`, junto al fallo o salto (no en su lugar).
- `record` en `finishGame` cuando se mejora una marca previa; `CompetitiveGameResult.isNewRecord`; `Results` muestra "¡Nuevo récord!".
- Tests: `tests/unit/sound-table.test.ts`.

## Fila para CONTENT_CHECKLIST.md
| 47 | "¡Nuevo récord!" en los resultados de un rush (`Results.tsx`, D146) | Copy provisional; P19/W7 puede sustituirlo por la insignia | Pendiente de aprobación del dueño |

## Pendiente / para el dueño
- Escuchar los cinco sonidos (el agente no puede oír), sobre todo el golpe del castigo en el móvil.
- Bug fuera de la unidad: en tema "system" con el SO en oscuro, la opción marcada de `GameTypeToggle` (segmentado) da 2,44:1 (texto #f1eefc sobre #9b8bff) según axe al cargar; la variable `--btn-contained-fg` sí vale #14121f, pero el color calculado de la etiqueta no se recalcula (el mismo bug de Chrome que describe el comentario del componente, ahora con el tema del sistema).
