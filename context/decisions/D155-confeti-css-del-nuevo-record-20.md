# D155 · UX · Confeti CSS del nuevo récord: 20 partículas · Implementado

**Resumen:** Confeti CSS del nuevo récord: 20 partículas (`RecordConfetti`, `@keyframes confetti-fall`), 1,2–1,7 s una vez, capa recortada a la tarjeta, `pointer-events-none`, `aria-hidden`, oculto con movimiento reducido

**Decisión:** Nuevo récord: confeti de 20 partículas CSS (`RecordConfetti.tsx` + `@keyframes confetti-fall` al final de `global.css`), colores de tokens del tema, caída única de 1,2–1,7 s con retrasos de 0–200 ms, desvanecida al final. Capa `absolute inset-0 overflow-hidden pointer-events-none aria-hidden` sobre la tarjeta (`section` pasa a `relative`); `motion-reduce:hidden`. Parámetros fijos calculados al cargar el módulo (sin `Math.random` en el render, React Compiler)
**Por qué:** Sin librería (P19). Dentro de la tarjeta y recortado: no hay scroll horizontal a 320 px y no tapa clics. Dura lo que la fanfarria. Nada parpadea. Alternativa: confeti a pantalla completa (más vistoso, pero sale del overlay de Resultados y hay que cuidar el `inert` de detrás)

**Rama:** `style/animaciones-resultados`

_Contexto común de la unidad (antes `39-animaciones-resultados.md`): en D154._
