// API mode — runs, approvals, executions, receipts, policies, events.
// Every action is a real API call through MutationButton (capability-gated,
// confirmed, idempotent); results are re-read from the API, never assumed.

import { useState } from 'react'
import { PageHeader, Panel, Pill, Table, IdLink, KV, FilterBar, Filter } from '../../../components/dash/ui'
import { ApiView, PagedView, MutationButton, Notice, Freshness } from '../../../components/dash/api-ui'
import { useApi } from '../../../lib/api/useApi'
import { usePagedList } from '../../../lib/api/usePagedList'
import * as api from '../../../lib/api/endpoints'
import type { S } from '../../../lib/api/endpoints'

const when = (t?: string | null) => (t ? new Date(t).toLocaleString() : '—')
const RUN_STATUSES: S['RunStatus'][] = ['open', 'awaiting_approval', 'blocked', 'escalated', 'closed']
const APPROVAL_STATES: S['ApprovalState'][] = ['REQUESTED', 'GRANTED', 'DENIED', 'CONSUMED', 'EXPIRED', 'REVOKED', 'SUPERSEDED']
const OUTCOMES: S['ExecutionOutcome'][] = ['REFUSED', 'BLOCKED', 'STARTED', 'SUCCEEDED', 'FAILED', 'PROVIDER_UNAVAILABLE', 'OUTCOME_UNKNOWN', 'RETRY_SCHEDULED', 'RETRY_EXHAUSTED']
const RECEIPT_STATUSES: S['ReceiptStatus'][] = ['ISSUED', 'PENDING', 'FAILED']
const EVENT_TYPES: S['EventType'][] = ['approval.requested', 'approval.granted', 'approval.denied', 'approval.revoked', 'execution.state_changed', 'receipt.issued', 'receipt.failed', 'run.opened', 'run.closed', 'kill_order.activated', 'kill_order.restored', 'connection.revoked']

function ListPage<T>({ title, sub, filterLabel, filterOptions, list, filter, setFilter, empty, render }: {
  title: string; sub: string; filterLabel?: string; filterOptions?: string[]; filter?: string; setFilter?: (v: string) => void
  list: ReturnType<typeof usePagedList<T>>; empty: string; render: (rows: T[]) => React.ReactNode
}) {
  return (
    <div>
      <PageHeader title={title} sub={sub} maturity="WIRED" />
      <FilterBar>
        {filterLabel && filterOptions && setFilter && <Filter label={filterLabel} value={filter ?? ''} options={filterOptions} onChange={setFilter} />}
        <span className="ml-auto"><Freshness loadedAt={list.loadedAt} onRefresh={list.reload} /></span>
      </FilterBar>
      <PagedView list={list} empty={empty}>{render}</PagedView>
    </div>
  )
}

// ── runs ────────────────────────────────────────────────────────────────
export function ApiRuns() {
  const [status, setStatus] = useState('')
  const list = usePagedList(`runs:${status}`, (cursor) => api.listRuns({ status: (status || undefined) as S['RunStatus'] | undefined, cursor }))
  return <ListPage title="Agent runs" sub="OAL runs as the API reports them. Runs plan and request approval; execution belongs to the broker."
    filterLabel="Status" filterOptions={RUN_STATUSES} filter={status} setFilter={setStatus} list={list} empty="No runs."
    render={(rows) => <Table head={['Run', 'Objective', 'Mode', 'Phase', 'Status', 'Connectors', 'Opened', 'Updated']} rows={rows.map((r) => [
      <IdLink key="i" to={`/app/agents/runs/${r.run_id}`}>{r.run_id}</IdLink>, r.objective ?? '—', r.mode, r.phase, <Pill key="s" v={r.status} />,
      (r.connector_ids ?? []).join(', ') || '—', when(r.opened_at), when(r.updated_at),
    ])} />} />
}

