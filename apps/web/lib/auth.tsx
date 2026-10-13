'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import {
  apiFetch,
  clearSession,
  getStoredUser,
  getToken,
  storeSession,
  type StoredUser,
} from './api'

interface AuthContextValue {
  user: StoredUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    setUser(getStoredUser())
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const res = await apiFetch<{ accessToken: string; user: StoredUser }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
    )
    storeSession(res.accessToken, res.user)
    setUser(res.user)
  }

  const logout = () => {
    clearSession()
    setUser(null)
    router.push('/login')
  }

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}

/** Redirige a /login si no hay sesión. */
export function useRequireAuth() {
  const { user, loading } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (!loading && !user && !getToken()) router.replace('/login')
  }, [loading, user, router])
  return { user, loading }
}
