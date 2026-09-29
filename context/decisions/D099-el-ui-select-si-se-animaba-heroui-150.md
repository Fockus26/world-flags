# D099 · Animación · El `ui/Select` sí se animaba (HeroUI: 150/100 ms, escala 95 %, 4 px) pero apenas se notaba · Implementado

**Resumen:** El `ui/Select` sí se animaba (HeroUI: 150/100 ms, escala 95 %, 4 px) pero apenas se notaba. `ui/popover-motion.ts` lo lleva a 200/150 ms, escala 90 % y 8 px con variantes `data-[entering]`/`data-[exiting]` (capa `utilities` gana a `components`). También en el menú ⋮. Movimiento reducido: lo anula `global.css`

Pedido del dueño: "no hay animaciones en el select del modo de juego".

- **Diagnóstico:** nada la anulaba. HeroUI v3 anima `select__popover` con
  `tw-animate-css` mientras React Aria pone `data-entering` / `data-exiting`, y en el
  navegador corre (`enter 0.15s` y `exit 0.1s`, vistas con `getAnimations()`). No hay
  regla en `global.css` ni `MotionConfig` que la pise; el bloque de
  `prefers-reduced-motion` solo actúa si el sistema lo pide. Lo que pasa es que es
  mínima: 150 ms de entrada, 100 ms de salida, escala al 95 % y 4 px de desplazamiento.
  En un móvil se lee como "sin transición".
  - Ojo al medir aquí: con el panel del navegador integrado oculto,
    `document.visibilityState` es `hidden` y las animaciones se quedan en
    `currentTime 0`. Se midió con el panel visible y clics reales.
- **Cambio:** `ui/popover-motion.ts` (`POPOVER_MOTION_CLASS`) alarga y amplía la de
  HeroUI: 200 ms de entrada (`ease-out`, escala al 90 %, 8 px desde el disparador) y
  150 ms de salida (`ease-in`, escala al 90 %, 8 px hacia el disparador). Son variantes
  `data-[entering=true]:` / `data-[exiting=true]:` de Tailwind: van en la capa
  `utilities` y ganan a la capa `components` de HeroUI sin `!important`. Se aplica en
  el wrapper `ui/Select` (lo ganan todos los selects: juego en móvil, estilo de avatar)
  y en el popover del menú ⋮.
- **Movimiento reducido:** el bloque de `global.css` está fuera de capa y deja la
  duración en 0,01 ms; comprobado simulando la regla (la animación pasa a `1e-05s`).

**Rama:** `feat/menu-movil`

_Contexto común de la unidad (antes `22-menu-movil.md`): en D096._
