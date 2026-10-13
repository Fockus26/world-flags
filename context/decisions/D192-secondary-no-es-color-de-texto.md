# D192 · Accesibilidad · `secondary` no es color de texto en claro: el texto morado va en `secondary-hover` y el hover se subraya · Implementado

**Resumen:** en claro, `secondary` (`#b34bd1`) no llega a 4,5:1 como texto sobre ningún fondo claro de la app. Todo texto morado (enlaces y botones de solo texto) usa `text-secondary-hover`; el token `secondary` sigue igual para fondos, bordes y la barra de progreso.

**Decisión:**
- `LearningPathPanel` ("Abandonar", el único uso de `text-secondary` como texto que quedaba tras D187): `text-secondary` + `hover:text-secondary-hover` pasa a `text-secondary-hover` + `hover:underline` (`underline-offset-2`), el mismo patrón que "Limpiar todo" en D187. El hover deja de ser solo un cambio de color y sigue siendo distinguible.
- `context/COLORS.md` anota que `secondary` no sirve como texto sobre claro.
- No se cambia el valor de `secondary`: lo usan el relleno del botón "Práctica diaria", bordes de `outline`, casillas del picker y la barra de progreso de lotes (no texto, ≥3:1).

**Contraste medido (WCAG, sRGB):**

| Texto | Fondo | Claro | Oscuro |
|---|---|---|---|
| `secondary` (antes) | blanco `surface`/`overlay` | 4,34:1 ✗ | 8,22:1 (`#e19bec` / `#1b1930`) |
| `secondary` (antes) | `background` `#f2f1f8` | 3,86:1 ✗ | 8,89:1 |
| `secondary` (antes) | `surface-hover` `#f1eff9` | 3,81:1 ✗ | — |
| `secondary-hover` | blanco | 5,69:1 | 10,27:1 (`#eab8f0` / `#1b1930`) |
| `secondary-hover` | `background` | 5,07:1 | 11,10:1 |
| `secondary-hover` | `surface-hover` | 5,00:1 | — |

**Por qué:** visto en W2 (#71, P44): axe marcaba `text-secondary` en el selector de países; D187 lo arregló solo ahí.

**Alternativas descartadas:**
- Oscurecer el token `secondary`: cambia el botón "Práctica diaria", los bordes y la barra, que no tienen problema de texto (salvo lo anotado abajo).
- Mantener `hover:text-secondary-hover` con un reposo más claro: no hay tono más claro que pase 4,5:1.

**Pendiente visto de paso (fuera de esta unidad):** el botón `contained` de color `secondary` ("Práctica diaria") pinta texto blanco sobre `#b34bd1` = 4,34:1 en claro. Ver el informe del PR.

**Rama:** `fix/contraste-text-secondary`
