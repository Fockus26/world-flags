# feat/modales-logros-novedades (W3) — PR #17, 1.3.0, pendiente de revisión

Hecho: Logros w-[min(58rem,94vw)] max-w-none + rejilla 1/2/3 (min-[30rem]/min-[44rem]), tarjetas de alto igual (D085). Novedades en Accordion de HeroUI, una abierta a la vez, la actual abierta por defecto (D086).
Verificado: columnas 3/3/3/2/1/1 a 1440/1024/768/600/390/320, sin scroll horizontal; aria-expanded y una sola abierta; teclado; axe 0 en claro y oscuro en los dos modales; check/biome/test/build en verde.
No verificado: scroll suave a "Nuevo" (el navegador integrado no dibuja en segundo plano; con auto centra la tarjeta), lector de pantalla real, reduced motion emulado.
CONTENT_CHECKLIST #30: sin uso (no hay copy de UI nuevo).
Acciones manuales: ninguna.
Bug visto: la partida guiada (Tutorial.tsx) queda limitada a max-w-md por size="md" de ui/Modal; se arregla con max-w-none (W4).

Decisiones abiertas: D085 columnas por breakpoints de pantalla vs auto-fill/minmax; D086 se puede cerrar la abierta (todas recogidas) vs forzar siempre una abierta. D087–D089 sin usar.
Nota: la entrada 1.3.0 del CHANGELOG la redactó el worker; el dueño debería revisarla.
