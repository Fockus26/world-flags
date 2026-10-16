# Ola de arreglos 2026-10-12 — prompts por unidad

Reglas comunes: `orquestacion-2026-10-12-arreglos.md` (léelo antes). Carpeta principal (contexto local, PHASE_LOG,
capturas): `C:\Users\Admin\Documents\Work\world-flags\`. Lee allí `context/DESIGN_RULES.md` si tocas UI.

---

## F1 — Sesión de Países colgada por reencolado sobre sí misma (P55, crítico)

**Pedido (QA Q1, `plans/qa-tanda-2026-10-12.md`):** "Lotes de 5 → acertar todo con 'Bien' → la última (p. ej.
Costa Rica) vuelve sola → tras 'Correcto' ni 'Bien' ni 3/4 responden; la sesión no termina ni se guarda."

**Código:**
- `src/components/game/session/countries/CountriesPractice.tsx:93` `isGradingRef`; se libera solo en el efecto
  de `:161-166` (deps `[practiceQueue.currentCode]`); se toma en `handleGrade` `:246-248`.
- `src/hooks/usePracticeQueue.ts:66-101`: `currentCode = queue[0]`; con requeue, `insertRequeuedCard(rest, code)`.
- `src/utils/practice-queue.ts:88` `insertRequeuedCard`: con `rest = []` deja `[cr]` → `currentCode` no cambia →
  el efecto no corre → el guard queda en `true` para siempre. Pistas (`hintLetters`) tampoco se reinician.

**Enfoque decidido:** que el reinicio por tarjeta dependa de un **turno** y no del código. `usePracticeQueue`
expone un contador que sube en cada `grade` (p. ej. `turn`); el efecto de `CountriesPractice` depende de él
(reinicia guard, pistas y anuncio). No cambies la regla de reencolado (D186) ni el orden de la cola.
Revisa si Banderas/Capitales (`usePracticeQueue` también) pueden mostrar la misma tarjeta dos veces seguidas
con estado pegado (input, `answerStatus`): si sí, arréglalo igual; si no, dilo en el PR.
De paso, anota (no arregles) si el reencolado de la misma sesión recalifica el SM2 (ya en `CURRENT_PHASE`).

**Tests:** en `tests/unit/` (patrón de `practice-queue-review.test.ts`): cola de 1 con requeue → la misma tarjeta
vuelve y el turno avanza; si puedes, test del hook o de la secuencia completa hasta terminar.

**Verificar en navegador** (puerto 4301, invitado): Países → Aprender por lotes de 5 de un continente pequeño →
acertar con "Bien" hasta que la última vuelva sola → poder calificarla y llegar a Resultados. Prueba también con
teclas 1-4. Si forzar el caso es difícil, documenta cómo lo forzaste.

**Reservas:** D194 · changeset patch (texto de jugador: la sesión ya no se queda trabada en la última bandera
repetida) · sin filas de checklist.

---

## F3 — Contraste de botones secondary/danger y nota baja en oscuro (P48, P52.1, P52.2)

**Decisiones del dueño (`pendientes.md`):**
- **P48 (a):** el botón `contained` secondary ("Práctica diaria") usa `secondary-hover` como fondo base. Hoy:
  blanco sobre `#b34bd1` = 4,34:1 (claro).
- **P52.1 (a):** "Sí, abandonar" (contained danger, `src/components/game/session/ConfirmationModal.tsx:63`):
  fondo `danger-hover` como fondo normal. Hoy blanco sobre `#e0435f` = 4,08:1.
- **P52.2 (a):** "/10" y la nota con nota baja en **oscuro**: aclarar ese rojo solo en oscuro hasta ≥4,5:1.
  Hoy `#e27071` sobre `#511d1d` = 4,39:1.

**Código:**
- `src/components/ui/Button.tsx:46-82` (`brand`) y `colorVars` `:96-120` (`contained`: `--button-bg: c.base`,
  hover/pressed `c.hover`). `--btn-contained-fg` en `src/styles/heroui-theme.css:82` (claro, blanco) y `:121,166`
  (oscuro, `#14121f`). Tokens en `src/styles/variables.css` (claro `:9,37`; oscuro `:71,98` y `:129,156`).
- `src/utils/score.ts:14-31` `getScoreColor` / `getScoreBackgroundColor` (HSL por nota; oscuro: L 68 % sobre L 22 %).
  Lo usa `src/components/game/Results.tsx:147-174`. **No toques `Results.tsx` ni `getScoreMessage`** (F4, ola B).
- D192 (`context/decisions/D192-*.md`) dejó medido todo lo de `secondary`. `context/COLORS.md` en git.

**Enfoque:** solo `contained` de `secondary` y `danger` cambian su base al `-hover`; el hover/pressed necesita
seguir siendo distinguible (p. ej. una mezcla más oscura del `-hover` con `color-mix`, como ya hace `success`):
mide que el texto pase 4,5:1 en reposo, hover y pressed, claro y oscuro. En oscuro el texto es oscuro: comprueba
que no empeora. Nada de hex sueltos en componentes: si hace falta un tono nuevo, token en `variables.css`
(los 3 bloques: claro, oscuro por `prefers-color-scheme`, oscuro por `data-theme`) + `COLORS.md`.
Para P52.2: que `getScoreColor` en oscuro dé ≥4,5:1 contra `getScoreBackgroundColor` para **todas** las notas
1–10 (ajusta la luminosidad según el tono, no solo el rojo si hace falta, pero sin cambiar el aspecto de las
notas que ya pasan más de lo necesario). Test unitario que recorra 1–10 en claro y oscuro calculando contraste.
Busca otros consumidores de `color="danger"`/`"secondary"` contained (`grep -rn 'color="danger"\|color="secondary"' src`)
y revísalos de pasada.

