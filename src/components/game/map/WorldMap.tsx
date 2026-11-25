import { Globe, Minus, Plus } from "iconoir-react";
import type {
	KeyboardEvent as ReactKeyboardEvent,
	PointerEvent as ReactPointerEvent,
} from "react";
import {
	memo,
	useEffect,
	useId,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { Button } from "@/components/ui/Button";
import { FeedbackMessage } from "@/components/ui/FeedbackMessage";
import { countries } from "@/data/countries";
import { getFlagRatio } from "@/data/flag-ratios";
import type { Region } from "@/types/country";
import type { WorldMapCountry, WorldMapData } from "@/types/world-map";
import { getFlagUrl } from "@/utils/flag-precache";
import { focusWhenVisible } from "@/utils/focus";
import {
	boxesIntersect,
	clampBox,
	containsBox,
	coverBox,
	expandBox,
	getFlagBoxes,
	getPathBox,
} from "@/utils/map-paths";
import {
	type Box,
	clampView,
	type Direction,
	findClosest,
	findNeighbor,
	fitBox,
	getFocusBox,
	getLayerPlacement,
	getViewFromPlacement,
	getWorldView,
	isVisible,
	type MapRaster,
	type MapView,
	type Point,
	panBy,
	type Size,
	toScreen,
	zoomAt,
} from "@/utils/map-viewport";
import { loadWorldMap } from "@/utils/world-map-loader";

/** Relleno de un país acertado: el color de su continente (D238). Clases literales: Tailwind las lee del código. */
const REGION_FILLS: Record<Region, string> = {
	"north-america": "fill-region-north-america",
	"central-america": "fill-region-central-america",
	caribbean: "fill-region-caribbean",
	"south-america": "fill-region-south-america",
	europe: "fill-region-europe",
	africa: "fill-region-africa",
	asia: "fill-region-asia",
	oceania: "fill-region-oceania",
};

const REGION_BY_CODE = new Map(
	countries.map(({ code, region }) => [code, region]),
);

/**
 * Un país que en pantalla mide menos que `MARKER_BELOW_PX` casi no se ve:
 * lleva un punto de `MARKER_DOT_PX` de diámetro, con un área de toque de
 * `MIN_TARGET_PX` (el objetivo táctil mínimo, WCAG 2.5.8).
 */
const MARKER_BELOW_PX = 10;
const MARKER_DOT_PX = 10;
const MIN_TARGET_PX = 24;
/** Lo que hay que mover el dedo para que sea arrastrar y no tocar. */
const DRAG_THRESHOLD_PX = 6;
/** Margen al volar hasta un grupo de países. */
const FIT_PADDING_PX = 24;
/** Cuánto amplía cada pulsación de + o −, y cada paso de rueda. */
const ZOOM_STEP = 1.6;
const WHEEL_ZOOM_RATE = 0.0015;
/**
 * Al volar a un solo país, la caja se abre al menos hasta esto (unidades del
 * mapa): se ve el país con sus vecinos, no un microestado a 60 aumentos.
 */
const MIN_FOCUS_SIZE = 700;

const ARROW_DIRECTIONS: Record<string, Direction> = {
	ArrowUp: "up",
	ArrowDown: "down",
	ArrowLeft: "left",
	ArrowRight: "right",
};

export interface WorldMapProps {
	/** Nombre accesible del mapa. */
	label: string;
	/** Países ya acertados: se pintan del color de su continente. */
	foundCodes?: ReadonlySet<string>;
	/** Países que se pueden elegir. Sin esto, todos. */
	selectableCodes?: ReadonlySet<string>;
	/** El mapa vuela hasta encuadrar estos países cada vez que cambian. Sin esto, el mundo entero. */
	focusCodes?: readonly string[];
	onSelect?: (code: string) => void;
	/** El país que se acaba de tocar por error: se marca en rojo mientras dure. */
	wrongCode?: string;
	/** El país recién acertado o revelado: su bandera aparece en la silueta y se funde con el color. */
	celebrateCode?: string;
	/** Al cambiar, el foco de teclado va al mapa (cada pregunta nueva). */
	autoFocusKey?: string | number;
	/**
	 * Nombre del país para el lector de pantalla al enfocarlo con el teclado.
	 * Durante una pregunta no se pasa: el nombre sería la respuesta (D239).
	 */
	getCountryLabel?: (code: string) => string | undefined;
	className?: string;
}

/** El mapa, y si su descarga falló: `retry` vuelve a pedirlo. */
function useWorldMap() {
	const [worldMap, setWorldMap] = useState<WorldMapData>();
	const [attempt, setAttempt] = useState(0);
	const [failedAttempt, setFailedAttempt] = useState<number>();

	useEffect(() => {
		let isCurrent = true;
		loadWorldMap().then(
			(data) => {
				if (isCurrent) setWorldMap(data);
			},
			() => {
				if (isCurrent) setFailedAttempt(attempt);
			},
		);
		return () => {
			isCurrent = false;
		};
	}, [attempt]);

	return {
		worldMap,
		hasFailed: failedAttempt === attempt,
		retry: () => setAttempt(attempt + 1),
	};
}

function getFill(
	code: string,
	isFound: boolean,
	isSelectable: boolean,
	isWrong = false,
) {
	if (isWrong) return "fill-danger-soft stroke-danger";

	const region = REGION_BY_CODE.get(code);
	if (isFound && region) return `${REGION_FILLS[region]} stroke-surface`;

	// Ni se puede elegir ni está acertado: no es de la partida. Queda de fondo,
	// como el resto de la tierra.
	return isSelectable
		? "fill-surface-border stroke-text-placeholder transition-colors hover:fill-primary-border"
		: "fill-neutral-soft stroke-surface-border";
}

const countryBoxesCache = new WeakMap<WorldMapData, Record<string, Box>>();

/** La caja de cada país con todos sus territorios (la del JSON es solo la del principal). */
function getCountryBoxes(worldMap: WorldMapData): Record<string, Box> {
	let boxes = countryBoxesCache.get(worldMap);
	if (!boxes) {
		boxes = Object.fromEntries(
			Object.entries(worldMap.countries).map(([code, { d, bbox }]) => [
				code,
				getPathBox(d) ?? bbox,
			]),
		);
		countryBoxesCache.set(worldMap, boxes);
	}
	return boxes;
}

/**
 * Cuánto de más se dibuja alrededor de lo que se ve (en veces el tamaño de la
 * vista, por cada lado), y cuánto margen tiene que quedar para no redibujar.
 */
const RENDER_MARGIN_RATIO = 0.5;
const RENDER_SLACK_RATIO = 0.1;
/** Lo que dura un vuelo, y lo que se espera tras el último cambio de escala para volver a dibujar nítido. */
const FLIGHT_MS = 500;
const SETTLE_MS = 160;
/** Diferencia de escala entre lo dibujado y lo que se ve a partir de la cual se redibuja. */
const RASTER_SCALE_TOLERANCE = 0.02;
/**
 * Acercando con la rueda o el pellizco sin parar, a partir de cuántas veces
 * ampliado lo dibujado se redibuja sin esperar a que la vista se quede quieta:
 * más allá las siluetas se ven borrosas.
 */
const RASTER_MAX_UPSCALE = 2;

function prefersReducedMotion() {
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function toTransform(view: MapView, raster: MapRaster, canvas: Size) {
	const { x, y, scale } = getLayerPlacement(view, raster, canvas);
	return `translate(${x}px, ${y}px) scale(${scale})`;
}

function isSameView(a: MapView, b: MapView) {
	return (
		a.scale === b.scale &&
		a.center[0] === b.center[0] &&
		a.center[1] === b.center[1]
	);
}

interface CountryShapesProps {
	countries: WorldMapData["countries"];
	foundCodes: ReadonlySet<string> | undefined;
	selectableCodes: ReadonlySet<string> | undefined;
	wrongCode: string | undefined;
}

/**
 * Las siluetas, todas y siempre montadas: las que caen fuera de la zona
 * dibujada el navegador no las pinta, y crearlas al alejar (150 de golpe al
 * volar de un continente al mundo) era un tirón justo al empezar el vuelo.
 * Con `memo`: redibujar otra zona no las toca.
 */
const CountryShapes = memo(function CountryShapes({
	countries: shapes,
	foundCodes,
	selectableCodes,
	wrongCode,
}: CountryShapesProps) {
	return Object.entries(shapes).map(([code, { d }]) => {
		if (d === "") return null;

		const isSelectable = selectableCodes?.has(code) ?? true;
		return (
			<path
				key={code}
				d={d}
				data-code={isSelectable ? code : undefined}
				vectorEffect="non-scaling-stroke"
				className={`stroke-1 ${getFill(
					code,
					foundCodes?.has(code) ?? false,
					isSelectable,
					code === wrongCode,
				)} ${isSelectable ? "cursor-pointer" : ""}`}
			/>
		);
	});
});

function getSizeOnScreen({ bbox }: WorldMapCountry, scale: number) {
	return Math.max(bbox[2] - bbox[0], bbox[3] - bbox[1]) * scale;
}

interface MapDrawingProps {
	worldMap: WorldMapData;
	raster: MapRaster;
	foundCodes: ReadonlySet<string> | undefined;
	selectableCodes: ReadonlySet<string> | undefined;
	wrongCode: string | undefined;
	celebrateCode: string | undefined;
	/** El país con el foco de teclado, solo mientras se enseña. */
	focusedCode: string | undefined;
}

/**
 * El dibujo del mapa: la zona `raster.box` a `raster.scale` px por unidad.
 * Aparte y con `memo`, y sin nada que dependa de la vista: al arrastrar,
 * ampliar o volar no se toca, el navegador solo mueve y escala la capa que lo
 * contiene, ya pintada. Repintar las siluetas en cada fotograma era lo que
 * hacía lento el mapa (D242). Tamaños en px (puntos, áreas de toque) salen de
 * `raster.scale`: son exactos cuando la vista se asienta.
 */
const MapDrawing = memo(function MapDrawing({
	worldMap,
	raster,
	foundCodes,
	selectableCodes,
	wrongCode,
	celebrateCode,
	focusedCode,
}: MapDrawingProps) {
	const celebrationClipId = useId();
	const { box, scale } = raster;
	const countryBoxes = getCountryBoxes(worldMap);
	const isSelectable = (code: string) => selectableCodes?.has(code) ?? true;

	const dotRadius = MARKER_DOT_PX / 2 / scale;
	const targetRadius = MIN_TARGET_PX / 2 / scale;
	// Los países de fondo (ni elegibles ni acertados) no llevan punto.
	const markers = Object.entries(worldMap.countries).filter(
		([code, country]) =>
			getSizeOnScreen(country, scale) < MARKER_BELOW_PX &&
			(isSelectable(code) || (foundCodes?.has(code) ?? false)) &&
			boxesIntersect(countryBoxes[code], box),
	);
	const focused = focusedCode ? worldMap.countries[focusedCode] : undefined;
	const celebrated = celebrateCode
		? worldMap.countries[celebrateCode]
		: undefined;
	const isCelebratedTiny =
		celebrated !== undefined &&
		(celebrated.d === "" ||
			getSizeOnScreen(celebrated, scale) < MARKER_BELOW_PX);
	// La bandera, una vez por grupo de territorios: así cubre también las islas
	// que quedan fuera de la caja del territorio principal.
	const celebrationBoxes: Box[] = !celebrated
		? []
		: isCelebratedTiny
			? [
					[
						celebrated.centroid[0] - targetRadius,
						celebrated.centroid[1] - targetRadius,
						celebrated.centroid[0] + targetRadius,
						celebrated.centroid[1] + targetRadius,
					],
				]
			: getFlagBoxes(celebrated.d);

	return (
		<svg
			aria-hidden="true"
			focusable="false"
			width={(box[2] - box[0]) * scale}
			height={(box[3] - box[1]) * scale}
			viewBox={`${box[0]} ${box[1]} ${box[2] - box[0]} ${box[3] - box[1]}`}
			className="block"
		>
			<path
				d={worldMap.land}
				vectorEffect="non-scaling-stroke"
				className="fill-neutral-soft stroke-1 stroke-surface-border"
			/>
			<CountryShapes
				countries={worldMap.countries}
				foundCodes={foundCodes}
				selectableCodes={selectableCodes}
				wrongCode={wrongCode}
			/>
			{markers.map(([code, { centroid }]) => (
				<circle
					key={code}
					cx={centroid[0]}
					cy={centroid[1]}
					r={dotRadius}
					vectorEffect="non-scaling-stroke"
					className={`stroke-1 ${getFill(
						code,
						foundCodes?.has(code) ?? false,
						isSelectable(code),
						code === wrongCode,
					)} ${isSelectable(code) ? "cursor-pointer" : ""}`}
				/>
			))}
			{markers.map(
				([code, { centroid }]) =>
					isSelectable(code) && (
						<circle
							key={code}
							cx={centroid[0]}
							cy={centroid[1]}
							r={targetRadius}
							data-code={code}
							className="cursor-pointer fill-transparent"
						/>
					),
			)}
			{celebrated && celebrateCode && (
				// La bandera dentro de la silueta (o del punto, si el país es
				// diminuto): se queda un momento y se funde, dejando el color
				// del continente que ya hay debajo (D240). `key`: cada país
				// vuelve a empezar la animación.
				<g
					key={celebrateCode}
					className="pointer-events-none animate-out fade-out-0 fill-mode-forwards delay-700 duration-700"
				>
					<clipPath id={celebrationClipId}>
						{isCelebratedTiny ? (
							<circle
								cx={celebrated.centroid[0]}
								cy={celebrated.centroid[1]}
								r={targetRadius}
							/>
						) : (
							<path d={celebrated.d} />
						)}
					</clipPath>
					<g clipPath={`url(#${celebrationClipId})`}>
						{celebrationBoxes.map((flagBox) => {
							// El sitio de la imagen se calcula aquí, con la proporción
							// de la bandera, y no con `slice`: con las banderas que
							// traen `viewBox` el navegador la encoge hasta que cabe
							// entera y deja medio país sin cubrir (D242).
							const [x0, y0, x1, y1] = coverBox(
								flagBox,
								getFlagRatio(celebrateCode),
							);
							return (
								<image
									key={flagBox.join(",")}
									href={getFlagUrl(celebrateCode)}
									x={x0}
									y={y0}
									width={x1 - x0}
									height={y1 - y0}
								/>
							);
						})}
					</g>
				</g>
			)}
			{focused && focused.d !== "" && (
				<path
					d={focused.d}
					vectorEffect="non-scaling-stroke"
					className="pointer-events-none fill-none stroke-3 stroke-primary-hover"
				/>
			)}
			{focused && getSizeOnScreen(focused, scale) < MIN_TARGET_PX && (
				<circle
					cx={focused.centroid[0]}
					cy={focused.centroid[1]}
					r={targetRadius}
					vectorEffect="non-scaling-stroke"
					className="pointer-events-none fill-none stroke-3 stroke-primary-hover"
				/>
			)}
		</svg>
	);
});

/**
 * El mapa del mundo: se arrastra, se amplía con pellizco, rueda, botones o
 * teclado, y vuela hasta los países que se le piden. Nunca enseña nada de
 * fuera del mundo (`clampView`).
 *
 * Teclado, con el foco en el mapa: flechas para saltar al país vecino, Enter
 * o Espacio para elegirlo, + y − para ampliar, 0 para ver el mundo entero.
 */
export function WorldMap({ className = "", ...props }: WorldMapProps) {
	const { worldMap, hasFailed, retry } = useWorldMap();
	const containerRef = useRef<HTMLDivElement>(null);
	const [canvas, setCanvas] = useState<Size>();

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const observer = new ResizeObserver(([entry]) => {
			const { width, height } = entry.contentRect;
			if (width > 0 && height > 0) setCanvas({ width, height });
		});
		observer.observe(container);
		return () => observer.disconnect();
	}, []);

	if (!worldMap || !canvas) {
		return (
			<div
				ref={containerRef}
				className={`relative flex size-full flex-col items-center justify-center gap-3 overflow-hidden rounded-xl bg-background p-4 text-center ${className}`}
			>
				{/* Sin el mapa no se puede jugar: se dice y se ofrece reintentar. */}
				{hasFailed && !worldMap && (
					<>
						<FeedbackMessage variant="danger" role="alert">
							No se pudo cargar el mapa. Revisa tu conexión.
						</FeedbackMessage>
						<Button
							type="button"
							variant="outline"
							color="neutral"
							onClick={retry}
						>
							Reintentar
						</Button>
					</>
				)}
			</div>
		);
	}

	return (
		<div
			ref={containerRef}
			className={`relative size-full overflow-hidden rounded-xl bg-background ${className}`}
		>
			<MapCanvas {...props} worldMap={worldMap} canvas={canvas} />
		</div>
	);
}

