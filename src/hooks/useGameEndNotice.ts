import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { type GameEndNotice, setGameEndNotice } from "@/store/slices/gameSlice";

/**
 * Aviso de que la última partida se cerró sola (D231): por inactividad o por
 * el límite de 1 h. No escribe progreso: por eso las sesiones lo usan
 * directamente y no va en `SessionRuntime` (la partida guiada no lo dispara,
 * porque no vigila la inactividad).
 */
export function useGameEndNotice() {
	const dispatch = useAppDispatch();
	const notice = useAppSelector((state) => state.game.gameEndNotice);

	return {
		notice,
		show: (kind: GameEndNotice) => dispatch(setGameEndNotice(kind)),
		dismiss: () => dispatch(setGameEndNotice(null)),
	};
}
