import { Button as HeroButton } from "@heroui/react";
import type {
	CSSProperties,
	FocusEvent,
	MouseEvent,
	ReactNode,
	Ref,
} from "react";

type ButtonColor =
	| "primary"
	| "secondary"
	| "danger"
	| "warning"
	| "success"
	| "neutral";
type ButtonVariant = "contained" | "outline" | "text" | "soft";

export interface ButtonProps {
	color?: ButtonColor;
	variant?: ButtonVariant;
	pressed?: boolean;
	type?: "button" | "submit" | "reset";
	disabled?: boolean;
	className?: string;
	style?: CSSProperties;
	children?: ReactNode;
	onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
	/** `event.relatedTarget` = de dónde viene el foco. */
	onFocus?: (event: FocusEvent<Element>) => void;
	/** Para que otro componente lo encuentre y le devuelva el foco (D202). */
	id?: string;
	"aria-label"?: string;
	"aria-describedby"?: string;
	ref?: Ref<HTMLButtonElement>;
	fullWidth?: boolean;
	isIconOnly?: boolean;
}

/**
 * HeroUI pinta el botón con las custom props `--button-bg`,
 * `--button-bg-hover`, `--button-bg-pressed` y `--button-fg` (y el anillo de
 * foco con `--focus`). Se usa el
 * `variant="primary"` de HeroUI como base (layout, press, focus ring, radio)
 * y se reescriben esas variables con los tokens de marca, conservando los
 * 6 colores × 4 variantes que ya usaba el juego.
 */
const brand: Record<
	ButtonColor,
	{
		base: string;
		hover: string;
		soft: string;
		/**
		 * Relleno propio de `contained` cuando el base no da 4,5:1 con
		 * `--btn-contained-fg` (D195). Sin él, `contained` usa `base`/`hover`.
		 */
		contained?: { base: string; hover: string };
	}
> = {
	primary: {
		base: "var(--color-primary)",
		hover: "var(--color-primary-hover)",
		soft: "var(--color-primary-soft)",
	},
	secondary: {
		base: "var(--color-secondary)",
		hover: "var(--color-secondary-hover)",
		soft: "var(--color-secondary-soft)",
		// D195: blanco sobre `secondary` = 4,34:1 en claro. El relleno pasa
		// al `-hover` (5,69:1) y el hover/pressed lo oscurece como `success`
		// (claro 7,74:1; oscuro, texto oscuro, 11,10 → 7,38:1).
		contained: {
			base: "var(--color-secondary-hover)",
			hover: "color-mix(in oklab, var(--color-secondary-hover) 86%, black)",
		},
	},
	danger: {
		base: "var(--color-danger)",
		hover: "var(--color-danger-hover)",
		soft: "var(--color-danger-soft)",
		// D195: blanco sobre `danger` = 4,08:1 en claro → `-hover` (5,55:1);
		// hover/pressed 7,58:1 (oscuro 9,31 → 6,24:1).
		contained: {
			base: "var(--color-danger-hover)",
			hover: "color-mix(in oklab, var(--color-danger-hover) 86%, black)",
		},
	},
	warning: {
		base: "var(--color-warning)",
		hover: "var(--color-warning-hover)",
		soft: "var(--color-warning-soft)",
	},
	success: {
		base: "var(--color-success)",
		hover: "color-mix(in oklab, var(--color-success) 86%, black)",
		soft: "var(--color-success-soft)",
	},
	neutral: {
		base: "var(--color-neutral)",
		hover: "var(--color-neutral-hover)",
		soft: "var(--color-neutral-soft)",
	},
};

/**
 * Texto legible (AA) para las variantes sin relleno pleno: se mezcla el color
 * de marca hacia `--foreground`. Como `--foreground` vira con el tema (casi
 * negro en claro, casi blanco en oscuro), la misma fórmula oscurece el texto
 * sobre fondos claros y lo aclara sobre fondos oscuros. Antes se usaba el
 * color de marca tal cual y quedaba en ~2.7-4:1 en modo claro.
 */
function readableFg(base: string): string {
	return `color-mix(in oklab, ${base} 62%, var(--foreground))`;
}

