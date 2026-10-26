# Plan 001 — Detalle de obra

Spec: `specs/001-detalle-obra/spec.md` (aprobada) · Fecha: 2026-10-26

## Resumen de la solución

Se crea la ruta `/obras/[id]` (client component dentro de `AppShell`) que carga **una sola vez**
`GET /api/projects/:id`, ampliado para incluir las líneas (`lists[].items[].material`) además de
`_count.items`. La página pinta cabecera, resumen consolidado y detalle por registro. Toda la
agregación (sumas, recuentos de estados, orden, totales) vive en funciones puras de
`apps/web/lib/obra.ts`, sin React ni llamadas de red. La tarjeta de obra del cliente pasa a
`/obras/<projectId>` con el texto «Ver obra»; el detalle de registro gana un enlace a su obra
conservando el del historial. No se tocan enums de `@erp/shared` ni el esquema de base de datos.

## Archivos y responsabilidades

### API

| Archivo | Cambio | RF |
|---|---|---|
| `apps/api/src/projects/projects.service.ts` | Ampliar el `include` de `findOne`: `lists` con `items` (orden `createdAt asc`) e `items[].material` con los campos que pinta la web (`id, sku, name, category, unit, stock, active`), conservando `_count.items` y el orden `createdAt desc` de `lists`. | RF-9–RF-19, RNF-1, RNF-8 |

No se crean controladores, DTOs, endpoints ni migraciones. `GET /projects/:id` ya está abierto a
cualquier usuario autenticado y mantiene su 404 (`Obra no encontrada`).

### Web

| Archivo | Cambio | RF |
|---|---|---|
| `apps/web/app/obras/[id]/page.tsx` **(nuevo)** | Página de la obra: carga, cabecera, enlaces a cliente e historial filtrado, formulario de alta, estados de carga/404/error/vacío y composición de las dos secciones. | RF-1, RF-2, RF-4, RF-5, RF-7, RF-8, RF-25–RF-33 |
| `apps/web/components/ObraResumen.tsx` **(nuevo)** | Resumen consolidado: tabla `hidden md:block`, tarjetas `md:hidden`, totales y orden. | RF-9–RF-17, RF-37, RF-38 |
| `apps/web/components/ObraRegistros.tsx` **(nuevo)** | Detalle por registro: tabla + tarjetas pulsables, líneas con pedido/preparado/unidad/notas, registro sin líneas. | RF-18–RF-21, RF-35–RF-38 |
| `apps/web/components/NuevoRegistroObraForm.tsx` **(nuevo)** | Formulario con obra fija y solo notas; alta y error con reintento. | RF-25–RF-28 |
| `apps/web/lib/obra.ts` **(nuevo)** | Tipos del payload, `buildConsolidado`, `totalesObra`, `formatFecha`. Funciones puras. | RF-9–RF-19 |
| `apps/web/lib/permissions.ts` **(nuevo)** | `puedeCrearRegistros(role)`; única definición web de la regla ADMIN/ALMACENERO. | RF-25, RF-26 |
| `apps/web/lib/useApi.ts` | Exponer `errorStatus` (de `ApiError`) y aceptar un tercer argumento `RequestInit` para `cache: 'no-store'`. Cambio retrocompatible. | RF-29–RF-32, RNF-1 |
| `apps/web/components/ui.tsx` | Añadir `ProjectStatusBadge` (usa `PROJECT_STATUS_LABELS` y colores de proyecto). | RF-7 |
| `apps/web/app/clientes/[id]/page.tsx` | La tarjeta de obra enlaza a `/obras/<projectId>` y el CTA dice «Ver obra». | RF-1, RF-3 |
| `apps/web/app/historial/[id]/page.tsx` | Enlace a la obra (siempre) + mantener «← Historial»; leer `?obra=` como contexto de respaldo; estado «registro no encontrado» con vuelta a la obra o al historial. | RF-22–RF-24, caso límite de registro eliminado |

`apps/web/app/historial/page.tsx` **no se toca**: el filtro `?obra=` sigue funcionando (RF-6,
RNF-7) y no se añade selector de obra (fuera de alcance).

## Interfaz de datos

Respuesta de `GET /api/projects/:id` (campos relevantes; los de `client` no cambian):

