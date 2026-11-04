import { InputGroup, Label, TextField } from "@heroui/react";
import { Eye, EyeClosed } from "iconoir-react";
import { type ComponentPropsWithRef, useState } from "react";
import { Button } from "./Button";

interface PasswordInputProps
	extends Omit<ComponentPropsWithRef<"input">, "type"> {
	label: string;
}

/**
 * Campo de contraseña con botón de ojo para ver lo escrito (D228). Misma API
 * nativa que `Input` (`onChange` con evento, `aria-*`) y mismo alto.
 *
 * Visible, el campo pasa a `type="text"`: sin mayúscula automática ni
 * corrector, que cambiarían la contraseña o la mandarían al diccionario.
 */
export function PasswordInput({
	className,
	label,
	id,
	"aria-invalid": ariaInvalid,
	...props
}: PasswordInputProps) {
	const [isVisible, setIsVisible] = useState(false);
	const isInvalid = ariaInvalid === true || ariaInvalid === "true";

	return (
		<TextField className="flex w-full flex-col gap-1.5">
			<Label htmlFor={id}>{label}</Label>
			{/* `isInvalid` en el grupo y no en `TextField`, que pintaría la etiqueta
			    de rojo (4,08:1 en claro) y la distinguiría de la de "Correo". */}
			<InputGroup fullWidth isInvalid={isInvalid} className="max-sm:min-h-11">
				<InputGroup.Input
					id={id}
					type={isVisible ? "text" : "password"}
					autoCapitalize="none"
					autoCorrect="off"
					spellCheck={false}
					className={["w-full min-w-0", className].filter(Boolean).join(" ")}
					aria-invalid={ariaInvalid}
					{...props}
				/>
				{/* El clic en el grupo lleva el foco al campo (HeroUI): sin este
				    corte, quien usa teclado perdería el foco del botón al pulsarlo. */}
				<InputGroup.Suffix
					className="border-0 px-0"
					onClick={(event) => event.stopPropagation()}
				>
					<Button
						variant="text"
						color="neutral"
						isIconOnly
						aria-label={isVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
						className="size-9 rounded-field max-sm:-my-px max-sm:size-11"
						onClick={() => setIsVisible((visible) => !visible)}
					>
						{isVisible ? (
							<EyeClosed aria-hidden="true" className="size-5" />
						) : (
							<Eye aria-hidden="true" className="size-5" />
						)}
					</Button>
				</InputGroup.Suffix>
			</InputGroup>
		</TextField>
	);
}