export function ApiRunDetail({ id }: { id: string }) {
  const r = useApi(`run:${id}`, () => api.getRun(id))
  const approvals = useApi(`run-approvals:${id}`, () => api.listApprovals({ run_id: id }))
  const execs = useApi(`run-execs:${id}`, () => api.listExecutions({ run_id: id }))
  return (
    <ApiView result={r}>
      {(run) => (
        <div>
          <PageHeader title={run.run_id} sub={run.objective ?? undefined} maturity="WIRED" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Run">
              <KV items={[['Mode', run.mode], ['Phase', run.phase], ['Status', <Pill key="s" v={run.status} />], ['Trigger', `${run.trigger.kind}${run.trigger.principal_id ? ` · ${run.trigger.principal_id}` : ''}`],
                ['Window', `${when(run.window.not_before)} → ${when(run.window.not_after)}`], ['Plans', (run.plan_ids ?? []).join(', ') || '—'], ['Opened', when(run.opened_at)], ['Updated', when(run.updated_at)]]} />
            </Panel>
            <Panel title="Approvals">
              <ApiView result={approvals} isEmpty={(l) => !l.data.length} empty="No approvals for this run.">
                {(l) => <Table head={['Approval', 'State', 'Requested']} rows={l.data.map((a) => [<IdLink key="i" to={`/app/approvals/${a.approval_id}`}>{a.approval_id}</IdLink>, <Pill key="s" v={a.state} />, when(a.requested_at)])} />}
              </ApiView>
            </Panel>
          </div>
          <div className="mt-4"><Panel title="Executions">
            <ApiView result={execs} isEmpty={(l) => !l.data.length} empty="No executions for this run.">
              {(l) => <Table head={['Execution', 'Tool', 'Outcome', 'Receipt']} rows={l.data.map((e) => [<IdLink key="i" to={`/app/executions/${e.execution_id}`}>{e.execution_id}</IdLink>, <span key="t" className="font-mono text-[12px]">{e.tool_id}</span>, <Pill key="o" v={e.outcome} />, <Pill key="r" v={e.receipt.status} />])} />}
            </ApiView>
          </Panel></div>
        </div>
      )}
    </ApiView>
  )
}

// ── approvals ───────────────────────────────────────────────────────────
export function ApiApprovals() {
  const [state, setState] = useState('')
  const list = usePagedList(`approvals:${state}`, (cursor) => api.listApprovals({ state: (state || undefined) as S['ApprovalState'] | undefined, cursor }))
  return <ListPage title="Approvals" sub="The human gate. Grants are single-use and expire; only a human operator with the approve capability can decide."
    filterLabel="State" filterOptions={APPROVAL_STATES} filter={state} setFilter={setState} list={list} empty={state ? `No ${state} approvals.` : 'No approvals.'}
    render={(rows) => <Table head={['Approval', 'State', 'Run', 'Steps', 'Requested by', 'Decided by', 'Requested', 'Expires']} rows={rows.map((a) => [
      <IdLink key="i" to={`/app/approvals/${a.approval_id}`}>{a.approval_id}</IdLink>, <Pill key="s" v={a.state} />,
      <IdLink key="r" to={`/app/agents/runs/${a.run_id}`}>{a.run_id}</IdLink>, a.steps.map((s) => `${s.step_id} (${s.operation_class})`).join(', '),
      a.requested_by ?? '—', a.approved_by?.principal_id ?? '—', when(a.requested_at), when(a.expires_at),
    ])} />} />
}

export function ApiApprovalDetail({ id }: { id: string }) {
  const r = useApi(`approval:${id}`, () => api.getApproval(id))
  const [notice, setNotice] = useState<string | null>(null)
  const done = (a: S['Approval']) => { setNotice(`Approval is now ${a.state}${a.approved_by ? ` (by ${a.approved_by.principal_id})` : ''}.`); r.reload() }
  return (
    <ApiView result={r}>
      {(a) => (
        <div>
          {notice && <Notice text={notice} onClose={() => setNotice(null)} />}
          <PageHeader title={a.approval_id} sub={`Run ${a.run_id} · plan ${a.plan_id} rev ${a.plan_revision ?? 1}`} maturity="WIRED"
            actions={<>
              {a.state === 'REQUESTED' && <>
                <MutationButton label="Approve" capability="approve" testId="approval-grant" confirmTitle="Grant this approval?"
                  confirmBody={<>Grants <b>{a.steps.length}</b> step(s): {a.steps.map((s) => `${s.step_id} (${s.operation_class})`).join(', ')}. The grant is single-use and expires.</>}
                  fields={[{ name: 'ttl', label: 'Valid for (seconds)', required: true, type: 'number', defaultValue: '3600' }, { name: 'note', label: 'Note', type: 'textarea' }]}
                  run={(v, key) => api.grantApproval(a.approval_id, { ttl_seconds: Number(v.ttl), note: v.note || undefined }, key)} onDone={done} />
                <MutationButton label="Deny" danger capability="approve" testId="approval-deny" confirmTitle="Deny this approval?"
                  confirmBody="The plan steps will not run. The reason is recorded." fields={[{ name: 'reason', label: 'Reason', required: true, type: 'textarea' }]}
                  run={(v, key) => api.denyApproval(a.approval_id, { reason: v.reason }, key)} onDone={done} />
              </>}
              {a.state === 'GRANTED' && <MutationButton label="Revoke" danger capability="approve" testId="approval-revoke" confirmTitle="Revoke this grant?"
                confirmBody="Unused steps can no longer execute. The reason is recorded." fields={[{ name: 'reason', label: 'Reason', required: true, type: 'textarea' }]}
                run={(v, key) => api.revokeApproval(a.approval_id, { reason: v.reason }, key)} onDone={done} />}
              {a.state !== 'REQUESTED' && a.state !== 'GRANTED' && <span className="text-[12px] text-[var(--c-muted)]">{a.state} — no further decision is possible.</span>}
            </>} />
          <Panel title="Decision">
            <KV items={[['State', <Pill key="s" v={a.state} />], ['OAL status', a.oal_status ?? '—'], ['Policy', a.policy_id ?? '—'], ['Requested by', a.requested_by ?? '—'],
              ['Decided by', a.approved_by ? `${a.approved_by.principal_id} (human)` : '—'], ['Reason', a.decision_reason ?? '—'],
              ['Requested', when(a.requested_at)], ['Granted', when(a.granted_at)], ['Expires', when(a.expires_at)]]} />
          </Panel>
          <div className="mt-4"><Panel title="Steps">
            <Table head={['Step', 'Op class', 'Execution', 'Consumed', 'Recorded outcome']} rows={a.steps.map((s) => [s.step_id, s.operation_class,
              s.execution_id ? <IdLink key="e" to={`/app/executions/${s.execution_id}`}>{s.execution_id}</IdLink> : '—', when(s.consumed_at), s.recorded_outcome ? <Pill key="o" v={s.recorded_outcome} /> : '—'])} />
          </Panel></div>
        </div>
      )}
    </ApiView>
  )
}

