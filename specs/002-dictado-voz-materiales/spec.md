# Spec 002 — Dictado por voz para añadir materiales

Estado: aprobada

## Contexto y objetivo

Añadir materiales se hace hoy de tres formas: buscando el material en un desplegable (o escribiendo
su nombre y eligiendo la sugerencia) con cantidad y unidad en el detalle de un registro; pegando en
el «modo rápido» una lista de líneas con el material, la cantidad y la unidad; o rellenando el
formulario de «Añadir materiales» de la ficha de una obra, que crea un registro nuevo con un
material. Las tres exigen teclear.

En el almacén se trabaja de pie, con las manos ocupadas (una caja, un palé, el móvil en una mano) y
muchas veces con guantes. Teclear nombres de material largos en un móvil es lento y produce errores:
nombres parecidos, cantidades que se cruzan, unidades que se olvidan. Dictar es más rápido y más
natural para quien ya está contando material en voz alta, y además se dicta como se habla
(«veinticinco», «dos coma cinco», «tres cuartos», «metros»), no como se escribe.

Objetivo: **poder introducir materiales hablando** en las tres formas de alta, con la garantía de
que **nada se da de alta sin que el usuario lo vea y lo confirme**, y que **lo que se dice se
entienda**: cantidades con palabras y en decimales, y unidades dichas por su nombre. El dictado es una
ayuda para rellenar; la decisión de añadir sigue siendo del usuario.

El dictado depende del navegador y de su proveedor de reconocimiento: no está disponible en todos los
navegadores y en algunos exige conexión a internet. El audio puede salir del dispositivo. Por eso esta
spec fija también cuándo se avisa al usuario y qué debe pasar cuando el dictado no está disponible,
para que ninguna pantalla se rompa ni se quede a medias.

## Usuarios

- **Almacenero / Administrador**: prepara y envía registros; añade materiales en el almacén, a menudo
  desde el móvil y con las manos ocupadas. Es el usuario que dicta.
- **Técnico**: consulta; no añade materiales, así que no ve ni la opción de dictar (permisos
  actuales sin cambios).

## Historias de usuario

- **HU-1.** Como almacenero, quiero dictar una lista de varios materiales de una vez en el modo
  rápido, para no tener que escribir cada línea con el móvil.
  *Cubre:* RF-1, RF-8, RF-15 a RF-25, RF-29 a RF-31, RF-39, RF-53, RF-54.
- **HU-2.** Como almacenero, quiero dictar un solo material con su cantidad y su unidad en el
  formulario de alta, para no equivocarme de material ni de cantidad.
  *Cubre:* RF-1, RF-32 a RF-38.
- **HU-3.** Como almacenero, quiero dictar el material mientras creo un registro nuevo desde la ficha
  de una obra, para no teclearlo con la obra ya elegida.
  *Cubre:* RF-1, RF-7, RF-32 a RF-38.
- **HU-4.** Como almacenero, quiero revisar y corregir lo que se ha entendido antes de que se añada,
  para que un error de reconocimiento no ensucie el registro.
  *Cubre:* RF-28 a RF-31, RF-33, RF-40, RF-48, RF-54.
- **HU-5.** Como almacenero, quiero dictar las cantidades como las digo en voz alta («veinticinco»,
  «dos coma cinco», «tres cuartos», «mil quinientos»), para no tener que decirlas cifra a cifra.
  *Cubre:* RF-41 a RF-52.
- **HU-6.** Como almacenero, quiero que, si el micrófono no está permitido o el navegador no puede
  dictar, se me diga claramente y no pierda lo que ya había escrito, para poder seguir trabajando a
  mano.
  *Cubre:* RF-5, RF-6, RF-56 a RF-63.
- **HU-7.** Como usuario, quiero que se me avise una sola vez de que mi voz se procesa fuera del
  dispositivo, aceptarlo una vez y poder releer el aviso después, para decidir si me apetece dictar
  delante de un cliente sin que se me pregunte en cada material.
  *Cubre:* RF-9 a RF-14, RF-16, RNF-4.
- **HU-8.** Como almacenero que trabaja de pie con el móvil, quiero poder dictar con una sola mano y
  ver qué está pasando, para no tener que sujetar el teléfono con las dos.
  *Cubre:* RF-17 a RF-22, RNF-3, RNF-6, RNF-11.
- **HU-9.** Como almacenero, quiero que dictar no interfiera con lo que estoy haciendo en la pantalla
  (añadir, plegar el modo rápido, escribir), para no duplicar ni perder materiales.
  *Cubre:* RF-2, RF-3, RF-4, RF-24, RF-26, RF-27, RF-31.
- **HU-10.** Como almacenero, quiero que la cantidad y la unidad se guarden tal como las digo («medio
  rollo», «veinticinco metros»), para no tener que corregirlas a mano después.
  *Cubre:* RF-37, RF-38, RF-55, RNF-8.

## Definiciones

- **Dictado**: acción de introducir texto hablando, a través del reconocimiento de voz que ofrece el
  navegador. No es una grabación.
- **Transcripción**: el texto que el navegador devuelve a partir de lo hablado. Puede llegar en
  tramos y puede contener errores de reconocimiento.
- **Tramo de dictado**: cada entrega de reconocimiento que hace el navegador, normalmente al hacer una
  pausa. Varios tramos forman la transcripción de una sesión.
- **Sesión de dictado**: el periodo entre pulsar «Dictar» y que la escucha se cierra (por «Detener»,
  por silencio o porque la cierra el navegador). Una sesión puede aportar uno o varios tramos.
- **Escucha activa**: el estado en el que el navegador está tomando audio del micrófono. Mientras
  dura, se muestra «Escuchando…» y la acción se puede detener.
- **Parada por silencio**: cierre de la sesión que ocurre cuando deja de detectarse voz durante
  **2 segundos**, sin que el usuario pulse nada. Se trata como un fin normal: lo dicho se conserva y
  se procesa.
- **Conversión de numerales**: paso que transforma las cantidades dichas con palabras en cifras
  («veinticinco» → 25, «dos coma cinco» → 2,5, «tres cuartos» → 0,75). Se aplica a **todo** el texto
  del modo rápido, venga del micrófono o del teclado, y a la cantidad que se extrae en el formulario
  de un material.