```ts
{
  id: string
  clientId: string
  name: string
  serviceType: string          // INSTALACION | REPARACION | AIRE_ACONDICIONADO | OTRO
  status: string               // ABIERTA | EN_CURSO | FINALIZADA | CANCELADA
  address: string | null
  notes: string | null
  startDate: string | null     // ISO
  endDate: string | null       // ISO
  createdAt: string
  client: { id: string; name: string }   // el include actual devuelve el cliente completo
  lists: Array<{
    id: string
    status: string             // BORRADOR | EN_PREPARACION | LISTO | CONFIRMADO | ENVIADO
    notes: string | null
    sentAt: string | null
    createdAt: string
    _count: { items: number }
    items: Array<{
      id: string
      materialId: string
      requestedQty: number
      preparedQty: number
      unit: string             // unidad de la línea (manda para agrupar)
      notes: string | null
      material: {
        id: string; sku: string; name: string; category: string | null
        unit: string; stock: number; active: boolean
      }
    }>
  }>
}
```

Tipos de la web en `lib/obra.ts` (`ObraDetalle`, `ObraRegistro`, `ObraLinea`,
`ConsolidadoFila`, `EstadoRecuento`, `TotalesObra`). La web lee todo con `?.`/`?? 0`/`?? []`
(RNF-5) aunque el contrato ampliado ya lo garantice: un despliegue desfasado de Render no debe
romper la pantalla.

## Funciones puras

Todas en `apps/web/lib/obra.ts`, sin React, sin `fetch`, sin mutar la entrada. Ninguna depende de
la fecha actual: las fechas se muestran tal cual llegan, por lo que no reciben parámetro `hoy`.

```ts
export interface EstadoRecuento { status: string; count: number }
export interface ConsolidadoFila {
  key: string            // `${materialId}|${unit}`
  materialId: string
  sku: string
  name: string
  unit: string
  requestedQty: number
  preparedQty: number
  registros: number      // nº de registros con al menos una línea de la combinación
  estados: EstadoRecuento[] // solo estados presentes, orden de flujo
}

export function buildConsolidado(lists: ObraRegistro[]): ConsolidadoFila[]
export function totalesObra(lists: ObraRegistro[]): { registros: number; materiales: number; lineas: number }
export function formatFecha(iso: string | null | undefined): string  // dd/mm/aaaa o ''
```

### Pseudocódigo

```
buildConsolidado(lists):
  filas = Map<key, { materialId, sku, name, unit, requested, prepared, registros: Map<listId,status> }>
  para cada list en lists:
    para cada item en list.items:
      key = item.materialId + "|" + item.unit
      f = filas.get(key) o fila nueva con datos de item.material y unit = item.unit
      f.requested += item.requestedQty
      f.prepared  += item.preparedQty
      f.registros.set(list.id, list.status)          // una vez por registro
  resultado = []
  para cada f en filas:
    counts = {}
    para cada status de f.registros.values():
      counts[status] = (counts[status] ?? 0) + 1
    estados = ordenarEstados(counts → [{status,count}])
    resultado.push({ ...f, registros: f.registros.size, estados })
  ordenar resultado por:
     name.localeCompare(otro.name, "es", { sensitivity: "base", numeric: true })
     luego MATERIAL_UNITS.indexOf(unit) - MATERIAL_UNITS.indexOf(otra.unit)
     luego unit.localeCompare(otra.unit)              // unidades desconocidas, al final
  devolver resultado

ordenarEstados(estados):
  MATERIAL_LIST_FLOW.indexOf(status) ascendente
  estados desconocidos (texto legado) al final, por nombre
  // nunca se generan recuentos 0: los estados nacen del mapa de registros

totalesObra(lists):
  materiales = Set<materialId>
  lineas = 0
  para cada list, item: materiales.add(item.materialId); lineas += 1
  devolver { registros: lists.length, materiales: materiales.size, lineas }
```

Notas de algoritmo (resuelven los RF):

- `preparedQty` puede superar `requestedQty`; no se corrige ni se recalcula (RF-18).
- Una combinación en un solo registro produce un único estado con `count: 1` (RF-14).
- La suma de `estados[].count` de una fila es `registros` (RF-11), verificable a ojo en la demo.
- Materiales distintos cuenta `materialId` únicos aunque tengan varias unidades (RF-17).
- El orden es determinista con los mismos datos (RF-10).

## Decisiones y alternativas descartadas