// ── executions ──────────────────────────────────────────────────────────
export function ApiExecutions() {
  const [outcome, setOutcome] = useState('')
  const list = usePagedList(`executions:${outcome}`, (cursor) => api.listExecutions({ outcome: (outcome || undefined) as S['ExecutionOutcome'] | undefined, cursor }))
  return <ListPage title="Executions" sub="What the broker did. Outcome (EXEC-FACTS) and receipt status are independent columns; OUTCOME_UNKNOWN is never retried, only reconciled."
    filterLabel="Outcome" filterOptions={OUTCOMES} filter={outcome} setFilter={setOutcome} list={list} empty={outcome ? `No ${outcome} executions.` : 'No executions.'}
    render={(rows) => <Table head={['Execution', 'Connector', 'Tool', 'Op class', 'Outcome', 'Settled', 'Receipt', 'Created']} rows={rows.map((e) => [
      <IdLink key="i" to={`/app/executions/${e.execution_id}`}>{e.execution_id}</IdLink>, e.connector_id, <span key="t" className="font-mono text-[12px]">{e.tool_id}</span>,
      e.operation_class, <Pill key="o" v={e.outcome} />, e.settled ? 'yes' : 'no', <Pill key="r" v={e.receipt.status} />, when(e.created_at),
    ])} />} />
}

