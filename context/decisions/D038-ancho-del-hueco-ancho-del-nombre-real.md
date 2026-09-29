# D038 · Diseño · Ancho del hueco = ancho del nombre real (`invisible`), sin valores mágicos de width; tablero accesible por teclado (`tabIndex`) · Implementado

`BoardSlot.tsx` renderiza el nombre real dentro con `invisible` (D038
original) cuando no debe mostrarse — nunca un `width` fijo — así el ancho es
siempre el de la palabra y no hay salto de layout al descubrirlo. Estados
(`hidden`/`revealed`/`target`/`missed`/`context`) siempre con color **más**
forma/icono/texto para lectores de pantalla, nunca solo color (`missed`
lleva el icono `Xmark` además del rojo).

**Hallazgo de accesibilidad (Fase 5-6, verificado y corregido con
axe-core en el navegador):** `CountryBoard.tsx` tiene su propio scroll
(`overflow-y-auto`, puede ser más alto que lo visible en continentes
grandes o "Todo el mundo") pero no era alcanzable por teclado —
`scrollable-region-focusable`, violación **seria** de axe-core. Se
corrigió con un `<section tabIndex={0} aria-label="...">` (no un `<div
role="group">`: biome pedía un elemento semántico, y `role="group"` es
para controles de formulario, no para una sección de contenido). Quedó un
`biome-ignore` documentado para `noNoninteractiveTabindex`: es el patrón
recomendado por WAI-ARIA para una región con scroll propio, y la regla
genérica de biome no distingue este caso legítimo. Confirmado en el
navegador: la violación desaparece tras el fix, y no aparecen violaciones
nuevas en ninguna de las pantallas de Países (selector, tablero de rush,
tarjeta cloze, modal de "Rendirme", ranking, modal de logros) en claro ni
en oscuro.

_Contexto común de la unidad (antes `07-modo-paises.md`): en D028._
