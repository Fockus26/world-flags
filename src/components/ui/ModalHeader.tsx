import type { ReactNode } from "react";
import { ModalCloseButton } from "./ModalCloseButton";

interface ModalHeaderProps {
	/** `id` del `h2`: el `ariaLabelledby` del `Modal`. */
	titleId: string;
	title: ReactNode;
	onClose: () => void;
	/**
	 * Sin hueco entre título y "Cerrar". Solo para Configuración, que nunca lo
	 * tuvo: con el hueco su título ya no cabría en una línea a 320 px.
	 */
	isCompact?: boolean;
}

/**
 * Cabecera de los modales: título y "Cerrar" (D097) en una fila.
 *
 * Con el texto muy grande en pantallas estrechas (200 % a 320 px, D216) la
 * fila no cabe y baja de línea: el título ocupa la primera y "Cerrar" pasa a
 * la siguiente, alineado a la derecha, siempre visible. Para que eso no
 * cambie nada a tamaño normal, el título entra en la fila con su palabra más
 * larga (`flex-basis: min-content`) y luego crece: la fila solo se parte
 * cuando ni esa palabra cabe junto a "Cerrar"; mientras quepa, el título se
 * reparte en líneas a su lado, como hasta ahora. Una palabra más ancha que el
 * diálogo se parte con guion donde el español lo permite (`hyphens-auto`,
 * `lang="es"` del documento, D220) o, si no, se corta (`break-words` +
 * `min-w-0`) en vez de salirse.
 */
export function ModalHeader({
	titleId,
	title,
	onClose,
	isCompact = false,
}: ModalHeaderProps) {
	return (
		<header
			className={`mb-3 flex flex-wrap items-center justify-end gap-y-2 ${isCompact ? "" : "gap-x-3"}`}
		>
			<h2
				id={titleId}
				className="m-0 min-w-0 grow basis-[min-content] break-words hyphens-auto"
			>
				{title}
			</h2>
			<ModalCloseButton onClose={onClose} />
		</header>
	);
}
