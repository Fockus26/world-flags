# D012 · Componentes · `Modal`: `![max-height:90dvh] [overflow-y:auto]` en el diálogo · Implementado

**Resumen:** `Modal`: `![max-height:90dvh] [overflow-y:auto]` en el diálogo (HeroUI recorta sin barra; su `--visual-viewport-height` no es fiable aquí)

**Decisión:** `Modal` fuerza `![max-height:90dvh] [overflow-y:auto] overscroll-contain` en el `ModalDialog`
**Por qué:** HeroUI por defecto recorta el diálogo con `overflow:clip` (sin barra) esperando un `Modal.Body`, y fija la altura a `--visual-viewport-height`, que en este entorno a veces es `0px` y colapsa el modal. Con esto el contenido alto (picker de países) es alcanzable
