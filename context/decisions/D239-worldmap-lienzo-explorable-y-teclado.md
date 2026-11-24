# D239 · UX / A11y · `WorldMap`: lienzo SVG explorable, jugable con teclado; con lector de pantalla el modo Mapa no se juega · Implementado

**Resumen:** `components/game/map/WorldMap.tsx` dibuja `world-map.json` (D237) en un SVG propio que se arrastra, se amplía y vuela a los países que se le piden, sin salirse nunca del mundo. La cámara es lógica pura (`utils/map-viewport.ts`). Todavía no lo usa ninguna pantalla de la app.

### Cámara

- La vista es `{ center, scale }`; `clampView` la mantiene válida: no se reduce más que el mundo entero, no se amplía más de 60× y, mientras el mapa llene el lienzo, no se ve nada de fuera. Es lo que pidió el dueño: ampliar es entrar al mapa, no recortarlo.
- **Arrastre** con un dedo o el ratón, **pellizco** con dos (amplía hacia el punto medio), **rueda** (hacia el cursor), botones «Acercar», «Alejar» y «Ver todo el mundo», y teclado.
- **Vuelo** (`focusCodes`): encuadra la unión de las cajas de esos países con una transición de 500 ms. En vertical, así se juega un continente sin girar el teléfono. Arrastrar y pellizcar no se animan: siguen al dedo.
- Un toque es un toque solo si el dedo se movió menos de 6 px; con el puntero capturado el `click` no llega al país, así que se busca con `elementFromPoint`.
- Los bordes no engordan al ampliar (`vector-effect: non-scaling-stroke`).

### Microestados

Un país que en pantalla mide menos de 10 px lleva un punto de 10 px en su centro, con un área de toque invisible de 24 px (el objetivo táctil mínimo, WCAG 2.5.8). Al ampliar, cuando la silueta ya se ve, el punto desaparece. Con marcador para todo lo menor de 24 px, el mundo entero quedaba tapado de círculos. **Abierto:** a mundo entero las áreas de toque del Caribe y de Europa se pisan; se resuelve volando al continente (lo normal en una partida), no hay agrupación.

### Vuelo a un continente

`getFocusBox` quita de la caja los países que solos ocupan más de la mitad del conjunto: Rusia cuenta como Europa y con ella "Europa" era medio mapa. La caja de Kiribati pasa a ser la de Tarawa (`MAIN_TERRITORY_NEAR` en el script de D237): su isla mayor, Kiritimati, cae al otro lado del corte del mapa y estiraba Oceanía de lado a lado.

### Teclado (decisión del dueño, 2026-11-23)

El mapa entero es un solo control (`role="application"`, una parada de tabulador): flechas para saltar al país vecino (`findNeighbor`: el más cercano dentro de un cono de 45° hacia ese lado), Enter o Espacio para elegir, `+` y `−` para ampliar, `0` para ver el mundo. Un test recorre el mapa real y comprueba que con las flechas se llega a los 197 países. El país enfocado se marca con un contorno `primary-hover` de 3 px y, si sale de la vista, el mapa lo trae.

### Excepción de accesibilidad aceptada

Con lector de pantalla el modo Mapa no se puede jugar: anunciar el país enfocado sería decir la respuesta. `getCountryLabel` solo se pasa cuando el nombre no es la respuesta (explorar, repasar). El dueño lo aceptó el 2026-11-23: al entrar al modo se avisará de que necesita ver el mapa y se ofrecerán Países, Banderas y Capitales (unidad 3). Alternativas descartadas: pistas habladas de ubicación por país (197 textos, otro juego distinto) y no dar teclado (incumple 2.1.1).

### Laboratorio

`/mapa-lab` (`src/lab/`) monta el mapa para probarlo. La ruta solo se inyecta con `MAP_LAB=1` (`astro.config.mjs`): no existe en producción ni en los previews. Se quita cuando exista el modo.

### Verificación (2026-11-23)

Sobre el build con `MAP_LAB=1`, servido en estático:

- En el navegador: tocar un país lo pinta de su continente, arrastre, rueda, vuelo a Europa y a Sudamérica (a 375 px en vertical el continente llena el mapa), flechas + Enter, contorno del país enfocado y anuncio de su nombre.
- `.qa/mapa-axe.mjs` (axe con Playwright): 0 violaciones en el mapa a 320 y 1280 px, claro y oscuro, sin scroll horizontal.
- **Sin probar:** pellizco con dos dedos y cualquier móvil real; lector de pantalla real; `prefers-reduced-motion`; zoom del navegador al 200 %.
- **Visto, sin resolver:** los botones de ampliar tapan la esquina inferior derecha del encuadre (Chipre al volar a Europa). En claro, la tierra sin acertar se separa poco del mar (la distingue el borde, 4,2:1).
