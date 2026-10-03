import { Button } from "@/components/ui/Button";
import type { LearningPath } from "@/types/progress";
import type { LearningPathStatus } from "@/utils/learning-path";

interface LearningPathPanelProps {
	path: LearningPath;
	status: LearningPathStatus;
	onContinue: () => void;
	onAbandon: () => void;
	onCreateNew: () => void;
	className?: string;
}

const linkButtonClass =
	"shrink-0 cursor-pointer rounded-sm border-0 bg-transparent p-0.5 text-caption font-bold text-secondary transition-colors hover:text-secondary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-hover";

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

	return (
		<section
			aria-labelledby="learning-path-panel-title"
			className={`flex flex-col gap-2 rounded-xl border border-surface-border p-3 ${className ?? ""}`}
		>
			<div className="flex items-start justify-between gap-2">
				<h2
					id="learning-path-panel-title"
					className="m-0 min-w-0 text-label font-extrabold text-surface-soft"
				>
					Aprender por lotes · {path.scopeLabel}
				</h2>
				{!status.isComplete && (
					<button type="button" className={linkButtonClass} onClick={onAbandon}>
						Abandonar
					</button>
				)}
			</div>

			<div className="flex items-center gap-2">
				{/* Visual: el mismo dato va en texto al lado. */}
				<span
					className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-sm bg-surface-hover"
					aria-hidden="true"
				>
					<span
						className="block h-full rounded-sm bg-secondary transition-[width] duration-180 ease-in-out"
						style={{ width: `${percentage}%` }}
					/>
				</span>
				<span className="shrink-0 whitespace-nowrap text-tiny font-semibold text-text-placeholder">
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
						onClick={onCreateNew}
					>
						Nuevo aprendizaje por lotes
					</Button>
				</>
			) : todayCount > 0 ? (
				<Button
					color="secondary"
					variant="outline"
					type="button"
					onClick={onContinue}
				>
					Seguir aprendiendo ({todayCount})
				</Button>
			) : (
				<p className="m-0 text-caption text-text-placeholder" role="status">
					Por hoy está listo. Vuelve mañana para consolidar{" "}
					{status.pendingCodes.length === 1
						? "el país que falta"
						: `los ${status.pendingCodes.length} países que faltan`}{" "}
					del lote.
				</p>
			)}
		</section>
	);
}
