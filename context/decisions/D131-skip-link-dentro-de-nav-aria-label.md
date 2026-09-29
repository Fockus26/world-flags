# D131 · Accesibilidad · Skip link dentro de `<nav aria-label="Accesos directos">` (no `header`: sería un `banner` vacío) · Implementado

**Resumen:** Skip link dentro de `<nav aria-label="Accesos directos">` (no `header`: sería un `banner` vacío). Sigue siendo lo primero al tabular; axe `region` limpio. `aria-label` provisional (`CONTENT_CHECKLIST.md` #42)

- axe (`region`, moderado) marcaba el enlace "Saltar al contenido principal" por
  estar fuera de todo landmark. Reproducido en la pantalla de configuración (con
  el recorrido del tutorial abierto no salía porque el resto queda `inert`).
- **`nav` con nombre, no `header`:** un `header` suelto en el `body` sería el
  `banner` de la página y solo contendría este enlace; engañaría al que navega por
  landmarks. `nav` es lo que es: un bloque de enlaces de navegación interna.
- Sigue siendo el primer hijo del `body` y el primer elemento enfocable: medido,
  el primer Tab tras cargar cae en él, y al enfocarlo se ve igual que antes
  (`fixed`, arriba a la izquierda, anillo `primary-hover`).
- El `aria-label` es copy nuevo: provisional (`CONTENT_CHECKLIST.md` #42).
- **Alternativa descartada:** meter el enlace dentro de `<main>`. Obligaría a
  moverlo al árbol de React (`FlagGame.tsx`, que no es de esta unidad) y quedaría
  dentro del mismo destino al que salta.

**Rama:** `fix/foco-transicion-y-pulsado`

_Contexto común de la unidad (antes `31-foco-transicion-pulsado.md`): en D129._
