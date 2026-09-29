# D007 · Animación · `<MotionConfig reducedMotion="user">` en `Providers` para respetar reduced-motion del SO en lo que quede de framer · Obsoleta → D177

**Decisión:** `<MotionConfig reducedMotion="user">` en `src/components/app/Providers.tsx`
**Por qué:** El bloque `prefers-reduced-motion` de `global.css` solo cubre transiciones/animaciones CSS; esto cubre lo que quede de framer (p. ej. el pulso del `Timer`)

_Contexto común de la unidad (antes `03-animaciones.md`): en D006._
