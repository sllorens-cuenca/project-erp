# Spec 001 — Detalle de obra

Estado: aprobada

## Contexto y objetivo

Hoy, desde la carpeta de un cliente, cada obra/servicio es una tarjeta que al pulsarse abre el
**historial general de materiales filtrado por esa obra**. Esa pantalla está pensada para consultar
registros y muestra el nombre del cliente en primer plano, por lo que el usuario percibe que «le
lleva al historial» y no a la obra. Además no existe ninguna vista que responda a las dos preguntas
que se hacen a diario en el almacén: **qué materiales necesita esta obra** y **en qué estado está
cada cosa**.

Objetivo: al abrir una obra desde el cliente se entra en una **ficha propia de esa obra** que
muestre, de un vistazo, los datos de la obra, un **resumen consolidado de materiales** (qué se ha
necesitado, sumando todos sus registros) y el **detalle por registro** (cada registro con su estado
y sus líneas). El historial general deja de ser el destino del clic, pero sigue existiendo como
consulta transversal y, además, la ficha ofrece un acceso directo al historial filtrado por esa
obra.

El acabado visual (jerarquía, densidad, colores) se ajustará en una revisión posterior: esta spec
fija el contenido y el comportamiento, no el diseño final.

## Usuarios

- **Almacenero / Administrador**: prepara, confirma y envía registros; crea registros nuevos para
  una obra y necesita ver de un vistazo qué falta y qué está pendiente.
- **Técnico**: consulta qué materiales requiere una obra y en qué estado están; no crea ni modifica
  registros (permisos actuales).

## Historias de usuario

- **HU-1.** Como almacenero, quiero abrir una obra desde la carpeta del cliente y llegar a su ficha,
  para no tener que interpretar un historial general filtrado.
  *Cubre:* RF-1, RF-2, RF-3, RF-4, RF-5, RF-6.
- **HU-2.** Como almacenero, quiero ver en una sola lista todos los materiales que ha necesitado una
  obra, con las cantidades totales y el estado de cada uno, para preparar el pedido completo sin ir
  registro por registro.
  *Cubre:* RF-9, RF-10, RF-11, RF-12, RF-13, RF-14, RF-15, RF-16, RF-17.
- **HU-3.** Como técnico, quiero ver el estado de cada registro de la obra y sus líneas, para saber
  qué está pendiente, preparado o ya enviado.
  *Cubre:* RF-18, RF-19, RF-20.
- **HU-4.** Como almacenero, quiero abrir un registro concreto desde la ficha de la obra y volver a
  la obra después, para revisar o completar su detalle sin perder el contexto.
  *Cubre:* RF-21, RF-22, RF-23, RF-24, RF-29.
- **HU-5.** Como almacenero, quiero crear un registro nuevo ya asociado a la obra desde su ficha,
  para no equivocarme de obra al elegirla.
  *Cubre:* RF-25, RF-26, RF-27, RF-28.
- **HU-6.** Como usuario, quiero que una obra sin registros, sin materiales o inexistente me lo diga
  con claridad, y que una carga lenta no parezca un error, para no quedarme ante una pantalla vacía
  o un mensaje técnico.
  *Cubre:* RF-30, RF-31, RF-32, RF-33, RF-34.
- **HU-7.** Como almacenero, quiero ver los datos de la obra (tipo de servicio, estado, dirección,
  fechas y notas) y volver a la carpeta del cliente en un clic, para situarme antes de trabajar con
  sus materiales.
  *Cubre:* RF-4, RF-7, RF-8.
- **HU-8.** Como usuario que consulta desde el móvil, quiero leer el resumen y el detalle sin perder
  información, para poder revisar la obra en obra.
  *Cubre:* RF-35, RF-36, RF-37, RF-38.

## Definiciones

- **Obra / servicio**: carpeta de trabajo de un cliente (con tipo de servicio, estado, dirección,
  fechas y notas). Es el contenedor de los registros.
