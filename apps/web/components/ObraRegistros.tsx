'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui'
import { formatFecha, type ObraLinea, type ObraRegistro } from '@/lib/obra'

/** Texto plural sencillo para las líneas («1 línea», «3 líneas»). */
function pluralLineas(cantidad: number): string {
  return `${cantidad} ${cantidad === 1 ? 'línea' : 'líneas'}`
}

/** Cantidad tal cual llega; un valor ausente se marca con guion (no se corrige). */
function cantidadTexto(valor: number | null | undefined): string {
  return typeof valor === 'number' && Number.isFinite(valor) ? String(valor) : '—'
}

/** Unidad de la línea (la que acompaña a la cantidad); si falta, la del catálogo. */
function unidadTexto(linea: ObraLinea): string {
  return linea?.unit || linea?.material?.unit || '—'
}

/**
 * Detalle por registro de la obra (RF-18…RF-21).
 *
 * Recibe los registros ya cargados por la página (sin fetch propio). La API los
 * manda del más reciente al más antiguo; se ordena una copia de forma defensiva
 * para que el orden no dependa del contrato. La tabla es la vista de escritorio;
 * las tarjetas de móvil llegan en T9.
 */
export function ObraRegistros({
  lists,
  obraId,
}: {
  lists: ObraRegistro[]
  obraId: string
}) {
  const registros = useMemo(
    () =>
      [...(lists ?? [])].sort((a, b) =>
        (b?.createdAt ?? '').localeCompare(a?.createdAt ?? ''),
      ),
    [lists],
  )

  // Sin registros no se pinta una lista vacía (el estado vacío es T8).
  if (registros.length === 0) return null

  return (
    <section className="mb-8" aria-labelledby="obra-registros-titulo">
      <h2 id="obra-registros-titulo" className="mb-3 text-lg font-semibold">
        Registros de la obra
      </h2>

      <div className="space-y-4">
        {registros.map((registro) => {
          const items = Array.isArray(registro?.items)
            ? registro.items.filter(Boolean)
            : []
          // Si el payload viniera sin líneas, `_count` sigue dando el total.
          const numLineas =
            items.length > 0 ? items.length : (registro?._count?.items ?? 0)
          const fecha = formatFecha(registro?.createdAt)
          const href = `/historial/${registro.id}?obra=${obraId}`

          return (
            <article
              key={registro.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              {/* Cabecera: es el enlace al registro (RF-21). */}
              <Link
                href={href}
                className="block border-b border-slate-100 px-4 py-3 hover:bg-slate-50"
                aria-label={`Abrir registro del ${fecha || 'sin fecha'} con estado ${registro.status}, ${pluralLineas(numLineas)}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{fecha || 'Sin fecha'}</span>
                    <StatusBadge status={registro.status} />
                    <span className="text-sm text-slate-500">
                      {pluralLineas(numLineas)}
                    </span>
                  </div>
                  <span className="text-sm text-brand-dark">
                    Abrir registro
                  </span>
                </div>
              </Link>

              {items.length === 0 ? (
                // RF-20: el registro vacío se ve igualmente, con su aviso.
                <>
                  <p className="px-4 py-3 text-sm text-slate-500">
                    Sin materiales todavía.
                  </p>
                  {/* Móvil: tarjeta completa pulsable también cuando no hay líneas */}
                  <Link
                    href={href}
                    className="block px-4 py-2 text-sm text-brand-dark hover:bg-slate-50 md:hidden"
                    aria-label="Abrir registro sin materiales"
                  >
                    Ver registro
                  </Link>
                </>
              ) : (
                <>
                  {/* Escritorio: tabla de líneas. */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-left text-slate-500">
                        <tr>
                          <th scope="col" className="px-4 py-2">
                            Material
                          </th>
                          <th scope="col" className="px-4 py-2 text-right">
                            Pedido
                          </th>
                          <th scope="col" className="px-4 py-2 text-right">
                            Preparado
                          </th>
                          <th scope="col" className="px-4 py-2">
                            Ud.
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((linea, indice) => (
                          <tr
                            key={linea?.id ?? `${registro.id}-linea-${indice}`}
                            className="border-t border-slate-100"
                          >
                            <td className="px-4 py-2 align-top">
                              <p className="break-words font-medium">
                                {linea?.material?.name || '—'}
                              </p>
                              {linea?.material?.sku && (
                                <p className="break-words font-mono text-xs text-slate-500">
                                  {linea.material.sku}
                                </p>
                              )}
                              {/* RF-19: notas de la línea, sin romper la tabla. */}
                              {linea?.notes && (
                                <p className="mt-1 whitespace-pre-line break-words text-xs text-slate-500">
                                  Nota: {linea.notes}
                                </p>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 text-right align-top tabular-nums">
                              {cantidadTexto(linea?.requestedQty)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 text-right align-top tabular-nums">
                              {cantidadTexto(linea?.preparedQty)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 align-top">
                              {unidadTexto(linea)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Móvil: tarjetas de líneas, tarjeta completa pulsable (RF-35). */}
                  <div className="md:hidden">
                    <Link
                      href={href}
                      className="block divide-y divide-slate-100 hover:bg-slate-50"
                      aria-label={`Abrir registro del ${fecha || 'sin fecha'} con ${pluralLineas(numLineas)}`}
                    >
                      {items.map((linea, indice) => (
                        <div
                          key={linea?.id ?? `${registro.id}-linea-m-${indice}`}
                          className="px-4 py-3"
                        >
                          <p className="break-words font-medium">
                            {linea?.material?.name || '—'}
                          </p>
                          {linea?.material?.sku && (
                            <p className="break-words font-mono text-xs text-slate-500">
                              {linea.material.sku}
                            </p>
                          )}
                          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                            <div>
                              <dt className="text-slate-500">Pedido</dt>
                              <dd className="tabular-nums">
                                {cantidadTexto(linea?.requestedQty)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-slate-500">Preparado</dt>
                              <dd className="tabular-nums">
                                {cantidadTexto(linea?.preparedQty)}
                              </dd>
                            </div>
                            <div className="col-span-2">
                              <dt className="text-slate-500">Unidad</dt>
                              <dd className="break-words">{unidadTexto(linea)}</dd>
                            </div>
                          </dl>
                          {linea?.notes && (
                            <p className="mt-2 whitespace-pre-line break-words text-xs text-slate-500">
                              Nota: {linea.notes}
                            </p>
                          )}
                        </div>
                      ))}
                      <div className="px-4 py-2 text-sm text-brand-dark">
                        Ver registro completo
                      </div>
                    </Link>
                  </div>
                </>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
