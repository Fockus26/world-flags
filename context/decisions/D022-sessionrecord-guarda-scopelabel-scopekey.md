# D022 · Persistencia · `SessionRecord` guarda `scopeLabel` + `scopeKey`, no el `PracticeScope`; tope de 25 sesiones · Implementado

**Resumen:** `SessionRecord` guarda `scopeLabel` + `scopeKey`, no el `PracticeScope`; tope de 25 sesiones. Acumular contadores **antes** de truncar

Un scope custom con 60 códigos pesa ~620 B por registro frente a ~260 B con
`scopeLabel` + `scopeKey`, y no aporta nada que esos dos no cubran.

**Tope de 25 sesiones** (~6,5 KB). `pushLearningData` sube la fila entera en cada
cambio y la fila ya ronda los 33 KB. Los logros que miran sesiones concretas solo
necesitan las últimas; los agregados viven en `stats`. Regla de orden: **primero
acumular contadores, después truncar** (al revés, lo que se sale del tope no
llegaría a contarse).

_Contexto común de la unidad (antes `05-logros.md`): en D016._
