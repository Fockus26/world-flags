# fix/auth-errores-invitado · W6 tanda 2026-10-20b · PR #112 · D212

- Errores de auth por `error.code` → español (`src/utils/auth-errors.ts`); desconocido → genérico.
- Registro con correo existente (ofuscado o 422) → "Revisa tu correo" + pista neutra.
- Contraseña nueva: no solo espacios, ≤72 bytes (solo en registro).
- Aviso al invitado cuando D056 descarta su progreso (solo si tenía progreso): `sync.guestProgressDiscarded` + `GuestProgressDiscardedSnackbar`.
- Foco tras login a "Sesión iniciada como…"; Escape cierra a la primera.
- `config.toml` ya tenía `enable_confirmations = true` (D095); `qa-local.ts` confirma por admin API. Sin cambios.
- Copy provisional para CONTENT_CHECKLIST: mensajes de `auth-errors.ts`, pista en `EmailConfirmationPending`, texto del aviso al invitado.
- Verificado: Playwright con Supabase interceptado, axe 0 claro/oscuro, 1280/320. No verificado: Supabase local de punta a punta, Google real.