- **Ficha de la obra**: vista propia de una obra con sus datos, el resumen consolidado de materiales
  y el detalle por registro.
- **Registro**: documento de materiales de una obra (antes «listado»), con un estado del flujo de
  preparación y sus líneas de material.
- **Línea**: material concreto dentro de un registro, con cantidad **pedida**, cantidad
  **preparada**, unidad y notas opcionales. Un mismo material puede aparecer en varias líneas del
  mismo registro o en varios registros: las cantidades se acumulan.
- **Combinación material + unidad**: pareja formada por un material y una unidad, con independencia
  del registro en el que aparezca. Es la unidad de agrupación de cada fila del resumen consolidado.
- **Estado de la obra**: estado del proyecto (`Abierta`, `En curso`, `Finalizada`, `Cancelada`).
  Describe la obra, no la preparación del material.
- **Estado del registro**: estado del flujo de preparación (`Borrador` → `En preparación` → `Listo`
  → `Confirmado` → `Enviado`). Describe un registro concreto. Este es el «estado» del detalle por
  registro.
- **Estado consolidado de una fila**: desglose de los estados de los registros que tienen al menos
  una línea de **esa combinación material + unidad**, con el número de registros en cada estado. Se
  muestran solo los estados presentes, en el orden del flujo anterior; la suma de los recuentos es
  el número de registros con esa combinación. No es el estado de la obra ni se reduce a un único
  valor que resuma la preparación.
- **Resumen consolidado**: una fila por combinación material + unidad de la obra, con las cantidades
  sumadas de todas sus líneas y el desglose de estados de sus registros.
- **Materiales distintos**: número de materiales únicos de la obra contando cada material una sola
  vez, aunque aparezca con varias unidades o en varios registros.
- **Total de líneas**: suma de todas las líneas de todos los registros de la obra.
- **Detalle por registro**: la lista de registros de la obra, cada uno con su fecha, su estado y sus
  líneas.

## Requisitos funcionales

### Acceso y navegación

- **RF-1.** CUANDO el usuario pulsa una obra en la carpeta de un cliente, EL SISTEMA abre la ficha
  de esa obra y no el historial general filtrado.
- **RF-2.** EL SISTEMA asigna a la ficha de cada obra una dirección estable y propia, distinta de la
  del historial, que puede abrirse directamente mediante enlace, recarga o marcador; en ese caso
  muestra la ficha de la obra con su enlace a la carpeta del cliente.
- **RF-3.** EL SISTEMA rotula como «Ver obra» la acción de las tarjetas de obra de la carpeta del
  cliente, en lugar de «Ver historial».
- **RF-4.** EL SISTEMA muestra en la ficha un enlace siempre visible de vuelta a la carpeta del
  cliente, identificando al cliente por su nombre.
- **RF-5.** EL SISTEMA ofrece en la ficha un enlace al historial filtrado por esa obra.
- **RF-6.** EL SISTEMA mantiene el historial general de materiales accesible desde la navegación
  habitual, sin que la ficha de la obra lo sustituya.

### Datos de la obra

- **RF-7.** CUANDO se abre la ficha de una obra, EL SISTEMA muestra en su cabecera: nombre del
  cliente, nombre de la obra, tipo de servicio, estado de la obra y número de registros; además,
  dirección, fecha de inicio, fecha de fin y notas cuando la obra los tenga.
- **RF-8.** SI un dato opcional de la obra no tiene valor, ENTONCES EL SISTEMA lo omite sin dejar
  huecos ni etiquetas vacías, y sigue mostrando siempre cliente, nombre, tipo de servicio, estado y
  número de registros.

### Resumen consolidado

- **RF-9.** CUANDO la obra tiene al menos una línea de material, EL SISTEMA muestra un resumen
  consolidado con una fila por cada combinación de material y unidad presente en sus registros,
  indicando el nombre del material, su referencia de catálogo, la unidad, la suma de las cantidades
  pedidas y la suma de las cantidades preparadas de todas sus líneas.
