import { Globe, Minus, Plus } from "iconoir-react";
import type {
	KeyboardEvent as ReactKeyboardEvent,
	PointerEvent as ReactPointerEvent,
} from "react";
import { memo, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { countries } from "@/data/countries";
import type { Region } from "@/types/country";
import type { WorldMapCountry, WorldMapData } from "@/types/world-map";
import {
	clampView,
	type Direction,
	findClosest,
	findNeighbor,
	fitBox,
	getFocusBox,
	getWorldView,
	isVisible,
	type MapView,
	type Point,
	panBy,
	type Size,
	toScreen,
	zoomAt,
} from "@/utils/map-viewport";

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
	/**
	 * Nombre del país para el lector de pantalla al enfocarlo con el teclado.
	 * Durante una pregunta no se pasa: el nombre sería la respuesta (D239).
	 */
	getCountryLabel?: (code: string) => string | undefined;
	className?: string;
}

let worldMapPromise: Promise<WorldMapData> | undefined;

/** El mapa pesa ~100 KB comprimido: se pide solo cuando hace falta, una vez. */
function loadWorldMap(): Promise<WorldMapData> {
	worldMapPromise ??= import("@/data/world-map.json").then(
		(module) => module.default as unknown as WorldMapData,
	);
	return worldMapPromise;
}

function useWorldMap(): WorldMapData | undefined {
	const [worldMap, setWorldMap] = useState<WorldMapData>();

	useEffect(() => {
		let isCurrent = true;
		loadWorldMap().then((data) => {
			if (isCurrent) setWorldMap(data);
		});
		return () => {
			isCurrent = false;
		};
	}, []);

	return worldMap;
}

function getFill(code: string, isFound: boolean, isSelectable: boolean) {
	const region = REGION_BY_CODE.get(code);
	if (isFound && region) return `${REGION_FILLS[region]} stroke-surface`;

	return isSelectable
		? "fill-surface-border stroke-text-placeholder hover:fill-primary-border"
		: "fill-surface-border stroke-text-placeholder";
}

interface CountryShapesProps {
	countries: WorldMapData["countries"];
	foundCodes: ReadonlySet<string> | undefined;
	selectableCodes: ReadonlySet<string> | undefined;
}

/**
 * Las 197 siluetas. Aparte y con `memo`: al arrastrar o ampliar solo cambia
 * la transformación del grupo que las contiene, no ellas.
 */
const CountryShapes = memo(function CountryShapes({
	countries: shapes,
	foundCodes,
	selectableCodes,
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
				className={`stroke-1 transition-colors ${getFill(
					code,
					foundCodes?.has(code) ?? false,
					isSelectable,
				)} ${isSelectable ? "cursor-pointer" : ""}`}
			/>
		);
	});
});

function getSizeOnScreen({ bbox }: WorldMapCountry, scale: number) {
	return Math.max(bbox[2] - bbox[0], bbox[3] - bbox[1]) * scale;
}

/**
 * El mapa del mundo: se arrastra, se amplía con pellizco, rueda, botones o
 * teclado, y vuela hasta los países que se le piden. Nunca enseña nada de
 * fuera del mundo (`clampView`).
 *
 * Teclado, con el foco en el mapa: flechas para saltar al país vecino, Enter
 * o Espacio para elegirlo, + y − para ampliar, 0 para ver el mundo entero.
 */