function colorVars(color: ButtonColor, variant: ButtonVariant): CSSProperties {
	const c = brand[color];
	const style = {
		"--button-bg-pressed": c.hover,
		// Anillo de foco del color del botón (D101). HeroUI lo pinta con
		// `ring-focus` = `var(--focus)` (morado para todos); se pisa aquí, en
		// el propio botón. Va el token `-hover`, no el base: en claro el base
		// de `success`/`warning` da 2,68/2,77:1 contra `--background` (falla
		// el 3:1 de un anillo) y el `-hover` 3,88:1; en oscuro el `-hover` es
		// más claro y da ≥7,9:1. Un solo tono por color, igual en las 4
		// variantes. (`success` usa el token y no la mezcla de su `hover`.)
		"--focus": `var(--color-${color}-hover)`,
	} as Record<string, string>;

	switch (variant) {
		case "contained": {
			const solid = c.contained ?? c;
			Object.assign(style, {
				"--button-bg": solid.base,
				"--button-bg-hover": solid.hover,
				"--button-bg-pressed": solid.hover,
				"--button-fg": "var(--btn-contained-fg)",
			});
			break;
		}
		case "soft":
			// Hover/press: se ahonda el tinte suave (sin llegar al color pleno),
			// así el texto `readableFg` mantiene contraste AA en todos los
			// estados sin depender de invertir el color del texto.
			Object.assign(style, {
				"--button-bg": c.soft,
				"--button-bg-hover": `color-mix(in oklab, ${c.base} 22%, ${c.soft})`,
				"--button-bg-pressed": `color-mix(in oklab, ${c.base} 32%, ${c.soft})`,
				"--button-fg": readableFg(c.base),
			});
			break;
		case "outline":
			Object.assign(style, {
				"--button-bg": "transparent",
				"--button-bg-hover": c.soft,
				"--button-bg-pressed": c.soft,
				"--button-fg": readableFg(c.base),
				border: `1px solid ${c.base}`,
			});
			break;
		case "text":
			Object.assign(style, {
				"--button-bg": "transparent",
				"--button-bg-hover": c.soft,
				"--button-bg-pressed": c.soft,
				"--button-fg": readableFg(c.base),
			});
			break;
	}

	return style as CSSProperties;
}

/**
 * - Foco de teclado = mismo aspecto que el hover (pinta `--button-bg-hover`).
 * - En `soft` el hover/press/foco llevan el color pleno de fondo, así que el
 *   texto pasa a `--btn-contained-fg` (blanco/negro según tema) para no
 *   quedar oscuro-sobre-color.
 */
/**
 * Para los botones de una fila `flex flex-wrap` (D220). `flex-1` (base 0) en
 * vez del ancho completo, que pondría cada botón en su propia fila siempre;
 * `min-w-fit`, para que la fila se parta cuando los textos enteros no caben
 * juntos (y no antes: a tamaño normal se reparten igual que hasta ahora); y
 * `whitespace-normal` con alto mínimo (el `h-11 md:h-10` de HeroUI), para
 * que un botón que ni solo cabe (texto al 200 % a 320 px) parta su texto en
 * vez de salirse. Si ni su palabra más larga cabe ("igualmente" con su
 * padding), la parte con guion donde el navegador sabe (`hyphens-auto`) y, si
 * no, por donde llegue (`wrap-anywhere`): mejor eso que recortar el botón.
 */
export const WRAPPING_BUTTON =
	"h-auto min-h-11 min-w-fit flex-1 whitespace-normal text-center hyphens-auto wrap-anywhere md:min-h-10";

// Foco de teclado = mismo aspecto que el hover: se pinta `--button-bg-hover`.
// El `!` es imprescindible porque `--button-*` se fija con `style` inline en
// el componente y sin `!important` una clase no lo puede pisar.
const HOVER_LIKE_FOCUS =
	"data-[focus-visible]:[--button-bg:var(--button-bg-hover)]!";

// Alto contraste (D207): `forced-colors` borra el relleno, y sin borde el
// botón queda como texto suelto. El borde solo existe ahí (1 px, el sistema le
// da el color `ButtonText`), así que fuera de ese modo no cambia ninguna
// medida. `outline` ya trae su borde inline, que manda.
const FORCED_COLORS_BORDER = "forced-colors:border";

function interactionClassName(_variant: ButtonVariant): string {
	return `${HOVER_LIKE_FOCUS} ${FORCED_COLORS_BORDER}`;
}

export function Button({
	color = "primary",
	variant = "contained",
	pressed = false,
	type = "button",
	disabled,
	className,
	style,
	children,
	onClick,
	fullWidth,
	isIconOnly,
	ref,
	...rest
}: ButtonProps) {
	// Por defecto los botones ocupan el ancho de su contenedor (dentro de una
	// fila flex/grid eso los reparte equitativamente). Los de solo ícono y
	// quien pase `fullWidth={false}` (cabeceras de modal, etc.) quedan al
	// ancho del contenido.
	const isFullWidth = fullWidth ?? !isIconOnly;

	return (
		<HeroButton
			ref={ref}
			type={type}
			variant="primary"
			size="lg"
			fullWidth={isFullWidth}
			isIconOnly={isIconOnly}
			isDisabled={disabled}
			data-pressed={pressed || undefined}
			onPress={
				onClick ? () => onClick({} as MouseEvent<HTMLButtonElement>) : undefined
			}
			className={[interactionClassName(variant), className]
				.filter(Boolean)
				.join(" ")}
			style={{ ...colorVars(color, variant), ...style }}
			{...rest}
		>
			{children}
		</HeroButton>
	);
}

Button.displayName = "Button";
