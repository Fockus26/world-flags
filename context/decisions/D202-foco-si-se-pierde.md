# D202 · Accesibilidad · El foco se recoge cuando su elemento desaparece (lotes, Resultados, respuesta, Todos/Ninguno) · Implementado

**Resumen:** helper `focusIfLost(getElement)` en `src/utils/focus.ts`: cuadro a cuadro (hasta ~1,5 s), si el foco está en `<body>` (o en nada) lo lleva al destino; si está en otro sitio, no lo toca. Destinos (P51, P54):
- "Empezar" del modal de aprender por lotes → título del panel (`h2` con `tabIndex={-1}`).
- "Sí, abandonar" → botón "Aprender por lotes" que vuelve a aparecer.
- "Volver al inicio" en Resultados → `h1` de la pantalla de inicio (espera a que acabe el giro y se quite `inert`).
- "Todos"/"Ninguno" del picker → el botón del mismo continente que queda.
Resultados mueve el foco a su `h1` al montar (`focusWhenVisible`), siempre: es una pantalla nueva y lo de detrás pasa a `inert`.
P53: el campo de respuesta usa `readOnly` + `aria-disabled` en vez de `disabled` tras comprobar: el foco se queda en él (Tab llega a las calificaciones; 1–4 siguen funcionando). HeroUI pinta `aria-disabled` igual que `disabled`; Intro no vuelve a comprobar porque las partidas ignoran el envío fuera de "idle".
Los títulos enfocables llevan anillo con `focus-visible` (mismo patrón que el tutorial).
**Dos `<h1>` en Resultados (P51):** no se toca. Lo de detrás de Resultados ya es `aria-hidden` + `inert` (`FlagGame.tsx`), así que al árbol de accesibilidad solo llega el de Resultados; el QA contó los del DOM.
**Por qué:** WCAG 2.4.3. React Aria devuelve el foco al disparador del diálogo; si ya no existe, lo deja en `<body>`.
**Alternativas descartadas:** mover el foco al aviso de acierto/fallo (doble anuncio con su `role`); mantener montados los dos botones Todos/Ninguno (cambia el diseño de la fila).
**Rama:** `fix/foco-perdido`
