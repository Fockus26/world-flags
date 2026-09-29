# D076 · Persistencia · Ranking limpio sin temporadas: la versión de la regla va **en la clave** · Implementado

**Resumen:** Ranking limpio sin temporadas: la versión de la regla va **en la clave**. Mundo de Banderas y Capitales en `regionBestTimes["world@2"]` (`WORLD_BEST_TIME_KEYS`) y scopes `flags:world@2` / `capitals:world@2`. El `world` viejo se queda en los datos sin leerse (solo logros retroactivos). Un cliente viejo no puede mezclar reglas; merge clave a clave, sin migración. Continentes intactos. Limpieza de filas viejas: SQL local **tras desplegar**. 2.0.0

El dueño quiere que el ranking de Banderas y Capitales empiece vacío, sin que
nadie vea "temporadas". Tres trampas, cerradas así:

**1. Clientes viejos en caché del SW.** Siguen subiendo su mejor tiempo en cada
carga (`pushedWorldBestRef` se reinicia). Por eso los scopes cambian:
`LEADERBOARD_SCOPES` pasa a `flags:world@2` y `capitals:world@2`
(`countries:world` se queda). Los clientes viejos escriben en `world` y
`capitals:world`, que ya nadie lee. El nombre del scope no se ve en ningún sitio.

**2. El mejor tiempo guardado del propio usuario.** Si el cliente nuevo leyera
`regionBestTimes.world`, subiría al ranking nuevo tiempos de la regla vieja, y
el merge por el menor (`mergeRegionBestTimes`) lo resucitaría desde la nube,
otro dispositivo, la base o un invitado. La marca de versión va **en la clave**:
el mejor tiempo del mundo con la regla 2 se guarda en `regionBestTimes["world@2"]`
(`WORLD_BEST_TIME_KEYS`: Banderas y Capitales → `world@2`, Países → `world`).

Descartado: un campo de versión aparte (`bestTimesRule: 2`) que la migración
mirara para borrar `world`. Un cliente viejo lo rompe de dos maneras, las dos
reales:

- En Países y Capitales, `migrateGameProgress` reconstruye el sub-objeto con
  solo las claves que conoce: el campo desaparece en su siguiente subida, y el
  cliente nuevo tiraría la marca buena que ya tenía.
- En Banderas iría en otra columna, que el cliente viejo no manda; pero sí
  manda `region_best_times` con `world = min(su marca vieja, la de la nube)`.
  La columna seguiría diciendo "regla 2" con un tiempo de la regla 1 dentro.

Con la clave, un cliente viejo no puede mezclar reglas: solo escribe en `world`,
y `world@2` lo conserva tal cual al normalizar (`?? {}` deja pasar claves) y al
fusionar (parte de `{ ...remote }` y compara clave a clave). La fusión nueva es
la misma función: clave a clave, así que nada pasa de `world` a `world@2`. No
hace falta migración ni columna nueva, y la idempotencia no cambia. Todo está
cubierto en `tests/unit/rush-rule.test.ts`, incluida una copia literal del
merge de la 1.2.0 para simular el dispositivo sin actualizar.

**3. Alcance.** Solo se invalida lo que alimenta el ranking: el mundo de
Banderas y Capitales. Los mejores tiempos por continente se conservan (siguen
en su clave y se mezclan reglas: ahí no hay ranking). Alternativa: invalidarlos
también, con claves `europe@2`…; costaría más claves y el jugador perdería
marcas que no compiten con nadie.

El `world` viejo **no se borra** de los datos: el cliente nuevo simplemente no
lo lee (ni lo muestra, ni lo sube). Borrarlo no serviría (un cliente viejo lo
repondría con el merge por el menor) y provocaría subidas de ida y vuelta.
Solo lo leen los logros de "completa el rush de Todo el mundo" y
`vuelta_rapida` (`getAnyRuleWorldBestTime`): se ganaron con la regla de
entonces y son retroactivos (D070).

**Filas viejas del ranking.** No se borran desde el cliente. El SQL de limpieza
(`supabase/leaderboard-limpieza-regla-2.sql`, local) borra los scopes `world` y
`capitals:world`; se corre **después** de desplegar, y se puede repetir.

**Versión: MAJOR (2.0.0).** D060 pone "un reinicio del ranking" como ejemplo
literal de MAJOR, y además el mejor tiempo de "Todo el mundo" guardado deja de
contar.

**Rama:** `feat/ranking-nueva-regla`

_Contexto común de la unidad (antes `18-ranking-nueva-regla.md`): en D075._
