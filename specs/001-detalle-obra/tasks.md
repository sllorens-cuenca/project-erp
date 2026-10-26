# Tareas 001 — Detalle de obra

Spec aprobada: `specs/001-detalle-obra/spec.md` · Plan: `specs/001-detalle-obra/plan.md`

Orden de dependencia: API → lógica pura → página → secciones → navegación → alta → estados →
responsive → verificación. Diez tareas (límite de la skill). Node 22 vía nvm en cada shell:
`export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"`.

- [x] **T1. Ampliar `GET /projects/:id` con las líneas y su material.** RF-9, RF-10, RF-11, RF-12,
  RF-13, RF-14, RF-15, RF-16, RF-17, RF-18, RF-19, RNF-1, RNF-8
- Hecho cuando: `npm run build -w @erp/api` pasa; con token, `curl /api/projects/<id>` devuelve
  `lists` ordenadas desc, cada una con `_count.items` y `items[]` con `requestedQty`,
  `preparedQty`, `unit`, `notes` y `material.{id,sku,name,category,unit,stock,active}`; una obra sin
  registros devuelve `lists: []`; un id inexistente sigue devolviendo 404 «Obra no encontrada».

- [x] **T2. Crear `apps/web/lib/obra.ts` con tipos y funciones puras.** RF-9, RF-10, RF-11, RF-12,
  RF-13, RF-14, RF-15, RF-16, RF-17, RF-18, RF-19
- Hecho cuando: `npm run build -w @erp/web` pasa; `buildConsolidado`, `totalesObra` y `formatFecha`
  no importan React ni hacen red; razonando con el payload demo se comprueba: material en dos
  registros → una fila con cantidades sumadas y recuentos que suman 2; mismo material con dos
  unidades → dos filas; un solo registro → un estado con `count: 1`; ningún estado con `count: 0`;
  estados en orden Borrador→Enviado; orden de filas por nombre y unidad; totales = registros de la
  obra, materiales únicos y todas las líneas.

- [x] **T3. Ruta `/obras/[id]`, cabecera, enlaces y estados de carga/404/error.** RF-1, RF-2, RF-3,
  RF-4, RF-5, RF-6, RF-7, RF-8, RF-30, RF-31, RF-32
- Hecho cuando: la tarjeta de obra de `clientes/[id]` dice «Ver obra» y abre `/obras/<id>`; abrir,
  recargar o pegar la URL directamente muestra la ficha con enlace al cliente y a
  `/historial?obra=<id>`; la cabecera muestra cliente, obra, tipo de servicio, estado con
  `ProjectStatusBadge`, número de registros y los opcionales que existan sin huecos; mientras carga
  se ve «Cargando…» y ni 404 ni vacío; un id inexistente muestra «Obra no encontrada» + enlace a
  clientes; con la API parada aparece el mensaje en español sin detalles técnicos y «Reintentar»
  recupera la ficha al volver la API; `npm run build -w @erp/web` pasa.

- [x] **T4. Resumen consolidado y totales en escritorio.** RF-9, RF-10, RF-11, RF-12, RF-13, RF-14,
  RF-15, RF-16, RF-17
- Hecho cuando: `ObraResumen` pinta una tabla (visible en escritorio) con nombre, referencia de
  catálogo, unidad, pedido, preparado y estados con recuento; el orden es fijo por material y
  unidad; no aparecen estados a cero; los recuentos de cada fila suman sus registros; las filas se
  separan por unidad; los totales de registros, materiales distintos y líneas son correctos;
  `npm run build -w @erp/web` pasa.

- [x] **T5. Detalle por registro con líneas, notas y enlace al registro.** RF-18, RF-19, RF-20,
  RF-21
