'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { Combobox, type ComboOption } from '@/components/Combobox'
import { EmptyState, ErrorState, ServiceBadge, StatusBadge } from '@/components/ui'
import { MATERIAL_UNITS, MaterialListStatus } from '@erp/shared'
import { apiFetch, downloadFile, openPrintable } from '@/lib/api'
import { useApi } from '@/lib/useApi'
import { VoiceDictation } from '@/components/VoiceDictation'
import { parseForForm } from '@/lib/voice/parse'
import { useAuth } from '@/lib/auth'
import { puedeCrearRegistros } from '@/lib/permissions'

interface ListItem {
  id: string
  requestedQty: number
  preparedQty: number
  unit: string
  notes?: string | null
  materialId: string
  material: { id: string; sku: string; name: string; unit: string; stock: number }
}

interface Material {
  id: string
  sku: string
  name: string
  category?: string | null
  unit: string
  stock: number
}

interface EmailLog {
  id: string
  to: string
  cc?: string | null
  subject: string
  status: string
  sentAt?: string | null
}

interface ListDetail {
  id: string
  status: string
  notes?: string | null
  sentAt?: string | null
  project: {
    id: string
    name: string
    serviceType: string
    address?: string | null
    client: { id: string; name: string; email?: string | null }
  }
  createdBy?: { name: string } | null
  confirmedBy?: { name: string } | null
  items: ListItem[]
  emails: EmailLog[]
}

interface CommandResult {
  ok: boolean
  added: string[]
  errors: string[]
}

export default function HistorialDetailPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <p className="text-sm text-slate-500">Cargando…</p>
        </AppShell>
      }
    >
      <HistorialDetailContent />
    </Suspense>
  )
}

