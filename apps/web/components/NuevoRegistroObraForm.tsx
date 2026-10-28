'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MATERIAL_UNITS } from '@erp/shared'
import { apiFetch } from '@/lib/api'
import { useApi } from '@/lib/useApi'
import { Combobox, type ComboOption } from '@/components/Combobox'
import { VoiceDictation } from '@/components/VoiceDictation'
import { parseForForm } from '@/lib/voice/parse'
import { useAuth } from '@/lib/auth'
import { puedeCrearRegistros } from '@/lib/permissions'

interface NuevoRegistroObraFormProps {
  obraId: string
  obraNombre: string
  onCancel?: () => void
}

interface NewListResponse {
  id: string
}

interface Material {
  id: string
  sku: string
  name: string
  category?: string | null
  unit: string
  stock: number
  active: boolean
}

export function NuevoRegistroObraForm({
  obraId,
  obraNombre,
  onCancel,
}: NuevoRegistroObraFormProps) {
  const router = useRouter()
  const { data: materials } = useApi<Material[]>('/materials?onlyActive=true')
  const { user } = useAuth()

  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<ComboOption | null>(null)
  const [qty, setQty] = useState(1)
  const [unit, setUnit] = useState<string>('UD')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dictationMsg, setDictationMsg] = useState<string | null>(null)
  const canDictate = puedeCrearRegistros(user?.role)

  const options = useMemo<ComboOption[]>(
    () =>
      (materials ?? []).map((m) => ({
        id: m.id,
        label: m.name,
        hint: [m.sku, m.category, `${m.stock} ${m.unit}`]
          .filter(Boolean)
          .join(' · '),
      })),
    [materials],
  )

  const material = useMemo(
    () => (materials ?? []).find((m) => m.id === picked?.id) ?? null,
    [materials, picked],
  )

  const pick = (option: ComboOption | null) => {
    setPicked(option)
    setError(null)
    setDictationMsg(null)
    const m = (materials ?? []).find((x) => x.id === option?.id)
    if (m) setUnit(m.unit)
  }

  const handleDictation = (text: string, isFinal: boolean) => {
    if (saving) return
    if (!isFinal) return
    setError(null)
    setDictationMsg(null)
    const parsed = parseForForm(text)
    if (!parsed) {
      setDictationMsg('No se ha entendido el material, la cantidad o la unidad.')
      return
    }
    const match = (materials ?? []).find(
      (m) => m.name.toLowerCase() === parsed.materialName.toLowerCase(),
    )
    if (!match) {
      setDictationMsg(`No se ha encontrado un material exacto para «${parsed.materialName}». Puedes buscarlo en el listado.`)
      return
    }
    setPicked({ id: match.id, label: match.name, hint: [match.sku, match.category, `${match.stock} ${match.unit}`].filter(Boolean).join(' · ') })
    setQuery(match.name)
    setQty(parsed.quantity)
    if (parsed.unit && MATERIAL_UNITS.includes(parsed.unit as any)) {
      setUnit(parsed.unit)
    } else {
      setUnit(match.unit)
    }
    setDictationMsg(`Se ha entendido: ${parsed.quantity} ${parsed.unit || match.unit} de «${match.name}».`)
  }

  const doSubmit = async () => {
    if (saving) return

    if (!picked) {
      setError('Elige un material de la lista.')
      return
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setError('La cantidad debe ser mayor que 0.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await apiFetch<NewListResponse>('/lists', {
        method: 'POST',
        body: JSON.stringify({
          projectId: obraId,
          notes: notes.trim() || undefined,
        }),
      })

      await apiFetch(`/lists/${res.id}/items`, {
        method: 'POST',
        body: JSON.stringify({
          materialId: picked.id,
          requestedQty: qty,
          unit,
          notes: notes.trim() || undefined,
        }),
      })

      router.push(`/historial/${res.id}?obra=${obraId}`)
    } catch (err) {
      setError('No se pudo crear el registro.')
    } finally {
      setSaving(false)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await doSubmit()
  }

  return (
    <form onSubmit={submit} className="card mt-4 space-y-3">
      <div>
        <label className="label">Obra</label>
        <div className="input bg-slate-50 text-slate-700">{obraNombre}</div>
      </div>

      <div>
        <label className="label">Material</label>
        <Combobox
          options={options}
          query={query}
          onQueryChange={setQuery}
          value={picked}
          onChange={pick}
          placeholder="Buscar por nombre, SKU o categoría…"
          emptyText="Ningún material coincide."
          ariaLabel="Buscar material"
          disabled={saving}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-[7rem_7rem_1fr]">
        <div>
          <label className="label">Cantidad</label>
          <input
            className="input"
            type="number"
            min={1}
            step="any"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            disabled={saving}
          />
        </div>
        <div>
          <label className="label">Unidad</label>
          <select
            className="input"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            disabled={saving}
          >
            {MATERIAL_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="notas-registro">
            Notas (opcional)
          </label>
          <input
            id="notas-registro"
            className="input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={saving}
            placeholder="Notas opcionales"
          />
        </div>
      </div>

      {canDictate && (
        <VoiceDictation onTranscript={handleDictation} onError={(m) => setError(m)} disabled={saving} />
      )}

      {material && qty > material.stock && (
        <p className="text-xs text-amber-600">
          Stock disponible: {material.stock} {material.unit}. La cantidad pedida
          es mayor.
        </p>
      )}

      {dictationMsg && <p className="text-sm text-slate-600">{dictationMsg}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" type="submit" disabled={saving || !picked}>
          {saving ? 'Creando…' : 'Añadir materiales'}
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
            onClick={() => void doSubmit()}
            disabled={saving}
          >
            Reintentar
          </button>
        )}
      </div>
    </form>
  )
}
