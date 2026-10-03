import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Fieldset } from "@/components/ui/Fieldset";
import { Modal } from "@/components/ui/Modal";
import { ModalCloseButton } from "@/components/ui/ModalCloseButton";
import { OptionTile } from "@/components/ui/OptionTile";
import { GAME_TYPE_NOUNS, type GameType } from "@/types/country";
import {
	LEARNING_PATH_BATCH_SIZES,
	type LearningPathBatchSize,
	type LearningPathOrder,
} from "@/types/progress";
import { DEFAULT_LEARNING_PATH_BATCH_SIZE } from "@/utils/learning-path";

interface LearningPathModalProps {
	isOpen: boolean;
	onClose: () => void;
	gameType: GameType;
	/** La etiqueta del alcance elegido en la configuración ("Oceanía"…). */
	scopeLabel: string;
	/** Cuántos países resuelve ese alcance; 0 = no hay nada elegido. */
	scopeCount: number;
	onCreate: (
		order: LearningPathOrder,
		batchSize: LearningPathBatchSize,
	) => void;
}

const ORDER_LABELS: Record<LearningPathOrder, string> = {
	region: "Por continente",
	random: "Al azar",
};

/**
 * Crear un aprendizaje por lotes (D185). El alcance es el que ya está elegido
 * en la configuración (continentes, países sueltos o el mundo): aquí solo se
 * eligen el orden y el tamaño de los lotes.
 */
export function LearningPathModal({
	isOpen,
	onClose,
	gameType,
	scopeLabel,
	scopeCount,
	onCreate,
}: LearningPathModalProps) {
	const [order, setOrder] = useState<LearningPathOrder>("region");
	const [batchSize, setBatchSize] = useState<LearningPathBatchSize>(
		DEFAULT_LEARNING_PATH_BATCH_SIZE,
	);

	useEffect(() => {
		if (!isOpen) return;
		setOrder("region");
		setBatchSize(DEFAULT_LEARNING_PATH_BATCH_SIZE);
	}, [isOpen]);

	const noun = GAME_TYPE_NOUNS[gameType];
	const batchCount = Math.ceil(scopeCount / batchSize);
	const hasScope = scopeCount > 0;

	function handleCreate() {
		onCreate(order, batchSize);
		onClose();
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			className="text-left"
			ariaLabelledby="learning-path-title"
			ariaDescribedby="learning-path-description"
		>
			<header className="mb-3 flex items-center justify-between gap-3">
				<h2 id="learning-path-title" className="m-0">
					Aprender por lotes
				</h2>
				<ModalCloseButton onClose={onClose} />
			</header>

			<p
				id="learning-path-description"
				className="m-0 mb-4 text-label text-text-placeholder"
			>
				Aprende de a pocos {noun}. Un país queda consolidado cuando lo aciertas
				a la primera en dos días distintos; cuando todo el lote está
				consolidado, se abre el siguiente. Lo que ya sabías cuenta como
				consolidado.
			</p>

			<div className="flex flex-col gap-5">
				<div className="rounded-md border border-surface-border bg-surface-hover px-3 py-2">
					<p className="m-0 text-caption text-text-placeholder">Alcance</p>
					<p className="m-0 font-bold text-surface-soft">
						{hasScope
							? `${scopeLabel} · ${scopeCount} ${scopeCount === 1 ? "país" : "países"}`
							: "Nada elegido"}
					</p>
					<p className="m-0 text-caption text-text-placeholder">
						Es lo que tienes elegido en la pantalla de inicio. Para otro
						alcance, cámbialo allí.
					</p>
				</div>

				<Fieldset legend="Orden">
					<div className="grid grid-cols-2 gap-1.5">
						{(Object.keys(ORDER_LABELS) as LearningPathOrder[]).map((value) => (
							<OptionTile
								key={value}
								name="learning-path-order"
								value={value}
								checked={order === value}
								onChange={() => setOrder(value)}
							>
								{ORDER_LABELS[value]}
							</OptionTile>
						))}
					</div>
				</Fieldset>

				<Fieldset legend="Países por lote">
					<div className="grid grid-cols-3 gap-1.5">
						{LEARNING_PATH_BATCH_SIZES.map((size) => (
							<OptionTile
								key={size}
								name="learning-path-batch-size"
								value={String(size)}
								checked={batchSize === size}
								onChange={() => setBatchSize(size)}
							>
								{size}
							</OptionTile>
						))}
					</div>
				</Fieldset>

				{hasScope && (
					<p className="m-0 text-caption text-text-placeholder">
						Como mucho {batchCount} {batchCount === 1 ? "lote" : "lotes"} (los
						que ya sabes no entran en ninguno).
					</p>
				)}
			</div>

			<div className="mt-5 grid grid-cols-2 gap-3">
				<Button type="button" color="neutral" onClick={onClose}>
					Cancelar
				</Button>
				<Button
					type="button"
					color="primary"
					disabled={!hasScope}
					onClick={handleCreate}
				>
					Empezar
				</Button>
			</div>
		</Modal>
	);
}
