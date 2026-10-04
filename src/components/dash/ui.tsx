// Dashboard shared UI primitives (Track C).
// Same design language as the public site; tables, pills, maturity labels,
// and the four-state gate (empty / loading / error / permission) used by
// every route per Dashboard Architecture §5.

import type { ReactNode } from 'react'
import type { Maturity } from '../../lib/maturity'
import { currentRouteState } from '../../lib/route-state'
import { isUsable, MATURITY_HINT } from '../../lib/maturity'
import { tint } from '../../lib/console-theme'

// ── Maturity label ─────────────────────────────────────────────────────────
const MATURITY_COLOR: Record<Maturity, string> = {
  'WIRED': 'var(--c-ok)',
  'HERMETIC ONLY': 'var(--c-info)',
  'STAGING ONLY': 'var(--c-warn)',
  'PLANNED': 'var(--c-text-2)',
  'EXTERNAL DEPENDENCY': 'var(--c-violet)',
  'PRE-LAUNCH': 'var(--c-warn)',
  'SNAPSHOT': 'var(--c-sky)',
}
export function MaturityTag({ m, className = '' }: { m: Maturity; className?: string }) {
  const c = MATURITY_COLOR[m]
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase whitespace-nowrap ${className}`}
      style={{ background: tint(c, 10), color: c, border: `1px solid ${c}44` }}
      title={MATURITY_HINT[m]}
    >
      {m}
    </span>
  )
}

// ── Action button — disabled with maturity label when not wired ────────────
export function Action({
  label, maturity, onClick, danger = false, title,
}: {
  label: string; maturity: Maturity; onClick?: () => void; danger?: boolean; title?: string
}) {
  if (!isUsable(maturity)) {
    return (
      <span className="inline-flex items-center gap-2">
        <button
          type="button"
          disabled
          title={`${MATURITY_HINT[maturity]}${title ? ` — ${title}` : ''}`}
          className="px-2.5 py-1 rounded-lg text-[12px] font-medium text-[var(--c-muted)] bg-[var(--c-card-2)] border border-[var(--c-border)] cursor-not-allowed"
        >
          {label}
        </button>
        <MaturityTag m={maturity} />
      </span>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2.5 py-1 rounded-lg text-[12px] font-semibold transition-colors ${
        danger
          ? 'text-[var(--c-err)] bg-[color-mix(in_srgb,var(--c-err)_10%,transparent)] border border-[color-mix(in_srgb,var(--c-err)_40%,transparent)] hover:bg-[color-mix(in_srgb,var(--c-err)_20%,transparent)]'
          : 'text-[var(--c-link)] bg-[color-mix(in_srgb,var(--c-info)_10%,transparent)] border border-[color-mix(in_srgb,var(--c-info)_40%,transparent)] hover:bg-[color-mix(in_srgb,var(--c-info)_20%,transparent)]'
      }`}
    >
      {label}
    </button>
  )
}

