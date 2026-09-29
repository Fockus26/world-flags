# D171 · Persistencia · La preferencia de tema pasa por `learning-storage.ts` · Implementado

**Resumen:** La preferencia de tema pasa por `learning-storage.ts` (`getStoredThemePreference` / `saveThemePreference`, con `try/catch`, clave `"theme"` compartida con el script de `Layout.astro`); `ThemeEffects` y `themeSlice` ya no tocan `localStorage`

`ThemeEffects` y `themeSlice` leían y escribían `localStorage` directamente (regla de
persistencia de `CLAUDE.md`) y sin `try/catch`: con el almacenamiento bloqueado, el efecto
lanzaba. Ahora usan `getStoredThemePreference()` / `saveThemePreference()`, que valen
"system" y no recuerdan nada si no hay acceso, sin lanzar. La clave sigue siendo `"theme"`,
la que lee el script bloqueante de `Layout.astro` (su comentario ya nombra también
`heroui-theme.css`, D168).

**Rama:** `fix/tema-transiciones-y-almacenamiento`

_Contexto común de la unidad (antes `46-tema-transiciones-y-almacenamiento.md`): en D170._