- **Línea** (modo rápido): el texto entre un salto de línea o un «;» y el siguiente; un prefijo «/» o
  «+» al principio se ignora. Una línea es un material.
- **Cantidad de la línea**: la **última** expresión numérica de la línea, que es la que hoy se toma
  como cantidad. Lo que va detrás deja de ser nombre: si el token siguiente es una palabra de unidad,
  se toma como unidad; si no, la interpretación actual no lo usa.
- **Palabra de unidad**: palabra, en singular o plural, que puede acompañar a una cantidad. Su
  vocabulario y su traducción están en la **tabla de unidades habladas**.
- **Tabla de unidades habladas**: correspondencia cerrada entre la palabra dictada y el código de
  unidad del catálogo: ud, uds, unidad, unidades → UD; m, metro, metros → M; m2, metro cuadrado,
  metros cuadrados → M2; kg, kilo, kilos → KG; l, litro, litros → L; rollo, rollos → ROLLO; caja,
  cajas → CAJA; paquete, paquetes → PAQUETE. «ml», «metro lineal» y «metros lineales» se reconocen para
  saber dónde está la cantidad, pero **no** se traducen, porque no hay unidad equivalente en el
  catálogo: en el formulario no tocan la unidad y en el modo rápido se quedan como están hoy.
- **Aviso de privacidad**: texto que explica que el audio lo procesa el proveedor del navegador, que
  puede salir del dispositivo y que la aplicación no lo guarda. Se muestra la primera vez y el
  usuario debe aceptarlo.
- **Modo rápido**: la zona de alta de varios materiales por líneas (hoy plegada como «Modo rápido:
  pegar una lista de materiales»), donde una línea es un material.
- **Formulario de un material**: el formulario de alta que elige un material del catálogo con
  cantidad y unidad. Existe en el detalle de un registro y, para crear un registro nuevo, en la ficha
  de una obra.
- **Navegador con dictado**: navegador que ofrece reconocimiento de voz y entrega texto en español,
  sin exigir resultados provisionales ni escucha continua (ver RNF-10).
- **Resultado provisional**: la transcripción de un tramo que aún puede cambiar y que el usuario ve
  mientras habla.
- **Coincidencia exacta**: nombre dictado y nombre del material iguales después de quitar tildes,
  pasar a minúsculas y reducir los espacios repetidos a uno. «Contiene» no es coincidencia exacta.

## Requisitos funcionales

### Dónde está el dictado

- **RF-1.** EL SISTEMA ofrece una acción de dictado en el formulario de un material del detalle de un
  registro, en el modo rápido del detalle de un registro y en el formulario de alta de materiales de
  la ficha de una obra, y solo en esos tres sitios.
- **RF-2.** SI el registro está en estado «Enviado», ENTONCES EL SISTEMA no ofrece la acción de
  dictado ni la nota de navegador sin soporte, igual que hoy no ofrece las de añadir.
- **RF-3.** SI el usuario no tiene permiso para añadir materiales, ENTONCES EL SISTEMA no le muestra
  la acción de dictado ni la nota de navegador sin soporte.
- **RF-4.** EL SISTEMA identifica la acción de dictado con el texto «Dictar» y un icono de micrófono,
  y junto a ella un enlace «Qué pasa con mi voz», de modo que se entienda sin interpretar el icono.
- **RF-5.** SI el navegador no admite dictado, ENTONCES EL SISTEMA no muestra la acción y deja, en su
  lugar y solo donde se ofrece el alta, una nota breve en español que indica que ese navegador no
  permite dictar y que se pueden escribir los materiales.
- **RF-6.** SI el dictado no está disponible (por el navegador, por falta de micrófono o por permiso),
  ENTONCES EL SISTEMA mantiene las tres formas de alta actuales, con sus validaciones y mensajes, y
  ninguna de ellas deja de funcionar.
- **RF-7.** CUANDO el usuario dicta en el formulario de alta de la ficha de una obra, EL SISTEMA
  rellena ese formulario sin crear el registro, sin cambiar la obra a la que pertenece y sin tocar
  las notas; el alta sigue ocurriendo solo al pulsar «Añadir materiales».
- **RF-8.** EL SISTEMA coloca la acción de dictado del modo rápido dentro de la zona que se despliega
  del modo rápido; mientras esa zona está plegada no hay dictado, y si se pliega durante una sesión,
  la sesión se cierra y el texto ya reconocido se conserva.

### Aviso de privacidad (solo la primera vez)

- **RF-9.** CUANDO el usuario pulsa «Dictar» por primera vez en un navegador, y antes de pedir permiso
  para el micrófono, EL SISTEMA muestra el aviso de privacidad como diálogo con título, texto y dos
  acciones explícitas, «Aceptar y dictar» y «Ahora no»; el foco pasa al diálogo, se puede cerrar con
  Escape (equivalente a «Ahora no») y no se puede iniciar la escucha hasta aceptar.
- **RF-10.** SI el usuario elige «Ahora no» o cierra el aviso, ENTONCES EL SISTEMA no inicia el
  dictado, no pide permiso para el micrófono y no pierde nada de lo que hubiera escrito.
- **RF-11.** CUANDO el usuario acepta el aviso, EL SISTEMA empieza a escuchar sin que tenga que volver
  a pulsar «Dictar».
- **RF-12.** CUANDO el usuario ha aceptado el aviso, EL SISTEMA no vuelve a mostrarlo en ese navegador
  para los dictados posteriores, ni al recargar la pantalla, ni al volver en una sesión nueva.
- **RF-13.** EL SISTEMA mantiene el aviso consultable desde el enlace «Qué pasa con mi voz» de la zona
  de dictado, sin volver a exigir aceptación, en los tres sitios donde se puede dictar; no lo ofrece
  donde el dictado no está disponible (RF-2, RF-3).
- **RF-14.** SI el navegador no permite recordar la aceptación (almacenamiento bloqueado o borrado),
  ENTONCES EL SISTEMA vuelve a mostrar el aviso y nunca impide dictar más allá de aceptarlo de nuevo;
  se comprueba borrando los datos del sitio o usando una ventana privada.

### Inicio, escucha y fin

