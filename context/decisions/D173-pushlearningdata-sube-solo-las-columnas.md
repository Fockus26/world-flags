# D173 · Sincronización · `pushLearningData` sube solo las columnas que difieren de la fila remota recién leída · Implementado

**Resumen:** `pushLearningData` sube solo las columnas que difieren de la fila remota recién leída (`pickChangedColumns`, `learning-data-row.ts`) con `UPDATE … WHERE user_id`; sin fila, upsert entero. Un upsert parcial falla por los `not null` (23502), corregido en `fix/sync-update-parcial`

La frecuencia ya estaba resuelta (D051: cola con 5 s sin cambios y 60 s como mucho), pero
cada subida mandaba la fila entera de `user_learning_data` (~50–80 KB con logros, estadísticas
e historial), aunque solo hubiera cambiado `country_history`.

- `runSync` ya lee la fila antes de subir (D051): `pushLearningData(userId, data, remote)`
  compara columna a columna (`pickChangedColumns`, `src/utils/learning-data-row.ts`) y solo
  manda las distintas, más `user_id` y `updated_at`.
- Con fila previa se sube con **`UPDATE … WHERE user_id`** (solo esas columnas). Sin fila
  (`remote === null`), upsert de la fila entera: es un INSERT y las columnas `not null`
  necesitan valor.
- **Corrección (2026-09-28, `fix/sync-update-parcial`):** la primera versión (#53) mandaba
  el delta por **upsert**, y en producción fallaba siempre con `23502 null value in column
  "profile"`: Postgres comprueba los `not null` sobre la fila que *insertaría* antes de
  resolver el `ON CONFLICT`, así que un upsert parcial no sirve aunque la fila exista (D028
  funcionaba porque ese upsert sí llevaba todas las columnas `not null`). Ninguna subida
  llegaba a la nube y la app mostraba "No se pudo sincronizar"; lo local no se perdió.
- Si la fila se borrara entre la lectura y el UPDATE, este no toca nada; la sync siguiente
  lee `null` y sube la fila entera.
- La comparación es contra el remoto **normalizado**: si una fila vieja tiene una columna
  en `null` y el normalizador la rellena igual que lo local, no se sube; cada lectura la
  vuelve a normalizar igual, así que no cambia nada para quien juega.

**Rama:** `perf/sync-columnas-cambiadas`

## Contexto común de la unidad (antes `47-sync-delta.md`)

> Unidad `perf/sync-columnas-cambiadas` (2026-09-28). Hallazgo 1 de "Hallazgos
> pre-existentes de QA" en `CURRENT_PHASE.md` (unidad de logros). Cubre D173.
