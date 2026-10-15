'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { StockMovementType } from '@erp/shared'
import { AppShell } from '@/components/AppShell'
import { EmptyState, ErrorState } from '@/components/ui'
import { useApi } from '@/lib/useApi'

interface StockMovement {
  id: string
  type: StockMovementType
  quantity: number
  notes?: string | null
  createdAt: string
  material: { id: string; sku: string; name: string; unit: string }
  project?: { id: string; name: string } | null
  user?: { id: string; name: string } | null
}

interface Option {
  id: string
  name: string
}

const TYPE_STYLES: Record<string, string> = {
  ENTRADA: 'bg-emerald-100 text-emerald-700',
  SALIDA: 'bg-red-100 text-red-700',
  AJUSTE: 'bg-amber-100 text-amber-700',
}

export default function MovimientosPage() {
  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold">Movimientos de stock</h1>
      <Suspense
        fallback={<p className="text-sm text-slate-500">Cargando…</p>}
      >
        <MovementsTable />
      </Suspense>
    </AppShell>
  )
}

function MovementsTable() {
  const params = useSearchParams()
  const [materialId, setMaterialId] = useState(params.get('materialId') ?? '')
  const [projectId, setProjectId] = useState(params.get('projectId') ?? '')

  const { data: materials } = useApi<Option[]>('/materials')
  const { data: projects } = useApi<Option[]>('/projects')

  const query = new URLSearchParams()
  if (materialId) query.set('materialId', materialId)
  if (projectId) query.set('projectId', projectId)
  const qs = query.toString()

  const { data, loading, error } = useApi<StockMovement[]>(
    qs ? `/stock-movements?${qs}` : '/stock-movements',
    [qs],
  )

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Material</label>
          <select
            className="input max-w-xs"
            value={materialId}
            onChange={(e) => setMaterialId(e.target.value)}
          >
            <option value="">Todos</option>
            {materials?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Obra</label>
          <select
            className="input max-w-xs"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">Todas</option>
            {projects?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        {(materialId || projectId) && (
          <button
            className="btn-secondary"
            onClick={() => {
              setMaterialId('')
              setProjectId('')
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {error ? (
        <ErrorState>{error}</ErrorState>
      ) : loading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : !data || data.length === 0 ? (
        <EmptyState>No hay movimientos con estos filtros.</EmptyState>
      ) : (
        <>
          {/* Escritorio: tabla. */}
          <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2">Fecha</th>
                  <th className="px-4 py-2">Material</th>
                  <th className="px-4 py-2">Tipo</th>
                  <th className="px-4 py-2 text-right">Cantidad</th>
                  <th className="px-4 py-2">Obra</th>
                  <th className="px-4 py-2">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {data.map((m) => (
                  <tr key={m.id} className="border-t border-slate-100">
                    <td className="whitespace-nowrap px-4 py-2 text-slate-500">
                      {new Date(m.createdAt).toLocaleString('es-ES')}
                    </td>
                    <td className="px-4 py-2">
                      <span className="font-mono text-xs text-slate-400">
                        {m.material.sku}
                      </span>{' '}
                      {m.material.name}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`badge ${
                          TYPE_STYLES[m.type] ?? 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {m.type}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      {m.quantity} {m.material.unit}
                    </td>
                    <td className="px-4 py-2 text-slate-500">
                      {m.project?.name ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-slate-500">
                      {m.user?.name ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Móvil: tarjeta informativa por movimiento. */}
          <ul className="grid gap-2 md:hidden">
            {data.map((m) => (
              <li key={m.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{m.material.name}</p>
                    <p className="truncate font-mono text-xs text-slate-400">
                      {m.material.sku}
                    </p>
                  </div>
                  <span
                    className={`badge shrink-0 ${
                      TYPE_STYLES[m.type] ?? 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {m.type}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    {new Date(m.createdAt).toLocaleString('es-ES')}
                  </span>
                  <span className="text-sm font-medium">
                    {m.quantity} {m.material.unit}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {m.project?.name ?? '—'} · {m.user?.name ?? '—'}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