- **RF-15.** CUANDO el usuario pulsa «Dictar» y ha aceptado el aviso, EL SISTEMA solicita permiso para
  usar el micrófono si aún no lo tiene y, si lo obtiene, empieza a escuchar en español.
- **RF-16.** EL SISTEMA no solicita permiso para el micrófono antes de que el usuario pulse «Dictar» y
  acepte el aviso.
- **RF-17.** MIENTRAS la escucha está activa, EL SISTEMA muestra «Escuchando…», cambia la acción a
  «Detener» y deja el resto de la pantalla operable (se puede seguir escribiendo o plegar la zona).
- **RF-18.** MIENTRAS la escucha está activa, EL SISTEMA muestra el texto reconocido en el campo que
  corresponde al dictado a medida que el navegador lo entrega, y ese texto se puede corregir a mano
  en cualquier momento.
- **RF-19.** CUANDO el usuario pulsa «Detener», EL SISTEMA cierra la sesión de inmediato, conserva lo
  ya mostrado y descarta lo que el navegador entregue después.
- **RF-20.** MIENTRAS la escucha está activa, si deja de detectarse voz durante 2 segundos, EL SISTEMA
  cierra la sesión y procesa lo dicho como un fin normal: conserva el texto, muestra «Dictado
  detenido» con la indicación de que hay que pulsar «Dictar» para seguir y deja la acción lista. Una
  pausa inferior a 2 segundos no cierra la sesión.
- **RF-21.** SI el navegador cierra la escucha por sí mismo, ENTONCES EL SISTEMA lo trata igual que
  una parada por silencio: conserva el texto, avisa de que el dictado se ha detenido y no muestra
  error.
- **RF-22.** CUANDO una sesión termina por silencio, por «Detener» o porque la cierra el navegador, EL
  SISTEMA conserva el texto y permite empezar otra sesión; lo nuevo se añade detrás de lo anterior
  (RF-29), nunca lo sobrescribe.
- **RF-23.** SI el usuario pulsa «Dictar» mientras hay una escucha activa en ese mismo campo, ENTONCES
  EL SISTEMA lo interpreta como detener y no abre una segunda escucha.
- **RF-24.** CUANDO el usuario sale del registro o de la pantalla con una sesión activa, EL SISTEMA
  cierra la sesión, conserva el texto ya reconocido mientras la pantalla siga abierta y no añade ni
  envía nada; al cerrar o recargar la pestaña no se guarda ninguna transcripción.
- **RF-25.** SI el usuario intenta dictar en un campo mientras hay una escucha activa en otro,
  ENTONCES EL SISTEMA impide dos escuchas simultáneas: cierra la anterior o no inicia la nueva, y lo
  indica.
- **RF-26.** MIENTRAS hay un alta en curso (el botón de añadir muestra que está añadiendo), EL SISTEMA
  mantiene la acción de dictado deshabilitada.
- **RF-27.** CUANDO el usuario pulsa añadir mientras hay una escucha activa, EL SISTEMA cierra la
  sesión y añade el texto tal como esté en ese momento en el campo.

### Resultado: revisión y confirmación

- **RF-28.** EL SISTEMA nunca da de alta materiales por voz: la transcripción solo rellena texto o
  campos editables, y el alta ocurre únicamente cuando el usuario pulsa la acción de añadir
  correspondiente.
- **RF-29.** CUANDO el dictado se hace en el modo rápido, EL SISTEMA inserta cada tramo al final del
  contenido del área de texto, separado por un salto de línea de lo que hubiera antes y de los tramos
  anteriores, sin borrar ni reordenar lo existente.
- **RF-30.** MIENTRAS el navegador entrega resultados de un mismo tramo, EL SISTEMA sustituye el
  resultado provisional de ese tramo por el final en el mismo sitio, sin reescribir el texto anterior
  ni las correcciones que el usuario haya hecho sobre tramos ya cerrados.
- **RF-31.** MIENTRAS el usuario edita el texto a mano durante una sesión, EL SISTEMA no mueve el
  cursor a otro punto ni borra lo tecleado; solo añade lo nuevo al final.
- **RF-32.** CUANDO el dictado se hace en el formulario de un material, EL SISTEMA reparte la
  transcripción con la misma regla que una línea (RF-47): el nombre es lo anterior a la cantidad, la
  cantidad es la última expresión numérica y lo que va detrás no forma parte del nombre.
- **RF-33.** MIENTRAS el formulario muestra un resultado de dictado, EL SISTEMA enseña la
  transcripción literal como «Se ha entendido: …» hasta la siguiente sesión o hasta el alta, para que
  el usuario pueda compararla con los campos.
- **RF-34.** CUANDO el nombre dictado coincide exactamente (según la definición) con un único material
  activo del catálogo, EL SISTEMA lo deja seleccionado; SI coincide exactamente con varios o con
  ninguno, ENTONCES EL SISTEMA no selecciona ninguno, deja el nombre dictado en el buscador y muestra
  las coincidencias que este filtre o el aviso de que no hay ninguna.
- **RF-35.** SI de lo dictado no se puede deducir una cantidad, ENTONCES EL SISTEMA conserva la
  cantidad que hubiera en el formulario y lo indica, sin inventar un valor.
- **RF-36.** CUANDO el usuario dicta otra vez en el formulario de un material, EL SISTEMA sustituye el
  nombre y, si se deduce, la cantidad; no acumula texto como el modo rápido, y la unidad solo cambia
  según RF-37.
- **RF-37.** CUANDO el dictado del formulario incluye una palabra de la tabla de unidades habladas, EL
  SISTEMA pone en el formulario el código de unidad correspondiente y este **prevalece** sobre el que
  hubiera fijado la autoselección del material o la elección anterior del usuario; SI la palabra no
  está en la tabla, ENTONCES la unidad no cambia.
- **RF-38.** CUANDO el texto dictado en el modo rápido lleva una palabra de la tabla de unidades
  habladas detrás de la cantidad, EL SISTEMA la escribe en el texto con su código («cobre veinticinco
  metros» queda «cobre 25 m») para que la interpretación la tome como unidad; las palabras que no
  están en la tabla se quedan como estén.
- **RF-39.** SI el usuario dicta otra vez en el modo rápido sin haber añadido, ENTONCES el texto se
  acumula detrás del anterior en el orden en que se dictó (RF-29).
