# D141 · UX · Selector "Continente" (`ui/Select`) en `LeaderboardModal` · Implementado

**Resumen:** Selector "Continente" (`ui/Select`) en `LeaderboardModal`: "Todo el mundo" + 8 continentes, por defecto "Todo el mundo" (`defaultRegion`); título y textos con el continente; `role="status"` anuncia el cambio al cargar

**Decisión:** Selector de continente en `LeaderboardModal`: `ui/Select` (HeroUI) con etiqueta visible "Continente", "Todo el mundo" + los 8 continentes con los nombres de `REGION_LABELS`, bajo el selector de juego. Por defecto "Todo el mundo" (prop `defaultRegion` para quien lo abra tras jugar un continente; hoy Resultados no abre el ranking). Título, descripción y aviso "sin tiempo" dicen el continente. Al cambiar, `role="status"` anuncia "Mostrando el ranking de Europa." cuando ya hay algo que leer; el skeleton/alto animado (D115–D116) aplica solo porque cambia el scope
**Por qué:** 9 pestañas no caben a 320 px. El anuncio espera a la carga para no pisarse con "Cargando el ranking…". Alternativa: abrir en el continente elegido en la configuración (descartada: cambia lo que ve quien abre el ranking desde el menú)

**Rama:** `feat/ranking-continentes`

_Contexto común de la unidad (antes `34-ranking-continentes.md`): en D137._
