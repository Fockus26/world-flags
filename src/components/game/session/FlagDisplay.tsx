import { RefreshDouble } from "iconoir-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { AnswerStatus } from "@/types/country";
import { StimulusFrame } from "./StimulusFrame";

/**
 * Una bandera que no carga (D230): cada intento tiene este límite. Una red
 * colgada no da error, así que sin él la imagen se quedaría esperando para
 * siempre.
 */
const FLAG_ATTEMPT_TIMEOUT_MS = 8_000;
/** Espera antes de reintentar tras un error, creciente. */
const FLAG_RETRY_DELAYS_MS = [1_000, 2_000, 4_000, 8_000];
/** Sin bandera todavía: el aviso aparece pasado esto, para no parpadear con las que están en caché. */
const FLAG_LOADING_HINT_MS = 500;
/** Sin bandera todavía: a partir de aquí se ofrece "Probar otra". */
export const FLAG_SWAP_AFTER_MS = 10_000;

/**
 * - `loading`: descargando (con límite de espera).
 * - `decoding`: descargada; el `<img>` la está pintando.
 * - `retrying`: falló; espera antes del siguiente intento.
 */
type LoadPhase = "loading" | "decoding" | "retrying" | "loaded";

interface LoadState {
	countryCode: string;
	attempt: number;
	phase: LoadPhase;
	/** URL `blob:` de la bandera descargada (se libera al cambiar). */
	src: string | null;
	showHint: boolean;
	isSlow: boolean;
}

/** Cambia el estado solo si sigue siendo el mismo intento de la misma bandera. */
function patchAttempt(
	countryCode: string,
	attempt: number,
	next: Partial<LoadState>,
) {
	return (previous: LoadState): LoadState =>
		previous.countryCode === countryCode && previous.attempt === attempt
			? { ...previous, ...next }
			: previous;
}

function initialLoadState(countryCode: string): LoadState {
	return {
		countryCode,
		attempt: 0,
		phase: "loading",
		src: null,
		showHint: false,
		isSlow: false,
	};
}

export interface FlagDisplayProps {
	countryCode: string;
	feedback?: AnswerStatus;
	/** La bandera ya se ve: la partida puede dejar correr el reloj y responder (D230). */
	onReady?: () => void;
	/** "Probar otra": sin él no se ofrece (no queda otra bandera a la que cambiar). */
	onSwap?: () => void;
}

