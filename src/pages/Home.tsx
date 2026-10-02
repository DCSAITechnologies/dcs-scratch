import { SectionHeader } from '../components/primitives'
import { Reveal } from '../hooks/Reveal'
import { OrchestrationVisual } from '../components/OrchestrationVisual'
import { ConnectorLogo } from '../components/ConnectorLogo'
import { PUBLISHED_CONNECTORS as CONNECTORS, PUBLISHED_COUNT, statusColor } from '../lib/data'
import { LIFECYCLE_10 } from '../lib/lifecycle'
import { v } from '../lib/status'

const STRIP_IDS = ['bugsnag', 'postman', 'make', 'rollbar', 'raygun', 'browserstack-automate', 'sauce-labs', 'testrail', 'checkly', 'percy', 'linode', 'appwrite', 'ovhcloud', 'algolia', 'sanity', 'storyblok', 'meilisearch', 'turso', 'typesense', 'ghost']

function ConnectorStrip() {
  const items = STRIP_IDS.map((id) => CONNECTORS.find((c) => c.id === id)).filter(Boolean) as typeof CONNECTORS
  const loop = [...items, ...items]
  return (
    <div className="marquee-mask overflow-hidden py-2">
      <div className="marquee-track">
        {loop.map((c, i) => (
          <a key={`${c.id}-${i}`} href={`/connectors/${c.id}`} className="glass-card flex items-center gap-3 px-4 py-3 shrink-0 hover:border-[#5A7BFF66] transition-colors">
            <ConnectorLogo name={c.n} src={c.logo} size={30} />
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-white leading-tight">{c.n}</span>
              <span className="block text-[10.5px] text-[#93A0C2] leading-tight mt-0.5">{c.cat}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}

const FLOW = [
  { s: 'Connect', d: 'Securely connect a provider account.' },
  { s: 'Authorize', d: 'Grant only the required scopes.' },
  { s: 'Plan', d: 'The agent prepares an action using declared capabilities.' },
  { s: 'Approve', d: 'Sensitive actions require policy or human approval.' },
  { s: 'Execute', d: 'Connector OS runs the approved action through the controlled execution layer.' },
  { s: 'Verify', d: 'The result is checked against provider state where required.' },
  { s: 'Receipt', d: 'A verifiable evidence record is produced for the action.' },
]

const LIFECYCLE = LIFECYCLE_10

const PREVIEW_IDS = ['singlestore', 'surrealdb', 'dynatrace', 'sumo-logic', 'axiom', 'coralogix', 'uptimerobot', 'pingdom', 'workos', 'clerk', 'tailscale', 'vanta']

export function Home() {
  const preview = PREVIEW_IDS.map((id) => CONNECTORS.find((c) => c.id === id)).filter(Boolean) as typeof CONNECTORS
  return (
    <div className="pt-16">
      {/* 1 · HERO */}
      <section className="hero-backdrop">
        <div className="mx-auto max-w-[1400px] px-8 pt-10 pb-8 grid lg:grid-cols-[1fr_620px] gap-12 items-center">
          <div>
            <Reveal>
              <div className="eyebrow mb-5">Connector OS — governed execution for AI agents</div>
              <h1 className="font-semibold tracking-tight text-white leading-[1.05]" style={{ fontSize: 'clamp(40px, 4.6vw, 58px)' }}>
                Connect agents to real systems.<br />
                <span className="text-gradient">Keep every action governed.</span>
              </h1>
              <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-[#A9B6D3]">
                One execution layer between your agents and a catalogue of {PUBLISHED_COUNT} published, documented connectors — with policy checks, human approvals, verification and receipts for every action.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="/signin" className="cta-primary">Start building</a>
                <a href="/connectors" className="cta-secondary">Explore connectors</a>
              </div>
              <div className="mt-8 flex flex-wrap gap-2.5">
                {[`${PUBLISHED_COUNT} published connectors`, 'Governed agent access', 'Receipts for every action', 'Secure by design'].map((c) => (
                  <span key={c} className="chip">{c}</span>
                ))}
              <p className="mt-4 text-[11.5px] leading-relaxed text-[#93A0C2] max-w-md">
                {v('overall')} <a href="/developers/status" className="text-[#5A7BFF] hover:text-white transition-colors">Build status →</a>
              </p>
              </div>
            </Reveal>
          </div>
          <Reveal delay={120} className="hidden lg:block">
            <OrchestrationVisual />
          </Reveal>
        </div>
      </section>

      {/* 2 · CONNECTOR STRIP */}
      <section className="section-bg -mt-2">
        <div className="mx-auto max-w-[1400px] px-8 pb-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#93A0C2] mb-3 text-center">Connect to the tools your teams already use</div>
        </div>
        <ConnectorStrip />
      </section>

      {/* 3 · CATALOGUE PREVIEW */}
      <section className="section-bg">
        <div className="mx-auto max-w-[1400px] px-8 py-16">
          <SectionHeader
            eyebrow="Connector catalogue"
            title="One interface. Hundreds of real-world systems."
            sub="Every connector page documents capabilities, authentication, permissions, webhooks and official documentation — from official provider sources, with verification status shown per connector."
          />
          <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {preview.map((c, i) => (
              <Reveal key={c.id} delay={i * 40}>
                <a href={`/connectors/${c.id}`} className="glass-card glass-card-hover block p-4 h-full">
                  <div className="flex items-center gap-2.5 mb-3">
                    <ConnectorLogo name={c.n} src={c.logo} size={30} />
                    <span className="text-[13.5px] font-semibold text-white truncate">{c.n}</span>
                  </div>
                  <p className="text-[11.5px] leading-snug text-[#93A0C2] line-clamp-2 min-h-[32px]">{c.caps[0]}, {c.caps[1]}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color: statusColor(c.s), background: `${statusColor(c.s)}1f`, border: `1px solid ${statusColor(c.s)}44` }}>{c.s}</span>
                    <span className="text-[10px] text-[#93A0C2]">{c.auth}</span>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-8 text-center">
            <a href="/connectors" className="cta-secondary inline-block">Explore all {PUBLISHED_COUNT} published connectors</a>
          </Reveal>
        </div>
      </section>

      {/* 4 · HOW IT WORKS */}
      <section className="section-bg">
        <div className="mx-auto max-w-[1400px] px-8 py-16">
          <SectionHeader eyebrow="How Connector OS works" title="From intent to verifiable outcome" sub="Every agent action moves through the same governed path — no shortcuts." />
          <div className="mt-10 grid md:grid-cols-7 gap-3">
            {FLOW.map((f, i) => (
              <Reveal key={f.s} delay={i * 60}>
                <div className="glass-card p-4 h-full relative">
                  <div className="text-[10px] font-bold text-[#00C2FF] mb-2">{String(i + 1).padStart(2, '0')}</div>
                  <div className="text-[14px] font-semibold text-white mb-1.5">{f.s}</div>
                  <p className="text-[11.5px] leading-snug text-[#93A0C2]">{f.d}</p>
                  {i < 6 && <span className="hidden md:block absolute -right-2.5 top-1/2 -translate-y-1/2 text-[#5A7BFF] z-10">→</span>}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5 · AGENT LAYER */}
      <section className="section-bg">
        <div className="mx-auto max-w-[1400px] px-8 py-16 grid lg:grid-cols-[400px_1fr] gap-12 items-start">
          <Reveal>
            <div className="eyebrow mb-3">Operations Agent Layer</div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">Agents that can reason — without uncontrolled access.</h2>
            <p className="mt-4 text-[14px] leading-relaxed text-[#A9B6D3]">
              Reasoning is not execution. Agents plan with declared capabilities, but provider actions run only through the governed execution layer — under policy, with approval where required.
            </p>
            <ul className="mt-5 space-y-2.5 text-[13.5px] text-[#D6E1FF]">
              {['Agents never hold raw provider credentials', 'Reasoning never directly executes provider actions', 'Policies and approvals control sensitive actions', 'Execution and reasoning are strictly separated'].map((t) => (
                <li key={t} className="flex gap-2.5"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#00C2FF] shrink-0" style={{ boxShadow: '0 0 6px #00C2FF' }} />{t}</li>
              ))}
            </ul>
            <a href="/agents" className="cta-secondary inline-block mt-6">Explore the agent layer</a>
          </Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {LIFECYCLE.map((s, i) => (
              <Reveal key={s} delay={i * 50}>
                <div className="glass-card p-3.5 text-center h-full flex flex-col justify-center">
                  <div className="text-[9.5px] font-bold text-[#8B5CF6] mb-1">{String(i + 1).padStart(2, '0')}</div>
                  <div className="text-[12.5px] font-semibold text-white">{s}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 6 · POLICIES & APPROVALS */}
      <section className="section-bg">
        <div className="mx-auto max-w-[1400px] px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div className="eyebrow mb-3">Policies & human approval</div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">Every action happens within policy.</h2>
            <p className="mt-4 text-[14px] leading-relaxed text-[#A9B6D3]">
              Sensitive operations pause for policy evaluation or explicit human approval. Approvals are plan-bound, single-use, scoped to a tenant, and expire — with a kill switch over the whole path.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {['Plan-bound approval', 'Single-use approval', 'Expiry', 'Scope control', 'Tenant binding', 'Kill switch'].map((t) => <span key={t} className="chip">{t}</span>)}
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="glass-panel p-6">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#F5A524] mb-4">Approval required</div>
              <div className="text-[15px] font-semibold text-white mb-4">Agent wants to update a Salesforce opportunity</div>
              <div className="space-y-2.5 text-[13px]">
                {[['Tool', 'opportunities.update'], ['Operation', 'Write'], ['Risk', 'Medium'], ['Policy', 'Human approval required']].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-[rgba(120,140,255,0.12)] pb-2">
                    <span className="text-[#93A0C2]">{k}</span>
                    <span className="text-[#D6E1FF] font-medium" style={{ fontFamily: k === 'Tool' ? 'JetBrains Mono' : undefined, fontSize: k === 'Tool' ? 12 : undefined }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex gap-3">
                <span className="cta-primary !py-2 !px-5 text-[13px] cursor-default">Approve</span>
                <span className="cta-secondary !py-2 !px-5 text-[13px] cursor-default">Reject</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 7 · SECURE EXECUTION */}
      <section className="section-bg">
        <div className="mx-auto max-w-[1400px] px-8 py-16">
          <SectionHeader eyebrow="Secure execution layer" title="Real-system access, without handing over control" sub="Execution runs inside a controlled boundary — credentials stay vaulted, traffic stays routed, actions stay gated." />
          <div className="mt-10 grid grid-cols-2 md:grid-cols-5 gap-3">
            {['Credential references', 'Tenant isolation controls', 'Routing restrictions', 'Host / region binding', 'Scoped permissions', 'Controlled egress', 'Approval-gated actions', 'Retry / reconciliation', 'Revocation', 'Emergency kill controls'].map((t, i) => (
              <Reveal key={t} delay={i * 40}>
                <div className="glass-card glass-card-hover p-4 h-full text-[13px] font-medium text-[#D6E1FF] flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF] shrink-0" style={{ boxShadow: '0 0 6px #6C63FF' }} />{t}
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-6 text-center"><a href="/security" className="cta-secondary inline-block">Read the security overview</a></Reveal>
        </div>
      </section>

      {/* 8 · RECEIPTS */}
      <section className="section-bg">
        <div className="mx-auto max-w-[1400px] px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div className="eyebrow mb-3">Receipts & verifiable outcomes</div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">Know what happened — and prove it.</h2>
            <p className="mt-4 text-[14px] leading-relaxed text-[#A9B6D3]">
              Connector OS preserves evidence about what action was attempted, which policy applied, whether approval existed, the provider outcome, verification, retries, recovery and receipt status.
            </p>
            <a href="/receipts" className="cta-secondary inline-block mt-6">See receipts</a>
          </Reveal>
          <div className="grid sm:grid-cols-2 gap-4">
            <Reveal delay={80}>
              <div className="glass-panel p-5 font-mono text-[12px] space-y-2.5">
                {[['Execution', 'SUCCEEDED', '#21C87A'], ['Policy', 'APPROVED', '#21C87A'], ['Verification', 'VERIFIED', '#21C87A'], ['Receipt status', 'ISSUED', '#21C87A']].map(([k, v, c]) => (
                  <div key={k} className="flex justify-between"><span className="text-[#93A0C2]">{k}</span><span style={{ color: c as string }}>{v}</span></div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={160}>
              <div className="glass-panel p-5 font-mono text-[12px] space-y-2.5">
                {[['Execution', 'OUTCOME_UNKNOWN', '#F5A524'], ['Reconciliation', 'RECOVERED', '#00C2FF'], ['Verification', 'VERIFIED', '#21C87A'], ['Receipt status', 'ISSUED', '#21C87A']].map(([k, v, c]) => (
                  <div key={k} className="flex justify-between"><span className="text-[#93A0C2]">{k}</span><span style={{ color: c as string }}>{v}</span></div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 9 · RELIABILITY */}
      <section className="section-bg">
        <div className="mx-auto max-w-[1400px] px-8 py-16">
          <SectionHeader eyebrow="Reliability & recovery" title="Failures are explicit, not hidden" sub="Rate limits, timeouts and unknown outcomes are handled as first-class states — never swallowed." />
          <Reveal className="mt-10">
            <div className="glass-panel p-6">
              <div className="flex flex-wrap items-center gap-2 text-[12px] font-medium">
                {['Write sent', 'Provider timeout', 'Outcome unknown', 'Provider state checked', 'Effect found', 'No duplicate retry', 'Reconciled'].map((s, i, arr) => (
                  <span key={s} className="flex items-center gap-2">
                    <span className="chip !text-[11.5px]" style={i === 2 ? { borderColor: '#F5A52466', color: '#F5A524' } : i === arr.length - 1 ? { borderColor: '#21C87A66', color: '#21C87A' } : undefined}>{s}</span>
                    {i < arr.length - 1 && <span className="text-[#5A7BFF]">→</span>}
                  </span>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-2.5">
                {['429 / rate limit', 'Provider unavailable', 'Timeout after write', 'Duplicate prevention', 'Retry exhausted', 'Connection revoked', 'Receipt pending', 'Kill switch', 'Outcome unknown', 'Reconciliation'].map((t) => (
                  <div key={t} className="text-[11.5px] text-[#A9B6D3] px-3 py-2 rounded-lg text-center" style={{ background: 'rgba(6,10,22,0.6)', border: '1px solid rgba(120,140,255,0.14)' }}>{t}</div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 10 · DEVELOPERS */}
      <section className="section-bg">
        <div className="mx-auto max-w-[1400px] px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div className="eyebrow mb-3">Developer experience</div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">One governed path from code to receipt.</h2>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {['API', 'SDKs', 'MCP', 'CLI', 'Webhooks', 'Quickstart', 'Tool schemas', 'Receipts', 'Policies', 'Executions'].map((t) => (
                <div key={t} className="glass-card p-3 text-center text-[12px] font-semibold text-[#D6E1FF]">{t}</div>
              ))}
            </div>
            <a href="/developers" className="cta-secondary inline-block mt-6">Open developer hub</a>
          </Reveal>
          <Reveal delay={120}>
            <div className="glass-panel p-5 overflow-x-auto">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#93A0C2] mb-3">Conceptual example</div>
              <pre className="dcs-code">{`import { ConnectorOS } from "connector-os"

const dcs = new ConnectorOS()

const result = await dcs.execute({
  connector: "salesforce",
  tool: "opportunities.update",
  input: { id: "006...", stage: "Negotiation" },
  approval: "required",
})

console.log(result.receipt.id)  // verifiable receipt`}</pre>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 11 · USE CASES */}
      <section className="section-bg">
        <div className="mx-auto max-w-[1400px] px-8 py-16">
          <SectionHeader eyebrow="Use cases" title="Where governed agents go to work" sub="Every workflow below runs on governed connector access — with approvals where the risk demands them." />
          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              ['AI agent platforms', 'Give your agents governed access to customer systems through one execution layer.', 'AI & Models'],
              ['Enterprise internal agents', 'Internal copilots that act inside policy, not around it.', 'Productivity'],
              ['Support automation', 'Resolve tickets end-to-end with approval-gated escalations.', 'Support & Customer Success'],
              ['CRM workflows', 'Keep pipelines accurate with verified, receipt-backed writes.', 'CRM & Sales'],
              ['Finance operations', 'Invoices, payouts and reconciliation under strict approval policy.', 'Finance & Accounting'],
              ['Sales workflows', 'Enrichment and outreach executed inside tenant boundaries.', 'CRM & Sales'],
              ['Developer workflows', 'Issues, PRs and deployments driven by policy-aware agents.', 'Developer Tools'],
              ['Data operations', 'Query and sync across warehouses with read-scoped credentials.', 'Databases & Search'],
              ['Marketing execution', 'Campaign updates with plan-bound approvals.', 'Marketing & Advertising'],
              ['Back-office automation', 'Documents, signatures and records handled with receipts.', 'Documents & eSignature'],
            ].map(([t, d, c], i) => (
              <Reveal key={t} delay={i * 40}>
                <div className="glass-card glass-card-hover p-5 h-full">
                  <div className="text-[14px] font-semibold text-white mb-2">{t}</div>
                  <p className="text-[12px] leading-relaxed text-[#A9B6D3] mb-3">{d}</p>
                  <div className="text-[10px] font-semibold text-[#00C2FF] uppercase tracking-wide">{c}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 12 · FINAL CTA */}
      <section className="section-bg">
        <div className="mx-auto max-w-[1400px] px-8 py-20 text-center">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-white">Ship agents that act in the real world —<br /><span className="text-gradient">with proof for every action.</span></h2>
            <div className="mt-8 flex justify-center gap-3 flex-wrap">
              <a href="/signin" className="cta-primary">Start building</a>
              <a href="/connectors" className="cta-secondary">Explore connectors</a>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