- **RF-40.** EL SISTEMA interpreta el texto del modo rápido con las reglas de siempre (una línea por
  material, la última cifra como cantidad y la palabra de unidad detrás de la cantidad), tanto si
  viene del micrófono como del teclado: antes de interpretar solo cambian la conversión de numerales
  (RF-41 a RF-52) y la unidad dictada escrita como código (RF-38).

### Conversión de numerales

- **RF-41.** EL SISTEMA convierte a cifra las cantidades enteras dichas con palabras en español, con
  todas sus variantes: unidades, decenas («veintiuno», «veintiún», «veintiuna», «veintinueve»),
  centenas en masculino y femenino («doscientos», «doscientas», «quinientos», «quinientas»),
  millares («mil quinientos», «dos mil») y millones («un millón», «millón»); «mil» sin número delante
  vale 1000, y «cien» y «ciento» valen 100 tanto solos como formando parte de una cantidad mayor.
- **RF-42.** EL SISTEMA convierte a cifra con decimales las cantidades dichas con «coma»: «dos coma
  cinco» da 2,5 y «cero coma setenta y cinco» da 0,75.
- **RF-43.** EL SISTEMA convierte las fracciones «medio», «un cuarto» y «tres cuartos», y las formas
  «y medio» y «y cuarto» pegadas a una cantidad, a 0,5, 0,25 y 0,75 respectivamente, **solo** cuando
  ocupan la posición de cantidad; en cualquier otra posición se dejan en palabras («media caña»,
  «cuarto de baño»).
- **RF-44.** EL SISTEMA convierte la mezcla de cifra y fracción: «25 y medio» da 25,5, «veinticinco y
  medio» da 25,5 y «dos y medio» da 2,5.
- **RF-45.** SI la cantidad ya viene en dígitos, ENTONCES EL SISTEMA la conserva tal cual, sin
  convertirla ni duplicarla.
- **RF-46.** EL SISTEMA aplica la conversión siempre al texto del modo rápido, venga del micrófono o
  del teclado, antes de interpretarlo, y a la cantidad que se extrae en el formulario de un material.
- **RF-47.** EL SISTEMA convierte **solo** la última expresión numérica de la línea, y solo si está al
  final o seguida de una palabra de unidad; ninguna otra expresión numérica de la línea se modifica.
- **RF-48.** SI un numeral no es la última expresión de la línea o va seguido de una palabra que no es
  de unidad y no está al final, ENTONCES EL SISTEMA lo deja en palabras: «tubería de dos pulgadas»
  queda igual, y en «cinta dos rollos 5» solo se toca la cantidad 5, no «dos».
- **RF-49.** EL SISTEMA escribe las cifras convertidas sin separador de millares y con coma decimal:
  «mil quinientos» da «1500» y «dos coma cinco» da «2,5».
- **RF-50.** SI una línea empieza por «un» o «una», no contiene ninguna otra expresión numérica y no
  forma parte de «un millón» ni de «un cuarto», ENTONCES EL SISTEMA lo interpreta como una unidad de
  ese material y no como un artículo («un tornillo» → una unidad de tornillo). Las expresiones
  mayores tienen prioridad sobre esta regla.
- **RF-51.** SI una expresión numérica no se reconoce con seguridad, ENTONCES EL SISTEMA la deja tal
  cual estaba, sin inventar ni redondear una cantidad, y el usuario puede corregirla o la línea falla
  como falla hoy.
- **RF-52.** EL SISTEMA no altera el resto del texto: ni nombres, ni notas, ni palabras de unidad fuera
  de la tabla, salvo las cantidades (RF-41 a RF-51) y las unidades traducidas (RF-37, RF-38).

### Varios materiales y líneas que fallan

- **RF-53.** SI un tramo reconocido contiene varios materiales seguidos sin pausa y el navegador lo
  entrega como un único texto, ENTONCES EL SISTEMA no lo divide por su cuenta: el usuario puede
  separarlo a mano antes de añadir, y el resultado de interpretación será el mismo que si lo hubiera
  escrito.
- **RF-54.** CUANDO se añaden varias líneas y alguna falla, EL SISTEMA añade las válidas, deja en el
  área de texto **solo** las que fallaron y muestra los errores uno por línea, cada uno identificando
  su línea; las líneas añadidas desaparecen del área.

### Validación de cantidades

- **RF-55.** EL SISTEMA admite en el alta cualquier cantidad mayor que 0, incluidas las menores que 1
  (0,5; 0,25), con o sin dictado; SI la cantidad es 0, negativa o no es un número, ENTONCES no se
  añade y se muestra el mensaje de validación existente. El aviso de stock se mantiene tal cual: se
  muestra cuando la cantidad pedida supera el stock disponible.

### Permisos, errores y avisos

- **RF-56.** SI el usuario deniega el permiso del micrófono, ENTONCES EL SISTEMA no inicia la escucha,
  conserva lo que hubiera escrito y muestra un mensaje en español que explica que sin permiso no hay
  dictado y cómo puede habilitarlo.
- **RF-57.** SI el navegador bloquea el micrófono por política o el permiso está bloqueado de forma
  permanente, ENTONCES EL SISTEMA muestra el mensaje de RF-56 con la indicación de cómo cambiarlo y no
  vuelve a pedir el permiso en cada intento.
- **RF-58.** SI no hay micrófono disponible o el navegador no puede acceder al audio, ENTONCES EL
  SISTEMA lo indica con un mensaje en español y deja la acción disponible para reintentar.
- **RF-59.** SI al pulsar «Dictar» no hay conexión, ENTONCES EL SISTEMA no inicia la escucha e indica
  que hace falta conexión para dictar, sin dar el dictado por fallido ni perder lo escrito.
- **RF-60.** SI el reconocimiento falla o se interrumpe por un error durante la sesión, ENTONCES EL
  SISTEMA cierra la sesión, conserva la transcripción parcial y muestra un mensaje en español que
  permite reintentar.
- **RF-61.** SI se pierde la conexión durante la sesión, ENTONCES EL SISTEMA lo indica, cierra la
  sesión y conserva la transcripción obtenida hasta ese momento.