export function ApiExecutionDetail({ id }: { id: string }) {
  const r = useApi(`execution:${id}`, () => api.getExecution(id))
  const [notice, setNotice] = useState<string | null>(null)
  return (
    <ApiView result={r}>
      {(e) => (
        <div>
          {notice && <Notice text={notice} onClose={() => setNotice(null)} />}
          <PageHeader title={e.execution_id} sub={`${e.tool_id} · run ${e.run_id}`} maturity="WIRED"
            actions={e.outcome === 'OUTCOME_UNKNOWN'
              ? <MutationButton label="Reconcile" capability="execute" testId="exec-reconcile" confirmTitle="Reconcile this execution?"
                  confirmBody="Record what the provider actually did, with evidence. OUTCOME_UNKNOWN can only become SUCCEEDED or FAILED."
                  fields={[{ name: 'outcome', label: 'Observed outcome', required: true, type: 'select', options: ['SUCCEEDED', 'FAILED'] },
                    { name: 'method', label: 'Evidence method', required: true, type: 'select', options: ['read_back_by_resource_id', 'read_back_by_idempotency_key', 'provider_list_scan', 'manual'] },
                    { name: 'provider_request_id', label: 'Provider request id' }, { name: 'note', label: 'Evidence note', required: true, type: 'textarea' }]}
                  run={(v, key) => api.reconcileExecution(e.execution_id, { outcome: v.outcome as 'SUCCEEDED' | 'FAILED', evidence: { method: v.method as S['ReconcileRequest']['evidence']['method'], provider_request_id: v.provider_request_id || undefined, note: v.note } }, key)}
                  onDone={(x) => { setNotice(`Reconciled as ${x.outcome}.`); r.reload() }} />
              : <span className="text-[12px] text-[var(--c-muted)]">Retries are owned by the broker; no manual retry is exposed.</span>} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Outcome">
              <KV items={[['Outcome', <Pill key="o" v={e.outcome} />], ['Settled', e.settled ? 'yes' : 'no'], ['Op class', e.operation_class],
                ['Reconciliation', e.reconciliation?.status ?? '—'], ['Verification', e.verification?.verdict ?? '—'],
                ['Approval', e.approval_id ? <IdLink key="a" to={`/app/approvals/${e.approval_id}`}>{e.approval_id}</IdLink> : '—'],
                ['Connection', e.connection_id ? <IdLink key="c" to={`/app/connections/${e.connection_id}`}>{e.connection_id}</IdLink> : '—']]} />
            </Panel>
            <Panel title="Receipt">
              <KV items={[['Status', <Pill key="s" v={e.receipt.status} />], ['Receipt', e.receipt.receipt_id ? <IdLink key="r" to={`/app/receipts/${e.receipt.receipt_id}`}>{e.receipt.receipt_id}</IdLink> : '—'],
                ['Verification', <Pill key="v" v={e.receipt.verification} />], ['Evidence grade', e.receipt.evidence_grade.replaceAll('_', ' ')]]} />
            </Panel>
          </div>
          <div className="mt-4"><Panel title={`Attempts (${e.attempts.length})`}>
            <Table head={['#', 'Outcome', 'Error class', 'Provider request', 'HTTP', 'Recorded']} rows={e.attempts.map((x) => [x.attempt_n, <Pill key="o" v={x.outcome} />, x.error_class ?? '—', x.provider_request_id ?? '—', x.provider_status ?? '—', when(x.recorded_at)])} />
          </Panel></div>
        </div>
      )}
    </ApiView>
  )
}

// ── receipts ────────────────────────────────────────────────────────────
export function ApiReceipts() {
  const [status, setStatus] = useState('')
  const list = usePagedList(`receipts:${status}`, (cursor) => api.listReceipts({ status: (status || undefined) as S['ReceiptStatus'] | undefined, cursor }))
  return <ListPage title="Receipts" sub="R-Series receipts per fact. Connector OS does no receipt cryptography; verification is delegated and labelled with the verifier kind."
    filterLabel="Status" filterOptions={RECEIPT_STATUSES} filter={status} setFilter={setStatus} list={list} empty="No receipts."
    render={(rows) => <Table head={['Receipt', 'Status', 'Execution', 'Outcome', 'Issuer', 'Issued']} rows={rows.map((x) => [
      <IdLink key="i" to={`/app/receipts/${x.receipt_id}`}>{x.receipt_id}</IdLink>, <Pill key="s" v={x.status} />,
      <IdLink key="e" to={`/app/executions/${x.execution_id}`}>{x.execution_id}</IdLink>, <Pill key="o" v={x.execution_outcome} />, x.issuer_kind ?? '—', when(x.issued_at),
    ])} />} />
}

export function ApiReceiptDetail({ id }: { id: string }) {
  const r = useApi(`receipt:${id}`, () => api.getReceipt(id))
  const [result, setResult] = useState<S['ReceiptVerification'] | null>(null)
  return (
    <ApiView result={r}>
      {(x) => (
        <div>
          <PageHeader title={x.receipt_id} sub={`${x.profile} ${x.profile_version} · execution ${x.execution_id}`} maturity="WIRED"
            actions={<MutationButton label="Verify" capability="view" testId="receipt-verify" confirmTitle="Verify this receipt?"
              confirmBody="Asks the configured verifier. A result is “verified” only when an R-Series verifier says so." run={() => api.verifyReceipt(x.receipt_id)} onDone={setResult} />} />
          {result && (
            <div className="mb-4" data-testid="verify-result"><Panel title="Verification result">
              <KV items={[['Verification', <Pill key="v" v={result.verification} />], ['Verifier', result.verifier_kind], ['Evidence grade', result.evidence_grade.replaceAll('_', ' ')],
                ['Outcome matches', result.execution_outcome_matches == null ? '—' : result.execution_outcome_matches ? 'yes' : 'no'], ['Checked', when(result.checked_at)]]} />
              {result.verifier_kind === 'test_double' && <p className="mt-3 text-[12px] text-[var(--c-warn)]">Test-double verifier: this is not evidence.</p>}
            </Panel></div>
          )}
          <Panel title="Receipt">
            <KV items={[['Status', <Pill key="s" v={x.status} />], ['Execution outcome', <Pill key="o" v={x.execution_outcome} />], ['Attempt', x.attempt_n], ['Sequence', x.seq ?? '—'],
              ['Parent', x.parent_receipt ?? '—'], ['Issuer kind', x.issuer_kind ?? '—'], ['Issued', when(x.issued_at)],
              ['Run', x.run_id ? <IdLink key="r" to={`/app/agents/runs/${x.run_id}`}>{x.run_id}</IdLink> : '—']]} />
          </Panel>
        </div>
      )}
    </ApiView>
  )
}

