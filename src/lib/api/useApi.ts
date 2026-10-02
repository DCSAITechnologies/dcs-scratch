import { useCallback, useEffect, useRef, useState } from 'react'
import type { ApiError } from './errors'

export type ApiResult<T> =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: T; error: null }
  | { status: 'error'; data: null; error: ApiError | Error }

type Settled<T> = { for: string; ok: true; data: T; at: Date } | { for: string; ok: false; error: ApiError | Error }

// Fetch on mount and whenever `key` changes; `reload` re-runs it. A result is only
// shown for the request it answers (stale responses from a superseded key are
// ignored), so "loading" is derived rather than set. No caching across mounts:
// the console shows what the API says now, and a refresh is one click.
export function useApi<T>(key: string, fetcher: () => Promise<T>): ApiResult<T> & { reload: () => void; loadedAt: Date | null } {
  const [nonce, setNonce] = useState(0)
  const [settled, setSettled] = useState<Settled<T> | null>(null)
  const fetcherRef = useRef(fetcher)
  useEffect(() => { fetcherRef.current = fetcher })
  const requestKey = `${key}#${nonce}`

  useEffect(() => {
    let live = true
    fetcherRef.current().then(
      (data) => { if (live) setSettled({ for: requestKey, ok: true, data, at: new Date() }) },
      (error) => { if (live) setSettled({ for: requestKey, ok: false, error }) },
    )
    return () => { live = false }
  }, [requestKey])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  if (!settled || settled.for !== requestKey) return { status: 'loading', data: null, error: null, reload, loadedAt: null }
  return settled.ok
    ? { status: 'ready', data: settled.data, error: null, reload, loadedAt: settled.at }
    : { status: 'error', data: null, error: settled.error, reload, loadedAt: null }
}