- **RF-62.** SI la sesión no produce ningún texto reconocible, ENTONCES EL SISTEMA vuelve al estado
  inicial e informa de que no se ha reconocido nada, sin dejar campos a medias ni mensajes técnicos.
- **RF-63.** SI el navegador anuncia soporte de dictado pero falla al iniciarlo o no entrega ningún
  resultado, ENTONCES EL SISTEMA aplica RF-58 o RF-62 y la pantalla sigue siendo utilizable a mano.

## Requisitos no funcionales

- **RNF-1.** El dictado se pide en español de España (es-ES) de forma explícita, sin depender del
  idioma del sistema.
- **RNF-2.** Comportamiento observable en el tiempo: al pulsar «Dictar» el estado «Escuchando…» y el
  cambio a «Detener» se ven en el mismo instante, sin pasos intermedios; el texto aparece mientras se
  habla, sin que haga falta terminar la frase, salvo en los navegadores que solo entregan al cerrar el
  tramo (RNF-10); al pulsar «Detener» lo que se diga después no se añade; sin voz, la escucha se
  cierra a los 2 segundos de silencio salvo que el navegador la cierre antes; la conversión y la
  unidad traducida no se perciben como una espera (el texto aparece ya en cifra).
- **RNF-3.** La acción de dictado y su estado son accesibles: nombre comprensible para lector de
  pantalla («Dictar materiales» / «Detener dictado»), cambio de estado anunciado, operable con
  teclado, no depende solo del color (lleva texto) y tiene al menos 44 × 44 px en pantalla táctil. El
  aviso es un diálogo con título, foco inicial dentro, cierre con Escape y dos acciones con texto; su
  contenido se puede leer con lector de pantalla.
- **RNF-4.** Privacidad: el aviso explica, antes del primer dictado, que el audio lo procesa el
  proveedor del navegador, que puede enviarse a sus servidores y que la aplicación no lo guarda; la
  aceptación se recuerda en el navegador y el texto sigue consultable desde el enlace de la zona de
  dictado.
- **RNF-5.** No se maneja audio en la aplicación: ni la web ni el servidor reciben, graban ni
  almacenan audio; solo llega al servidor el texto que el usuario confirma al añadir. El dictado no
  requiere login adicional ni cuenta externa por parte del usuario.
- **RNF-6.** En una pantalla de 320 px de ancho, la acción, su estado y el enlace del aviso caben sin
  desplazamiento horizontal y sin tapar el campo de texto ni el botón de añadir, y se pueden usar con
  una mano; el texto dictado se lee y se edita sin necesidad de hacer zoom.
- **RNF-7.** Los textos nuevos son un conjunto cerrado, en español: «Dictar», «Detener»,
  «Escuchando…», «Dictado detenido», «Qué pasa con mi voz», «Aceptar y dictar», «Ahora no», «Se ha
  entendido», más los mensajes de error de RF-56 a RF-63. El resto reutiliza las etiquetas existentes
  de materiales, unidades y estados; no se introducen sinónimos nuevos.
- **RNF-8.** El dictado es aditivo, con tres cambios acotados y explícitos que **también afectan al
  uso sin dictado**: (a) antes de interpretar se normaliza el texto del modo rápido (conversión de
  numerales y unidad dictada escrita como código, RF-38, RF-41 a RF-52); (b) al añadir se conservan
  las líneas que fallan en lugar de vaciar el área (RF-54); (c) los formularios dejan de exigir una
  cantidad mínima de 1 y admiten cualquier cantidad mayor que 0, también decimales menores que 1
  (RF-55), mostrando el mensaje de cantidad no válida solo con 0, negativos o valores no numéricos.
  Fuera de eso, las tres formas de alta y sus mensajes siguen funcionando igual, y ninguna pantalla
  depende de que el dictado exista.
- **RNF-9.** No se añaden servicios de transcripción propios ni de pago, ni se envían datos a
  servidores distintos de los que ya usa la aplicación, salvo el audio que procese el propio
  navegador.
- **RNF-10.** Verificación manual, sin herramientas nuevas, de todo lo que depende del navegador: (a)
  Chrome y Edge de escritorio y (b) Chrome en Android, comportamiento completo; (c) Safari en macOS e
  iOS, comportamiento **parcial**: puede no entregar resultados provisionales ni encadenar tramos, y
  se acepta que el texto aparezca al cerrar cada tramo y que el usuario vuelva a pulsar «Dictar»; (d)
  Firefox, sin soporte: se muestra la nota de RF-5. Se considera que un navegador admite dictado
  cuando ofrece reconocimiento de voz y entrega texto en español; no se exige resultado provisional ni
  escucha continua. Además, compilan los paquetes de servidor y de web. Lo que no depende del
  navegador se cubre con RNF-12.
- **RNF-11.** Con el teclado en uso mientras se dicta, el texto no pierde caracteres escritos, el
  cursor no salta a otro punto y la pantalla sigue respondiendo en un móvil de gama media (se
  comprueba a mano escribiendo mientras se habla).
- **RNF-12.** La lógica que no depende del navegador se cubre con **tests automáticos con
  `node --test`**: (a) conversión de numerales, con una tabla de ejemplos de entrada y salida que
  incluya unidades, «veintiuno» a «veintinueve» y sus variantes «veintiún/veintiuna», centenas en
  masculino y femenino, millares con y sin número delante, millones, «cien» y «ciento», decimales con
  coma, fracciones y mezclas, cifras ya en dígitos, formato sin separador de millares, expresiones no
  reconocidas y el caso de «un/una»; (b) reparto de nombre, cantidad y unidad, incluidos «tubería de
  dos pulgadas», «cinta dos rollos 5», «un tornillo», «cobre veinticinco metros» y una palabra de
  unidad que no se traduce. El repositorio no tiene hoy runner de tests ni script de prueba: añadirlo
  es un cambio de convención que esta spec asume y justifica, porque es la única parte verificable sin
  navegador y con más combinaciones, y protege de regresiones a la interpretación que ya existe. La
  interfaz del dictado (permisos, aviso, silencio, navegadores, accesibilidad, respuesta en móvil) se
  verifica a mano según RNF-10 y RNF-11.

## Casos límite

