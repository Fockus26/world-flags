# D059 · UX · Entrada a "Novedades": pie de `ConfigurationModal` ("Versión X · Novedades"), fuera de las pestañas · Implementado

**Resumen:** Entrada a "Novedades": pie de `ConfigurationModal` ("Versión X · Novedades"), fuera de las pestañas; no un cuarto icono en la fila de 320 px. El modal se abre anidado

"Versión X · Novedades" va en un pie de `ConfigurationModal`, fuera de las
pestañas. Descartado:

- **Cuarto icono junto a 🏅 🏆 📍.** Esa fila a 320 px no está verificada y va
  justa (`UserSummary` lleva `whitespace-nowrap` + `shrink-0`): un icono más
  es la forma más directa de provocar scroll horizontal.
- **Dentro de la pestaña Usuario (`AccountTab`).** La versión no es de la
  cuenta, solo se vería en una pestaña (y en una de sus dos vistas), y el
  contenido de las pestañas entra en la medición de alto animada del modal.
- **Pie de la tarjeta principal.** Siempre visible, pero añade una fila a la
  pantalla más apretada de la app (y al skeleton de carga, D042) para algo que
  se usa poco.

La configuración es donde se busca la versión y el "acerca de" en casi
cualquier app; el descubrimiento lo cubre el aviso de D058. Desde ahí el modal
se abre **anidado** sobre el de configuración (React Aria apila los overlays:
Escape y el clic fuera cierran solo el de arriba, y al cerrar el foco vuelve al
botón "Novedades").

_Contexto común de la unidad (antes `15-changelog-y-versionado.md`): en D057._
