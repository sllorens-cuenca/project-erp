'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { ObraRegistros } from '@/components/ObraRegistros'
import { ObraResumen } from '@/components/ObraResumen'
import { NuevoRegistroObraForm } from '@/components/NuevoRegistroObraForm'
import {
  EmptyState,
  ErrorState,
  ProjectStatusBadge,
  ServiceBadge,
} from '@/components/ui'
import { formatFecha, type ObraDetalle } from '@/lib/obra'
import { useApi } from '@/lib/useApi'
import { useAuth } from '@/lib/auth'
import { puedeCrearRegistros } from '@/lib/permissions'

export default function ObraDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const { data, loading, errorStatus, reload } = useApi<ObraDetalle>(
    id ? `/projects/${id}` : null,
  )
  const { user } = useAuth()
  const [showForm, setShowForm] = useState(false)

  // Mientras carga no se muestra ni «no encontrada» ni ningún vacío (RF-30).
  if (loading) {
    return (
      <AppShell>
        <p className="text-sm text-slate-500">Cargando…</p>
      </AppShell>
    )
  }

  if (errorStatus === 404) {
    return (
      <AppShell>
        <EmptyState>
          <p className="font-medium text-slate-700">Obra no encontrada</p>
          <p className="mt-1">La obra no existe o se ha eliminado.</p>
          <Link
            href="/clientes"
            className="mt-3 inline-block text-brand-dark hover:underline"
          >
            ← Volver a clientes
          </Link>
        </EmptyState>
      </AppShell>
    )
  }

  if (!data) {
    return (
      <AppShell>
        <ErrorState>
          <p>No se pudo cargar la información de la obra.</p>
          <button className="btn-secondary mt-3" onClick={() => void reload()}>
            Reintentar
          </button>
        </ErrorState>
      </AppShell>
    )
  }

  const registros = data.lists?.length ?? 0
  const inicio = formatFecha(data.startDate)
  const fin = formatFecha(data.endDate)
  const fechas = [
    inicio ? `Inicio: ${inicio}` : null,
    fin ? `Fin: ${fin}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const lists = data.lists ?? []
  const puedeCrear = puedeCrearRegistros(user?.role)

  if (lists.length === 0) {
    return (
      <AppShell>
        <Link
          href={`/clientes/${data.client.id}`}
          className="text-sm text-slate-500 hover:underline"
        >
          ← {data.client.name}
        </Link>

        <header className="mb-6 mt-2">
          <p className="text-sm text-slate-500">Cliente: {data.client.name}</p>
          <h1 className="break-words text-2xl font-semibold">{data.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ServiceBadge service={data.serviceType} />
            <ProjectStatusBadge status={data.status} />
            <span className="text-sm text-slate-500">
              {registros} {registros === 1 ? 'registro' : 'registros'}
            </span>
          </div>
          {data.address && (
            <p className="mt-2 break-words text-sm text-slate-500">
              {data.address}
            </p>
          )}
          {fechas && <p className="mt-1 text-sm text-slate-500">{fechas}</p>}
          {data.notes && (
            <p className="mt-2 whitespace-pre-line break-words text-sm text-slate-600">
              {data.notes}
            </p>
          )}
          <Link
            href={`/historial?obra=${data.id}`}
            className="mt-3 inline-block text-sm text-brand-dark hover:underline"
          >
            Ver en historial de materiales →
          </Link>
        </header>

        {puedeCrear && (
          <section className="mb-6">
            {!showForm ? (
              <button
                className="btn-secondary"
                onClick={() => setShowForm(true)}
              >
                + Nuevo registro
              </button>
            ) : (
              <NuevoRegistroObraForm
                obraId={data.id}
                obraNombre={data.name}
                onCancel={() => setShowForm(false)}
              />
            )}
          </section>
        )}

        <section className="mb-8" aria-labelledby="obra-resumen-titulo">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="obra-resumen-titulo" className="text-lg font-semibold">
              Materiales necesitados
            </h2>
            <p className="text-sm text-slate-500">
              0 registros · 0 materiales · 0 líneas
            </p>
          </div>
          <EmptyState>
            <p className="font-medium text-slate-700">Sin registros en esta obra</p>
            <p className="mt-1">Aún no hay registros de materiales para esta obra.</p>
            {puedeCrear && !showForm && (
              <button
                className="btn-secondary mt-3"
                onClick={() => setShowForm(true)}
              >
                + Crear primer registro
              </button>
            )}
          </EmptyState>
        </section>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <Link
        href={`/clientes/${data.client.id}`}
        className="text-sm text-slate-500 hover:underline"
      >
        ← {data.client.name}
      </Link>

      <header className="mb-6 mt-2">
        <p className="text-sm text-slate-500">Cliente: {data.client.name}</p>
        <h1 className="break-words text-2xl font-semibold">{data.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ServiceBadge service={data.serviceType} />
          <ProjectStatusBadge status={data.status} />
          <span className="text-sm text-slate-500">
            {registros} {registros === 1 ? 'registro' : 'registros'}
          </span>
        </div>
        {data.address && (
          <p className="mt-2 break-words text-sm text-slate-500">
            {data.address}
          </p>
        )}
        {fechas && <p className="mt-1 text-sm text-slate-500">{fechas}</p>}
        {data.notes && (
          <p className="mt-2 whitespace-pre-line break-words text-sm text-slate-600">
            {data.notes}
          </p>
        )}
        <Link
          href={`/historial?obra=${data.id}`}
          className="mt-3 inline-block text-sm text-brand-dark hover:underline"
        >
          Ver en historial de materiales →
        </Link>
      </header>

      {puedeCrear && (
        <section className="mb-6">
          {!showForm ? (
            <button
              className="btn-secondary"
              onClick={() => setShowForm(true)}
            >
              + Nuevo registro
            </button>
          ) : (
            <NuevoRegistroObraForm
              obraId={data.id}
              obraNombre={data.name}
              onCancel={() => setShowForm(false)}
            />
          )}
        </section>
      )}

      <ObraResumen lists={lists} />

      <ObraRegistros lists={lists} obraId={data.id} />
    </AppShell>
  )
}
