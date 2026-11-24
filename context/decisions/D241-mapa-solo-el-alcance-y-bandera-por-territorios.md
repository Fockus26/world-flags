# D241 · Juego / Rendimiento · Mapa: solo se juega con los continentes de la partida, se dibuja lo que se ve y la bandera va por grupos de territorios · Implementado

**Resumen:** tres cambios pedidos por el dueño tras probar Mapa en producción (2026-11-24): podía tocar países de otros continentes, el mapa iba lento y la bandera no cubría todo el país.

### Solo los continentes de la partida

- `MapPractice` pasa como elegibles los países de los continentes de la partida (no solo los de la partida: con un lote de tres sería elegir entre tres). El resto del mundo no se puede tocar ni enfocar con el teclado.
- `WorldMap` pinta lo que ni es elegible ni está acertado como la tierra de fondo (`fill-neutral-soft`), sin punto de microestado. No hay prop nueva: sale de `selectableCodes` y `foundCodes`.
- El mapa sigue siendo uno solo (`world-map.json`, ~100 KB comprimido, en la caché del service worker): partirlo por continente no ahorraba nada que se note y quitaba los países vecinos, que son la referencia para ubicarse. Lo que se recorta es lo que se **dibuja**.

### Se dibuja lo que se ve

- `WorldMap` guarda la zona dibujada (`renderBox`): la vista más medio lienzo por cada lado. `CountryShapes` solo crea las siluetas que la tocan. La zona crece cuando la vista se acerca a su borde y se recorta cuando sobra más de seis veces; no durante un vuelo, que lo de alrededor todavía se ve.
- Con Sudamérica encuadrada a 375 px pasan de 197 siluetas y 56 círculos a 42 siluetas y ninguno.
- Las cajas con todos los territorios de cada país salen del trazado (`utils/map-paths.ts`); la `bbox` del JSON es solo la del territorio principal (D237).

### La bandera

- Antes iba una sola imagen sobre la `bbox` del JSON: las islas fuera de esa caja (Tierra del Fuego, Córcega) quedaban sin bandera, y en Estados Unidos la caja iba de Alaska a Florida.
- `getFlagBoxes` reparte los territorios en grupos: cada uno se une al grupo más cercano si queda a menos de un cuarto del lado del territorio mayor de ese grupo; uno grande (más de un cuarto del área) solo si está casi pegado. Cada grupo lleva su bandera, recortada a la silueta. Alaska y Hawái llevan la suya; las dos islas de Nueva Zelanda la comparten.
- La bandera sigue con `slice` (llena la caja y se recorta): en un país muy alargado, como Chile, solo se ve una parte del dibujo. Es lo que hace que no queden huecos.

### Verificación (2026-11-24)

- `tests/unit/map-paths.test.ts`: las cajas de bandera cubren todos los territorios de los 196 países con silueta.
- `.qa/mapa-alcance-banderas.mjs` sobre el build: en una partida de Sudamérica solo son tocables sus 12 países; capturas de la bandera sobre Argentina, Chile, Estados Unidos, Francia, Indonesia y Grecia.
- **Fluidez, sin medir de verdad:** en Chromium sin pantalla el arrastre ya iba al tope (17 ms por fotograma) antes y después, así que la mejora es la reducción de lo dibujado, no una cifra. Falta la prueba en el teléfono del dueño.
