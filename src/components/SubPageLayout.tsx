import { ContactForm } from './ContactForm'
import { AREA_LINKS, AREA_ROUTES, type SubPage, type Section } from '../lib/subpages'
import { ArchDiagram, LifecycleDiagram, StateMachine, TwoColDiagram, FlowRow, TenantBoundaryDiagram, CredentialFlowDiagram, WebhookPipelineDiagram, RSeriesFlow } from './Diagrams'
import { StatusCallout } from './StatusCallout'
import { LIFECYCLE_10, MODE_BOUNDARIES } from '../lib/lifecycle'

const APPROVAL_STATES = [
  { name: 'GRANTED', color: '#047857', note: 'human approved the exact step' },
  { name: 'DENIED', color: '#B91C1C', note: 'human rejected the step' },
  { name: 'CONSUMED', color: '#2850D8', note: 'used by exactly one dispatch' },
  { name: 'EXPIRED', color: '#B45309', note: 'window lapsed before use' },
  { name: 'REVOKED', color: '#B91C1C', note: 'withdrawn before use' },
  { name: 'SUPERSEDED', color: '#1E40AF', note: 'plan changed; approval no longer matches' },
]

const EXECUTION_STATES = [
  { name: 'SUCCEEDED', color: '#047857', note: 'provider confirmed the effect' },
  { name: 'FAILED', color: '#B91C1C', note: 'attempt failed; evidence attached' },
  { name: 'OUTCOME_UNKNOWN', color: '#B45309', note: 'possible write unconfirmed; reconcile first' },
  { name: 'RETRY_SCHEDULED', color: '#2850D8', note: 'bounded retry queued' },
  { name: 'RETRY_EXHAUSTED', color: '#B45309', note: 'limits reached; escalation opens' },
  { name: 'PROVIDER_UNAVAILABLE', color: '#B45309', note: 'declared and monitored' },
  { name: 'REFUSED', color: '#B91C1C', note: 'policy refused before execution' },
  { name: 'BLOCKED', color: '#B91C1C', note: 'kill, suspension or revocation stopped it' },
]

function Diagram({ kind }: { kind: NonNullable<Section['diagram']> }) {
  switch (kind) {
    case 'architecture':
      return <ArchDiagram />
    case 'lifecycle':
      return <LifecycleDiagram stages={LIFECYCLE_10} modeBoundary={MODE_BOUNDARIES} />
    case 'approval-sm':
      return <StateMachine title="Approval state machine" start="REQUESTED" states={APPROVAL_STATES} accent="#B45309" />
    case 'execution-sm':
      return <StateMachine title="Execution state machine" start="STARTED" states={EXECUTION_STATES} accent="#2850D8" />
    case 'retry-flow':
      return (
        <div className="glass-panel p-6 space-y-4">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#B45309]">Retry / reconciliation flow</div>
          <FlowRow items={['Write sent', 'Timeout after possible write', 'OUTCOME_UNKNOWN', 'Governed reconciliation read']} />
          <div className="grid sm:grid-cols-3 gap-2.5">
            <div className="px-3 py-2.5 rounded-lg text-center" style={{ background: '#FFFFFF', border: '1px solid #21C87A44' }}>
              <div className="text-[11.5px] font-semibold text-[#047857]">Effect found</div>
              <div className="text-[10px] text-[#566074] mt-1">RECOVERED — no retry, no duplicate</div>
            </div>
            <div className="px-3 py-2.5 rounded-lg text-center" style={{ background: '#FFFFFF', border: '1px solid #4D8DFF44' }}>
              <div className="text-[11.5px] font-semibold text-[#2850D8]">Effect absent</div>
              <div className="text-[10px] text-[#566074] mt-1">safe retry, contract permitting</div>
            </div>
            <div className="px-3 py-2.5 rounded-lg text-center" style={{ background: '#FFFFFF', border: '1px solid #F5A52444' }}>
              <div className="text-[11.5px] font-semibold text-[#B45309]">Still unknown</div>
              <div className="text-[10px] text-[#566074] mt-1">escalate — no automatic retry</div>
            </div>
          </div>
        </div>
      )
    case 'evidence-path':
      return <TwoColDiagram leftTitle="Execution" left={['ExecutionEngine attempt', 'EXEC-FACT emitted', 'one fact per attempt']} rightTitle="Evidence" right={['Evidence Client', 'R-Series', 'one cos-ops receipt per fact', 'chain link per run', 'verify / audit']} />
    case 'connection-lifecycle':
      return (
        <div className="glass-panel p-6">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#0E7490] mb-4">Connection lifecycle</div>
          <FlowRow accent="#0E7490" items={['Provider account', 'Connect', 'Test', 'Active (tenant-bound)', 'Suspended', 'Revoked']} />
          <div className="mt-3 text-[11px] text-[#566074]">Scopes recorded at authorize time · credential reference bound to routing context · revocation takes effect at the next dispatch check</div>
        </div>
      )
    case 'org-model':
      return <TwoColDiagram leftTitle="Organization (tenant boundary)" left={['Policy floor', 'Roles', 'Org-level kill (dual control)', 'Audit ownership', 'Environments']} rightTitle="Workspace (refinement)" right={['Connections', 'Agents', 'Policies within the floor', 'Workspace roles', 'Execution & receipt views']} leftAccent="#1E40AF" rightAccent="#2850D8" />
    case 'tenant-boundary':
      return <TenantBoundaryDiagram />
    case 'credential-flow':
      return <CredentialFlowDiagram />
    case 'webhook-pipeline':
      return <WebhookPipelineDiagram />
    case 'rseries-flow':
      return <RSeriesFlow />
    default:
      return null
  }
}

