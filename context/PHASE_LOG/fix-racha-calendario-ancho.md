# fix/racha-calendario-ancho (W4, tanda 2026-09-24, P2)

**Qué:** panel de la racha en una sola columna en todos los anchos: racha y mejor racha en una fila arriba, calendario del mes a todo el ancho debajo. Sustituye a D100. 2.2.1 (PATCH). PR #28.

**Decisiones:** D118 (una columna, sustituye a D100), D119 (`aspect-square w-full max-h-7` en la celda). `context/decisions/28-racha-calendario.md`.

**Medidas (invitado, dev 4344):** panel 250 px de alto a 1440×900 (celdas 120,6×28), 740×360 (91,5×28; África y "Comenzar práctica" alcanzables) y 320×568 (33,1×28, sin scroll horizontal). Con D100: 247 px a 1280 y 740×360, 271 px a 320.

**Verificación:** astro check 0; biome limpio; 138 tests; build ok; axe panel 0 en claro y oscuro. Sin verificar: días practicados reales, mes de 6 filas (~314 px calculado).

**Copy:** sin texto nuevo en la UI (fila 38 sin usar).

**Aprendido:** `aspect-ratio` + `max-height` en item de grid con ancho auto traslada el tope al ancho: hace falta `w-full`. Dev de Astro 7 escucha solo en `[::1]`; la primera petición tardó ~70 s.
