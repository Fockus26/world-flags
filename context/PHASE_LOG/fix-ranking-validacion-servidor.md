# fix/ranking-validacion-servidor (W2, tanda 2026-09-24) — P5 + aviso 3 de P1
- PR #26, versión 2.2.1 (PATCH). Decisiones D112–D114 (decisions/26-ranking-validacion.md).
- SQL: supabase/leaderboard-validacion.sql — trigger before insert/update, PT422, mínimo
  197 × 300 ms = 59 100 ms en countries:world, flags:world@2, capitals:world@2. SIN APLICAR.
  Comprobación en seco (MCP, solo select): 0 filas rechazables (2 filas en total).
- Cliente: upsertLeaderboardEntry → "uploaded" | "failed" | "rejected"; GameEffects no
  reintenta "rejected" (antes reintentaba con cada cambio de learningData).
- Test: tests/unit/leaderboard-validation.test.ts (catálogo, ritmo inhumano, SQL local si existe).
- CONTENT_CHECKLIST #36: entrada 2.2.1 del CHANGELOG (copy provisional).
- Pendiente: el dueño aplica el SQL antes de mergear; probar el 422 con una cuenta de prueba.
