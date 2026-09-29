# D108 · Datos · Versión mínima fuera del bundle: tabla `public.app_config` clave/valor · Implementado

**Resumen:** Versión mínima fuera del bundle: tabla `public.app_config` clave/valor (`min_version = '2.0.0'`), RLS de solo lectura para `anon`/`authenticated`, se edita desde el dashboard. Lectura en `utils/app-config.ts`; lógica pura en `utils/min-version.ts` (reusa `compareVersions`)

Tabla `app_config (key text primary key, value text, updated_at)`, una fila
`min_version = '2.0.0'`. RLS con `select` para `anon` y `authenticated` y sin
políticas de escritura (más `revoke` de insert/update/delete): se cambia desde
el dashboard sin desplegar. Clave/valor y no una fila con columnas para no
necesitar otra migración con el próximo ajuste. SQL en
`supabase/app-config.sql` (local, no se aplica en esta unidad).

La lectura va en un archivo nuevo, `src/utils/app-config.ts` (no en
`cloud-storage.ts`): no hay cuenta ni progreso, y un fallo no se clasifica.
La lógica pura (validar y comparar versiones) va aparte, en
`src/utils/min-version.ts`, para que `tests/unit` la pruebe sin importar el
cliente de Supabase. La comparación reutiliza `compareVersions` del changelog
(número a número: 2.10.0 > 2.9.0).

Descartado: un `/min-version.json` servido por red por el SW. Obliga a
desplegar para cambiarlo y a tocar la estrategia de caché de `sw.js`.

**Rama:** `feat/actualizacion-obligatoria`

_Contexto común de la unidad (antes `25-actualizacion-obligatoria.md`): en D107._
