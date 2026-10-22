import { type AnimationEvent, type ReactNode, useState } from "react";
import { useSelectSound } from "@/hooks/useSelectSound";

interface OptionTileProps {
	name: string;
	value: string;
	checked: boolean;
	onChange: () => void;
	children: ReactNode;
}

/**
 * Opción segmentada de selección única (radio nativo accesible) alineada con
 * los tokens de HeroUI (`--accent`, `--default`, `--border`, `--radius`).
 *
 * Suena el "tic" de selección al elegir (D143), por dentro: quien la usa no
 * cambia nada.
 *
 * Movimiento (D157–D158): al pasar gana `shadow-sm`, al pulsar escala a 0,98
 * y, al elegirla, hace un "pop" (`zoom-in-95` → 100 %). El pop solo sale de
 * una elección real (el `onChange` del radio): al montar o al llegar la
 * opción guardada ya marcada no se anima. Todo el movimiento va con
 * `motion-safe:`; con movimiento reducido queda la sombra y el color.
 *
 * **No sube 2 px al pasar**, a diferencia de las tarjetas de continente y del
 * selector de juego (D157): casi todos sus consumidores la ponen dentro de un
 * `overflow-hidden` pegada al borde (`AutoHeight`, las pestañas del modal de
 * configuración). Medido: "5 s" queda a 0 px del borde superior de su
 * `AutoHeight` y la columna derecha a 0 px del borde derecho del panel, así
 * que el desplazamiento le cortaba el borde de arriba. Desde D160 `AutoHeight`
 * deja 4 px de hueco (lo justo para el anillo de foco), pero la subida sigue
 * apagada: no todos los consumidores pasan por `AutoHeight` y 4 px no
 * alcanzan para subir 2 px y además llevar el anillo entero.
 *
 * Alto contraste (D207): `forced-colors` borra el relleno `--accent`, que es
 * lo único que marca la elegida, así que esa opción sale del ajuste forzado y
 * se pinta con `Highlight`/`HighlightText` (como `GameTypeToggle`). Su anillo
 * de foco pasa a `CanvasText`: fuera del ajuste, `--focus` no sigue la paleta.
 */
/**
 * Fila de opciones (D223), en vez de `grid grid-cols-N`: cada opción `flex-1`
 * (a tamaño normal se reparten a partes iguales, como la rejilla) y
 * `min-w-min`: una opción puede partir su texto entre palabras, como en la
 * rejilla ("☀️ / Claro"), pero no ser más estrecha que su palabra más larga;
 * si así no caben todas, la fila se parte en vez de trocear la palabra
 * ("Pa / í / s / e / s", "1" / "0") con el texto al 200 % a 320 px. (No
 * `min-w-fit`, como las duraciones de D220: obligaría a cada opción a ir en
 * una línea y partiría filas que a tamaño normal ya cabían.) El `gap` lo pone
 * cada fila, como antes.
 */
export const OPTION_TILE_ROW =
	"flex flex-wrap [&>label]:min-w-min [&>label]:flex-1";

export function OptionTile({
	name,
	value,
	checked,
	onChange,
	children,
}: OptionTileProps) {
	const withSelectSound = useSelectSound();
	const [isPopping, setIsPopping] = useState(false);
	// `animationend` burbujea: solo cuenta el del propio pop. (React no expone
	// `animationcancel`; si el pop se cortara, la clase se queda puesta sin
	// efecto hasta el siguiente `animationend`.)
	const endPop = (event: AnimationEvent<HTMLLabelElement>) => {
		if (event.target === event.currentTarget) setIsPopping(false);
	};

	return (
		<label
			onAnimationEnd={endPop}
			// Sin `transition-colors` (D129 le quita `outline-color`, aquí se hace
			// igual a mano): la lista suma sombra y `scale`, que en Tailwind 4 es
			// una propiedad propia y no pisa el `transform` del pop. Ningún color
			// del tema (texto, fondo, borde) entra en la lista (D166): una
			// transición solo avanza con fotogramas, y tras cambiar de tema o de
			// opción con la pestaña sin pintar se queda en su valor de partida.
			// Quitar solo `color` (como D159) dejaba el texto nuevo sobre el fondo
			// viejo: 1,1:1 medido; sin ninguno, el contraste es el final al instante.
			className={`
				group relative flex w-full min-w-0 cursor-pointer items-center justify-center
				rounded-[var(--radius)] border border-[var(--border)] bg-[var(--default)]
				text-[var(--default-foreground)]
				transition-[box-shadow,scale]
				duration-150 ease-in-out
				min-h-10 sm:min-h-11
				hover:bg-[var(--default-hover)] hover:shadow-sm
				motion-safe:active:scale-98
				has-checked:border-[var(--accent)] has-checked:bg-[var(--accent)]
				has-checked:text-[var(--accent-foreground)]
				forced-colors:has-checked:forced-color-adjust-none
				forced-colors:has-checked:border-[Highlight] forced-colors:has-checked:bg-[Highlight]
				forced-colors:has-checked:text-[HighlightText]
				forced-colors:has-checked:outline-[CanvasText]
				has-focus-visible:outline has-focus-visible:outline-2 has-focus-visible:outline-offset-2
				has-focus-visible:outline-[var(--focus)]
				${isPopping ? "motion-safe:animate-in motion-safe:zoom-in-95" : ""}
			`}
		>
			<input
				type="radio"
				name={name}
				value={value}
				checked={checked}
				onChange={withSelectSound(() => {
					onChange();
					setIsPopping(true);
				})}
				className="pointer-events-none absolute size-px opacity-0"
			/>
			{/* `min-w-0 break-words text-center`: con el texto al 200 % a 320 px
			    (D216) "Por continente" no cabe en su casilla y parte en líneas
			    en vez de salirse por los dos lados. */}
			<span className="min-w-0 px-3 py-2 text-center text-xs font-bold break-words sm:text-sm">
				{children}
			</span>
		</label>
	);
}
