# fix/sync-concurrencia-sesion (W4, tanda 2026-10-20b) · D210

- Hallazgos QA funcional 2026-10-20: [Alto] 1 (subida retrasada pisa cambio más reciente), [Medio] 7 (token alterado → bucle "No se pudo sincronizar"), [Medio] 8 (logout en otra pestaña sin aviso).
- Subida condicionada a `updated_at` leído (UPDATE … WHERE updated_at = v; INSERT sin fila); conflicto → releer y fusionar (`src/utils/sync-attempts.ts`, máx. 3). Sin migración.
- Token rechazado (401/PGRST301-303): refresco una vez; si sigue, `signOut({scope:"local"})`.
- Cierre no pedido (otra pestaña, refresco fallido, forzado): `auth.endedUnexpectedly` + `SessionEndedSnackbar`; datos+base pendientes apartados (`savePendingAccountData`) y repuestos al volver a entrar con esa cuenta.
- Verificado: tests unitarios (orden invertido), Playwright con Supabase interceptado (.qa/w4-sync.mjs 18/18, .qa/w4-a11y.mjs axe 0, contraste ≥4.57:1, 320px sin scroll, teclado).
- Copy nuevo del aviso: pendiente de revisión del dueño.