- **RF-10.** EL SISTEMA ordena el resumen consolidado por nombre de material y, dentro del mismo
  material, por unidad, con un orden fijo que se repite igual entre visitas con los mismos datos.
- **RF-11.** EL SISTEMA calcula los estados de cada fila del resumen sobre los registros que tienen
  al menos una línea de esa combinación material + unidad; la suma de los recuentos de la fila es el
  número de registros con esa combinación.
- **RF-12.** EL SISTEMA muestra en cada fila, para cada estado presente, el número de registros de
  esa combinación que están en ese estado, ordenados según el flujo Borrador → En preparación →
  Listo → Confirmado → Enviado.
- **RF-13.** EL SISTEMA no muestra en la fila estados con recuento 0.
- **RF-14.** SI una combinación material + unidad aparece en un único registro, ENTONCES la fila
  muestra un único estado con recuento 1.
- **RF-15.** EL SISTEMA mantiene visibles todos los estados y recuentos de la fila, sin truncarlos;
  la fila puede crecer en alto para mostrarlos.
- **RF-16.** SI un mismo material aparece con más de una unidad distinta, ENTONCES EL SISTEMA lo
  muestra en filas separadas por unidad y no suma cantidades de unidades diferentes.
- **RF-17.** EL SISTEMA muestra junto al resumen consolidado el total de registros de la obra, el
  número de materiales distintos y el total de líneas.

### Detalle por registro

- **RF-18.** CUANDO la obra tiene registros, EL SISTEMA muestra la lista de registros ordenada del
  más reciente al más antiguo, y en cada uno: fecha de creación, estado del registro, número de
  líneas y sus materiales con cantidad pedida, cantidad preparada y unidad.
- **RF-19.** SI una línea del registro tiene notas, ENTONCES EL SISTEMA las muestra junto a esa
  línea.
- **RF-20.** SI un registro no tiene líneas, ENTONCES EL SISTEMA lo muestra igualmente en el detalle
  e indica que no tiene materiales, sin ocultarlo.
- **RF-21.** CUANDO el usuario pulsa un registro del detalle de la obra, EL SISTEMA abre el detalle
  de ese registro.

### Vuelta desde el detalle de un registro

- **RF-22.** CUANDO se abre el detalle de un registro, EL SISTEMA muestra siempre un enlace a la
  obra a la que pertenece, con independencia de si se abrió desde la ficha de la obra o desde el
  historial.
- **RF-23.** EL SISTEMA conserva en el detalle del registro el enlace al historial, además del
  enlace a su obra.
- **RF-24.** CUANDO el usuario pulsa el enlace a la obra desde el detalle de un registro, EL SISTEMA
  abre la ficha de esa obra.

### Crear registro desde la ficha

- **RF-25.** SI el usuario tiene permiso para crear registros, ENTONCES la ficha ofrece la acción de
  crear un registro, con la obra fija y sin posibilidad de cambiarla y con las notas como único
  campo editable, opcional.
- **RF-26.** SI el usuario no tiene permiso para crear registros, ENTONCES EL SISTEMA no le muestra
  la acción de crear y mantiene la ficha en modo consulta.
- **RF-27.** CUANDO el usuario confirma la creación de un registro desde la ficha, EL SISTEMA crea
  el registro en estado Borrador y abre el detalle de ese registro, que ofrece volver a la obra
  (RF-22).
- **RF-28.** SI la creación del registro falla, ENTONCES EL SISTEMA muestra un mensaje en español
  que indica que no se pudo crear el registro, sin detalles técnicos, conserva la obra y las notas
  introducidas y permite reintentar.
- **RF-29.** CUANDO el usuario vuelve a la ficha desde cualquier registro, mediante el enlace o la
  navegación atrás, EL SISTEMA muestra los datos actualizados sin recarga manual, incluidos los
  registros nuevos y las líneas añadidas o modificadas en registros existentes.

