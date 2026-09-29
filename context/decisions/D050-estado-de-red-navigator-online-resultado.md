# D050 · Persistencia · Estado de red = `navigator.onLine` + resultado real (`CloudRequestError` `network`/`server`) · Implementado

**Resumen:** Estado de red = `navigator.onLine` + resultado real (`CloudRequestError` `network`/`server`); `online` con cuenta se confirma sincronizando; fallo inmediato si el navegador dice offline. Slice efímero `sync`. Ranking reintenta tras la siguiente sync buena. `sw.js` deja pasar los GET cross-origin (`CACHE_NAME` sigue en `v4`)

- `NetworkEffects` sigue `navigator.onLine` y sus eventos. `offline` se cree al
  momento. `online` no se cree a ciegas (miente con wifi sin salida a
  internet o con portal cautivo): con cuenta pide una sincronización y su
  resultado decide; sin cuenta se acepta.
- `cloud-storage.ts` clasifica cada fallo en `CloudRequestError` con `kind`:
  `network` (sin respuesta: `status` 0 de postgrest, tope de 10 s, o
  `navigator.onLine` falso) o `server` (500, permisos, esquema). Sin red no se
  registra error en consola: es un estado esperado que la UI comunica.
- `syncLearningData` **falla al instante** si `navigator.onLine` es falso
  (cuando dice "sin red", acierta). Si no, el GET esperaría a los reintentos de
  postgrest (1 + 2 + 4 s): abrir la app sin conexión dejaba ~7 s de skeleton.
- Slice efímero `sync` (`connectivity`, `hasPendingChanges`, `hasServerError`,
  `lastSyncedAt`, `syncRequestId`) + `useSyncStatus()` para la UI.
- **Ranking:** una marca batida sin conexión ya no se pierde para el ranking.
  `upsertLeaderboardEntry` devuelve si subió; si no, se reintenta tras la
  siguiente sincronización buena (`lastSyncedAt`), y no se intenta sin red.
- **`sw.js`:** los GET de otros orígenes (Supabase, dicebear, Google Fonts) ya
  no pasan por el service worker: nunca se cacheaban, y la página offline como
  respuesta tapaba el fallo de red. Un recurso propio sin caché y sin red
  (una bandera nunca vista) falla con `Response.error()` en vez de recibir el
  HTML de la app. `CACHE_NAME` sigue en `v4`: los assets cacheados siguen
  valiendo; el cambio de bytes de `sw.js` basta para que el navegador instale
  el nuevo y ofrezca "Actualizar". Hasta entonces, el SW viejo sigue
  devolviendo HTML: `toCloudRequestError` lo desempata con `navigator.onLine`.

_Contexto común de la unidad (antes `14-modo-offline.md`): en D048._