function HistorialDetailContent() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const searchParams = useSearchParams()
  const obraParam = searchParams.get('obra')
  const { data, loading, reload, errorStatus } = useApi<ListDetail>(
    id ? `/lists/${id}` : null,
  )
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = async (fn: () => Promise<unknown>, okMsg?: string) => {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await fn()
      if (okMsg) setMessage(okMsg)
      await reload()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const changeStatus = (status: string) =>
    run(
      () =>
        apiFetch(`/lists/${id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }),
      `Estado actualizado a ${status}.`,
    )

  const confirm = () =>
    run(
      () => apiFetch(`/lists/${id}/confirm`, { method: 'POST' }),
      'Preparación confirmada y stock descontado.',
    )

  const send = () =>
    run(
      () => apiFetch(`/lists/${id}/send`, { method: 'POST' }),
      'Registro enviado por correo (cliente + copia interna).',
    )

  return (
    <AppShell>
      <div className="mb-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <Link href="/historial" className="hover:underline">
          ← Historial
        </Link>
        {(data?.project?.id || obraParam) && (
          <Link
            href={`/obras/${data?.project?.id ?? obraParam}`}
            className="hover:underline"
          >
            ← Obra {data?.project?.name ?? 'de esta obra'}
          </Link>
        )}
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Cargando…</p>
      ) : !data ? (
        <div className="mt-4 space-y-3">
          <ErrorState>Registro no encontrado</ErrorState>
          <div className="flex flex-wrap gap-3 text-sm">
            {obraParam ? (
              <Link href={`/obras/${obraParam}`} className="text-brand hover:underline">
                Volver a la obra
              </Link>
            ) : null}
            <Link href="/historial" className="text-slate-500 hover:underline">
              Volver al historial
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 mt-2 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">
                {data.project.client.name}
              </h1>
              <p className="text-sm text-slate-500">
                {data.project.name}
                {data.project.address ? ` · ${data.project.address}` : ''}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge status={data.status} />
                <ServiceBadge service={data.project.serviceType} />
                {data.sentAt && (
                  <span className="text-xs text-slate-400">
                    Enviado {new Date(data.sentAt).toLocaleString('es-ES')}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="btn-secondary"
                disabled={busy}
                onClick={() =>
                  openPrintable(`/lists/${id}/document`).catch((e) =>
                    setError((e as Error).message),
                  )
                }
              >
                Imprimir / PDF
              </button>
              <button
                className="btn-secondary"
                disabled={busy}
                onClick={() =>
                  downloadFile(`/lists/${id}/export?format=csv`, `registro.csv`).catch(
                    (e) => setError((e as Error).message),
                  )
                }
              >
                Exportar CSV
              </button>
            </div>
          </div>

          {(message || error) && (
            <div
              className={`mb-4 rounded-lg p-3 text-sm ${
                error
                  ? 'bg-red-50 text-red-700'
                  : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {error ?? message}
            </div>
          )}

          <StatusActions
            status={data.status}
            busy={busy}
            onChange={changeStatus}
            onConfirm={confirm}
            onSend={send}
          />

          {data.status !== 'ENVIADO' && (
            <>
              <AddItemForm
                listId={id}
                items={data.items}
                onDone={() => void reload()}
                onError={(m) => setError(m)}
              />

              <details className="mb-4" id="command-bar-details">
                <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-700">
                  Modo rápido: pegar una lista de materiales
                </summary>
                <div className="mt-3">
                  <CommandBar
                    listId={id}
                    onDone={() => void reload()}
                    onError={(m) => setError(m)}
                  />
                </div>
              </details>
            </>
          )}

          <section className="mt-6">
            <h2 className="mb-3 font-medium text-slate-700">
              Materiales ({data.items.length})
            </h2>
            {data.items.length === 0 ? (
              <EmptyState>
                Todavía no hay materiales. Añádelos con el buscador de arriba.
              </EmptyState>
            ) : (
              <ItemTable
                listId={id}
                items={data.items}
                disabled={data.status === 'ENVIADO'}
                onChanged={() => void reload()}
                onError={setError}
              />
            )}
          </section>

          {data.emails.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 font-medium text-slate-700">
                Envíos
              </h2>
              <ul className="space-y-2">
                {data.emails.map((e) => (
                  <li
                    key={e.id}
                    className="card flex items-center justify-between text-sm"
                  >
                    <span>
                      {e.subject}
                      <span className="ml-2 text-xs text-slate-400">
                        → {e.to}
                        {e.cc ? ` · cc ${e.cc}` : ''}
                      </span>
                    </span>
                    <span
                      className={
                        e.status === 'ENVIADO'
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }
                    >
                      {e.status}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </AppShell>
  )
}

function StatusActions({
  status,
  busy,
  onChange,
  onConfirm,
  onSend,
}: {
  status: string
  busy: boolean
  onChange: (s: string) => void
  onConfirm: () => void
  onSend: () => void
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {status === MaterialListStatus.BORRADOR && (
        <button
          className="btn-primary"
          disabled={busy}
          onClick={() => onChange('EN_PREPARACION')}
        >
          Iniciar preparación
        </button>
      )}
      {status === MaterialListStatus.EN_PREPARACION && (
        <button
          className="btn-primary"
          disabled={busy}
          onClick={() => onChange('LISTO')}
        >
          Marcar como listo
        </button>
      )}
      {status === MaterialListStatus.LISTO && (
        <button className="btn-primary" disabled={busy} onClick={onConfirm}>
          Confirmar preparación (descuenta stock)
        </button>
      )}
      {status === MaterialListStatus.CONFIRMADO && (
        <button className="btn-primary" disabled={busy} onClick={onSend}>
          Enviar al cliente por email
        </button>
      )}
      {status === MaterialListStatus.ENVIADO && (
        <span className="badge bg-brand-light text-brand-dark">
          Enviado al cliente ✔
        </span>
      )}
    </div>
  )
}

function AddItemForm({
  listId,
  items,
  onDone,
  onError,
}: {
  listId: string
  items: ListItem[]
  onDone: () => void
  onError: (m: string) => void
}) {
  const { data } = useApi<Material[]>('/materials?onlyActive=true')
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<ComboOption | null>(null)
  const [qty, setQty] = useState(1)
  const [unit, setUnit] = useState<string>('UD')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [dictationMsg, setDictationMsg] = useState<string | null>(null)
  const canDictate = puedeCrearRegistros(user?.role)

  /** Catálogo como opciones del buscador (una carga; se ve el stock en la pista). */
  const options = useMemo<ComboOption[]>(
    () =>
      (data ?? []).map((m) => ({
        id: m.id,
        label: m.name,
        hint: [m.sku, m.category, `${m.stock} ${m.unit}`]
          .filter(Boolean)
          .join(' · '),
      })),
    [data],
  )

  const material = useMemo(
    () => (data ?? []).find((m) => m.id === picked?.id) ?? null,
    [data, picked],
  )

  const pick = (option: ComboOption | null) => {
    setPicked(option)
    setErr(null)
    setNotice(null)
    setDictationMsg(null)
    const m = (data ?? []).find((x) => x.id === option?.id)
    if (m) setUnit(m.unit)
  }

  const handleDictation = (text: string, isFinal: boolean) => {
    if (busy) return
    if (!isFinal) return
    setErr(null)
    setNotice(null)
    const parsed = parseForForm(text)
    if (!parsed) {
      setDictationMsg('No se ha entendido el material, la cantidad o la unidad.')
      return
    }
    const match = (data ?? []).find(
      (m) => m.name.toLowerCase() === parsed.materialName.toLowerCase(),
    )
    if (!match) {
      setDictationMsg(`No se ha encontrado un material exacto para «${parsed.materialName}». Puedes buscarlo en el listado.`)
      return
    }
    setPicked({ id: match.id, label: match.name, hint: [match.sku, match.category, `${match.stock} ${match.unit}`].filter(Boolean).join(' · ') })
    setQuery(match.name)
    setQty(parsed.quantity)
    if (parsed.unit) {
      if (MATERIAL_UNITS.includes(parsed.unit as any)) {
        setUnit(parsed.unit)
      }
    } else {
      setUnit(match.unit)
    }
    setDictationMsg(`Se ha entendido: ${parsed.quantity} ${parsed.unit || match.unit} de «${match.name}».`)
  }

  const add = async () => {
    if (!picked) {
      setErr('Elige un material de la lista.')
      return
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setErr('La cantidad debe ser mayor que 0.')
      return
    }
    const label = picked.label
    const already = items.some((i) => i.materialId === picked.id)
    setBusy(true)
    setErr(null)
    setNotice(null)
    try {
      await apiFetch(`/lists/${listId}/items`, {
        method: 'POST',
        body: JSON.stringify({
          materialId: picked.id,
          requestedQty: qty,
          unit,
        }),
      })
      setNotice(
        already
          ? `«${label}» ya estaba en el registro: se acumuló la cantidad.`
          : `Añadido: ${qty} ${unit} de «${label}».`,
      )
      setPicked(null)
      setQuery('')
      setQty(1)
      onDone()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      className="card mb-4"
      onSubmit={(e) => {
        e.preventDefault()
        void add()
      }}
    >
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem_7rem_auto] sm:items-end">
        <div>
          <label className="label">Añadir material</label>
          <Combobox
            options={options}
            query={query}
            onQueryChange={setQuery}
            value={picked}
            onChange={pick}
            placeholder="Buscar por nombre, SKU o categoría…"
            emptyText="Ningún material coincide."
            ariaLabel="Buscar material para añadir"
          />
        </div>
        <div>
          <label className="label">Cantidad</label>
          <input
            className="input"
            type="number"
            min={1}
            step="any"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Unidad</label>
          <select
            className="input"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          >
            {MATERIAL_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <button className="btn-primary" disabled={busy || !picked}>
          {busy ? 'Añadiendo…' : 'Añadir'}
        </button>
      </div>

      {canDictate && (
        <div className="mt-3">
          <VoiceDictation onTranscript={handleDictation} onError={(m) => setErr(m)} disabled={busy} />
        </div>
      )}
      {material && qty > material.stock && (
        <p className="mt-2 text-xs text-amber-600">
          Stock disponible: {material.stock} {material.unit}. La cantidad pedida
          es mayor.
        </p>
      )}
      {dictationMsg && <p className="mt-2 text-sm text-slate-600">{dictationMsg}</p>}
      {notice && <p className="mt-2 text-sm text-emerald-600">{notice}</p>}
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
    </form>
  )
}

function CommandBar({
  listId,
  onDone,
  onError,
}: {
  listId: string
  onDone: () => void
  onError: (m: string) => void
}) {
  const [text, setText] = useState('')
  const [result, setResult] = useState<CommandResult | null>(null)
  const [busy, setBusy] = useState(false)
  const { user } = useAuth()
  const canDictate = puedeCrearRegistros(user?.role)

  const submit = async () => {
    if (!text.trim()) return
    setBusy(true)
    onError('')
    try {
      const res = await apiFetch<CommandResult>(`/lists/${listId}/commands`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      })
      setResult(res)
      if (res.ok && res.errors.length === 0) {
        setText('')
      } else if (res.errors.length > 0) {
        // Keep only failed lines - simple approach: keep original text for now
        // Server will handle per spec
        setText(text)
      } else {
        setText('')
      }
      onDone()
    } catch (err) {
      onError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const handleDictation = (transcript: string, isFinal: boolean) => {
    if (busy) return
    if (!isFinal) return
    setText((prev) => (prev ? prev + '\n' + transcript : transcript))
    setResult(null)
  }

  return (
    <div className="card">
      <label className="label">
        Barra de comandos — escribe uno por línea y pulsa Añadir
      </label>
      <textarea
        className="input font-mono text-sm"
        rows={3}
        placeholder={'/cobre 25 m\nregleta 6\n+tuberia 12/14 5'}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void submit()
        }}
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button className="btn-primary" disabled={busy} onClick={submit}>
          {busy ? 'Añadiendo…' : 'Añadir materiales'}
        </button>
        {canDictate && (
          <VoiceDictation onTranscript={handleDictation} onError={onError} disabled={busy} />
        )}
        <span className="text-xs text-slate-400">
          Ejemplos: <code>/cobre 25 m</code>, <code>+regleta 10</code>
        </span>
      </div>
      {result && (
        <div className="mt-3 text-xs">
          {result.added.length > 0 && (
            <p className="text-emerald-600">
              Añadido: {result.added.join(' · ')}
            </p>
          )}
          {result.errors.length > 0 && (
            <p className="text-red-600">{result.errors.join(' · ')}</p>
          )}
        </div>
      )}
    </div>
  )
}

function ItemTable({
  listId,
  items,
  disabled,
  onChanged,
  onError,
}: {
  listId: string
  items: ListItem[]
  disabled: boolean
  onChanged: () => void
  onError: (m: string) => void
}) {
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const update = async (
    item: ListItem,
    field: 'requestedQty' | 'preparedQty',
    value: number,
  ) => {
    if (!Number.isFinite(value) || value < 0) return
    setSavingId(item.id)
    setSavedId(null)
    try {
      await apiFetch(`/lists/${listId}/items/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ [field]: value }),
      })
      onChanged()
      setSavedId(item.id)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setSavedId(null), 1500)
    } catch (err) {
      onError((err as Error).message)
    } finally {
      setSavingId(null)
    }
  }

  const remove = async (item: ListItem) => {
    try {
      await apiFetch(`/lists/${listId}/items/${item.id}`, { method: 'DELETE' })
      onChanged()
    } catch (err) {
      onError((err as Error).message)
    }
  }

  return (
    <>
      {/* Escritorio: tabla. */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2">SKU</th>
              <th className="px-4 py-2">Material</th>
              <th className="px-4 py-2 text-right">Pedido</th>
              <th className="px-4 py-2 text-right">Preparado</th>
              <th className="px-4 py-2">Ud.</th>
              <th className="px-4 py-2 text-right">Stock</th>
              <th className="whitespace-nowrap px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-mono text-xs">{it.material.sku}</td>
                <td className="px-4 py-2 font-medium">{it.material.name}</td>
                <td className="px-4 py-2 text-right">
                  <input
                    type="number"
                    className="input w-20 text-right"
                    defaultValue={it.requestedQty}
                    disabled={disabled}
                    onBlur={(e) => {
                      const v = Number(e.target.value)
                      if (v !== it.requestedQty) void update(it, 'requestedQty', v)
                    }}
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <input
                    type="number"
                    className="input w-20 text-right"
                    defaultValue={it.preparedQty}
                    disabled={disabled}
                    onBlur={(e) => {
                      const v = Number(e.target.value)
                      if (v !== it.preparedQty) void update(it, 'preparedQty', v)
                    }}
                  />
                </td>
                <td className="px-4 py-2 text-slate-500">{it.unit}</td>
                <td className="px-4 py-2 text-right text-slate-400">
                  {it.material.stock}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-right">
                  <span className="mr-3 text-xs text-slate-400">
                    {savingId === it.id
                      ? 'Guardando…'
                      : savedId === it.id
                        ? 'Guardado ✔'
                        : ''}
                  </span>
                  {!disabled && (
                    <button
                      className="text-red-500 hover:underline"
                      onClick={() => remove(it)}
                    >
                      Quitar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Móvil: una tarjeta por material (la tabla se recortaba con overflow-hidden). */}
      <ul className="grid gap-2 md:hidden">
        {items.map((it) => (
          <li key={it.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{it.material.name}</p>
                <p className="truncate text-xs text-slate-400">
                  <span className="font-mono">{it.material.sku}</span> · stock{' '}
                  {it.material.stock}
                </p>
              </div>
              {!disabled && (
                <button
                  className="shrink-0 text-sm text-red-500 hover:underline"
                  onClick={() => remove(it)}
                >
                  Quitar
                </button>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="label">Pedido ({it.unit})</label>
                <input
                  type="number"
                  className="input"
                  defaultValue={it.requestedQty}
                  disabled={disabled}
                  onBlur={(e) => {
                    const v = Number(e.target.value)
                    if (v !== it.requestedQty) void update(it, 'requestedQty', v)
                  }}
                />
              </div>
              <div>
                <label className="label">Preparado ({it.unit})</label>
                <input
                  type="number"
                  className="input"
                  defaultValue={it.preparedQty}
                  disabled={disabled}
                  onBlur={(e) => {
                    const v = Number(e.target.value)
                    if (v !== it.preparedQty) void update(it, 'preparedQty', v)
                  }}
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {savingId === it.id
                ? 'Guardando…'
                : savedId === it.id
                  ? 'Guardado ✔'
                  : ''}
            </p>
          </li>
        ))}
      </ul>
    </>
  )
}
