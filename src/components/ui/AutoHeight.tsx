import type { ReactNode } from "react";

interface AutoHeightProps {
	show: boolean;
	children: ReactNode;
	className?: string;
}

/**
 * Anima el alto de un bloque que aparece/desaparece por condición, sin medir
 * nada por JS: el truco de `grid-template-rows: 0fr → 1fr` (ver
 * D182). `interpolate-size` no anima
 * cambios de alto por contenido en este motor y `framer-motion` no corre
 * aquí (D006), así que esta es la alternativa puramente CSS.
 *
 * El contenido queda siempre montado (colapsado con `overflow-hidden`) para
 * poder animar en ambas direcciones, y se vuelve `inert` mientras está
 * colapsado: `overflow-hidden` a 0px no saca los controles del orden de
 * tabulación por sí solo.
 *
 * **Hueco para el anillo de foco (D160).** Ese `overflow-hidden` recortaba el
 * anillo de los controles pegados a su borde (outline de 2 px + 2 px de
 * separación = 4 px por fuera): medido en "Orden", "Temporizador", "5 s /
 * 10 s / 15 s" y "Dificultad" del modal de configuración, cortado por los
 * lados, arriba o abajo. Abierto, el recorte gana 4 px por cada lado (`p-1`)
 * y un margen negativo igual (`-m-1`) lo devuelve a su sitio: el contenido
 * queda donde estaba, la pista de la rejilla mide lo mismo (el margen se
 * come el relleno) y el alto animado no cambia. Cerrado va sin los dos, para
 * que el relleno no deje asomar 4 px del contenido plegado.
 */
export function AutoHeight({ show, children, className }: AutoHeightProps) {
	return (
		<div
			className={[
				"grid transition-[grid-template-rows] duration-300 ease-in-out",
				show ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
				className ?? "",
			]
				.filter(Boolean)
				.join(" ")}
			inert={!show}
			aria-hidden={!show || undefined}
		>
			<div className={show ? "-m-1 overflow-hidden p-1" : "overflow-hidden"}>
				{children}
			</div>
		</div>
	);
}
