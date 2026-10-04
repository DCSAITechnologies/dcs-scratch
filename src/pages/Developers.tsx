import { TOTAL_CATALOGUED, PUBLISHED_COUNT } from 'virtual:catalogue-summary'
import { Reveal } from '../hooks/Reveal'
import { AreaLinks } from '../components/AreaLinks'

const SECTIONS: { t: string; d: string; to: string; items?: string[] }[] = [
  { t: 'Quickstart', d: 'One governed path, end to end: connect → plan → approve → execute → verify → receipt, with the failure branch you must handle.', to: '/developers/quickstart', items: ['Create connection', 'Inspect tools', 'Submit a plan', 'Handle approval', 'Read outcome + receipt'] },
  { t: 'Authentication', d: 'Two layers, never mixed: your app to the platform, and the platform to the provider. Credential references, never material.', to: '/developers/authentication' },
  { t: 'Resource model', d: 'Connections, Tools, Plans, Policies, Approvals, Executions, Attempts, Receipts, Events, Kill orders — fields and states, no endpoint URLs yet.', to: '/developers/api' },
  { t: 'SDK', d: 'PRE-LAUNCH. Design principles and the shape of the client — published before the package so you can evaluate the model now.', to: '/developers/sdk' },
  { t: 'MCP', d: 'Connector OS as an MCP server of governed tools: JIT registry (tools ∩ policy), approvals over MCP, inbound-trust tagging.', to: '/developers/mcp' },
  { t: 'Webhooks', d: 'Two directions: provider events in (verified / unsigned / rejected), platform events out (approvals, execution states, receipts).', to: '/developers/webhooks' },
  { t: 'Policies', d: 'Inputs, decision object, evaluation timing and versioning — evaluate before you execute; REFUSED is routine.', to: '/developers/policies' },
  { t: 'Executions', d: 'Execution and attempt objects, idempotency rules, reconciliation in state, verification fields.', to: '/developers/executions' },
  { t: 'Receipts', d: 'cos-ops-v1 field groups, receipt refs, the verify flow and the causal chain — verify offline with dcslabs-r2-verify.', to: '/developers/receipts' },
  { t: 'Connectors & manifests', d: 'What a connector declares: auth, routing, capabilities with operation class, side effects, retry safety, verification, webhooks.', to: '/developers/connectors' },
  { t: 'Outcome & refusal reference', d: 'The canonical outcome enum — every state, its meaning, and what your integration should do about it.', to: '/developers/errors' },
  { t: 'CLI', d: 'PRE-LAUNCH. Same governance, terminal-shaped — no administrative backdoor.', to: '/developers/cli' },
  { t: 'Changelog & build status', d: 'Frozen contracts, dated changes, and the public 30-item capability table — what is built, proven and next.', to: '/developers/status' },
]

export function Developers() {
  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto px-4 sm:px-8 xl:px-12 2xl:px-16 max-w-[1760px] ">
        <div className="max-w-3xl">
          <div className="eyebrow mb-4">Developers</div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#0B1220]">Built for developers. Designed for agents.</h1>
          <p className="mt-5 text-[15.5px] leading-relaxed text-[#3A4357]">
            One governed integration model across a catalogue of {TOTAL_CATALOGUED.toLocaleString('en-US')} catalogued connectors ({PUBLISHED_COUNT} published) — with policy, approval, verification and receipts built into every call.
          </p>
        </div>

        <Reveal className="mt-10">
          <div className="glass-panel p-6 max-w-3xl">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#566074] mb-3">The architecture in five lines</div>
            <ol className="space-y-2 text-[13.5px] leading-relaxed text-[#3A4357]">
              <li><span className="text-[#2850D8] font-bold mr-2">1.</span>Agents reason in the Operations Agent Layer — which holds no credentials, calls no providers and performs no writes.</li>
              <li><span className="text-[#2850D8] font-bold mr-2">2.</span>Every step is policy-evaluated, and gated steps need an exact-step, single-use human approval.</li>
              <li><span className="text-[#2850D8] font-bold mr-2">3.</span>The Ops Broker is the sole caller of the Execution Engine — there is no other path to a provider.</li>
              <li><span className="text-[#2850D8] font-bold mr-2">4.</span>Every attempt records an EXEC-FACT with an explicit outcome — ambiguity is a state, never a guess.</li>
              <li><span className="text-[#2850D8] font-bold mr-2">5.</span>Receipts (cos-ops-v1) turn the facts into evidence you can verify offline.</li>
            </ol>
          </div>
        </Reveal>

        <Reveal className="mt-6">
          <div className="glass-panel p-6 max-w-3xl overflow-x-auto">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#566074] mb-3">Conceptual — contract frozen (EXEC-FACTS v1.0.0 / Manifest 1.3.0 / Webhook 1.0.0); public API surface pending</div>
            <pre className="dcs-code">{`import { DCS } from "@dcs-ai/connector-os" // PRE-LAUNCH — not published

const dcs = new DCS({ tenant: "tnt_acme" })
const plan = await dcs.plans.create({ steps: [ /* exact steps */ ] })
if (plan.decision.outcome === "APPROVAL_REQUIRED") {
  await dcs.approvals.request(plan.id) // human gate
}
const exec = await dcs.executions.get(plan.run_id)
console.log(exec.attempts[0].receipt_ref) // verify offline`}</pre>
          </div>
        </Reveal>

        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTIONS.map((s, i) => (
            <Reveal key={s.t} delay={i * 35}>
              <a href={`${s.to}`} className="glass-card glass-card-hover p-6 h-full block">
                <div className="text-[15px] font-semibold text-[#0B1220] mb-2">{s.t}</div>
                <p className="text-[12.5px] leading-relaxed text-[#3A4357]">{s.d}</p>
                {s.items && (
                  <ol className="mt-3 space-y-1.5">
                    {s.items.map((it, j) => <li key={it} className="text-[12px] text-[#566074] flex gap-2"><span className="text-[#2850D8] font-bold">{j + 1}.</span>{it}</li>)}
                  </ol>
                )}
                <div className="mt-3 text-[12px] font-semibold text-[#2850D8]">Read more →</div>
              </a>
            </Reveal>
          ))}
        </div>

        <AreaLinks area="Developers" title="Developer portal, in depth" />
      </div>
    </div>
  )
}
