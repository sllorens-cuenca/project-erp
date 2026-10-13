'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from './api'

/** Hook sencillo de carga de datos con estado de carga y error. */
export function useApi<T>(path: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!path) return
    setLoading(true)
    setError(null)
    try {
      setData(await apiFetch<T>(path))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps])

  useEffect(() => {
    void reload()
  }, [reload])

  return { data, error, loading, reload, setData }
}
