/**
 * Cronómetro del rush (D232): siempre `m:ss`, también por debajo del minuto
 * (`0:08`) y por encima de la hora (`105:30`: con los castigos, el tiempo de
 * carrera puede pasar de 60 min aunque la partida dure como mucho 1 h real,
 * D231). Un solo formato para que la píldora no cambie de ancho. Sin
 * negativos, pase lo que pase con las pausas.
 */
export function formatStopwatch(elapsedMs: number): string {
	const totalSeconds = Math.floor(Math.max(0, elapsedMs) / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;

	return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
