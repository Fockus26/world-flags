# Registro de cambios

Todo lo que cambia en World Flags para quien juega, de la versión más nueva a la
más vieja. La app muestra este mismo texto en "Novedades" (Perfil y
configuración).

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y
las versiones siguen el [Versionado Semántico](https://semver.org/lang/es/).
Cómo se añade una entrada y cuándo se sube cada número: ver
[CONTRIBUTING.md](./CONTRIBUTING.md#changelog-and-versioning).

## [2.10.1] - 2026-10-19

### Corregido

- En el móvil, el campo donde escribes la respuesta ya no muestra sugerencias
  del teclado, autocorrector ni el autorrellenado de tarjetas o direcciones del
  navegador: es un campo de texto libre para escribir el país o la capital.
- Con las animaciones reducidas, un doble clic en Empezar o Sí, abandonar ya no
  pulsa también el botón que aparece debajo.

## [2.10.0] - 2026-10-19

### Añadido

- En Configuración, pestaña Juego, hay una opción Notificaciones para activar o
  desactivar el recordatorio diario en este dispositivo cuando quieras.

### Corregido

- Un doble clic en el botón de una ventana (Empezar, Sí, abandonar…) ya no pulsa
  también lo que queda debajo al cerrarse: hace lo mismo que un clic.
- Con teclado o lector de pantalla, al pulsar Todos o Ninguno en el selector de
  países el foco pasa al botón que queda, en vez de saltar a Cerrar.
- Al abandonar una partida o la práctica diaria, el foco vuelve al título de la
  pantalla de inicio.
- Si el perfil guardado en el navegador está dañado, la app ya no se queda en
  "Algo salió mal": recupera el nombre y el avatar por defecto.

## [2.9.0] - 2026-10-19

### Añadido

- Página propia cuando abres una dirección que no existe, con un botón para
  volver a practicar.
- Si la app falla al mostrarse, ahora ves una pantalla para reintentar o
  recargar en vez de una pantalla en blanco. Tu progreso no se pierde.
- El texto que seleccionas se resalta con el color de la app, en tema claro y
  oscuro.

### Cambiado

- En Aprender por lotes, la partida se titula "Lote N de M", Resultados dice
  "Lote en marcha" y el botón para no abandonar dice "Cancelar".
- El título de la pestaña y de los enlaces compartidos ya no repite el nombre:
  ahora dice "Banderas del Mundo — Aprende con repetición espaciada".

### Corregido

- La nota de Resultados se lee mejor en tema claro.
- Con teclado o lector de pantalla, el foco ya no se pierde al empezar o
  abandonar un aprendizaje por lotes, al llegar a Resultados o volver al inicio,
  al responder una tarjeta ni al pulsar Todos o Ninguno en el selector de
  países.

## [2.8.3] - 2026-10-13

### Corregido

- Los botones "Práctica diaria" y "Sí, abandonar" tienen un color más oscuro
  para que su texto se lea mejor.
- En el tema oscuro, la nota baja de los resultados se lee mejor sobre su
  círculo rojo.

## [2.8.2] - 2026-10-13

### Corregido

- Si abres el ranking justo después de batir tu marca, tu tiempo nuevo aparece
  en cuanto se guarda, sin tener que cerrarlo y volver a abrirlo.
- En Países, la sesión ya no se queda trabada cuando la última bandera vuelve a
  salir sola: se puede calificar otra vez y la sesión termina y se guarda.
- Con el temporizador activo, una bandera que vuelve a salir enseguida empieza
  con el tiempo completo en lugar de seguir con lo que le quedaba (o saltarse
  sola si se había agotado).
- Al compartir el enlace del juego, la vista previa muestra el nombre Banderas
  del Mundo, una descripción al día y la imagen carga más rápido.
- Los avisos de la app (recordatorio diario y actualización obligatoria) llaman
  al juego Banderas del Mundo.

## [2.8.1] - 2026-10-13

### Cambiado

- Los botones Todos y Ninguno del selector de países ya no saltan al cambiar y
  se ven más discretos.

## [2.8.0] - 2026-10-13

### Añadido

- Nuevo botón de dado para ver más avatares en tu perfil.

### Corregido

- Mejor contraste en algunos enlaces de color morado.
- En el selector de países ya puedes tocar en cualquier parte de la fila del
  continente o del país.
- Ya puedes cerrar el tutorial con la tecla Escape.

## [2.7.1] - 2026-10-12

### Cambiado

- El ranking abre al instante si lo acabas de ver: durante un minuto, volver a
  abrirlo o ir y volver entre continentes no lo descarga de nuevo. Al subir una
  marca nueva, cambiar tu nombre o avatar, o entrar y salir de tu cuenta, se
  vuelve a pedir para que veas siempre tu tiempo al día.

### Corregido

- Aprender por lotes ya no da por sabidos los países de un continente donde tu
  nota no es 10/10; los recorridos que salían completados se reabren con esos
  países en sus lotes.
- Cuando una bandera vuelve a salir en la misma sesión, acertarla otra vez ya no
  la manda días más adelante como si la hubieras repasado en días distintos: en
  cada sesión avanza como mucho un paso. Fallarla en la repetición sí cuenta, y
  varios "Otra vez" seguidos cuentan como un solo fallo.

## [2.7.0] - 2026-10-03

### Añadido

- Aprender por lotes: elige un continente, varios o todo el mundo y apréndelo de
  a 3, 5 o 10 países, en orden o al azar. Cada país se consolida cuando lo
  aciertas a la primera en dos días distintos, y al consolidar todo el lote se
  abre el siguiente. Funciona en Países, Banderas y Capitales, y se sincroniza
  con tu cuenta.

## [2.6.2] - 2026-09-29

### Cambiado

- La app carga su tipo de letra más rápido y lo conserva sin conexión, en lugar
  de pasar a la letra del sistema.
- La app descarga menos código al abrirse. El cronómetro por pregunta, el aviso
  de "Revisa tu correo" y la lista de países de cada continente mantienen sus
  animaciones.

### Corregido

- Los bordes de los campos de texto y de los desplegables se distinguen mejor en
  tema claro.
- Al abrir la app ya no se vuelve a dibujar entera en el primer instante. Pasaba
  cuando la abrías un día distinto al de la última actualización o desde otra
  zona horaria, por culpa del calendario de racha.
- Al compartir el enlace de World Flags, la vista previa muestra ahora la imagen
  de la app completa en lugar de un icono recortado.
- Las mejores marcas del modo competitivo vuelven a subir al ranking. Durante
  unos días, un récord nuevo se quedaba solo en tu dispositivo; ahora se sube
  solo, también el que ya tenías guardado.
- El progreso de las cuentas vuelve a guardarse en la nube. Desde la última
  actualización aparecía "No se pudo sincronizar" y los cambios se quedaban solo
  en el dispositivo; al actualizar se suben solos.

## [2.6.1] - 2026-09-28

### Cambiado

- Las tarjetas de continente y de tipo de juego responden al pasar y al pulsar:
  se elevan un poco, se hunden al tocarlas y la que eliges da un pequeño salto.
  Las opciones de los ajustes también se hunden y saltan al elegirlas.
- La partida responde con una animación al acertar o fallar, y cada bandera
  nueva entra deslizándose.
- Resultados más vivos: los números cuentan hacia arriba y batir tu récord se
  celebra con confeti.

### Corregido

- La opción elegida del tipo de juego se lee bien en tema oscuro y el contorno
  de foco de los ajustes ya no se corta.
- El ranking deja más sitio a tu nombre en pantallas pequeñas y el selector de
  países aprovecha el ancho.
- El selector de países muestra los nombres largos completos en dos líneas.
- El tiempo de la práctica diaria ya no se descuadra si cambia la hora del
  dispositivo.
- Al cambiar de tema, los colores cambian al instante y ya no se quedan a medias
  si la pestaña estaba en segundo plano.
- El tema elegido ya no da error en navegadores que bloquean el almacenamiento.
- Los números de los iconos de logros y del menú se leen mejor en el tema claro.
- En tema oscuro del sistema, los ajustes y botones ya no aparecen un instante
  en claro.
- El tiempo de la práctica de Países no se descuadra si cambia la hora del
  dispositivo.

## [2.6.0] - 2026-09-26

### Añadido

- Nuevos sonidos: al elegir opciones, al empezar, al saltar, en el castigo del
  competitivo y al batir tu récord.
- Al terminar un rush con mejor tiempo que tu marca anterior, los resultados lo
  dicen: "¡Nuevo récord!".

### Cambiado

- Saltar una bandera ya no suena como un fallo: tiene su propia nota.
- Ranking: el podio se destaca con oro, plata y bronce, y las filas se leen
  mejor.

## [2.5.0] - 2026-09-26

### Añadido

- El ranking ahora también tiene clasificación por continente: elige el
  continente arriba de la lista. Cuenta un rush de un continente completo.

### Cambiado

- En el modo competitivo de Banderas y Capitales, el castigo por fallar o saltar
  ahora aparece como +10 s o +20 s junto al cronómetro, que salta en ese mismo
  momento; el aviso de fallo ya no lo repite.
- En Banderas y Capitales, los mejores tiempos por continente empiezan de cero
  con la regla de castigo actual (+10 s por fallo, +20 s por saltar), igual que
  pasó con Todo el mundo. En Países se conservan.

### Corregido

- Un tiempo imposible (por ejemplo, si el reloj del dispositivo cambia a mitad
  de partida) ya no se guarda como mejor marca.
- Tu mejor tiempo en el ranking ya no puede ser sustituido por uno peor.
- El enlace "Saltar al contenido principal" se lee mejor en el tema claro.

## [2.4.3] - 2026-09-24

### Corregido

- Si juegas con el teclado, el contorno que marca dónde estás aparece ya con su
  color, sin pasar antes un instante por el color del texto.
- En el móvil, al tocar las pestañas de Perfil y configuración, las listas
  desplegables o las versiones de Novedades ves el mismo efecto que al pasar el
  ratón por encima en el ordenador, y desaparece al soltar.
- Con lector de pantalla, el enlace "Saltar al contenido principal" está dentro
  de su propia zona de navegación, "Accesos directos".

## [2.4.2] - 2026-09-24

### Corregido

- El sonido de respuesta incorrecta se oye ahora tan fuerte como el de acierto,
  también en el altavoz del móvil, donde antes casi no se oía.
- Los avisos de logro ya no parpadean al desaparecer, sobre todo cuando
  consigues varios a la vez.
- Al aceptar el recordatorio diario, el navegador te pide permiso para enviar
  notificaciones. Si no se puede activar (las tienes bloqueadas, estás en un
  iPhone sin la app instalada o el navegador no las admite), el aviso te dice
  por qué y cómo arreglarlo en vez de cerrarse sin más.

## [2.4.1] - 2026-09-24

### Cambiado

- Al abrir el ranking, las filas de carga aparecen al momento en vez de dejar
  un hueco vacío, y la ventana crece o se encoge con suavidad cuando llegan los
  tiempos (sin animación si tienes activado reducir el movimiento).

## [2.4.0] - 2026-09-24

### Añadido

- Si tienes abierta una versión de la app que ya no es compatible, la app te
  pide actualizar antes de seguir jugando, con un solo botón. Tu progreso
  guardado se conserva. Sin conexión puedes seguir jugando como siempre.

### Corregido

- El aviso de que hay una versión nueva vuelve a salir en cada versión, también
  con la app ya abierta. Desde hace varias versiones no aparecía.

## [2.3.1] - 2026-09-24

### Cambiado

- El panel de la racha tiene la misma forma en todas las pantallas: tu racha y
  tu mejor racha arriba y, debajo, el calendario del mes a todo el ancho.

## [2.3.0] - 2026-09-24

### Añadido

- En "Cómo se juega" ya puedes elegir a qué juego es la partida de ejemplo:
  Países, Banderas o Capitales.

### Cambiado

- Mientras juegas la partida de ejemplo ya no hay nada encima de ella: tiene
  el mismo tamaño que una partida normal. Que no cuenta para tu progreso se
  dice justo antes de empezarla, y se sale con "Abandonar".

## [2.2.1] - 2026-09-24

### Seguridad

- El ranking rechaza los tiempos imposibles de conseguir jugando, para que nadie
  pueda colarse arriba con un tiempo inventado. Si te pasa con un tiempo tuyo, tu
  marca se queda guardada en tu progreso aunque no aparezca en el ranking.

## [2.2.0] - 2026-09-24

### Añadido

- En el móvil, Logros, Ranking y Elegir países están ahora en un menú (el botón
  de los tres puntos), cada uno con su nombre. Si tienes logros sin ver, el
  botón del menú lo avisa con un número.

### Cambiado

- En el móvil, las ventanas se cierran con una X arriba a la derecha en vez del
  botón "Cerrar".
- En el ordenador y la tableta, el panel de la racha ocupa todo el ancho: tu
  racha y tu mejor racha a un lado y el calendario del mes al otro.
- Las listas desplegables, como la de elegir qué practicar en el móvil, se
  abren y se cierran con una animación que ahora sí se nota.

## [2.1.4] - 2026-09-24

### Cambiado

- Si juegas con el teclado, el contorno que marca dónde estás toma el color del
  botón o de la tarjeta (rojo en "Cerrar" o "Abandonar", el color de tu nota en
  cada continente…) en vez de ser siempre morado.
- En el móvil, al tocar un botón o una tarjeta ves el mismo efecto que al pasar
  el ratón por encima en el ordenador, y desaparece al soltar.

### Corregido

- Algunos controles no marcaban nada al llegar a ellos con el teclado: los
  continentes y las casillas de países al elegir países sueltos, "Gestionar
  sesión" y la X de los avisos de logro. Ahora se ven.

## [2.1.3] - 2026-09-24

### Corregido

- Si empiezas desde cero, tu primer logro ya te avisa (y suena) al ganarlo.
  Antes se guardaba sin decir nada y solo lo veías al abrir la lista de logros.

## [2.1.2] - 2026-09-24

### Corregido

- Al pedir otra vez el correo de confirmación de la cuenta ya no aparece
  "Correo reenviado" si el envío falló: ahora se explica qué pasó para que
  puedas volver a intentarlo.
- El enlace del correo de confirmación te devuelve a la misma dirección desde
  la que te registraste.

## [2.1.1] - 2026-09-24

### Corregido

- En tema claro, el texto de la opción que tienes elegida en los ajustes de
  partida (modo, orden, dificultad, temporizador y tema) se lee mejor: ahora es
  blanco puro sobre el morado. También en la partida guiada.

## [2.1.0] - 2026-09-24

### Añadido

- Ahora suena un sonido corto al acertar y otro al fallar, en Banderas, Países y
  Capitales, en práctica, en competitivo y en la práctica diaria. Saltar una
  pregunta suena como un fallo.
- En el competitivo de Países cada país que encuentras suena con un toque corto,
  para que no se amontonen si escribes rápido.
- Al desbloquear logros suena una pequeña fanfarria, una sola vez aunque
  consigas varios a la vez.
- Puedes apagar los sonidos en Perfil y configuración, pestaña Juego, en
  "Sonidos". Se guarda en este dispositivo.

## [2.0.1] - 2026-09-24

### Cambiado

- En "Cómo se juega", la partida de ejemplo se juega al mismo tamaño que una
  partida normal, en vez de en una ventana pequeña.
- El recorrido ya no repite en cada paso que la partida es de ejemplo: lo dice
  una vez, mientras la juegas.
- En el último paso ya no sale "Saltar tutorial": para cerrar está "Empezar a
  jugar".

## [2.0.0] - 2026-09-24

### Añadido

- El ranking enseña ahora los 20 mejores tiempos, y si estás más abajo sigues
  viendo tu puesto debajo.
- Cada jugador del ranking aparece con su avatar. Si cambias tu nombre o tu
  avatar, el ranking se actualiza solo.
- Mientras el ranking carga, ves la forma de la lista en vez de un "Cargando".

### Cambiado

- El modo competitivo de Banderas y Capitales castiga más: cada respuesta
  incorrecta suma 10 segundos al cronómetro y cada bandera o capital saltada,
  20 segundos. Al fallar ves cuánto se sumó.
- Con el castigo nuevo, los tiempos de antes ya no se pueden comparar con los
  de ahora, así que el ranking de Banderas y el de Capitales empiezan de cero.
  Tu mejor tiempo de "Todo el mundo" en esos dos juegos también vuelve a
  empezar; los de cada continente y los logros que ya tenías se quedan.
- El ranking y los tiempos de Países no cambian: su competitivo no tiene
  castigo.

## [1.3.0] - 2026-09-23

### Cambiado

- La ventana de Logros es más ancha y enseña varias tarjetas por fila, así ves
  más logros de un vistazo sin tener que bajar tanto.
- En Novedades solo se despliega la versión que estás usando; las anteriores
  salen recogidas y se abren de una en una al pulsarlas.

## [1.2.0] - 2026-09-23

### Añadido

- La primera vez que abres la app te ofrece una partida guiada: te cuenta los
  tres juegos, los modos Práctica y Competitivo, el orden, la dificultad y el
  temporizador, y te deja jugar un ejemplo de Norteamérica con tres países.
- La partida de ejemplo no cuenta para nada: ni tu progreso, ni tu racha, ni
  tus mejores tiempos, ni el ranking. Puedes fallarla entera.
- Puedes saltarla cuando quieras, y volver a verla siempre que te apetezca
  desde "Cómo se juega", abajo del todo en Perfil y configuración.
- Si ya tenías progreso guardado, la partida guiada no te aparece sola.

## [1.1.0] - 2026-09-23

### Añadido

- Un tercer juego, Capitales: ves el nombre de un país y escribes su capital.
  Tiene lo mismo que Banderas: práctica con repetición espaciada, competitivo
  contrarreloj con su propio ranking de "Todo el mundo" y práctica diaria.
- En los países con más de una capital valen todas (por ejemplo, Sucre y La
  Paz en Bolivia), y al responder se muestran las otras que también valen y una
  nota cuando hace falta.
- En difícil y en el competitivo de Capitales cuentan las tildes, los guiones y
  los apóstrofos; en fácil no.
- Cuatro logros nuevos: tres de Capitales y "Tres en uno", por aprender un
  continente completo en los tres juegos.

### Cambiado

- El selector de juego tiene tres opciones; en pantallas estrechas es una lista
  desplegable.
- Dos logros compartidos ya no hablan solo de banderas: "Acierta 500 respuestas
  en total" y "Completa 5 sesiones sin un solo fallo".

### Corregido

- El resumen de una práctica de Países decía "banderas a la primera"; ahora
  dice "países".
- En el selector de juego, el marcador de la opción elegida quedaba un poco
  corrido a la derecha.

## [1.0.1] - 2026-09-23

### Corregido

- Al pulsar Enter dos veces seguidas en el competitivo de Banderas ya no se
  salta la bandera siguiente.
- Pulsar dos veces seguidas una tecla del 1 al 4 al calificar (en la práctica
  de Banderas y en la práctica diaria) ya no califica dos veces la misma
  tarjeta.

## [1.0.0] - 2026-09-21

### Añadido

- Dos juegos: Países, para aprender qué países hay en cada continente (cada uno
  vuela a su hueco en un tablero), y Banderas, donde ves una bandera y escribes
  su país.
- Modo práctica con repetición espaciada al estilo Anki: calificas cada
  respuesta y la app te vuelve a preguntar antes lo que olvidas que lo que ya
  dominas. Lo que fallas vuelve en la misma sesión, y cada país se practica una
  vez al día.
- Práctica diaria con todo lo que te toca repasar hoy, en cada juego por
  separado.
- Modo competitivo contrarreloj, con tu mejor tiempo por continente y en todo el
  mundo. En Banderas, fallar o saltar suma segundos; en Países puedes rendirte y
  ver los que te faltaron.
- En la práctica de Países, una tarjeta con el país que falta y pistas letra a
  letra. En la de Banderas, dificultad fácil o difícil (con tildes), orden
  alfabético o aleatorio y un temporizador opcional por bandera.
- Eliges qué practicar: todo el mundo, varios continentes a la vez o países
  sueltos elegidos a mano.
- Nota por continente con el promedio de tus últimas 3 partidas, y nota de Todo
  el mundo cuando ya practicaste los 8 continentes.
- Ranking público del mejor tiempo en Todo el mundo, uno por juego: los 5
  primeros y tu puesto.
- Logros en seis categorías (descubrimiento, continentes, velocidad, precisión,
  constancia y meta), separados por juego y con aviso al desbloquear uno. El
  progreso que ya tenías también cuenta.
- Racha de días seguidos, con un calendario de tu actividad del mes.
- Recordatorio diario opcional por notificación.
- Cuenta con correo y contraseña o con Google para guardar tu progreso en la
  nube y seguir en cualquier dispositivo. Sin cuenta juegas como invitado y el
  progreso se queda en tu navegador.
- Perfil con tu nombre y un avatar a elegir.
- Funciona sin conexión: lo que practiques se guarda y se sube a tu cuenta
  cuando vuelve la red, y la app te avisa del estado de la conexión. Las 197
  banderas se descargan una vez para practicar cualquier continente sin
  internet (no con ahorro de datos ni en redes 2G).
- Se instala como app en el móvil o el ordenador y avisa cuando hay una versión
  nueva.
- Tema claro, oscuro o el del sistema.
- 197 países: los 193 miembros de la ONU, el Vaticano, Palestina, Kosovo y
  Taiwán.
- Novedades: esta lista de cambios dentro de la app, con la versión que estás
  usando. Cuando la app se actualiza, un aviso te ofrece verla.