- Registro en estado «Enviado»: ni acciones de alta ni dictado ni nota de navegador (RF-2).
- Usuario técnico: ni alta, ni dictado, ni nota (RF-3).
- Navegador sin soporte (Firefox): no aparece la acción, sí la nota informativa, y escribir y añadir
  funciona igual en las tres zonas (RF-5, RF-6, RNF-8).
- Primer dictado en un navegador: aviso antes del permiso, foco en el diálogo, Escape equivale a «Ahora
  no»; si se rechaza, no se dicta y no se pierde nada (RF-9, RF-10, RF-16).
- Aceptar el aviso: la escucha empieza sin volver a pulsar «Dictar» (RF-11).
- Segundo dictado, recarga o sesión nueva tras aceptar: el aviso no se repite (RF-12).
- Datos del sitio borrados o ventana privada: el aviso vuelve a salir y se puede aceptar y dictar con
  normalidad (RF-14).
- Consulta del aviso con el dictado ya aceptado: se abre desde «Qué pasa con mi voz» sin volver a
  aceptar ni interrumpir la escucha (RF-13).
- Permiso denegado en esta visita: mensaje claro, sin escucha, texto previo intacto y posibilidad de
  reintentar (RF-56).
- Permiso bloqueado por política del navegador: mensaje con la indicación de cómo cambiarlo y sin
  repetición de la petición en cada intento (RF-57).
- Sin conexión al pulsar «Dictar»: se informa de que hace falta conexión y no se inicia (RF-59).
- Silencio de 2 segundos: la sesión se cierra, se procesa lo dicho y se avisa «Dictado detenido»; hay
  que pulsar «Dictar» para seguir (RF-20).
- Lista dictada con pausas de más de 2 segundos entre materiales: cada pausa cierra la sesión; el
  texto anterior se conserva y lo nuevo se añade detrás, sin que el usuario pierda el primer material
  (RF-20, RF-22, RF-29).
- Pausa de 1 segundo al pensar la siguiente cantidad: la sesión no se cierra (RF-20).
- Ruido de almacén sin voz clara: a los 2 segundos se cierra la sesión; si no se reconoce nada, aviso y
  vuelta al estado inicial (RF-20, RF-62).
- Cierre por parte del navegador: mismo tratamiento que el silencio, con aviso y sin error (RF-21).
- Dictado cortado antes de tiempo: «Detener» cierra la sesión y descarta lo que llegue después, sin
  esperar al silencio (RF-19).
- Dictado interrumpido al cambiar de aplicación o bloquear el móvil: se cierra la sesión, se conserva
  lo transcrito y se avisa de que se ha detenido (RF-21, RF-60).
- Pérdida de conexión a mitad: se cierra la sesión, se conserva lo obtenido y se informa (RF-61).
- Dictar, corregir a mano y seguir dictando: lo nuevo se añade al final y no se reescribe lo corregido
  (RF-29, RF-30, RF-31).
- Texto anterior en el área del modo rápido: el dictado se añade detrás, separado por un salto de
  línea, sin borrarlo (RF-29).
- Plegar el modo rápido mientras se dicta: la sesión se cierra y el texto se conserva (RF-8, RF-22).
- Pulsar añadir mientras se dicta: la sesión se cierra y se añade el texto tal como esté (RF-27).
- Alta en curso: el dictado está deshabilitado y no se puede solapar con ella (RF-26).
- Dos dictados a la vez (pulsación doble o dos campos): nunca dos escuchas; la segunda no se abre
  (RF-23, RF-25).
- Dos pestañas abiertas: cada una tiene su propio dictado y no se sincronizan; ninguna avisa a la
  otra (RF-24).
- Salir del registro o recargar: se cierra la sesión y no se guarda ninguna transcripción; al volver,
  el área de texto está vacía y lo ya añadido al registro se mantiene (RF-24).
- Material dictado que coincide exactamente con varios del catálogo o con ninguno: no se selecciona
  ninguno, el nombre queda en el buscador y se muestran sus coincidencias o el aviso (RF-34).
- Material dictado con el nombre escrito de otra forma («cobre rigido» frente a «Cobre rígido»): la
  coincidencia ignora tildes y mayúsculas; si no es exacta, no se selecciona nada (RF-34).
- Dictado sin cantidad en el formulario: se conserva la cantidad que hubiera y se avisa (RF-35).
- Dictado con cantidad y unidad en el formulario: se rellenan el nombre y la cantidad y la unidad
  dictada sustituye a la que hubiera puesto el material («cobre veinticinco metros» deja la cantidad
  25 y la unidad M, aunque el material viniera con UD) (RF-37).
- Unidad dictada que no está en la tabla («ml», «metros lineales», «palés»): no se traduce y la unidad
  del formulario se queda como esté (RF-37, RF-52).
- Unidad dictada sin cantidad: la unidad se aplica igual y la cantidad se conserva (RF-35, RF-37).
- Unidad dictada en el modo rápido («regleta diez cajas»): el texto queda «regleta 10 CAJA» y la
  interpretación actual la toma como unidad (RF-38, RF-40).
- Re-dictar en el formulario con material ya elegido y cantidad escrita: el nombre y la cantidad se
  sustituyen, no se acumulan (RF-36).
- Varios materiales en una sola entrega del navegador sin pausa: no se dividen solos; el usuario los
  separa y se interpretan igual que si los hubiera escrito (RF-53).
- Una línea que falla entre varias: se añaden las válidas, la que falla se queda en el área de texto y
  su error se muestra en su propia línea (RF-54).
- Cantidades en palabras: «doscientos cincuenta» da 250; «mil quinientos» da 1500; «dos mil» da 2000;
  «mil» solo da 1000; «un millón» da 1000000 (RF-41, RF-49).
- «cien» y «ciento»: «cien» da 100 esté solo o en «cien mil»; «ciento» da 100 y también forma parte de
  «ciento veinte» (120) (RF-41).
- Variantes de género y apócope: «veintiún», «veintiuna», «doscientas», «quinientas» (RF-41).
- «un» o «una» como artículo: si es la única expresión numérica y va delante del material, cuenta como
  una unidad de ese material («un tornillo» → 1 tornillo); si hay otra cantidad, se aplica la regla de
  la última cifra y «un/una» no se toca (RF-50, RF-40).
