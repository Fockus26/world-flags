# D029 · Persistencia · `toGameView`/`fromGameView` proyectan el progreso del juego pedido sobre los campos de primer nivel · Implementado

**Resumen:** `toGameView`/`fromGameView` proyectan el progreso del juego pedido sobre los campos de primer nivel, así las funciones puras de `learning-storage.ts` no necesitan saber que existe un segundo juego

Ninguna de las funciones puras existentes (`saveReviewResult`,
`registerRegionGame`, `registerRegionBestTime`, `registerCountryPracticed`,
`getUnpracticedCodesToday`, `hasPracticedCountryToday`, `getDueCountries`,
`countLearnedCountries`…) sabe que existe un segundo juego: todas siguen
leyendo/escribiendo los campos de primer nivel, exactamente igual que antes.

En su lugar, `toGameView(data, gameType)` proyecta el progreso del juego
pedido sobre esos campos de primer nivel (para "flags" es la identidad; para
"countries" copia `countriesGame.*` encima), y `fromGameView(original, view,
gameType)` hace la inversa: restaura los campos de Banderas desde `original` y
mueve lo que cambió de vuelta a `countriesGame`, conservando de `view` todo lo
compartido que la función pura haya tocado (stats, sessionHistory,
achievements, lastConfiguration, profile).

Patrón de uso en `useGame.ts`:

```ts
const current = getCurrentLearningData();
const view = algunaFuncionPura(toGameView(current, gameType), ...);
const updatedData = fromGameView(current, view, gameType);
dispatch(setLearningData(updatedData));
```

**Ajuste sobre el diseño inicial del plan:** las funciones puras de
`learning-storage.ts` persisten por su cuenta (`saveLearningData(updatedData)`
dentro de cada una). Si `fromGameView` no volviera a persistir, lo que
quedaría escrito en `localStorage` tras una acción sobre Países sería la
VISTA a medio corregir (de primer nivel con el progreso de Países, y
`countriesGame` todavía desactualizado) — una recarga justo después de esa
acción y antes del siguiente cambio perdería la actualización. Por eso
`fromGameView` vuelve a llamar a `saveLearningData` con el objeto ya corregido
cuando `gameType !== "flags"` (para "flags" no hace falta: la función pura ya
persistió la forma correcta, al ser la identidad). Verificado con un
script de aserciones puras (ver Fase 1 en `context/plans/modo-paises.md`).

Alternativa descartada: pasar `gameType` como parámetro a cada función pura
de `learning-storage.ts` y que decida internamente dónde leer/escribir. Se
descartó porque multiplicaría por dos la superficie de cada función (rama
`if (gameType === "countries")` repetida en más de diez sitios) para un caso
que la proyección resuelve una sola vez.

_Contexto común de la unidad (antes `07-modo-paises.md`): en D028._
