# D013 · Diseño · Selección de continente en `RegionOption` usa el color por puntuación (borde + anillo + casilla), nunca el morado · Implementado

**Resumen:** Selección de continente en `RegionOption` usa el color por puntuación (borde + anillo + casilla), nunca el morado; el texto va en color fijo AA

**Decisión:** En `RegionOption` (grid de continentes) el color por puntuación (`utils/score.ts`, `getScoreColor`/`getScoreBackgroundColor` — reciben `isDark`) se usa solo para: borde izquierdo, anillo de selección (2px sólido) y relleno de la casilla. El nombre / contador / "practicado hoy" van en `text-surface-soft` fijo
**Por qué:** Usado como color de **texto** daba 2.2–2.7:1 para puntuaciones medias/altas sobre blanco (falla AA). El dueño además quería que la selección se viera en el color del score, no morada
