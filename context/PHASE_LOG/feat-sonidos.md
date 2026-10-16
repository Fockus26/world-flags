# feat/sonidos (W2)

**Estado:** PR #20 abierto (https://github.com/Fockus26/World-Flags/pull/20), versión 1.3.0 (se reajusta según el orden de merge). Decisiones D080–D084 en `context/decisions/19-sonidos.md`.

## Qué se hizo
- `src/utils/sound.ts` (`playSound`: correct / incorrect / found / achievement, Web Audio sintetizado, un AudioContext perezoso, silencio si `document.hidden`, si no hay Web Audio o si hay error; "found" se limita a uno cada 70 ms; los logros, uno por tanda).
- `getSoundEnabled`/`saveSoundEnabled` en `learning-storage.ts` (clave `world-flags-sound-enabled`, por dispositivo, activado por defecto).
- `src/hooks/useSoundPreference.ts` (useSyncExternalStore; en vivo).
- Interruptor "Sonidos" en `GameTab.tsx`.
- Llamadas en `Session.tsx`, `CountriesPractice.tsx`, `CountriesRush.tsx`, `DailyPractice.tsx` y `AchievementsEffects.tsx`.
- Tests: `tests/unit/sound-preference.test.ts` (nuevo); `tutorial-sandbox.test.ts` prohíbe `saveSoundEnabled`/`useSoundPreference` y revisa `utils/sound.ts`.

## Verificado (navegador integrado, 4332, invitado, contando osciladores)
- Práctica y competitivo de Banderas; práctica y rush de Países; práctica diaria: todo suena como en D083/D084. Calificar no suena.
- Logro de la primera partida competitiva (`a_contrarreloj`): un solo arpegio.
- Interruptor apagado: 0 sonidos, también tras recargar; al reactivarlo suena sin recargar.
- Pestaña oculta: silencio.
- a11y: fieldset/legend, radios nativos, flechas, foco visible, 320 px sin scroll; axe oscuro 0, claro 3 fallos ya existentes (OptionTile marcado 4,34:1).
- astro check 0 · biome limpio en lo tocado · test 116/116 · build ok.

## No verificado
Audio real, Safari/iOS, la partida guiada en el navegador (la cubre el test), capturas.

## Filas de CONTENT_CHECKLIST propuestas
- #28 — Copy "Sonidos" / "Desactivados" / "Activados" en la pestaña Juego (`GameTab.tsx`), provisional.
- #29 — Entrada 1.3.0 del CHANGELOG sobre los sonidos, provisional (y cómo apagarlos: "Perfil y configuración, pestaña Juego, Sonidos").

## Para el dueño
- Contraste heredado de OptionTile marcado en claro (4,34:1), escalado.
- Bug heredado: el primer logro de un perfil limpio no avisa ni suena (`isNextPassSilentRef` en AchievementsEffects).
- Posible: partida guiada abierta encima de una partida en curso (sin confirmar).

## Acciones manuales
Ninguna.
