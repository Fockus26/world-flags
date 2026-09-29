# D098 · UX · Contadores en el menú ⋮: logros sin ver en su opción y sobre el ⋮; países elegidos en su opción · Implementado

**Resumen:** Contadores en el menú ⋮: logros sin ver en su opción y sobre el ⋮; países elegidos en su opción. El dato va en el nombre accesible (`sr-only` en el `Label`). Nada en la carga inicial (D042). `COUNT_BADGE_CLASS` compartido con los iconos de escritorio

- Logros sin ver: número en su opción **y** sobre el ⋮ (mismo badge que tenía el 🏅).
  El dato va también en los nombres accesibles: "Más opciones, 2 logros sin ver" y
  "Logros, 2 sin ver" (texto `sr-only` dentro del `Label`), así que no es un estado
  solo de color y forma.
- Países elegidos a mano: número en su opción, con "Elegir países, 3 elegidos" como
  nombre. No se repite sobre el ⋮ para no sumar dos cifras en el mismo badge.
- En la carga inicial (D042) no se pinta ningún contador, como en escritorio.
- El badge (`COUNT_BADGE_CLASS`) se exporta de `ConfigurationMenu` y lo usan también
  los iconos de escritorio: el `text-[0.6rem]` heredado no se duplica.

**Rama:** `feat/menu-movil`

_Contexto común de la unidad (antes `22-menu-movil.md`): en D096._
