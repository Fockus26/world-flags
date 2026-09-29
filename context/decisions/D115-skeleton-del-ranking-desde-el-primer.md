# D115 · UX · Skeleton del ranking desde el primer frame · Implementado

**Resumen:** Skeleton del ranking desde el primer frame: `ui/Skeleton` gana `immediate` (sin la espera de 300 ms ni fundido; por defecto `false`, los demás consumidores no cambian). `LoadingAnnouncer` y el avatar de cada fila mantienen el umbral

`ui/Skeleton` gana la prop opcional `immediate`: sin la espera de
`SKELETON_DELAY_MS` (300 ms, D042) ni el fundido de entrada. Por defecto `false`,
así que el resto de consumidores (pantalla de inicio, avatares) no cambian.

La usan solo las 5 filas de carga de `LeaderboardModal` (D077). El umbral de D042
existe para no hacer parpadear un gris en cargas casi instantáneas (el invitado,
que hidrata de `localStorage`); el ranking va **siempre** a la red, y la espera
dejaba ver durante 300 ms una caja vacía del alto del skeleton.

Se mantiene con umbral:

- **`LoadingAnnouncer`**: sigue anunciando "Cargando el ranking…" solo si la
  carga pasa de 300 ms. Anunciar cada apertura con red rápida sería ruido para el
  lector de pantalla; lo que ve la vista y lo que se oye ya no coinciden en ese
  primer tramo, a propósito.
- **El avatar de cada fila (`UserAvatar`)**: con caché HTTP carga al instante y un
  skeleton inmediato parpadearía.

Alternativa: dejar el umbral y aceptar el hueco (lo que había). Descartada por el
dueño.

**Rama:** `feat/ranking-skeleton-demo`

## Contexto común de la unidad (antes `27-ranking-skeleton-demo.md`)

> Unidad `feat/ranking-skeleton-demo` (2.2.1), pendientes P7 y P8 de la tanda del
> 2026-09-24. Del dueño: el skeleton del ranking **desde el primer frame**, **animar
> la altura** del modal (anulada con movimiento reducido) y un ranking de prueba
> de 30 personas **solo en el cliente, en desarrollo** (nada en la base). El resto
> de detalles son del agente, justificados aquí.
