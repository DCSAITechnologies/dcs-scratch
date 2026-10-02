// §4.11 Security / Kill · §4.10 Events · §4.12 Environments

import { PageHeader, Panel, Pill, Table, IdLink, EmptyState, StateGate, Action, KV, MaturityTag, FilterBar, Filter } from '../../components/dash/ui'
import { KILLS, LEASES, STOLEN_LEASE_DRILL, EGRESS_SUMMARY, INBOUND_EVENTS, OUTBOUND_EVENTS, ENV_ROLLUP, fmtConn } from '../../lib/fixtures'
import { useState } from 'react'

// ── Security / Kill ────────────────────────────────────────────────────────
export function DashSecurity() {
  return (
    <StateGate empty={<EmptyState text="No active kills. The kill audit trail below remains." />}>
      <div>
        <PageHeader
          title="Security / Kill controls"
          sub="Emergency control and its audit. Kill is available on mobile with a two-step confirm — emergencies happen on phones. Restore is dual-control and desktop-only."
          maturity="HERMETIC ONLY"
        />
        <div className="mb-4 flex items-center gap-2 text-[11.5px] text-[#A9B6D3]"><MaturityTag m="EXTERNAL DEPENDENCY" /> Restore’s second identity ships with IdP (item 19). System-scope kill requires org admin + second identity.</div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <Panel title="Kill" className="border-[#EF4444]/30">
            <p className="text-[12.5px] text-[#A9B6D3] mb-3 leading-relaxed">Scopes: system · tenant · workspace · connection · connector · tool. Reason required; the confirmation names the scope and environment.</p>
            <div className="flex flex-col gap-3 items-start">
              <Action label="Kill a scope…" maturity="HERMETIC ONLY" danger title="Reason required; confirmation names scope + environment" />
              <Action label="Restore" maturity="HERMETIC ONLY" title="Second identity required — until IdP" />
              <Action label="View kill audit" maturity="WIRED" onClick={() => { window.history.pushState({}, '', '/app/audit'); window.dispatchEvent(new PopStateEvent('popstate')) }} />
            </div>
          </Panel>
          <Panel title={`Active kills (${KILLS.length})`} className="lg:col-span-2">
            {KILLS.length ? (
              <Table head={['Scope', 'Target', 'Initiated by', 'Reason', 'Time', 'Affected work', 'Restore authorization']} rows={KILLS.map((k) => [
                k.scope, k.target, k.initiated_by, <span key="r" className="text-[12px] text-[#A9B6D3] whitespace-normal min-w-[180px] inline-block">{k.reason}</span>, k.time, k.affected, k.restore_auth,
              ])} />
            ) : <p className="text-[12.5px] text-[#A9B6D3]">None.</p>}
          </Panel>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Panel title={`Leases (${LEASES.length} active)`}>
            <Table head={['Lease', 'Connection', 'Scope', 'TTL']} mobileScroll={false} rows={LEASES.map((l) => [
              <span key="l" className="font-mono text-[11.5px]">{l.id}</span>,
              <IdLink key="c" to={`/app/connections/${l.connection}`}>{l.connection}</IdLink>, l.scope, l.ttl,
            ])} />
          </Panel>
          <Panel title="Egress policy (read-only)">
            <p className="text-[12.5px] text-[#A9B6D3] leading-relaxed">{EGRESS_SUMMARY}</p>
          </Panel>
          <Panel title="Stolen-lease drill (CI evidence, read-only)">
            <KV items={[['Last run', STOLEN_LEASE_DRILL.last_run], ['Result', STOLEN_LEASE_DRILL.result]]} />
          </Panel>
        </div>
      </div>
    </StateGate>
  )
}

// ── Events ─────────────────────────────────────────────────────────────────
export function DashEvents() {
  const [vstate, setVstate] = useState('')
  const inbound = INBOUND_EVENTS.filter((e) => !vstate || e.verification === vstate)
  return (
    <StateGate empty={<EmptyState text="No events yet in this scope." />}>
      <div>
        <PageHeader title="Events" sub="Inbound provider events (verified before use) and outbound platform events. Dedupe is in-memory today; durability is roadmap item 22." maturity="HERMETIC ONLY"
          actions={<Action label="Create outbound subscription" maturity="PLANNED" />} />
        <FilterBar>
          <Filter label="Verification" value={vstate} options={['verified', 'unsigned', 'rejected']} onChange={setVstate} />
        </FilterBar>
        <Panel title={`Inbound (${inbound.length})`} className="mb-4">
          <Table
            head={['Connector', 'Connection', 'Event', 'Received', 'Verification', 'Algorithm', 'Dedupe', 'Replay', 'Downstream', 'Action']}
            rows={inbound.map((e) => [
              fmtConn(e.connector), <IdLink key="c" to={`/app/connections/${e.connection}`}>{e.connection}</IdLink>,
              <span key="t" className="font-mono text-[12px]">{e.event_type}</span>, e.received,
              <Pill key="v" v={e.verification} />, e.algorithm, e.dedupe, e.replay,
              <span key="d" className="text-[12px] text-[#A9B6D3] whitespace-normal min-w-[160px] inline-block">{e.downstream}</span>,
              <Action key="a" label="Replay" maturity="PLANNED" title="Governed replay to downstream" />,
            ])}
          />
        </Panel>
        <Panel title={`Outbound subscriptions (${OUTBOUND_EVENTS.length})`}>
          <Table head={['Subscription', 'Event', 'Delivery state', 'Attempts']} mobileScroll={false} rows={OUTBOUND_EVENTS.map((e) => [
            <span key="s" className="font-mono text-[11.5px]">{e.subscription}</span>, e.event, <Pill key="d" v={e.delivery} />, String(e.attempts),
          ])} />
          <div className="mt-3 text-[11.5px] text-[#5B6884]">Event types: approval.requested · execution.state_changed · receipt.issued · receipt.failed · kill.activated</div>
        </Panel>
      </div>
    </StateGate>
  )
}

// ── Environments ───────────────────────────────────────────────────────────
export function DashEnvironments() {
  return (
    <StateGate empty={<EmptyState text="Environments are created with your organization." />}>
      <div>
        <PageHeader
          title="Environments"
          sub="Development / Staging / Production as bound scopes — connections, policies, approvals and routing are environment-bound; a plan cannot reference another environment’s connection. Production floor: destructive, admin and money-moving always require a human."
          maturity="HERMETIC ONLY"
          actions={<Action label="Create environment" maturity="PLANNED" />}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ENV_ROLLUP.map((e) => (
            <Panel key={e.env} title={e.env} right={<Action label="Set MODE ceiling" maturity="PLANNED" />}>
              <KV items={[
                ['Connections', String(e.connections)], ['Policies', String(e.policies)],
                ['Approvals pending', String(e.approvals_pending)], ['Executions 24 h', String(e.executions_24h)],
                ['MODE ceiling', e.mode_ceiling], ['Promotion notes', e.notes],
              ]} />
            </Panel>
          ))}
        </div>
      </div>
    </StateGate>
  )
}
