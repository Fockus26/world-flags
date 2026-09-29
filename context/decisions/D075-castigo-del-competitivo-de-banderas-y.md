# D075 · UX · Castigo del competitivo de Banderas y Capitales: **+10 s por fallo, +20 s por saltar** (dueño). Constantes en `types/country.ts` · Implementado

**Resumen:** Castigo del competitivo de Banderas y Capitales: **+10 s por fallo, +20 s por saltar** (dueño). Constantes en `types/country.ts`; el aviso de fallo decía "+10 s al cronómetro" (sustituido por D132) y la ayuda y la partida guiada citan la regla desde las constantes. Países no tiene castigo y no cambia

`RUSH_WRONG_PENALTY_MS = 10_000` y `RUSH_SKIP_PENALTY_MS = 20_000` salen de
`Session.tsx` a `types/country.ts`, junto a las claves que dependen de ellas
(D076): quien cambie la regla las ve juntas. Aplica a Banderas y Capitales, los
dos juegos que usan `Session`.

**Países no cambia.** Su rush (`CountriesRush`) no tiene castigo: se completa o
se rinde (D033). No se inventa uno; su ranking y sus tiempos no se tocan.

**Se dice al jugador.** *(La línea dentro del aviso la sustituye D132: desde
`feat/castigo-animado` el "+10 s" sube junto al cronómetro. Ver
D132–D134.)* Al fallar o saltar en competitivo, el aviso de fallo
lleva una línea "+10 s al cronómetro" / "+20 s al cronómetro" (dentro del
aviso, para que se anuncie con él; `AnswerForm.penaltyLabel`). El cronómetro
está congelado durante la transición (900 ms), así que el salto del número
solo se ve al avanzar: sin la línea, el castigo pasaba desapercibido. La ayuda
de "Modo de juego" (`GameTab`) y el paso "Modo de juego" de la partida guiada
dicen la regla, con el texto generado desde las constantes
(`utils/rush-penalty.ts`). Copy provisional (`CONTENT_CHECKLIST.md` #26).

**Logros.** Ninguno depende del castigo salvo `vuelta_rapida` (mundo en menos
de 15 min, umbral ya marcado "a confirmar"): con la regla nueva cuesta más.
No se toca el umbral; ver D076 para cómo se lee.

**Rama:** `feat/ranking-nueva-regla`

## Contexto común de la unidad (antes `18-ranking-nueva-regla.md`)

> Unidad `feat/ranking-nueva-regla` (2.0.0). Del dueño: el castigo nuevo
> (**+10 s por fallo, +20 s por saltar**), que el ranking arranque vacío
> *"sin segunda temporada ni nada por el estilo"*, el top 20, los avatares
> (migración autorizada) y el skeleton. El resto de decisiones son del
> agente, justificadas aquí.
