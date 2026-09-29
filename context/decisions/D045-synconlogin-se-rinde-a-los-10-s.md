# D045 · Persistencia · `syncOnLogin` se rinde a los 10 s: `AbortController` · Implementado

**Resumen:** `syncOnLogin` se rinde a los 10 s: `AbortController` (tope o limpieza del efecto) en GET y push + `Promise.race`, porque la espera del token en `fetchWithAuth` no la corta ninguna señal

- `SYNC_TIMEOUT_MS = 10_000` en `cloud-storage.ts`. El GET normal tarda menos
  de un segundo. 10 s cubren una red lenta y los reintentos propios de
  postgrest-js 2.112 ante un error de red (GET: 3 reintentos a 1 s, 2 s y
  4 s; un 500 no se reintenta).
- Un `AbortController` interno se aborta por tope o por la señal del llamante
  (limpieza del efecto). El GET y el push llevan `.abortSignal()`.
- **`Promise.race` además del abort:** `fetchWithAuth` de supabase-js espera
  al token de sesión *antes* del `fetch`, y esa espera no la corta ninguna
  señal. Sin la carrera, un cuelgue ahí (el lock de Auth) dejaría la promesa
  pendiente para siempre. Con ella se rechaza a tiempo, y cuando ese `fetch`
  por fin salga lo hará ya abortado, así que no llega a enviarse.
- Un tope que salta con el push de `syncOnLogin` ya en vuelo puede dejar
  subido el merge (o no). Da igual: ese merge nunca pierde datos de la nube.
- `fetchRemoteLearningData`/`pushLearningData` no registran error cuando la
  petición se abortó a propósito (evita ruido al cancelar). El tope sí se
  registra, en el `console.error` de `GameEffects`.

_Contexto común de la unidad (antes `12-sync-fallida.md`): en D044._
