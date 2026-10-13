import type { MaterialListStatus, ServiceType } from '@erp/shared'
import {
  MATERIAL_LIST_STATUS_LABELS,
  SERVICE_TYPE_LABELS,
} from '@erp/shared'

export function StatusBadge({ status }: { status: string }) {
  const label =
    MATERIAL_LIST_STATUS_LABELS[status as MaterialListStatus] ?? status
  const colors: Record<string, string> = {
    BORRADOR: 'bg-slate-100 text-slate-600',
    EN_PREPARACION: 'bg-amber-100 text-amber-700',
    LISTO: 'bg-blue-100 text-blue-700',
    CONFIRMADO: 'bg-emerald-100 text-emerald-700',
    ENVIADO: 'bg-brand-light text-brand-dark',
  }
  return (
    <span className={`badge ${colors[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {label}
    </span>
  )
}

export function ServiceBadge({ service }: { service: string }) {
  const label = SERVICE_TYPE_LABELS[service as ServiceType] ?? service
  return (
    <span className="badge bg-slate-100 text-slate-600">{label}</span>
  )
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
      {children}
    </div>
  )
}
