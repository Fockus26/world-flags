# D023 · Componentes · `DailyPractice` separa `onComplete` de `onAbandon` · Implementado

**Resumen:** `DailyPractice` separa `onComplete` de `onAbandon` (antes ambos eran `onFinish`, así que abandonar contaba como sesión completada)

`DailyPractice` tenía un único `onFinish` para el fin de cola **y** para el botón
de abandonar del `ConfirmationModal`. Enganchar ahí el registro habría contado
cada abandono como sesión completada e inflado los logros. Ahora son
`onComplete(summary)` y `onAbandon()`.

Criterio de acierto en práctica diaria: cuentan `good`/`easy`/`hard`, falla solo
`again` — coherente con `calculateNextReview`, que reinicia las repeticiones
únicamente en `again`.

---

## Copy

Nombres, descripciones y umbrales del catálogo son **provisionales**, pendientes
de aprobación del dueño. Fila #7 en `CONTENT_CHECKLIST.md`.

_Contexto común de la unidad (antes `05-logros.md`): en D016._
