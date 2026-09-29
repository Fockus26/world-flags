# D112 · Seguridad · Mínimo de cada scope vigente del ranking = países del scope × 300 ms · Implementado

**Resumen:** Mínimo de cada scope vigente del ranking = países del scope × 300 ms (hoy 197 × 300 = 59 100 ms en `countries:world`, `flags:world@2`, `capitals:world@2`). Números en `utils/leaderboard-validation.ts`, un test los compara con el catálogo y con el SQL local. Batirlo exige >27 teclas/s sostenidas: generoso a propósito

**Decisión:** Mínimo de cada scope vigente del ranking = nº de países del scope × **300 ms**. Hoy los tres (`countries:world`, `flags:world@2`, `capitals:world@2`) recorren los 197 países: **59 100 ms**. Los números viven en `src/utils/leaderboard-validation.ts` y un test los compara con el catálogo (y con el SQL local si existe)
**Por qué:** Tiene que ser imposible para un humano, no solo difícil: batirlo exige teclear sin pensar a más de ~27 teclas/s sostenidas (Países 1648 letras; Banderas 1648 + 197 Enter; Capitales 1386 + 197 Enter), más del doble del récord de mecanografía. Mejor dejar pasar un tramposo que rechazar a alguien honesto

**Rama:** `fix/ranking-validacion-servidor`
**Nota de estado:** SQL sin aplicar

## Contexto común de la unidad (antes `26-ranking-validacion.md`)

> Fix, rama `fix/ranking-validacion-servidor` (pendiente P5 y aviso 3 de P1,
> tanda 2026-09-24). El dueño eligió el enfoque: trigger con mínimos verosímiles
> por scope (no edge function que valide la partida).

### Lo que esto no cubre

- **No valida que la partida existiera.** Un tramposo puede subir cualquier
  tiempo ≥ 59,1 s. Lo real sería subir la partida (respuestas con marcas de
  tiempo) a una edge function que la reproduzca; el dueño lo descartó por ahora.
- **Un tiempo local imposible de verdad** (p. ej. si el reloj del sistema salta
  hacia atrás a mitad de un rush) se queda como mejor marca local y bloquea las
  siguientes: ninguna marca real la mejora, así que nada más sube al ranking.
  Caso raro; no se toca aquí.
- **Filas que ya existían** por debajo del mínimo no se borran (el trigger solo
  mira escrituras). En la comprobación en seco del 2026-09-24 no había ninguna.

### Alternativa descartada

- `check (best_time_ms >= …)` en la tabla: no puede depender del scope sin
  una tabla auxiliar y, al añadirse, falla si alguna fila vieja no cumple.
- Tabla auxiliar `leaderboard_scope_limits` en vez de `case`: más fácil de
  cambiar sin redefinir la función, pero una tabla más con RLS y grants para
  tres números que cambian solo con el catálogo o la regla.
