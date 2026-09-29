# D162 · UX · `CountryPickerModal` a `w-[min(34rem,92vw)] max-w-none` · Implementado

**Resumen:** `CountryPickerModal` a `w-[min(34rem,92vw)] max-w-none`: el tope de 28 rem de `modal__dialog--md` no dejaba aplicar los 34 rem (como D150). A 320 px no cambia

**Decisión:** `CountryPickerModal` suma `max-w-none` a su `w-[min(34rem,92vw)]`, como el ranking (D150). Medido a 1280 px: el diálogo pasa de 470 a 571 px (34 rem) y cada columna de países de 115 a 147 px; con Caribe y Europa abiertos, los nombres truncados bajan de 9 a 6. A 320 px no cambia nada (manda el 92vw: dos columnas de 106 px, sin scroll horizontal)
**Por qué:** `modal__dialog--md` de HeroUI limita a 28 rem, así que el ancho de 34 rem nunca se aplicaba. Alternativa: `size="lg"` del `Modal` (32 rem, token de HeroUI), pero entonces el selector y el ranking dejarían de medir lo mismo

**Rama:** `fix/modales-ancho-320`

## Contexto común de la unidad (antes `42-modales-ancho-320.md`)

> Arreglo, rama `fix/modales-ancho-320` (pendientes P23 y P24, tanda 2026-09-26 b).
> Todo en `CountryPickerModal.tsx` y `LeaderboardModal.tsx`. Sigue lo que dejó
> abierto D147–D150 ("Lo que esto no cubre").
