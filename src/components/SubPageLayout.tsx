import { ContactForm } from './ContactForm'
import { AREA_LINKS, AREA_ROUTES, type SubPage, type Section } from '../lib/subpages'
import { ArchDiagram, LifecycleDiagram, StateMachine, TwoColDiagram, FlowRow, TenantBoundaryDiagram, CredentialFlowDiagram, WebhookPipelineDiagram, RSeriesFlow } from './Diagrams'
import { StatusCallout } from './StatusCallout'
import { LIFECYCLE_10, MODE_BOUNDARIES } from '../lib/lifecycle'

const APPROVAL_STATES = [
  { name: 'GRANTED', color: '#21C87A', note: 'human approved the exact step' },
  { name: 'DENIED', color: '#EF4444', note: 'human rejected the step' },
  { name: 'CONSUMED', color: '#4D8DFF', note: 'used by exactly one dispatch' },
  { name: 'EXPIRED', color: '#F5A524', note: 'window lapsed before use' },
  { name: 'REVOKED', color: '#EF4444', note: 'withdrawn before use' },
  { name: 'SUPERSEDED', color: '#8B5CF6', note: 'plan changed; approval no longer matches' },
]

const EXECUTION_STATES = [
  { name: 'SUCCEEDED', color: '#21C87A', note: 'provider confirmed the effect' },
  { name: 'FAILED', color: '#EF4444', note: 'attempt failed; evidence attached' },
  { name: 'OUTCOME_UNKNOWN', color: '#F5A524', note: 'possible write unconfirmed; reconcile first' },
  { name: 'RETRY_SCHEDULED', color: '#4D8DFF', note: 'bounded retry queued' },
  { name: 'RETRY_EXHAUSTED', color: '#F5A524', note: 'limits reached; escalation opens' },
  { name: 'PROVIDER_UNAVAILABLE', color: '#F5A524', note: 'declared and monitored' },
  { name: 'REFUSED', color: '#EF4444', note: 'policy refused before execution' },
  { name: 'BLOCKED', color: '#EF4444', note: 'kill, suspension or revocation stopped it' },
]

function Diagram({ kind }: { kind: NonNullable<Section['diagram']> }) {
  switch (kind) {
    case 'architecture':
      return <ArchDiagram />
    case 'lifecycle':
      return <LifecycleDiagram stages={LIFECYCLE_10} modeBoundary={MODE_BOUNDARIES} />
    case 'approval-sm':
      return <StateMachine title="Approval state machine" start="REQUESTED" states={APPROVAL_STATES} accent="#F5A524" />
    case 'execution-sm':
      return <StateMachine title="Execution state machine" start="STARTED" states={EXECUTION_STATES} accent="#5A7BFF" />
    case 'retry-flow':
      return (
        <div className="glass-panel p-6 space-y-4">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#F5A524]">Retry / reconciliation flow</div>
          <FlowRow items={['Write sent', 'Timeout after possible write', 'OUTCOME_UNKNOWN', 'Governed reconciliation read']} />
          <div className="grid sm:grid-cols-3 gap-2.5">
            <div className="px-3 py-2.5 rounded-lg text-center" style={{ background: 'rgba(6,10,22,0.6)', border: '1px solid #21C87A44' }}>
              <div className="text-[11.5px] font-semibold text-[#21C87A]">Effect found</div>
              <div className="text-[10px] text-[#93A0C2] mt-1">RECOVERED — no retry, no duplicate</div>
            </div>
            <div className="px-3 py-2.5 rounded-lg text-center" style={{ background: 'rgba(6,10,22,0.6)', border: '1px solid #4D8DFF44' }}>
              <div className="text-[11.5px] font-semibold text-[#4D8DFF]">Effect absent</div>
              <div className="text-[10px] text-[#93A0C2] mt-1">safe retry, contract permitting</div>
            </div>
            <div className="px-3 py-2.5 rounded-lg text-center" style={{ background: 'rgba(6,10,22,0.6)', border: '1px solid #F5A52444' }}>
              <div className="text-[11.5px] font-semibold text-[#F5A524]">Still unknown</div>
              <div className="text-[10px] text-[#93A0C2] mt-1">escalate — no automatic retry</div>
            </div>
          </div>
        </div>
      )
    case 'evidence-path':
      return <TwoColDiagram leftTitle="Execution" left={['ExecutionEngine attempt', 'EXEC-FACT emitted', 'one fact per attempt']} rightTitle="Evidence" right={['Evidence Client', 'R-Series', 'one cos-ops receipt per fact', 'chain link per run', 'verify / audit']} />
    case 'connection-lifecycle':
      return (
        <div className="glass-panel p-6">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#00C2FF] mb-4">Connection lifecycle</div>
          <FlowRow accent="#00C2FF" items={['Provider account', 'Connect', 'Test', 'Active (tenant-bound)', 'Suspended', 'Revoked']} />
          <div className="mt-3 text-[11px] text-[#93A0C2]">Scopes recorded at authorize time · credential reference bound to routing context · revocation takes effect at the next dispatch check</div>
        </div>
      )
    case 'org-model':
      return <TwoColDiagram leftTitle="Organization (tenant boundary)" left={['Policy floor', 'Roles', 'Org-level kill (dual control)', 'Audit ownership', 'Environments']} rightTitle="Workspace (refinement)" right={['Connections', 'Agents', 'Policies within the floor', 'Workspace roles', 'Execution & receipt views']} leftAccent="#8B5CF6" rightAccent="#5A7BFF" />
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
      <div className="grid px-5 py-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#93A0C2] border-b border-[rgba(120,140,255,0.15)]" style={{ gridTemplateColumns: `repeat(${t.head.length}, minmax(120px, 1fr))` }}>
        {t.head.map((h) => <span key={h}>{h}</span>)}
      </div>
      {t.rows.map((r, i) => (
        <div key={i} className="grid px-5 py-3 border-b border-[rgba(120,140,255,0.08)] last:border-0" style={{ gridTemplateColumns: `repeat(${t.head.length}, minmax(120px, 1fr))` }}>
          {r.map((cell, j) => (
            <span key={j} className={`text-[12px] leading-relaxed ${j === 0 ? 'text-[#D6E1FF] font-medium' : 'text-[#A9B6D3]'}`}>{cell}</span>
          ))}
        </div>
      ))}
    </div>
  )
}

