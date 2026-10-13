'use client'

import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { EmptyState, ErrorState, ServiceBadge, StatusBadge } from '@/components/ui'
import { useApi } from '@/lib/useApi'

interface ListRow {
  id: string
  status: string
  createdAt: string
  project: { name: string; serviceType: string; client: { name: string } }
  _count: { items: number }
}

interface Material {
  id: string
  name: string
  sku: string
  unit: string
  stock: number
  minStock: number
}

export default function PanelPage() {
  const pending = useApi<ListRow[]>('/lists/pending')
  const recent = useApi<ListRow[]>('/lists')
  const low = useApi<Material[]>('/materials/low-stock')

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold">Panel de almacén</h1>

      {(pending.error || recent.error || low.error) && (
        <div className="mb-6">
          <ErrorState>
            No se pudieron cargar algunos datos del panel.
          </ErrorState>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Listados por confirmar"
          value={pending.data?.length ?? '—'}
          tone="amber"
          href="/listados"
        />
        <StatCard
          label="Materiales bajo mínimo"
          value={low.data?.length ?? '—'}
          tone="red"
          href="/materiales"
        />
        <StatCard
          label="Listados totales"
          value={recent.data?.length ?? '—'}
          tone="brand"
          href="/listados"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-medium text-slate-700">
            Pendientes de confirmar
          </h2>
          {pending.loading ? (
            <p className="text-sm text-slate-500">Cargando…</p>
          ) : !pending.data || pending.data.length === 0 ? (
            <EmptyState>¡Todo al día! No hay listados pendientes. ✅</EmptyState>
          ) : (
            <ul className="space-y-2">
              {pending.data.map((l) => (
                <li key={l.id} className="card flex items-center justify-between">
                  <div>
                    <Link
                      href={`/listados/${l.id}`}
                      className="font-medium text-brand-dark hover:underline"
                    >
                      {l.project.client.name} · {l.project.name}
                    </Link>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <StatusBadge status={l.status} />
                      <ServiceBadge service={l.project.serviceType} />
                      <span>{l._count.items} líneas</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-medium text-slate-700">
            Reposición sugerida (stock ≤ mínimo)
          </h2>
          {low.loading ? (
            <p className="text-sm text-slate-500">Cargando…</p>
          ) : !low.data || low.data.length === 0 ? (
            <EmptyState>Sin alertas de stock.</EmptyState>
          ) : (
            <ul className="space-y-2">
              {low.data.map((m) => (
                <li key={m.id} className="card flex items-center justify-between">
                  <span className="text-sm">
                    <span className="font-medium">{m.name}</span>{' '}
                    <span className="text-xs text-slate-400">{m.sku}</span>
                  </span>
                  <span className="text-sm text-red-600">
                    {m.stock} / mín {m.minStock} {m.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  )
}

function StatCard({
  label,
  value,
  tone,
  href,
}: {
  label: string
  value: number | string
  tone: 'amber' | 'red' | 'brand'
  href: string
}) {
  const tones = {
    amber: 'text-amber-600',
    red: 'text-red-600',
    brand: 'text-brand-dark',
  }
  return (
    <Link href={href} className="card hover:border-brand">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-semibold ${tones[tone]}`}>{value}</p>
    </Link>
  )
}