1. **Datos: ampliar `GET /projects/:id`** en lugar de un endpoint nuevo o N peticiones.
   - Se elige ampliar el `include` porque la ficha necesita obra + registros + líneas + material en
     **una sola lectura** (RNF-1), el endpoint ya existe, ya está protegido y ya devuelve
     `client`/`lists`, y evita un segundo contrato que mantener.
   - Descartado `GET /projects/:id/detalle`: duplica serialización y obliga a versionar dos
     respuestas de la misma entidad.
   - Descartado `GET /projects/:id` + `GET /lists?projectId=` + `GET /lists/:id` por registro:
     viola RNF-1 y multiplica peticiones con el nº de registros.
   - Coste asumido: payload mayor en obras con muchas líneas; la spec excluye paginación.

2. **Ruta `/obras/[id]`** en lugar de `/clientes/[id]/obras/[id]`.
   - El identificador de la obra es único; una URL corta es estable para marcadores y enlaces
     directos (RF-2) y no se rompe si la obra cambia de cliente.
   - La vuelta al cliente (RF-4) se construye con `client.id` y `client.name` del propio payload,
     así que no hace falta el id del cliente en la URL.
   - Descartado anidar: URL larga, dos identificadores que pueden desincronizarse y enlaces antiguos
     inválidos si se reasigna la obra.

3. **Consolidado calculado en la web** en funciones puras, no en la API.
   - Los datos ya llegan completos; agregar es O(n) sobre las líneas y evita otra consulta o un
     nuevo endpoint con semántica de estados duplicada. Al ser funciones puras se razonan y se
     verifican a mano sin runner.
   - Descartado calcularlo en la API (servicio o `groupBy`): cierra el contrato a una forma concreta
     de presentación y obliga a tocar API + Render para cada ajuste de agrupación.
   - Descartado `useMemo` inline en la página: menos legible y no aislable.

4. **Refresco al volver (RF-29)**: `useApi` recarga al montar y, además, la página se suscribe a
   `focus`/`visibilitychange` para recargar al recuperar el foco, con `cache: 'no-store'` en la
   lectura. Así se cubren tanto la navegación por enlace como «atrás» del navegador y las líneas
   añadidas/editadas en un registro.
   - Descartado confiar solo en el montaje y en la caché del router: si el navegador restaura la
     página desde historial, el resumen puede quedar obsoleto.
   - Descartado forzar recarga completa del navegador: incumple «sin recarga manual» y pierde el
     contexto.

5. **Permisos de UI sin duplicar la regla**: `lib/permissions.ts` con
   `puedeCrearRegistros(role)` (ADMIN, ALMACENERO) y `useAuth().user.role`. La API sigue siendo la
   autoridad (`@Roles` en `lists.controller.ts`); la web solo oculta la acción. Descartado comparar
   roles sueltos en cada página y descartado deducir el permiso de un intento fallido.

6. **Contexto de la obra en el detalle de registro (RF-22)**: el enlace desde la ficha lleva
   `/historial/<id>?obra=<projectId>`; el detalle construye «← Obra» con `data.project` (siempre
   presente en `GET /lists/:id`) y conserva «← Historial». El `?obra=` solo se usa como respaldo
   cuando el registro no existe (404) y no hay `data.project`, para poder ofrecer «Volver a la
   obra»; si tampoco hay parámetro, se ofrece «Volver al historial».
   - Descartado depender solo del parámetro: un registro abierto desde el historial también debe
     ofrecer su obra (RF-22) y ahí no hay `?obra=`.
   - Descartado un endpoint de registro anidado a la obra: cambia URLs existentes y rompe enlaces
     (RNF-7).

7. **Badge de estado de obra**: `ProjectStatusBadge` nuevo con `PROJECT_STATUS_LABELS`.
   - Motivo: `StatusBadge` solo conoce estados de registro; hoy una obra muestra el código crudo
     (`ABIERTA`). En la ficha se usa el badge correcto.
   - Descartado añadir un `kind` a `StatusBadge`: mezcla dos dominios en un componente y obliga a
     tocar todos sus usos.
   - La tarjeta del cliente se queda como está salvo el enlace y el texto (RF-3); el código crudo
     del estado en esa tarjeta es un defecto previo, fuera de esta spec.

8. **Formulario de alta propio** en vez de reutilizar `NewListForm` del historial: aquel incluye
   selector de obra y no es exportable; la ficha necesita obra fija (RF-25). Se replica el mínimo:
   textarea de notas, botón, estado de guardado y error.

## Riesgos

- **Render no autodespliega**: hay que Manual Deploy → Clear build cache y verificar
  `/api/health` (commit) antes de probar la ficha en producción. Es un paso manual del usuario.
- **Enlaces antiguos `/historial?obra=…`**: se mantienen funcionando (no hay redirección); solo
  cambia el destino de la tarjeta. Confirmar que no quedan enlaces internos con «Ver historial»
  apuntando a la obra.
