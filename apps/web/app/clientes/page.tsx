'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { EmptyState, ErrorState } from '@/components/ui'
import { apiFetch } from '@/lib/api'
import { useApi } from '@/lib/useApi'

interface Client {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  _count?: { projects: number }
}

export default function ClientesPage() {
  const { data, loading, reload, error } = useApi<Client[]>('/clients')
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const { data: filtered } = useApi<Client[]>(
    search ? `/clients?search=${encodeURIComponent(search)}` : '/clients',
    [search],
  )
  const clients = search ? filtered : data

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancelar' : '+ Nuevo cliente'}
        </button>
      </div>

      {showForm && (
        <NewClientForm
          onCreated={() => {
            setShowForm(false)
            void reload()
          }}
        />
      )}

      <input
        className="input mb-4 max-w-sm"
        placeholder="Buscar por nombre, teléfono o email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {error ? (
        <ErrorState>{error}</ErrorState>
      ) : loading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : !clients || clients.length === 0 ? (
        <EmptyState>No hay clientes todavía.</EmptyState>
      ) : (
        <>
          {/* Escritorio: tabla (el scroll horizontal solo afecta a pantallas grandes). */}
          <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2">Cliente</th>
                  <th className="px-4 py-2">Contacto</th>
                  <th className="px-4 py-2">Obras</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-medium">{c.name}</td>
                    <td className="px-4 py-2 text-slate-500">
                      {c.phone ?? '—'} · {c.email ?? '—'}
                    </td>
                    <td className="px-4 py-2">{c._count?.projects ?? 0}</td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        href={`/clientes/${c.id}`}
                        className="text-brand-dark hover:underline"
                      >
                        Abrir carpeta →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Móvil: la tarjeta entera abre la carpeta del cliente. */}
          <ul className="grid gap-2 md:hidden">
            {clients.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/clientes/${c.id}`}
                  className="card flex items-center justify-between gap-3 active:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {c.phone ?? '—'} · {c.email ?? '—'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="badge bg-slate-100 text-slate-600">
                      {c._count?.projects ?? 0} obra(s)
                    </span>
                    <span aria-hidden className="text-slate-400">
                      ›
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </AppShell>
  )
}

function NewClientForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
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
      await apiFetch('/clients', {
        method: 'POST',
        body: JSON.stringify(form),
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
        <label className="label">Nombre *</label>
        <input
          className="input"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>
      <div>
        <label className="label">Email</label>
        <input
          className="input"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>
      <div>
        <label className="label">Teléfono</label>
        <input
          className="input"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Dirección</label>
        <input
          className="input"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Notas</label>
        <textarea
          className="input"
          rows={2}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>
      {error && (
        <p className="sm:col-span-2 text-sm text-red-600">{error}</p>
      )}
      <div className="sm:col-span-2">
        <button className="btn-primary" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar cliente'}
        </button>
      </div>
    </form>
  )
}