function Table({ t, caption }: { t: NonNullable<Section['table']>; caption?: string }) {
  return (
    <div className="mt-6 max-w-3xl glass-panel overflow-hidden overflow-x-auto" role="table" aria-label={caption}>
      <div role="row" className="grid px-5 py-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#566074] border-b border-[#E3E7EE]" style={{ gridTemplateColumns: `repeat(${t.head.length}, minmax(120px, 1fr))` }}>
        {t.head.map((h) => <span key={h} role="columnheader">{h}</span>)}
      </div>
      {t.rows.map((r, i) => (
        <div key={i} role="row" className="grid px-5 py-3 border-b border-[#E3E7EE] last:border-0" style={{ gridTemplateColumns: `repeat(${t.head.length}, minmax(120px, 1fr))` }}>
          {r.map((cell, j) => (
            <span key={j} role="cell" className={`text-[12px] leading-relaxed ${j === 0 ? 'text-[#1E2638] font-medium' : 'text-[#3A4357]'}`}>{cell}</span>
          ))}
        </div>
      ))}
    </div>
  )
}

function SectionBlock({ s }: { s: Section }) {
  return (
    <section className="mt-12">
      <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-[#0B1220]">{s.h}</h2>
      {s.diagram && <div className="mt-6 max-w-3xl"><Diagram kind={s.diagram} /></div>}
      {s.p?.map((t, i) => <p key={i} className="mt-4 text-[14px] leading-relaxed text-[#3A4357] max-w-3xl">{t}</p>)}
      {s.flow && <div className="mt-6"><FlowRow items={s.flow} /></div>}
      {s.ul && (
        <ul className="mt-5 space-y-2.5 max-w-3xl">
          {s.ul.map((u) => (
            <li key={u} className="flex gap-3 text-[13.5px] leading-relaxed text-[#3A4357]">
              <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-[#2850D8] shrink-0" />{u}
            </li>
          ))}
        </ul>
      )}
      {s.table && <Table t={s.table} caption={s.h} />}
      {s.code && (
        <div className="mt-6 max-w-3xl">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#566074] mb-2">Conceptual — contract frozen (EXEC-FACTS v1.0.0 / Manifest 1.3.0 / Webhook 1.0.0); public API surface pending</div>
          <pre tabIndex={0} aria-label={`Code: ${s.h}`} className="dcs-code overflow-x-auto"><code>{s.code}</code></pre>
        </div>
      )}
      {s.note && (
        <div className="mt-6 max-w-3xl px-4 py-3 rounded-xl text-[12.5px] leading-relaxed text-[#3A4357]" style={{ background: 'rgba(245,165,36,0.07)', border: '1px solid rgba(245,165,36,0.25)' }}>{s.note}</div>
      )}
    </section>
  )
}

export function SubPageLayout({ page, current }: { page: SubPage; current: string }) {
  const links = AREA_LINKS[page.area] ?? []
  const home = AREA_ROUTES[page.area] ?? '/'
  const next = page.next ?? []
  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-[1400px] px-8">
        <div className="text-[12px] text-[#566074]">
          <a href={`${home}`} className="hover:text-[#0B1220] transition-colors">{page.area}</a>
          <span className="mx-2">/</span>
          <span className="text-[#3A4357]">{page.title}</span>
        </div>
        <div className="mt-6 grid lg:grid-cols-[minmax(0,1fr)_240px] gap-12">
          <div>
            <div className="eyebrow mb-4">{page.area}</div>
            <h1 className="text-3xl md:text-[40px] font-semibold tracking-tight text-[#0B1220] leading-tight">{page.title}</h1>
            {page.badge && (
              <span className="inline-block mt-3 text-[10.5px] font-bold px-2.5 py-1 rounded-full tracking-wide" style={page.badge === 'PRE-LAUNCH' ? { color: '#92400E', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.4)' } : page.badge === 'PLANNED' ? { color: '#566074', background: '#F5F7FB', border: '1px solid #E3E7EE' } : { color: '#065F46', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.4)' }}>{page.badge}</span>
            )}
            <p className="mt-4 text-[15px] leading-relaxed text-[#3A4357] max-w-2xl">{page.tagline}</p>
            {page.sections.map((s) => <SectionBlock key={s.h} s={s} />)}
            {page.form?.kind === 'contact' && <div className="mt-12"><ContactForm defaultTopic={page.form.topic} /></div>}
            {!page.noStatus && <StatusCallout route={current} />}
            {next.length > 0 ? (
              <div className="mt-12 grid sm:grid-cols-2 gap-4 max-w-3xl">
                {next.map(([to, label]) => (
                  <a key={to} href={`${to}`} className="glass-card glass-card-hover px-5 py-4 flex items-center justify-between group">
                    <span>
                      <span className="block text-[10px] uppercase tracking-[0.14em] text-[#566074]">Next</span>
                      <span className="block text-[13.5px] font-medium text-[#1E2638] group-hover:text-[#0B1220] transition-colors mt-1">{label}</span>
                    </span>
                    <span className="text-[#2850D8] group-hover:translate-x-0.5 transition-transform">→</span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="mt-14 glass-panel p-6 flex flex-wrap items-center justify-between gap-4 max-w-3xl">
                <div>
                  <div className="text-[15px] font-semibold text-[#0B1220]">Explore the rest of {page.area}</div>
                  <div className="text-[12.5px] text-[#566074] mt-1">Every page in this area covers one real part of the platform.</div>
                </div>
                <a href={`${home}`} className="cta-secondary">{page.area} overview →</a>
              </div>
            )}
          </div>
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#566074] mb-3">{page.area}</div>
              <nav className="space-y-0.5">
                {links.map(([to, label]) => (
                  <a key={to} href={`${to}`} className={`block px-3 py-2 rounded-lg text-[12.5px] transition-colors ${to === current ? 'text-[#0B1220] font-medium' : 'text-[#3A4357] hover:text-[#0B1220]'}`} style={to === current ? { background: '#EDF2FF', border: '1px solid #E3E7EE' } : { border: '1px solid transparent' }}>{label}</a>
                ))}
              </nav>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
