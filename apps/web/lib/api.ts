/**
 * Cliente HTTP de la API. Guarda el token JWT en localStorage y lo adjunta
 * en cada petición. Pensado para componentes de cliente ('use client').
 */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

const TOKEN_KEY = 'erp_token'
const USER_KEY = 'erp_user'

export interface StoredUser {
  id: string
  email: string
  name: string
  role: string
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(USER_KEY)
  return raw ? (JSON.parse(raw) as StoredUser) : null
}

export function storeSession(token: string, user: StoredUser) {
  window.localStorage.setItem(TOKEN_KEY, token)
  window.localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem(USER_KEY)
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (res.status === 401 || res.status === 403) {
    // Token inválido o sin permisos: se limpia la sesión.
    if (res.status === 401) clearSession()
  }

  if (!res.ok) {
    let message = `Error ${res.status}`
    try {
      const data = await res.json()
      message = Array.isArray(data.message) ? data.message.join(', ') : data.message
    } catch {
      /* respuesta sin JSON */
    }
    throw new ApiError(message, res.status)
  }

  if (res.status === 204) return undefined as T
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

/** Descarga un recurso protegido (CSV, HTML…) adjuntando el token. */
export async function downloadFile(path: string, filename: string) {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new ApiError(`No se pudo descargar (${res.status})`, res.status)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Abre un documento HTML protegido en una pestaña nueva (para imprimir/PDF). */
export async function openPrintable(path: string) {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new ApiError(`No se pudo abrir (${res.status})`, res.status)
  const html = await res.text()
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
}