### Carga, estados vacíos y errores

- **RF-30.** MIENTRAS los datos de la obra están cargando, EL SISTEMA muestra un indicador de carga
  y no muestra ni el mensaje de «obra no encontrada» ni ningún estado vacío.
- **RF-31.** SI la obra no existe (respuesta de «no encontrado»), ENTONCES EL SISTEMA muestra un
  mensaje claro de «obra no encontrada» con un enlace a la lista de clientes, sin pantalla en blanco
  ni mensaje de error técnico.
- **RF-32.** SI falla la red o el servidor devuelve un error, ENTONCES EL SISTEMA muestra un mensaje
  en español que indica que no se pudo cargar la información de la obra, sin detalles técnicos, y
  permite reintentar.
- **RF-33.** SI la obra no tiene ningún registro, ENTONCES EL SISTEMA muestra un único estado vacío
  en la zona de resumen y detalle, mantiene visible la cabecera con los totales a 0 y ofrece la
  acción de crear registro cuando el usuario tenga permiso.
- **RF-34.** SI la obra tiene registros pero ninguno con líneas, ENTONCES EL SISTEMA indica «sin
  materiales» en el resumen, mantiene cada registro en el detalle con la indicación de que no tiene
  materiales (RF-20) y sigue mostrando los totales.

### Presentación adaptable

- **RF-35.** MIENTRAS la pantalla es estrecha (menos de 768 px), EL SISTEMA presenta el resumen
  consolidado y el detalle por registro como tarjetas de una columna, y la tarjeta de cada registro
  es completamente pulsable.
- **RF-36.** MIENTRAS la pantalla es ancha, EL SISTEMA presenta el resumen consolidado y el detalle
  por registro como tablas.
- **RF-37.** EL SISTEMA no oculta en el formato de tarjetas ninguna información exigida por RF-7,
  RF-9, RF-12, RF-17 y RF-18.
- **RF-38.** SI un nombre de material o de obra no cabe en el ancho disponible, ENTONCES EL SISTEMA
  lo envuelve en varias líneas y nunca oculta cantidades, unidades, referencia ni estados.

## Requisitos no funcionales

- **RNF-1.** La ficha obtiene en una sola petición de lectura todos los datos que muestra,
  incluidas las líneas de todos los registros y sus materiales; el número de peticiones no depende
  del número de registros ni de líneas. Se admite ampliar el contrato de lectura de la obra para
  incluir esos datos.
- **RNF-2.** Todos los textos visibles están en español y reutilizan las etiquetas ya existentes de
  estados de registro, estados de obra, tipos de servicio y unidades; no se introducen sinónimos
  nuevos para los mismos conceptos.
- **RNF-3.** La ficha usa una jerarquía de encabezados correcta (un encabezado principal para la
  obra y encabezados de sección para resumen y detalle) y enlaces con texto descriptivo, no
  «Abrir →» aislado, de modo que se entienda con lector de pantalla.
- **RNF-4.** Las fechas se muestran en formato local español (día/mes/año) y las cantidades
  respetan el formato numérico usado en el resto de la aplicación.
- **RNF-5.** Un dato opcional ausente o una línea sin notas no provoca errores ni huecos en la
  presentación (robustez del contrato de datos entre la información que se sirve y la que se pinta).
- **RNF-6.** La verificación de esta funcionalidad no introduce herramientas nuevas: se comprueba
  compilando los paquetes de servidor y de web y recorriendo manualmente los flujos de los RF en
  escritorio y en móvil. El proyecto no tiene tests, lint ni CI.
- **RNF-7.** La ficha y sus enlaces no eliminan funcionalidad existente: la carpeta de cliente, el
  historial general, el detalle de registro, materiales y movimientos siguen ofreciendo sus acciones
  actuales además de las nuevas.
- **RNF-8.** La información que muestra la ficha (resumen, totales y estados) coincide con la de los
  registros y sus líneas en el momento de la carga.

