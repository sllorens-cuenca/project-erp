'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { EmptyState, ServiceBadge, StatusBadge } from '@/components/ui'
import { SERVICE_TYPES, SERVICE_TYPE_LABELS, ServiceType } from '@erp/shared'
import { apiFetch } from '@/lib/api'
import { useApi } from '@/lib/useApi'

interface Project {
  id: string
  name: string
  serviceType: string
  status: string
  address?: string | null
  _count: { lists: number }
}

interface ClientDetail {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  notes?: string | null
  projects: Project[]
}

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const { data, loading, reload } = useApi<ClientDetail>(
    id ? `/clients/${id}` : null,
  )
  const [showForm, setShowForm] = useState(false)

  return (
    <AppShell>
      <Link href="/clientes" className="text-sm text-slate-500 hover:underline">
        ← Clientes
      </Link>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Cargando…</p>
      ) : !data ? (
        <EmptyState>Cliente no encontrado.</EmptyState>
      ) : (
        <>
          <div className="mb-6 mt-2 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{data.name}</h1>
              <p className="text-sm text-slate-500">
                {data.phone ?? '—'} · {data.email ?? '—'}
              </p>
              {data.address && (
                <p className="text-sm text-slate-500">{data.address}</p>
              )}
              {data.notes && (
                <p className="mt-2 text-sm text-slate-600">{data.notes}</p>
              )}
            </div>
            <button
              className="btn-primary"
              onClick={() => setShowForm((v) => !v)}
            >
              {showForm ? 'Cancelar' : '+ Nueva obra/servicio'}
            </button>
          </div>

          {showForm && (
            <NewProjectForm
              clientId={data.id}
              onCreated={() => {
                setShowForm(false)
                void reload()
              }}
            />
          )}

          <h2 className="mb-3 font-medium text-slate-700">
            Carpetas de obra / servicio ({data.projects.length})
          </h2>
          {data.projects.length === 0 ? (
            <EmptyState>
              Este cliente aún no tiene obras. Crea una carpeta para empezar a
              registrar materiales.
            </EmptyState>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {data.projects.map((p) => (
                <div key={p.id} className="card flex flex-col justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <ServiceBadge service={p.serviceType} />
                      <StatusBadge status={p.status} />
                    </div>
                    <h3 className="font-medium">{p.name}</h3>
                    {p.address && (
                      <p className="text-xs text-slate-500">{p.address}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">
                      {p._count.lists} listado(s) de materiales
                    </p>
                  </div>
                  <Link
                    href={`/listados?obra=${p.id}`}
                    className="mt-3 text-sm text-brand-dark hover:underline"
                  >
                    Ver listados →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </AppShell>
  )
}

function NewProjectForm({
  clientId,
  onCreated,
}: {
  clientId: string
  onCreated: () => void
}) {
  const [form, setForm] = useState({
    name: '',
    serviceType: 'INSTALACION' as ServiceType,
    address: '',
    notes: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await apiFetch('/projects', {
        method: 'POST',
        body: JSON.stringify({ ...form, clientId }),
      })
      onCreated()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="card mb-4 grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label">Nombre de la obra *</label>
        <input
          className="input"
          required
          placeholder="Ej.: Obra Residencial Los Naranjos"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>
      <div>
        <label className="label">Tipo de servicio</label>
        <select
          className="input"
          value={form.serviceType}
          onChange={(e) =>
            setForm({ ...form, serviceType: e.target.value as ServiceType })
          }
        >
          {SERVICE_TYPES.map((s) => (
            <option key={s} value={s}>
              {SERVICE_TYPE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Dirección</label>
        <input
          className="input"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
      </div>
      {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
      <div className="sm:col-span-2">
        <button className="btn-primary" disabled={saving}>
          {saving ? 'Guardando…' : 'Crear obra'}
        </button>
      </div>
    </form>
  )
}
