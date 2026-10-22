/**
 * Columna de texto (título + cuerpo) de los avisos de `SystemSnackbars`, en
 * una fila `flex flex-wrap` con el emoji (D222). `basis-40` (10rem) crece
 * con el texto del navegador: a tamaño normal cabe junto al emoji desde
 * 320 px y no cambia nada; con el texto agrandado (≈130 % a 320 px, 200 % a
 * 390) ya no cabe y baja bajo el emoji con todo el ancho de la tarjeta, en
 * vez de quedar en una columna de 130 px con palabras cortadas. Una palabra
 * que ni así cabe se parte (`wrap-break-word`). Sin `hyphens-auto`: a 320 px
 * con letra normal ya cambiaba los cortes de línea.
 */
export const SNACKBAR_TEXT =
	"flex min-w-0 grow basis-40 flex-col gap-0.5 pt-0.5 wrap-break-word";
