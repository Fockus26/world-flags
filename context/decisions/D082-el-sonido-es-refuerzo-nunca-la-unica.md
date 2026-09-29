# D082 · Accesibilidad · El sonido es refuerzo, nunca la única señal: todo lo que suena ya se ve con icono y texto y se anuncia · Implementado

Todo lo que suena ya se ve y se anuncia: el aviso de respuesta lleva icono y
texto (y su región viva), el rush de Países anuncia cada país encontrado por
`aria-live`, el aviso de logro es un `role="status"`. Quien juega sin sonido (por
elección, por no poder oír o por tener el móvil en silencio) no pierde nada.
WCAG 1.4.2 no aplica (ningún sonido dura más de 3 s), y el interruptor da control
igualmente.

**Rama:** `feat/sonidos`

_Contexto común de la unidad (antes `19-sonidos.md`): en D080._
