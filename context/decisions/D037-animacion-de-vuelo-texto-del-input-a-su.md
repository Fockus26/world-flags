# D037 · Animación · Animación de "vuelo" (texto del input a su hueco en el tablero) con Web Animations API, no framer-motion · Implementado

`useFlyToSlot.ts` anima el texto aceptado desde el input hasta su hueco con
la técnica FLIP (el clon se posiciona ya en el destino y se anima un
`transform` que lo trae desde el origen a `none`) — no framer-motion, que no
ejecuta en este stack (D006). Duración 450 ms, `cubic-bezier(0.2, 0.8, 0.2,
1)`: constantes con nombre en el archivo, no hay token de
`DESIGN_TOKENS.md` para una animación JS de esta duración (los que existen
son transiciones CSS de 150-200 ms).

Con `prefers-reduced-motion: reduce` no hay clon: `onLanded` se llama de
inmediato y el hueco pasa a su estado final sin animación. Antes de medir
posiciones, `scrollIntoView({ block: "nearest", behavior: "auto" })`
instantáneo — si el tablero se desplazara con animación mientras se toman
las medidas, el clon aterrizaría en el sitio equivocado.

_Contexto común de la unidad (antes `07-modo-paises.md`): en D028._
