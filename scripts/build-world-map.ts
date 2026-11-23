/**
 * Genera `src/data/world-map.json`: el mapa del modo Mapa, ya proyectado.
 *
 *   bun run map:build
 *
 * Fuente: Natural Earth 1:50m (dominio público) por `world-atlas`. El 1:110m
 * no sirve: le faltan 29 países del catálogo. El resultado se guarda en el
 * repo, así el build no depende de este script ni el cliente de d3.
 *
 * Lo que arregla de la fuente:
 * - Kosovo viene sin código: se empareja por nombre.
 * - Somalilandia y Chipre del Norte vienen aparte: se unen a Somalia y Chipre.
 * - Tuvalu no viene: queda sin silueta, con su punto (Funafuti).
 * - La Antártida no se dibuja. El resto de tierra sin país del catálogo
 *   (Groenlandia, Sáhara Occidental…) va a `land`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import type { MultiPolygon, Polygon } from "geojson";
import { alpha2ToNumeric } from "i18n-iso-countries";
import { merge } from "topojson-client";
import { presimplify, simplify } from "topojson-simplify";
import type {
	GeometryCollection,
	Topology,
	MultiPolygon as TopoMultiPolygon,
	Polygon as TopoPolygon,
} from "topojson-specification";
import { countries } from "../src/data/countries";
import type { WorldMapCountry, WorldMapData } from "../src/types/world-map";

const SOURCE = "node_modules/world-atlas/countries-50m.json";
const OUTPUT = "src/data/world-map.json";

const WIDTH = 10_000;
/**
 * Detalle que se quita de las costas y fronteras, en grados² (el área del
 * triángulo que forma cada punto con sus vecinos). Sin esto el archivo pesa
 * más que la fuente. Se puede ajustar: `MAP_MIN_WEIGHT=0.001 bun run map:build`.
 */
const MIN_WEIGHT = Number(process.env.MAP_MIN_WEIGHT ?? 0.002);
/** Decimales de los trazados: a 10.000 de ancho, enteros. */
const DIGITS = 0;
/**
 * Una isla que mide menos que esto (en unidades del mapa) se dibuja con el
 * detalle de la fuente y un decimal más: simplificada se queda en una raya o
 * desaparece (los atolones de las Islas Marshall). Solo si es parte
 * importante de su país (`DETAILED_TERRITORY_RATIO` de su territorio mayor):
 * los miles de islotes de Canadá o Indonesia no lo necesitan.
 */
const SMALL_TERRITORY_SIZE = 80;
const SMALL_TERRITORY_DIGITS = 1;
const DETAILED_TERRITORY_RATIO = 0.02;
/** Giro para que el corte del mapa caiga en el Pacífico y no parta Rusia. */
const ROTATION: [number, number] = [-10, 0];

const ANTARCTICA_ID = "010";
/** Países de la fuente sin código ISO, por su nombre en la fuente. */
const CODES_BY_SOURCE_NAME: Record<string, string> = { Kosovo: "xk" };
/** Territorios que la fuente separa y aquí son parte de un país del catálogo. */
const MERGED_INTO: Record<string, string> = {
	Somaliland: "so",
	"N. Cyprus": "cy",
};
/** Países que la fuente no trae: `[longitud, latitud]` de su punto. */
const POINT_ONLY: Record<string, [number, number]> = { tv: [179.19, -8.52] };

type Shape = (TopoPolygon | TopoMultiPolygon) & {
	properties: { name: string };
};
type Atlas = Topology<{ countries: GeometryCollection<{ name: string }> }>;

const sourceAtlas = JSON.parse(readFileSync(SOURCE, "utf8")) as Atlas;
// Simplificar la topología (y no cada país) mantiene las fronteras comunes
// sin huecos entre vecinos.
const atlas = simplify(presimplify(sourceAtlas), MIN_WEIGHT) as Atlas;
const shapes = atlas.objects.countries.geometries.filter(
	(geometry): geometry is Shape =>
		geometry.type === "Polygon" || geometry.type === "MultiPolygon",
);

const codeByNumericId = new Map<string, string>();
for (const { code } of countries) {
	const numeric = alpha2ToNumeric(code.toUpperCase());
	if (numeric) codeByNumericId.set(numeric, code);
}

function catalogCodeOf(shape: Shape): string | undefined {
	const { name } = shape.properties;
	return (
		MERGED_INTO[name] ??
		CODES_BY_SOURCE_NAME[name] ??
		(shape.id === undefined ? undefined : codeByNumericId.get(String(shape.id)))
	);
}

const shapesByCode = new Map<string, Shape[]>();
const landShapes: Shape[] = [];
for (const shape of shapes) {
	if (String(shape.id) === ANTARCTICA_ID) continue;

	const code = catalogCodeOf(shape);
	if (!code) {
		landShapes.push(shape);
		continue;
	}
	shapesByCode.set(code, [...(shapesByCode.get(code) ?? []), shape]);
}

const round = (value: number) => Number(value.toFixed(SMALL_TERRITORY_DIGITS));

const land = merge(atlas, landShapes);
const geometryByCode = new Map<string, MultiPolygon>();
const sourceGeometryByCode = new Map<string, MultiPolygon>();
for (const [code, parts] of shapesByCode) {
	geometryByCode.set(code, merge(atlas, parts));
	sourceGeometryByCode.set(code, merge(sourceAtlas, parts));
}

