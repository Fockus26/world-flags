/**
 * El mapa del modo Mapa, ya proyectado (`data/world-map.json`, generado por
 * `scripts/build-world-map.ts`). Las coordenadas son unidades del `viewBox`
 * `0 0 width height`; el cliente no proyecta nada.
 */
export interface WorldMapCountry {
	/**
	 * Trazado SVG de la silueta. Vacío si la fuente no trae el país (Tuvalu):
	 * entonces solo existe su marcador, en `centroid`.
	 */
	d: string;
	/** Centro de su territorio más grande: donde va el marcador o la etiqueta. */
	centroid: [x: number, y: number];
	/** Caja de todo el país: `[x0, y0, x1, y1]`. Para volar hasta él. */
	bbox: [x0: number, y0: number, x1: number, y1: number];
}

export interface WorldMapData {
	width: number;
	height: number;
	/** Tierra que no es de ningún país del catálogo (Groenlandia…): se dibuja, no se toca. */
	land: string;
	/** Por código de país del catálogo (`data/countries.ts`). */
	countries: Record<string, WorldMapCountry>;
}
