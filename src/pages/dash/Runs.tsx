// §4.5 Agents / OAL — runs, not configurable "agents". Reasoning ≠ execution:
// this screen never offers "run this plan" — only submit for approval.
// §4.6 Policies — declarative rules with versions, evaluated by A4.

import { useState } from 'react'
import { PageHeader, Panel, Pill, Table, IdLink, EmptyState, StateGate, FilterBar, Filter, Action, KV, MaturityTag } from '../../components/dash/ui'
import { RUNS, POLICIES, EXECUTIONS, APPROVALS, RECEIPTS, fmtConn } from '../../lib/fixtures'
import { LIFECYCLE_10, MODE_BOUNDARIES } from '../../lib/lifecycle'

// ── Runs list ──────────────────────────────────────────────────────────────
export function DashRuns() {
  const [stage, setStage] = useState('')
  const [outcome, setOutcome] = useState('')
  const rows = RUNS.filter((r) =>
    (!outcome || r.execution_outcome === outcome) &&
    (!stage || (stage === 'live' ? r.stage < 10 : r.stage === 10)))
  return (
    <StateGate empty={<EmptyState text="No runs yet — runs start from signals or requests." />}>
      <div>
        <PageHeader
          title="Agent runs"
          sub="Runs, not agents: v1 has no agent builder — agents are identities under policy. These screens show plans, diagnoses and recommendations; execution belongs to the broker. There is no “run this plan” button anywhere here."
          maturity="HERMETIC ONLY"
        />
        <FilterBar>
          <Filter label="Stage" value={stage} options={['live', 'closed']} onChange={setStage} />
          <Filter label="Outcome" value={outcome} options={[...new Set(RUNS.map((r) => r.execution_outcome))]} onChange={setOutcome} />
        </FilterBar>
        {rows.length === 0 ? <EmptyState text="No runs match these filters." /> : (
          <div className="glass-card p-5">
            <Table
              head={['Run', 'Agent', 'MODE', 'Stage', 'Connectors', 'Policy result', 'Approval', 'Latest outcome', 'Receipt', 'Escalation', 'Updated']}
              rows={rows.map((r) => [
                <IdLink key="id" to={`/app/agents/runs/${r.id}`}>{r.id}</IdLink>, r.agent,
                `MODE ${r.mode}`, `${r.stage}/10 — ${LIFECYCLE_10[r.stage - 1]}`,
                r.connectors.map(fmtConn).join(', '), <Pill key="p" v={r.policy_result} />,
                r.approval_status, <Pill key="o" v={r.execution_outcome} />, <Pill key="rc" v={r.receipt_state} />,
                r.escalation, r.updated,
              ])}
            />
          </div>
        )}
      </div>
    </StateGate>
  )
}

