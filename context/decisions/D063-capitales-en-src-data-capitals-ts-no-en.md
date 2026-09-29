# D063 · Contenido · Capitales en `src/data/capitals.ts` (no en `Country`): `{ name, accepted?, note? }`, cobertura 197/197 por test · Implementado

**Resumen:** Capitales en `src/data/capitals.ts` (no en `Country`): `{ name, accepted?, note? }`, cobertura 197/197 por test. Se muestra la forma de la UE (Libro de estilo interinstitucional, Anexo A5, 16-09-2026, consultado con la RAE); ciudad y fechas de Wikidata P36; Wikipedia (en) como tercera. Guinea Ecuatorial: Ciudad de la Paz desde 03-01-2026

- **`src/data/capitals.ts`**, no un campo `capital` en `Country`. `Country` es
  el catálogo que comparten los tres juegos (y viaja en `activeGame.countries`);
  los alias y las notas son contenido solo de Capitales. Un futuro `aliases`
  de nombres de país (fuera de alcance en Países) iría en `Country`: así no se
  mezclan. Forma: `Record<código, Capital>`, con `Capital = { name,
  accepted?, note? }` (`types/country.ts`).
- **Cobertura por test, no por un `throw` al importar** como el de
  `countries.ts`: `tests/unit/capitals.test.ts` exige una entrada por país del
  catálogo y ni una más. Si faltara una en ejecución, `getCapital` devuelve
  `undefined` y la sesión trata el país como fuera de catálogo (D040), nunca
  una tarjeta sin respuesta.
- **Fuentes** (consultadas el 2026-09-22; el detalle, las consultas para
  reproducirlo y la tabla completa están en el anexo local
  `context/plans/modo-capitales-capitales.md`):
  - **Se muestra la forma de la UE**: *Libro de estilo interinstitucional*,
    Anexo A5, versión en español actualizada el 16-09-2026, elaborada «en
    consulta con la Real Academia Española» y el Ministerio de Exteriores
    español. Donde la UE no da capital (Kosovo, Israel, Palestina, Santa
    Sede), la de Wikidata.
  - **Qué ciudad y desde cuándo**: Wikidata, P36 con sus fechas y roles, y sus
    etiquetas y alias en español. En 176 de 197, UE y Wikidata escriben lo
    mismo letra por letra; el resto son grafías o casos de D064.
  - **Tercera referencia**: Wikipedia (en), «List of national capitals».
  - No se pudo usar la lista de la RAE (403 de Cloudflare, no se forzó) ni el
    World Factbook de la CIA (ya no existe).
- Hallazgos que no se habrían acertado de memoria: **Guinea Ecuatorial cambió
  de capital el 03-01-2026** (Malabo → Ciudad de la Paz, las tres fuentes);
  Burundi es Guitega desde 2019. Indonesia tiene designada Nusantara sin
  traslado oficial todavía: se revisa en cada PR que toque el archivo.

**Rama:** `feat/modo-capitales`

_Contexto común de la unidad (antes `16-modo-capitales.md`): en D061._
