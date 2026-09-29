# D145 · UX · Sonido `penalty` (golpe grave, Mi4→Mi2 en 150 ms + octava) en `applyPenalty`, con el badge de D132 · Implementado

**Resumen:** Sonido `penalty` (golpe grave, Mi4→Mi2 en 150 ms + octava) en `applyPenalty`, con el badge de D132; suena junto al fallo o al salto del competitivo, no en su lugar (registro y duración distintos para no taparse)

**Decisión:** `penalty`: golpe tipo bombo (triángulo de Mi4 a Mi2 en 150 ms, más su octava de `withBody`) en `applyPenalty` de `Session`, el mismo instante en que aparece el badge "+10 s"/"+20 s" (D132). Suena **junto** al fallo o al salto del competitivo, no en su lugar
**Por qué:** Los dos dicen cosas distintas (fallaste / te costó tiempo). No se tapan: el golpe es percusivo y se va a los 0,15 s; con la segunda nota del fallo solo se solapa su cola más grave. La octava empieza en 659 Hz, así que se oye en un altavoz de móvil (D125)

**Rama:** `feat/mas-sonidos`

_Contexto común de la unidad (antes `36-mas-sonidos.md`): en D143._
