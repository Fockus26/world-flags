# D002 · HeroUI · Wrappers de `ui/` mantienen `color`/`variant`/`disabled`/`onClick`… — los ~17 consumidores no cambian · Implementado

**Decisión:** Los wrappers de `src/components/ui/` (`Button`, `Modal`, `Input`, `Select`, `IconButton`, `FeedbackMessage`, `OptionTile`, `Fieldset`, `GradeButtons`) mantienen su API previa a la migración
**Por qué:** Evita tocar los ~17 archivos consumidores. El wrapper traduce a HeroUI por dentro
