// Dashboard shared UI primitives (Track C).
// Same design language as the public site; tables, pills, maturity labels,
// and the four-state gate (empty / loading / error / permission) used by
// every route per Dashboard Architecture §5.

import type { ReactNode } from 'react'
import type { Maturity } from '../../lib/maturity'
import { currentRouteState } from '../../lib/route-state'
import { isUsable, MATURITY_HINT } from '../../lib/maturity'

// ── Maturity label ─────────────────────────────────────────────────────────
const MATURITY_COLOR: Record<Maturity, string> = {
  'WIRED': '#21C87A',
  'HERMETIC ONLY': '#4D8DFF',
  'STAGING ONLY': '#F5A524',
  'PLANNED': '#A9B6D3',
  'EXTERNAL DEPENDENCY': '#B07BFF',
  'PRE-LAUNCH': '#F5A524',
  'SNAPSHOT': '#7DD3FC',
}
export function MaturityTag({ m, className = '' }: { m: Maturity; className?: string }) {
  const c = MATURITY_COLOR[m]
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase whitespace-nowrap ${className}`}
      style={{ background: `${c}1a`, color: c, border: `1px solid ${c}44` }}
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
          className="px-2.5 py-1 rounded-lg text-[12px] font-medium text-[#8592AE] bg-white/[0.03] border border-white/[0.07] cursor-not-allowed"
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
          ? 'text-[#FF8A8A] bg-[#EF4444]/10 border border-[#EF4444]/40 hover:bg-[#EF4444]/20'
          : 'text-[#9FB8FF] bg-[#4D8DFF]/10 border border-[#4D8DFF]/40 hover:bg-[#4D8DFF]/20'
      }`}
    >
      {label}
    </button>
  )
}

// ── Status pill ────────────────────────────────────────────────────────────
const STATE_COLOR: Record<string, string> = {
  SUCCEEDED: '#21C87A', ISSUED: '#21C87A', active: '#21C87A', ACTIVE: '#21C87A', Granted: '#21C87A', verified: '#21C87A', delivered: '#21C87A', ALLOW: '#21C87A', new: '#21C87A', RECOVERED: '#21C87A',
  FAILED: '#EF4444', REFUSED: '#EF4444', BLOCKED: '#EF4444', Denied: '#EF4444', Revoked: '#EF4444', REVOKED: '#EF4444', rejected: '#EF4444', REFUSE: '#EF4444', KILL_SWITCH: '#EF4444', dropped: '#EF4444', revoked: '#EF4444',
  // API (contract 1.0.0) states
  GRANTED: '#21C87A', CONSUMED: '#4D8DFF', TESTED: '#4D8DFF', CREATED: '#A9B6D3', healthy: '#21C87A', connected: '#21C87A', allow: '#21C87A', restored: '#21C87A', closed: '#A9B6D3', open: '#4D8DFF', reconciled: '#21C87A',
  DENIED: '#EF4444', deny: '#EF4444', unhealthy: '#EF4444', expired: '#EF4444', verification_failed: '#EF4444',
  REQUESTED: '#F5A524', EXPIRED: '#F5A524', SUPERSEDED: '#A9B6D3', require_approval: '#F5A524', awaiting_approval: '#F5A524', escalated: '#F5A524', blocked: '#EF4444', pending: '#F5A524', refreshing: '#4D8DFF', not_dispatchable: '#A9B6D3', unverified_test_double: '#F5A524', not_verified: '#A9B6D3',
    PENDING: '#F5A524', Pending: '#F5A524', DEGRADED: '#F5A524', degraded: '#F5A524', OUTCOME_UNKNOWN: '#F5A524', RETRY_SCHEDULED: '#F5A524', APPROVAL_REQUIRED: '#F5A524', retrying: '#F5A524', Expired: '#F5A524', SUSPENDED: '#F5A524', suspended: '#F5A524', quarantined: '#F5A524',
}
export function Pill({ v }: { v: string }) {
  if (v === '—' || v === '') return <span className="text-[#8592AE]">—</span>
  const c = STATE_COLOR[v] ?? '#A9B6D3'
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap" style={{ background: `${c}1a`, color: c, border: `1px solid ${c}40` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
      {v}
    </span>
  )
}

