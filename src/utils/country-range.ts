/**
 * Selección por rango con Shift en «Elegir países» (D233).
 */

/**
 * Las casillas en el orden en que se ven: los continentes desplegados, uno
 * tras otro, y dentro de cada uno sus países en el orden de la rejilla. Los
 * plegados no cuentan: no se ve lo que se marcaría.
 */
export function getVisibleCountryOrder<Region extends string>(
	regions: readonly Region[],
	expanded: ReadonlySet<Region>,
	codesByRegion: Readonly<Record<Region, readonly string[]>>,
): string[] {
	return regions
		.filter((region) => expanded.has(region))
		.flatMap((region) => codesByRegion[region]);
}

/**
 * Shift+clic en `target` con `anchor` como la última casilla pulsada: todas
 * las del medio (incluidas las dos) toman el estado nuevo de `target`, que es
 * el contrario del que tenía, como al pulsarla sola. Las deshabilitadas
 * («hoy») se saltan y no cambian.
 *
 * Devuelve `null` si no hay rango posible (sin ancla, o alguna de las dos ya
 * no se ve): entonces es un clic normal.
 */
export function applyRangeSelection(
	selected: ReadonlySet<string>,
	order: readonly string[],
	anchor: string | null,
	target: string,
	isDisabled: (code: string) => boolean = () => false,
): Set<string> | null {
	if (anchor === null) return null;

	const anchorIndex = order.indexOf(anchor);
	const targetIndex = order.indexOf(target);
	if (anchorIndex === -1 || targetIndex === -1) return null;

	const shouldSelect = !selected.has(target);
	const [from, to] =
		anchorIndex <= targetIndex
			? [anchorIndex, targetIndex]
			: [targetIndex, anchorIndex];
	const next = new Set(selected);

	for (const code of order.slice(from, to + 1)) {
		if (isDisabled(code)) continue;
		if (shouldSelect) next.add(code);
		else next.delete(code);
	}

	return next;
}
