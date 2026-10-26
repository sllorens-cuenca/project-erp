/**
 * Tipos del detalle de obra y funciones puras de agregación.
 *
 * Sin React y sin red: estas funciones se pueden razonar y comprobar a mano
 * con el payload de `GET /api/projects/:id`. No mutan la entrada.
 *
 * La web lee el payload con `?.`/`?? 0`/`?? []` (RNF-5): los campos que la
 * API podría no traer (despliegue desfasado) son opcionales en los tipos y
 * las funciones los tratan como ausentes.
 */

import { MATERIAL_LIST_FLOW, MATERIAL_UNITS } from '@erp/shared'

/** Línea de material de un registro de la obra. */
export interface ObraLinea {
  id: string
  materialId: string
  requestedQty: number
  preparedQty: number
  /** Unidad de la línea (manda para agrupar; puede no coincidir con la del catálogo). */
  unit: string
  notes?: string | null
  material?: {
    id: string
    sku: string
    name: string
    category?: string | null
    unit?: string
    stock?: number
    active?: boolean
  } | null
}

/** Registro (documento de materiales) perteneciente a la obra. */
export interface ObraRegistro {
  id: string
  status: string
  notes?: string | null
  sentAt?: string | null
  createdAt: string
  _count?: { items: number }
  items?: ObraLinea[]
}

/** Respuesta de `GET /api/projects/:id`. */
export interface ObraDetalle {
  id: string
  clientId: string
  name: string
  serviceType: string
  status: string
  address?: string | null
  notes?: string | null
  startDate?: string | null
  endDate?: string | null
  createdAt: string
  client: { id: string; name: string }
  lists: ObraRegistro[]
}

/** Recuento de registros de una combinación material + unidad en un estado. */
export interface EstadoRecuento {
  status: string
  count: number
}

/** Fila del resumen consolidado: una por combinación material + unidad. */
export interface ConsolidadoFila {
  /** `${materialId}|${unit}` */
  key: string
  materialId: string
  sku: string
  name: string
  unit: string
  requestedQty: number
  preparedQty: number
  /** Nº de registros con al menos una línea de la combinación. */
  registros: number
  /** Solo estados presentes, en orden de flujo. */
  estados: EstadoRecuento[]
}

/** Totales de la obra (RF-17). */
export interface TotalesObra {
  registros: number
  materiales: number
  lineas: number
}

/** Acumulador interno de una combinación material + unidad. */
interface FilaAcumulada {
  materialId: string
  sku: string
  name: string
  unit: string
  requestedQty: number
  preparedQty: number
  /** listId → status: una entrada por registro, aunque tenga varias líneas. */
  registros: Map<string, string>
}

/** Cantidad a sumar: cualquier valor ausente o no numérico cuenta como 0. */
function cantidad(valor: number | null | undefined): number {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : 0
}

/** Posición de una unidad en el catálogo; las desconocidas van al final. */
function posicionUnidad(unit: string): number {
  const indice = MATERIAL_UNITS.findIndex((unidad) => unidad === unit)
  return indice === -1 ? MATERIAL_UNITS.length : indice
}

/** Posición de un estado en el flujo; los desconocidos (texto legado) van al final. */
function posicionEstado(status: string): number {
  const indice = MATERIAL_LIST_FLOW.findIndex((estado) => estado === status)
  return indice === -1 ? MATERIAL_LIST_FLOW.length : indice
}

/**
 * Ordena los estados presentes: flujo Borrador → Enviado y, al final, los
 * desconocidos por nombre. No se generan recuentos a cero.
 */
function ordenarEstados(estados: EstadoRecuento[]): EstadoRecuento[] {
  return [...estados].sort((a, b) => {
    const diferencia = posicionEstado(a.status) - posicionEstado(b.status)
    if (diferencia !== 0) return diferencia
    return a.status.localeCompare(b.status)
  })
}

/** Orden fijo de filas: nombre, luego unidad de catálogo y por último texto. */
function compararFilas(a: ConsolidadoFila, b: ConsolidadoFila): number {
  const porNombre = a.name.localeCompare(b.name, 'es', {
    sensitivity: 'base',
    numeric: true,
  })
  if (porNombre !== 0) return porNombre
  const porUnidad = posicionUnidad(a.unit) - posicionUnidad(b.unit)
  if (porUnidad !== 0) return porUnidad
  return a.unit.localeCompare(b.unit)
}

/**
 * Resumen consolidado de la obra: una fila por combinación material + unidad,
 * con las cantidades sumadas y el desglose de estados de sus registros.
 */
export function buildConsolidado(
  lists: ObraRegistro[] | null | undefined,
): ConsolidadoFila[] {
  const filas = new Map<string, FilaAcumulada>()

  ;(lists ?? []).forEach((list, indiceLista) => {
    // Fallback por si el payload viniera sin id: cada registro cuenta una vez.
    const listId = list?.id ?? `registro-${indiceLista}`
    const status = list?.status ?? ''

    for (const item of list?.items ?? []) {
      if (!item) continue
      const unit = item.unit ?? ''
      const materialId = item.materialId ?? item.material?.id ?? ''
      const key = `${materialId}|${unit}`

      let fila = filas.get(key)
      if (!fila) {
        fila = {
          materialId,
          sku: item.material?.sku ?? '',
          name: item.material?.name ?? '',
          unit,
          requestedQty: 0,
          preparedQty: 0,
          registros: new Map<string, string>(),
        }
        filas.set(key, fila)
      }

      fila.requestedQty += cantidad(item.requestedQty)
      fila.preparedQty += cantidad(item.preparedQty)
      fila.registros.set(listId, status)
    }
  })

  const resultado: ConsolidadoFila[] = []
  filas.forEach((fila, key) => {
    const recuentos = new Map<string, number>()
    fila.registros.forEach((status) => {
      recuentos.set(status, (recuentos.get(status) ?? 0) + 1)
    })

    const estados = [...recuentos.entries()].map(([status, count]) => ({
      status,
      count,
    }))

    resultado.push({
      key,
      materialId: fila.materialId,
      sku: fila.sku,
      name: fila.name,
      unit: fila.unit,
      requestedQty: fila.requestedQty,
      preparedQty: fila.preparedQty,
      registros: fila.registros.size,
      estados: ordenarEstados(estados),
    })
  })

  return resultado.sort(compararFilas)
}

/** Totales de la obra: registros, materiales distintos (por id) y líneas. */
export function totalesObra(
  lists: ObraRegistro[] | null | undefined,
): TotalesObra {
  const materiales = new Set<string>()
  let lineas = 0

  for (const list of lists ?? []) {
    for (const item of list?.items ?? []) {
      if (!item) continue
      const materialId = item.materialId ?? item.material?.id
      if (materialId) materiales.add(materialId)
      lineas += 1
    }
  }

  return {
    registros: (lists ?? []).length,
    materiales: materiales.size,
    lineas,
  }
}

/** Fecha ISO (con o sin hora) a `dd/mm/aaaa`; vacío si falta o no es válida. */
export function formatFecha(iso: string | null | undefined): string {
  if (!iso) return ''

  // Se corta la parte de fecha del ISO en vez de usar `new Date()`, que
  // desplazaría el día según la zona horaria del navegador (RNF-4).
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim())
  if (!coincidencia) return ''

  const [, anio, mes, dia] = coincidencia
  const numeroMes = Number(mes)
  const numeroDia = Number(dia)
  if (numeroMes < 1 || numeroMes > 12 || numeroDia < 1 || numeroDia > 31) {
    return ''
  }

  return `${dia}/${mes}/${anio}`
}
