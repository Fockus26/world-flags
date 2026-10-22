import { useState } from "react";
import { AuthLinkErrorSnackbar } from "./AuthLinkErrorSnackbar";
import { ConnectivitySnackbar } from "./ConnectivitySnackbar";
import { DailyReminderSnackbar } from "./DailyReminderSnackbar";
import { GuestProgressDiscardedSnackbar } from "./GuestProgressDiscardedSnackbar";
import { ReleaseNotesSnackbar } from "./ReleaseNotesSnackbar";
import { SessionEndedSnackbar } from "./SessionEndedSnackbar";
import { UpdateAvailableSnackbar } from "./UpdateAvailableSnackbar";

/**
 * Contenedor único, arriba a la derecha, para los avisos "de sistema" (no de
 * juego, por eso separados de `AchievementToasts`): conexión (D052), versión
 * nueva disponible, sesión cerrada sin pedirlo (D210), enlace de Auth que no
 * sirvió (D218), progreso de invitado
 * descartado al entrar (D212), novedades de la versión recién instalada (D058) y la
 * pregunta de recordatorio diario. Un solo contenedor apilable evita que se
 * superpongan si llegaran a coincidir. La conexión va primero: es el estado
 * actual del progreso, lo demás puede esperar.
 *
 * Nunca más alto que la pantalla (D222): con el texto al 200 % un solo aviso
 * podía medir el doble que ella y sus botones quedaban fuera, sin forma de
 * llegar. Lo que no cabe hace scroll dentro (`max-h-snackbars`); tabular a un
 * botón lo trae a la vista. El padding (con `box-content` y la posición
 * desplazada lo mismo, así las tarjetas siguen donde estaban) deja sitio a su
 * sombra, que el scroll recortaría. Sigue `pointer-events-none`: el hueco
 * entre avisos deja pasar los clics, y la rueda o el dedo sobre un aviso
 * desplazan igual la pila.
 */
export function SystemSnackbars() {
	const [updateDismissed, setUpdateDismissed] = useState(false);

	return (
		<div
			role="status"
			aria-live="polite"
			className="pointer-events-none fixed inset-x-0 top-0 z-[300] box-content flex max-h-snackbars flex-col gap-2 overflow-y-auto overscroll-contain px-3 pt-3 pb-8 sm:inset-x-auto sm:right-0 sm:w-toast"
		>
			<ConnectivitySnackbar />
			<SessionEndedSnackbar />
			<AuthLinkErrorSnackbar />
			<GuestProgressDiscardedSnackbar />
			{!updateDismissed && (
				<UpdateAvailableSnackbar onDismiss={() => setUpdateDismissed(true)} />
			)}
			<ReleaseNotesSnackbar />
			<DailyReminderSnackbar />
		</div>
	);
}
