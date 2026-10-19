/** La práctica de Banderas, Capitales y Países (también el rush de los dos primeros). */
export const ANSWER_INPUT_ID = "answer-input";
/** El rush de Países (tablero). */
export const RUSH_ANSWER_INPUT_ID = "rush-answer-input";

/**
 * Atributos de todo campo donde se escribe una respuesta (Banderas,
 * Capitales, Países y su rush): texto libre, sin nada del navegador ni del
 * teclado del móvil por encima.
 *
 * - `autoComplete="off"` literal: es lo único que hace que Chrome Android pida
 *   al teclado `TYPE_TEXT_FLAG_NO_SUGGESTIONS` (sin barra de sugerencias ni
 *   las fichas de autofill que salen en ella). Un valor inventado apagaría el
 *   autofill de Chrome pero dejaría las sugerencias del teclado.
 * - `name`/`id` sin "country", "name", "card"…: el autofill de Chrome
 *   clasifica el campo por esos atributos (y la etiqueta) y con "country"
 *   lo tomaba por un campo de dirección.
 * - `autoCorrect`/`spellCheck`/`autoCapitalize`: sin corrector ortográfico,
 *   sin autocorrector y sin mayúsculas automáticas (la respuesta se compara
 *   sin distinguir mayúsculas).
 * - `data-*-ignore`: que los gestores de contraseñas y tarjetas (1Password,
 *   LastPass, Bitwarden, Dashlane) no le pongan su icono ni su menú.
 */
export const ANSWER_INPUT_PROPS = {
	name: "answer",
	type: "text",
	inputMode: "text",
	enterKeyHint: "done",
	autoComplete: "off",
	autoCorrect: "off",
	autoCapitalize: "none",
	spellCheck: false,
	"data-1p-ignore": true,
	"data-lpignore": "true",
	"data-bwignore": true,
	"data-form-type": "other",
} as const;
