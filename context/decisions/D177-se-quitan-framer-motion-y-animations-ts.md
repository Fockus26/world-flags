# D177 · Animación · Se quitan `framer-motion` y `animations.ts` · Implementado

**Resumen:** Se quitan `framer-motion` y `animations.ts`: lo inerte (`initial={false}`, `layout`, `AnimatePresence`) pasa a elementos normales; spinner, anillo y número del `Timer` y la lista del `CountryPickerModal` a CSS (`animate-spin`, `transition-[stroke-dashoffset] duration-900`, `tw-animate-css` con `motion-safe:`). Sustituye a D007

**Decisión:** **Se quita `framer-motion`** y `src/styles/animations.ts` (2026-09-28, `refactor/quitar-framer-motion`). Lo que tenía `initial={false}` (entradas de `Configuration`, `UserSummary`, `Session`, botones de nota de `AnswerForm`) pasa a elementos normales: ya se pintaba así. `AnswerForm` pierde `layout` y `AnimatePresence` (no animaban, D006). Con efecto real, a CSS: spinner de `EmailConfirmationPending` → `animate-spin`; anillo del `Timer` → `transition-[stroke-dashoffset] duration-900 ease-linear` (única duración fuera de la escala: sigue el tic de 1 s); número del `Timer` → `motion-safe:animate-in fade-in-40 zoom-in-85 duration-180` remontado por `key`; lista de un continente en `CountryPickerModal` → `motion-safe:animate-in fade-in-0 slide-in-from-top-1 duration-200` (entra; al cerrar se va sin animación). Sin `MotionConfig`: el bloque `prefers-reduced-motion` de `global.css` y `motion-safe:` cubren todo
**Por qué:** D006 ya lo dejó sin uso real; el paquete pesaba en el bundle y su `AnimatePresence` era la causa de vistas congeladas. Sustituye a D007

**Rama:** `refactor/quitar-framer-motion`

_Contexto común de la unidad (antes `03-animaciones.md`): en D006._
