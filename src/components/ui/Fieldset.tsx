import type { ReactNode } from "react";

interface FieldsetProps {
	legend: ReactNode;
	hideLegend?: boolean;
	children: ReactNode;
	className?: string;
}

// `min-w-0`: el `fieldset` trae `min-inline-size: min-content` y se ensancharía
// con su contenido más ancho en vez de ceñirse al panel (texto al 200 %, D220).
const fieldsetClass = "m-0 flex min-w-0 flex-col gap-2 border-0 p-0";

const legendClass = "mb-2 p-0 text-sm font-bold text-surface-soft";

const visuallyHiddenClass =
	"absolute m-[-1px] size-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]";

export function Fieldset({
	legend,
	hideLegend,
	children,
	className,
}: FieldsetProps) {
	return (
		<fieldset className={`${fieldsetClass}${className ? ` ${className}` : ""}`}>
			<legend className={hideLegend ? visuallyHiddenClass : legendClass}>
				{legend}
			</legend>
			{children}
		</fieldset>
	);
}
