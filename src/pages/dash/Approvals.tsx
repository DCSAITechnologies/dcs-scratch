// §4.7 Approvals — the human gate. Mobile-first: this is the action most
// likely done on a phone. No widening: approver can never edit scope,
// parameters or step. Approver ≠ submitter.

import { useState } from 'react'
import { PageHeader, Panel, Pill, Table, IdLink, EmptyState, StateGate, FilterBar, Filter, Action, KV, PermissionNote, MaturityTag } from '../../components/dash/ui'
import { APPROVALS, fmtConn, type ApprovalState } from '../../lib/fixtures'

const STATES: ApprovalState[] = ['Pending', 'Granted', 'Denied', 'Expired', 'Revoked', 'Consumed', 'Superseded']

export function DashApprovals() {
  const [state, setState] = useState('')
  const [risk, setRisk] = useState('')
  const rows = APPROVALS.filter((a) => (!state || a.state === state) && (!risk || a.risk === risk))

  return (
    <StateGate
      empty={<EmptyState text="No approvals waiting. When a plan needs a human, it appears here with its full evidence." />}
      permission={<><PermissionNote role="Approver" /><ApprovalsList rows={rows} state={state} setState={setState} risk={risk} setRisk={setRisk} readonly /></>}
    >
      <ApprovalsList rows={rows} state={state} setState={setState} risk={risk} setRisk={setRisk} />
    </StateGate>
  )
}

function ApprovalsList({ rows, state, setState, risk, setRisk, readonly = false }: {
  rows: typeof APPROVALS; state: string; setState: (v: string) => void; risk: string; setRisk: (v: string) => void; readonly?: boolean
}) {
  return (
    <div>
      <PageHeader
        title="Approvals"
        sub="The human gate. Approving binds the plan hash and the exact step — single-use, expiring, revocable before consumption. Editing scope, parameters or step is not possible: no widening. Approver is never the identity that submitted the plan."
        maturity="HERMETIC ONLY"
      />
      <div className="mb-4 flex items-center gap-2 text-[11.5px] text-[var(--c-text-2)]">
        <MaturityTag m="EXTERNAL DEPENDENCY" /> Real approver identity ships with the IdP seam (roadmap item 19); approvals then require step-up auth on mobile.
      </div>
      <FilterBar>
        <Filter label="State" value={state} options={STATES} onChange={setState} />
        <Filter label="Risk" value={risk} options={['low', 'medium', 'high', 'critical']} onChange={setRisk} />
      </FilterBar>
      {rows.length === 0 ? (
        <EmptyState text="No approvals waiting" />
      ) : (
        <>
          {/* Mobile: cards (first-class) */}
          <div className="md:hidden space-y-3">
            {rows.map((a) => (
              <a key={a.id} href={`/app/approvals/${a.id}`} className="block glass-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[12px] text-[var(--c-link)]">{a.id}</span>
                  <Pill v={a.state} />
                </div>
                <div className="mt-2 text-[13.5px] text-[var(--c-text)] font-medium">{a.tool}</div>
                <div className="mt-1 text-[12px] text-[var(--c-text-2)]">{fmtConn(a.connector)} · {a.operation_class} · risk {a.risk}{a.dual ? ` · dual ${a.dual}` : ''}</div>
                <div className="mt-1 text-[11.5px] text-[var(--c-muted)]">expires {a.expires} · {a.environment}</div>
              </a>
            ))}
          </div>
          {/* Desktop: table */}
          <div className="hidden md:block glass-card p-5">
            <Table
              head={['Request', 'Agent', 'Run', 'Connector', 'Tool', 'Op class', 'Risk', 'Env', 'Requested', 'Expires', 'State', 'Approver']}
              rows={rows.map((a) => [
                <IdLink key="id" to={`/app/approvals/${a.id}`}>{a.id}</IdLink>,
                a.agent, <IdLink key="r" to={`/app/agents/runs/${a.run}`}>{a.run}</IdLink>,
                fmtConn(a.connector), <span key="t" className="font-mono text-[12px]">{a.tool}</span>,
                a.operation_class, a.risk, a.environment, a.requested, a.expires, <Pill key="s" v={a.state} />, a.approver,
              ])}
            />
          </div>
        </>
      )}
      {!readonly && rows.some((a) => a.state === 'Pending') && (
        <div className="mt-4 text-[12px] text-[var(--c-text-2)]">Open a request to approve, reject or revoke. Decisions produce an audit record; a <span className="font-mono">security.event</span> receipt follows once the bridge route ships — until then the audit row shows Receipt: PENDING.</div>
      )}
    </div>
  )
}