export function WorldMap({
	label,
	foundCodes,
	selectableCodes,
	focusCodes,
	onSelect,
	getCountryLabel,
	className = "",
}: WorldMapProps) {
	const worldMap = useWorldMap();
	const containerRef = useRef<HTMLDivElement>(null);
	const svgRef = useRef<SVGSVGElement>(null);
	const [canvas, setCanvas] = useState<Size>();
	/** `undefined` = el mundo entero, sea cual sea el tamaño del lienzo. */
	const [view, setView] = useState<MapView>();
	/** Los vuelos y el teclado se animan; arrastrar y pellizcar siguen al dedo sin retraso. */
	const [isAnimated, setIsAnimated] = useState(false);
	const [focusedCode, setFocusedCode] = useState<string>();
	const [hasKeyboardFocus, setHasKeyboardFocus] = useState(false);
	/** A qué países se voló por última vez; `undefined` = todavía a ninguno. */
	const [flownKey, setFlownKey] = useState<string>();
	const pointers = useRef(new Map<number, Point>());
	const hasDragged = useRef(false);

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

	// La rueda necesita `preventDefault` (si no, se desplaza la página), y eso
	// solo se puede con un listener no pasivo: React los registra pasivos.
	useEffect(() => {
		const svg = svgRef.current;
		if (!svg || !worldMap || !canvas) return;

		const onWheel = (event: WheelEvent) => {
			event.preventDefault();
			const rect = svg.getBoundingClientRect();
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
		svg.addEventListener("wheel", onWheel, { passive: false });
		return () => svg.removeEventListener("wheel", onWheel);
	}, [worldMap, canvas]);

	if (!worldMap || !canvas) {
		return (
			<div
				ref={containerRef}
				className={`relative size-full overflow-hidden rounded-xl bg-background ${className}`}
			/>
		);
	}

	// Vuelo a `focusCodes`: al llegar el mapa y cada vez que cambian. Se
	// ajusta durante el render y no en un efecto, así no hay un fotograma con
	// la vista vieja; un cambio de tamaño del lienzo no lo repite (no debe
	// deshacer lo que el jugador amplió).
	const focusKey = focusCodes?.join(",") ?? "";
	if (flownKey !== focusKey) {
		const box = getFocusBox(
			(focusCodes ?? [])
				.map((code) => worldMap.countries[code]?.bbox)
				.filter((bbox) => bbox !== undefined),
		);
		setFlownKey(focusKey);
		setIsAnimated(true);
		setView(box ? fitBox(box, worldMap, canvas, FIT_PADDING_PX) : undefined);
	}

	const current = clampView(
		view ?? getWorldView(worldMap, canvas),
		worldMap,
		canvas,
	);
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

	const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
		if (pointers.current.size === 0) hasDragged.current = false;
		setHasKeyboardFocus(false);
		pointers.current.set(event.pointerId, getPoint(event));
		event.currentTarget.setPointerCapture(event.pointerId);
	};

	const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
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

	const onPointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
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

	const onKeyDown = (event: ReactKeyboardEvent<SVGSVGElement>) => {
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

	const [tx, ty] = toScreen([0, 0], current, canvas);
	const dotRadius = MARKER_DOT_PX / 2 / current.scale;
	const targetRadius = MIN_TARGET_PX / 2 / current.scale;
	const markers = Object.entries(worldMap.countries).filter(
		([, country]) => getSizeOnScreen(country, current.scale) < MARKER_BELOW_PX,
	);
	const isFocusShown = hasKeyboardFocus && focused !== undefined;
	const instructionsId = "world-map-instructions";

	return (
		<div
			ref={containerRef}
			className={`relative size-full overflow-hidden rounded-xl bg-background ${className}`}
		>
			<svg
				ref={svgRef}
				role="application"
				aria-label={label}
				aria-describedby={instructionsId}
				// biome-ignore lint/a11y/noNoninteractiveTabindex: `role="application"`: el mapa entero es un solo control de teclado (D239)
				tabIndex={0}
				width={canvas.width}
				height={canvas.height}
				viewBox={`0 0 ${canvas.width} ${canvas.height}`}
				className="block touch-none select-none rounded-xl -outline-offset-2 outline-primary-hover focus-visible:outline-2"
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
				<g
					style={{
						transform: `translate(${tx}px, ${ty}px) scale(${current.scale})`,
					}}
					className={
						isAnimated ? "transition-transform duration-500 ease-out" : ""
					}
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
					{isFocusShown && focused.d !== "" && (
						<path
							d={focused.d}
							vectorEffect="non-scaling-stroke"
							className="pointer-events-none fill-none stroke-3 stroke-primary-hover"
						/>
					)}
					{isFocusShown &&
						getSizeOnScreen(focused, current.scale) < MIN_TARGET_PX && (
							<circle
								cx={focused.centroid[0]}
								cy={focused.centroid[1]}
								r={targetRadius}
								vectorEffect="non-scaling-stroke"
								className="pointer-events-none fill-none stroke-3 stroke-primary-hover"
							/>
						)}
				</g>
			</svg>

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
		</div>
	);
}
