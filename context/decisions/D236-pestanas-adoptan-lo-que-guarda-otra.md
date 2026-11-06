# D236 · Datos · Varias pestañas: cada una adopta lo que guarda otra antes de escribir · Implementado

**Origen:** QA funcional de D235 (repro `.qa/repro/23-dos-pestanas-pisan-sesion.mjs`). Con el mismo invitado abierto en dos pestañas, cada una guardaba su estado entero en `world-flags-learning-data` y pisaba lo que había jugado la otra: dos sesiones del lote contaban 1, y se perdían los aciertos, los repasos SM2 y las estadísticas de la primera. Ya pasaba antes de D235.

- **Escucha de `storage`:** `useOtherTabsLearningData` (en `GameEffects`) se suscribe con `subscribeToOtherTabsLearningData` y, en cada escritura de otra pestaña, llama a `adoptOtherTabLearningData`. Lo adoptado entra en Redux con `setLearningData`, así la siguiente escritura de esta pestaña parte de ahí.
- **Fusión:** `mergeLearningData(lo de la otra pestaña, lo de esta, base)`, las mismas reglas que con la nube (D048, D055, D185, D235). La base es lo último que esta pestaña leyó o escribió en la clave (`lastKnownRaw` en `learning-storage.ts`, al día en `getLearningData`, `saveLearningData` y `clearLearningData`). Si esta pestaña no cambió nada desde entonces, lo de la otra gana en los campos sin fecha.
- **Escritura:** solo si lo de esta pestaña aporta algo que la otra no tenía (escribieron casi a la vez), y entonces se guarda la fusión. Si no, no se escribe nada, y así las pestañas no se contestan sin fin. La comparación es por valor (`isSameValue`), no depende del orden de las claves.
- **Solo entre datos del mismo dueño:** el dueño de lo guardado es la cuenta de la base de sincronización (se escribe en la misma tarea que los datos, D049), o `null` si es invitado. Si no coincide con el de esta pestaña (otra pestaña entró o salió de una cuenta), no se fusiona: lo resuelve la hidratación de esa transición, y los datos del invitado nunca se mezclan con los de una cuenta (D056).
- **Cuándo escucha:** solo con `hydrationStatus` `ready`. Durante una hidratación manda ella.
- **Lo que no cubre:**
  - Clave borrada (logout en otra pestaña): la lleva el flujo de sesión.
  - Dos escrituras en el mismo milisegundo, antes de que ninguna pestaña reciba el evento de la otra: la siguiente escritura de cualquiera las une.
- **Arreglos de la QA funcional** (repros `.qa/repro/24…27`):
  - **Una escritura por acción, siempre completa:** la vista de `toGameView` (Capitales, Países) va marcada con un símbolo (`GAME_VIEW`) y `saveLearningData` no la guarda. Solo se guarda lo que devuelve `fromGameView`, ya sin la marca. Antes, la vista pasaba por `localStorage` y la otra pestaña la fusionaba como si fuera Banderas.
  - **La base antes que los datos:** la hidratación de la cuenta (`GameEffects`) y `restorePendingAccountData` guardan la base de sincronización antes que los datos. La otra pestaña reacciona a cada `setItem` por separado, y con el orden inverso tomaba los datos de la cuenta por los del invitado (D056).
  - **La sesión es del lote con que empezó:** `activeGame.learningPathId`. Si otra pestaña abandona el lote o crea otro a mitad, lo jugado no cuenta en el nuevo, ni la sesión ni los aciertos.
  - **Los logros los anuncia la pestaña donde se ganan:** `AchievementsEffects` no evalúa los datos que acaban de llegar de otra pestaña (`isFromOtherTab`). El sello llega con la siguiente escritura de esa pestaña.
- **Persistencia:** sigue pasando solo por `learning-storage.ts`. Redux, solo desde `store/slices` y el hook.
- **Tests:** `tests/unit/cross-tab-merge.test.ts`.
