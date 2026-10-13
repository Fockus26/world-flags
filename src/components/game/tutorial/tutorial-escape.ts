interface LostFocusEscapeInput {
	key: string;
	defaultPrevented: boolean;
	/** `document.activeElement` en el momento de la pulsación. */
	activeElement: unknown;
	/** `document.body`, para saber si el foco se perdió. */
	body: unknown;
}

/**
 * ¿Es un Escape que el diálogo del recorrido no va a ver? (D193)
 *
 * React Aria cierra el diálogo con Escape escuchando `keydown` **en el propio
 * diálogo**: solo le llega si el foco está dentro. En la partida de ejemplo,
 * al responder una tarjeta `AnswerForm` deshabilita el input enfocado y quita
 * "Comprobar", y el foco cae a `<body>`: desde ahí Escape ya no cerraba nada.
 *
 * Solo cuenta con el foco perdido (en `<body>` o en ningún sitio): si está en
 * otro elemento, o bien es dentro del diálogo y React Aria ya lo cierra, o
 * bien es dentro de un diálogo encima (el de "Abandonar", la actualización
 * obligatoria), que se ocupa de su propio Escape. Un Escape ya atendido
 * (`defaultPrevented`) tampoco.
 */
export function isLostFocusEscape({
	key,
	defaultPrevented,
	activeElement,
	body,
}: LostFocusEscapeInput): boolean {
	if (key !== "Escape" || defaultPrevented) return false;
	return activeElement === null || activeElement === body;
}
