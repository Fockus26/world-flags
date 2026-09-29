# D048 · Persistencia · `countryHistory` se fusiona por la revisión más reciente de cada país · Implementado

**Resumen:** `countryHistory` se fusiona por la revisión más reciente de cada país (`pickMoreRecentReview`), entre datos de la misma cuenta, en los dos juegos. Sustituye a D046 (`applyReviewsSince` eliminada)

`mergeCountryHistory` aplica `pickMoreRecentReview` país por país, en los dos
juegos (Banderas en el primer nivel y `countriesGame`, D028/D029). Cada
revisión SRS trae su `lastReviewedAt`, así que es un registro "gana el último"
con marca de tiempo propia: idempotente, sin duplicar nada y sin depender de
qué lado llegue antes. Empate → lo remoto. Países de un solo lado se conservan,
incluidos los códigos fuera del catálogo (D040).

- **Sustituye a D046** (`applyReviewsSince` se elimina): lo que hacía queda
  incluido, sin la ventana de `since`.
- Solo entre datos de la misma cuenta. La primera versión también la aplicaba
  al entrar un invitado en una cuenta con progreso; **el dueño lo cambió
  (D056): lo del invitado se descarta entero**.

## Contexto común de la unidad (antes `14-modo-offline.md`)

> Unidad `feat/modo-offline`. Depende de PR #8 (`feat/skeleton-carga`, estado
> `local`) y de PR #9 (`fix/sync-fallida-sin-subida`, D044–D046), ya en `main`.
> Hallazgos de partida: `context/CURRENT_PHASE.md` › "Hallazgos
> pre-existentes" 1 (la fila entera en cada cambio) y 2 (`pickMoreRecentReview`
> sin usar).

### El problema

Las acciones del juego ya escribían en `localStorage` aunque hubiera cuenta,
así que lo jugado sin conexión no se perdía en el disco: **se perdía en el
merge**. `mergeLearningData` daba la razón a la nube en `countryHistory`,
`regionGameScores`, el perfil y la última configuración, y la próxima
sincronización (al recargar, o al volver la red) borraba lo practicado sin red.
D046 lo evitaba solo para lo revisado *después* del primer intento de la carga
actual: una sesión offline antes de recargar seguía perdiéndose, y
`regionGameScores`/perfil/configuración cedían siempre.

Además:

- `GameEffects` hacía `void pushLearningData(...)` cada 800 ms tras un cambio:
  sin red, una promesa rechazada sin manejar y el cambio perdido en silencio
  (hasta el siguiente cambio). Sin reintento ni cola.
- Cada subida era un **upsert a ciegas de la fila entera**: con dos
  dispositivos abiertos, el último en subir pisaba lo del otro.
- ~60 upserts por sesión de Europa (~2–3 MB en datos móviles; hallazgo 1).
- `sw.js` respondía a un GET cross-origin fallido (Supabase, dicebear) con la
  página offline: HTML con 200. La app no podía saber que estaba sin conexión.
- `signOut()` de supabase-js 2.112 borra la sesión local aunque no haya red;
  `GameEffects` limpia entonces `localStorage` (D009): cerrar sesión sin red
  borraba lo jugado sin subir, sin avisar.
