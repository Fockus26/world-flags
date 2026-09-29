# D051 · Persistencia · Cada subida es una sincronización (leer → fusionar con la base → subir si aporta), nunca un upsert a ciegas. Agrupadas · Implementado

**Resumen:** Cada subida es una sincronización (leer → fusionar con la base → subir si aporta), nunca un upsert a ciegas. Agrupadas: 5 s sin cambios, tope 60 s, adelantadas al ocultar la app / volver la red / cerrar sesión; reintentos 5/15/30/60 s. Hallazgo 1: ~60 upserts por sesión → ~5

- **Nada de upsert a ciegas.** Cada subida es `syncLearningData` (antes
  `syncOnLogin`): leer la fila → `mergeLearningData(remote, local, base)` →
  subir solo si aporta algo. Con dos dispositivos abiertos, lo del otro se
  incorpora en vez de pisarse (y aparece en pantalla). Lo cambiado mientras la
  subida está en vuelo se fusiona encima con la misma regla (base = lo que se
  mandó), sin perder nada.
- **Agrupadas:** tras un cambio se espera a que el usuario pare 5 s
  (`SYNC_IDLE_MS`), con un tope de 60 s desde el primer cambio sin subir
  (`SYNC_MAX_WAIT_MS`). Se adelantan al ocultar la app (`visibilitychange`,
  `pagehide`), al volver la red y al cerrar sesión. Esperar no arriesga nada:
  lo pendiente ya está en `localStorage` + base (D049).
- **Reintentos** tras un fallo: 5/15/30/60 s (como D044) y con `online`;
  mientras tanto los cambios nuevos no disparan peticiones.
- **Hallazgo 1, sí abordado:** en la prueba, 11 calificaciones y el final de
  una práctica de Centroamérica → 2 sincronizaciones (2 GET + 2 POST) en vez
  de 12 upserts. Una práctica de Europa (~60 calificaciones en 3–4 min) queda
  en unas 5 (una por minuto + la final): ~5 × (GET + POST) de ~50 KB ≈ 0,5 MB
  frente a ~3 MB, y 12 veces menos escrituras. Cada subida sigue llevando la
  fila entera.
- **Descartado por ahora:** `update` parcial de columnas. Una calificación
  cambia `country_history`, que es el grueso de la fila, así que ahorraría poco
  y exigiría diffs por columna. Siguiente paso posible: subida condicional
  (`update … where updated_at = <el último conocido>`), que se ahorra el GET
  cuando nadie más escribió.

_Contexto común de la unidad (antes `14-modo-offline.md`): en D048._
