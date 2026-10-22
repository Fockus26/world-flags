import { Component, type ErrorInfo, type ReactNode } from "react";
import { focusIfLost, focusWhenVisible } from "@/utils/focus";

const TITLE_ID = "error-boundary-title";

const BUTTON_CLASS =
	"inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md px-4 font-bold min-[20rem]:px-5 transition-colors forced-colors:border focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary-hover";

interface ErrorBoundaryProps {
	children: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	/** Cuántas veces se pulsó "Reintentar": distingue ese caso en `componentDidUpdate`. */
	retries: number;
}

/**
 * Destino del foco cuando "Reintentar" devuelve la app (D215): el título de
 * la pantalla que se muestre (el de inicio, `#configuration-title`, o el de
 * Resultados), igual que al volver de una partida (P51). Fuera de la cara
 * visible del giro (`aria-hidden`) no cuenta. Las sesiones no tienen `h1`:
 * entonces, el primer control que se pueda usar.
 */
function findAppFocusTarget(): HTMLElement | null {
	const isShown = (element: Element) =>
		!element.closest('[aria-hidden="true"]');
	const heading = [
		...document.querySelectorAll<HTMLElement>(
			'#main-content h1[tabindex="-1"]',
		),
	].find(isShown);
	if (heading) return heading;
	return (
		[
			...document.querySelectorAll<HTMLElement>(
				"#main-content :is(button, a[href], input, select, textarea):not(:disabled)",
			),
		].find((element) => isShown(element) && !element.closest("[inert]")) ?? null
	);
}

/**
 * Pantalla de error (P41, D203): un fallo de render dejaba la pantalla en
 * blanco. Va por fuera de `Providers` para cubrirlos también, así que no usa
 * nada que dependa de ellos (ni HeroUI ni el store): HTML con los tokens.
 *
 * No toca el progreso: "Reintentar" vuelve a montar la app con lo guardado y
 * "Recargar" recarga la página. Copy provisional (CONTENT_CHECKLIST fila 49).
 */
export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	state: ErrorBoundaryState = { hasError: false, retries: 0 };

	static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
		return { hasError: true };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error("La app falló al pintar", error, info.componentStack);
	}

	// El foco del árbol que se cayó se pierde en `<body>`: se lleva al título
	// para que el lector lea dónde está y el Tab siga desde ahí (WCAG 2.4.3,
	// D208). En el montaje cubre el fallo en el primer pintado; en la
	// actualización, el fallo posterior.
	componentDidMount() {
		if (this.state.hasError) this.focusTitle();
	}

	// "Reintentar" (D215): si el fallo sigue, React vuelve a montar la pantalla
	// de error desde cero (el botón pulsado ya no existe) sin que `hasError`
	// llegue a pasar por `false` en un commit, así que se mira `retries`. Si la
	// app vuelve, el foco va a su pantalla; la carga inicial la deja `inert` un
	// rato, por eso `focusIfLost` con margen (~4 s) y sin pisar un foco válido.
	componentDidUpdate(_: ErrorBoundaryProps, prevState: ErrorBoundaryState) {
		const retried = this.state.retries !== prevState.retries;
		if (this.state.hasError) {
			if (!prevState.hasError || retried) this.focusTitle();
		} else if (prevState.hasError) {
			focusIfLost(findAppFocusTarget, 240);
		}
	}

	private focusTitle() {
		focusWhenVisible(document.getElementById(TITLE_ID));
	}

	render() {
		if (!this.state.hasError) return this.props.children;

		return (
			<main
				id="main-content"
				className="grid h-dvh w-full place-items-center overflow-auto p-2 min-[20rem]:p-4"
			>
				<section
					role="alert"
					aria-labelledby={TITLE_ID}
					className="flex w-full max-w-card flex-col items-center gap-3 rounded-2xl border border-surface-border bg-surface p-4 text-center shadow-xl min-[20rem]:p-6"
				>
					<h1
						id={TITLE_ID}
						tabIndex={-1}
						className="m-0 text-heading text-surface-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface-soft"
					>
						Algo salió mal
					</h1>
					<p className="m-0 text-body-sm text-text-placeholder">
						La app tuvo un problema al mostrarse. Tu progreso sigue guardado.
					</p>
					<div className="mt-3 grid w-full grid-cols-1 gap-3 min-[30rem]:grid-cols-2">
						<button
							type="button"
							className={`${BUTTON_CLASS} bg-neutral-soft text-surface-soft hover:bg-surface-hover`}
							onClick={() =>
								this.setState(({ retries }) => ({
									hasError: false,
									retries: retries + 1,
								}))
							}
						>
							Reintentar
						</button>
						<button
							type="button"
							className={`${BUTTON_CLASS} bg-primary text-accent-foreground hover:bg-primary-hover`}
							onClick={() => window.location.reload()}
						>
							Recargar la página
						</button>
					</div>
				</section>
			</main>
		);
	}
}