- «un millón» y «un cuarto» con «un» delante: se convierten como cantidad y no como artículo (RF-41,
  RF-43, RF-50).
- Cantidad ya escrita en dígitos («cobre 25 metros»): se conserva 25, sin convertirla ni duplicarla
  (RF-45).
- Mezcla de cifra y fracción: «25 y medio» da 25,5; «dos y medio» da 2,5 (RF-44).
- Decimales: «dos coma cinco» da 2,5; una «coma» que no forme cantidad («codo, tubería») no se
  convierte (RF-42, RF-51).
- Formato de las cifras: 1500 sin punto de millares y 2,5 con coma, para que no se lean como decimales
  ni se guarden mal (RF-49).
- Fracciones fuera de la cantidad: «media caña 10» y «cuarto de baño 3» conservan la palabra, porque
  el numeral convertido sería la cantidad 10 y 3 (RF-43, RF-47).
- Numeral que forma parte del nombre: «tubería de dos pulgadas» se queda igual, porque «dos» no es la
  última expresión o no le sigue una palabra de unidad (RF-47, RF-48).
- Varios numerales en la línea: «cinta dos rollos 5» solo convierte el 5; «dos» no se toca (RF-47,
  RF-48).
- Cantidad seguida de palabra de unidad: «cobre veinticinco metros» pasa a «cobre 25 m» (RF-46, RF-47,
  RF-38).
- Texto tecleado a mano en el modo rápido con numerales en palabras («regleta diez cajas»): también se
  convierte y la unidad se traduce (RF-38, RF-46).
- Expresión numérica dudosa o ambigua: se deja tal cual, sin inventar, y el usuario la corrige o la
  línea falla como hoy (RF-51).
- Cantidad cero («cero cajas»): la convierte a 0 y el alta avisa de que la cantidad no es válida; no se
  añade (RF-51, RF-55).
- Cantidad decimal menor que 1: 0,5 y 0,25 son válidas y se pueden añadir; el aviso de stock solo
  aparece si la cantidad pedida supera el stock (RF-55).
- Cantidad negativa o no numérica: no se añade y se muestra el mensaje de validación existente
  (RF-55).
- Navegador que no entrega resultados provisionales (Safari): el texto aparece al cerrar cada tramo; se
  ve antes de añadir igualmente (RF-18, RNF-10).
- El mismo material dictado dos veces: se comporta como hoy con el texto escrito (la cantidad se
  acumula), sin avisos nuevos (RF-40, RF-54).

## Fuera de alcance

- Órdenes por voz que ejecuten acciones («añadir», «borrar», «confirmar», «cambiar estado», «enviar»).
- Dictado en cualquier otro campo: notas (incluidas las del alta en la ficha de obra), alta de
  materiales del catálogo, clientes u obras, y buscadores de historial, clientes o materiales.
- Conversión de numerales en lo que el usuario teclea en el buscador de materiales del formulario de un
  material: ahí la cantidad es un campo numérico y la conversión solo alcanza a lo que extrae el
  dictado.
- Traducir palabras de unidad que no estén en la tabla de unidades habladas, y traducir unidades en
  campos que no procedan del dictado.
- Cambiar las reglas de interpretación de líneas (una línea por material, separación por salto de línea
  o «;», prefijos «/» y «+», última cifra como cantidad, palabra de unidad detrás): se mantienen. Lo
  nuevo ocurre **antes**: la conversión de numerales (RF-41 a RF-52), la unidad dictada escrita como
  código (RF-38) y la regla de «un/una» (RF-50), y se aplica igual a lo dictado y a lo tecleado
  (RF-46).
- Cambios en el formato o en los valores de las unidades del catálogo, o en la forma de guardar las
  cantidades: solo se admiten decimales mayores que 0 (RF-55).
- Grabación, almacenamiento o reproducción del audio, y transcripción en un servidor propio.
- Corrección automática de nombres dictados contra el catálogo con sinónimos, abreviaturas o
  búsquedas por «contiene»: solo cuenta la coincidencia exacta (RF-34); el navegador propone y el
  usuario elige de la lista.
- Guardar o recuperar transcripciones entre recargas, pestañas o dispositivos.
- Idiomas distintos del español de España.
- Respuestas habladas o confirmaciones por voz (que el sistema lea lo añadido).
- Funcionamiento del dictado sin conexión a internet.
- Gestión del consentimiento por usuario o por cuenta, o su consulta desde otro dispositivo: la
  aceptación del aviso se recuerda en el navegador y no se sincroniza.
- Aplicación nativa, PWA instalable o control por voz del sistema operativo.
- Cambios en los permisos de acceso o en el flujo de estados de los registros.

## Criterios de finalización

- [ ] El dictado aparece en el formulario de un material y en el modo rápido del detalle de un
      registro, y en el de alta de la ficha de una obra, con «Dictar», icono y «Qué pasa con mi voz»;
      no aparece en registros enviados ni para usuarios sin permiso (ni la nota) (RF-1 a RF-4).
- [ ] La acción del modo rápido está dentro de la zona desplegable: con la zona plegada no hay
      dictado, y plegarla mientras se dicta cierra la sesión conservando el texto (RF-8).
- [ ] En un navegador sin dictado se ve la nota y escribir y añadir funciona igual en las tres zonas;
      sin dictado disponible nada deja de funcionar (RF-5, RF-6).
- [ ] En la ficha de obra el dictado rellena el formulario sin crear el registro, sin cambiar la obra
      ni tocar las notas (RF-7).
- [ ] La primera vez se muestra el aviso como diálogo antes de pedir el micrófono, con «Aceptar y
      dictar» y «Ahora no», foco dentro y cierre con Escape; sin aceptar no se dicta ni se pide permiso
      (RF-9, RF-10, RF-16, RNF-3).
- [ ] Al aceptar, la escucha empieza sin volver a pulsar «Dictar» (RF-11).
- [ ] Tras aceptar, el aviso no se repite ni al recargar ni en una sesión nueva, y se puede releer
      desde «Qué pasa con mi voz»; el aviso explica que el audio lo procesa el proveedor del navegador
      y que la aplicación no lo guarda (RF-12, RF-13, RNF-4).
- [ ] Con los datos del sitio borrados o en ventana privada, el aviso vuelve a mostrarse y se puede
      aceptar y dictar con normalidad (RF-14).
