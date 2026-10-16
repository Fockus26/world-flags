# feat/actualizacion-obligatoria (W1, P1) — 2026-09-24
PR #29 · versión 2.3.0 (MINOR) · D107–D111 · decisions/25-actualizacion-obligatoria.md
- sw.js con APP_VERSION = package.json, vigilado por tests/unit/sw-version.test.ts (D107).
- Tabla app_config (SQL en supabase/app-config.sql, SIN APLICAR), lectura en utils/app-config.ts, lógica pura en utils/min-version.ts (D108).
- useRequiredUpdate en FlagGame: al cargar y en visibilitychange; RequiredUpdateDialog (alertdialog no descartable, foco en "Actualizar"); SystemSnackbars desmontado mientras bloquea (D109, D111).
- Ante la duda no bloquea; solo una respuesta válida cambia el estado (D110).
- ui/Modal: prop nueva isKeyboardDismissDisabled (default false).
- useServiceWorkerUpdate: forceUpdate (update() → SKIP_WAITING → recarga, o recarga directa).
- Sin verificar en navegador: rama SKIP_WAITING (el navegador integrado no registra SW).
- Nota: cada PR que suba versión debe actualizar también APP_VERSION en public/sw.js (el test lo exige).
Acción manual: aplicar supabase/app-config.sql (el cliente funciona sin él).