- Hecho cuando: `ObraRegistros` lista los registros del más reciente al más antiguo con fecha
  `dd/mm/aaaa`, estado, número de líneas y líneas con material, pedido, preparado y unidad; las
  notas de línea se ven cuando existen; un registro sin líneas aparece con «sin materiales»; pulsar
  un registro abre `/historial/<id>?obra=<obraId>`; `npm run build -w @erp/web` pasa.

- [x] **T6. Vuelta a la obra desde el detalle de registro, conservando el historial.** RF-22, RF-23,
  RF-24
- Hecho cuando: `historial/[id]` muestra siempre un enlace «← Obra» con el nombre de la obra
  (obtenido de `data.project`) además de «← Historial»; funciona igual si el registro se abrió desde
  la ficha o directamente desde `/historial`; pulsar «← Obra» abre `/obras/<projectId>`; si el
  registro no existe, se muestra «Registro no encontrado» y se ofrece «Volver a la obra» usando
  `?obra=` o, si falta, «Volver al historial»; `npm run build -w @erp/web` pasa.

- [x] **T7. Crear registro desde la ficha con obra fija y visibilidad por rol.** RF-25, RF-26,
  RF-27, RF-28
- Hecho cuando: con ADMIN/ALMACENERO la ficha ofrece «+ Nuevo registro», el formulario muestra la
  obra sin poder cambiarla y solo un campo de notas opcional; con TECNICO la acción no aparece y la
  ficha queda en consulta; al confirmar, `POST /lists` crea el registro en estado Borrador y se
  abre su detalle (`/historial/<nuevo>?obra=<obraId>`); si el alta falla, aparece el mensaje en
  español sin detalles técnicos y al reintentar se conservan obra y notas; `npm run build -w
  @erp/web` pasa.

- [x] **T8. Refresco al volver y estados vacíos de la obra.** RF-29, RF-33, RF-34
- Hecho cuando: tras añadir o modificar una línea en un registro y volver a la ficha (enlace o
  botón atrás), resumen, totales y detalle reflejan el cambio sin recargar a mano; una obra sin
  registros muestra un único estado vacío en la zona de resumen/detalle con cabecera y totales a 0
  y, con permiso, la acción de crear; una obra con registros pero sin líneas muestra «sin
  materiales» en el resumen, cada registro con su aviso y los totales visibles; `npm run build -w
  @erp/web` pasa.

- [x] **T9. Tarjetas en móvil, nombres largos y accesibilidad de la ficha.** RF-35, RF-36, RF-37,
  RF-38, RNF-3
- Hecho cuando: por debajo de 768 px el resumen y el detalle se ven como tarjetas de una columna y
  la tarjeta de cada registro es completamente pulsable; desde 768 px se ven tablas; no se oculta
  ningún dato exigido por RF-7, RF-9, RF-12, RF-17 y RF-18 en ninguno de los dos formatos; los
  nombres largos se envuelven sin ocultar cantidades, unidades, referencia ni estados; la ficha
  tiene un solo `h1` y `h2` para resumen y detalle, y los enlaces tienen texto descriptivo;
  `npm run build -w @erp/web` pasa.

- [x] **T10. Verificación manual guiada, despliegue y `MEMORY.md`.** RF-1–RF-38, RNF-1–RNF-8
- Hecho cuando: `npm run build -w @erp/api` y `npm run build -w @erp/web` pasan con Node 22; se
  recorre entero el checklist de «Criterios de finalización» en escritorio y en móvil (~375 px) con
  usuario ADMIN/ALMACENERO y con TECNICO, usando la demo (creando y limpiando datos temporales con
  `/tmp/opencode/demo-clean.sh`); carpeta de cliente, historial general y su filtro `?obra=…`,
  detalle de registro, materiales y movimientos siguen funcionando; `MEMORY.md` queda actualizado
  con la ruta nueva, la ampliación de `GET /projects/:id` y el recordatorio de diseño pendiente; se
  anota el paso manual de Render (Manual Deploy → Clear build cache + `/api/health` con el commit
  nuevo) para que lo ejecute el usuario.
