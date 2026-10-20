# D208 · A11y / Tokens · Foco al título en la pantalla de error y tokens de ancho de tarjeta · Implementado

**Resumen:** cuando la app falla al pintar, `ErrorBoundary` cambia todo el árbol por la tarjeta «Algo salió mal» y el foco se quedaba en `<body>` (WCAG 2.4.3, design-qa del 2026-10-20). Ahora el `h1` lleva `tabIndex={-1}` y recibe el foco con `focusWhenVisible`, el mismo patrón que el título de Resultados: en `componentDidMount` si el fallo es en el primer pintado y en `componentDidUpdate` cuando `hasError` pasa a `true` (también tras «Reintentar»). El contorno de foco del título es el de Resultados (`outline-surface-soft`, solo con `focus-visible`).

El ancho de las tarjetas de pantalla deja de ser un valor mágico (`w-[min(100%,32rem)]`, `w-[min(100%,38rem)]`): dos tokens `--container-*` en `theme.css`, usados como `w-full max-w-card` / `w-full max-w-card-wide`.
- `--container-card: 32rem` para 404 y error, que solo tienen título, una frase y uno o dos botones.
- `--container-card-wide: 38rem` para Resultados, que tiene más contenido.
- Cada pantalla conserva el ancho que tenía: el cambio no se nota.
- `w-full max-w-card` y no `w-card max-w-full`: en el `grid place-items-center` de estas pantallas, un ancho fijo hace que la pista mida 32rem y la tarjeta desborde a 320 px (medido).

**Alternativas descartadas:** un solo token de 38rem para las tres, que deja la frase de 404 y error en líneas muy largas con la tarjeta casi vacía; un solo token de 32rem, que estrecha Resultados y le hace saltar líneas al resumen. Quitar `role="alert"` de la tarjeta de error al mover el foco: se deja, porque el aviso llega también si el foco no se puede aplicar.
**Rama:** `fix/pantalla-error-foco`
