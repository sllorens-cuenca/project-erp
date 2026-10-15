'use client'

import { Suspense, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { Combobox, type ComboOption } from '@/components/Combobox'
import { EmptyState, ErrorState, ServiceBadge, StatusBadge } from '@/components/ui'
import { apiFetch } from '@/lib/api'
import { useApi } from '@/lib/useApi'

interface ListRow {
  id: string
  status: string
  createdAt: string
  projectId: string
  project: { name: string; serviceType: string; client: { name: string } }
  _count?: { items: number }
}

interface ProjectOption {
  id: string
  name: string
  serviceType: string
  client: { id: string; name: string }
}

export default function HistorialPage() {
  return (
    <AppShell>
      <Suspense fallback={<p className="text-sm text-slate-500">Cargando…</p>}>
        <Historial />
      </Suspense>
    </AppShell>
  )
}

function Historial() {
  const params = useSearchParams()
  const obra = params.get('obra') ?? ''
  const [status, setStatus] = useState('')
  const [showForm, setShowForm] = useState(false)

  const query = new URLSearchParams()
  if (obra) query.set('projectId', obra)
  if (status) query.set('status', status)
  const qs = query.toString()

  const { data, loading, reload, error } = useApi<ListRow[]>(
    `/lists${qs ? `?${qs}` : ''}`,
    [obra, status],
  )

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Historial de materiales</h1>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancelar' : '+ Nuevo registro'}
        </button>
      </div>

      {showForm && (
        <NewListForm
          onCreated={() => {
            setShowForm(false)
            void reload()
          }}
        />
      )}

      <div className="mb-4 flex gap-3">
        <select
          className="input max-w-xs"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="BORRADOR">Borrador</option>
          <option value="EN_PREPARACION">En preparación</option>
          <option value="LISTO">Listo</option>
          <option value="CONFIRMADO">Confirmado</option>
          <option value="ENVIADO">Enviado</option>
        </select>
      </div>

      {error ? (
        <ErrorState>{error}</ErrorState>
      ) : loading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : !data || data.length === 0 ? (
        <EmptyState>No hay registros con estos filtros.</EmptyState>
      ) : (
        <>
          {/* Escritorio: tabla. */}
          <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2">Cliente / Obra</th>
                  <th className="px-4 py-2">Servicio</th>
                  <th className="px-4 py-2">Estado</th>
                  <th className="px-4 py-2 text-right">Líneas</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {data.map((l) => (
                  <tr key={l.id} className="border-t border-slate-100">
                    <td className="px-4 py-2">
                      <Link
                        href={`/historial/${l.id}`}
                        className="font-medium text-brand-dark hover:underline"
                      >
                        {l.project.client.name}
                      </Link>
                      <div className="text-xs text-slate-500">
                        {l.project.name}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <ServiceBadge service={l.project.serviceType} />
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      {l._count?.items ?? 0}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        href={`/historial/${l.id}`}
                        className="text-brand-dark hover:underline"
                      >
                        Abrir →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Móvil: la tarjeta entera abre el registro. */}
          <ul className="grid gap-2 md:hidden">
            {data.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/historial/${l.id}`}
                  className="card block active:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {l.project.client.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {l.project.name}
                      </p>
                    </div>
                    <span aria-hidden className="shrink-0 text-slate-400">
                      ›
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={l.status} />
                    <ServiceBadge service={l.project.serviceType} />
                    <span className="text-xs text-slate-500">
                      {l._count?.items ?? 0} líneas
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}

function NewListForm({ onCreated }: { onCreated: () => void }) {
  const { data: projects } = useApi<ProjectOption[]>('/projects')
  const [projectId, setProjectId] = useState('')
  const [projectQuery, setProjectQuery] = useState('')
  const [projectPicked, setProjectPicked] = useState<ComboOption | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /** /projects no admite `?search=`: filtramos en memoria sobre la lista. */
  const projectOptions = useMemo<ComboOption[]>(
    () =>
      (projects ?? []).map((p) => ({
        id: p.id,
        label: `${p.client.name} · ${p.name}`,
      })),
    [projects],
  )

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectId) {
      setError('Selecciona una obra o servicio.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await apiFetch('/lists', {
        method: 'POST',
        body: JSON.stringify({ projectId, notes: notes || undefined }),
      })
      onCreated()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="card mb-4 grid gap-3">
      <div>
        <label className="label">Obra / servicio *</label>
        <Combobox
          options={projectOptions}
          query={projectQuery}
          onQueryChange={setProjectQuery}
          value={projectPicked}
          onChange={(opt) => {
            setProjectPicked(opt)
            setProjectId(opt?.id ?? '')
          }}
          placeholder="Buscar obra o servicio…"
          emptyText="Ninguna obra coincide."
          ariaLabel="Obra o servicio"
        />
      </div>
      <div>
        <label className="label">Notas</label>
        <input
          className="input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <button className="btn-primary" disabled={saving || !projectId}>
          {saving ? 'Creando…' : 'Crear registro'}
        </button>
      </div>
    </form>
  )
}
