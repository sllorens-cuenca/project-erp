import {
  MATERIAL_LIST_STATUS_LABELS,
  MaterialListStatus,
  SERVICE_TYPE_LABELS,
  ServiceType,
} from '@erp/shared'

export interface ListDocumentItem {
  materialName: string
  sku: string
  unit: string
  requestedQty: number
  preparedQty: number
  notes?: string | null
}

export interface ListDocumentData {
  id: string
  status: string
  projectName: string
  serviceType: string
  clientName: string
  clientEmail?: string | null
  address?: string | null
  createdAt: Date
  sentAt?: Date | null
  notes?: string | null
  preparedBy?: string | null
  items: ListDocumentItem[]
}

const fmtDate = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('es-ES') : '—'

const fmtNum = (n: number) =>
  new Intl.NumberFormat('es-ES', { maximumFractionDigits: 3 }).format(n)

export function buildSubject(data: ListDocumentData): string {
  return `Registro de materiales — ${data.clientName} / ${data.projectName}`
}

export function buildHtml(data: ListDocumentData): string {
  const rows = data.items
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.sku)}</td>
        <td>${escapeHtml(item.materialName)}</td>
        <td style="text-align:right">${fmtNum(item.requestedQty)}</td>
        <td style="text-align:right">${fmtNum(item.preparedQty)}</td>
        <td>${escapeHtml(item.unit)}</td>
        <td>${escapeHtml(item.notes ?? '')}</td>
      </tr>`,
    )
    .join('')

  return `<!doctype html>
<html lang="es">
<body style="font-family: Arial, Helvetica, sans-serif; color:#1f2937">
  <h2 style="margin:0 0 4px">Registro de materiales preparados</h2>
  <p style="margin:0 0 16px; color:#6b7280">
    ${escapeHtml(data.clientName)} · ${escapeHtml(data.projectName)}
    (${escapeHtml(
      SERVICE_TYPE_LABELS[data.serviceType as ServiceType] ?? data.serviceType,
    )})
  </p>

  <table style="border-collapse:collapse; width:100%; font-size:14px">
    <thead>
      <tr style="background:#f3f4f6">
        <th style="text-align:left; padding:8px; border:1px solid #e5e7eb">SKU</th>
        <th style="text-align:left; padding:8px; border:1px solid #e5e7eb">Material</th>
        <th style="text-align:right; padding:8px; border:1px solid #e5e7eb">Pedido</th>
        <th style="text-align:right; padding:8px; border:1px solid #e5e7eb">Preparado</th>
        <th style="text-align:left; padding:8px; border:1px solid #e5e7eb">Ud.</th>
        <th style="text-align:left; padding:8px; border:1px solid #e5e7eb">Notas</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <p style="margin-top:16px; font-size:13px; color:#6b7280">
    Estado: ${escapeHtml(
      MATERIAL_LIST_STATUS_LABELS[data.status as MaterialListStatus] ??
        data.status,
    )} ·
    Fecha: ${fmtDate(data.sentAt ?? data.createdAt)}
    ${data.preparedBy ? ` · Preparado por: ${escapeHtml(data.preparedBy)}` : ''}
  </p>
  ${data.notes ? `<p style="font-size:13px">Notas: ${escapeHtml(data.notes)}</p>` : ''}
</body>
</html>`
}

export function buildText(data: ListDocumentData): string {
  const lines = data.items.map(
    (i) =>
      `- ${i.materialName} (${i.sku}): pedido ${fmtNum(i.requestedQty)} ${i.unit}, preparado ${fmtNum(i.preparedQty)} ${i.unit}${
        i.notes ? ` — ${i.notes}` : ''
      }`,
  )
  return [
    `Registro de materiales — ${data.clientName} / ${data.projectName}`,
    '',
    ...lines,
    '',
    `Estado: ${data.status} · Fecha: ${fmtDate(data.sentAt ?? data.createdAt)}`,
  ].join('\n')
}

/** Exportación CSV (compatible con Excel). */
export function buildCsv(data: ListDocumentData): string {
  const header = ['SKU', 'Material', 'Pedido', 'Preparado', 'Unidad', 'Notas']
  const rows = data.items.map((i) => [
    i.sku,
    i.materialName,
    String(i.requestedQty),
    String(i.preparedQty),
    i.unit,
    i.notes ?? '',
  ])
  const escape = (v: string) =>
    /[",;\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
  return [header, ...rows].map((r) => r.map(escape).join(';')).join('\n')
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
