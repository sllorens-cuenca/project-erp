'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { apiFetch } from '@/lib/api'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('admin@almacen.local')
  const [password, setPassword] = useState('admin1234')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [configured, setConfigured] = useState<boolean | null>(null)

  useEffect(() => {
    apiFetch<{ configured: boolean }>('/auth/setup/status')
      .then((r) => setConfigured(r.configured))
      .catch(() => setConfigured(true))
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      router.push('/')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold text-brand-dark">📦 Almacén</h1>
        <p className="mb-5 text-sm text-slate-500">
          Gestión de materiales por cliente y obra
        </p>

        {configured === false && (
          <p className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
            Primer arranque: aún no hay usuarios. Ejecuta el seed
            (<code>npm run db:seed</code>) o crea el administrador inicial.
          </p>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600">
              {error}
            </p>
          )}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-400">
          Demo: admin@almacen.local / admin1234
        </p>
      </div>
    </div>
  )
}
