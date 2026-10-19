# D206 · A11y / Color · Etiqueta del círculo de Resultados del rush en `primary-hover` · Implementado

**Resumen:** en Resultados del rush, las etiquetas «encontrados» (al rendirse) y «tiempo» (al completar) del círculo usaban `primary` sobre `primary-soft`. En claro eso da 3,97:1, por debajo del 4,5:1 que pide un texto `text-tiny` en negrita (axe, QA del 2026-10-19). Ahora llevan `text-primary-hover`: 5,15:1 en claro (`#5b4bdb` sobre `#ecebfe`) y 6,54:1 en oscuro (`#b3a6ff` sobre `#2c2650`).
- Solo cambia la etiqueta. El número es un `<strong>` de 22,4 px o más, cuenta como texto grande (3:1) y se queda en `primary`.
- Es el mismo criterio que la fila propia del ranking (D148): un texto pequeño sobre `primary-soft` va en `primary-hover`.

**Alternativas descartadas:** círculo con fondo `surface`, que da 4,66:1 (margen justo y el círculo pierde el relleno); etiqueta de tamaño grande, que necesita al menos 1,17rem en negrita y no tiene token entre `number` y `heading-sm`, así que quedaría igual de grande que el número.
**Rama:** `fix/contraste-etiqueta-resultados`
