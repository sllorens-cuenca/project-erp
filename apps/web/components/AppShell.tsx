'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { USER_ROLE_LABELS, type UserRole } from '@erp/shared'
import { useAuth, useRequireAuth } from '@/lib/auth'

interface NavItem {
  href: string
  label: string
  /** Si se indica, el item solo se muestra a ese rol. */
  role?: UserRole
}

const NAV: NavItem[] = [
  { href: '/', label: 'Panel' },
  { href: '/clientes', label: 'Clientes' },
  { href: '/materiales', label: 'Materiales' },
  { href: '/listados', label: 'Listados' },
  { href: '/movimientos', label: 'Movimientos' },
  { href: '/recordatorios', label: 'Recordatorios' },
  { href: '/usuarios', label: 'Usuarios', role: 'ADMIN' },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useRequireAuth()
  const { logout } = useAuth()
  const pathname = usePathname()

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
              className="hidden text-right leading-tight text-slate-500 hover:text-brand-dark sm:block"
            >
              <span className="block font-medium text-slate-700">
                {user.name}
              </span>
              <span className="block text-xs">
                {USER_ROLE_LABELS[user.role as UserRole] ?? user.role}
              </span>
            </Link>
            <button onClick={logout} className="btn-secondary">
              Salir
            </button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}
