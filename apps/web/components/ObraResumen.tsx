'use client'

import { useMemo } from 'react'
import { StatusBadge } from '@/components/ui'
import { buildConsolidado, totalesObra, type ObraRegistro } from '@/lib/obra'

/** Texto plural sencillo para los totales («1 registro», «3 registros»). */
function plural(cantidad: number, singular: string, plural: string): string {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`
}

/**
 * Resumen consolidado de la obra (RF-9…RF-17).
 *
 * Recibe los registros ya cargados por la página (sin fetch propio) y delega
 * toda la agregación en las funciones puras de `lib/obra.ts`. La tabla es la
 * vista de escritorio; las tarjetas de móvil llegan en T9.
 */
export function ObraResumen({ lists }: { lists: ObraRegistro[] }) {
  const filas = useMemo(() => buildConsolidado(lists), [lists])
  const totales = useMemo(() => totalesObra(lists), [lists])
  const registrosList = Array.isArray(lists) ? lists : []

  // Obra con registros pero sin líneas: mostrar «sin materiales» en el resumen.
  if (filas.length === 0 && registrosList.length > 0) {
    return (
      <section className="mb-8" aria-labelledby="obra-resumen-titulo">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="obra-resumen-titulo" className="text-lg font-semibold">
            Materiales necesitados
          </h2>
          {/* RF-17/RF-34: los totales siguen visibles. */}
          <p className="text-sm text-slate-500">
            {plural(totales.registros, 'registro', 'registros')} ·{' '}
            {plural(totales.materiales, 'material', 'materiales')} ·{' '}
            {plural(totales.lineas, 'línea', 'líneas')}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
          sin materiales
        </div>
      </section>
    )
  }

  // Sin materiales no se pinta una tabla vacía (el estado vacío es T8).
  if (filas.length === 0) return null

  return (
    <section className="mb-8" aria-labelledby="obra-resumen-titulo">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="obra-resumen-titulo" className="text-lg font-semibold">
          Materiales necesitados{' '}
          <span className="text-sm font-normal text-slate-500">
            {plural(filas.length, 'fila', 'filas')}
          </span>
        </h2>
        {/* RF-17: totales de la obra junto al resumen. */}
        <p className="text-sm text-slate-500">
          {plural(totales.registros, 'registro', 'registros')} ·{' '}
          {plural(totales.materiales, 'material', 'materiales')} ·{' '}
          {plural(totales.lineas, 'línea', 'líneas')}
        </p>
      </div>

      {/* Escritorio: tabla. */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-2">
                Material
              </th>
              <th scope="col" className="px-4 py-2">
                Ud.
              </th>
              <th scope="col" className="px-4 py-2 text-right">
                Pedido
              </th>
              <th scope="col" className="px-4 py-2 text-right">
                Preparado
              </th>
              <th scope="col" className="px-4 py-2">
                Estados
              </th>
              <th scope="col" className="px-4 py-2 text-right">
                Registros
              </th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={fila.key} className="border-t border-slate-100">
                <td className="px-4 py-2 align-top">
                  <p className="break-words font-medium">{fila.name || '—'}</p>
                  {fila.sku && (
                    <p className="break-words font-mono text-xs text-slate-500">
                      {fila.sku}
                    </p>
                  )}
                </td>
                <td className="px-4 py-2 align-top whitespace-nowrap">
                  {fila.unit || '—'}
                </td>
                <td className="px-4 py-2 text-right align-top whitespace-nowrap tabular-nums">
                  {fila.requestedQty}
                </td>
                <td className="px-4 py-2 text-right align-top whitespace-nowrap tabular-nums">
                  {fila.preparedQty}
                </td>
                {/* RF-12/13/15: todos los estados presentes con su recuento,
                    en orden de flujo, sin ceros y sin truncar (la celda crece). */}
                <td className="px-4 py-2 align-top">
                  <ul className="flex flex-wrap items-center gap-x-1 gap-y-1">
                    {fila.estados.map((estado, indice) => (
                      <li
                        key={estado.status}
                        className="flex items-center gap-1 whitespace-nowrap"
                      >
                        {indice > 0 && (
                          <span aria-hidden className="text-slate-400">
                            ·
                          </span>
                        )}
                        <StatusBadge status={estado.status} />
                        <span className="text-xs tabular-nums text-slate-600">
                          {estado.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="px-4 py-2 text-right align-top whitespace-nowrap tabular-nums">
                  {fila.registros}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Móvil: tarjetas (RF-35, RF-37, RF-38). */}
      <div className="space-y-3 md:hidden">
        {filas.map((fila) => (
          <article
            key={fila.key}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="mb-2">
              <p className="break-words font-medium">{fila.name || '—'}</p>
              {fila.sku && (
                <p className="break-words font-mono text-xs text-slate-500">
                  {fila.sku}
                </p>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-slate-500">Unidad</dt>
                <dd className="break-words">{fila.unit || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Registros</dt>
                <dd className="tabular-nums">{fila.registros}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Pedido</dt>
                <dd className="tabular-nums">{fila.requestedQty}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Preparado</dt>
                <dd className="tabular-nums">{fila.preparedQty}</dd>
              </div>
            </dl>
            <div className="mt-3">
              <p className="mb-1 text-sm text-slate-500">Estados</p>
              <ul className="flex flex-wrap items-center gap-x-1 gap-y-1">
                {fila.estados.map((estado, indice) => (
                  <li
                    key={estado.status}
                    className="flex items-center gap-1 whitespace-normal"
                  >
                    {indice > 0 && (
                      <span aria-hidden className="text-slate-400">
                        ·
                      </span>
                    )}
                    <StatusBadge status={estado.status} />
                    <span className="text-xs tabular-nums text-slate-600">
                      {estado.count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {plural(fila.registros, 'registro', 'registros')}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