// El encuadre sale de todo lo que se dibuja, para que nada quede fuera.
const projection = geoNaturalEarth1()
	.rotate(ROTATION)
	.fitWidth(WIDTH, {
		type: "GeometryCollection",
		geometries: [land, ...geometryByCode.values()],
	});
const path = geoPath(projection).digits(DIGITS);
const detailedPath = geoPath(projection).digits(SMALL_TERRITORY_DIGITS);
const [, [, bottom]] = path.bounds({
	type: "GeometryCollection",
	geometries: [land, ...geometryByCode.values()],
});

/**
 * Pasa un trazado de d3 (`M`, `L` y `Z` con coordenadas absolutas) a
 * desplazamientos: `M5035,1182l1-2 3,0z`. Los puntos que el redondeo dejó
 * repetidos se quitan. El archivo queda en un tercio.
 */
function toRelativePath(d: string, digits: number): string {
	const format = (value: number) => String(Number(value.toFixed(digits)));
	const pair = (x: number, y: number) => {
		const fy = format(y);
		return `${format(x)}${fy.startsWith("-") ? "" : ","}${fy}`;
	};

	// Cada isla es un subtrazado. Las que el redondeo deja en un punto o en
	// una raya (menos de dos pasos) no tienen área y se quitan.
	let out = "";
	for (const subpath of d.split("M").slice(1)) {
		const points = subpath
			.replace("Z", "")
			.split("L")
			.map((point) => point.split(",").map(Number));
		let [x, y] = points[0];
		const steps: string[] = [];
		for (const [nextX, nextY] of points.slice(1)) {
			const dx = Number((nextX - x).toFixed(digits));
			const dy = Number((nextY - y).toFixed(digits));
			if (dx === 0 && dy === 0) continue;
			const step = pair(dx, dy);
			steps.push(steps.length > 0 && !step.startsWith("-") ? ` ${step}` : step);
			[x, y] = [nextX, nextY];
		}
		if (steps.length < 2) continue;
		out += `M${pair(points[0][0], points[0][1])}l${steps.join("")}z`;
	}
	return out;
}

/**
 * Los territorios que cuentan para la caja y el centro de un país son los
 * que miden al menos esto de su territorio mayor. Deja fuera la Guayana
 * Francesa o las Aleutianas, que llevarían la caja de Francia o de Estados
 * Unidos de un lado al otro del mapa.
 */
const MAIN_TERRITORY_RATIO = 0.2;

const toPolygons = (geometry: MultiPolygon) =>
	geometry.coordinates.map(
		(coordinates): Polygon => ({ type: "Polygon", coordinates }),
	);

const mapCountries: Record<string, WorldMapCountry> = {};
const missing: string[] = [];
for (const { code, name } of countries) {
	const sourceGeometry = sourceGeometryByCode.get(code);
	const simplifiedGeometry = geometryByCode.get(code);
	if (sourceGeometry && simplifiedGeometry) {
		// Las medidas salen de la fuente: no dependen de cuánto se simplifique.
		const territories = toPolygons(sourceGeometry).map((polygon) => {
			const [[x0, y0], [x1, y1]] = path.bounds(polygon);
			return {
				polygon,
				area: path.area(polygon),
				size: Math.max(x1 - x0, y1 - y0),
			};
		});
		// Simplificar no cambia qué arcos forman cada territorio: los dos
		// `merge` los devuelven en el mismo orden.
		const simplified = toPolygons(simplifiedGeometry);
		if (simplified.length !== territories.length) {
			throw new Error(`${code}: los territorios simplificados no casan`);
		}

		const largestArea = Math.max(...territories.map(({ area }) => area));
		const main = territories
			.filter(({ area }) => area >= largestArea * MAIN_TERRITORY_RATIO)
			.sort((a, b) => b.area - a.area);
		const [[x0, y0], [x1, y1]] = path.bounds({
			type: "GeometryCollection",
			geometries: main.map(({ polygon }) => polygon),
		});
		const [cx, cy] = path.centroid(main[0].polygon);

		mapCountries[code] = {
			d: territories
				.map(({ polygon, area, size }, index) =>
					size < SMALL_TERRITORY_SIZE &&
					area >= largestArea * DETAILED_TERRITORY_RATIO
						? toRelativePath(
								detailedPath(polygon) ?? "",
								SMALL_TERRITORY_DIGITS,
							)
						: toRelativePath(path(simplified[index]) ?? "", DIGITS),
				)
				.join(""),
			centroid: [round(cx), round(cy)],
			bbox: [round(x0), round(y0), round(x1), round(y1)],
		};
		continue;
	}

	const point = POINT_ONLY[code];
	const projected = point && projection(point);
	if (!projected) {
		missing.push(`${code} (${name})`);
		continue;
	}
	const [x, y] = [round(projected[0]), round(projected[1])];
	mapCountries[code] = { d: "", centroid: [x, y], bbox: [x, y, x, y] };
}

if (missing.length > 0) {
	console.error(`Sin silueta ni punto: ${missing.join(", ")}`);
	process.exit(1);
}

const data: WorldMapData = {
	width: WIDTH,
	height: Math.ceil(bottom),
	land: toRelativePath(path(land) ?? "", DIGITS),
	countries: mapCountries,
};

writeFileSync(OUTPUT, `${JSON.stringify(data)}\n`);
console.log(
	`${OUTPUT}: ${Object.keys(mapCountries).length} países, ${WIDTH}×${data.height}, ` +
		`${landShapes.length} formas de tierra sin país`,
);
