# D055 · Persistencia · Perfil, configuración y notas por continente (los dos juegos) llevan la fecha de su último cambio · Implementado

**Resumen:** Perfil, configuración y notas por continente (los dos juegos) llevan la fecha de su último cambio; gana la más reciente, sin fecha decide la base. Columna nueva `field_updated_at` (**correr `supabase/field-updated-at.sql` antes de desplegar**)

Pedida por el dueño tras ver el límite de D049 ("gana el que sincroniza" en
un mismo campo), aceptando la migración.

- **Qué lleva fecha:** `fieldUpdatedAt.profile`, `fieldUpdatedAt.lastConfiguration`
  y `regionGameScoresUpdatedAt` por continente, en los dos juegos (el de
  Países dentro de `countriesGame`, proyectado por `toGameView`/`fromGameView`
  como el resto, D029). La ponen las propias escrituras: `saveUserProfile`,
  `saveLastConfiguration`, `updateLastConfiguration` y `registerRegionGame`.
- **Regla (`pickLatest`):** fecha en los dos lados → gana la más reciente
  (empate → lo remoto). Si falta en alguno → contra la base (D049). El
  ganador se queda con su fecha. Idempotente con la misma base.
- **Nube:** columna nueva `field_updated_at jsonb` con `profile`,
  `lastConfiguration` y `regionGameScores` (Banderas). Las de Países viajan
  dentro de `countries_game`, que ya es jsonb. Script:
  `supabase/field-updated-at.sql` (local). **Hay que correrlo antes de
  desplegar**: si falta la columna, el `select` falla y la app se queda en
  `local` con "No se pudo sincronizar".
- **Filas anteriores:** `{}` → sin fechas → deciden contra la base hasta el
  siguiente cambio de cada campo. No hay que rellenar nada.
- **Sigue perdiéndose uno:** con dos dispositivos que cambian las notas del
  mismo continente, gana la lista más reciente y la otra se pierde (solo esa
  media; sesiones, revisiones y estadísticas nunca). Mezclar las dos listas
  exigiría guardar cada nota con su fecha, que cambia el formato de los datos
  y rompería los clientes viejos en caché. Se descartó.
- **Relojes:** la fecha es la del dispositivo. Un reloj muy desajustado puede
  hacer ganar un cambio más viejo.
- **Clientes viejos** (SW en caché): no mandan `field_updated_at`, así que el
  upsert no la toca y la fecha queda vieja respecto a su cambio. Al
  actualizarse, deja de pasar.

_Contexto común de la unidad (antes `14-modo-offline.md`): en D048._
