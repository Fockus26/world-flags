# style/ranking-podio (W5, tanda 2026-09-26) — PR #38

- P21.1 podio: tokens `--app-color-medal-{gold,silver,bronze}` (+ soft) en claro/oscuro (D147); fila teñida, número en tono de medalla, `Medal` de iconoir `aria-hidden` en la esquina del avatar; tu fila en el podio = `primary-soft` + `ring-2 ring-inset` del puesto (D148). Texto de tu fila `primary` → `primary-hover` (3,97 → 5,15:1 en claro).
- P21.2 hover solo visual (D149): `hover:bg-surface-hover` / tinte + 6 % de texto con `color-mix`, 150 ms, variante D103.
- P21.3 columna del puesto en `ch` por dígitos del puesto más alto visible (skeleton = "#20"), `gap-3` puesto–avatar, `gap-2`/`px-2` bajo `sm`; modal `w-[min(34rem,92vw)] max-w-none` (el tope `modal__dialog--md` = 28 rem anulaba el 30rem de antes) (D150).
- Demo: `?demo-ranking=podio` (puesto 2) y `?demo-ranking=lejos` (puesto 123, 150 personas); tope 200.
- Verificado en navegador (4302): axe 0 violaciones en claro y oscuro; contraste medido (medalla ≥4,81:1 con hover en claro); 320 px sin scroll horizontal; avatar quieto skeleton → datos. Toque real no probado (solo la regla CSS).
- Fila 48 de CONTENT_CHECKLIST sin usar (sin copy nuevo). Changeset patch `ranking-podio.md`.
- Checks: astro check 0 errores, biome limpio en lo tocado, test 188 pass / 1 skip, build OK.
- Visto fuera de la unidad: `CountryPickerModal` tiene el mismo tope de 28 rem (su 34rem no se aplica); a 320 px con puesto de 3 cifras el nombre de tu fila queda en ~19 px.
