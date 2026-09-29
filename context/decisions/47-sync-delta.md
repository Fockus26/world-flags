# 47 — La sincronización sube solo las columnas que cambiaron

> Unidad `perf/sync-columnas-cambiadas` (2026-09-28). Hallazgo 1 de "Hallazgos
> pre-existentes de QA" en `CURRENT_PHASE.md` (unidad de logros). Cubre D173.

## D173 — Upsert con el delta de columnas

La frecuencia ya estaba resuelta (D051: cola con 5 s sin cambios y 60 s como mucho), pero
cada subida mandaba la fila entera de `user_learning_data` (~50–80 KB con logros, estadísticas
e historial), aunque solo hubiera cambiado `country_history`.

- `runSync` ya lee la fila antes de subir (D051): `pushLearningData(userId, data, remote)`
  compara columna a columna (`pickChangedColumns`, `src/utils/learning-data-row.ts`) y solo
  manda las distintas, más `user_id` y `updated_at`.
- Sin fila previa (`remote === null`) va la fila entera: es un INSERT y las columnas
  `not null` necesitan valor.
- Es seguro porque el upsert de PostgREST (`merge-duplicates`) solo actualiza las columnas
  del payload; es la misma propiedad que ya usaba D028 (un cliente viejo no manda la
  columna de un juego que no conoce).
- La comparación es contra el remoto **normalizado**: si una fila vieja tiene una columna
  en `null` y el normalizador la rellena igual que lo local, no se sube; cada lectura la
  vuelve a normalizar igual, así que no cambia nada para quien juega.
