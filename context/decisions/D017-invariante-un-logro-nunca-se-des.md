# D017 · Logros · **Invariante: un logro nunca se des-desbloquea** · Implementado

**Resumen:** **Invariante: un logro nunca se des-desbloquea.** Da corrección (evidencia caduca por `MAX_REGION_GAMES = 3`) y terminación al efecto vía "sin delta, no se despacha"

`evaluate` es monótono y una entrada sellada no se reescribe. Sostiene dos cosas:

1. **Corrección.** `MAX_REGION_GAMES = 3`: `regionGameScores` solo guarda los tres
   últimos puntajes por continente, así que "sacaste un 10" es evidencia que
   **caduca a las tres partidas**. Sin sellado, el usuario perdería el logro por
   seguir practicando.
2. **Terminación.** El efecto escribe en `learningData`, que es lo que lo dispara.
   Corta con la regla **"sin delta, no se despacha"**: en la segunda pasada no hay
   ids nuevos y no se despacha nada.

Esa misma regla es lo que mantiene vivo el push a Supabase. El efecto de push de
`GameEffects.tsx` cancela y reprograma su timeout con cada cambio de
`learningData`; un despacho incondicional lo empujaría hacia adelante para
siempre y **no subiría nunca**. Ese, y no un push duplicado, era el fallo a
evitar.

Los logros meta ("desbloquea 10 logros") leen el propio conjunto de
desbloqueados, así que el punto fijo se resuelve **dentro** de
`getNewlyUnlocked` con un bucle acotado al tamaño del catálogo, y todo se sella
en un único `dispatch`.

_Contexto común de la unidad (antes `05-logros.md`): en D016._
