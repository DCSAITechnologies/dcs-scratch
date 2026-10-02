// §4.8 Executions — what the broker did. Two statuses, always: outcome and
// receipt_state are separate columns, from separate stores.

import { useState } from 'react'
import { PageHeader, Panel, Pill, Table, IdLink, EmptyState, StateGate, FilterBar, Filter, Action, KV } from '../../components/dash/ui'
import { EXECUTIONS, fmtConn, EXECUTION_STATES } from '../../lib/fixtures'

export function DashExecutions() {
  const [outcome, setOutcome] = useState('')
  const [connector, setConnector] = useState('')
  const [recon, setRecon] = useState(false)
  const rows = EXECUTIONS.filter((e) =>
    (!outcome || e.outcome === outcome) && (!connector || e.connector === connector) && (!recon || e.outcome === 'OUTCOME_UNKNOWN'))

  return (
    <StateGate empty={<EmptyState text="No executions in this scope yet. Executions appear after the first approved step dispatches." />}>
      <div>
        <PageHeader
          title="Executions"
          sub="What the broker did — never derived from agent reasoning. Outcome and receipt state are independent columns: an execution can SUCCEED while its receipt is PENDING, and vice versa is impossible to infer."
          maturity="HERMETIC ONLY"
        />
        <FilterBar>
          <Filter label="Outcome" value={outcome} options={EXECUTION_STATES} onChange={setOutcome} />
          <Filter label="Connector" value={connector} options={[...new Set(EXECUTIONS.map((e) => e.connector))].map(fmtConn)} onChange={(v) => setConnector(EXECUTIONS.find((e) => fmtConn(e.connector) === v)?.connector ?? '')} />
          <label className="inline-flex items-center gap-2 text-[12px] text-[#A9B6D3]">
            <input type="checkbox" checked={recon} onChange={(e) => setRecon(e.target.checked)} className="accent-[#4D8DFF]" />
            needs reconciliation
          </label>
        </FilterBar>
        {rows.length === 0 ? <EmptyState text="No executions match these filters." /> : (
          <div className="glass-card p-5">
            <Table
              head={['Execution', 'Run', 'Connector', 'Tool', 'Op class', 'Attempts', 'Outcome', 'Receipt state', 'Verification', 'Reconciliation', 'Started', 'Env']}
              rows={rows.map((e) => [
                <IdLink key="id" to={`/app/executions/${e.id}`}>{e.id}</IdLink>,
                <IdLink key="r" to={`/app/agents/runs/${e.run}`}>{e.run}</IdLink>,
                fmtConn(e.connector),
                <span key="t" className="font-mono text-[12px]">{e.tool}</span>,
                e.operation_class, String(e.attempts.length || '—'),
                <Pill key="o" v={e.outcome} />, <Pill key="rs" v={e.receipt_state} />,
                <span key="v" className="text-[12px] text-[#A9B6D3]">{e.verification}</span>,
                <span key="rc" className="text-[12px] text-[#A9B6D3]">{e.reconciliation}</span>,
                e.started, e.environment,
              ])}
            />
          </div>
        )}
      </div>
    </StateGate>
  )
}

export function DashExecutionDetail({ id }: { id: string }) {
  const e = EXECUTIONS.find((x) => x.id === id)
  if (!e) return <EmptyState text="Execution not found in this workspace." cta="Back to executions" href="/app/executions" />
  const noManualRetry = e.retry_safety === 'unsafe' || e.retry_safety === 'unknown'
  return (
    <div>
      <PageHeader title={e.id} sub={`${e.tool} on ${fmtConn(e.connector)} — run ${e.run}.`} maturity="HERMETIC ONLY" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Panel title="Two statuses">
          <div className="flex items-center gap-3 flex-wrap">
            <div><div className="text-[10.5px] uppercase tracking-[0.12em] text-[#5B6884] font-semibold mb-1">Outcome</div><Pill v={e.outcome} /></div>
            <div><div className="text-[10.5px] uppercase tracking-[0.12em] text-[#5B6884] font-semibold mb-1">Receipt state</div><Pill v={e.receipt_state} /></div>
          </div>
          {e.receipt_state === 'FAILED' && (
            <p className="mt-3 text-[12px] text-[#E8C98A] leading-relaxed">The execution succeeded but receipt issuance failed. Behaviour per class (block vs PENDING) is founder decision FD-1 — surfaced in Settings.</p>
          )}
        </Panel>
        <Panel title="Routing context">
          <KV items={[
            ['Tenant', e.routing.tenant], ['Connection', <IdLink key="c" to={`/app/connections/${e.connection}`}>{e.connection}</IdLink>],
            ['Host', e.routing.host], ['Region', e.routing.region], ['Environment', e.environment],
          ]} />
        </Panel>
        <Panel title="Governance refs">
          <KV items={[
            ['Policy decision', e.policy_ref], ['Approval', e.approval_ref],
            ['Receipt', e.receipt_ref !== '—' ? <IdLink key="rc" to={`/app/receipts/${e.receipt_ref}`}>{e.receipt_ref}</IdLink> : '—'],
          ]} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title={`Attempts (${e.attempts.length || 'none — never dispatched'})`}>
          {e.attempts.length ? (
            <Table head={['n', 'Started', 'Provider classification', 'Outcome', 'provider_request_id']} rows={e.attempts.map((a) => [
              String(a.n), a.started, a.classification, <Pill key="o" v={a.outcome} />, <span key="p" className="font-mono text-[11.5px]">{a.provider_request_id}</span>,
            ])} />
          ) : <p className="text-[12.5px] text-[#A9B6D3]">Policy refused dispatch — the provider was never called.</p>}
        </Panel>
        <Panel title="Verification & reconciliation">
          <KV items={[
            ['Verification', e.verification], ['Reconciliation', e.reconciliation],
            ['Retry safety', e.retry_safety],
          ]} />
          <div className="mt-4 flex flex-wrap gap-3">
            <Action label="Reconcile now" maturity="HERMETIC ONLY" title="Governed read against provider state" />
            <Action label="Escalate" maturity="HERMETIC ONLY" />
            {/* no manual retry for unsafe/unknown — button absent, not disabled */}
            {!noManualRetry && <Action label="Retry" maturity="HERMETIC ONLY" />}
          </div>
          {noManualRetry && (
            <p className="mt-3 text-[11.5px] text-[#5B6884]">No manual retry is offered: retry_safety is <span className="font-mono">{e.retry_safety}</span> for this tool. Reconciliation resolves it.</p>
          )}
        </Panel>
      </div>
    </div>
  )
}