export function DashApprovalDetail({ id }: { id: string }) {
  const a = APPROVALS.find((x) => x.id === id)
  if (!a) {
    return <EmptyState text="Approval not found in this workspace." cta="Back to approvals" href="/app/approvals" />
  }
  const pending = a.state === 'Pending'
  return (
    <div>
      <PageHeader title={a.id} sub={`${a.tool} on ${fmtConn(a.connector)} — requested by ${a.agent}.`} maturity="HERMETIC ONLY" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="What is being asked" className="lg:col-span-2">
          <KV items={[
            ['Agent', a.agent],
            ['Run', <IdLink key="r" to={`/app/agents/runs/${a.run}`}>{a.run}</IdLink>],
            ['Plan hash', <span key="p" className="font-mono text-[12px]">{a.plan_hash}</span>],
            ['Exact step', a.step],
            ['Connector', fmtConn(a.connector)],
            ['Tool', <span key="t" className="font-mono text-[12px]">{a.tool}</span>],
            ['Target resource', <span key="tr" className="font-mono text-[12px]">/customers/:id/refunds (templated)</span>],
            ['Parameters', <span key="pa" className="font-mono text-[12px]">amount=••• (redacted per manifest) · currency=INR · reason=duplicate_charge</span>],
            ['Operation class', a.operation_class],
            ['Side effects', 'true — money moves'],
            ['Risk', a.risk],
            ['Policy that required approval', `${a.policy}`],
            ['Environment', a.environment],
            ['Expiry', a.expires],
          ]} />
        </Panel>
        <div className="space-y-4">
          <Panel title="State">
            <div className="flex items-center gap-2"><Pill v={a.state} />{a.dual && <span className="text-[12px] text-[var(--c-warn)] font-semibold">dual approval · {a.dual}</span>}</div>
            <div className="mt-3 text-[12.5px] text-[var(--c-text-2)] leading-relaxed">
              Approve binds plan hash <span className="font-mono text-[11.5px]">{a.plan_hash}</span> and {a.step}. Single-use; consumed-by link appears on the execution. No widening.
            </div>
          </Panel>
          <Panel title="Evidence refs">
            <div className="space-y-1.5 text-[12.5px] text-[var(--c-text-2)]">
              <div>Diagnosis: <span className="font-mono text-[11.5px] text-[var(--c-link)]">ev_01J3A2</span> (charge.refunded, verified)</div>
              <div>Observations: 2 · inbound_trust=verified</div>
              <div>Prior attempts: 0 on this step</div>
            </div>
          </Panel>
          <Panel title="Decision">
            {pending ? (
              <div className="flex flex-col gap-3">
                <Action label="Approve" maturity="HERMETIC ONLY" title="Single-use; binds plan hash + step" />
                <Action label="Reject (reason required)" maturity="HERMETIC ONLY" danger />
                <Action label="Revoke" maturity="HERMETIC ONLY" danger title="Only before consumption" />
                <p className="text-[11.5px] text-[var(--c-muted)] leading-relaxed">Actions render disabled in the preview: the approval store is in-process; durable approvals land with roadmap item 15.</p>
              </div>
            ) : (
              <p className="text-[12.5px] text-[var(--c-text-2)]">This request is {a.state.toLowerCase()}{a.approver !== '—' ? ` by ${a.approver}` : ''}. No further action.</p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
