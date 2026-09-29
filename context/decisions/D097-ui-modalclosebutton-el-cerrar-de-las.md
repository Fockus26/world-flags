# D097 · Componentes · `ui/ModalCloseButton`: el "Cerrar" de las cabeceras de modal es una X · Implementado

**Resumen:** `ui/ModalCloseButton`: el "Cerrar" de las cabeceras de modal es una X (`Xmark`, `aria-label="Cerrar"`) por debajo de `sm` y el texto de siempre desde `sm`. Lo usan Ranking, Logros, Novedades, Perfil y configuración y Elegir países

`ui/ModalCloseButton.tsx`, usado por `LeaderboardModal`, `AchievementsModal`,
`ReleaseNotesModal`, `ConfigurationModal` y `CountryPickerModal`. Por debajo de `sm` es
un botón de solo icono (`Xmark`, 44 × 44 px) con `aria-label="Cerrar"`; desde `sm`, el
botón de texto de siempre (`variant="text" color="danger"`). Mismo patrón de "dos
botones y CSS oculta uno" que D096. "Saltar tutorial", "Cerrar sesión" y el "Cancelar"
del pie del selector de países no cambian.

**Rama:** `feat/menu-movil`

_Contexto común de la unidad (antes `22-menu-movil.md`): en D096._
