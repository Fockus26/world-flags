# feat/tutorial-modo-de-juego (W5, tanda 2026-09-24) — P9
PR: https://github.com/Fockus26/World-Flags/pull/27 · 2.3.0 (MINOR) · D120–D122 (D123–D124 sin usar)

## Qué se hizo
- Jugando el ejemplo: sin aviso "Partida de ejemplo…" ni "Saltar tutorial"; cabecera entera sr-only (D120). La partida gana el alto de la cabecera (320×640: 625/640 px).
- Selector "Juego" (Países/Banderas/Capitales) en TutorialSettings; Países por defecto; paso 4 "Juego y ajustes" (D121).
- Session.tsx recibe runtime: SessionRuntime obligatorio + exitDescription?; FlagGame inyecta useGame(); SessionRuntime gana attemptCountry (sandbox: recordSandboxAttempts) (D121).
- "No cuenta" en el texto del paso 5 y en el aviso de abandonar (D122, sustituye a D092); instrucciones del paso 5 por juego.
- tutorial-sandbox.test.ts: 0 escrituras con los tres juegos, default Países, guardia de imports sobre Session/session-cards/usePracticeQueue, prop obligatoria en Session.

## Verificación
astro check 0 errores · biome limpio en lo tocado · test 146/146 · build OK · navegador: Banderas entera y Capitales abandonada con 0 escrituras; axe 0 violaciones en oscuro y claro; 320 px sin scroll horizontal. No verificado: capturas, partida real de Banderas/Capitales en navegador, Escape.

## Nota de entorno
Con el panel del navegador en segundo plano las transiciones CSS se congelan: getComputedStyle da los valores del inicio. Medir con transition:none temporal.
