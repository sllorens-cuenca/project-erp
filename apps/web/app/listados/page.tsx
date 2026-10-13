'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { EmptyState, ErrorState, ServiceBadge, StatusBadge } from '@/components/ui'
import { apiFetch } from '@/lib/api'
import { useApi } from '@/lib/useApi'

interface ListRow {
  id: string
  status: string
  createdAt: string
  projectId: string
  project: { name: string; serviceType: string; client: { name: string } }
  _count: { items: number }
}

interface ProjectOption {
  id: string
  name: string
  serviceType: string
  client: { id: string; name: string }
}

export default function ListadosPage() {
  return (
    <AppShell>
      <Suspense fallback={<p className="text-sm text-slate-500">Cargando…</p>}>
        <Listados />
      </Suspense>
    </AppShell>
  )
}

function Listados() {
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
        <h1 className="text-2xl font-semibold">Listados de materiales</h1>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancelar' : '+ Nuevo listado'}
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
        <EmptyState>No hay listados con estos filtros.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
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
                      href={`/listados/${l.id}`}
                      className="font-medium text-brand-dark hover:underline"
                    >
                      {l.project.client.name}
                    </Link>
                    <div className="text-xs text-slate-500">{l.project.name}</div>
                  </td>
                  <td className="px-4 py-2">
                    <ServiceBadge service={l.project.serviceType} />
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={l.status} />
                  </td>
                  <td className="px-4 py-2 text-right">{l._count.items}</td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/listados/${l.id}`}
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
      )}
    </>
  )
}

function NewListForm({ onCreated }: { onCreated: () => void }) {
  const { data: projects } = useApi<ProjectOption[]>('/projects')
  const [projectId, setProjectId] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
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
        <select
          className="input"
          required
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        >
          <option value="">Selecciona una obra…</option>
          {projects?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.client.name} · {p.name}
            </option>
          ))}
        </select>
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
          {saving ? 'Creando…' : 'Crear listado'}
        </button>
      </div>
    </form>
  )
}