- [ ] Al pulsar «Dictar» se pide permiso si hace falta y se ve «Escuchando…» con la acción en
      «Detener» en el mismo instante; el resto de la pantalla sigue operable (RF-15 a RF-17, RNF-2).
- [ ] El texto aparece mientras se habla y se puede corregir a mano sin que el cursor salte ni se
      pierda lo tecleado (RF-18, RF-31, RNF-11).
- [ ] «Detener» cierra la sesión en el acto y descarta lo que llegue después; 2 segundos sin voz la
      cierran y avisan «Dictado detenido»; una pausa de 1 segundo no la cierra (RF-19, RF-20, RNF-2).
- [ ] Si el navegador cierra la sesión, el usuario sale de la pantalla o se produce un error, se
      conserva lo transcrito, se avisa y no se envía nada (RF-21, RF-24, RF-60).
- [ ] Tras cualquier parada se puede volver a dictar y lo nuevo se añade detrás de lo anterior (RF-22,
      RF-29, RF-39).
- [ ] No se abren dos escuchas a la vez, ni con una pulsación doble ni desde dos campos (RF-23,
      RF-25).
- [ ] Con un alta en curso el dictado está deshabilitado, y pulsar añadir durante el dictado cierra la
      sesión y añade el texto tal como está (RF-26, RF-27).
- [ ] Nada se da de alta sin pulsar añadir: el dictado solo rellena campos (RF-28).
- [ ] Cada tramo se añade al final, separado por un salto de línea, sin sobrescribir; el provisional se
      sustituye por el final en el mismo sitio (RF-29, RF-30).
- [ ] En el formulario se reparte nombre y cantidad con la regla de la última cifra, se muestra «Se ha
      entendido: …» y el material se selecciona solo con coincidencia exacta; con varias o ninguna, no
      se selecciona y se muestran las coincidencias o el aviso (RF-32 a RF-34).
- [ ] Sin cantidad deducible se conserva la que hubiera y se avisa; al re-dictar en el formulario se
      sustituyen nombre y cantidad, sin acumular (RF-35, RF-36).
- [ ] La unidad dictada se traduce con la tabla y **prevalece** sobre la del material o la elegida a
      mano; si la palabra no está en la tabla, la unidad no cambia (RF-37).
- [ ] En el modo rápido, la unidad dictada se escribe como código y la interpretación la aplica
      («regleta diez cajas» → «regleta 10 CAJA») (RF-38).
- [ ] El texto del modo rápido se interpreta con las reglas de siempre, venga del micrófono o del
      teclado (RF-40).
- [ ] Se prueba una tabla de cantidades dictadas y el resultado coincide: unidades, «veintiuno» a
      «veintinueve» y variantes «veintiún/veintiuna», centenas en masculino y femenino
      («doscientos cincuenta» → 250, «doscientas» → 200), millares («mil quinientos» → 1500, «dos
      mil» → 2000, «mil» → 1000), millones («un millón» → 1000000), «cien» y «ciento» (100 ambos),
      decimales con coma («dos coma cinco» → 2,5), fracciones («medio» → 0,5, «un cuarto» → 0,25,
      «tres cuartos» → 0,75) y mezclas («25 y medio» → 25,5) (RF-41 a RF-44).
- [ ] Las cifras convertidas se escriben sin separador de millares y con coma decimal (RF-49).
- [ ] Solo se convierte la última expresión numérica: «tubería de dos pulgadas» no cambia y en «cinta
      dos rollos 5» solo se toca el 5; «cobre veinticinco metros» pasa a «cobre 25 m» y «regleta diez
      cajas» también se convierte al teclearla (RF-38, RF-46 a RF-48).
- [ ] Las fracciones solo se convierten como cantidad: «media caña 10» y «cuarto de baño 3» conservan
      la palabra (RF-43).
- [ ] «un» o «una» delante del material sin otra cantidad cuenta como una unidad, y no se confunde con
      «un millón» ni con «un cuarto» (RF-50).
- [ ] Las cifras ya escritas en dígitos se conservan, las expresiones dudosas se dejan tal cual sin
      inventar cantidad y los nombres y las notas no se alteran (RF-45, RF-51, RF-52).
- [ ] Varios materiales en una entrega sin pausa no se dividen solos; al añadir varias líneas se añaden
      las válidas y las que fallan quedan en el área con su error en su propia línea (RF-53, RF-54).
- [ ] Se pueden añadir cantidades decimales mayores que 0, también menores que 1 (0,5; 0,25), con y sin
      dictado; 0, los negativos y lo no numérico se rechazan con el mensaje de validación, y el aviso de
      stock se mantiene (RF-55).
- [ ] Permiso denegado, permiso bloqueado, sin micrófono, sin conexión al empezar, error durante,
      conexión perdida y dictado sin texto muestran mensajes en español sin detalles técnicos,
      conservan lo escrito y permiten reintentar (RF-56 a RF-63).
- [ ] El dictado se pide en español de España (RNF-1).
- [ ] La acción y su estado son accesibles (nombre, anuncio, teclado, 44 × 44 px) y el aviso también
      (RNF-3).
- [ ] No se maneja audio en la web ni en el servidor; solo llega el texto que se añade (RNF-5).
- [ ] En una pantalla de 320 px se usa con una mano, sin desplazamiento horizontal, sin tapar el campo
      ni el botón, y sin necesidad de zoom (RNF-6).
- [ ] Los textos nuevos son exactamente los de RNF-7 y no hay sinónimos nuevos (RNF-7).
- [ ] Solo cambian las tres cosas previstas sin dictado (normalización del texto con la unidad dictada,
      conservación de las líneas que fallan y cantidades decimales mayores que 0); el resto se comporta
      igual que antes (RNF-8, RNF-9).
- [ ] Los tests de `node --test` cubren la conversión de numerales y el reparto de nombre, cantidad y
      unidad con la tabla de ejemplos exigida, y pasan sin fallos (RNF-12).
- [ ] Recorrido manual con la matriz de navegadores de RNF-10, comprobando el caso parcial de Safari y
      el caso sin soporte de Firefox, y compilan los dos paquetes (RNF-10).

## Dudas abiertas

Ninguna.