interface MapCanvasProps extends Omit<WorldMapProps, "className"> {
	worldMap: WorldMapData;
	canvas: Size;
}

/** El mapa ya cargado y con el tamaño de su lienzo medido. */
function MapCanvas({
	worldMap,
	canvas,
	label,
	foundCodes,
	selectableCodes,
	focusCodes,
	onSelect,
	wrongCode,
	celebrateCode,
	autoFocusKey,
	getCountryLabel,
}: MapCanvasProps) {
	const surfaceRef = useRef<HTMLDivElement>(null);
	const layerRef = useRef<HTMLDivElement>(null);
	/** `undefined` = el mundo entero, sea cual sea el tamaño del lienzo. */
	const [view, setView] = useState<MapView>();
	/** Los vuelos y el teclado se animan; arrastrar y pellizcar siguen al dedo sin retraso. */
	const [isAnimated, setIsAnimated] = useState(false);
	const [focusedCode, setFocusedCode] = useState<string>();
	const [hasKeyboardFocus, setHasKeyboardFocus] = useState(false);
	/** A qué países se voló por última vez; `undefined` = todavía a ninguno. */
	const [flownKey, setFlownKey] = useState<string>();
	/** Lo que está dibujado; `undefined` = hay que volver a dibujar para la vista de ahora. */
	const [raster, setRaster] = useState<MapRaster>();
	const pointers = useRef(new Map<number, Point>());
	const hasDragged = useRef(false);
	/** El vuelo en marcha, y la vista y el dibujo del último render, de donde sale el siguiente vuelo. */
	const flight = useRef<Animation>(undefined);
	const shown = useRef<{ view: MapView; raster: MapRaster }>(undefined);

	// Cada pregunta nueva deja el foco en el mapa: se puede seguir con las
	// flechas sin volver a tabular hasta él.
	useEffect(() => {
		if (autoFocusKey !== undefined) focusWhenVisible(surfaceRef.current);
	}, [autoFocusKey]);

	// La rueda necesita `preventDefault` (si no, se desplaza la página), y eso
	// solo se puede con un listener no pasivo: React los registra pasivos.
	useEffect(() => {
		const surface = surfaceRef.current;
		if (!surface) return;

		const onWheel = (event: WheelEvent) => {
			event.preventDefault();
			const rect = surface.getBoundingClientRect();
			const anchor: Point = [
				event.clientX - rect.left,
				event.clientY - rect.top,
			];
			setIsAnimated(false);
			setView((current) =>
				zoomAt(
					current ?? getWorldView(worldMap, canvas),
					Math.exp(-event.deltaY * WHEEL_ZOOM_RATE),
					anchor,
					worldMap,
					canvas,
				),
			);
		};
		surface.addEventListener("wheel", onWheel, { passive: false });
		return () => surface.removeEventListener("wheel", onWheel);
	}, [worldMap, canvas]);

	// Vuelo a `focusCodes`: al llegar el mapa y cada vez que cambian. Se
	// ajusta durante el render y no en un efecto, así no hay un fotograma con
	// la vista vieja; un cambio de tamaño del lienzo no lo repite (no debe
	// deshacer lo que el jugador amplió).
	const focusKey = focusCodes?.join(",") ?? "";
	const isFlightPending = flownKey !== focusKey;
	if (isFlightPending) {
		const box = getFocusBox(
			(focusCodes ?? [])
				.map((code) => worldMap.countries[code]?.bbox)
				.filter((bbox) => bbox !== undefined),
		);
		// Un país solo (o dos pegados) no se encuadra a ras: se abre la caja.
		if (box) {
			const growX = Math.max(MIN_FOCUS_SIZE - (box[2] - box[0]), 0) / 2;
			const growY = Math.max(MIN_FOCUS_SIZE - (box[3] - box[1]), 0) / 2;
			box[0] -= growX;
			box[2] += growX;
			box[1] -= growY;
			box[3] += growY;
		}
		setFlownKey(focusKey);
		setIsAnimated(true);
		setView(box ? fitBox(box, worldMap, canvas, FIT_PADDING_PX) : undefined);
	}

	const current = clampView(
		view ?? getWorldView(worldMap, canvas),
		worldMap,
		canvas,
	);
	// El mapa se dibuja una vez, la zona que se ve y un margen, y al mover la
	// vista el navegador solo desplaza y escala esa capa ya pintada. Se vuelve a
	// dibujar cuando la vista se acerca al borde de lo dibujado (al arrastrar o
	// alejar) y, ya quieta, cuando su escala no es la de lo dibujado: tras
	// acercar, las siluetas se ven un momento ampliadas y enseguida nítidas.
	// Solo se crean las siluetas de esa zona: con un continente encuadrado, tres
	// de cada cuatro países no se ven.
	const mapBox: Box = [0, 0, worldMap.width, worldMap.height];
	const halfWidth = canvas.width / 2 / current.scale;
	const halfHeight = canvas.height / 2 / current.scale;
	const viewBox: Box = [
		current.center[0] - halfWidth,
		current.center[1] - halfHeight,
		current.center[0] + halfWidth,
		current.center[1] + halfHeight,
	];
	const wanted: MapRaster = {
		box: clampBox(expandBox(viewBox, RENDER_MARGIN_RATIO), mapBox),
		scale: current.scale,
	};
	let drawn = raster ?? wanted;
	// Con un vuelo recién pedido, este render aún lleva la vista vieja (el
	// `setView` de arriba lo repite): lo dibujado se decide en el siguiente.
	if (
		!isFlightPending &&
		(!raster ||
			!containsBox(
				raster.box,
				clampBox(expandBox(viewBox, RENDER_SLACK_RATIO), mapBox),
			) ||
			(!isAnimated && current.scale > raster.scale * RASTER_MAX_UPSCALE))
	) {
		drawn = wanted;
		setRaster(wanted);
	}
	const isRasterStale =
		Math.abs(drawn.scale / current.scale - 1) > RASTER_SCALE_TOLERANCE;

	// Vista quieta con el dibujo a otra escala: se redibuja. Cada cambio de
	// vista reinicia la espera; un vuelo, además, tiene que haber terminado.
	// biome-ignore lint/correctness/useExhaustiveDependencies: la vista no se lee, reinicia la espera
	useEffect(() => {
		if (!isRasterStale) return;

		const timeout = window.setTimeout(
			() => setRaster(undefined),
			isAnimated ? FLIGHT_MS + SETTLE_MS : SETTLE_MS,
		);
		return () => window.clearTimeout(timeout);
	}, [
		isRasterStale,
		isAnimated,
		current.center[0],
		current.center[1],
		current.scale,
	]);

	// Los vuelos: una animación de la capa desde donde se ve ahora hasta la
	// vista nueva. La lleva el navegador sin repintar el mapa, por eso va fluida
	// aunque haya que enseñar el mundo entero. Si lo dibujado cambia a la vez
	// (al alejar hace falta más mapa), el punto de partida se traduce a la capa
	// nueva.
	// biome-ignore lint/correctness/useExhaustiveDependencies: `current` y `drawn` son objetos nuevos en cada render; se depende de sus valores
	useLayoutEffect(() => {
		const layer = layerRef.current;
		if (!layer) return;

		const previous = shown.current;
		shown.current = { view: current, raster: drawn };

		let from = previous?.view;
		if (previous && flight.current?.playState === "running") {
			// A medio vuelo: se parte de donde va, no de donde iba a acabar.
			const { a, e, f } = new DOMMatrixReadOnly(
				getComputedStyle(layer).transform,
			);
			from = getViewFromPlacement(
				{ x: e, y: f, scale: a },
				previous.raster,
				canvas,
			);
		}
		flight.current?.cancel();
		flight.current = undefined;

		if (
			!isAnimated ||
			!from ||
			isSameView(from, current) ||
			prefersReducedMotion()
		) {
			return;
		}

		flight.current = layer.animate(
			[
				{ transform: toTransform(from, drawn, canvas) },
				{ transform: toTransform(current, drawn, canvas) },
			],
			{ duration: FLIGHT_MS, easing: "ease-out" },
		);
	}, [
		current.center[0],
		current.center[1],
		current.scale,
		drawn.box[0],
		drawn.box[1],
		drawn.box[2],
		drawn.box[3],
		drawn.scale,
		isAnimated,
		canvas,
	]);

	const isSelectable = (code: string) => selectableCodes?.has(code) ?? true;
	const candidates = Object.entries(worldMap.countries)
		.filter(([code]) => isSelectable(code))
		.map(([code, { centroid }]) => ({ code, point: centroid }));
	const focused = focusedCode ? worldMap.countries[focusedCode] : undefined;
	const updateView = (
		update: (current: MapView) => MapView,
		animated: boolean,
	) => {
		setIsAnimated(animated);
		setView((previous) =>
			update(
				clampView(previous ?? getWorldView(worldMap, canvas), worldMap, canvas),
			),
		);
	};

	const zoomBy = (factor: number) => {
		// Con un país enfocado por teclado se amplía hacia él; si no, hacia el centro.
		const anchor: Point =
			hasKeyboardFocus && focused
				? toScreen(focused.centroid, current, canvas)
				: [canvas.width / 2, canvas.height / 2];
		updateView((v) => zoomAt(v, factor, anchor, worldMap, canvas), true);
	};

	const showWorld = () => {
		setIsAnimated(true);
		setView(undefined);
	};

	const getPoint = (event: ReactPointerEvent): Point => {
		const rect = event.currentTarget.getBoundingClientRect();
		return [event.clientX - rect.left, event.clientY - rect.top];
	};

	const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
		if (pointers.current.size === 0) hasDragged.current = false;
		setHasKeyboardFocus(false);
		pointers.current.set(event.pointerId, getPoint(event));
		event.currentTarget.setPointerCapture(event.pointerId);
	};

	const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
		const previous = pointers.current.get(event.pointerId);
		if (!previous) return;

		const point = getPoint(event);
		const others = [...pointers.current.entries()].filter(
			([id]) => id !== event.pointerId,
		);

		if (others.length === 0) {
			const moved = Math.hypot(point[0] - previous[0], point[1] - previous[1]);
			if (!hasDragged.current && moved < DRAG_THRESHOLD_PX) return;

			hasDragged.current = true;
			pointers.current.set(event.pointerId, point);
			updateView(
				(v) =>
					panBy(
						v,
						point[0] - previous[0],
						point[1] - previous[1],
						worldMap,
						canvas,
					),
				false,
			);
			return;
		}

		// Pellizco: la distancia entre los dos dedos da la ampliación y su
		// punto medio, hacia dónde. El punto medio también arrastra.
		const [, other] = others[0];
		const distanceBefore = Math.hypot(
			previous[0] - other[0],
			previous[1] - other[1],
		);
		const distanceAfter = Math.hypot(point[0] - other[0], point[1] - other[1]);
		const middleBefore: Point = [
			(previous[0] + other[0]) / 2,
			(previous[1] + other[1]) / 2,
		];
		const middleAfter: Point = [
			(point[0] + other[0]) / 2,
			(point[1] + other[1]) / 2,
		];
		hasDragged.current = true;
		pointers.current.set(event.pointerId, point);
		if (distanceBefore === 0) return;

		updateView(
			(v) =>
				panBy(
					zoomAt(
						v,
						distanceAfter / distanceBefore,
						middleBefore,
						worldMap,
						canvas,
					),
					middleAfter[0] - middleBefore[0],
					middleAfter[1] - middleBefore[1],
					worldMap,
					canvas,
				),
			false,
		);
	};

	const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
		const wasTracked = pointers.current.delete(event.pointerId);
		if (!wasTracked || hasDragged.current || event.type !== "pointerup") {
			return;
		}

		// Con el puntero capturado, el `click` llegaría al <svg> y no al país:
		// se busca a mano qué hay bajo el dedo.
		const code = document
			.elementFromPoint(event.clientX, event.clientY)
			?.closest("[data-code]")
			?.getAttribute("data-code");
		if (code && event.currentTarget.contains(document.activeElement)) {
			setFocusedCode(code);
		}
		if (code) onSelect?.(code);
	};

	const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
		const direction = ARROW_DIRECTIONS[event.key];
		if (direction) {
			event.preventDefault();
			// Tras un clic el foco no es `:focus-visible`: la primera flecha
			// ya es teclado y el país enfocado tiene que verse.
			setHasKeyboardFocus(true);
			const next = focused
				? findNeighbor(
						focused.centroid,
						direction,
						candidates.filter(({ code }) => code !== focusedCode),
					)
				: findClosest(current.center, candidates);
			if (!next) return;

			setFocusedCode(next);
			const { centroid } = worldMap.countries[next];
			if (!isVisible(centroid, current, canvas, FIT_PADDING_PX)) {
				updateView((v) => ({ ...v, center: centroid }), true);
			}
			return;
		}

		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			if (focusedCode) onSelect?.(focusedCode);
		} else if (event.key === "+" || event.key === "=") {
			event.preventDefault();
			zoomBy(ZOOM_STEP);
		} else if (event.key === "-") {
			event.preventDefault();
			zoomBy(1 / ZOOM_STEP);
		} else if (event.key === "0") {
			event.preventDefault();
			showWorld();
		}
	};

	const isFocusShown = hasKeyboardFocus && focused !== undefined;
	const instructionsId = "world-map-instructions";

	return (
		<>
			<div
				ref={surfaceRef}
				role="application"
				aria-label={label}
				aria-describedby={instructionsId}
				// biome-ignore lint/a11y/noNoninteractiveTabindex: `role="application"`: el mapa entero es un solo control de teclado (D239)
				tabIndex={0}
				className="absolute inset-0 touch-none select-none overflow-hidden rounded-xl -outline-offset-2 outline-primary-hover focus-visible:outline-2"
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={onPointerUp}
				onPointerCancel={onPointerUp}
				onKeyDown={onKeyDown}
				onFocus={(event) =>
					setHasKeyboardFocus(event.currentTarget.matches(":focus-visible"))
				}
				onBlur={() => setHasKeyboardFocus(false)}
			>
				{/* La capa que se mueve: `will-change-transform` le da al navegador
				    su propia textura, que desplaza y escala sin repintar. */}
				<div
					ref={layerRef}
					style={{ transform: toTransform(current, drawn, canvas) }}
					className="absolute top-0 left-0 origin-top-left will-change-transform"
				>
					<MapDrawing
						worldMap={worldMap}
						raster={drawn}
						foundCodes={foundCodes}
						selectableCodes={selectableCodes}
						wrongCode={wrongCode}
						celebrateCode={celebrateCode}
						focusedCode={isFocusShown ? focusedCode : undefined}
					/>
				</div>
			</div>

			<p id={instructionsId} className="sr-only">
				Flechas para moverte entre países, Enter para elegir, más y menos para
				ampliar, cero para ver todo el mundo.
			</p>
			<p aria-live="polite" className="sr-only">
				{(isFocusShown && focusedCode && getCountryLabel?.(focusedCode)) || ""}
			</p>

			<div className="absolute right-2 bottom-2 flex flex-col gap-1">
				<Button
					isIconOnly
					color="neutral"
					variant="soft"
					aria-label="Acercar"
					onClick={() => zoomBy(ZOOM_STEP)}
				>
					<Plus aria-hidden="true" />
				</Button>
				<Button
					isIconOnly
					color="neutral"
					variant="soft"
					aria-label="Alejar"
					onClick={() => zoomBy(1 / ZOOM_STEP)}
				>
					<Minus aria-hidden="true" />
				</Button>
				<Button
					isIconOnly
					color="neutral"
					variant="soft"
					aria-label="Ver todo el mundo"
					onClick={showWorld}
				>
					<Globe aria-hidden="true" />
				</Button>
			</div>
		</>
	);
}