// ── Status pill ────────────────────────────────────────────────────────────
const STATE_COLOR: Record<string, string> = {
  SUCCEEDED: 'var(--c-ok)', ISSUED: 'var(--c-ok)', active: 'var(--c-ok)', ACTIVE: 'var(--c-ok)', Granted: 'var(--c-ok)', verified: 'var(--c-ok)', delivered: 'var(--c-ok)', ALLOW: 'var(--c-ok)', new: 'var(--c-ok)', RECOVERED: 'var(--c-ok)',
  FAILED: 'var(--c-err)', REFUSED: 'var(--c-err)', BLOCKED: 'var(--c-err)', Denied: 'var(--c-err)', Revoked: 'var(--c-err)', REVOKED: 'var(--c-err)', rejected: 'var(--c-err)', REFUSE: 'var(--c-err)', KILL_SWITCH: 'var(--c-err)', dropped: 'var(--c-err)', revoked: 'var(--c-err)',
  // API (contract 1.0.0) states
  GRANTED: 'var(--c-ok)', CONSUMED: 'var(--c-info)', TESTED: 'var(--c-info)', CREATED: 'var(--c-text-2)', healthy: 'var(--c-ok)', connected: 'var(--c-ok)', allow: 'var(--c-ok)', restored: 'var(--c-ok)', closed: 'var(--c-text-2)', open: 'var(--c-info)', reconciled: 'var(--c-ok)',
  DENIED: 'var(--c-err)', deny: 'var(--c-err)', unhealthy: 'var(--c-err)', expired: 'var(--c-err)', verification_failed: 'var(--c-err)',
  REQUESTED: 'var(--c-warn)', EXPIRED: 'var(--c-warn)', SUPERSEDED: 'var(--c-text-2)', require_approval: 'var(--c-warn)', awaiting_approval: 'var(--c-warn)', escalated: 'var(--c-warn)', blocked: 'var(--c-err)', pending: 'var(--c-warn)', refreshing: 'var(--c-info)', not_dispatchable: 'var(--c-text-2)', unverified_test_double: 'var(--c-warn)', not_verified: 'var(--c-text-2)',
    PENDING: 'var(--c-warn)', Pending: 'var(--c-warn)', DEGRADED: 'var(--c-warn)', degraded: 'var(--c-warn)', OUTCOME_UNKNOWN: 'var(--c-warn)', RETRY_SCHEDULED: 'var(--c-warn)', APPROVAL_REQUIRED: 'var(--c-warn)', retrying: 'var(--c-warn)', Expired: 'var(--c-warn)', SUSPENDED: 'var(--c-warn)', suspended: 'var(--c-warn)', quarantined: 'var(--c-warn)',
}
export function Pill({ v }: { v: string }) {
  if (v === '—' || v === '') return <span className="text-[var(--c-muted)]">—</span>
  const c = STATE_COLOR[v] ?? 'var(--c-text-2)'
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap" style={{ background: tint(c, 10), color: c, border: `1px solid ${c}40` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
      {v}
    </span>
  )
}