- **Payload grande** en obras con muchos registros/líneas: una sola respuesta puede pesar; la spec
  excluye paginación. Vigilar el tiempo de carga en la demo; si molesta, será otra spec.
- **Datos inconsistentes de unidad**: se agrupa por la unidad de la **línea** (la que acompaña a la
  cantidad) y se muestran filas separadas; la unidad del catálogo (`material.unit`) no se usa para
  sumar. Riesgo de que un dato histórico mal cargado genere dos filas del mismo material: es el
  comportamiento pedido (RF-16).
- **Caché/estado obsoleto** al volver: mitigado con recarga al foco y `no-store`; verificar también
  con «atrás» del navegador.
- **Rol en localStorage** desactualizado si un admin cambia el rol: puede verse u ocultarse la
  acción hasta el siguiente login. La API rechaza el alta igualmente.
- **Datos demo**: la demo tiene 4 obras y pocos registros; para ver estados distintos y un material
  repetido hará falta añadir líneas/registros temporalmente y limpiar después
  (`/tmp/opencode/demo-clean.sh`, IDs en `/tmp/opencode/demo-ids.json`).
- **Build incremental de la API**: si `dist` queda viejo, `rm -rf apps/api/dist` antes de compilar
  (aprendizaje conocido). No se toca `@erp/shared`, así que no hay que recompilarlo.

## Estrategia de verificación

El proyecto **no tiene tests, lint ni CI** (AGENTS.md y MEMORY.md). La skill propone `node --test`,
pero aquí no aplica: no hay runner ni transpilación de TypeScript configurada para tests, y añadirlo
sería un cambio de convención del proyecto ajeno a esta spec. Por tanto:

1. **Compilación** (Node 22 vía nvm, en cada shell):
   `export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && node -v`
   - `npm run build -w @erp/api`
   - `npm run build -w @erp/web`
   - `@erp/shared` no se modifica: no hace falta recompilarlo.
2. **Comprobación de contrato** de la API ampliada con `curl` autenticado contra dev (`:3001`):
   presencia de `lists[].items[].material`, `_count.items`, orden desc de registros, 404 de obra
   inexistente.
3. **Razonamiento guiado de las funciones puras** con los casos del algoritmo (una combinación en
   dos registros, mismo material en dos unidades, estados repetidos, recuentos sin ceros, totales).
   Se contrasta con lo que muestra la demo. No se añade runner ni script al repo; un script suelto
   en `/tmp/opencode` sería una copia de la lógica y puede divergir, así que no se usa como
   verificación oficial.
4. **Recorrido manual** en dev (`npm run dev:api`, `npm run dev:web`) con los datos demo, en
   escritorio y móvil (DevTools ~375 px), con usuario ADMIN/ALMACENERO y con TECNICO. Checklist:
   los criterios de finalización de la spec, en orden.
5. **En producción**, tras Manual Deploy de la API: `/api/health` con el commit nuevo y repetir el
   recorrido corto (obra → registro → obra, alta de registro, técnico sin botón).

## Trazabilidad RF → partes

- **RF-1, RF-2, RF-3**: `clientes/[id]`, ruta `obras/[id]`.
- **RF-4, RF-5, RF-6**: cabecera de `obras/[id]` y `AppShell` (historial ya en la nav).
- **RF-7, RF-8**: cabecera + `ProjectStatusBadge` + `formatFecha`.
- **RF-9–RF-17**: `lib/obra.ts` (`buildConsolidado`, `totalesObra`) + `ObraResumen`.
- **RF-18–RF-21**: `ObraRegistros` + payload ampliado.
- **RF-22–RF-24**: `historial/[id]` + enlace desde `ObraRegistros`.
- **RF-25–RF-28**: `NuevoRegistroObraForm`, `lib/permissions.ts`, `useAuth`.
- **RF-29**: `useApi` (recarga al foco) + composición de la página.
- **RF-30–RF-32**: `useApi.errorStatus` + estados de la página.
- **RF-33, RF-34**: estados vacíos en la página y en las dos secciones.
- **RF-35–RF-38**: tablas/tarjetas en `ObraResumen` y `ObraRegistros`.
- **RNF-1, RNF-8**: include único y tipos tolerantes (`?.`/`??`).
- **RNF-2–RNF-5**: etiquetas de `@erp/shared`, encabezados, formato `es-ES`, tolerancia a nulos.
- **RNF-6, RNF-7**: build + recorrido; historial general intacto.