## Casos límite

- Obra sin registros: un único estado vacío, cabecera y totales a 0, y acción de crear si hay
  permiso (RF-33).
- Obra con registros pero sin líneas: «sin materiales» en el resumen, cada registro con su aviso y
  totales visibles (RF-20, RF-34).
- Material presente en varios registros o en varias líneas del mismo registro: se suma una sola vez
  por combinación material + unidad, y cuenta como un solo material distinto (RF-9, RF-11, RF-17).
- Material que solo aparece en un registro: un único estado con recuento 1 (RF-14).
- Material repartido entre varios estados: se muestran todos los estados presentes con su recuento,
  en orden de flujo y sin estados a cero (RF-12, RF-13).
- Material con los cinco estados distintos: todos visibles y con su recuento, sin truncar, aunque la
  fila crezca en alto (RF-15).
- Mismo material con unidades distintas (dato histórico inconsistente): filas separadas, nunca
  sumadas (RF-16).
- Registro con cantidad preparada mayor, menor o igual que la pedida: se muestran ambos valores sin
  recalcular ni corregir (RF-18).
- Obra con estado `Finalizada` o `Cancelada`: se muestra con su distintivo; la ficha no bloquea por
  sí misma la consulta ni la creación de registros (se mantiene el comportamiento actual).
- Dirección de la ficha abierta directamente por enlace, recarga o marcador: se muestra la ficha
  completa con su enlace al cliente (RF-2).
- Obra inexistente (respuesta de «no encontrado»): mensaje «obra no encontrada» con vuelta a
  clientes; un fallo de red o del servidor es un caso distinto y ofrece reintento (RF-31, RF-32).
- Carga lenta: se muestra el indicador y nunca el mensaje de «obra no encontrada» ni un estado
  vacío mientras se esperan los datos (RF-30).
- Registro eliminado mientras se navega: al abrirlo se informa de que no existe y se ofrece volver
  a la obra, usando la obra de origen que conserva la navegación desde la ficha; si se abrió desde
  el historial y no hay obra de origen disponible, se ofrece volver al historial (RF-22, RF-23).
- Un registro abierto desde el historial ofrece igualmente volver a su obra (RF-22, RF-24).
- Obra con muchos registros (decenas): se muestran todos, sin paginación en esta fase.
- Pantalla muy estrecha con nombres de material largos: el nombre se envuelve en varias líneas y no
  se ocultan cantidades, unidades, referencia ni estados (RF-38).
- Usuario técnico: ve la ficha completa en modo consulta, sin acción de crear (RF-26).

## Fuera de alcance

- **Añadir materiales por voz** (fase posterior, no se especifica ni se implementa aquí).
- Añadir, editar o quitar líneas de material desde la ficha de la obra; eso sigue ocurriendo en el
  detalle del registro.
- Cambiar el estado de un registro desde la ficha de la obra; el flujo de estados sigue en el
  detalle del registro.
- Editar o borrar la obra desde su ficha.
- Documento imprimible, PDF o exportación CSV de la obra completa.
- Stock disponible, faltantes, necesidades de compra o comparación con el inventario: el resumen
  consolidado es un histórico de lo necesitado en la obra y no se contrasta con el stock.
- Buscadores, filtros por estado, ordenaciones configurables o paginación dentro de la ficha.
- Añadir al historial general un selector de obra; el acceso filtrado se ofrece desde la ficha.
- Notificaciones, recordatorios o envíos de correo desde la ficha.
- Los permisos de acceso no se modifican: la ficha la ve quien ya puede ver la carpeta del cliente y
  solo se adapta la visibilidad de la acción de crear al rol actual.
- Rediseño visual definitivo de la aplicación (queda para una revisión de diseño posterior).
- Paginación o virtualización para obras con cientos de registros.

## Criterios de finalización

