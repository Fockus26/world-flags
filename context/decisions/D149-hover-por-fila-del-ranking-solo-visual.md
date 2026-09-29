# D149 · UX · Hover por fila del ranking solo visual (no enfocable) · Implementado

**Resumen:** Hover por fila del ranking solo visual (no enfocable): `surface-hover` en filas normales, tinte + 6 % del texto (`color-mix`) en las teñidas, 150 ms; variante `hover:` de D103 (sin hover pegado)

**Decisión:** Hover por fila, solo visual: la fila sigue siendo un `<li>` no enfocable, sin tooltip, `cursor` normal. Fila normal: `hover:bg-surface-hover`. Filas con tinte (podio, tu fila): el tinte se ahonda con `color-mix(in oklab, <tinte>, var(--color-surface-soft) 6%)`. `transition-colors duration-150`. La variante `hover:` es la de D103: ratón, o mientras dura el toque (`:active`), sin hover pegado. Movimiento reducido: lo acorta el bloque global
**Por qué:** Decidido por el dueño: sin nada nuevo que mostrar, hacerla enfocable añadiría 20 paradas de tabulador sin contenido. Mezclar con el color del texto sirve en los dos temas (oscurece en claro, aclara en oscuro), como el hover de los botones `soft`. Sin el "sube 1 px" opcional de P21: queda para P19

**Rama:** `style/ranking-podio`

_Contexto común de la unidad (antes `37-ranking-podio.md`): en D147._
