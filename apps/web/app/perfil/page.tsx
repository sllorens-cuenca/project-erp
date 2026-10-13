'use client'

import { useState } from 'react'
import type { LoginResponse } from '@erp/shared'
import { USER_ROLE_LABELS, type UserRole } from '@erp/shared'
import { AppShell } from '@/components/AppShell'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/lib/auth'

export default function PerfilPage() {
  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold">Mi perfil</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileForm />
        <PasswordForm />
      </div>
    </AppShell>
  )
}

function ProfileForm() {
  const { user, applySession } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setOk(false)
    try {
      const res = await apiFetch<LoginResponse>('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      })
      applySession(res.accessToken, res.user)
      setOk(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <h2 className="font-semibold text-slate-700">Datos</h2>
      <div>
        <label className="label">Nombre</label>
        <input
          className="input"
          required
          minLength={2}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Email</label>
        <input className="input" value={user?.email ?? ''} disabled />
      </div>
      <div>
        <label className="label">Rol</label>
        <input
          className="input"
          value={
            user ? USER_ROLE_LABELS[user.role as UserRole] ?? user.role : ''
          }
          disabled
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {ok && <p className="text-sm text-emerald-700">Datos guardados.</p>}
      <button className="btn-primary" disabled={saving}>
        {saving ? 'Guardando…' : 'Guardar datos'}
      </button>
    </form>
  )
}

function PasswordForm() {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
  })
  const [repeat, setRepeat] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setOk(false)
    if (form.newPassword !== repeat) {
      setError('Las contraseñas nuevas no coinciden')
      return
    }
    setSaving(true)
    try {
      await apiFetch('/auth/me/password', {
        method: 'PATCH',
        body: JSON.stringify(form),
      })
      setForm({ currentPassword: '', newPassword: '' })
      setRepeat('')
      setOk(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <h2 className="font-semibold text-slate-700">Contraseña</h2>
      <div>
        <label className="label">Contraseña actual</label>
        <input
          className="input"
          type="password"
          required
          value={form.currentPassword}
          onChange={(e) =>
            setForm({ ...form, currentPassword: e.target.value })
          }
        />
      </div>
      <div>
        <label className="label">Nueva contraseña</label>
        <input
          className="input"
          type="password"
          required
          minLength={6}
          value={form.newPassword}
          onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
        />
      </div>
      <div>
        <label className="label">Repite la nueva contraseña</label>
        <input
          className="input"
          type="password"
          required
          minLength={6}
          value={repeat}
          onChange={(e) => setRepeat(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {ok && (
        <p className="text-sm text-emerald-700">Contraseña actualizada.</p>
      )}
      <button className="btn-primary" disabled={saving}>
        {saving ? 'Guardando…' : 'Cambiar contraseña'}
      </button>
    </form>
  )
}