**Verificar:** axe claro y oscuro en Configuración ("Práctica diaria"), modal de abandonar el lote, Resultados
con nota baja (puedes forzar la nota interceptando o jugando mal). Capturas antes/después.

**Reservas:** D195 (botones) · D196 (nota en oscuro) · changeset patch · sin filas de checklist.

---

## F5 — SEO: h1 en HTML estático y metadata (P46, P47.5–8)

**Informe:** `plans/qa-seo-2026-10-12.md` (léelo entero; es corto).

**Decisiones del dueño (`pendientes.md`):**
- **P47.5** description: «Aprende las banderas de los 197 países con repetición espaciada: practica por
  continente o por lotes, compite a contrarreloj y sube al ranking.» (`src/layouts/Layout.astro:16`)
- **P47.6** `og:image:alt` y `twitter:image:alt`: «Banderas del Mundo: tarjeta de una bandera con las opciones de
  respuesta». **Abre `public/og-image.png` y comprueba que describe lo que se ve**; si no, ajusta lo mínimo y
  dilo en el PR.
- **P47.7** marca "Banderas del Mundo" en todas partes (`og:site_name` `:85`, JSON-LD `name` `:26`, `<title>` de
  `src/pages/index.astro:6` si aplica, manifest ya lo dice) y "Banderas" como nombre corto (ya en manifest y
  `apple-mobile-web-app-title`). Busca "World Flags" visible en `src/` y `public/` (no en código/comentarios ni
  claves de `localStorage`) y lista lo que cambias.
- **P47.8** `og:locale` = `es_419` (`:92`).

**Además:**
- JSON-LD (`Layout.astro:24-35`): `operatingSystem` válido (p. ej. "Web") e `image` con la URL absoluta del og.
- `public/og-image.png` 588 KB → ≤300 KB, mismas dimensiones 1200×630, sin pérdida visible (herramienta local;
  si necesitas descargar algo, no lo hagas y dilo).
- `astro.config.mjs:34`: quitar `"framer-motion"` de `optimizeDeps.include` (D177 lo quitó del proyecto).
- **P46:** el HTML servido no trae ningún heading; el `<h1>` (`src/components/game/configuration/Configuration.tsx:340`)
  solo aparece al hidratar. Averigua por qué no sale en el prerender (`App` con `useIsClient`/gate de auth, D179)
  y elige: prerenderizar el h1 del modo por defecto, o un `<h1>` estático en `index.astro` que no se duplique
  al hidratar. **Requisito:** un solo `h1` en el DOM en todo momento, y sin error de hidratación (#418). Toca
  `Configuration.tsx` lo mínimo (F2/F4 lo tocan en la ola B; deja escrito en el PR qué cambiaste allí).
  Comprueba con `bun run build` y `grep -c "<h1" dist/index.html`.

**Verificar:** `bun run build` + `bunx astro preview --port 4303`: HTML servido con h1, metas, JSON-LD válido
(parsea el JSON), consola sin #418, un solo h1 tras hidratar. Skill `seo` (modo cierre) y `a11y` si tocas UI.

**Reservas:** D197 · changeset patch (texto de jugador: mejor vista previa al compartir el enlace) ·
filas de checklist 51–52: **no** edites `CONTENT_CHECKLIST.md`; pon en el informe el texto exacto aprobado
que quedó para description y alt (las escribe el orquestador como "Aprobado 2026-10-12").

---

## F6 — Ranking: bordes de la caché (P56)

**Pedido (Q1 sobre #70, `plans/qa-tanda-2026-10-12.md`):**
(a) Al reabrir el modal con la caché vencida sale una petición de más al último scope: el efecto de carga
(`src/components/game/configuration/LeaderboardModal.tsx:387-441`) corre antes que el de reinicio (`:375-382`),
pide el scope viejo y luego el nuevo.
(b) Si abres el ranking con el upsert de tu marca en vuelo o en reintentos (o en los 3 s antes de sincronizar el
perfil), sirve la marca vieja y no se refresca cuando `cloud-storage.ts:531-532` invalida: suscribir el modal a
la invalidación.

**Código:** `src/utils/leaderboard-cache.ts` (`createLeaderboardCache` `:43`, `leaderboardCache` `:113`, TTL
`:18`), `peekLeaderboard`/`loadLeaderboard` en el modal, `src/utils/cloud-storage.ts:531` (invalidate). Decisión
D188 (`context/decisions/D188-*.md`). Tests: `tests/unit/leaderboard-cache.test.ts`.

**Enfoque:** (a) que la apertura no dispare la carga con el scope anterior (p. ej. derivar el scope inicial al
abrir, o que el efecto de carga no corra en el render en que `isOpen` pasa a true con `gameType`/`region`
desfasados); medir con la pestaña de red: una sola petición por apertura. (b) La caché expone `subscribe(listener)`
(o similar) que avisa al invalidar un scope; el modal abierto en ese scope recarga sin skeleton si ya muestra
filas (mantén lo que ya se ve hasta que lleguen las nuevas; anuncio para lector de pantalla solo si hace falta,
sin ruido). Sin cambiar el TTL ni la regla de invalidación de D188.

**Tests:** subscribe/unsubscribe e invalidación en `leaderboard-cache.test.ts`.

**Verificar** (puerto 4304, invitado; el ranking es público): abrir, cerrar, esperar >60 s (o bajar el TTL
solo en local para probar, sin commitearlo), reabrir → una sola petición. (b) con `cache.invalidate` desde la
consola o un test; documenta cómo lo probaste.

**Reservas:** D198 · changeset patch (texto de jugador: el ranking muestra tu marca nueva sin reabrirlo) ·
sin filas de checklist.
