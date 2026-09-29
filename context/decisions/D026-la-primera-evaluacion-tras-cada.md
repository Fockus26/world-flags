# D026 · Componentes · La primera evaluación tras cada hidratación sella logros en silencio (sin snackbar) · Implementado

**Resumen:** La primera evaluación tras cada hidratación sella logros en silencio (sin snackbar); solo los desbloqueos posteriores, ya en vivo, se anuncian — evita inundar de avisos al abrir la app con progreso viejo

`*` a nivel global en `global.css`: `scrollbar-color`/`scrollbar-width`
(Firefox) + `::-webkit-scrollbar-*` (Chromium/Safari), con
`--color-surface-border` en reposo y `--color-primary-border` al hover — tokens
que ya existían, ninguno nuevo. Global a propósito: cualquier contenedor con
scroll interno (el `Modal`, el picker de países, la lista de logros) la
hereda sin tener que aplicarla contenedor por contenedor.

No se le exige el 3:1 de `1.4.11` (no es información necesaria para completar
ninguna tarea: rueda del mouse, touch y teclado siguen funcionando sin verla),
igual que el resto del sistema no se lo exige a los bordes de tarjeta
(`surface-border` da bastante menos de 3:1 contra blanco, y es una decisión ya
asumida en el resto del diseño).

_Contexto común de la unidad (antes `06-ajustes-logros.md`): en D024._
