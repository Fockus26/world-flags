# D172 · Accesibilidad · Badges contadores (menú ⋮, `UserSummary`) con `text-accent-foreground` sobre `bg-primary` · Implementado

**Resumen:** Badges contadores (menú ⋮, `UserSummary`) con `text-accent-foreground` sobre `bg-primary`: 4,65:1 claro / 6,74:1 oscuro (antes 3,97:1 con `text-primary-soft`, fila #8)

Los contadores de los iconos (menú ⋮ y racha/logros de `UserSummary`) usaban
`text-primary-soft` sobre `bg-primary`: 3,97:1 en claro (fila #8). Pasan a
`text-accent-foreground`, el token de texto sobre el morado de D106/D142: 4,65:1 en claro y
6,74:1 en oscuro. Alternativa (la de la fila #8): fondo `primary-hover` en claro; se descarta
porque el anillo de foco es de ese mismo color.

## Umbrales de logros (P33)

El dueño confirmó el 2026-09-28 los umbrales propuestos de `src/utils/achievements.ts`
(15 min, 20 banderas, 5 sesiones, 500 aciertos, 90 % tras 200, 30 días, 100 días,
10 horas): se quitan los marcadores `🔸 a confirmar`. Sin cambio de cifras.

**Rama:** `fix/tema-transiciones-y-almacenamiento`

_Contexto común de la unidad (antes `46-tema-transiciones-y-almacenamiento.md`): en D170._
