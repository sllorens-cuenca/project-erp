'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { EmptyState, ServiceBadge, StatusBadge } from '@/components/ui'
import { MaterialListStatus } from '@erp/shared'
import { apiFetch, downloadFile, openPrintable } from '@/lib/api'
import { useApi } from '@/lib/useApi'

interface ListItem {
  id: string
  requestedQty: number
  preparedQty: number
  unit: string
  notes?: string | null
  materialId: string
  material: { id: string; sku: string; name: string; unit: string; stock: number }
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
  const params = useParams<{ id: string }>()
  const id = params.id
  const { data, loading, reload } = useApi<ListDetail>(
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
      <Link href="/historial" className="text-sm text-slate-500 hover:underline">
        ← Historial
      </Link>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Cargando…</p>
      ) : !data ? (
        <EmptyState>Registro no encontrado.</EmptyState>
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
            <CommandBar
              listId={id}
              onDone={() => void reload()}
              onError={(m) => setError(m)}
            />
          )}

          <section className="mt-6">
            <h2 className="mb-3 font-medium text-slate-700">
              Materiales ({data.items.length})
            </h2>
            {data.items.length === 0 ? (
              <EmptyState>
                Añade materiales con la barra de comandos o con el botón
                «Añadir material».
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
      setText('')
      onDone()
    } catch (err) {
      onError((err as Error).message)
    } finally {
      setBusy(false)
    }
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
      <div className="mt-2 flex items-center gap-3">
        <button className="btn-primary" disabled={busy} onClick={submit}>
          {busy ? 'Añadiendo…' : 'Añadir materiales'}
        </button>
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
  const update = async (
    item: ListItem,
    field: 'requestedQty' | 'preparedQty',
    value: number,
  ) => {
    try {
      await apiFetch(`/lists/${listId}/items/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ [field]: value }),
      })
      onChanged()
    } catch (err) {
      onError((err as Error).message)
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
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            <th className="px-4 py-2">SKU</th>
            <th className="px-4 py-2">Material</th>
            <th className="px-4 py-2 text-right">Pedido</th>
            <th className="px-4 py-2 text-right">Preparado</th>
            <th className="px-4 py-2">Ud.</th>
            <th className="px-4 py-2 text-right">Stock</th>
            <th className="px-4 py-2"></th>
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
              <td className="px-4 py-2 text-right">
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
  )
}