function SectionBlock({ s }: { s: Section }) {
  return (
    <section className="mt-12">
      <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-white">{s.h}</h2>
      {s.diagram && <div className="mt-6 max-w-3xl"><Diagram kind={s.diagram} /></div>}
      {s.p?.map((t, i) => <p key={i} className="mt-4 text-[14px] leading-relaxed text-[#A9B6D3] max-w-3xl">{t}</p>)}
      {s.flow && <div className="mt-6"><FlowRow items={s.flow} /></div>}
      {s.ul && (
        <ul className="mt-5 space-y-2.5 max-w-3xl">
          {s.ul.map((u) => (
            <li key={u} className="flex gap-3 text-[13.5px] leading-relaxed text-[#A9B6D3]">
              <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-[#5A7BFF] shrink-0" />{u}
            </li>
          ))}
        </ul>
      )}
      {s.table && <Table t={s.table} caption={s.h} />}
      {s.code && (
        <div className="mt-6 max-w-3xl">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#93A0C2] mb-2">Conceptual — contract frozen (EXEC-FACTS v1.0.0 / Manifest 1.3.0 / Webhook 1.0.0); public API surface pending</div>
          <pre className="dcs-code overflow-x-auto"><code>{s.code}</code></pre>
        </div>
      )}
      {s.note && (
        <div className="mt-6 max-w-3xl px-4 py-3 rounded-xl text-[12.5px] leading-relaxed text-[#A9B6D3]" style={{ background: 'rgba(245,165,36,0.07)', border: '1px solid rgba(245,165,36,0.25)' }}>{s.note}</div>
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
        <div className="text-[12px] text-[#93A0C2]">
          <a href={`${home}`} className="hover:text-white transition-colors">{page.area}</a>
          <span className="mx-2">/</span>
          <span className="text-[#A9B6D3]">{page.title}</span>
        </div>
        <div className="mt-6 grid lg:grid-cols-[minmax(0,1fr)_240px] gap-12">
          <div>
            <div className="eyebrow mb-4">{page.area}</div>
            <h1 className="text-3xl md:text-[40px] font-semibold tracking-tight text-white leading-tight">{page.title}</h1>
            {page.badge && (
              <span className="inline-block mt-3 text-[10.5px] font-bold px-2.5 py-1 rounded-full tracking-wide" style={page.badge === 'PRE-LAUNCH' ? { color: '#FCD34D', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.4)' } : page.badge === 'PLANNED' ? { color: '#93A0C2', background: 'rgba(120,140,255,0.08)', border: '1px solid rgba(120,140,255,0.25)' } : { color: '#6EE7B7', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.4)' }}>{page.badge}</span>
            )}
            <p className="mt-4 text-[15px] leading-relaxed text-[#A9B6D3] max-w-2xl">{page.tagline}</p>
            {page.sections.map((s) => <SectionBlock key={s.h} s={s} />)}
            {page.form?.kind === 'contact' && <div className="mt-12"><ContactForm defaultTopic={page.form.topic} /></div>}
            {!page.noStatus && <StatusCallout route={current} />}
            {next.length > 0 ? (
              <div className="mt-12 grid sm:grid-cols-2 gap-4 max-w-3xl">
                {next.map(([to, label]) => (
                  <a key={to} href={`${to}`} className="glass-card glass-card-hover px-5 py-4 flex items-center justify-between group">
                    <span>
                      <span className="block text-[10px] uppercase tracking-[0.14em] text-[#93A0C2]">Next</span>
                      <span className="block text-[13.5px] font-medium text-[#D6E1FF] group-hover:text-white transition-colors mt-1">{label}</span>
                    </span>
                    <span className="text-[#5A7BFF] group-hover:translate-x-0.5 transition-transform">→</span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="mt-14 glass-panel p-6 flex flex-wrap items-center justify-between gap-4 max-w-3xl">
                <div>
                  <div className="text-[15px] font-semibold text-white">Explore the rest of {page.area}</div>
                  <div className="text-[12.5px] text-[#93A0C2] mt-1">Every page in this area covers one real part of the platform.</div>
                </div>
                <a href={`${home}`} className="cta-secondary">{page.area} overview →</a>
              </div>
            )}
          </div>
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#93A0C2] mb-3">{page.area}</div>
              <nav className="space-y-0.5">
                {links.map(([to, label]) => (
                  <a key={to} href={`${to}`} className={`block px-3 py-2 rounded-lg text-[12.5px] transition-colors ${to === current ? 'text-white font-medium' : 'text-[#A9B6D3] hover:text-white'}`} style={to === current ? { background: 'rgba(90,123,255,0.12)', border: '1px solid rgba(120,140,255,0.3)' } : { border: '1px solid transparent' }}>{label}</a>
                ))}
              </nav>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
