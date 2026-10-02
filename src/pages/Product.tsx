import { PUBLISHED_COUNT } from 'virtual:catalogue-summary'
import { SectionHeader, TeaserCard } from '../components/primitives'
import { Reveal } from '../hooks/Reveal'
import { AreaLinks } from '../components/AreaLinks'

const BLOCKS = [
  { t: 'Control plane architecture', d: 'Connections, policies, approvals and receipts are managed in a single control plane, separate from where actions actually run.' },
  { t: 'Execution layer', d: 'Provider actions execute inside a controlled runtime with routing restrictions, scoped credentials and controlled egress.' },
  { t: 'Policies', d: 'Declarative rules decide which tools an agent may call, under what limits, and when approval is required.' },
  { t: 'Approvals', d: 'Plan-bound, single-use approvals with expiry, scope control and tenant binding for sensitive operations.' },
  { t: 'Receipts', d: 'Verifiable evidence records for attempted actions: policy, approval, provider outcome, verification and status.' },
  { t: 'Reliability', d: 'Rate limits, timeouts and unknown outcomes are explicit states with defined retry and reconciliation behaviour.' },
  { t: 'Recovery', d: 'Provider state is checked after ambiguous writes so retries never duplicate effects.' },
  { t: 'Runtime / connections', d: 'Connections carry scoped credentials bound to tenant, host and region context — revocable by the tenant; revocation takes effect at the next dispatch check.' },
  { t: 'Agent integration', d: 'Agents declare intent and capabilities; they never hold raw provider credentials or execute directly.' },
  { t: 'Developer surfaces', d: 'API, SDKs, MCP, CLI and webhooks — one consistent model across every surface.' },
  { t: 'Enterprise controls', d: 'Organizations, workspaces, roles, environments and audit history for governance at scale.' },
]

export function Product() {
  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-[1400px] px-8">
        <div className="max-w-3xl">
          <div className="eyebrow mb-4">Product</div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white">Connector OS, end to end</h1>
          <p className="mt-5 text-[15.5px] leading-relaxed text-[#A9B6D3]">
            Connector OS is the governed execution layer between AI agents and real business systems. Agents plan; Connector OS authorizes, executes, verifies and receipts every action across a catalogue of {PUBLISHED_COUNT} published, documented connectors.
          </p>
          <div className="mt-7 flex gap-3 flex-wrap">
            <a href="/signin" className="cta-primary">Start building</a>
            <a href="/connectors" className="cta-secondary">Explore connectors</a>
          </div>
        </div>

        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {BLOCKS.map((b, i) => (
            <Reveal key={b.t} delay={i * 40}>
              <div className="glass-card glass-card-hover p-6 h-full">
                <div className="text-[9.5px] font-bold text-[#00C2FF] mb-2">{String(i + 1).padStart(2, '0')}</div>
                <div className="text-[15px] font-semibold text-white mb-2">{b.t}</div>
                <p className="text-[12.5px] leading-relaxed text-[#A9B6D3]">{b.d}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-16">
          <SectionHeader eyebrow="Explore further" title="Go deeper on each layer" />
          <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <TeaserCard eyebrow="Agents" title="Operations Agent Layer" desc="Reasoning and execution, strictly separated — with governance over the full lifecycle." cta="Explore agents" href="/agents" icon={<span className="text-[#A78BFA] text-lg">◈</span>} />
            <TeaserCard eyebrow="Security" title="Security model" desc="Credential isolation, tenant boundaries, egress control and kill controls." cta="Security overview" href="/security" icon={<span className="text-[#21C87A] text-lg">⛨</span>} />
            <TeaserCard eyebrow="Receipts" title="Verifiable outcomes" desc="Evidence records for every governed action your agents take." cta="See receipts" href="/receipts" icon={<span className="text-[#00C2FF] text-lg">✓</span>} />
            <TeaserCard eyebrow="Developers" title="Developer hub" desc="Quickstart, API reference, SDKs, MCP, webhooks and CLI." cta="Start building" href="/developers" icon={<span className="text-[#5A7BFF] text-lg">{ }</span>} />
          </div>
        </div>
      <AreaLinks area="Product" title="Product, in depth" />

        </div>
    </div>
  )
}
