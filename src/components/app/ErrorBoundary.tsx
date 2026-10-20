import { Component, type ErrorInfo, type ReactNode } from "react";
import { focusWhenVisible } from "@/utils/focus";

const TITLE_ID = "error-boundary-title";

const BUTTON_CLASS =
	"inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md px-5 font-bold transition-colors forced-colors:border focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary-hover";

interface ErrorBoundaryProps {
	children: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
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
	state: ErrorBoundaryState = { hasError: false };

	static getDerivedStateFromError(): ErrorBoundaryState {
		return { hasError: true };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error("La app falló al pintar", error, info.componentStack);
	}

	// El foco del árbol que se cayó se pierde en `<body>`: se lleva al título
	// para que el lector lea dónde está y el Tab siga desde ahí (WCAG 2.4.3,
	// D208). En el montaje cubre el fallo en el primer pintado; en la
	// actualización, el fallo posterior (también tras "Reintentar").
	componentDidMount() {
		if (this.state.hasError) this.focusTitle();
	}

	componentDidUpdate(_: ErrorBoundaryProps, prevState: ErrorBoundaryState) {
		if (this.state.hasError && !prevState.hasError) this.focusTitle();
	}

	private focusTitle() {
		focusWhenVisible(document.getElementById(TITLE_ID));
	}

	render() {
		if (!this.state.hasError) return this.props.children;

		return (
			<main
				id="main-content"
				className="grid h-dvh w-full place-items-center overflow-auto p-4"
			>
				<section
					role="alert"
					aria-labelledby={TITLE_ID}
					className="flex w-full max-w-card flex-col items-center gap-3 rounded-2xl border border-surface-border bg-surface p-6 text-center shadow-xl"
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
							onClick={() => this.setState({ hasError: false })}
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
