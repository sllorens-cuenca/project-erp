'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/ui'
import { apiFetch } from '@/lib/api'
import { useApi } from '@/lib/useApi'

interface ReminderConfig {
  id: string
  enabled: boolean
  hour: number
  minute: number
}

interface ReminderLog {
  id: string
  sentAt: string
  pendingCount: number
  details?: string | null
}

export default function RecordatoriosPage() {
  const { data: config, reload } = useApi<ReminderConfig>('/reminders/config')
  const { data: history, reload: reloadHistory } =
    useApi<ReminderLog[]>('/reminders/history')

  const [form, setForm] = useState({ enabled: true, hour: 8, minute: 0 })
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (config) {
      setForm({
        enabled: config.enabled,
        hour: config.hour,
        minute: config.minute,
      })
    }
  }, [config])

  const save = async () => {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await apiFetch('/reminders/config', {
        method: 'PATCH',
        body: JSON.stringify(form),
      })
      setMessage('Configuración guardada.')
      void reload()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const runNow = async () => {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const res = await apiFetch<ReminderLog>('/reminders/run', {
        method: 'POST',
      })
      setMessage(`Recordatorio enviado (${res.pendingCount} pendientes).`)
      void reloadHistory()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold">Recordatorio diario</h1>

      {(message || error) && (
        <div
          className={`mb-4 rounded-lg p-3 text-sm ${
            error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {error ?? message}
        </div>
      )}

      <div className="card mb-8 max-w-lg">
        <p className="mb-4 text-sm text-slate-500">
          Cada día, a la hora indicada, se envía un correo con los listados
          pendientes de verificar y confirmar (copia interna del almacén).
        </p>

        <label className="mb-4 flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            className="h-4 w-4"
          />
          <span className="text-sm font-medium">Recordatorio activado</span>
        </label>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="label">Hora</label>
            <input
              className="input"
              type="number"
              min={0}
              max={23}
              value={form.hour}
              onChange={(e) =>
                setForm({ ...form, hour: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="label">Minuto</label>
            <input
              className="input"
              type="number"
              min={0}
              max={59}
              value={form.minute}
              onChange={(e) =>
                setForm({ ...form, minute: Number(e.target.value) })
              }
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button className="btn-primary" disabled={busy} onClick={save}>
            Guardar
          </button>
          <button className="btn-secondary" disabled={busy} onClick={runNow}>
            Enviar ahora (probar)
          </button>
        </div>
      </div>

      <h2 className="mb-3 font-medium text-slate-700">Historial de envíos</h2>
      {!history || history.length === 0 ? (
        <EmptyState>Todavía no se ha enviado ningún recordatorio.</EmptyState>
      ) : (
        <ul className="space-y-2">
          {history.map((h) => (
            <li key={h.id} className="card flex items-center justify-between text-sm">
              <span>{new Date(h.sentAt).toLocaleString('es-ES')}</span>
              <span className="text-slate-500">
                {h.pendingCount} pendientes
                {h.details ? ` · ${h.details}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  )
}
