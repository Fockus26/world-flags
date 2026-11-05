# D229 · PWA · Precarga de banderas en paralelo, con límite de espera y reintentos; la partida pide primero las siguientes · Implementado

**Ajusta D054** (cómo y cuándo se descarga; lo demás sigue igual: la lista la manda la app, solo `/flags/<código>.svg`, nunca con ahorro de datos ni en 2G, `CACHE_NAME` sin tocar).

**Decisión:**

- **Cómo descarga (`public/sw.js`):** 5 a la vez, cada una con 8 s de límite (`AbortController`, también para el cuerpo). Un fallo no para el resto: vuelve a la cola y se reintenta en otra pasada tras una espera creciente (2, 4, 8, 15 y 30 s; vuelve a 2 s si la pasada avanzó). Con 10 fallos seguidos la pasada se corta: la red no responde y no se gasta un límite de espera por bandera. Una sola precarga a la vez: los mensajes nuevos se suman a la que corre. Dura como mucho 4 min; lo que falte sigue con el siguiente mensaje.
- **Prioridad:** el mensaje `PRECACHE_FLAGS` acepta `priority` (mismas reglas de URL). Esas banderas pasan delante de la cola, también con una precarga en marcha.
- **Cuándo:** además de 5 s tras cargar y con `online`, al volver a la pestaña (`visibilitychange`) y en cada partida de Banderas: al empezar y cada vez que avanza, `useUpcomingFlagPrecache` pide la bandera en pantalla y las 3 siguientes (`Session` y `DailyPractice`). Así una precarga a medias se retoma jugando, sin recargar.
- **Almacenamiento persistente:** `navigator.storage.persist()` solo con la app instalada (`display-mode: standalone`). En una pestaña normal Firefox sacaría un aviso de permiso.

**Por qué:** con Chromium real contra producción (`.qa/flag-cache-probe.mjs`, 2026-11-05), una red que se colgaba desde la 10.ª bandera dejaba la precarga en 10/197 para siempre, aunque la red volviera sin evento `online`; un solo fallo puntual la dejaba en 9/197 hasta recargar. La causa: descarga en serie, sin límite de espera y con `return` en el primer fallo. Es la causa más probable de las banderas que no cargan al dueño (no probado en su dispositivo).

**Alternativa descartada:** precargar las siguientes con `new Image()` desde la página (sin límite de espera ni reintento: con la red colgada se queda igual) y reintentar con un temporizador fijo desde la página (gasta batería y no sabe qué falta; el SW sí).

**Verificación:** `tests/unit/sw-precache.test.ts` carga `sw.js` con caché y red simuladas: buena red (197, en paralelo, ≤ 5 a la vez), fallo puntual, red colgada que vuelve, prioridad con la precarga en marcha, filtro de URLs, y que sin red termina en su tiempo máximo. La sonda contra el build local da 197/197 en los casos colgada y fallo puntual.
