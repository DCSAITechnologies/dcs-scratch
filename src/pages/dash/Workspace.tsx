// §4.13 Developer · §4.14 Usage · §4.15 Team · §4.16 Audit · §4.17 Settings

import { PageHeader, Panel, Pill, Table, EmptyState, StateGate, Action, KV, MaturityTag, FilterBar, Filter } from '../../components/dash/ui'
import { API_KEYS, USAGE, TEAM, AUDIT_EVENTS, fmtConn } from '../../lib/fixtures'
import { ROLE_MATRIX, ROLE_LABELS, matrixCell, type RoleKey, type Capability } from '../../lib/roles'
import { useState } from 'react'

// ── Developer / API keys ───────────────────────────────────────────────────
export function DashDeveloper() {
  return (
    <StateGate empty={<EmptyState text="No API keys yet." />}>
      <div>
        <PageHeader title="Developer" sub="App credentials to the control plane — separate from provider connections. Keys are shown once at creation." maturity="PLANNED"
          actions={<Action label="Create key" maturity="PLANNED" title="Needs the control-plane auth service" />} />
        <Panel title="API keys" className="mb-4">
          <Table head={['Name', 'Prefix', 'Scopes', 'Env', 'Created', 'Last used', 'Status', 'Actions']} rows={API_KEYS.map((k) => [
            k.name, <span key="p" className="font-mono text-[11.5px]">{k.prefix}</span>, k.scopes.join(', '), k.environment, k.created, k.last_used, <Pill key="s" v={k.status} />,
            <span key="a" className="flex gap-2"><Action label="Rotate" maturity="PLANNED" /><Action label="Revoke" maturity="PLANNED" danger /></span>,
          ])} />
        </Panel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="SDK / CLI" right={<MaturityTag m="PRE-LAUNCH" />}>
            <pre tabIndex={0} aria-label="Install command" className="text-[12px] text-[var(--c-text-2)] bg-black/30 rounded-lg p-3 overflow-x-auto">npm i @dcs-ai/connector-os   # PRE-LAUNCH — not published; install from source only
cos login                      # CLI ships at launch</pre>
          </Panel>
          <Panel title="MCP endpoint" right={<MaturityTag m="HERMETIC ONLY" />}>
            <KV items={[
              ['Endpoint', 'local MCP seam (in-process)'],
              ['Tools', 'JIT registry — same tool set as /app/tools'],
              ['Per-tenant endpoint', 'ships with control-plane auth'],
            ]} />
          </Panel>
        </div>
      </div>
    </StateGate>
  )
}

