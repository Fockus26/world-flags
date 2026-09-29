# D054 · PWA · Precarga de las 197 banderas: la app manda la lista al SW (`PRECACHE_FLAGS`), que descarga una a una solo las que faltan · Implementado

**Resumen:** Precarga de las 197 banderas: la app manda la lista al SW (`PRECACHE_FLAGS`), que descarga una a una solo las que faltan; 5 s tras cargar y con `online`; nunca con ahorro de datos ni en 2G. ~3,1 MB una vez por dispositivo

Elegida por el dueño entre tres opciones (precargar / aviso + saltar /
dejarlo). Sin ella, practicar sin red un continente nunca abierto enseñaba
imágenes rotas.

- **Quién decide la lista:** la app, que conoce el catálogo
  (`utils/flag-precache.ts` → `getFlagUrls()`), la manda al service worker con
  `postMessage({ type: "PRECACHE_FLAGS", urls })`. Así `sw.js` no duplica los
  197 códigos. El SW solo acepta rutas `/flags/<código>.svg` (valida el
  mensaje aunque venga de la propia página).
- **Cómo descarga:** una a una, solo las que no están en caché (`cache.match`
  antes de `cache.add`). Idempotente: se pide en cada carga y, con todo ya
  guardado, no descarga nada. Si una falla (se fue la red), se para sin error
  y la siguiente vez sigue donde quedó.
- **Cuándo:** `FlagPrecacheEffects` la pide 5 s después de montar (la carga
  inicial va primero) y otra vez con `online`. Nunca con "ahorro de datos"
  (`navigator.connection.saveData`) ni en 2G; sin la Network Information API
  (Safari, Firefox) se precarga.
- **Coste:** ~3,1 MB una sola vez por dispositivo. Ojo: si algún día se sube
  `CACHE_NAME`, el `activate` borra la caché vieja y se vuelven a descargar.
- **Verificación:** `tests/unit/flag-precache.test.ts` (197 URLs únicas, todas
  existen en `public/flags` y pasan el filtro de `sw.js`; reglas de ahorro de
  datos) y el arnés aislado de `sw.js` (descarga solo lo que falta, ignora URLs
  ajenas, se para sin red y retoma). En el navegador embebido, con el service
  worker simulado (no registra SW reales, ver arriba), la app manda las 197 a
  los ~5 s y no manda nada con "ahorro de datos".

_Contexto común de la unidad (antes `14-modo-offline.md`): en D048._