// ── policies ────────────────────────────────────────────────────────────
export function ApiPolicies() {
  const list = usePagedList('policies', (cursor) => api.listPolicies({ cursor }))
  return <ListPage title="Policies" sub="Policy rules as stored. Authoring is not in contract 1.0.0 (read + evaluate only)." list={list} empty="No policies."
    render={(rows) => <Table head={['Policy', 'Name', 'Version', 'Status', 'Rules']} rows={rows.map((p) => [
      <IdLink key="i" to={`/app/policies/${p.policy_id}`}>{p.policy_id}</IdLink>, p.name, p.version, <Pill key="s" v={p.status} />, p.rules.map((r) => `${r.operation_class}→${r.decision}`).join(' · '),
    ])} />} />
}

export function ApiPolicyDetail({ id }: { id: string }) {
  const r = useApi(`policy:${id}`, () => api.getPolicy(id))
  const [decision, setDecision] = useState<S['PolicyDecision'] | null>(null)
  return (
    <ApiView result={r}>
      {(p) => (
        <div>
          <PageHeader title={p.name} sub={`${p.policy_id} · ${p.version}`} maturity="WIRED"
            actions={<MutationButton label="Evaluate" capability="view" testId="policy-evaluate" confirmTitle="Dry-run a policy decision"
              confirmBody="Evaluates without executing anything."
              fields={[{ name: 'connector_id', label: 'Connector id', required: true }, { name: 'tool_id', label: 'Tool id', required: true },
                { name: 'operation_class', label: 'Operation class', required: true, type: 'select', options: ['read', 'write', 'admin'] },
                { name: 'environment', label: 'Environment', type: 'select', options: ['staging', 'production'] }]}
              run={(v) => api.evaluatePolicy({ connector_id: v.connector_id, tool_id: v.tool_id, operation_class: v.operation_class as S['OperationClass'], environment: (v.environment || undefined) as 'staging' | 'production' | undefined })}
              onDone={setDecision} />} />
          {decision && <div className="mb-4" data-testid="policy-decision"><Panel title="Decision (dry run)"><KV items={[['Decision', <Pill key="d" v={decision.decision} />], ['Policy', decision.policy_id], ['Reasons', decision.reasons.join(', ')], ['Dispatch eligible', decision.dispatch_eligible == null ? '—' : decision.dispatch_eligible ? 'yes' : 'no']]} /></Panel></div>}
          <Panel title="Rules">
            <Table head={['Operation class', 'Decision', 'Note']} rows={p.rules.map((x) => [x.operation_class, <Pill key="d" v={x.decision} />, x.note ?? '—'])} />
          </Panel>
        </div>
      )}
    </ApiView>
  )
}

// ── events ──────────────────────────────────────────────────────────────
export function ApiEvents() {
  const [type, setType] = useState('')
  const list = usePagedList(`events:${type}`, (cursor) => api.listEvents({ type: (type || undefined) as S['EventType'] | undefined, cursor }))
  return <ListPage title="Events" sub="Platform event log (reference-only payloads). Outbound webhook delivery is not implemented in contract 1.0.0."
    filterLabel="Type" filterOptions={EVENT_TYPES} filter={type} setFilter={setType} list={list} empty="No events."
    render={(rows) => <Table head={['Event', 'Type', 'Occurred', 'Run', 'Data']} rows={rows.map((ev) => [
      <span key="i" className="font-mono text-[12px]">{ev.event_id}</span>, ev.type, when(ev.occurred_at),
      ev.run_id ? <IdLink key="r" to={`/app/agents/runs/${ev.run_id}`}>{ev.run_id}</IdLink> : '—',
      <span key="d" className="font-mono text-[11px] text-[var(--c-muted)]">{Object.entries(ev.data).map(([k, v]) => `${k}=${String(v)}`).join(' ')}</span>,
    ])} />} />
}
