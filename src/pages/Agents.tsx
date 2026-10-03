import { Reveal } from '../hooks/Reveal'
import { AreaLinks } from '../components/AreaLinks'
import { LifecycleDiagram } from '../components/Diagrams'
import { StatusCallout } from '../components/StatusCallout'
import { LIFECYCLE_10, MODE_BOUNDARIES } from '../lib/lifecycle'
import { v } from '../lib/status'

const NEVERS = [
  { t: 'Never holds credentials', d: 'The OAL has no access to provider tokens, keys or secrets — connections are referenced by identity, resolved only inside the Execution Engine.' },
  { t: 'Never calls providers', d: 'There is no network path from the reasoning layer to a provider API. The only route to a provider runs through policy, approval and the Ops Broker.' },
  { t: 'Never writes independently', d: 'The OAL cannot perform a write on its own — not directly, not via a scheduler, not by widening an approval. Writes are authorised per step.' },
]

const MODES = [
  { m: 'MODE 0', t: 'Observe', d: 'Signals in, picture assembled. Read-oriented; no writes exist at this mode.', status: 'Complete (integrated)' },
  { m: 'MODE 1', t: 'Diagnose & recommend', d: 'Evidence-bound diagnosis and proposed plans. This is the launch mode.', status: 'Complete (integrated)' },
  { m: 'MODE 2', t: 'Approval-gated execute', d: `Approved steps execute through the governed path. The v1 ceiling. ${v('mode2')}`, status: 'In progress — hermetically proven, not customer-enabled' },
  { m: 'MODE 3/4', t: 'Later', d: '', status: 'Later' },
]

export function Agents() {
  return (
    <div className="pt-24 pb-14">
      <div className="mx-auto max-w-[1400px] px-8">
        <div className="max-w-3xl">
          <div className="eyebrow mb-4">Agents</div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#0B1220] leading-tight">
            More capable agents.<br /><span className="text-gradient">Under your control.</span>
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-[#3A4357]">
            The Operations Agent Layer reasons; Connector OS executes.
          </p>
        </div>

        {/* 1 · What the OAL is */}
        <Reveal className="mt-12 max-w-3xl">
          <h2 className="text-xl font-semibold text-[#0B1220]">What the Operations Agent Layer is</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-[#3A4357]">
            The OAL is the reasoning layer of Connector OS: it observes signals, correlates them, diagnoses with evidence, plans over declared capabilities and recommends action. It is deliberately separated from everything that makes action real — credentials, provider APIs, execution and evidence. What it decides is governed; what it can touch is nothing. <a href="/agents/governance" className="text-[#2850D8] underline underline-offset-2 hover:text-[#0B1220] transition-colors">How the boundary works →</a>
          </p>
        </Reveal>

        {/* 2 · Reasoning != execution */}
        <Reveal className="mt-12">
          <h2 className="text-xl font-semibold text-[#0B1220] mb-5">Reasoning ≠ execution — three nevers</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {NEVERS.map((n, i) => (
              <div key={n.t} className="glass-card p-6 h-full">
                <div className="text-[9.5px] font-bold text-[#B91C1C] mb-2">NEVER {String(i + 1).padStart(2, '0')}</div>
                <div className="text-[15px] font-semibold text-[#0B1220] mb-2">{n.t}</div>
                <p className="text-[12.5px] leading-relaxed text-[#3A4357]">{n.d}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* 3 · Canonical lifecycle */}
        <Reveal className="mt-12">
          <h2 className="text-xl font-semibold text-[#0B1220] mb-2">The lifecycle — ten stages, one definition</h2>
          <p className="text-[13.5px] text-[#3A4357] mb-5 max-w-3xl">Every agent run moves through the same ten stages. Each stage has an input, an output, an owner and a fact. <a href="/agents/lifecycle" className="text-[#2850D8] underline underline-offset-2 hover:text-[#0B1220] transition-colors">Stage-by-stage detail →</a></p>
          <LifecycleDiagram stages={LIFECYCLE_10} modeBoundary={MODE_BOUNDARIES} />
        </Reveal>

        {/* 4 · Modes */}
        <Reveal className="mt-12">
          <h2 className="text-xl font-semibold text-[#0B1220] mb-5">Modes — how much an agent may do</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {MODES.map((m) => (
              <div key={m.m} className="glass-card p-6 h-full">
                <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                  <span className="text-[12px] font-bold text-[#1E40AF]" style={{ fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace" }}>{m.m}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color: m.status.startsWith('Complete') ? '#047857' : m.status === 'Later' ? '#566074' : '#B45309', background: m.status.startsWith('Complete') ? 'rgba(33,200,122,0.12)' : m.status === 'Later' ? '#F5F7FB' : 'rgba(245,165,36,0.12)', border: `1px solid ${m.status.startsWith('Complete') ? '#21C87A55' : m.status === 'Later' ? '#E3E7EE' : '#F5A52455'}` }}>{m.status}</span>
                </div>
                <div className="text-[15px] font-semibold text-[#0B1220] mb-2">{m.t}</div>
                {m.d && <p className="text-[12.5px] leading-relaxed text-[#3A4357]">{m.d}</p>}
              </div>
            ))}
          </div>
        </Reveal>

        {/* 5 · What agents get back */}
        <Reveal className="mt-12 max-w-3xl">
          <h2 className="text-xl font-semibold text-[#0B1220]">What agents get back</h2>
          <ul className="mt-4 space-y-2.5">
            {[
              'Evidence-referenced diagnoses — every conclusion resolves to facts, not narration',
              'Execution outcomes — succeeded, failed, or outcome_unknown, handled as explicit states',
              'Verification status — provider acceptance and effect confirmation tracked separately',
              'Receipt references — pointers to the evidence record for each governed action',
            ].map((t) => (
              <li key={t} className="flex gap-3 text-[13.5px] leading-relaxed text-[#3A4357]"><span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-[#0E7490] shrink-0" />{t}</li>
            ))}
          </ul>
          <p className="mt-4 text-[13px] text-[#566074]">What never comes back: credentials, raw provider error bodies, provider secrets. <a href="/agents/executions" className="text-[#2850D8] underline underline-offset-2 hover:text-[#0B1220] transition-colors">The agent view of executions →</a></p>
        </Reveal>

        <StatusCallout route="/agents" />

        <AreaLinks area="Agents" title="Go deeper" />
      </div>
    </div>
  )
}
