import { useEffect, useRef, useState } from 'react'
import type { ApiError } from './errors'

type ListPage<T> = { data: T[]; has_more: boolean; next_cursor: string | null }
type Loaded<T> = { for: string; items: T[]; cursor: string | null; hasMore: boolean; at: Date; moreError: ApiError | Error | null }

// Cursor pagination over a list endpoint: first page on mount/key change, then
// "load more" appends. Like useApi, loading is derived from which request the
// stored page answers.
export function usePagedList<T>(key: string, fetchPage: (cursor: string | null) => Promise<ListPage<T>>) {
  const [nonce, setNonce] = useState(0)
  const [loaded, setLoaded] = useState<Loaded<T> | null>(null)
  const [failed, setFailed] = useState<{ for: string; error: ApiError | Error } | null>(null)
  const [more, setMore] = useState(false)
  const ref = useRef(fetchPage)
  useEffect(() => { ref.current = fetchPage })
  const requestKey = `${key}#${nonce}`

  useEffect(() => {
    let live = true
    ref.current(null).then(
      (p) => { if (live) setLoaded({ for: requestKey, items: p.data, cursor: p.next_cursor, hasMore: p.has_more, at: new Date(), moreError: null }) },
      (error) => { if (live) setFailed({ for: requestKey, error }) },
    )
    return () => { live = false }
  }, [requestKey])

  const current = loaded?.for === requestKey ? loaded : null
  const error = failed?.for === requestKey ? failed.error : null
  const loadMore = () => {
    if (!current?.cursor) return
    setMore(true)
    ref.current(current.cursor).then(
      (p) => setLoaded({ ...current, items: [...current.items, ...p.data], cursor: p.next_cursor, hasMore: p.has_more, moreError: null }),
      (e) => setLoaded({ ...current, moreError: e }),
    ).finally(() => setMore(false))
  }
  const status: 'loading' | 'ready' | 'error' | 'more' = current ? (more ? 'more' : 'ready') : error ? 'error' : 'loading'
  return {
    items: current?.items ?? [], hasMore: current?.hasMore ?? false, status,
    error: current?.moreError ?? error, loadedAt: current?.at ?? null,
    loadMore, reload: () => setNonce((n) => n + 1),
  }
}
