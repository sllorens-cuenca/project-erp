'use client'

import Link from 'next/link'
import { useEffect, type ReactElement } from 'react'
import { USER_ROLE_LABELS, type UserRole } from '@erp/shared'
import type { StoredUser } from '@/lib/api'

export interface NavItem {
  href: string
  label: string
  /** Si se indica, el item solo se muestra a ese rol. */
  role?: UserRole
}

/** Secciones que caben en la barra inferior; el resto van a la hoja «Más». */
const BOTTOM_HREFS = ['/', '/clientes', '/materiales', '/historial']

type IconProps = { className?: string }

const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

function IconPanel({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function IconClientes({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconMateriales({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="m21 8-9-5-9 5v8l9 5 9-5V8Z" />
      <path d="m3 8 9 5 9-5" />
      <path d="M12 13v8" />
    </svg>
  )
}

function IconHistorial({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  )
}

function IconMovimientos({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M7 3v18" />
      <path d="m3 7 4-4 4 4" />
      <path d="M17 21V3" />
      <path d="m13 17 4 4 4-4" />
    </svg>
  )
}

function IconRecordatorios({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}

function IconUsuarios({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  )
}

function IconMore({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className} strokeWidth={2.5}>
      <path d="M6 12h.01M12 12h.01M18 12h.01" />
    </svg>
  )
}

function IconClose({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

const ICONS: Record<string, (props: IconProps) => ReactElement> = {
  '/': IconPanel,
  '/clientes': IconClientes,
  '/materiales': IconMateriales,
  '/historial': IconHistorial,
  '/movimientos': IconMovimientos,
  '/recordatorios': IconRecordatorios,
  '/usuarios': IconUsuarios,
}

/** Una ruta está activa si coincide exactamente (/) o es prefijo del pathname. */
function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

interface MobileNavProps {
  nav: NavItem[]
  user: StoredUser
  pathname: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onLogout: () => void
}

/**
 * Navegación móvil (barra inferior + hoja «Más»). Solo se muestra por debajo
 * del breakpoint `md`; en escritorio manda la fila de enlaces del header.
 */
export function MobileNav({
  nav,
  user,
  pathname,
  open,
  onOpenChange,
  onLogout,
}: MobileNavProps) {
  const bottom = BOTTOM_HREFS.map((href) =>
    nav.find((item) => item.href === href),
  ).filter((item): item is NavItem => Boolean(item))
  const overflow = nav.filter((item) => !BOTTOM_HREFS.includes(item.href))
  const overflowActive = overflow.some((item) => isActive(pathname, item.href))

  // Cierra con Escape y bloquea el scroll de fondo mientras la hoja está abierta.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onOpenChange])

  const roleLabel = USER_ROLE_LABELS[user.role as UserRole] ?? user.role

  return (
    <>
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-5">
          {bottom.map((item) => {
            const Icon = ICONS[item.href]
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                  active ? 'text-brand' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {Icon && <Icon className="h-6 w-6" />}
                {item.label}
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => onOpenChange(!open)}
            aria-expanded={open}
            aria-haspopup="dialog"
            className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
              overflowActive
                ? 'text-brand'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <IconMore className="h-6 w-6" />
            Más
          </button>
        </div>
      </nav>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Más secciones"
          className="fixed inset-0 z-50 md:hidden"
        >
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => onOpenChange(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-slate-900/40"
          />
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-4 shadow-xl"
            style={{
              paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
            }}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <Link
                href="/perfil"
                className="min-w-0 rounded-lg px-1 py-1 hover:bg-slate-100"
              >
                <span className="block truncate font-medium text-slate-800">
                  {user.name}
                </span>
                <span className="block text-xs text-slate-500">{roleLabel}</span>
              </Link>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Cerrar menú"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <IconClose className="h-5 w-5" />
              </button>
            </div>
            <nav aria-label="Más secciones" className="grid gap-1">
              {overflow.map((item) => {
                const Icon = ICONS[item.href]
                const active = isActive(pathname, item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      active
                        ? 'bg-brand-light text-brand-dark'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {Icon && <Icon className="h-5 w-5" />}
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <button
              type="button"
              onClick={onLogout}
              className="btn-secondary mt-3 w-full"
            >
              Salir
            </button>
          </div>
        </div>
      )}
    </>
  )
}