- [ ] Pulsar una obra en la carpeta del cliente abre su ficha, la tarjeta dice «Ver obra» y la
      dirección de la ficha es propia, estable y abrible por enlace, recarga o marcador (RF-1,
      RF-2, RF-3).
- [ ] La ficha enlaza siempre a la carpeta del cliente con su nombre y al historial filtrado por la
      obra, y el historial general sigue accesible desde la navegación habitual (RF-4, RF-5, RF-6).
- [ ] La cabecera muestra cliente, obra, tipo de servicio, estado y número de registros, más los
      datos opcionales que existan, sin huecos (RF-7, RF-8).
- [ ] El resumen consolidado muestra una fila por material y unidad con nombre, referencia de
      catálogo, unidad y sumas de pedido y preparado, en orden fijo por material y unidad (RF-9,
      RF-10).
- [ ] Los estados de cada fila se calculan sobre los registros con esa combinación material +
      unidad, muestran el recuento por estado en orden de flujo, sin estados a cero, con recuento 1
      si solo hay un registro, sin truncar y en filas separadas por unidad (RF-11, RF-12, RF-13,
      RF-14, RF-15, RF-16).
- [ ] Los totales muestran el número de registros, los materiales distintos contados una sola vez
      por material y el total de líneas de todos los registros (RF-17).
- [ ] El detalle lista los registros del más reciente al más antiguo con fecha, estado, número de
      líneas y materiales con pedido, preparado y unidad, y las notas de línea cuando existan
      (RF-18, RF-19).
- [ ] Un registro sin líneas aparece en el detalle con la indicación de que no tiene materiales
      (RF-20).
- [ ] Pulsar un registro del detalle abre el detalle de ese registro (RF-21).
- [ ] Cualquier registro, abierto desde la ficha o desde el historial, muestra el enlace a su obra y
      conserva el enlace al historial; el enlace a la obra abre la ficha correspondiente (RF-22,
      RF-23, RF-24).
- [ ] Con permiso, la ficha ofrece crear un registro con la obra fija y notas opcionales; sin
      permiso, la acción no aparece y la ficha queda en consulta (RF-25, RF-26).
- [ ] Al confirmar la creación, el registro nace en Borrador y se abre su detalle; si falla, se
      muestra el mensaje en español sin detalles técnicos y el reintento conserva la obra y las
      notas (RF-27, RF-28).
- [ ] Al volver a la ficha desde un registro, los datos están actualizados sin recarga manual,
      incluidos los registros nuevos y las líneas añadidas o modificadas (RF-29).
- [ ] Durante la carga se ve un indicador; una obra inexistente muestra «obra no encontrada» con
      vuelta a clientes; un fallo de red o del servidor muestra error con reintento (RF-30, RF-31,
      RF-32).
- [ ] Una obra sin registros muestra un único estado vacío, cabecera y totales a 0 y la acción de
      crear con permiso; con registros sin líneas, el resumen y cada registro indican «sin
      materiales» y los totales siguen visibles (RF-33, RF-34).
- [ ] En pantalla estrecha el resumen y el detalle se ven como tarjetas de una columna con el
      registro completamente pulsable; en pantalla ancha, como tablas; no se pierde información y
      los nombres largos se envuelven (RF-35, RF-36, RF-37, RF-38).
- [ ] La ficha se carga con una sola petición de lectura, se usan las etiquetas existentes, la
      jerarquía de encabezados y los enlaces son accesibles, las fechas y cantidades respetan el
      formato local, los datos opcionales ausentes no rompen nada y la información coincide con la
      de los registros (RNF-1, RNF-2, RNF-3, RNF-4, RNF-5, RNF-8).
- [ ] Compilan el paquete de servidor y el de web, y carpeta de cliente, historial general, detalle
      de registro, materiales y movimientos siguen ofreciendo sus acciones actuales (RNF-6, RNF-7).
- [ ] Recorrido manual completo en escritorio y móvil, con usuario administrador/almacenero y con
      usuario técnico.

## Dudas abiertas

Ninguna.
