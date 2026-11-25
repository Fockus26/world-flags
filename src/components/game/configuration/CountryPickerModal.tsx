import { NavArrowDown } from "iconoir-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { countries } from "@/data/countries";
import { REGION_LABELS, REGIONS, type Region } from "@/types/country";
import { isCatalogCountryCode } from "@/utils/country-catalog";
import {
	applyRangeSelection,
	getVisibleCountryOrder,
} from "@/utils/country-range";
import { focusAfterRemoval } from "@/utils/focus";

interface CountryPickerModalProps {
	isOpen: boolean;
	onClose: () => void;
	initialSelectedCodes: string[];
	/** Si se da, los países para los que devuelve `true` se muestran ya marcados y deshabilitados. */
	isCountryDisabled?: (countryCode: string) => boolean;
	onConfirm: (countryCodes: string[]) => void;
}

const spanishCollator = new Intl.Collator("es", { sensitivity: "base" });

/** Botones del pie (D223): ver el comentario de la fila, abajo. */
const FOOTER_BUTTON =
	"h-auto min-h-11 min-w-min flex-1 whitespace-normal text-center hyphens-auto wrap-break-word md:min-h-10";

const countriesByRegion = REGIONS.reduce(
	(map, region) => {
		map[region] = countries
			.filter((country) => country.region === region)
			.sort((first, second) =>
				spanishCollator.compare(first.name, second.name),
			);
		return map;
	},
	{} as Record<Region, typeof countries>,
);

/** Códigos de cada continente en el orden de su rejilla, para el rango con Shift (D233). */
const codesByRegion = Object.fromEntries(
	REGIONS.map((region) => [
		region,
		countriesByRegion[region].map((country) => country.code),
	]),
) as Record<Region, string[]>;

interface CountryCheckboxProps {
	label: string;
	checked: boolean;
	disabled?: boolean;
	/** `withShift`: Shift pulsado (clic o Shift+Espacio) para marcar un rango (D233). */
	onToggle: (withShift: boolean) => void;
}

function CountryCheckbox({
	label,
	checked,
	disabled,
	onToggle,
}: CountryCheckboxProps) {
	// Nombres largos (D169): hasta dos líneas con `line-clamp-2` en vez de
	// `truncate` ("San Vicente y las Granadinas" se leía cortado a 320 px y a
	// 34 rem). La casilla se alinea con la primera línea (`items-start` y
	// `mt-px`: con `leading-snug` la línea mide 18 px y la casilla 16 px), así
	// en una fila de la rejilla con un nombre en dos líneas las demás casillas
	// siguen a la misma altura. Con tres o más líneas, "…" al final de la
	// segunda.
	//
	// Área de clic (D187): la etiqueta llena su celda de la rejilla, que ya no
	// tiene `gap` (la separación es su propio padding), así no queda hueco
	// muerto entre opciones. En móvil (por debajo de `sm`) mide 44 px y centra
	// casilla y nombre: todas las celdas de una fila miden lo mismo, así que
	// las casillas siguen a la misma altura aunque un nombre ocupe dos líneas.
	// Desde `sm` vuelve a la alineación de arriba de D169.
	//
	// `select-none` (D242): con Shift, el clic del navegador extiende la
	// selección de texto desde el clic anterior; los nombres quedaban resaltados
	// y el primer Shift+clic no marcaba el rango.
	return (
		<label
			className={`relative flex min-h-11 min-w-0 select-none items-center gap-1.5 rounded-sm px-1.5 text-label leading-snug transition-colors sm:min-h-0 sm:items-start sm:py-1 ${disabled ? "cursor-not-allowed text-text-placeholder" : "cursor-pointer hover:bg-surface-hover"}`}
		>
			<input
				type="checkbox"
				checked={checked}
				disabled={disabled}
				// React avisa del cambio de una casilla desde su `click`, que
				// trae `shiftKey` también cuando se activa con Shift+Espacio.
				onChange={(event) => {
					const { nativeEvent } = event;
					onToggle("shiftKey" in nativeEvent && nativeEvent.shiftKey === true);
				}}
				className="peer absolute size-px opacity-0"
			/>
			<span
				aria-hidden="true"
				className="relative flex size-4 shrink-0 items-center justify-center rounded-xs border-2 border-neutral-border bg-surface transition-colors duration-150 after:text-micro after:leading-none after:font-black after:text-secondary-soft after:opacity-0 after:content-['✓'] sm:mt-px peer-checked:border-secondary peer-checked:bg-secondary peer-checked:after:opacity-100 peer-disabled:border-neutral-hover peer-disabled:bg-neutral-hover peer-disabled:after:text-neutral-soft peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-secondary-hover"
			/>
			{/* Sin `line-clamp` (D223): con el texto al 200 % el nombre quedaba
			    en dos líneas de dos o tres letras y puntos suspensivos ("Ca n…").
			    Un nombre largo ocupa las líneas que necesite. */}
			<span className="min-w-0 wrap-break-word">
				{label}
				{disabled && " · hoy"}
			</span>
		</label>
	);
}

