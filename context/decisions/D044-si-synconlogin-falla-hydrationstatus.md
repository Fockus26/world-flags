# D044 · Persistencia · Si `syncOnLogin` falla, `hydrationStatus = "local"` (nunca `ready`) · Implementado

**Resumen:** Si `syncOnLogin` falla, `hydrationStatus = "local"` (nunca `ready`): se juega sobre `localStorage` sin push, ranking ni logros, porque `ready` subía esa copia (vieja, o vacía tras un logout) con upsert de la fila entera. Reintentos a 5/15/30/60 s + `online` + eventos de Auth; al recuperarse, lo jugado en vuelo se re-fusiona

- El `catch` marca `hydrationStatus = "local"`: se juega sobre `localStorage`,
  pero push, ranking, logros y recordatorio siguen bloqueados (todos comparan
  contra `"ready"`). `hydratedUserRef` **no** se fija: la cuenta sigue sin
  hidratar.
- `local` es el mismo valor, con el mismo significado, que introdujo PR #8
  (D042) para el fallback de 2,5 s de Supabase Auth: datos de `localStorage`
  sin contrastar con la nube, push bloqueado. Como `local` también marca
  `hasHydratedOnce`, una sync fallida quita el skeleton de la carga inicial
  igual que antes lo hacía `ready`, y con el tope de D045 el skeleton ya no
  puede durar más de ~10 s.
- **Reintentos:** a los 5 s, 15 s, 30 s y después cada 60 s mientras siga
  fallando. Además, uno inmediato con el evento `online` y con cualquier
  evento de Supabase Auth (el efecto se re-ejecuta porque `user` cambia de
  identidad, p. ej. al refrescar el token). No hay tope de intentos: cada uno
  es un GET pequeño, y rendirse dejaría la sesión entera sin guardar.
- **Reintento ≠ primer intento** (`failedSyncRef`, que sobrevive a las
  re-ejecuciones del efecto): no vuelve a `loading` ni reemplaza los datos con
  los que ya se está jugando. Se limpia al tener éxito o al pasar a invitado.
- **Al recuperarse**, el resultado reemplaza los datos en el sitio (el
  progreso de la nube "aparece"). Lo jugado mientras la sincronización estaba
  en vuelo ya está en `localStorage` pero no en el resultado; si lo local
  cambió durante el vuelo, se vuelve a pasar por `mergeLearningData` en vez
  de reemplazar sin más. Luego se aplica D046. Con `ready`, el push normal
  sube el resultado final.
- La limpieza del efecto (logout, otro usuario) **aborta** la sincronización
  en vuelo (`AbortController`): antes solo ignoraba la respuesta, y la
  petición seguía y podía subir datos.

**Visible:** mientras dura `local` no salen snackbars de logro ni el del
recordatorio diario. Los logros ganados en ese rato se sellan **en silencio**
al recuperarse, porque es la primera evaluación tras hidratar (D026). No hay
aviso de "sin conexión": sería copy nuevo y queda como posible siguiente
unidad.

Alternativas que el dueño descartó: **mínimo** (`local` + tope, sin
reintentos: la sesión entera sin guardar, y más revisiones que se pierden al
fusionar) y **solo bloquear el push** (sin tope ni reintentos).

## Contexto común de la unidad (antes `12-sync-fallida.md`)

> Fix, rama `fix/sync-fallida-sin-subida`. Hallazgo reportado en PR #8
> (`feat/skeleton-carga`) y reproducido allí con un mock de Supabase que
> devolvía 500 en el GET: justo después llegaba un POST a
> `/rest/v1/user_learning_data`. Alcance y regla de SRS elegidos por el dueño
> entre tres opciones cada uno (2026-09-21).

### El problema

`GameEffects` hidrata una cuenta con `syncOnLogin` (GET de la fila → merge →
push si hace falta). Si eso lanzaba (red caída, 500, JWT roto…), el `catch`
cargaba `getLearningData()` (`localStorage`), fijaba `hydratedUserRef` y
marcaba `hydrationStatus = "ready"`. `ready` habilita el push debounced
(800 ms), que hace **upsert de la fila entera**. Lo que había en
`localStorage` pasaba a ser la cuenta:

- **Copia vieja** si se jugó en otro dispositivo: se perdía todo lo de allí,
  logros incluidos. En la nube, un logro se "des-desbloqueaba" (rompe D017).
- **Copia vacía** tras un logout, que ejecuta `clearLearningData()`. Si se
  volvía a entrar con mala red, se subía `DEFAULT_DATA` (o lo que hubiera
  jugado el invitado entre medias) y **se borraba la cuenta**.
- **Ranking:** con `ready`, `upsertLeaderboardEntry` sustituía la marca
  pública por el mejor tiempo local, aunque fuera peor.

Además, `syncOnLogin` no tenía tope: con una red que se cuelga sin fallar
(portal cautivo, túnel), la hidratación se quedaba en `loading` hasta que el
navegador abandonaba el `fetch` (minutos).