export function FlagDisplay({
	countryCode,
	feedback,
	onReady,
	onSwap,
}: FlagDisplayProps) {
	const [state, setState] = useState(() => initialLoadState(countryCode));

	// Bandera nueva: de cero, en el mismo render (sin un frame con el estado
	// de la anterior).
	const current =
		state.countryCode === countryCode ? state : initialLoadState(countryCode);
	if (current !== state) setState(current);

	const { attempt, phase, src, showHint, isSlow } = current;
	const isLoaded = phase === "loaded";

	// Descarga con `fetch` y no con `<img src>`: un `<img>` nuevo con la misma
	// URL se cuelga de la petición que ya estaba colgada (Chrome las junta), así
	// que reintentar así no pedía nada. Con `fetch` cada intento es una petición
	// nueva, y el límite de espera la corta de verdad. Pasa por el service
	// worker: una bandera precargada sale de la caché al momento.
	useEffect(() => {
		if (phase !== "loading") return;

		let isCurrent = true;
		const controller = new AbortController();
		const timeoutId = window.setTimeout(
			() => controller.abort(),
			FLAG_ATTEMPT_TIMEOUT_MS,
		);

		fetch(`/flags/${countryCode}.svg`, { signal: controller.signal })
			.then((response) => {
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				return response.blob();
			})
			.then((blob) => {
				if (!isCurrent) return;
				setState(
					patchAttempt(countryCode, attempt, {
						phase: "decoding",
						src: URL.createObjectURL(blob),
					}),
				);
			})
			.catch(() => {
				if (isCurrent)
					setState(patchAttempt(countryCode, attempt, { phase: "retrying" }));
			})
			.finally(() => window.clearTimeout(timeoutId));

		return () => {
			isCurrent = false;
			controller.abort();
			window.clearTimeout(timeoutId);
		};
	}, [countryCode, attempt, phase]);

	// Tras un fallo, el siguiente intento espera un poco más cada vez.
	useEffect(() => {
		if (phase !== "retrying") return;

		const delay =
			FLAG_RETRY_DELAYS_MS[Math.min(attempt, FLAG_RETRY_DELAYS_MS.length - 1)];
		const timeoutId = window.setTimeout(
			() =>
				setState(
					patchAttempt(countryCode, attempt, {
						attempt: attempt + 1,
						phase: "loading",
					}),
				),
			delay,
		);

		return () => window.clearTimeout(timeoutId);
	}, [countryCode, attempt, phase]);

	// La URL `blob:` se libera al cambiar de bandera o de intento.
	useEffect(() => {
		if (!src) return;
		return () => URL.revokeObjectURL(src);
	}, [src]);

	// Avisos mientras no se ve: primero "cargando" y, pasado un rato, "Probar
	// otra". No se reinician con cada intento.
	useEffect(() => {
		if (isLoaded) return;

		const update = (next: Partial<LoadState>) =>
			setState((previous) =>
				previous.countryCode === countryCode
					? { ...previous, ...next }
					: previous,
			);
		const hintId = window.setTimeout(
			() => update({ showHint: true }),
			FLAG_LOADING_HINT_MS,
		);
		const slowId = window.setTimeout(
			() => update({ isSlow: true }),
			FLAG_SWAP_AFTER_MS,
		);

		return () => {
			window.clearTimeout(hintId);
			window.clearTimeout(slowId);
		};
	}, [countryCode, isLoaded]);

	function handleLoad() {
		setState(patchAttempt(countryCode, attempt, { phase: "loaded" }));
		onReady?.();
	}

	function handleError() {
		setState(
			patchAttempt(countryCode, attempt, { phase: "retrying", src: null }),
		);
	}

	return (
		<StimulusFrame
			feedback={feedback}
			className="
				p-2
				bg-[linear-gradient(45deg,var(--color-surface-hover)_25%,transparent_25%),linear-gradient(-45deg,var(--color-surface-hover)_25%,transparent_25%),linear-gradient(45deg,transparent_75%,var(--color-surface-hover)_75%),linear-gradient(-45deg,transparent_75%,var(--color-surface-hover)_75%)]
				bg-position-[0_0,0_0.75rem,0.75rem_-0.75rem,-0.75rem_0]
				bg-size-[1.5rem_1.5rem]
				min-[30rem]:p-[0.65rem]
				min-[43rem]:p-[clamp(0.75rem,2vh,1.5rem)]
			"
		>
			{/* `key` por país: cada bandera nueva se remonta y entra deslizándose
			    desde la derecha (D153); el `overflow-hidden` del marco recorta el
			    desplazamiento. Antes era un `motion.img` con `initial={false}`
			    (D006), o sea, sin entrada. `animation-duration-200` y no
			    `duration-200`: este último cambiaría también los 180 ms del hover.
			    La imagen sale de la descarga (`src`, una URL `blob:`) y no se ve
			    hasta que se pinta (ni el icono de imagen rota). */}
			{src && (
				<img
					key={countryCode}
					className={`col-start-1 row-start-1 block h-full w-[min(100%,30rem)] max-h-72 object-contain transition-[filter,transform,scale] duration-180 ease-in-out hover:scale-[1.015] animate-in fade-in-0 slide-in-from-right-4 animation-duration-200 ${isLoaded ? "" : "invisible"}`}
					src={src}
					alt="Bandera que debes identificar"
					aria-hidden={isLoaded ? undefined : true}
					onLoad={handleLoad}
					onError={handleError}
				/>
			)}

			<div className="col-start-1 row-start-1 flex max-w-xs flex-col items-center gap-3 px-2 text-center">
				{/* Siempre montado: un `role="status"` que aparece ya con texto no
				    siempre se anuncia. */}
				<div
					role="status"
					className="flex flex-col items-center gap-3 text-body-sm font-bold text-surface-soft empty:hidden"
				>
					{!isLoaded && showHint && (
						<>
							<RefreshDouble
								aria-hidden="true"
								className="size-6 motion-safe:animate-spin"
							/>
							{/* PLACEHOLDER copy (CONTENT_CHECKLIST, D230). */}
							<p className="m-0">
								{isSlow
									? "La bandera tarda en cargar. Se sigue intentando, con el tiempo en pausa."
									: "Cargando la bandera… El tiempo está en pausa."}
							</p>
						</>
					)}
				</div>

				{!isLoaded && isSlow && onSwap && (
					// PLACEHOLDER copy (CONTENT_CHECKLIST, D230).
					<Button variant="outline" color="neutral" onClick={onSwap}>
						Probar otra
					</Button>
				)}
			</div>
		</StimulusFrame>
	);
}
