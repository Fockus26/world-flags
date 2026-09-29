# D049 · Persistencia · Base de sincronización por cuenta en `localStorage` (lo último que el dispositivo sabe que está en la nube) · Implementado

**Resumen:** Base de sincronización por cuenta en `localStorage` (lo último que el dispositivo sabe que está en la nube). Datos + base = la cola persistida. Para perfil, configuración y notas sin fecha (anteriores a D055): gana lo local solo si difiere de la base

El perfil, la última configuración y las tres últimas notas de cada continente
(`regionGameScores`, por juego) **no tienen marca de tiempo**: mirando solo los
dos valores no se sabe cuál es más nuevo. La referencia es la **base de
sincronización**: lo último que este dispositivo sabe que está en la nube para
esa cuenta (`getSyncBase`/`saveSyncBase`, clave propia en `localStorage`, con
el `userId`; nunca se sube).

Para esos campos, cuando no hay fechas (datos anteriores a D055, o escritos
por un cliente viejo), `mergeLearningData(remote, local, base)` decide:

| Caso | Gana |
|---|---|
| `local` igual a la base (este dispositivo no lo tocó) | lo remoto — trae los cambios de otro dispositivo |
| `local` distinto de la base (cambio de aquí aún no subido) | lo local |

Con fechas en los dos lados, gana la más reciente (D055). Sin base (entra un
invitado) no se fusiona nada (D056).

- **La base es la cola persistida.** "Cambios pendientes" = datos locales
  distintos de la base. Los dos viven en `localStorage`, así que sobreviven a
  recargar o cerrar la app sin red; al volver se fusionan y suben. No hace
  falta un log de operaciones aparte.
- Se guarda **siempre junto a los datos**, en la misma tarea (hidratación y
  cada sincronización buena): tienen que ser una pareja coherente. Si no se
  puede escribir (cuota), se borra la vieja: sin base, la fusión cae a "gana lo
  remoto", que no inventa cambios; una base vieja haría pasar lo que trajo la
  nube por cambios locales. Por eso ahora `GameEffects` sí persiste los datos
  hidratados de la cuenta (antes no lo hacía, pero las acciones del juego ya los
  escribían; el logout los sigue borrando, D009).
- **Cuenta que nunca pudo sincronizar aquí** (primer login con la red caída):
  no hay base; se juega sobre los datos del invitado en `local`. Al
  recuperarse, pasan a la cuenta solo si ésta no tiene progreso (D056). La
  primera versión guardaba lo local como base provisional; se retiró con D056.
- Idempotente con la misma base: `merge(merge(r, l, b), l, b)` =
  `merge(r, l, b)`. Contadores de `stats`, igual que siempre: `max` con el
  derivado del historial fusionado, nunca suma (D020). Un merge de tres vías
  con suma (`r + l − b`) sería exacto con dos dispositivos, pero rompe la
  idempotencia en cuanto un reintento repite la fusión con la misma base.
- **Mismo campo en los dos dispositivos:** con solo la base, ganaba el que
  sincroniza (en la prueba pasó con la configuración). Desde D055 gana el
  cambio más reciente; la base queda para datos sin fecha.
- **Alternativa descartada:** log de operaciones reaplicado sobre la nube
  (preciso, pero cada acción del juego tendría que emitir operaciones y la nube
  tendría que recordar cuáles aplicó para no duplicarlas). Las marcas de tiempo
  por campo se descartaron al principio por la migración; el dueño la aceptó
  después → D055.
- **Límite conocido (varias pestañas):** cada pestaña usa su base en memoria
  en sus sincronizaciones, pero `localStorage` es compartido; una recarga
  puede emparejar datos de una pestaña con la base de otra. Ya antes varias
  pestañas se pisaban `localStorage`.

_Contexto común de la unidad (antes `14-modo-offline.md`): en D048._
