import { useState } from 'react'
import { SectionHeader } from '../components/primitives'
import { Reveal } from '../hooks/Reveal'

// Spec §8: architecture/evidence explainer with ONE illustrative run.
// Every panel is labelled illustrative — nothing here is a production event.

const LABEL = 'Illustrative receipt chain from the hermetic test suite — not a production event'

type ExampleReceipt = {
  seq: number
  id: string
  type: string
  outcome: string
  receiptState: 'ISSUED' | 'PENDING' | 'FAILED'
  parent: string
  detail: string
}

const RUN: ExampleReceipt[] = [
  { seq: 1, id: 'rcpt_01JEX…a1', type: 'RUN OPEN', outcome: '—', receiptState: 'ISSUED', parent: '—', detail: 'Run opened for tenant tnt_example; lifecycle begins under run_01JEXAMPLE.' },
  { seq: 2, id: 'rcpt_01JEX…b2', type: 'PLAN', outcome: 'EVALUATED', receiptState: 'ISSUED', parent: 'rcpt_01JEX…a1', detail: 'One step planned: github.issues.create. Plan hash recorded; policy decision: APPROVAL_REQUIRED (human).' },
  { seq: 3, id: 'rcpt_01JEX…c3', type: 'AUTHORISATION', outcome: 'GRANTED', receiptState: 'ISSUED', parent: 'rcpt_01JEX…b2', detail: 'Approver granted the exact step (plan-hash bound, single-use nonce, expiry set).' },
  { seq: 4, id: 'rcpt_01JEX…d4', type: 'EXECUTION ATTEMPT', outcome: 'SUCCEEDED', receiptState: 'ISSUED', parent: 'rcpt_01JEX…c3', detail: 'Approval consumed at dispatch; provider accepted the call. One EXEC-FACT recorded.' },
  { seq: 5, id: 'rcpt_01JEX…e5', type: 'VERIFICATION', outcome: 'CONFIRMED', receiptState: 'ISSUED', parent: 'rcpt_01JEX…d4', detail: 'Declared verification method (read-back) confirmed the issue exists at the provider.' },
]

const FAILURE_RUN = [
  { t: 'EXECUTION ATTEMPT', o: 'OUTCOME_UNKNOWN', note: 'timeout after the provider call' },
  { t: 'RECONCILIATION', o: 'EFFECT FOUND', note: 'governed read confirmed the effect' },
  { t: 'RUN CLOSE', o: 'RECOVERED', note: 'resolved without resubmission' },
]

const FIELD_GROUPS: [string, string, string][] = [
  ['Schema identity', 'format name and version (cos-ops-v1)', 'the receipt claims to be cos-ops-v1'],
  ['Causal identity', 'receipt id, run id, sequence, parent link', 'the parent resolves and sequence is contiguous'],
  ['Tenant / actor', 'tenant, workspace, acting identity', 'the actor matches your tenant context'],
  ['Connector execution', 'connector, version, tool, routing context', 'the tool and version match the attempt'],
  ['Intent + plan digests', 'digests of intent and plan', 'recomputed digests match the recorded ones'],
  ['Policy + approval', 'decision, version, approval binding', 'the approval bound to this exact plan hash'],
  ['Input evidence digests', 'digests of facts the plan rested on', 'evidence references resolve'],
  ['Provider evidence', 'response metadata, verification material', 'provider evidence is present and consistent'],
  ['Outcome', 'the attempt outcome as executed', 'outcome matches your own execution record'],
  ['Verification', 'accepted vs confirmed, method used', 'confirmation used the declared method'],
  ['Recovery', 'reconciliation / retry / escalation, when present', 'recovery records are in the same chain'],
  ['Crypto / transparency', 'signature over the receipt', 'the signature verifies offline'],
]

function Pill({ children, tone }: { children: string; tone: 'green' | 'amber' | 'slate' | 'red' }) {
  const colors = {
    green: 'rgba(52,211,153,0.14); border-color: rgba(52,211,153,0.4); color: #065F46',
    amber: 'rgba(251,191,36,0.12); border-color: rgba(251,191,36,0.4); color: #B45309',
    red: 'rgba(248,113,113,0.12); border-color: rgba(248,113,113,0.4); color: #991B1B',
    slate: '#F5F7FB; border-color: #E3E7EE; color: #1E40AF',
  } as const
  return (
    <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full border" style={{ background: colors[tone].split(';')[0], borderColor: colors[tone].split(';')[1].replace('border-color: ', ''), color: colors[tone].split(';')[2].replace('color: ', '') }}>
      {children}
    </span>
  )
}

