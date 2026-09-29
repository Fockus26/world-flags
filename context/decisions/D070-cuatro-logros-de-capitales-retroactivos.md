# D070 · Logros · Cuatro logros de Capitales, retroactivos · Implementado

**Resumen:** Cuatro logros de Capitales, retroactivos: Capitales de Europa, primer rush, rush de "Todo el mundo" y "Tres en uno" (compartido: un continente en los tres juegos). Texto neutro en `pulso_firme` y `cinco_veces_impecable`. 1.1.0 + cambio de bytes en `sw.js` sin subir `CACHE_NAME`

Cuatro, espejo de los de Países (D036), aprobados por el dueño (pregunta 6 del
plan). Todos retroactivos. ⚠️ Nombres y textos provisionales
(`CONTENT_CHECKLIST.md` #23).

| id | Nombre | Condición | Juego |
|---|---|---|---|
| `capitales_de_europa` | Capitales de Europa | Las 45 de Europa aprendidas en Capitales | Capitales |
| `primer_rush_de_capitales` | Contrarreloj de capitales | Un rush de Capitales terminado: está en el historial **o** hay algún mejor tiempo (el historial se recorta, los tiempos no) | Capitales |
| `capitales_del_mundo` | La vuelta a las capitales | Mejor tiempo de "Todo el mundo" en Capitales | Capitales |
| `tres_en_uno` | Tres en uno | Un continente completo en los tres juegos a la vez | Compartido |

- El motor no cambia (D017: nada se des-desbloquea). El modal ya filtraba por
  `gameType`, así que en Capitales se ven sus tres más los compartidos.
- Los que filtran por juego ya excluían Capitales (`rush_impecable` y
  `sin_frenos` piden Banderas; `primer_tablero`, Países).
  `tests/unit/capitals-achievements.test.ts` comprueba que el progreso de
  Capitales solo desbloquea logros de Capitales o compartidos, la
  retroactividad y que "Tres en uno" pide el **mismo** continente.
- **Texto neutro en dos compartidos** (aprobado, pregunta 6): leen
  `stats.*` de todos los juegos pero decían "banderas". Ahora: "Acierta 500
  respuestas en total" (`pulso_firme`) y "Completa 5 sesiones sin un solo
  fallo" (`cinco_veces_impecable`). Los ids no cambian.

## Cierre (1.1.0)

- `package.json` 1.0.1 → **1.1.0** (MINOR: juego nuevo) y su entrada en
  `CHANGELOG.md`: primer aviso real de "Novedades".
- `public/sw.js`: comentario nuevo (cambio de bytes, D062) sin subir
  `CACHE_NAME`, para que las pestañas con la versión anterior vean "Actualizar".
- e2e (`bun run test:e2e`): 13 de 14. Hubo que ajustar la suite en dos puntos,
  los dos intencionales: la URL base sale de `BASE_URL` (estaba fija en el
  puerto 4321) y el paso que elige Banderas busca el texto **visible**, porque
  el selector de D066 también pinta un `<option>Banderas</option>` oculto. T14
  falla sin relación con esta rama: busca `getByText('Oscuro', { exact: true })`
  y la opción dice "🌙 Oscuro" desde hace meses; queda reportado, no se toca.

## QA de diseño (subagente `design-qa`, navegador real) y qué se hizo

Arreglado en esta rama, porque es código de esta rama:

- **La tarjeta de Capitales cortaba el nombre con poca altura** (móvil
  apaisado con el aviso abierto: tarjeta de 48 px, texto `text-5xl` de 60 px).
  Ahora el tamaño sale del hueco real con unidades de contenedor:
  `text-[clamp(0.9rem,min(32cqh,9cqw),3rem)]` sobre `[container-type:size]`, y
  el relleno es solo horizontal. Medido: 844×390 con el aviso → 14 px y cabe;
  320 px con "San Vicente y las Granadinas" → 24 px; 1280 px → 48 px. Es un
  tamaño de letra arbitrario nuevo, a propósito: sustituye a tres de la
  escala (`text-3xl/4xl/5xl`) que no podían depender del alto (**excepción de
  D067**).
- **Márgenes duplicados**: `StimulusFrame` (`session/StimulusFrame.tsx`) es
  el hueco común de `FlagDisplay` y `CapitalCard`. Los márgenes heredados de
  `FlagDisplay` viven en un solo sitio; Banderas se ve igual.
- **Alto contraste de Windows**: la píldora del selector se pintaba del color
  del fondo y no se veía qué juego estaba elegido. Ahora usa `Highlight` y
  `HighlightText` con `forced-color-adjust-none` (captura con
  `forcedColors: "active"`: la opción marcada se ve rellena).
- **Objetivos táctiles**: pastillas y opciones del desplegable a 44 px
  (`min-h-11`); antes medían 34-36 px.
- **Desplegable sin marca de la opción elegida**: `ui/Select` añade
  `ListBox.ItemIndicator` (✓), la API de HeroUI v3 consultada en Context7. El
  cambio afecta también al desplegable de avatar de `AccountTab`, igual de
  aditivo.

Solo reportado, porque viene de antes y es código cerrado (regla del repo):

- **Crítico: con zoom 400 % (320×225) no se llega al aviso ni a los botones
  de nota**, en Capitales y en Banderas. La sesión tiene alto fijo sin
  scroll (WCAG 1.4.10). Con teclado siguen funcionando 1-4. Capitales lo
  agrava un poco con la nota, y a ese tamaño la tarjeta se queda en 0 px
  (el país sigue en la pregunta del input). Propuesta: que el contenedor de la
  sesión haga scroll vertical cuando falte altura, en su propia unidad.
- "Correcto:" y la respuesta salen en líneas separadas (`Alert.Content` apila
  en columna), también en Banderas.
- Contrastes de antes que salen en pantallas de Capitales: "Difícil" en hover
  (4,38:1) y la etiqueta "tiempo" de resultados en claro (3,96:1).
- Decisiones de diseño anotadas, sin cambio: las pastillas no marcan el hover;
  en la práctica diaria el país aparece dos veces (tarjeta y pregunta, D069).

## QA funcional (subagente `functional-qa`, navegador real) y qué se hizo

Verificado sin fallos:
- Un rush de "Todo el mundo" en difícil acepta las 197 capitales mostradas.
- Los tres juegos quedan aislados en progreso, práctica diaria, candado y mejores tiempos.
- Las pulsaciones dobles cuentan una sola vez.
- Un `gameType` desconocido ("trivia") no rompe la app.
- "Tres en uno" se comporta como debe.
- Banderas funciona igual que antes.

- **Arreglado (código de esta rama):** `normalizeCapital` pasa la respuesta a
  NFC, así que una tilde pegada como carácter aparte vale como la normal.
  Además acepta ´ ʼ como apóstrofo y ‐ ‑ ‒ – — como guion. Siguen haciendo
  falta en difícil; solo se acepta la tecla con la que salen. Tests en
  `capitals.test.ts` (89 en total). Los comentarios de `normalize-answer.ts`
  llevaban escapes `\u00…` en lugar de tildes desde la Fase 3; corregidos.
- **Alto, decisión del dueño antes de desplegar:** cliente viejo +
  `gameType: "capitals"` → la app falla (ver la corrección en D062).
- **Contenido, para el dueño:**
  - "Washington D.C." y "Washington DC" fallan en difícil. Solo valen
    "Washington D. C." (forma RAE/UE, con espacio) y "Washington".
  - "St John's" sin punto falla.
  - Kinshasa, Kyiv, Addis Abeba, Cotonou y Ramallah no valen en ningún modo
    (grafías no españolas; política A).
  - No se tocan sin su visto bueno.
- **Reportado, venía de antes:**
  - Dos pestañas: la que guarda después pisa el progreso de la otra, porque
    `saveLearningData` escribe el objeto entero y no hay listener de `storage`.
  - Un rush guarda `difficulty: "hard"` en la configuración, así que quien
    practicaba en fácil vuelve a difícil sin aviso (`startGame`).
  - Banderas tampoco normaliza NFC (`normalize` compartida).
  - Enviar vacío no muestra ningún mensaje.

## Verificación con cuenta real (2026-09-23, con permiso del dueño)

- **Supabase:** columna `capitals_game` aplicada al proyecto (migración
  `capitals_game`, `jsonb not null default '{}'`), comprobada en
  `information_schema`.
- **Rush de "Todo el mundo" con sesión iniciada:**
  - Las 197 capitales se respondieron por script y el rush terminó en 23,30 s.
  - Se desbloquearon los tres logros de Capitales.
  - La fila `capitals:world` apareció en `leaderboard_entries` y en el modal
    de ranking, en la pestaña Capitales, como #1.
- **Segundo dispositivo:** simulado borrando el progreso local sin cerrar sesión
  y recargando. Todo llegó de la nube: 197 capitales, el mejor tiempo y el juego
  elegido. Banderas (3) y Países (0) sin cambios.
- **A1 confirmado en navegador:** con el bundle de `main` en otro puerto y
  `gameType: "capitals"` en la configuración, la app se queda en blanco con
  `Cannot read properties of undefined (reading 'countryHistory')`.
- **Lector de pantalla:** no se pudo escuchar Narrador (no hay salida de texto
  verificable). Se comprobó el árbol de accesibilidad, que es lo que lee:
  - El input recibe el foco con el nombre "¿Cuál es la capital de Bolivia?".
  - Al fallar, un `role="alert"` contiene la respuesta, "También vale…" y la
    nota.
  - Enter envía la respuesta (Playwright).

**Rama:** `feat/modo-capitales`

_Contexto común de la unidad (antes `16-modo-capitales.md`): en D061._