// ── Table ──────────────────────────────────────────────────────────────────
export function Table({ head, rows, mobileScroll = true }: { head: string[]; rows: ReactNode[][]; mobileScroll?: boolean }) {
  return (
    // focusable + labelled so keyboard users can scroll a wide table (axe: scrollable-region-focusable)
    <div className={mobileScroll ? 'overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[color-mix(in_srgb,var(--c-info)_60%,transparent)]' : ''}
      {...(mobileScroll ? { tabIndex: 0, role: 'region', 'aria-label': `Table: ${head.slice(0, 3).join(', ')}` } : {})}>
      <table className="w-full text-left border-collapse" style={{ minWidth: head.length > 3 ? head.length * 88 : undefined }}>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} className="text-[11.5px] font-medium text-[var(--c-muted)] pb-2 pr-4 border-b border-[var(--c-border)] whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-[var(--c-border)] hover:bg-[var(--c-card-2)] transition-colors">
              {r.map((cell, j) => (
                <td key={j} className="py-2 pr-4 text-[12.5px] text-[var(--c-text-2)] align-top whitespace-nowrap">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Page chrome ────────────────────────────────────────────────────────────
export function PageHeader({ title, sub, maturity, actions }: { title: string; sub?: string; maturity?: Maturity; actions?: ReactNode }) {
  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg md:text-[22px] font-semibold tracking-tight text-[var(--c-text)]">{title}</h1>
        {maturity && <MaturityTag m={maturity} />}
      </div>
      {sub && <p className="mt-1.5 text-[13px] text-[var(--c-text-2)] max-w-2xl leading-relaxed">{sub}</p>}
      {actions && <div className="mt-4 flex flex-wrap gap-3">{actions}</div>}
    </div>
  )
}

export function Panel({ title, children, right, className = '' }: { title?: string; children: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <section className={`glass-card p-4 ${className}`}>
      {(title || right) && (
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          {title && <h2 className="text-[12.5px] font-semibold text-[var(--c-text)] tracking-wide">{title}</h2>}
          {right}
        </div>
      )}
      {children}
    </section>
  )
}

export function Tile({ label, value, sub, tone = 'default' }: { label: string; value: ReactNode; sub?: string; tone?: 'default' | 'warn' | 'bad' | 'good' }) {
  const c = tone === 'warn' ? 'var(--c-warn)' : tone === 'bad' ? 'var(--c-err)' : tone === 'good' ? 'var(--c-ok)' : '#fff'
  return (
    <div className="glass-card p-3.5">
      <div className="text-[11.5px] text-[var(--c-muted)] font-medium">{label}</div>
      <div className="mt-1 text-[26px] leading-tight font-semibold" style={{ color: c }}>{value}</div>
      {sub && <div className="mt-1 text-[11.5px] text-[var(--c-text-2)]">{sub}</div>}
    </div>
  )
}

export function KV({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt className="text-[11.5px] text-[var(--c-muted)] font-medium">{k}</dt>
          <dd className="mt-1 text-[13px] text-[var(--c-text-2)] break-words">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

// ── Filters (visual only — fixture data is small; selects filter client-side) ─
export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2.5 mb-4">{children}</div>
}
export function Filter({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="inline-flex items-center gap-2 text-[12px] text-[var(--c-text-2)]">
      <span className="text-[var(--c-muted)]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--c-text-2)] outline-none focus:border-[color-mix(in_srgb,var(--c-info)_50%,transparent)]"
      >
        <option value="">All</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  )
}

// ── Four states (Architecture §5) ──────────────────────────────────────────
// Every route renders all four. Demo mechanism: append ?state=empty|loading|
// error|permission to any /app route. Permission renders the page with
// disabled actions and a "requires role X" note (never a bare 403).
export function EmptyState({ text, cta, href }: { text: string; cta?: string; href?: string }) {
  return (
    <div className="glass-card p-10 text-center">
      <p className="text-[14px] text-[var(--c-text-2)]">{text}</p>
      {cta && href && <a href={href} className="inline-block mt-4 text-[13px] font-semibold text-[var(--c-info)]">{cta} →</a>}
    </div>
  )
}

export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-card p-5 space-y-3" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-8 rounded-lg bg-[var(--c-card-2)] animate-pulse" style={{ animationDelay: `${i * 90}ms` }} />
      ))}
    </div>
  )
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="glass-card p-8 text-center">
      <div className="text-[13px] font-semibold text-[var(--c-err)]">PROVIDER_UNAVAILABLE</div>
      <p className="mt-2 text-[13px] text-[var(--c-text-2)]">The reference store did not answer. Typed error from the closed taxonomy — provider bodies are never shown raw.</p>
      <button type="button" onClick={onRetry ?? (() => window.location.reload())} className="mt-4 px-4 py-2 rounded-lg text-[12.5px] font-semibold text-[var(--c-link)] bg-[color-mix(in_srgb,var(--c-info)_10%,transparent)] border border-[color-mix(in_srgb,var(--c-info)_40%,transparent)] hover:bg-[color-mix(in_srgb,var(--c-info)_20%,transparent)]">Retry</button>
    </div>
  )
}

export function PermissionNote({ role }: { role: string }) {
  return (
    <div className="mb-4 flex items-start gap-3 px-4 py-3 rounded-xl border border-[color-mix(in_srgb,var(--c-warn)_30%,transparent)] bg-[color-mix(in_srgb,var(--c-warn)_6%,transparent)]">
      <span className="text-[var(--c-warn)] mt-0.5">⛨</span>
      <p className="text-[12.5px] text-[var(--c-warn)] leading-relaxed">
        You are viewing as <b>Viewer</b>. This route renders read-only — actions on this page require role <b>{role}</b>.
      </p>
    </div>
  )
}

// Wraps route content with the four-state gate.
export function StateGate({
  empty, loading, error, permission, children,
}: {
  empty: ReactNode; loading?: ReactNode; error?: ReactNode; permission?: ReactNode; children: ReactNode
}) {
  const s = currentRouteState()
  if (s === 'empty') return <>{empty}</>
  if (s === 'loading') return <>{loading ?? <LoadingSkeleton />}</>
  if (s === 'error') return <>{error ?? <ErrorState />}</>
  if (s === 'permission') return <>{permission ?? children}</>
  return <>{children}</>
}

// Row id link inside the console
export function IdLink({ to, children }: { to: string; children: ReactNode }) {
  return <a href={to} className="font-mono text-[12px] text-[var(--c-link)] hover:text-[var(--c-link)] hover:underline">{children}</a>
}
