# D019 · Logros · Siembra retroactiva de `activeDays`/`perfectSessions` desde `lastPracticeByCountry` y `lastReviewedAt` · Implementado

**Resumen:** Siembra retroactiva de `activeDays`/`perfectSessions` desde `lastPracticeByCountry` y `lastReviewedAt`: solo puede sub-contar, nunca sobre-contar

En la migración (`stats` ausente **o** `{}`, que es como llega el default
`'{}'::jsonb` de una columna nueva) se siembra:

- `activeDays` ← fechas de `lastPracticeByCountry` ∪ `review.lastReviewedAt`
  convertido con `getLocalDateString(new Date(iso))` — **nunca** `.slice(0,10)`,
  que metería el desfase UTC que ya arrastra `isDue`.
- `perfectSessions` ← número de dieces en `regionGameScores` (un 10 *es* la
  evidencia de una sesión sin fallos).

Ambas fuentes guardan **una sola fecha por país**, así que el conjunto sale ralo:
quien practicó sesenta días seguidos los mismos veinte países verá unos veinte
días sueltos. Son **falsos negativos, jamás falsos positivos** — una racha
histórica se subestima y "Un mes sin fallar" casi nunca se desbloqueará
retroactivamente. Por eso es seguro.

No sembrables (arrancan en 0): `totalSessions`, `totalAnswers`, `totalCorrect`,
`totalSkips`, `totalTimePlayedMs`.

_Contexto común de la unidad (antes `05-logros.md`): en D016._
