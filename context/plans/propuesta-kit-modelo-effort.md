# Propuesta para el kit: medidor de modelo y effort por subagente (2026-10-22)

Objetivo: que cada subagente (feature-worker, wave-qa, design-qa, functional-qa) corra con el modelo y effort **más baratos que cumplan la tarea**, bajando de modelo cuando la tarea no es exigente y subiendo solo cuando hace falta.

## 1. La rúbrica (la puntúa el orquestador al escribir cada prompt)

Cuatro ejes, 0–2 cada uno:

| Eje | 0 | 1 | 2 |
|---|---|---|---|
| **Alcance** | 1–2 archivos, líneas dadas | 3–6 archivos de una zona | transversal / muchas pantallas |
| **Ambigüedad** | enfoque decidido en el prompt | elegir entre 2 enfoques conocidos | diseñar la solución |
| **Riesgo** | copy, CSS, docs, lista de datos | lógica de UI, tests puros | auth, sesión, concurrencia, datos guardados, seguridad, migraciones con datos |
| **Verificación** | tests unitarios bastan | navegador con mocks | base local + varias pestañas/estados |

| Total | Modelo · effort | Ejemplos de esta tanda (tokens reales) |
|---|---|---|
| 0–2 | `haiku` · low | ampliar la lista de invisibles (H: 99 k con opus/low, sobraba) |
| 3–4 | `sonnet` · medium | filas `flex-wrap`, avisos al 200 % (E 219 k, F 281 k con opus/medium: candidatos a sonnet) |
| 5–6 | `opus` · medium | sondeo de confirmación + enlace caducado (A 184 k) |
| 7–8 | `opus` · high | marca de cierre entre pestañas, carreras (G 255 k: encontró una carrera real) |

**Regla de riesgo:** con Riesgo = 2 el mínimo es `opus` aunque el total sea bajo (una migración de seguridad o una carrera de sesión no se degradan).

QA: `wave-qa` con el registro de QA (solo lo nuevo o cambiado) → `sonnet`/medium; si el alcance incluye auth/datos entre pestañas → `opus`/medium. `design-qa` de medidas → `sonnet`/low–medium con el script de medida versionado.

## 2. Escalado y degradado

- El worker empieza en el nivel de la rúbrica. Si falla las puertas dos veces, o encuentra que la tarea requiere una decisión de diseño no prevista, termina con `ESCALAR: <motivo>` en el informe (sin seguir quemando tokens).
- El orquestador relanza esa unidad un nivel arriba en el **mismo slot y rama** (el trabajo hecho está en la rama; `SendMessage` no cambia el modelo).
- Seguimientos pequeños (un `SendMessage` para un ajuste) se hacen con el agente ya abierto; si el ajuste es mecánico y el agente era opus, mejor un worker nuevo `haiku`/low sobre la rama.

## 3. Calibración (para que el medidor aprenda)

Cada worker cierra su informe con una línea: `Calibración: <tipo de unidad> · <modelo>/<effort> · <tokens> · puertas a la 1.ª: sí/no · escalado: sí/no`. El orquestador la copia a `context/KIT_FEEDBACK.md` (o a un `MODEL_CALIBRATION.md` del kit vía `/kit-feedback`). Si un tipo de unidad pasa siempre a la primera, se baja un nivel en la tabla; si escala a menudo, se sube.

## 4. Cómo se implementa en el web-agent-kit

1. `skills/orchestrate/reference/MODEL-EFFORT.md` con la rúbrica, la tabla y las reglas de §2 (fuente única).
2. `skills/orchestrate/SKILL.md` §4 "Reservar números": añadir la columna **Modelo · effort (puntuación)** a la tabla de cada unidad; §6 "Lanzar": pasar `model` y `effort` en la llamada `Agent(...)`; §7: manejar `ESCALAR:`.
3. `unit-prompt-template.md` y `brief-template.md`: campo `Modelo/effort: <x> (A·B·R·V = n)`.
4. Agentes (`agents/feature-worker.md`, `wave-qa.md`…): frontmatter con valor por defecto conservador (`model: sonnet`, `effort: medium`) — el orquestador lo sobrescribe; cuerpo con la regla de `ESCALAR:` y la línea de calibración.
5. `kit-feedback`: agrupar las líneas de calibración por tipo de unidad para ajustar la tabla en cada versión del kit.
6. `UPDATES.md` del kit: entrada de versión con estos cambios para que `/kit-update` los lleve a los proyectos.

## 5. QA de una ola: los hallazgos se resuelven dentro de la misma ola

Complementa al registro de QA (`context/QA_LEDGER.md`, KIT_FEEDBACK 37–41): si la QA de cierre trae hallazgos, las unidades de arreglo forman parte **de esa misma ola** (mismos slots, sin abrir otra ola ni otra sesión) y la ola cierra cuando esos PRs se mergean, sin una segunda QA. `orchestrate` §8 cambia "Critical/High → unidad al inicio de la ola siguiente" por "→ unidad de arreglo en esta ola, cerrada por su worker con el script de reproducción".
