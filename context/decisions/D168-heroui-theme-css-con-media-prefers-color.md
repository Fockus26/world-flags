# D168 · Tokens · `heroui-theme.css` con `@media (prefers-color-scheme: dark)` para `:root:not([data-theme])` · Implementado

**Resumen:** `heroui-theme.css` con `@media (prefers-color-scheme: dark)` para `:root:not([data-theme])`, mismos valores que su bloque oscuro (como `variables.css`): sin `data-theme`, HeroUI y la app van en el mismo tema

**Decisión:** `heroui-theme.css` suma, dentro de `@layer theme`, un `@media (prefers-color-scheme: dark)` para `:root:not([data-theme])` con los mismos valores que su bloque oscuro, igual que `variables.css`. Los valores quedan duplicados (CSS no deja poner un `@media` en una lista de selectores); un comentario pide cambiar los dos a la vez
**Por qué:** Si `localStorage` falla, el script bloqueante de `Layout.astro` deja `<html>` sin `data-theme` hasta que `ThemeEffects` lo pone: `variables.css` ya seguía al sistema y la app salía en oscuro, pero HeroUI (botones, campos, modales) iba en claro. Especificidad: `:root:not([data-theme])` (0,2,0) gana a `:root` (0,1,0), así que no hace falta orden especial. Alternativa: variables intermedias `--wf-dark-*` referenciadas desde los dos bloques (sin duplicar, pero añade una capa de indirección a un archivo que hoy es plano)

**Rama:** `fix/tema-y-reloj`

_Contexto común de la unidad (antes `44-tema-y-reloj.md`): en D166._