const outcomeTone = (o: string) =>
  o === 'SUCCEEDED' || o === 'CONFIRMED' || o === 'GRANTED' || o === 'RECOVERED' ? 'green'
  : o === 'OUTCOME_UNKNOWN' ? 'amber'
  : o === '—' ? 'slate' : 'slate'

export function Receipts() {
  const [selected, setSelected] = useState(3) // default: the execution attempt
  const r = RUN[selected]

  return (
    <div className="pt-24 pb-14">
      <div className="mx-auto px-4 sm:px-8 xl:px-12 2xl:px-16 max-w-[1760px] ">
        <SectionHeader
          titleAs="h1"          align="left"
          eyebrow="Receipts"
          title={<>What a receipt is —<br />shown on <span className="text-gradient">one illustrative run.</span></>}
          sub="A receipt is the signed evidence record of one step in a run: what was intended, what was authorised, what happened, and how it was verified. This page walks one example chain from the hermetic test suite."
        />
        <Reveal delay={80} className="mt-6 flex gap-3">
          <a href="/product/receipts-audit" className="cta-primary">How receipts work</a>
          <a href="/developers/receipts" className="cta-secondary">Receipt reference</a>
        </Reveal>

        {/* R-Series presentation rules — the same three things, in this order, everywhere receipts appear */}
        <Reveal className="mt-12">
          <div className="glass-card p-6">
            <h2 className="text-[16px] font-semibold text-[#0B1220] mb-3">Who does what</h2>
            <ol className="space-y-2.5 text-[13.5px] text-[#3A4357] leading-relaxed max-w-3xl">
              <li><span className="text-[#0E7490] font-bold mr-2">1.</span>Facts come from execution, never from the agent.</li>
              <li><span className="text-[#0E7490] font-bold mr-2">2.</span>Connector OS emits facts; R-Series creates, signs, chains and verifies receipts — Connector OS performs no receipt cryptography.</li>
              <li><span className="text-[#0E7490] font-bold mr-2">3.</span>Execution outcome and receipt state are two fields.</li>
            </ol>
            <div className="mt-4 flex items-center gap-2 flex-wrap text-[11px] font-mono2 text-[#0369A1]">
              {['ExecutionEngine', 'EXEC-FACTS', 'EvidenceClient', 'R-Series', 'Receipt', 'Verify', 'Audit'].map((x, xi, xa) => (
                <span key={x} className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg" style={{ background: '#FFFFFF', border: '1px solid rgba(0,194,255,0.3)' }}>{x}</span>
                  {xi < xa.length - 1 && <span className="text-[#0E7490]">→</span>}
                </span>
              ))}
            </div>
            <p className="mt-3 text-[11.5px] text-[#566074]">Receipts today are signed with a test signer; production key custody is a launch gate.</p>
          </div>
        </Reveal>

        {/* Three audiences */}
        <Reveal className="mt-8">
          <h2 className="text-[16px] font-semibold text-[#0B1220] mb-3">Three audiences, one record</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { a: 'Normal customer', sees: 'The example run with both statuses per row, the timeline, and a plain-language what-this-proves.', never: 'digests, key ids' },
              { a: 'Developer', sees: 'Inspector field groups, receipt refs, states and the verify flow — continued in the developer receipt reference.', never: 'raw payloads (none exist)' },
              { a: 'Security / audit', sees: 'The integrity group: signature suite, chain position, sequence, causal parent, verification levels — with the limitation stated (test signer, no external audit).', never: 'nothing withheld' },
            ].map((x) => (
              <div key={x.a} className="glass-card p-5 h-full">
                <div className="text-[13.5px] font-semibold text-[#0B1220] mb-2">{x.a}</div>
                <p className="text-[12.5px] leading-relaxed text-[#3A4357]"><span className="text-[#065F46] font-medium">Sees:</span> {x.sees}</p>
                <p className="mt-2 text-[12px] leading-relaxed text-[#566074]"><span className="text-[#991B1B] font-medium">Never sees:</span> {x.never}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Outcome vs receipt state */}
        <Reveal className="mt-12">
          <div className="glass-card p-6">
            <h2 className="text-[16px] font-semibold text-[#0B1220] mb-2">Outcome vs receipt state — two different fields</h2>
            <p className="text-[13.5px] text-[#3A4357] leading-relaxed max-w-3xl">
              The <span className="text-[#0B1220] font-medium">outcome</span> is what happened at the provider (SUCCEEDED, FAILED, OUTCOME_UNKNOWN…).
              The <span className="text-[#0B1220] font-medium">receipt state</span> is whether the evidence record finished issuing (ISSUED, PENDING, FAILED).
              They are tracked separately on purpose: an execution is never delayed by its paperwork, and a missing receipt is a visible state — never silently assumed.
            </p>
          </div>
        </Reveal>

        {/* Example run */}
        <Reveal className="mt-8">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-[16px] font-semibold text-[#0B1220]">Example run — five receipts in causal order</h2>
            <span className="text-[11px] text-[#566074] italic">{LABEL}</span>
          </div>
          <div className="glass-card p-4 mt-3">
            <div className="grid grid-cols-[2rem_1fr_9rem_8rem_6rem] gap-2 px-3 pb-2 text-[10.5px] uppercase tracking-wider text-[#566074]">
              <span>Seq</span><span>Type · receipt</span><span>Outcome</span><span>Receipt state</span><span>Parent</span>
            </div>
            {RUN.map((rc, i) => (
              <button
                key={rc.id}
                onClick={() => setSelected(i)}
                className={`w-full grid grid-cols-[2rem_1fr_9rem_8rem_6rem] gap-2 items-center p-3 rounded-xl text-left transition-all duration-200 ${
                  selected === i ? 'bg-[#EDF2FF] border border-[#B9C9F6]' : 'border border-transparent hover:bg-[#B9C9F6]'
                }`}
              >
                <span className="font-mono2 text-[12px] text-[#566074]">{rc.seq}</span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium text-[#0B1220] truncate">{rc.type}</span>
                  <span className="block text-[11px] text-[#566074] font-mono2 truncate">{rc.id}</span>
                </span>
                <Pill tone={outcomeTone(rc.outcome) as never}>{rc.outcome}</Pill>
                <Pill tone={rc.receiptState === 'ISSUED' ? 'green' : rc.receiptState === 'PENDING' ? 'amber' : 'red'}>{rc.receiptState}</Pill>
                <span className="font-mono2 text-[11px] text-[#566074] truncate">{rc.parent === '—' ? '—' : '…' + rc.parent.slice(-2)}</span>
              </button>
            ))}
          </div>
        </Reveal>

        {/* Timelines */}
        <Reveal className="mt-8">
          <h2 className="text-[16px] font-semibold text-[#0B1220]">The causal chain — success run</h2>
          <div className="glass-card p-5 mt-3 overflow-x-auto">
            <div className="flex items-stretch gap-2 min-w-[900px]">
              {RUN.map((rc, i) => (
                <div key={rc.id} className="flex items-center gap-2 flex-1">
                  <div className="flex-1 p-3 rounded-xl" style={{ background: '#FFFFFF', border: '1px solid #E3E7EE' }}>
                    <div className="text-[11px] font-semibold text-[#0B1220]">{rc.type}</div>
                    <div className="mt-1.5 flex flex-col gap-1">
                      <Pill tone={outcomeTone(rc.outcome) as never}>{rc.outcome}</Pill>
                      <Pill tone="green">{rc.receiptState}</Pill>
                    </div>
                  </div>
                  {i < RUN.length - 1 && <span className="text-[#2850D8]">→</span>}
                </div>
              ))}
            </div>
            <div className="mt-2 text-[11px] text-[#566074] italic">{LABEL}</div>
          </div>

          <h2 className="text-[16px] font-semibold text-[#0B1220] mt-8">Failures get receipts too — the recovery chain</h2>
          <div className="glass-card p-5 mt-3 overflow-x-auto">
            <div className="flex items-stretch gap-2 min-w-[620px]">
              {FAILURE_RUN.map((n, i) => (
                <div key={n.t + i} className="flex items-center gap-2 flex-1">
                  <div className="flex-1 p-3 rounded-xl" style={{ background: '#FFFFFF', border: '1px solid #E3E7EE' }}>
                    <div className="text-[11px] font-semibold text-[#0B1220]">{n.t}</div>
                    <div className="mt-1.5"><Pill tone={outcomeTone(n.o) as never}>{n.o}</Pill></div>
                    <div className="mt-1.5 text-[10.5px] text-[#566074]">{n.note}</div>
                  </div>
                  {i < FAILURE_RUN.length - 1 && <span className="text-[#2850D8]">→</span>}
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12.5px] text-[#3A4357] leading-relaxed">
              A timeout after the provider call is recorded as OUTCOME_UNKNOWN — not guessed at.
              A governed reconciliation read finds the effect, and the run closes RECOVERED, with every hop on the same chain.
              Evidence matters most exactly when things go wrong.
            </p>
            <div className="mt-2 text-[11px] text-[#566074] italic">{LABEL}</div>
          </div>
        </Reveal>

        {/* Inspector */}
        <Reveal className="mt-8">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-[16px] font-semibold text-[#0B1220]">Inspector — field groups of the selected receipt</h2>
            <Pill tone="slate">Signature: illustrative</Pill>
          </div>
          <div className="glass-card p-6 mt-3">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <div className="text-[13px] font-mono2 text-[#0369A1]">{r.id} · {r.type} · seq {r.seq}</div>
              <div className="flex gap-2">
                <Pill tone={outcomeTone(r.outcome) as never}>{r.outcome}</Pill>
                <Pill tone="green">{r.receiptState}</Pill>
              </div>
            </div>
            <p className="text-[12.5px] text-[#3A4357] mb-5">{r.detail}</p>
            <div className="grid md:grid-cols-2 gap-3">
              {FIELD_GROUPS.map(([g, contents, verify]) => (
                <div key={g} className="p-3.5 rounded-lg" style={{ background: '#FFFFFF', border: '1px solid #E3E7EE' }}>
                  <div className="text-[10.5px] uppercase tracking-wider text-[#566074]">{g}</div>
                  <div className="text-[12.5px] font-medium text-[#1E2638] mt-1">{contents}</div>
                  <div className="text-[11px] text-[#566074] mt-1.5">What you would verify: {verify}.</div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-[11px] text-[#566074] italic">{LABEL}</div>
          </div>
        </Reveal>

        {/* What verification proves + current status */}
        <div className="mt-8 grid lg:grid-cols-2 gap-6">
          <Reveal>
            <div className="glass-card p-6 h-full">
              <h2 className="text-[16px] font-semibold text-[#0B1220] mb-3">What verification proves</h2>
              <ul className="space-y-2.5 text-[13px] text-[#3A4357] leading-relaxed">
                <li>· The receipt was signed over exactly this body — recompute and compare.</li>
                <li>· The plan, intent and evidence digests match what actually executed.</li>
                <li>· The causal chain is complete: every parent resolves, no gaps, no re-ordering.</li>
                <li>· Verification used the method the connector declared — not a weaker substitute.</li>
              </ul>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div className="glass-card p-6 h-full">
              <h2 className="text-[16px] font-semibold text-[#0B1220] mb-3">Current status</h2>
              <ul className="space-y-2.5 text-[13px] text-[#3A4357] leading-relaxed">
                <li>· The receipt pipeline is integrated and proven end-to-end against simulated providers — hermetically proven, not yet verified with real providers.</li>
                <li>· Receipts are signed by a software test signer; no external audit or anchoring is claimed.</li>
                <li>· The offline verifier is published as <span className="font-mono2 text-[12px] text-[#0369A1]">dcslabs-r2-verify</span>.</li>
                <li>· The full capability table lives on <a href="/developers/status" className="text-[#2850D8] underline underline-offset-2 hover:text-[#0B1220] transition-colors">Build status →</a></li>
              </ul>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-12 text-center">
          <a href="/product/receipts-audit" className="cta-primary">How receipts work <span>→</span></a>
        </Reveal>
      </div>
    </div>
  )
}
