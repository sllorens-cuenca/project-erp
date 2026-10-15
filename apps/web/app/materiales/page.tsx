'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { Combobox, normalizeText, type ComboOption } from '@/components/Combobox'
import { EmptyState, ErrorState } from '@/components/ui'
import {
  MATERIAL_UNITS,
  MaterialUnit,
  StockMovementType,
} from '@erp/shared'
import { apiFetch } from '@/lib/api'
import { useApi } from '@/lib/useApi'

interface Material {
  id: string
  sku: string
  name: string
  category?: string | null
  unit: string
  stock: number
  minStock: number
  active: boolean
}

export default function MaterialesPage() {
  const [search, setSearch] = useState('')
  const [picked, setPicked] = useState<ComboOption | null>(null)
  const { data, loading, reload, error } = useApi<Material[]>('/materials')

  /** Materiales como opciones del buscador (una carga, filtrado en memoria). */
  const options = useMemo<ComboOption[]>(
    () =>
      (data ?? []).map((m) => ({
        id: m.id,
        label: m.name,
        hint: [m.sku, m.category].filter(Boolean).join(' · ') || undefined,
      })),
    [data],
  )

  const activo =
    picked && normalizeText(search) === normalizeText(picked.label) ? picked : null

  const materials = useMemo(() => {
    const list = data ?? []
    if (activo) return list.filter((m) => m.id === activo.id)
    const q = normalizeText(search)
    if (!q) return list
    return list.filter((m) =>
      normalizeText(`${m.name} ${m.sku} ${m.category ?? ''}`).includes(q),
    )
  }, [data, activo, search])
  const [showForm, setShowForm] = useState(false)
  const [movementFor, setMovementFor] = useState<Material | null>(null)

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Materiales</h1>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancelar' : '+ Nuevo material'}
        </button>
      </div>

      {showForm && (
        <NewMaterialForm
          onCreated={() => {
            setShowForm(false)
            void reload()
          }}
        />
      )}

      <div className="mb-4 max-w-sm">
        <Combobox
          options={options}
          query={search}
          onQueryChange={setSearch}
          value={picked}
          onChange={setPicked}
          placeholder="Buscar material (nombre, SKU, categoría)…"
          emptyText="Ningún material coincide."
          ariaLabel="Buscar materiales"
        />
        {activo && (
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-medium text-brand-dark">
              {activo.label}
            </span>
            <button
              type="button"
              className="text-xs text-slate-500 hover:text-slate-700 hover:underline"
              onClick={() => {
                setPicked(null)
                setSearch('')
              }}
            >
              Quitar filtro
            </button>
          </div>
        )}
      </div>

      {error ? (
        <ErrorState>{error}</ErrorState>
      ) : loading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : materials.length === 0 ? (
        <EmptyState>No hay materiales.</EmptyState>
      ) : (
        <>
          {/* Escritorio: tabla. */}
          <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2">SKU</th>
                  <th className="px-4 py-2">Material</th>
                  <th className="px-4 py-2">Categoría</th>
                  <th className="px-4 py-2 text-right">Stock</th>
                  <th className="px-4 py-2 text-right">Mínimo</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m) => {
                  const low = m.stock <= m.minStock
                  return (
                    <tr key={m.id} className="border-t border-slate-100">
                      <td className="px-4 py-2 font-mono text-xs">{m.sku}</td>
                      <td className="px-4 py-2 font-medium">{m.name}</td>
                      <td className="px-4 py-2 text-slate-500">
                        {m.category ?? '—'}
                      </td>
                      <td
                        className={`px-4 py-2 text-right ${
                          low ? 'font-semibold text-red-600' : ''
                        }`}
                      >
                        {m.stock} {m.unit}
                      </td>
                      <td className="px-4 py-2 text-right text-slate-400">
                        {m.minStock} {m.unit}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right">
                        <Link
                          href={`/movimientos?materialId=${m.id}`}
                          className="text-sm text-slate-500 hover:text-brand-dark hover:underline"
                        >
                          Movimientos
                        </Link>
                        <button
                          className="btn-secondary ml-3"
                          onClick={() => setMovementFor(m)}
                        >
                          Movimiento
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Móvil: la tarjeta abre el historial de movimientos del material. */}
          <ul className="grid gap-2 md:hidden">
            {materials.map((m) => {
              const low = m.stock <= m.minStock
              return (
                <li key={m.id}>
                  <div className="card">
                    <Link
                      href={`/movimientos?materialId=${m.id}`}
                      className="block active:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{m.name}</p>
                          <p className="truncate text-xs text-slate-400">
                            <span className="font-mono">{m.sku}</span>
                            {m.category ? ` · ${m.category}` : ''}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p
                            className={`text-sm ${
                              low ? 'font-semibold text-red-600' : ''
                            }`}
                          >
                            {m.stock} {m.unit}
                          </p>
                          <p className="text-xs text-slate-400">
                            mín. {m.minStock}
                          </p>
                        </div>
                      </div>
                      <span className="mt-2 block text-xs text-brand-dark">
                        Ver movimientos →
                      </span>
                    </Link>
                    <div className="mt-3 border-t border-slate-100 pt-3">
                      <button
                        className="btn-secondary"
                        onClick={() => setMovementFor(m)}
                      >
                        Registrar movimiento
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}

      {movementFor && (
        <MovementModal
          material={movementFor}
          onClose={() => setMovementFor(null)}
          onSaved={() => {
            setMovementFor(null)
            void reload()
          }}
        />
      )}
    </AppShell>
  )
}

function NewMaterialForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    sku: '',
    name: '',
    category: '',
    unit: 'UD' as MaterialUnit,
    stock: 0,
    minStock: 0,
  })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await apiFetch('/materials', {
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
    <form onSubmit={submit} className="card mb-4 grid gap-3 sm:grid-cols-3">
      <div>
        <label className="label">SKU *</label>
        <input
          className="input"
          required
          value={form.sku}
          onChange={(e) => setForm({ ...form, sku: e.target.value })}
        />
      </div>
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
        <label className="label">Categoría</label>
        <input
          className="input"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
      </div>
      <div>
        <label className="label">Unidad</label>
        <select
          className="input"
          value={form.unit}
          onChange={(e) =>
            setForm({ ...form, unit: e.target.value as MaterialUnit })
          }
        >
          {MATERIAL_UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Stock</label>
          <input
            className="input"
            type="number"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="label">Mínimo</label>
          <input
            className="input"
            type="number"
            value={form.minStock}
            onChange={(e) =>
              setForm({ ...form, minStock: Number(e.target.value) })
            }
          />
        </div>
      </div>
      {error && <p className="sm:col-span-3 text-sm text-red-600">{error}</p>}
      <div className="sm:col-span-3">
        <button className="btn-primary" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar material'}
        </button>
      </div>
    </form>
  )
}

function MovementModal({
  material,
  onClose,
  onSaved,
}: {
  material: Material
  onClose: () => void
  onSaved: () => void
}) {
  const [type, setType] = useState<StockMovementType>('ENTRADA')
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await apiFetch('/stock-movements', {
        method: 'POST',
        body: JSON.stringify({
          materialId: material.id,
          type,
          quantity,
          notes: notes || undefined,
        }),
      })
      onSaved()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30 p-4">
      <form onSubmit={submit} className="card w-full max-w-sm">
        <h2 className="mb-1 font-semibold">{material.name}</h2>
        <p className="mb-4 text-xs text-slate-500">
          Stock actual: {material.stock} {material.unit}
        </p>

        <div className="mb-3 grid grid-cols-3 gap-2">
          {(['ENTRADA', 'SALIDA', 'AJUSTE'] as StockMovementType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`btn ${
                type === t
                  ? 'bg-brand text-white'
                  : 'bg-white border border-slate-300 text-slate-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mb-3">
          <label className="label">
            {type === 'AJUSTE' ? 'Nuevo stock' : 'Cantidad'}
          </label>
          <input
            className="input"
            type="number"
            min={0}
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            required
          />
        </div>
        <div className="mb-3">
          <label className="label">Notas</label>
          <input
            className="input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Registrar'}
          </button>
        </div>
      </form>
    </div>
  )
}
