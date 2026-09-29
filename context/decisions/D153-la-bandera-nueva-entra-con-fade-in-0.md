# D153 · UX · La bandera nueva entra con `fade-in-0 slide-in-from-right-4` (200 ms, `animation-duration-200` para no tocar el hover) · Implementado

**Resumen:** La bandera nueva entra con `fade-in-0 slide-in-from-right-4` (200 ms, `animation-duration-200` para no tocar el hover); sustituye al `motion.img` inerte. Capitales conserva su zoom (D067). `motionVariants.flagEnter` queda sin uso (señalado, no borrado)

**Decisión:** Bandera nueva: el `<img>` de `FlagDisplay` (con `key` por país) pasa de `motion.img` con `initial={false}` (sin entrada, D006) a un `<img>` con `animate-in fade-in-0 slide-in-from-right-4 animation-duration-200`. Se usa `animation-duration-200` y no `duration-200` porque este también cambiaría la transición de 180 ms del hover. Capitales conserva su entrada propia (`fade-in-0 zoom-in-95`, D067)
**Por qué:** Es lo que pidió el dueño; el `overflow-hidden` del marco recorta el deslizamiento (1 rem). `motionVariants.flagEnter` (`src/styles/animations.ts`) queda sin uso: se señala, no se borra (legado de framer, fila 6 de `CONTENT_CHECKLIST.md`). Alternativa para Capitales: la misma entrada desde la derecha, por coherencia entre juegos

**Rama:** `style/animaciones-partida`

_Contexto común de la unidad (antes `38-animaciones-partida.md`): en D151._
