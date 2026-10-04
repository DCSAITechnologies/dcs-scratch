// API-mode UI building blocks: state rendering for every data-driven page, and the
// confirmation dialog every mutation goes through.

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ApiError, describeError } from '../../lib/api/errors'
import type { ApiResult } from '../../lib/api/useApi'
import type { usePagedList } from '../../lib/api/usePagedList'
import { newId } from '../../lib/api/client'
import { hasCapability, signIn, type Capability } from '../../lib/auth/session'
import { LoadingSkeleton } from './ui'
import { locSearch } from '../../hooks/usePathRoute'

const panel = 'glass-card p-6'

export function ApiErrorPanel({ error, onRetry }: { error: ApiError | Error; onRetry?: () => void }) {
  const { title, body } = describeError(error)
  const e = error instanceof ApiError ? error : null
  return (
    <div className={panel} role="alert" data-testid="api-error" data-code={e?.code ?? 'unexpected'}>
      <div className="text-[13px] font-semibold text-[var(--c-err)]">{title}</div>
      <p className="mt-1.5 text-[13px] text-[var(--c-text-2)]">{body}</p>
      {e?.forbidden && typeof e.detail.capability === 'string' && <p className="mt-1 text-[12px] text-[var(--c-muted)]">Required capability: <b>{e.detail.capability}</b></p>}
      {e?.forbidden && typeof e.detail.scope === 'string' && <p className="mt-1 text-[12px] text-[var(--c-muted)]">Required scope: <b>{e.detail.scope}</b></p>}
      {(e?.requestId || e?.correlationId) && (
        <p className="mt-2 text-[11px] text-[var(--c-muted)] font-mono">{e.requestId ? `request ${e.requestId} · ` : ''}correlation {e.correlationId}</p>
      )}
      <div className="mt-4 flex gap-2">
        {e?.unauthenticated
          ? <button type="button" onClick={() => signIn({ returnTo: window.location.pathname + locSearch() })} className="px-3 py-1.5 rounded-lg text-[12.5px] font-semibold text-[var(--c-link)] bg-[color-mix(in_srgb,var(--c-info)_10%,transparent)] border border-[color-mix(in_srgb,var(--c-info)_40%,transparent)]">Sign in again</button>
          : onRetry && !e?.notFound && !e?.notImplemented && !e?.forbidden && <button type="button" onClick={onRetry} className="px-3 py-1.5 rounded-lg text-[12.5px] font-semibold text-[var(--c-link)] bg-[color-mix(in_srgb,var(--c-info)_10%,transparent)] border border-[color-mix(in_srgb,var(--c-info)_40%,transparent)]">Retry</button>}
      </div>
    </div>
  )
}

export function ApiView<T>({ result, empty, isEmpty, children }: {
  result: ApiResult<T> & { reload: () => void; loadedAt: Date | null }
  empty?: ReactNode
  isEmpty?: (d: T) => boolean
  children: (d: T) => ReactNode
}) {
  if (result.status === 'loading') return <LoadingSkeleton />
  if (result.status === 'error') return <ApiErrorPanel error={result.error} onRetry={result.reload} />
  if (isEmpty?.(result.data)) return <div className={`${panel} text-center text-[13.5px] text-[var(--c-text-2)]`} data-testid="api-empty">{empty ?? 'Nothing here yet.'}</div>
  return <>{children(result.data)}</>
}

export function Freshness({ loadedAt, onRefresh }: { loadedAt: Date | null; onRefresh: () => void }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-[var(--c-muted)]">
      {loadedAt && <span>Loaded {loadedAt.toLocaleTimeString()}</span>}
      <button type="button" onClick={onRefresh} className="px-2 py-1 rounded-md border border-[var(--c-border)] text-[var(--c-text-2)] hover:text-[var(--c-text)]">Refresh</button>
    </div>
  )
}

export function PagedView<T>({ list, empty, children }: { list: ReturnType<typeof usePagedList<T>>; empty: ReactNode; children: (items: T[]) => ReactNode }) {
  if (list.status === 'loading') return <LoadingSkeleton />
  if (list.status === 'error' && list.error && list.items.length === 0) return <ApiErrorPanel error={list.error} onRetry={list.reload} />
  if (list.items.length === 0) return <div className={`${panel} text-center text-[13.5px] text-[var(--c-text-2)]`} data-testid="api-empty">{empty}</div>
  return (
    <div className="glass-card p-5">
      {children(list.items)}
      <div className="mt-3 flex items-center gap-3 text-[11px] text-[var(--c-muted)]">
        <span data-testid="api-count">{list.items.length} loaded{list.hasMore ? ' · more available' : ''}</span>
        {list.error && <span role="alert" className="text-[var(--c-err)]">{describeError(list.error).title} while loading more</span>}
        {list.hasMore && <button type="button" disabled={list.status === 'more'} onClick={list.loadMore} className="ml-auto px-2.5 py-1 rounded-lg border border-[var(--c-border)] text-[var(--c-text-2)] hover:text-[var(--c-text)] disabled:opacity-50">{list.status === 'more' ? 'Loading…' : 'Load more'}</button>}
      </div>
    </div>
  )
}

// ── mutations ────────────────────────────────────────────────────────────
// Every operation button goes through this: capability check, explicit
// confirmation (destructive ones name the target and environment), required
// fields, one Idempotency-Key per dialog (a retry replays, never duplicates),
// pending state, and the server's actual result or typed error. Nothing is
// updated optimistically — the page re-reads the resource after success.
export type Field = { name: string; label: string; required?: boolean; type?: 'text' | 'textarea' | 'select' | 'number'; options?: string[]; placeholder?: string; defaultValue?: string; help?: string }