const REGION_BULK_LABELS = ["Ninguno", "Todos"] as const;

interface RegionBulkButtonProps {
	label: (typeof REGION_BULK_LABELS)[number];
	region: Region;
	/** Nombre del continente, para el nombre accesible. */
	regionName: string;
	onPress: () => void;
}

/**
 * "Ninguno"/"Todos" de la cabecera de un continente (D191). Las dos palabras
 * se apilan en la misma celda de un `grid` y la que no toca queda
 * `invisible` (fuera del nombre accesible), así los dos botones miden lo que
 * la más larga y al cambiar uno por otro la fila no salta.
 *
 * Tenues en reposo: `font-semibold` y `text-placeholder` (4,71:1 sobre
 * `surface-hover` en claro, 5,89:1 en oscuro). Con el puntero encima vuelve
 * el acento (`secondary-hover`, 5,69:1 sobre `surface` en claro) junto con
 * el fondo, así el hover no depende solo del color.
 *
 * Nombre accesible con el continente (WCAG 2.4.6): con ocho filas, ocho
 * "Todos" iguales no se distinguen en la lista de botones del lector. Empieza
 * por la palabra visible para cumplir también "etiqueta en el nombre" (2.5.3).
 */
function RegionBulkButton({
	label,
	region,
	regionName,
	onPress,
}: RegionBulkButtonProps) {
	const accessibleName =
		label === "Todos"
			? `Todos: marcar los países de ${regionName}`
			: `Ninguno: desmarcar los países de ${regionName}`;

	return (
		<button
			type="button"
			data-region-bulk={region}
			aria-label={accessibleName}
			className="grid cursor-pointer place-items-center border-0 bg-transparent px-2.5 text-tiny font-semibold text-text-placeholder transition-colors hover:bg-surface hover:text-secondary-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-secondary-hover"
			onClick={(event) => {
				const pressed = event.currentTarget;
				onPress();
				// Al pulsarlo puede desmontarse ("Todos" con todo marcado,
				// "Ninguno" con nada): el foco pasa al que queda (P54).
				focusAfterRemoval(pressed, () =>
					document.querySelector<HTMLElement>(`[data-region-bulk="${region}"]`),
				);
			}}
		>
			{REGION_BULK_LABELS.map((word) => (
				<span
					key={word}
					className={`col-start-1 row-start-1${word === label ? "" : " invisible"}`}
					aria-hidden={word === label ? undefined : true}
				>
					{word}
				</span>
			))}
		</button>
	);
}

