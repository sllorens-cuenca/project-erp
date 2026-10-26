'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetch } from './api'

/** Hook sencillo de carga de datos con estado de carga y error. */
export function useApi<T>(
  path: string | null,
  deps: unknown[] = [],
  init?: RequestInit,
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorStatus, setErrorStatus] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const hasDataRef = useRef(false)

  useEffect(() => {
    hasDataRef.current = data !== null
  }, [data])

  const reload = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!path) return
      const silent = options?.silent ?? false
      if (!silent || !hasDataRef.current) {
        setLoading(true)
      }
      setError(null)
      setErrorStatus(null)
      try {
        const requestInit: RequestInit = { cache: 'no-store', ...(init ?? {}) }
        setData(await apiFetch<T>(path, requestInit))
      } catch (err) {
        setError((err as Error).message)
        // `ApiError` lleva el código HTTP; un fallo de red no lo trae (null).
        setErrorStatus((err as { status?: number }).status ?? null)
      } finally {
        setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [path, ...(deps ?? [])],
  )

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleFocus = () => {
      void reload({ silent: true })
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void reload({ silent: true })
      }
    }
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        void reload({ silent: true })
      }
    }
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pageshow', handlePageShow)
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [reload])

  return { data, error, errorStatus, loading, reload, setData }
}
