'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { USER_ROLE_LABELS, type UserRole } from '@erp/shared'
import { useAuth, useRequireAuth } from '@/lib/auth'
import { MobileNav, type NavItem } from '@/components/MobileNav'

const NAV: NavItem[] = [
  { href: '/', label: 'Panel' },
  { href: '/clientes', label: 'Clientes' },
  { href: '/materiales', label: 'Materiales' },
  { href: '/listados', label: 'Listados' },
  { href: '/movimientos', label: 'Movimientos' },
  { href: '/recordatorios', label: 'Recordatorios' },
  { href: '/usuarios', label: 'Usuarios', role: 'ADMIN' },
]

/** Iniciales para el avatar móvil (hasta dos palabras del nombre). */
function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useRequireAuth()
  const { logout } = useAuth()
  const pathname = usePathname()
  const [sheetOpen, setSheetOpen] = useState(false)

  // Al cambiar de sección se cierra la hoja móvil.
  useEffect(() => {
    setSheetOpen(false)
  }, [pathname])

  if (loading) {
    return <div className="p-8 text-sm text-slate-500">Cargando…</div>
  }
  if (!user) return null

  const nav = NAV.filter((item) => !item.role || item.role === user.role)

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-semibold text-brand-dark">
              📦 Almacén
            </Link>
            <nav className="hidden gap-1 md:flex">
              {nav.map((item) => {
                const active =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-lg px-3 py-1.5 text-sm ${
                      active
                        ? 'bg-brand-light font-medium text-brand-dark'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/perfil"
              title="Ver mi perfil"
              className="hidden text-right leading-tight text-slate-500 hover:text-brand-dark md:block"
            >
              <span className="block font-medium text-slate-700">
                {user.name}
              </span>
              <span className="block text-xs">
                {USER_ROLE_LABELS[user.role as UserRole] ?? user.role}
              </span>
            </Link>
            <button
              onClick={logout}
              className="btn-secondary hidden md:inline-flex"
            >
              Salir
            </button>
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={sheetOpen}
              className="grid h-9 w-9 place-items-center rounded-full bg-brand-light text-sm font-semibold text-brand-dark md:hidden"
            >
              {initialsOf(user.name)}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>
      <MobileNav
        nav={nav}
        user={user}
        pathname={pathname}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onLogout={logout}
      />
    </div>
  )
}