export function CountryPickerModal({
	isOpen,
	onClose,
	initialSelectedCodes,
	isCountryDisabled,
	onConfirm,
}: CountryPickerModalProps) {
	const [selected, setSelected] = useState<Set<string>>(
		() => new Set(initialSelectedCodes),
	);
	const [expandedRegions, setExpandedRegions] = useState<Set<Region>>(
		new Set(),
	);
	// Última casilla pulsada: el ancla del Shift+clic (D233).
	const rangeAnchorRef = useRef<string | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: solo se resetea al abrir, no en cada cambio de la selección inicial
	useEffect(() => {
		if (!isOpen) return;
		// Los ya practicados hoy no se muestran como elegidos: quedan
		// excluidos de la sesión de todas formas, y así el checkbox
		// bloqueado siempre se ve destildado, no tildado-y-bloqueado.
		const initialSet = new Set(
			initialSelectedCodes.filter((code) => !isCountryDisabled?.(code)),
		);
		setSelected(initialSet);
		rangeAnchorRef.current = null;
		// Se abren de entrada los continentes que ya tienen algo elegido.
		setExpandedRegions(
			new Set(
				REGIONS.filter((region) =>
					countriesByRegion[region].some((c) => initialSet.has(c.code)),
				),
			),
		);
	}, [isOpen]);

	function toggleRegionExpanded(region: Region) {
		setExpandedRegions((current) => {
			const next = new Set(current);
			if (next.has(region)) {
				next.delete(region);
			} else {
				next.add(region);
			}
			return next;
		});
	}

	function toggleCountry(code: string, withShift: boolean) {
		if (isCountryDisabled?.(code)) return;

		const anchor = rangeAnchorRef.current;
		rangeAnchorRef.current = code;

		// Shift (D233): del ancla a esta, en el orden visible, saltando las de
		// «hoy». Sin ancla visible, un clic normal.
		if (withShift) {
			const order = getVisibleCountryOrder(
				REGIONS,
				expandedRegions,
				codesByRegion,
			);
			const ranged = applyRangeSelection(selected, order, anchor, code, (c) =>
				Boolean(isCountryDisabled?.(c)),
			);
			if (ranged) {
				setSelected(ranged);
				return;
			}
		}

		setSelected((current) => {
			const next = new Set(current);
			if (next.has(code)) {
				next.delete(code);
			} else {
				next.add(code);
			}
			return next;
		});
	}

	function toggleAllInRegion(regionCodes: string[], allSelected: boolean) {
		const selectableCodes = regionCodes.filter(
			(code) => !isCountryDisabled?.(code),
		);
		setSelected((current) => {
			const next = new Set(current);
			for (const code of selectableCodes) {
				if (allSelected) {
					next.delete(code);
				} else {
					next.add(code);
				}
			}
			return next;
		});
	}

	function handleConfirm() {
		onConfirm([...selected]);
		onClose();
	}

	function clearAll() {
		setSelected((current) => {
			// Conserva solo los ya practicados hoy (deshabilitados), si los hubiera.
			const next = new Set<string>();
			for (const code of current) {
				if (isCountryDisabled?.(code)) next.add(code);
			}
			return next;
		});
	}

	// `selected` conserva los códigos que el catálogo no conoce (vienen del
	// scope guardado y vuelven intactos en `onConfirm`), pero no se cuentan:
	// no hay casilla que los muestre.
	const selectedCatalogCount = [...selected].filter(
		isCatalogCountryCode,
	).length;

	// Ancho (D162): 34 rem, con `max-w-none` para quitar el tope de 28 rem de
	// `modal__dialog--md` (como el ranking, D150); sin él, el 34 rem nunca se
	// aplicaba. A 320 px sigue mandando el 92vw.
	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			className="w-dialog-wide max-w-none text-left"
			ariaLabelledby="country-picker-title"
		>
			<ModalHeader
				titleId="country-picker-title"
				title="Elegir países"
				onClose={onClose}
			/>

			{/* Con el texto al 200 % a 320 px (D220) "Limpiar todo" no cabe al
			    lado del texto y baja de línea, a la derecha. Igual que en
			    `ModalHeader` (D216): el texto entra con su palabra más larga y
			    crece hasta llenar la fila, así que a tamaño normal no cambia. */}
			<div className="mt-0 mb-3 flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
				<p className="min-w-0 max-w-max grow basis-[min-content] text-label text-text-placeholder">
					Elige los países que quieres practicar. Cuentan como práctica solo
					ellos, no todo el continente. Los ya practicados hoy aparecen
					bloqueados.
				</p>
				{selectedCatalogCount > 0 && (
					<button
						type="button"
						onClick={clearAll}
						className="ml-auto shrink-0 cursor-pointer whitespace-nowrap rounded-sm px-1 text-caption font-bold text-secondary-hover underline-offset-2 transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-hover"
					>
						Limpiar todo ({selectedCatalogCount})
					</button>
				)}
			</div>

			<div className="flex flex-col gap-1.5">
				{REGIONS.map((region) => {
					const regionCountries = countriesByRegion[region];
					const regionCodes = regionCountries.map((country) => country.code);
					const selectedCount = regionCodes.filter((code) =>
						selected.has(code),
					).length;
					const allSelected = selectedCount === regionCodes.length;
					const isExpanded = expandedRegions.has(region);

					return (
						<section
							key={region}
							className="shrink-0 overflow-hidden rounded-md border border-surface-border"
						>
							{/* Área de clic (D187): sin padding en la fila; el botón de
							    desplegar la ocupa entera (alto completo y desde el borde
							    izquierdo hasta "Ninguno"/"Todos"), y estos también llegan
							    de arriba abajo. 44 px en móvil. El anillo de foco va por
							    dentro (`-outline-offset-2`): la sección recorta lo que
							    sale de su borde.
							    El nombre del continente no se recorta (D220): si no cabe
							    entero al lado de "Ninguno"/"Todos" (320 px, o texto al
							    200 %), esos bajan a una segunda línea, a la derecha. El
							    botón entra con su ancho en una línea (`basis-auto`) y
							    crece; un nombre que ni solo cabe parte. */}
							<div className="flex flex-wrap items-stretch bg-surface-hover">
								<button
									type="button"
									onClick={() => toggleRegionExpanded(region)}
									aria-expanded={isExpanded}
									className="flex min-h-11 min-w-0 grow basis-auto cursor-pointer items-center gap-2 border-0 bg-transparent py-2 pr-2 pl-2.5 text-left transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-surface-soft sm:min-h-9"
								>
									<NavArrowDown
										className={`size-4 shrink-0 text-text-placeholder transition-transform duration-150 ${isExpanded ? "rotate-0" : "-rotate-90"}`}
										aria-hidden="true"
									/>
									<span className="min-w-0 break-words text-label font-extrabold text-surface-soft">
										{REGION_LABELS[region]}
									</span>
									{/* Nombre desde el contenido, sin `aria-label` (WCAG 2.5.3):
									    empieza por el nombre visible del continente. El
									    contador sin palabras se leía pegado al nombre
									    ("Europa45") o como "12 barra 45": se oculta y el lector
									    lee su versión con palabras. */}
									<span
										className="shrink-0 text-tiny text-text-placeholder"
										aria-hidden="true"
									>
										{selectedCount > 0
											? `${selectedCount}/${regionCodes.length}`
											: regionCodes.length}
									</span>
									<span className="sr-only">
										{selectedCount > 0
											? `, ${selectedCount} de ${regionCodes.length} países elegidos`
											: `, ${regionCodes.length} países`}
									</span>
								</button>
								{/* `max-w-full flex-wrap` (D223): con el texto al 200 % a
								    320 px "Ninguno" y "Todos" juntos no caben en la
								    sección y "Todos" baja debajo, a la derecha. */}
								<div className="ml-auto flex max-w-full shrink-0 flex-wrap items-stretch justify-end">
									{selectedCount > 0 && (
										<RegionBulkButton
											label="Ninguno"
											region={region}
											regionName={REGION_LABELS[region]}
											onPress={() => toggleAllInRegion(regionCodes, true)}
										/>
									)}
									{!allSelected && (
										<RegionBulkButton
											label="Todos"
											region={region}
											regionName={REGION_LABELS[region]}
											onPress={() => toggleAllInRegion(regionCodes, false)}
										/>
									)}
								</div>
							</div>

							{isExpanded && (
								<div className="overflow-hidden motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:duration-200">
									{/* Una columna cuando el texto es grande (D223): el corte
									    en `rem` de los media queries crece con el tamaño de
									    letra del navegador, así que `min-[20rem]` vale desde
									    320 px a tamaño normal y desde 640 px al 200 %. */}
									<div className="grid max-h-56 grid-cols-1 overflow-y-auto p-1 min-[20rem]:grid-cols-2 min-[30rem]:grid-cols-3">
										{regionCountries.map((country) => (
											<CountryCheckbox
												key={country.code}
												label={country.name}
												checked={selected.has(country.code)}
												disabled={isCountryDisabled?.(country.code)}
												onToggle={(withShift) =>
													toggleCountry(country.code, withShift)
												}
											/>
										))}
									</div>
								</div>
							)}
						</section>
					);
				})}
			</div>

			{/* Fila `flex-wrap` (D223): con el texto al 200 % a 320 px (D216)
			    "Cancelar" no cabía ni solo en su media fila y se salía del botón.
			    Cada botón `flex-1` (a partes iguales, como la rejilla de antes) y
			    `min-w-min`: puede partir su texto entre palabras ("Usar 197 /
			    países" ya lo hacía a 320 px con letra normal), pero no ser más
			    estrecho que su palabra más larga; si así no caben, el segundo
			    baja de línea. Por eso `wrap-break-word` y no el `wrap-anywhere`
			    de `WRAPPING_BUTTON`, que deja el mínimo en una letra. */}
			<div className="mt-4 flex flex-wrap gap-3">
				<Button
					type="button"
					color="neutral"
					className={FOOTER_BUTTON}
					onClick={onClose}
				>
					Cancelar
				</Button>
				<Button
					type="button"
					color="primary"
					className={FOOTER_BUTTON}
					onClick={handleConfirm}
				>
					Usar {selectedCatalogCount} país
					{selectedCatalogCount === 1 ? "" : "es"}
				</Button>
			</div>
		</Modal>
	);
}
