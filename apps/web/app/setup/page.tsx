'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import type { LoginResponse } from '@erp/shared'

/**
 * Primer arranque: crea el usuario administrador inicial.
 * Solo está disponible mientras no exista ningún usuario en el sistema.
 */
export default function SetupPage() {
  const { applySession } = useAuth()
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiFetch<{ configured: boolean }>('/auth/setup/status')
      .then((r) => {
        if (r.configured) router.replace('/login')
        else setChecking(false)
      })
      .catch(() => setChecking(false))
  }, [router])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (form.password !== repeat) {
      setError('Las contraseñas no coinciden')
      return
    }
    setSaving(true)
    try {
      const res = await apiFetch<LoginResponse>('/auth/setup', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      applySession(res.accessToken, res.user)
      router.push('/')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-slate-500">Comprobando…</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold text-brand-dark">
          📦 Almacén
        </h1>
        <p className="mb-5 text-sm text-slate-500">
          Crea la cuenta de administrador para empezar.
        </p>

        <form onSubmit={submit} className="space-y-4">
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
            <label className="label">Email *</label>
            <input
              className="input"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Contraseña *</label>
            <input
              className="input"
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Repite la contraseña *</label>
            <input
              className="input"
              type="password"
              required
              minLength={6}
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600">
              {error}
            </p>
          )}
          <button className="btn-primary w-full" disabled={saving}>
            {saving ? 'Creando…' : 'Crear administrador'}
          </button>
        </form>
      </div>
    </div>
  )
}
