// §4.1 + Handoff Design 02 §5 — Overview, pixel-close to the reference PNG.
// Truthful variant: "live" language replaced — data is from the integrated
// build's reference stores (HERMETIC ONLY), per handoff §5.2 / §13.

import { Panel, Pill, IdLink, EmptyState, StateGate, PermissionNote, MaturityTag } from '../../components/dash/ui'
import { APPROVALS, RUNS, CONNECTIONS, USAGE, fmtConn } from '../../lib/fixtures'
import { tint } from '../../lib/console-theme'

// ── Donut chart (SVG, accessible text equivalent below) ────────────────────
function Donut({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0)
  const R = 52, C = 2 * Math.PI * R
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="relative shrink-0">
        <svg width="112" height="112" viewBox="0 0 128 128" role="img" aria-label={`Runs by outcome: ${parts.map((p) => `${p.label} ${p.value}`).join(', ')}`}>
          <circle cx="64" cy="64" r={R} fill="none" stroke="var(--c-card)" strokeWidth="16" />
          {parts.map((p, idx) => {
            const frac = total ? p.value / total : 0
            const dash = `${frac * C} ${C}`
            const startOffset = parts.slice(0, idx).reduce((acc, x) => acc + (total ? x.value / total : 0), 0)
            return (
              <circle key={p.label} cx="64" cy="64" r={R} fill="none" stroke={p.color} strokeWidth="16"
                strokeDasharray={dash} strokeDashoffset={-startOffset * C} transform="rotate(-90 64 64)" strokeLinecap="butt" />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-[var(--c-text)]">{total}</span>
          <span className="text-[10px] text-[var(--c-muted)]">total runs</span>
        </div>
      </div>
      <ul className="w-full space-y-1.5">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-2 text-[12.5px]">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="min-w-0 truncate text-[var(--c-text-2)]">{p.label}</span>
            <span className="ml-auto text-[var(--c-text)] font-semibold tabular-nums">{p.value}</span>
            <span className="w-9 text-right text-[var(--c-muted)] tabular-nums">{total ? Math.round((p.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Receipts bar chart (SVG; exact values exposed textually) ───────────────
function Bars({ data }: { data: { h: string; issued: number; pending: number; failed: number }[] }) {
  const W = 340, H = 110, max = Math.max(...data.map((d) => d.issued + d.pending + d.failed), 1)
  const bw = W / data.length
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H + 16}`} role="img" aria-label={data.map((d) => `${d.h}: issued ${d.issued}, pending ${d.pending}, failed ${d.failed}`).join('; ')}>
        {[0, 5, 10, 15, 20].map((t) => (
          <g key={t}>
            <line x1="0" x2={W} y1={H - (t / max) * H} y2={H - (t / max) * H} stroke="var(--c-card)" strokeWidth="1" />
            <text x="0" y={H - (t / max) * H - 2} fill="var(--c-muted)" fontSize="7">{t}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = i * bw + bw * 0.2, w = bw * 0.6
          const hi = (d.issued / max) * H, hp = (d.pending / max) * H, hf = (d.failed / max) * H
          return (
            <g key={d.h}>
              <rect x={x} y={H - hi} width={w} height={hi} rx="1.5" fill="var(--c-ok)" opacity="0.9" />
              {hp > 0 && <rect x={x} y={H - hi - hp - 1} width={w} height={hp} rx="1" fill="var(--c-warn)" />}
              {hf > 0 && <rect x={x} y={H - hi - hp - hf - 2} width={w} height={hf} rx="1" fill="var(--c-err)" />}
            </g>
          )
        })}
        <text x="0" y={H + 12} fill="var(--c-muted)" fontSize="7.5">00:00</text>
        <text x={W / 3} y={H + 12} fill="var(--c-muted)" fontSize="7.5">06:00</text>
        <text x={(W / 3) * 2} y={H + 12} fill="var(--c-muted)" fontSize="7.5">12:00</text>
        <text x={W - 26} y={H + 12} fill="var(--c-muted)" fontSize="7.5">18:00</text>
      </svg>
      <div className="mt-2 flex items-center gap-4 text-[11px]">
        <span className="flex items-center gap-1.5 text-[var(--c-text-2)]"><span className="w-2 h-2 rounded-full bg-[var(--c-ok)]" /> Issued ({SERIES_TOTALS.issued})</span>
        <span className="flex items-center gap-1.5 text-[var(--c-text-2)]"><span className="w-2 h-2 rounded-full bg-[var(--c-warn)]" /> Pending ({SERIES_TOTALS.pending})</span>
        <span className="flex items-center gap-1.5 text-[var(--c-text-2)]"><span className="w-2 h-2 rounded-full bg-[var(--c-err)]" /> Failed ({SERIES_TOTALS.failed})</span>
      </div>
    </div>
  )
}

// 24 hourly buckets, deterministic from fixture counts
const RECEIPT_SERIES = Array.from({ length: 24 }, (_, h) => ({
  h: `${h}`, issued: [0,0,1,0,2,0,3,1,4,2,5,3,6,4,8,5,9,6,11,7,10,6,4,2][h] ?? 0,
  pending: h === 19 ? 1 : 0, failed: h === 21 ? 1 : 0,
}))
// Every figure on the receipts panel is computed from the series it labels —
// no free-standing percentages.
const SERIES_TOTALS = RECEIPT_SERIES.reduce((a, d) => ({ issued: a.issued + d.issued, pending: a.pending + d.pending, failed: a.failed + d.failed }), { issued: 0, pending: 0, failed: 0 })
const SERIES_PEAK = RECEIPT_SERIES.reduce((m, d) => (d.issued > m.issued ? d : m), RECEIPT_SERIES[0])
const ISSUANCE_RATE = (100 * SERIES_TOTALS.issued / Math.max(1, SERIES_TOTALS.issued + SERIES_TOTALS.pending + SERIES_TOTALS.failed)).toFixed(1)

// Runs-by-outcome is derived from the run store (5 fixture runs), not typed in.
const RUN_OUTCOMES = [
  { label: 'Succeeded', value: RUNS.filter((r) => r.execution_outcome === 'SUCCEEDED').length, color: 'var(--c-ok)' },
  { label: 'Outcome unknown', value: RUNS.filter((r) => r.execution_outcome === 'OUTCOME_UNKNOWN').length, color: 'var(--c-warn)' },
  { label: 'Refused', value: RUNS.filter((r) => r.execution_outcome === 'REFUSED').length, color: 'var(--c-err)' },
  { label: 'No execution yet', value: RUNS.filter((r) => r.execution_outcome === '—').length, color: 'var(--c-muted)' },
]
const CLOSED_RUNS = RUN_OUTCOMES.slice(0, 3).reduce((s, p) => s + p.value, 0)

const SEV: Record<string, string> = { HIGH: 'var(--c-err)', MEDIUM: 'var(--c-warn)', LOW: 'var(--c-info)' }

export function DashOverview() {
  const pending = APPROVALS.filter((a) => a.state === 'Pending')
  const health = { active: CONNECTIONS.filter((c) => c.health === 'active').length, degraded: CONNECTIONS.filter((c) => c.health === 'degraded').length, suspended: CONNECTIONS.filter((c) => c.health === 'suspended').length }

  return (
    <StateGate
      empty={<EmptyState text="No activity in this workspace yet." cta="Connect your first provider" href="/app/connections/new" />}
      permission={<><PermissionNote role="Approver" /><Body pending={pending} health={health} readonly /></>}
    >
      <Body pending={pending} health={health} />
    </StateGate>
  )
}

function Body({ pending, health, readonly = false }: { pending: typeof APPROVALS; health: Record<string, number>; readonly?: boolean }) {
  const live = RUNS.filter((r) => r.stage < 10)
  return (
    <div>
      {/* §5.2 title row — non-wrapping: status cluster locked top-right on desktop,
          stacks compactly below title on mobile (explicit breakpoint, never accidental wrap) */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] items-start gap-2 md:gap-3 mb-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl md:text-[22px] font-semibold tracking-tight text-[var(--c-text)]">Operations overview</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-[color-mix(in_srgb,var(--c-warn)_12%,transparent)] text-[var(--c-warn)] border border-[color-mix(in_srgb,var(--c-warn)_35%,transparent)]">Staging</span>
            <MaturityTag m="HERMETIC ONLY" />
          </div>
          <p className="mt-0.5 text-[12px] text-[var(--c-text-2)]">Reference view across connectors, agent runs and receipts — fixture data from the hermetic reference stores, not live telemetry.</p>
        </div>
        <div className="md:text-right md:justify-self-end">
          <div className="text-[10.5px] text-[var(--c-muted)]">Hermetic reference data · Not production</div>
          <div className="mt-0.5 flex items-center gap-2.5 md:justify-end">
            <span className="text-[10.5px] text-[var(--c-muted)]">Fixture snapshot <span className="text-[var(--c-text-2)]">2026-09-27</span></span>
            <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[var(--c-muted)]"><span className="w-2 h-2 rounded-full bg-[var(--c-subtle)]" /> Static — no refresh source</span>
          </div>
        </div>
      </div>

      {/* §5.3 KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-3">
        {([
          { label: 'Connections', value: CONNECTIONS.length, sub: `${health.active} healthy · ${health.degraded} degraded · ${health.suspended} suspended`, href: '/app/connections', icon: 'link', color: 'var(--c-info)' },
          { label: 'Runs (open)', value: live.length, sub: `${RUNS.length} total in store`, href: '/app/agents', icon: 'play', color: 'var(--c-ok)' },
          { label: 'Receipts issued', value: USAGE.receipts_issued, sub: `${USAGE.receipts_pending} pending · ${USAGE.receipts_failed} failed`, href: '/app/receipts', icon: 'doc', color: 'var(--c-violet)' },
          { label: 'Executions (24h)', value: USAGE.executions_24h, sub: `${USAGE.failed_24h} failed · ${USAGE.reconciled_24h} reconciled`, href: '/app/executions', icon: 'clock', color: 'var(--c-info)' },
        ] as const).map((k) => (
          <a key={k.label} href={k.href} className="group rounded-xl border border-[var(--c-border)] bg-[color-mix(in_srgb,var(--c-card)_80%,transparent)] p-3.5 hover:border-[color-mix(in_srgb,var(--c-info)_30%,transparent)] transition-colors">
            <div className="flex items-start justify-between">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: tint(k.color, 10), border: `1px solid ${k.color}33` }}>
                {k.icon === 'link' && <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M8 12a3.5 3.5 0 0 0 5 .3l2-2a3.5 3.5 0 0 0-5-5l-1 1M12 8a3.5 3.5 0 0 0-5-.3l-2 2a3.5 3.5 0 0 0 5 5l1-1" stroke={k.color} strokeWidth="1.5" strokeLinecap="round" /></svg>}
                {k.icon === 'play' && <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M6 4.5v11l9-5.5-9-5.5Z" stroke={k.color} strokeWidth="1.5" strokeLinejoin="round" /></svg>}
                {k.icon === 'doc' && <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M6 3h5l4 4v10H6V3Zm5 0v4h4" stroke={k.color} strokeWidth="1.5" strokeLinejoin="round" /></svg>}
                {k.icon === 'clock' && <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke={k.color} strokeWidth="1.5" /><path d="M10 6.5V10l2.5 2" stroke={k.color} strokeWidth="1.5" strokeLinecap="round" /></svg>}
              </span>
              <span className="text-[var(--c-muted)] group-hover:text-[var(--c-info)] transition-colors">›</span>
            </div>
            <div className="mt-2 text-[12.5px] font-medium text-[var(--c-text-2)]">{k.label}</div>
            <div className="text-[28px] leading-tight font-semibold text-[var(--c-text)]">{k.value}</div>
            <div className="mt-0.5 text-[11px] text-[var(--c-muted)]">{k.sub}</div>
          </a>
        ))}
      </div>

      {/* §5.4 three-panel operational row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3.5">
        <Panel title="Action queue" className="flex flex-col" right={<span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[color-mix(in_srgb,var(--c-err)_15%,transparent)] text-[var(--c-err)] border border-[color-mix(in_srgb,var(--c-err)_30%,transparent)]">3 items</span>}>
          <ul className="space-y-2.5">
            {[
              { id: 'ex_01J2K30', label: 'Receipt reconciliation required', sev: 'HIGH', age: '5 min ago', to: '/app/executions/ex_01J2K30' },
              { id: pending[0]?.id ?? 'ap_01J1K71', label: 'Finance refund approval needed', sev: 'MEDIUM', age: '12 min ago', to: `/app/approvals/${pending[0]?.id ?? 'ap_01J1K71'}` },
              { id: 'ex_01J2P88', label: 'Dispatch timed out', sev: 'MEDIUM', age: '18 min ago', to: '/app/executions/ex_01J2P88' },
            ].map((it) => (
              <li key={it.id}>
                <a href={it.to} className="flex items-start gap-3 group">
                  <span className="mt-0.5 w-7 h-7 rounded-lg bg-[var(--c-card-2)] border border-[var(--c-border)] flex items-center justify-center shrink-0">
                    <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M6 3h5l4 4v10H6V3Zm5 0v4h4" stroke="var(--c-subtle)" strokeWidth="1.4" strokeLinejoin="round" /></svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-[12px] text-[var(--c-link)] group-hover:underline truncate">{it.id}</span>
                    <span className="block text-[12px] text-[var(--c-text-2)] leading-snug truncate max-w-[220px]" title={it.label}>{it.label}</span>
                  </span>
                  <span className="text-right shrink-0">
                    <span className="block px-1.5 py-0.5 rounded text-[9.5px] font-bold" style={{ color: SEV[it.sev], background: tint(SEV[it.sev], 10), border: `1px solid ${SEV[it.sev]}44` }}>{it.sev}</span>
                    <span className="block mt-1 text-[10.5px] text-[var(--c-muted)]">{it.age}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-2.5 border-t border-[var(--c-border)]"><a href="/app/approvals" className="text-[12px] font-semibold text-[var(--c-info)]">View all approvals →</a></div>
        </Panel>

        <Panel title="Runs by outcome (run store)" className="flex flex-col">
          <div className="flex-1 flex items-center">
            <Donut parts={RUN_OUTCOMES} />
          </div>
          <div className="mt-3 pt-2.5 border-t border-[var(--c-border)] flex justify-between text-[10.5px] text-[var(--c-muted)]">
            <span>Succeeded {RUN_OUTCOMES[0].value} of {CLOSED_RUNS} with an outcome</span><span>{RUN_OUTCOMES[1].value} awaiting reconciliation</span>
          </div>
        </Panel>

        <Panel title="Receipts by hour (fixture series)" right={<span className="text-xl font-semibold text-[var(--c-text)]">{SERIES_TOTALS.issued}</span>} className="flex flex-col">
          <div className="flex-1 flex flex-col justify-center">
            <Bars data={RECEIPT_SERIES} />
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-[var(--c-border)] flex justify-between text-[10.5px] text-[var(--c-muted)]">
            <span>Peak {SERIES_PEAK.issued}/h at {SERIES_PEAK.h.padStart(2, '0')}:00</span><span>Issued {ISSUANCE_RATE}% of receipt attempts</span>
          </div>
        </Panel>
      </div>

      {/* §5.5 runs by stage — wide table */}
      <Panel title="Runs by stage" right={<a href="/app/agents" className="text-[12px] font-semibold text-[var(--c-info)]">View all runs →</a>}>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr>{['Run', 'Connector', 'Agent', 'Stage', 'Outcome', 'Start time', 'Duration'].map((h) => (
                <th key={h} className="text-[11.5px] font-medium text-[var(--c-muted)] pb-2 pr-4 border-b border-[var(--c-border)] whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {RUNS.map((r) => (
                <tr key={r.id} className="border-b border-[var(--c-border)] hover:bg-[var(--c-card-2)] cursor-pointer" onClick={() => { window.history.pushState({}, '', `/app/agents/runs/${r.id}`); window.dispatchEvent(new PopStateEvent('popstate')) }}>
                  <td className="py-2 pr-4"><IdLink to={`/app/agents/runs/${r.id}`}>{r.id}</IdLink></td>
                  <td className="py-2 pr-4 text-[12.5px] text-[var(--c-text-2)]">{r.connectors.map(fmtConn).join(', ')}</td>
                  <td className="py-2 pr-4 text-[12.5px] text-[var(--c-text-2)]">{r.agent}</td>
                  <td className="py-2 pr-4 text-[12.5px] text-[var(--c-text-2)]">{r.stage}/10</td>
                  <td className="py-2 pr-4"><Pill v={r.execution_outcome} /></td>
                  <td className="py-2 pr-4 text-[12px] text-[var(--c-text-2)]">{r.started}</td>
                  <td className="py-2 text-[12px] text-[var(--c-text-2)]">{({ run_01J0AA11: '2m 14s', run_01J0A9ZK: '4m 02s', run_01J0A7QM: '6m 18s', run_01J0A5TT: '1m 03s', run_01J0A3BB: '3m 27s' } as Record<string, string>)[r.id] ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {readonly && <p className="mt-3 text-[11.5px] text-[var(--c-muted)]">Viewer role — read-only.</p>}
    </div>
  )
}