// ── Table ──────────────────────────────────────────────────────────────────
export function Table({ head, rows, mobileScroll = true }: { head: string[]; rows: ReactNode[][]; mobileScroll?: boolean }) {
  return (
    // focusable + labelled so keyboard users can scroll a wide table (axe: scrollable-region-focusable)
    <div className={mobileScroll ? 'overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#4D8DFF]/60' : ''}
      {...(mobileScroll ? { tabIndex: 0, role: 'region', 'aria-label': `Table: ${head.slice(0, 3).join(', ')}` } : {})}>
      <table className="w-full text-left border-collapse min-w-[640px]">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} className="text-[10.5px] uppercase tracking-[0.12em] text-[#8592AE] font-semibold pb-2.5 pr-4 border-b border-white/[0.07] whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
              {r.map((cell, j) => (
                <td key={j} className="py-2 pr-4 text-[12.5px] text-[#C7D2EA] align-top whitespace-nowrap">{cell}</td>
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
        <h1 className="text-lg md:text-[22px] font-semibold tracking-tight text-white">{title}</h1>
        {maturity && <MaturityTag m={maturity} />}
      </div>
      {sub && <p className="mt-1.5 text-[13px] text-[#A9B6D3] max-w-2xl leading-relaxed">{sub}</p>}
      {actions && <div className="mt-4 flex flex-wrap gap-3">{actions}</div>}
    </div>
  )
}

export function Panel({ title, children, right, className = '' }: { title?: string; children: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <section className={`glass-card p-4 ${className}`}>
      {(title || right) && (
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          {title && <h2 className="text-[12.5px] font-semibold text-white tracking-wide">{title}</h2>}
          {right}
        </div>
      )}
      {children}
    </section>
  )
}

export function Tile({ label, value, sub, tone = 'default' }: { label: string; value: ReactNode; sub?: string; tone?: 'default' | 'warn' | 'bad' | 'good' }) {
  const c = tone === 'warn' ? '#F5A524' : tone === 'bad' ? '#EF4444' : tone === 'good' ? '#21C87A' : '#fff'
  return (
    <div className="glass-card p-3.5">
      <div className="text-[10.5px] uppercase tracking-[0.12em] text-[#8592AE] font-semibold">{label}</div>
      <div className="mt-1 text-[26px] leading-tight font-semibold" style={{ color: c }}>{value}</div>
      {sub && <div className="mt-1 text-[11.5px] text-[#A9B6D3]">{sub}</div>}
    </div>
  )
}

export function KV({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt className="text-[10.5px] uppercase tracking-[0.12em] text-[#8592AE] font-semibold">{k}</dt>
          <dd className="mt-1 text-[13px] text-[#C7D2EA] break-words">{v}</dd>
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
    <label className="inline-flex items-center gap-2 text-[12px] text-[#A9B6D3]">
      <span className="text-[#8592AE]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-[#0d1430] border border-white/[0.09] rounded-lg px-2.5 py-1.5 text-[12px] text-[#C7D2EA] outline-none focus:border-[#4D8DFF]/50"
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
      <p className="text-[14px] text-[#A9B6D3]">{text}</p>
      {cta && href && <a href={href} className="inline-block mt-4 text-[13px] font-semibold text-[#5A7BFF]">{cta} →</a>}
    </div>
  )
}

export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-card p-5 space-y-3" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-8 rounded-lg bg-white/[0.04] animate-pulse" style={{ animationDelay: `${i * 90}ms` }} />
      ))}
    </div>
  )
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="glass-card p-8 text-center">
      <div className="text-[13px] font-semibold text-[#FF8A8A]">PROVIDER_UNAVAILABLE</div>
      <p className="mt-2 text-[13px] text-[#A9B6D3]">The reference store did not answer. Typed error from the closed taxonomy — provider bodies are never shown raw.</p>
      <button type="button" onClick={onRetry ?? (() => window.location.reload())} className="mt-4 px-4 py-2 rounded-lg text-[12.5px] font-semibold text-[#9FB8FF] bg-[#4D8DFF]/10 border border-[#4D8DFF]/40 hover:bg-[#4D8DFF]/20">Retry</button>
    </div>
  )
}

export function PermissionNote({ role }: { role: string }) {
  return (
    <div className="mb-4 flex items-start gap-3 px-4 py-3 rounded-xl border border-[#F5A524]/30 bg-[#F5A524]/[0.06]">
      <span className="text-[#F5A524] mt-0.5">⛨</span>
      <p className="text-[12.5px] text-[#E8C98A] leading-relaxed">
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
  return <a href={to} className="font-mono text-[12px] text-[#7EA2FF] hover:text-[#9FB8FF] hover:underline">{children}</a>
}
