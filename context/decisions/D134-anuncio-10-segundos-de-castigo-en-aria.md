# D134 · Accesibilidad · Anuncio "10 segundos de castigo" en `aria-live` discreto · Implementado

**Resumen:** Badge `aria-hidden`; región `sr-only aria-live="polite"` junto al cronómetro dice "10 segundos de castigo" / "20 segundos de castigo" (un nodo por castigo para que dos iguales se anuncien). Copy provisional #43

El badge es `aria-hidden` (el "+10 s" leído suelto no dice nada). Junto al
cronómetro hay una región `sr-only aria-live="polite"` montada desde el inicio
del rush, con un `span` por castigo (`key` = id): cada castigo mete un nodo
nuevo, así que dos "10 segundos de castigo" seguidos se anuncian los dos.
`polite` para no cortar el aviso de fallo (`role="alert"`, "La respuesta
correcta es…"), que sigue siendo lo primero. Texto en
`formatPenaltyAnnouncement` (`utils/rush-penalty.ts`), generado desde la
constante. ⚠️ Copy provisional (`CONTENT_CHECKLIST.md` #43).

**Rama:** `feat/castigo-animado`

_Contexto común de la unidad (antes `32-castigo-animado.md`): en D132._
