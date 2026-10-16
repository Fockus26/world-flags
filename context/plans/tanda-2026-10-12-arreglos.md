# Ola de arreglos — tras la tanda 2026-10-12

Requisito: #73, #74, #75, #76 mergeados (F2 toca lo de #76; F3 parte de D192 de #73). Comprobar con `gh pr view`.
Decisiones ya tomadas: sección "Decisiones del dueño 2026-10-12" de `pendientes.md`. Informes de QA:
`qa-tanda-`, `qa-design-`, `qa-a11y-`, `qa-seo-2026-10-12.md`. IDs de decisión: mirar `origin/main` (último usado D193).

| ID | Rama | Qué | Archivos | Salto |
|---|---|---|---|---|
| F1 | `fix/sesion-colgada-reencolado` | **P55 crítico**: última tarjeta reencolada sobre sí misma cuelga la sesión de Países | `CountriesPractice.tsx:162-166,246-248`, `practice-queue.ts:88`, test | patch |
| F2 | `fix/foco-perdido` | P51 (foco a body en lotes/Resultados, dos h1 en Resultados), P53 (AnswerForm), P54 (Todos/Ninguno), P50 bajo (`rounded-[0.25rem]` → token) | `Configuration.tsx`, `LearningPathPanel.tsx`, `Results.tsx`, `AnswerForm`, `CountryPickerModal.tsx` | patch |
| F3 | `fix/contraste-secondary-danger` | P48 (a), P52.1 (a), P52.2 (a) | `Button`/tokens, `ConfirmationModal.tsx:63`, `Results.tsx:174`, `COLORS.md` | patch |
| F4 | `fix/copy-lotes` | P49 "Lote N de M", P52.3 "Cancelar", P52.4 "Lote en marcha" + filas checklist | `Configuration.tsx:530`, `score.ts:50`/`Results.tsx`, cabecera de sesión | patch |
| F5 | `fix/seo-metadata` | P46 h1 estático (sin duplicar con el de React: coordinar con F2), P47.5–8, og-image recomprimida ≤300 KB, JSON-LD (`operatingSystem`, `image`), quitar `framer-motion` de `optimizeDeps` | `Layout.astro`, `index.astro`, `public/manifest*`, `astro.config.mjs` | patch |
| F6 | `fix/ranking-cache-bordes` | P56: petición de más al reabrir con caché vencida; modal suscrito a la invalidación | `LeaderboardModal.tsx`, `leaderboard-cache.ts` | patch |

**P58 (escalado por F3):** nota en claro falla AA → con F4 en la ola B, tras decisión del dueño (opciones en D196).

**Olas sugeridas** (decide la sesión con el código delante): A = F1, F3, F5, F6 (archivos disjuntos salvo `Results.tsx` de F3, una línea) · B = F2, F4 (comparten `Configuration.tsx`/`Results.tsx` con F3; sobre main ya actualizado). Tras cada ola, wave-qa.

**Bloquea la QA con sesión (dueño):** `supabase/` local con `config.toml`+migraciones (P42), `.env.test.local` con EMAIL_TEST/PASSWORD_TEST, Docker abierto.

**Entorno** (ver nota "Ola 2" en `orquestacion-2026-10-12.md` y `KIT_FEEDBACK.md` filas 5–20): servidor en slot poco fiable → build + `astro preview` o servir `dist/` estático; parar por PID; tests con `node:test`; axe desde cdnjs; tutorial visto con `world-flags-tutorial-seen=true`.

## Prompt de arranque

> Ola de arreglos tras la tanda 2026-10-12. Usa la skill orchestrate. Lee solo `context/plans/tanda-2026-10-12-arreglos.md`, `context/CURRENT_PHASE.md` y la sección "Decisiones del dueño 2026-10-12" de `context/plans/pendientes.md`. Comprueba que #73–#76 están mergeados y lanza la ola A (F1, F3, F5, F6).
