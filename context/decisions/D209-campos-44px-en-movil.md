# D209 · A11y / Componentes · Campos de texto y desplegables de 44 px en móvil · Implementado

**Resumen:** por debajo de `sm` (640 px) el `<input>` de HeroUI medía 42 px (`py-2` + `text-base`) y el disparador del `Select` también 42 px, por debajo del objetivo táctil de 44 px del kit (design-qa del 2026-10-20: `#answer-input` y "Qué practicar"). El arreglo va en los primitivos, no por pantalla:
- `ui/Input` añade `max-sm:min-h-11` a la clase del `<input>` (se compone con la `className` del consumidor; la API no cambia).
- `ui/Select` pone `items-center max-sm:min-h-11` en `Select.Trigger`: 44 px y el texto centrado en el alto extra.
- Desde `sm` no cambia nada (siguen en 38 px con `text-sm`): ahí el puntero suele ser fino y crecerlos movería formularios de escritorio (cuenta, ranking) sin necesidad.

Medido con Playwright a 320/360/390/430 en claro y oscuro: input y disparador a 44 px; a 640 y 1280, 38 px como antes.

**Alternativas descartadas:** `min-h-11` en todos los anchos (cambia el escritorio sin que lo pida ningún hallazgo); arreglarlo solo en `AnswerForm` (dejaba el desplegable y los campos de cuenta en 42 px).
**Rama:** `fix/sesion-tamanos-copy-lotes`