export function MutationButton<R>({ label, capability, danger, confirmTitle, confirmBody, fields = [], run, onDone, testId }: {
  label: string
  capability: Capability
  danger?: boolean
  confirmTitle: string
  confirmBody: ReactNode
  fields?: Field[]
  run: (values: Record<string, string>, idempotencyKey: string) => Promise<R>
  onDone?: (r: R) => void
  testId?: string
}) {
  const allowed = hasCapability(capability)
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" disabled={!allowed} onClick={() => setOpen(true)} data-testid={testId}
        title={allowed ? undefined : `Requires the "${capability}" capability`}
        className={`px-2.5 py-1 rounded-lg text-[12px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${danger
          ? 'text-[var(--c-err)] bg-[color-mix(in_srgb,var(--c-err)_10%,transparent)] border border-[color-mix(in_srgb,var(--c-err)_40%,transparent)] hover:bg-[color-mix(in_srgb,var(--c-err)_20%,transparent)]'
          : 'text-[var(--c-link)] bg-[color-mix(in_srgb,var(--c-info)_10%,transparent)] border border-[color-mix(in_srgb,var(--c-info)_40%,transparent)] hover:bg-[color-mix(in_srgb,var(--c-info)_20%,transparent)]'}`}>
        {label}
      </button>
      {!allowed && <span className="sr-only">Requires the {capability} capability</span>}
      {open && <ConfirmDialog title={confirmTitle} body={confirmBody} fields={fields} danger={danger} submitLabel={label} run={run}
        onClose={() => setOpen(false)} onDone={(r) => { setOpen(false); onDone?.(r) }} />}
    </>
  )
}

function ConfirmDialog<R>({ title, body, fields, danger, submitLabel, run, onClose, onDone }: {
  title: string; body: ReactNode; fields: Field[]; danger?: boolean; submitLabel: string
  run: (values: Record<string, string>, key: string) => Promise<R>; onClose: () => void; onDone: (r: R) => void
}) {
  const id = useId()
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? ''])))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<ApiError | Error | null>(null)
  const [key] = useState(() => newId('idem'))
  const dialogRef = useRef<HTMLDivElement>(null)
  const missing = fields.filter((f) => f.required && !values[f.name]?.trim()).map((f) => f.label)

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    dialogRef.current?.querySelector<HTMLElement>('input, textarea, select, button')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose()
      if (e.key === 'Tab' && dialogRef.current) { // keep focus inside the dialog
        const f = [...dialogRef.current.querySelectorAll<HTMLElement>('input, textarea, select, button:not([disabled])')]
        if (!f.length) return
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus() }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.() }
  }, [busy, onClose])

  const submit = async () => {
    if (missing.length) return
    setBusy(true); setError(null)
    try { onDone(await run(values, key)) } catch (e) { setError(e as Error) } finally { setBusy(false) }
  }
  const input = 'w-full mt-1 bg-[var(--c-card)] border border-[var(--c-border)] rounded-lg px-3 py-2 text-[13px] text-[var(--c-text)] outline-none focus:border-[color-mix(in_srgb,var(--c-info)_60%,transparent)]'
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={() => !busy && onClose()} />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={`${id}-t`} className="relative w-full max-w-md rounded-2xl border border-[var(--c-border)] p-6" style={{ background: 'var(--c-panel)' }}>
        <h2 id={`${id}-t`} className={`text-[16px] font-semibold ${danger ? 'text-[var(--c-err)]' : 'text-[var(--c-text)]'}`}>{title}</h2>
        <div className="mt-2 text-[13px] text-[var(--c-text-2)] leading-relaxed">{body}</div>
        <div className="mt-4 space-y-3">
          {fields.map((f) => (
            <label key={f.name} className="block text-[12px] text-[var(--c-text-2)]">
              {f.label}{f.required && <span aria-hidden="true" className="text-[var(--c-err)]"> *</span>}
              {f.type === 'textarea' ? <textarea required={f.required} rows={3} className={input} placeholder={f.placeholder} value={values[f.name]} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />
                : f.type === 'select' ? <select required={f.required} className={input} value={values[f.name]} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}><option value="">Choose…</option>{f.options?.map((o) => <option key={o} value={o}>{o}</option>)}</select>
                : <input required={f.required} type={f.type === 'number' ? 'number' : 'text'} className={input} placeholder={f.placeholder} value={values[f.name]} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />}
              {f.help && <span className="block mt-1 text-[11px] text-[var(--c-muted)]">{f.help}</span>}
            </label>
          ))}
        </div>
        {error && <div className="mt-4"><ApiErrorPanel error={error} /></div>}
        <p className="mt-4 text-[11px] text-[var(--c-muted)] font-mono">Idempotency-Key {key}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" disabled={busy} onClick={onClose} className="px-3 py-1.5 rounded-lg text-[12.5px] text-[var(--c-text-2)] border border-[var(--c-border)]">Cancel</button>
          <button type="button" disabled={busy || missing.length > 0} onClick={submit} data-testid="confirm-submit"
            className={`px-3 py-1.5 rounded-lg text-[12.5px] font-semibold text-[var(--c-text)] disabled:opacity-50 ${danger ? 'bg-[var(--c-err)]' : 'bg-[var(--c-info)]'}`}>
            {busy ? 'Working…' : `Confirm ${submitLabel.toLowerCase()}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// Inline success notice after a mutation (reads back the resource, not the request).
export function Notice({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <div role="status" className="mb-3 flex items-center gap-3 px-4 py-2.5 rounded-xl border border-[color-mix(in_srgb,var(--c-ok)_30%,transparent)] bg-[color-mix(in_srgb,var(--c-ok)_7%,transparent)] text-[12.5px] text-[var(--c-ok)]">
      <span>{text}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss" className="ml-auto text-[var(--c-ok)]">✕</button>
    </div>
  )
}
