'use client'

import { useState } from 'react'
import {
  USER_ROLES,
  USER_ROLE_LABELS,
  type UserRole,
} from '@erp/shared'
import { AppShell } from '@/components/AppShell'
import { EmptyState, ErrorState } from '@/components/ui'
import { apiFetch } from '@/lib/api'
import { useApi } from '@/lib/useApi'
import { useAuth } from '@/lib/auth'

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  active: boolean
  createdAt: string
}

export default function UsuariosPage() {
  const { user: me } = useAuth()
  const { data, loading, reload, error: loadError } = useApi<User[]>('/users')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)

  const deactivate = async (u: User) => {
    if (!window.confirm(`¿Desactivar a ${u.name}? No podrá iniciar sesión.`))
      return
    setError(null)
    try {
      await apiFetch(`/users/${u.id}`, { method: 'DELETE' })
      void reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const reactivate = async (u: User) => {
    setError(null)
    try {
      await apiFetch(`/users/${u.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: true }),
      })
      void reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <button
          className="btn-primary"
          onClick={() => {
            setEditing(null)
            setShowForm((v) => !v)
          }}
        >
          {showForm ? 'Cancelar' : '+ Nuevo usuario'}
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {showForm && !editing && (
        <UserForm
          onSaved={() => {
            setShowForm(false)
            void reload()
          }}
        />
      )}

      {editing && (
        <UserForm
          user={editing}
          onSaved={() => {
            setEditing(null)
            void reload()
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      {loadError ? (
        <ErrorState>{loadError}</ErrorState>
      ) : loading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : !data || data.length === 0 ? (
        <EmptyState>No hay usuarios.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Rol</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium">
                    {u.name}
                    {me?.id === u.id && (
                      <span className="ml-2 text-xs text-slate-400">(tú)</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-500">{u.email}</td>
                  <td className="px-4 py-2">
                    {USER_ROLE_LABELS[u.role] ?? u.role}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`badge ${
                        u.active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {u.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      className="text-brand-dark hover:underline"
                      onClick={() => {
                        setShowForm(false)
                        setEditing(u)
                      }}
                    >
                      Editar
                    </button>
                    {u.active ? (
                      me?.id !== u.id && (
                        <button
                          className="ml-3 text-red-600 hover:underline"
                          onClick={() => void deactivate(u)}
                        >
                          Desactivar
                        </button>
                      )
                    ) : (
                      <button
                        className="ml-3 text-emerald-700 hover:underline"
                        onClick={() => void reactivate(u)}
                      >
                        Reactivar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  )
}

function UserForm({
  user,
  onSaved,
  onCancel,
}: {
  user?: User
  onSaved: () => void
  onCancel?: () => void
}) {
  const isEdit = Boolean(user)
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    role: user?.role ?? ('TECNICO' as UserRole),
    password: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (isEdit && user) {
        const body: Record<string, unknown> = {
          name: form.name,
          role: form.role,
        }
        if (form.password) body.password = form.password
        await apiFetch(`/users/${user.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        })
      } else {
        await apiFetch('/users', {
          method: 'POST',
          body: JSON.stringify(form),
        })
      }
      onSaved()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="card mb-4 grid gap-3 sm:grid-cols-2">
      <div>
        <label className="label">Nombre *</label>
        <input
          className="input"
          required
          minLength={2}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>
      <div>
        <label className="label">Rol *</label>
        <select
          className="input"
          value={form.role}
          onChange={(e) =>
            setForm({ ...form, role: e.target.value as UserRole })
          }
        >
          {USER_ROLES.map((r) => (
            <option key={r} value={r}>
              {USER_ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="label">Email *</label>
        <input
          className="input"
          type="email"
          required
          disabled={isEdit}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="label">
          {isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña *'}
        </label>
        <input
          className="input"
          type="password"
          required={!isEdit}
          minLength={6}
          placeholder={isEdit ? 'Déjalo en blanco para no cambiarla' : ''}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
      </div>
      {error && (
        <p className="sm:col-span-2 text-sm text-red-600">{error}</p>
      )}
      <div className="flex gap-2 sm:col-span-2">
        <button className="btn-primary" disabled={saving}>
          {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
        </button>
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