// ── Run detail ─────────────────────────────────────────────────────────────
export function DashRunDetail({ id }: { id: string }) {
  const r = RUNS.find((x) => x.id === id)
  if (!r) return <EmptyState text="Run not found in this workspace." cta="Back to runs" href="/app/agents" />
  const execs = EXECUTIONS.filter((e) => e.run === r.id)
  const approvals = APPROVALS.filter((a) => a.run === r.id)
  const receipts = RECEIPTS.filter((x) => x.run === r.id)
  const boundaryFor = (i: number) => MODE_BOUNDARIES.find((b) => i + 1 === b.range[0])
  return (
    <div>
      <PageHeader title={r.id} sub={`${r.agent} · MODE ${r.mode} · ${r.environment}`} maturity="HERMETIC ONLY"
        actions={<>
          <Action label="Submit plan for approval" maturity="HERMETIC ONLY" title="MODE 1 → creates an approval request; never executes" />
          <Action label="Escalate to human" maturity="PLANNED" />
          <Action label="Cancel run" maturity="PLANNED" danger />
        </>} />

      <Panel title="Lifecycle rail" className="mb-4">
        <ol className="flex flex-wrap gap-1.5">
          {LIFECYCLE_10.map((s, i) => {
            const b = boundaryFor(i)
            return (
              <li key={s} className="flex items-center gap-1.5">
                {b && <span className="text-[9.5px] uppercase tracking-wide text-[#B07BFF] font-bold px-1.5 py-0.5 rounded border border-[#B07BFF]/40">{b.mode}</span>}
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${i + 1 < r.stage ? 'bg-[#21C87A]/[0.08] text-[#21C87A] border-[#21C87A]/30' : i + 1 === r.stage ? 'bg-[#4D8DFF]/[0.14] text-white border-[#4D8DFF]/50' : 'text-[#5B6884] border-white/[0.08]'}`}>
                  {i + 1} · {s}
                </span>
              </li>
            )
          })}
        </ol>
        <p className="mt-3 text-[11.5px] text-[#5B6884]">MODE settings are per tenant × connector, set in Policies, displayed read-only here. MODE 2 enablement is <MaturityTag m="STAGING ONLY" /> (needs claim_level ≥ STAGING and a staging-verified connector). MODE 3/4 are not rendered.</p>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Evidence">
          <ul className="space-y-2 text-[12.5px] text-[#C7D2EA]">
            <li><span className="font-mono text-[11.5px] text-[#7EA2FF]">ev_01J3A2</span> — charge.refunded · inbound_trust=<b className="text-[#21C87A]">verified</b> (HMAC-SHA256)</li>
            <li>Observation obs_11 — refund spike vs 7-day baseline · inbound_trust=internal</li>
            <li>Observation obs_12 — ledger delta ₹12,400 across 3 charges · resolves to fact <span className="font-mono text-[11.5px] text-[#7EA2FF]">rc_01J2K30</span></li>
          </ul>
        </Panel>
        <Panel title="Diagnosis">
          <ul className="space-y-2 text-[12.5px] text-[#C7D2EA]">
            <li><b className="text-white">h1</b> — duplicate charge batch from billing job (confidence 0.81)</li>
            <li>h2 — provider-side double capture (confidence 0.14) · <span className="text-[#5B6884]">rejected: settlement report contradicts</span></li>
            <li>h3 — manual duplicate (confidence 0.05) · <span className="text-[#5B6884]">rejected: no console actor</span></li>
          </ul>
        </Panel>
        <Panel title="Recommendation & plan">
          <ol className="space-y-2 text-[12.5px] text-[#C7D2EA] list-decimal list-inside">
            <li>stripe.charges.list — read · no side effects · policy <Pill v="ALLOW" /></li>
            <li>stripe.charges.get ×3 — read · policy <Pill v="ALLOW" /></li>
            <li>stripe.refunds.create — money-moving · side effects · policy <Pill v="APPROVAL_REQUIRED" /> · dual class</li>
            <li>stripe.charges.get — verify read-back · policy <Pill v="ALLOW" /></li>
            <li>close — write run summary</li>
          </ol>
          <p className="mt-3 text-[11.5px] text-[#5B6884]">The plan is a proposal. Nothing executes from this screen.</p>
        </Panel>
        <Panel title={`Approvals (${approvals.length})`}>
          {approvals.length ? approvals.map((a) => (
            <div key={a.id} className="flex items-center justify-between py-1.5 text-[12.5px]">
              <IdLink to={`/app/approvals/${a.id}`}>{a.id}</IdLink>
              <span className="font-mono text-[11.5px] text-[#A9B6D3]">{a.tool}</span>
              <Pill v={a.state} />
            </div>
          )) : <p className="text-[12.5px] text-[#A9B6D3]">None.</p>}
        </Panel>
        <Panel title={`Execution steps (${execs.length})`} className="lg:col-span-1">
          {execs.length ? (
            <Table head={['Execution', 'Tool', 'Outcome', 'Receipt state']} mobileScroll={false} rows={execs.map((e) => [
              <IdLink key="id" to={`/app/executions/${e.id}`}>{e.id}</IdLink>,
              <span key="t" className="font-mono text-[12px]">{e.tool}</span>, <Pill key="o" v={e.outcome} />, <Pill key="r" v={e.receipt_state} />,
            ])} />
          ) : <p className="text-[12.5px] text-[#A9B6D3]">No steps dispatched yet.</p>}
        </Panel>
        <Panel title={`Receipts (${receipts.length})`}>
          {receipts.length ? receipts.map((x) => (
            <div key={x.id} className="flex items-center justify-between py-1.5 text-[12.5px]">
              <IdLink to={`/app/receipts/${x.id}`}>{x.id}</IdLink><Pill v={x.state} />
            </div>
          )) : <p className="text-[12.5px] text-[#A9B6D3]">None yet.</p>}
          <div className="mt-3 text-[11.5px] text-[#5B6884]">Recovery / escalation: {r.escalation}</div>
        </Panel>
      </div>
    </div>
  )
}

// ── Policies list ──────────────────────────────────────────────────────────
export function DashPolicies() {
  const [decision, setDecision] = useState('')
  const [status, setStatus] = useState('')
  const rows = POLICIES.filter((p) => (!decision || p.decision === decision) && (!status || p.status === status))
  return (
    <StateGate empty={<EmptyState text="No policies yet. The org floor is created with your organization." />}>
      <div>
        <PageHeader title="Policies" sub="Declarative rules with versions. Workspace admins edit within the org floor; org admins edit the floor; others read." maturity="HERMETIC ONLY"
          actions={<Action label="Create policy" maturity="PLANNED" title="Policy store is the reference build" />} />
        <FilterBar>
          <Filter label="Decision" value={decision} options={['ALLOW', 'APPROVAL_REQUIRED', 'REFUSE']} onChange={setDecision} />
          <Filter label="Status" value={status} options={['active', 'disabled', 'draft']} onChange={setStatus} />
        </FilterBar>
        <div className="glass-card p-5">
          <Table
            head={['Policy', 'Version', 'Scope', 'Env', 'Connectors', 'Op class', 'Decision', 'Limits', 'Status', 'Changed', 'By']}
            rows={rows.map((p) => [
              <IdLink key="id" to={`/app/policies/${p.id}`}>{p.name}</IdLink>, p.version, p.scope, p.environment,
              p.connectors.map(fmtConn).join(', '), p.operation_class,
              <span key="d" className="flex items-center gap-1.5"><Pill v={p.decision} />{p.approval_class && <span className="text-[11px] text-[#F5A524]">{p.approval_class}</span>}</span>,
              <span key="l" className="text-[12px] text-[#A9B6D3]">{p.limits}</span>, <Pill key="s" v={p.status} />, p.changed, p.changed_by,
            ])}
          />
        </div>
      </div>
    </StateGate>
  )
}

// ── Policy detail ──────────────────────────────────────────────────────────
export function DashPolicyDetail({ id }: { id: string }) {
  const p = POLICIES.find((x) => x.id === id)
  if (!p) return <EmptyState text="Policy not found in this workspace." cta="Back to policies" href="/app/policies" />
  return (
    <div>
      <PageHeader title={p.name} sub={`${p.scope}-scoped · ${p.environment}`} maturity="HERMETIC ONLY"
        actions={<>
          <Action label="Clone" maturity="PLANNED" />
          <Action label="Compare versions" maturity="PLANNED" title="Diff against previous version" />
          <Action label="Test against sample plan" maturity="HERMETIC ONLY" title="Uses the evaluator" />
          {p.status === 'active'
            ? <Action label="Disable" maturity="PLANNED" danger title="Versioned; audit + receipt" />
            : <Action label="Activate" maturity="PLANNED" title="Versioned; audit + receipt" />}
        </>} />
      <div className="mb-4 text-[11.5px] text-[#A9B6D3]">Editing is desktop-only; this route is read-only on mobile.</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Rule">
          <KV items={[
            ['Connectors', p.connectors.map(fmtConn).join(', ')], ['Tools', p.tools],
            ['Operation class', p.operation_class], ['Side effects', p.side_effects],
            ['Decision', <span key="d" className="flex gap-1.5 items-center"><Pill v={p.decision} />{p.approval_class && <span className="text-[11px] text-[#F5A524]">approval class: {p.approval_class}</span>}</span>],
            ['Limits', p.limits], ['Status', <Pill key="s" v={p.status} />],
          ]} />
        </Panel>
        <Panel title="Version history">
          <Table head={['Version', 'Changed', 'By', 'Note']} mobileScroll={false} rows={[
            [p.version, p.changed, p.changed_by, 'current'],
            [p.version === 'v1' ? 'v0' : 'v' + (parseInt(p.version.slice(1)) - 1), '—', p.changed_by, 'superseded — diff available'],
          ]} />
        </Panel>
        <Panel title="Evaluation log (recent decisions this policy produced)" className="lg:col-span-2">
          <Table head={['When', 'Plan step', 'Decision', 'Execution']} rows={[
            ['2026-09-27 15:38', 'stripe.refunds.create (run_01J0AA11 step 3)', <Pill key="a" v="APPROVAL_REQUIRED" />, '—'],
            ['2026-09-27 11:07', 'shopify.orders.close (run_01J0A9ZK step 2)', <Pill key="b" v="ALLOW" />, <IdLink key="e" to="/app/executions/ex_01J2Q21">ex_01J2Q21</IdLink>],
            ['2026-09-25 16:41', 'slack.chat.postMessage (run_01J0A3BB step 1)', <Pill key="c" v="REFUSE" />, <IdLink key="f" to="/app/executions/ex_01J2N02">ex_01J2N02</IdLink>],
          ]} />
        </Panel>
      </div>
    </div>
  )
}
