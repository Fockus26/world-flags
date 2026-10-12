import { DiceFive } from "iconoir-react";
import { useState } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import type { AvatarStyle } from "@/types/progress";
import {
	AVATAR_SEEDS,
	createRandomAvatarSeeds,
	getAvatarUrl,
	withSelectedAvatarSeed,
} from "@/utils/avatar";

interface AvatarProps {
	avatarStyle: AvatarStyle;
	value: string;
	onChange: (seed: string) => void;
}

/**
 * Los avatares vienen de dicebear (CDN externo). Sin conexión, uno que el
 * navegador no tenga en caché no carga (D052): en vez de la imagen rota se ve
 * el número de la opción, que sigue siendo elegible. Decorativo: el nombre
 * accesible lo pone el botón.
 */
function AvatarOptionImage({ src, number }: { src: string; number: number }) {
	const [hasFailed, setHasFailed] = useState(false);

	if (hasFailed) {
		return (
			<span
				className="grid size-full place-items-center bg-primary-soft text-xl font-black text-surface-soft"
				aria-hidden="true"
			>
				{number}
			</span>
		);
	}

	return (
		<img
			className="block size-full object-cover"
			src={src}
			alt=""
			onError={() => setHasFailed(true)}
		/>
	);
}

export function Avatar({ avatarStyle, value, onChange }: AvatarProps) {
	// Al volver la red se remontan las imágenes para reintentar las que fallaron.
	const { isOnline } = useSyncStatus();
	// Tanda visible (D190): estado local, no se persiste. Tirar el dado no
	// toca el perfil; solo elegir una opción lo cambia. El elegido se mete en
	// la tanda al crearla (así elegir otro no corre las casillas) y otra vez
	// al pintar, por si cambia desde fuera (sync).
	const [seeds, setSeeds] = useState<readonly string[]>(() =>
		withSelectedAvatarSeed(AVATAR_SEEDS, value),
	);
	const [rolls, setRolls] = useState(0);
	const visibleSeeds = withSelectedAvatarSeed(seeds, value);

	function handleRoll() {
		setSeeds(
			withSelectedAvatarSeed(
				createRandomAvatarSeeds(AVATAR_SEEDS.length),
				value,
			),
		);
		setRolls((current) => current + 1);
	}

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-end">
				<IconButton
					type="button"
					color="neutral"
					variant="text"
					aria-label="Mostrar otros avatares"
					onClick={handleRoll}
				>
					{/* Una vuelta por tirada; con movimiento reducido no hay transición
					    y, al ser vueltas enteras, el icono no cambia. */}
					<DiceFive
						aria-hidden="true"
						className="size-6 motion-safe:transition-transform motion-safe:duration-300"
						style={{ transform: `rotate(${rolls * 360}deg)` }}
					/>
				</IconButton>
			</div>

			{/* Anuncio breve de la tirada. El espacio duro alterno hace que el
			    texto cambie en cada tirada para que se vuelva a leer. */}
			<p role="status" className="sr-only">
				{rolls > 0 && `Nuevos avatares${rolls % 2 === 0 ? "\u00A0" : ""}`}
			</p>

			{!isOnline && (
				<p className="m-0 flex items-start gap-2 text-caption text-surface-soft">
					<span aria-hidden="true">📡</span>
					<span>
						Sin conexión: algunos avatares no se pueden ver hasta que vuelva la
						red. Puedes elegir igualmente.
					</span>
				</p>
			)}

			<div className="grid grid-cols-4 gap-3">
				{visibleSeeds.map((seed, index) => {
					const isSelected = value === seed;
					const src = getAvatarUrl(avatarStyle, seed);

					return (
						<button
							className={`grid aspect-square place-items-center overflow-hidden rounded-full outline-3 outline-offset-3 cursor-pointer transition-[outline-color,transform,translate] duration-180 hover:-translate-y-0.5 hover:outline-surface-soft focus-visible:-translate-y-0.5 focus-visible:outline-surface-soft ${
								isSelected ? "outline-primary" : "outline-transparent"
							}`}
							type="button"
							key={seed}
							onClick={() => onChange(seed)}
							// Por posición: los seeds aleatorios no se leen bien en voz alta.
							aria-label={`Seleccionar avatar ${index + 1}`}
							aria-pressed={isSelected}
						>
							<AvatarOptionImage
								key={`${src}|${isOnline}`}
								src={src}
								number={index + 1}
							/>
						</button>
					);
				})}
			</div>
		</div>
	);
}
