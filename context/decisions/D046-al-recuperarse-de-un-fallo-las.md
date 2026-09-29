# D046 · Persistencia · Al recuperarse de un fallo, las revisiones con `lastReviewedAt` ≥ el primer intento ganan por país · Obsoleta → D048, D049

**Resumen:** Al recuperarse de un fallo, las revisiones con `lastReviewedAt` ≥ el primer intento ganan por país (`applyReviewsSince`, vía `pickMoreRecentReview`). D020 intacto para el login de invitado; `regionGameScores`/perfil/configuración de ese rato siguen cediendo

> **Sustituida por D048/D049** (D048–D056): `mergeLearningData` ya
> fusiona `countryHistory` por la revisión más reciente de cada país, siempre,
> y la base de sincronización cubre perfil, configuración y notas.
> `applyReviewsSince` se eliminó. `syncOnLogin` pasó a llamarse
> `syncLearningData` (D051).

`mergeLearningData` da la razón a la nube en `countryHistory` (D020). Sin más,
las revisiones SRS hechas en `local` se perderían al recuperarse la
sincronización. Hoy a quien usa un solo dispositivo eso no le pasa: el push
"accidental" subía su copia, que coincidía con la nube.

- `applyReviewsSince(base, local, since)` (`learning-storage.ts`, pura): cada
  entrada de `local` con `lastReviewedAt >= since` pisa a la de `base`, país
  por país y en los dos juegos (Banderas y `countriesGame`). Usa
  `pickMoreRecentReview`, así que si la nube tiene una revisión aún más
  reciente de ese país (otro dispositivo, con la nube funcionando), gana esa.
  Devuelve `base` tal cual si no cambia nada.
- `since` = inicio del **primer** intento de sincronizar de esa cuenta: todo
  lo revisado desde entonces lo hizo ella. Los datos de partida (invitado, o
  la copia vieja de este dispositivo) son de antes y no ganan nada.
- **D020 queda intacto:** el login de invitado sigue igual (gana lo remoto).
  Esto solo aplica al volver de un fallo, o a lo jugado durante el vuelo.
- **Límite conocido:** `regionGameScores`, el perfil y la última
  configuración de ese rato siguen cediendo ante la nube. No tienen marca de
  tiempo, así que no se sabe qué parte es de ese rato. Lo que
  `mergeLearningData` ya sabía unir (marcas, candado diario, logros,
  estadísticas, historial) sobrevive como siempre.
- **Límite conocido:** un logout mientras se está en `local` borra
  `localStorage` (D009) con lo jugado sin subir. Antes esos datos se subían
  pisando la nube.

Alternativa descartada por ahora: fusionar siempre `countryHistory` por la
revisión más reciente dentro de `mergeLearningData`. También cambiaría el
login de invitado, es decir, re-litigaría D020. Si se quiere, en un PR aparte.

## Verificación

`bunx astro check`, `bunx biome check ./src` y `bun run build` (con variables
de Supabase de relleno: el `.env` es local). `GameEffects` real montado con
React 19 + Redux sobre happy-dom (script temporal en el scratchpad de la
sesión, no committeado), con el `fetch` de Supabase simulado y `localStorage`
vacío como tras un logout:

| Escenario | Qué se comprueba |
|---|---|
| GET 500 → `online` → GET 200 | `local`, 0 escrituras a `user_learning_data` y al ranking; jugar en `local` no sube nada; al volver la red, `ready` inmediato con la revisión de la nube (`fr`) **y** la del rato local (`de`), logro y perfil de la nube; el push final lleva las dos |
| GET colgado → reintento a los 5 s | el GET se aborta a los ~10 s, `local`, 0 escrituras; el reintento recupera igual que arriba |
| Token de sesión colgado | `local` a los 10 s por la carrera; ninguna petición sale después |
| GET 200 directo | `ready` con los datos de la nube, como antes |

No verificado en navegador: el dev server lo levanta el dueño, y el
comportamiento es de red/estado sin cambio de UI.

_Contexto común de la unidad (antes `12-sync-fallida.md`): en D044._
