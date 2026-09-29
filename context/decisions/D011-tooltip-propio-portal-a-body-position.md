# D011 · Componentes · `Tooltip` propio (portal a `<body>`, `position:fixed`) en vez del de HeroUI · Implementado

**Resumen:** `Tooltip` propio (portal a `<body>`, `position:fixed`) en vez del de HeroUI — evita nested-interactive y el recorte por overflow del modal

**Decisión:** `Tooltip` es una implementación propia: portal a `document.body` con `position: fixed`, se muestra en hover del ratón y focus del hijo. NO se usa el `Tooltip` de HeroUI (React Aria)
**Por qué:** El de HeroUI convertía su trigger en `role="button"` y envolvía los `IconButton` → "nested interactive" (axe serio). Además `position:absolute` dentro del modal lo recortaba el `overflow`. El portal fijo nunca se recorta y el `aria-label` del hijo ya da el nombre accesible
