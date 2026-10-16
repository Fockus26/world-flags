# Tanda 2026-10-12 — brief común

Pedido del dueño (2026-10-12): arreglar "Aprender por lotes" (Caribe 3/10 sale completado),
área de clic del selector de países, caché del ranking, y pasar QA/a11y/diseño/SEO sobre el flujo.
Prompts por unidad: `orquestacion-2026-10-12-prompts.md`.

## Unidades

| ID | Rama | Qué | Archivos principales | Slot · puerto | Decisión | Checklist | Changeset |
|---|---|---|---|---|---|---|---|
| W1 | `fix/lotes-ya-sabido-nota-10` | "Ya sabido" = continente 10/10 + SM2 ≥2; recorridos existentes se recalculan | `src/utils/learning-path.ts`, `src/hooks/useGame.ts`, `tests/unit/learning-path.test.ts` | wt1 · 4301 | D189 (D186 ya era del #67) · PR #69 | — | patch |
| W2 | `fix/selector-paises-area-clic` | Cabecera de continente y opciones de país clicables en todo su área (sin padding muerto) | `src/components/game/configuration/CountryPickerModal.tsx` | wt2 · 4302 | D187 · PR #71 | — | patch |
| W3 | `perf/ranking-cache` | Caché en memoria de 60 s por scope; se invalida al subir una marca propia | `LeaderboardModal.tsx`, `src/utils/leaderboard-cache.ts` (nuevo), punto de subida | wt3 · 4303 | D188 · PR #70 | — | patch |

Ola 1 = W1–W3 en paralelo (no comparten archivos).

## QA de la ola (tras mergear W1–W3, cada una una tarea aparte, solo informe)

| ID | Agente | Alcance |
|---|---|---|
| Q1 | `wave-qa` | Funcional de punta a punta contra Supabase local: flujo de lotes (crear, jugar, día 2, completar, abandonar, recalculo), selector de países, ranking con caché |
| Q2 | `design-qa` | Pantallas del flujo de lotes (`LearningPathPanel`, `LearningPathModal`, resultados) + `CountryPickerModal` |
| Q3 | general-purpose con skill `a11y` (modo auditoría) | Mismo alcance: axe-core + checklist manual |
| Q4 | general-purpose con skill `seo` (modo auditoría) | Metadata/OG/robots/sitemap de `/` tras los cambios |

Críticos/altos → ola de arreglo. Medios/bajos → `plans/pendientes.md`.

## Reglas de la tanda

- Servidor de desarrollo: **autorizado**, cada worker en su puerto. Como invitado; sin iniciar sesión ni escribir datos reales.
- Sin cambios en la base (W1 no necesita SQL).
- Workers no editan `CURRENT_PHASE.md` ni `CONTENT_CHECKLIST.md`: su `PHASE_LOG/<rama>.md` o el informe.
- Nada de `version`, `CHANGELOG.md`, `APP_VERSION`. Changeset a mano, texto de jugador.
- SW cachea agresivo: desregistrar + borrar caches al verificar.
- Playwright con `node`.

## Ola 2 (2026-10-12, sobre main 88f2360 con #69–#71 mergeados)

Copy de la fila 50 aprobado. Pool ampliado a 8 slots.

| ID | Rama / agente | Qué | Slot · puerto | Decisión | Changeset |
|---|---|---|---|---|---|
| Q1 | `qa/tanda-2026-10-12` · `wave-qa` | QA funcional de #69–#71 contra Supabase local | wt1 · 4301 | — | — |
| Q2 | `qa/design-2026-10-12` · `design-qa` | QA de diseño del flujo de lotes + selector + ranking | wt2 · 4302 | — | — |
| Q3 | `qa/a11y-2026-10-12` · general-purpose + skill a11y | Auditoría a11y (solo informe) | wt3 · 4303 | — | — |
| Q4 | sin slot propio (lee `dist/` de wt3 o construye en wt4 si no está) · general-purpose + skill seo | Auditoría SEO (solo informe) | — | — | — |
| W4 | `feat/avatares-dado` | Botón dado/refrescar que muestra avatares nuevos | wt5 · 4305 | D190 · PR #74 | minor |
| W5 | `style/todos-ninguno-ancho` | "Todos"/"Ninguno" mismo ancho, más tenues (≥4,5:1) | wt6 · 4306 | D191 · PR #76 | patch |
| W6 | `fix/contraste-text-secondary` | P44 | wt7 · 4307 | D192 · PR #73 | patch |
| W7 | `fix/tutorial-escape` | P45 | wt4 · 4304 | D193 · PR #75 | patch |

Archivos: W5 solo `CountryPickerModal.tsx`; W6 NO toca `CountryPickerModal.tsx` ni `Avatar.tsx`; W4 `Avatar.tsx` (+ `utils/avatar.ts`); W7 `tutorial/`.
Nota de entorno para todos: el modal del tutorial tapa la página al cargar como invitado (cerrar con "Saltar tutorial"); Astro 7 dev escucha en `localhost`/[::1], primer request lento (timeouts 90 s), `waitUntil: "load"`; si `astro dev` no arranca, `bun run build` + `bunx astro preview --port <p>`. No hay `bun run shots`: capturas a `context/plans/shots-<ID>/` de la carpeta principal. No hay `test:related`: `bun test <archivo>`.
