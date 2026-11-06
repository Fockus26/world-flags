import { Button, WRAPPING_BUTTON_TEXT } from "@/components/ui/Button";
import type { LearningPath } from "@/types/progress";
import type { LearningPathStatus } from "@/utils/learning-path";

/** Título del panel: también destino del foco al crear un aprendizaje (P51). */
export const LEARNING_PATH_PANEL_TITLE_ID = "learning-path-panel-title";

interface LearningPathPanelProps {
	path: LearningPath;
	status: LearningPathStatus;
	onContinue: () => void;
	onAbandon: () => void;
	onCreateNew: () => void;
	className?: string;
}

// Texto en `secondary-hover`, no en `secondary` (D192): `#b34bd1` da 3,86:1
// sobre el fondo de página en claro. Como el reposo ya es el tono hover, el
// hover se marca con subrayado.
const linkButtonClass =
	"shrink-0 cursor-pointer rounded-sm border-0 bg-transparent p-0.5 text-caption font-bold text-secondary-hover underline-offset-2 transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-hover";

/**
 * El aprendizaje por lotes en curso (D185), en la pantalla de inicio: en qué
 * lote va, cuántos países lleva consolidados y qué toca hoy.
 */
export function LearningPathPanel({
	path,
	status,
	onContinue,
	onAbandon,
	onCreateNew,
	className,
}: LearningPathPanelProps) {
	const percentage =
		status.totalCountries > 0
			? Math.round((status.consolidatedCount / status.totalCountries) * 100)
			: 0;
	const progressLabel = `${status.consolidatedCount} de ${status.totalCountries} consolidados`;
	const batchLabel =
		status.currentBatchIndex === null
			? null
			: `Lote ${status.currentBatchIndex + 1} de ${status.batchCount}`;
	const todayCount = status.todayCodes.length;
	const pendingLabel =
		status.pendingCodes.length === 1
			? "el país que falta"
			: `los ${status.pendingCodes.length} países que faltan`;

	return (
		<section
			aria-labelledby={LEARNING_PATH_PANEL_TITLE_ID}
			className={`flex flex-col gap-2 rounded-xl border border-surface-border p-3 ${className ?? ""}`}
		>
			{/* Patrón de `ModalHeader` (D223): si ni la palabra más larga del
			    título cabe al lado de "Abandonar" (texto al 200 % a 320 px, el
			    título quedaba en 35 px), "Abandonar" baja a la derecha. */}
			<div className="flex flex-wrap items-start gap-2">
				{/* `tabIndex={-1}`: destino del foco al empezar un aprendizaje
				    desde el modal (el botón que lo abrió desaparece, P51). */}
				<h2
					id={LEARNING_PATH_PANEL_TITLE_ID}
					tabIndex={-1}
					className="m-0 min-w-0 max-w-max grow basis-[min-content] break-words hyphens-auto text-label font-extrabold text-surface-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface-soft"
				>
					Aprender por lotes · {path.scopeLabel}
				</h2>
				{!status.isComplete && (
					<button
						type="button"
						className={`ml-auto ${linkButtonClass}`}
						onClick={onAbandon}
					>
						Abandonar
					</button>
				)}
			</div>

			{/* `flex-wrap` (D223): con el texto al 200 % a 320 px "Lote 1 de 5 ·
			    0/15" no cabe junto a la barra; baja debajo y, si ni solo cabe, se
			    parte. La barra nunca baja de `min-w-8`. */}
			<div className="flex flex-wrap items-center gap-2">
				{/* Visual: el mismo dato va en texto al lado. */}
				<span
					className="h-1.5 min-w-8 flex-1 overflow-hidden rounded-sm bg-surface-hover"
					aria-hidden="true"
				>
					<span
						className="block h-full rounded-sm bg-secondary transition-[width] duration-180 ease-in-out"
						style={{ width: `${percentage}%` }}
					/>
				</span>
				<span className="max-w-full shrink-0 wrap-break-word text-tiny font-semibold text-text-placeholder">
					{batchLabel ? `${batchLabel} · ${progressLabel}` : progressLabel}
				</span>
			</div>

			{status.isComplete ? (
				<>
					<p className="m-0 text-caption text-text-placeholder">
						¡Completado! Consolidaste todo {path.scopeLabel}.
					</p>
					<Button
						color="secondary"
						variant="outline"
						type="button"
						className={WRAPPING_BUTTON_TEXT}
						onClick={onCreateNew}
					>
						Nuevo aprendizaje por lotes
					</Button>
				</>
			) : status.canStartSession ? (
				<Button
					color="secondary"
					variant="outline"
					type="button"
					className={WRAPPING_BUTTON_TEXT}
					onClick={onContinue}
				>
					Seguir aprendiendo ({todayCount})
				</Button>
			) : status.canStartExtraSession ? (
				// Hasta tres sesiones al día, a petición (D235). PLACEHOLDER copy
				// (CONTENT_CHECKLIST).
				<>
					<p className="m-0 text-caption text-text-placeholder" role="status">
						Sesión de hoy hecha. Si quieres, haz otra: un acierto cuenta si van
						4 horas desde el anterior, y con tres en el mismo día el país queda
						consolidado.
					</p>
					<Button
						color="secondary"
						variant="outline"
						type="button"
						className={WRAPPING_BUTTON_TEXT}
						onClick={onContinue}
					>
						Hacer otra sesión hoy ({todayCount})
					</Button>
				</>
			) : (
				<p className="m-0 text-caption text-text-placeholder" role="status">
					{status.canComeBackLater
						? `Por ahora está listo. Vuelve en unas horas para otra sesión, o mañana, para consolidar ${pendingLabel} del lote.`
						: `Por hoy está listo. Vuelve mañana para consolidar ${pendingLabel} del lote.`}
				</p>
			)}
		</section>
	);
}
