import { Button } from "@/components/ui/Button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { dismissSessionEndedNotice } from "@/store/slices/authSlice";
import { SNACKBAR_TEXT } from "./snackbar-classes";

/**
 * Aviso de sesión cerrada sin pedirlo aquí (D210), en el contenedor de
 * `SystemSnackbars`: se cerró en otra pestaña, el servidor rechazó el token o
 * caducó sin poder renovarse. Sin él, la pestaña pasaba a invitado en
 * silencio y lo jugado después no llegaba a la cuenta. Se queda hasta
 * cerrarlo o volver a entrar.
 *
 * El estado nunca va solo por color: emoji + título + texto.
 */
export function SessionEndedSnackbar() {
	const dispatch = useAppDispatch();
	const isShown = useAppSelector((state) => state.auth.endedUnexpectedly);

	if (!isShown) return null;

	return (
		<div className="pointer-events-auto flex w-full flex-col gap-3 rounded-lg border border-primary-border bg-primary-soft p-3 shadow-xl duration-200 animate-in fade-in-0 slide-in-from-top-4">
			<div className="flex flex-wrap items-start gap-3">
				<span className="shrink-0 text-heading leading-none" aria-hidden="true">
					🔒
				</span>

				<span className={SNACKBAR_TEXT}>
					<strong className="text-body-sm text-surface-soft">
						Se cerró tu sesión
					</strong>
					<span className="text-caption text-text-placeholder">
						Puede que la cerraras en otra pestaña o que haya caducado. Ahora
						juegas como invitado. Lo que no se llegó a subir se guardó en este
						dispositivo y pasará a tu cuenta cuando vuelvas a iniciar sesión
						aquí.
					</span>
				</span>
			</div>

			<div className="flex justify-end">
				<Button
					color="neutral"
					variant="soft"
					fullWidth={false}
					onClick={() => dispatch(dismissSessionEndedNotice())}
				>
					Entendido
				</Button>
			</div>
		</div>
	);
}
