'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

interface NuevoRegistroObraFormProps {
  obraId: string
  obraNombre: string
  onCancel?: () => void
}

interface NewListResponse {
  id: string
}

export function NuevoRegistroObraForm({
  obraId,
  obraNombre,
  onCancel,
}: NuevoRegistroObraFormProps) {
  const router = useRouter()
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return

    setSaving(true)
    setError(null)

    try {
      const res = await apiFetch<NewListResponse>('/lists', {
        method: 'POST',
        body: JSON.stringify({
          projectId: obraId,
          notes: notes.trim() ? notes.trim() : undefined,
        }),
      })
      router.push(`/historial/${res.id}?obra=${obraId}`)
    } catch (err) {
      // No mostrar stack/JSON, usar mensaje del apiFetch o genérico
      const msg = (err as Error).message
      setError(msg && msg.trim() ? msg : 'No se pudo crear el registro.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="card mt-4 space-y-3">
      <div>
        <label className="label">Obra</label>
        <div className="input bg-slate-50 text-slate-700">{obraNombre}</div>
      </div>

      <div>
        <label className="label" htmlFor="notas-registro">
          Notas (opcional)
        </label>
        <textarea
          id="notas-registro"
          className="input"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={saving}
          placeholder="Notas para este registro..."
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">No se pudo crear el registro.</p>
      )}

      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? 'Creando…' : 'Crear registro'}
        </button>
        {onCancel && (
          <button
            className="btn-secondary"
            type="button"
            onClick={onCancel}
            disabled={saving}
          >
            Cancelar
          </button>
        )}
        {error && (
          <button
            className="btn-secondary"
            type="button"
            onClick={() => void submit(new Event('submit') as unknown as React.FormEvent)}
            disabled={saving}
          >
            Reintentar
          </button>
        )}
      </div>
    </form>
  )
}
