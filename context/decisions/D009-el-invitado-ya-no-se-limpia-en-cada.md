# D009 · Persistencia · El invitado ya no se limpia en cada carga: `GameEffects` solo limpia en transición `authenticated → guest` real · Implementado

**Resumen:** El invitado ya no se limpia en cada carga: `GameEffects` solo limpia en transición `authenticated → guest` real; si no, hidrata de `localStorage`. Fallback a `localStorage` si Auth no resuelve en 2.5s

**Decisión:** `GameEffects` rama `guest`: solo llama `clearLearningData()` en la transición **`authenticated → guest`** real (logout, detectada con un `useRef` del `status` previo); en una carga normal de invitado hidrata desde `getLearningData()` (localStorage). Además, si `status` sigue en `"loading"` tras 2.5s (Supabase Auth no resuelve), hidrata igual desde localStorage
**Por qué:** La rama guest llamaba `clearLearningData()` en **cada** carga (la intención era limpiar el caché de una sesión autenticada previa), lo que borraba TODO el progreso del invitado — incluido `lastPracticeByCountry` — en cada recarga

_Contexto común de la unidad (antes `04-persistencia.md`): en D008._
