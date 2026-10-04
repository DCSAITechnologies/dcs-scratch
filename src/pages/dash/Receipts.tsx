import { navigate } from '../../hooks/usePathRoute'
// §4.9 Receipts / R-Series — evidence, not an activity log. Normal view is a
// plain-language trust summary + causal chain; advanced view is field groups.
// Payloads are never shown — digests only. No algorithm names in copy.

import { useState } from 'react'
import { PageHeader, Panel, Pill, Table, IdLink, EmptyState, StateGate, FilterBar, Filter, Action, KV, MaturityTag } from '../../components/dash/ui'
import { RECEIPTS, fmtConn } from '../../lib/fixtures'

export function DashReceipts() {
  const [state, setState] = useState('')
  const rows = RECEIPTS.filter((r) => !state || r.state === state)
  return (
    <StateGate empty={<EmptyState text="No receipts in this scope yet. Receipts are issued per execution fact as the broker works." />}>
      <div>
        <PageHeader
          title="Receipts"
          sub="Evidence, not an activity log. One receipt per execution fact, chained by causal identity. Two statuses on every row: execution outcome and receipt state."
          maturity="HERMETIC ONLY"
        />
        <div className="mb-4 flex flex-wrap items-center gap-2 text-[11.5px] text-[var(--c-text-2)]">
          <MaturityTag m="EXTERNAL DEPENDENCY" /> Signing posture is the test signer; KMS/HSM lands with roadmap item 18. Verify over the authenticated route is <MaturityTag m="STAGING ONLY" />
        </div>
        <FilterBar>
          <Filter label="State" value={state} options={['ISSUED', 'PENDING', 'FAILED']} onChange={setState} />
        </FilterBar>
        {rows.length === 0 ? <EmptyState text="No receipts match these filters." /> : (
          <div className="glass-card p-5">
            <Table
              head={['Receipt', 'Receipt state', 'Execution outcome', 'Type', 'Seq', 'Parent', 'Run', 'Connector', 'Tool', 'Issued at', 'Verification (cached)']}
              rows={rows.map((r) => [
                <IdLink key="id" to={`/app/receipts/${r.id}`}>{r.id}</IdLink>,
                <Pill key="s" v={r.state} />, <Pill key="o" v={r.execution_outcome} />,
                r.type, String(r.sequence), <span key="p" className="font-mono text-[11.5px]">{r.parent}</span>,
                <IdLink key="r" to={`/app/agents/runs/${r.run}`}>{r.run}</IdLink>,
                fmtConn(r.connector), <span key="t" className="font-mono text-[12px]">{r.tool}</span>,
                r.issued_at, <span key="v" className="text-[12px] text-[var(--c-text-2)]">{r.verification}</span>,
              ])}
            />
          </div>
        )}
      </div>
    </StateGate>
  )
}

export function DashReceiptDetail({ id }: { id: string }) {
  const r = RECEIPTS.find((x) => x.id === id)
  const [advanced, setAdvanced] = useState(false)
  if (!r) return <EmptyState text="Receipt not found in this workspace." cta="Back to receipts" href="/app/receipts" />
  const chain = RECEIPTS.filter((x) => x.run === r.run).sort((a, b) => a.sequence - b.sequence)
  return (
    <div>
      <PageHeader
        title={r.id}
        sub="Digests only — payloads never render here."
        maturity="HERMETIC ONLY"
        actions={
          <>
            <div className="flex rounded-lg border border-[var(--c-border)] overflow-hidden">
              <button type="button" onClick={() => setAdvanced(false)} className={`px-3 py-1.5 text-[12px] font-semibold ${!advanced ? 'bg-[color-mix(in_srgb,var(--c-info)_15%,transparent)] text-[var(--c-text)]' : 'text-[var(--c-text-2)]'}`}>Normal</button>
              <button type="button" onClick={() => setAdvanced(true)} className={`px-3 py-1.5 text-[12px] font-semibold ${advanced ? 'bg-[color-mix(in_srgb,var(--c-info)_15%,transparent)] text-[var(--c-text)]' : 'text-[var(--c-text-2)]'}`}>Advanced</button>
            </div>
            <Action label="Verify receipt" maturity="HERMETIC ONLY" title="In-process verifier today; authenticated route on staging" />
            <Action label="Export receipt + proof" maturity="PLANNED" />
            <Action label="View run chain" maturity="WIRED" onClick={() => navigate(`/app/agents/runs/${r.run}`)} />
          </>
        }
      />

      {!advanced ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="Trust summary">
            <p className="text-[13.5px] text-[var(--c-text-2)] leading-relaxed">
              This receipt attests that step <b>{r.tool}</b> on <b>{fmtConn(r.connector)}</b> finished with outcome
              <span className="mx-1"><Pill v={r.execution_outcome} /></span>
              inside run <IdLink to={`/app/agents/runs/${r.run}`}>{r.run}</IdLink>, under the policy decision and approval recorded in its digests.
            </p>
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <Pill v={r.state} />
              <span className="text-[12.5px] text-[var(--c-ok)] font-semibold">Verified — {r.verification}</span>
              <span className="text-[11.5px] text-[var(--c-muted)]">cached result · re-verify for freshness</span>
            </div>
          </Panel>
          <Panel title={`Causal chain — ${r.run}`}>
            <ol className="space-y-2">
              {chain.map((c) => (
                <li key={c.id} className={`flex items-center gap-3 text-[12.5px] ${c.id === r.id ? 'text-[var(--c-text)] font-semibold' : 'text-[var(--c-text-2)]'}`}>
                  <span className="w-5 text-[var(--c-muted)] font-mono text-[11px]">#{c.sequence}</span>
                  <IdLink to={`/app/receipts/${c.id}`}>{c.id}</IdLink>
                  <span className="font-mono text-[11.5px]">{c.tool}</span>
                  <Pill v={c.state} />
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="Schema & causal identity">
            <KV items={[
              ['Profile', r.profile],
              ['Run', r.run], ['Parent', r.parent], ['Sequence', String(r.sequence)],
              ['Tenant / actor', 'org_acme · ops-broker'],
            ]} />
          </Panel>
          <Panel title="Execution & digests">
            <KV items={[
              ['Connector execution', `${fmtConn(r.connector)} · ${r.tool}`],
              ['Intent digest', <span key="i" className="font-mono text-[11.5px]">sha256:4ad1…c9</span>],
              ['Plan digest', <span key="p" className="font-mono text-[11.5px]">sha256:a1f4…77</span>],
              ['Policy ref', 'pol_ops_read v5'],
              ['Approval ref', 'ap_01J1H12 (consumed)'],
              ['Input digest', <span key="in" className="font-mono text-[11.5px]">sha256:7b02…e3</span>],
              ['Provider evidence digest', <span key="pe" className="font-mono text-[11.5px]">sha256:d5c8…2a</span>],
              ['Outcome', <Pill key="o" v={r.execution_outcome} />],
            ]} />
          </Panel>
          <Panel title="Verification & signature" className="lg:col-span-2">
            <KV items={[
              ['Verification', r.verification],
              ['Recovery', '—'],
              ['Signature suite', `${r.suite} — production posture pending (KMS/HSM, item 18)`],
              ['Key id', r.key_id],
              ['Chain reference', 'in-process today'],
              ['Transparency reference', 'append exercised hermetically; published log pending'],
            ]} />
          </Panel>
        </div>
      )}
    </div>
  )
}