// ── Usage ──────────────────────────────────────────────────────────────────
export function DashUsage() {
  return (
    <StateGate empty={<EmptyState text="No usage yet in this scope." />}>
      <div>
        <PageHeader title="Usage" sub="Counts, not billing. Cost is shown only where the provider reports it — there are no invoices and no billing system." maturity="HERMETIC ONLY" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {[
            ['Executions 24 h', USAGE.executions_24h], ['Provider calls 24 h', USAGE.provider_calls_24h],
            ['Receipts issued', USAGE.receipts_issued], ['Receipts pending', USAGE.receipts_pending],
            ['Receipts failed', USAGE.receipts_failed], ['Failed 24 h', USAGE.failed_24h],
            ['Reconciled 24 h', USAGE.reconciled_24h], ['Provider cost', 'not reported'],
          ].map(([l, v]) => (
            <div key={String(l)} className="glass-card p-4">
              <div className="text-[10.5px] uppercase tracking-[0.12em] text-[var(--c-muted)] font-semibold">{l}</div>
              <div className="mt-1.5 text-2xl font-semibold text-[var(--c-text)]">{v}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Panel title="By connector">
            <Table head={['Connector', 'Executions']} mobileScroll={false} rows={USAGE.by_connector.map(([c, n]) => [fmtConn(c), n])} />
          </Panel>
          <Panel title="By agent">
            <Table head={['Agent', 'Executions']} mobileScroll={false} rows={USAGE.by_agent.map(([a, n]) => [a, n])} />
          </Panel>
        </div>
        <p className="mt-4 text-[12px] text-[var(--c-text-2)]">{USAGE.cost_note} <MaturityTag m="PLANNED" /></p>
      </div>
    </StateGate>
  )
}

// ── Team / Roles ───────────────────────────────────────────────────────────
export function DashTeam() {
  return (
    <StateGate empty={<EmptyState text="Your organization has no members yet." />}>
      <div>
        <PageHeader title="Team / Roles" sub="Humans and roles — separate from agent policy. The matrix below is the same roles.ts the website renders, so the two never diverge." maturity="PLANNED"
          actions={<Action label="Invite" maturity="PLANNED" title="Needs IdP (roadmap item 19)" />} />
        <div className="mb-4 flex items-center gap-2 text-[11.5px] text-[var(--c-text-2)]"><MaturityTag m="HERMETIC ONLY" /> role model · <MaturityTag m="PLANNED" /> identity, invites</div>
        <Panel title="Members" className="mb-4">
          <Table head={['Name', 'Email', 'Role', 'Last active', 'Actions']} rows={TEAM.map((m) => [
            m.name, m.email, ROLE_LABELS[m.role], m.last_active,
            <span key="a" className="flex gap-2"><Action label="Change role" maturity="PLANNED" /><Action label="Remove" maturity="PLANNED" danger /></span>,
          ])} />
        </Panel>
        <Panel title="Capability matrix">
          <Table
            head={['Capability', ...Object.values(ROLE_LABELS)]}
            rows={(Object.keys(ROLE_MATRIX.org_admin) as Capability[]).map((cap) => [
              cap === 'execute' ? 'Execute (dispatch)' : cap.charAt(0).toUpperCase() + cap.slice(1),
              ...(Object.keys(ROLE_MATRIX) as RoleKey[]).map((r) => matrixCell(ROLE_MATRIX[r][cap])),
            ])}
          />
          <p className="mt-3 text-[11.5px] text-[var(--c-muted)]">Execute is never a human action — only the broker executes, on an approved step. Approval cells marked ✓ exclude the plan’s submitter.</p>
        </Panel>
      </div>
    </StateGate>
  )
}

// ── Audit ──────────────────────────────────────────────────────────────────
export function DashAudit() {
  const [cls, setCls] = useState('')
  const rows = AUDIT_EVENTS.filter((e) => !cls || e.class === cls)
  return (
    <StateGate empty={<EmptyState text="No audit events yet in this scope." />}>
      <div>
        <PageHeader title="Audit" sub="Everything humans and the platform did. Receipts are the audit substrate; operator actions show Receipt: PENDING until the bridge route ships — never “done”." maturity="HERMETIC ONLY"
          actions={<Action label="Export (CSV + receipt bundle with proofs)" maturity="PLANNED" />} />
        <FilterBar>
          <Filter label="Class" value={cls} options={[...new Set(AUDIT_EVENTS.map((e) => e.class))]} onChange={setCls} />
        </FilterBar>
        <div className="glass-card p-5">
          <Table head={['When', 'Actor', 'Class', 'Action', 'Target', 'Env', 'Receipt']} rows={rows.map((e) => [
            e.time, <span key="a" className="text-[12.5px]">{e.actor}</span>, e.class,
            <span key="ac" className="whitespace-normal min-w-[200px] inline-block">{e.action}</span>,
            <span key="t" className="font-mono text-[11.5px]">{e.target}</span>, e.environment,
            e.receipt === 'PENDING' ? <Pill key="r" v="PENDING" /> : <span key="r" className="text-[12px] text-[var(--c-ok)]">{e.receipt}</span>,
          ])} />
        </div>
      </div>
    </StateGate>
  )
}

// ── Settings ───────────────────────────────────────────────────────────────
export function DashSettings() {
  return (
    <div>
      <PageHeader title="Settings" sub="Org and workspace configuration. Every control carries its own maturity." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Organization" right={<MaturityTag m="HERMETIC ONLY" />}>
          <KV items={[['Name', 'Acme Industries'], ['Tenant id', 'org_acme'], ['Default environment', 'Staging']]} />
          <div className="mt-4"><Action label="Rename" maturity="PLANNED" /></div>
        </Panel>
        <Panel title="Receipt-service policy (FD-1)" right={<MaturityTag m="HERMETIC ONLY" />}>
          <p className="text-[12.5px] text-[var(--c-text-2)] leading-relaxed">When the receipt service is unavailable: <b className="text-[var(--c-text)]">block</b> the step, or proceed and mark the receipt <Pill v="PENDING" />. This is founder decision FD-1 — parked; the current build shows PENDING on failure. Once ruled, this becomes a per-class setting.</p>
        </Panel>
        <Panel title="Notification channels" right={<MaturityTag m="PLANNED" />}>
          <p className="text-[12.5px] text-[var(--c-text-2)]">Approval requests, kill events, receipt failures, escalations — delivery channels (email / webhook) are planned.</p>
        </Panel>
        <Panel title="Data retention (FD-2, read-only)" right={<MaturityTag m="PLANNED" />}>
          <p className="text-[12.5px] text-[var(--c-text-2)]">Raw-evidence retention (customer-local vs DCS-held) is founder decision FD-2. Displayed read-only here once ruled; the Receipts/Audit export design depends on it.</p>
        </Panel>
      </div>
    </div>
  )
}
