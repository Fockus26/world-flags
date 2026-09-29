# D140 · Persistencia · Subida al ranking en cola por cuenta (`leaderboard-upload.ts`) · Implementado

**Resumen:** Subida al ranking en cola por cuenta (`leaderboard-upload.ts`): en serie, último subido por scope, reintento 5/15/30/60 s tras `failed`, `rejected` definitivo. Sin reintentos por cada cambio de `learningData` (P14)

**Decisión:** Subida al ranking en una cola por cuenta (`leaderboard-upload.ts`): en serie (una petición en vuelo), último tiempo subido por scope, marcas de "Todo el mundo" primero. Un fallo (`failed`) para la cola y reintenta a los 5 s, 15 s, 30 s y luego cada 60 s; un éxito reinicia la escalera; un rechazo (`rejected`) es definitivo (D113). Ya no depende de `lastSyncedAt`
**Por qué:** P14: antes una subida fallida se reintentaba con cada cambio de `learningData` (cada respuesta). Y la primera carga tras el deploy sube las marcas de continente de Países ya guardadas: nada de 24 peticiones de golpe. Misma escalera que la sync (D044)

**Rama:** `feat/ranking-continentes`

_Contexto común de la unidad (antes `34-ranking-continentes.md`): en D137._
