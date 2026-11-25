# D237 · Datos · El mapa del modo Mapa se genera una vez desde Natural Earth 1:50m y se guarda ya proyectado · Implementado

**Resumen:** `bun run map:build` (`scripts/build-world-map.ts`) escribe `src/data/world-map.json`: una silueta SVG por país del catálogo, ya proyectada, más su centro y su caja. El cliente no carga d3 ni proyecta nada. El archivo generado va en el repo.

**Origen:** primera unidad del modo Mapa (plan local `context/plans/modo-mapa.md`, 2026-11-23). El dueño decidió: se pregunta con nombre + bandera, se responde tocando el país; al acertar, la bandera aparece en la silueta y el país queda del color de su continente; en móvil, vertical con vuelo al continente; primera entrega solo práctica.

- **Fuente:** Natural Earth 1:50m (dominio público) por `world-atlas`. El 1:110m no sirve: le faltan 29 países del catálogo (Vaticano, Mónaco, Malta, Singapur, casi todo el Caribe y el Pacífico).
- **Arreglos sobre la fuente:** Kosovo viene sin código y se empareja por nombre. Somalilandia y Chipre del Norte vienen aparte y se unen a Somalia y Chipre. Tuvalu no viene: queda sin silueta (`d: ""`), con su punto en Funafuti.
- **Tierra sin país del catálogo** (Groenlandia, Sáhara Occidental, Puerto Rico, Nueva Caledonia…): va toda junta en `land`, se dibuja y no se toca. La Antártida no se dibuja. **Pendiente de confirmar por el dueño** (el Sáhara Occidental es el caso sensible).
- **Proyección:** Natural Earth I girada 10° al este, para que el corte del mapa caiga en el Pacífico y no parta Rusia. `viewBox` de 10.000 × 4.437. Se cambia en una línea del script.
- **Peso:** 263 KB (98 KB gzip). Se llega ahí con tres cosas:
  - Se simplifica la **topología**, no cada país (`topojson-simplify`, `MIN_WEIGHT` 0,002 grados²): las fronteras comunes siguen casando.
  - Coordenadas enteras y trazados en desplazamientos (`l`), no absolutos: un tercio del tamaño. Los subtrazados que el redondeo deja sin área se quitan.
  - Las islas pequeñas (menos de 80 unidades) que son parte importante de su país (≥ 2 % de su territorio mayor) conservan el detalle de la fuente y un decimal: simplificadas desaparecían (las Islas Marshall se quedaban sin atolones). Los islotes de Canadá o Indonesia no lo necesitan.
- **`centroid` y `bbox` son de los territorios principales** (los que miden ≥ 20 % del mayor), no del país entero: la caja de Francia no cruza el Atlántico por la Guayana ni la de Estados Unidos el mapa por las Aleutianas. El centro es el del territorio mayor.
- **Dependencias:** `world-atlas`, `topojson-client`, `topojson-simplify`, `d3-geo` e `i18n-iso-countries` son `devDependencies` y solo las usa el script.
- **Biome** no revisa `src/data/world-map.json` (una línea, generado).

### Alternativas descartadas

- **Proyectar en el cliente** (TopoJSON + `d3-geo` en el bundle): la fuente pesa 236 KB gzip más la librería, y el móvil proyectaría 241 formas en cada carga.
- **Una librería de mapas** (`react-simple-maps`, Leaflet, MapLibre): traen teselas o su propio zoom; aquí hacen falta 197 siluetas tocables y animables, que es SVG propio.
- **Simplificar cada país por separado:** deja huecos y solapes entre vecinos al ampliar.

### Lo que no cubre (unidades siguientes)

- Microestados: a mundo entero no se pueden tocar (el Vaticano mide 0,2 unidades de 10.000). Llevarán marcador; el umbral se decide con el componente.
- Que el archivo quede en la caché del SW para jugar sin red.
- La frontera entre una isla con detalle de la fuente y un vecino simplificado puede no casar del todo (menos de 2 unidades). Solo afecta a territorios pequeños con frontera terrestre; no se ha mirado ampliado.

### Verificación

- `tests/unit/world-map.test.ts`: una entrada por país del catálogo y ninguna más; silueta en todos salvo Tuvalu; trazados cerrados; cada silueta reconstruida desde sus desplazamientos cae dentro del mapa y cubre su caja; centro dentro de la caja; ninguna caja cruza el mapa.
- **Sin verificar a ojo:** el mapa no se ha visto dibujado en un navegador.
