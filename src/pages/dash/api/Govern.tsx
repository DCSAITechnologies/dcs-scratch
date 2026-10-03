// API mode — overview, security/kill, environments, usage, developer, and the
// surfaces contract 1.0.0 has no endpoint for (shown as not available, never faked).

import { useState } from 'react'
import { PageHeader, Panel, Pill, Table, IdLink, KV, Tile, FilterBar } from '../../../components/dash/ui'
import { ApiView, PagedView, MutationButton, Notice, Freshness } from '../../../components/dash/api-ui'
import { useApi } from '../../../lib/api/useApi'
import { usePagedList } from '../../../lib/api/usePagedList'
import * as api from '../../../lib/api/endpoints'
import type { S } from '../../../lib/api/endpoints'
import { useAuth } from '../../../lib/auth/session'
import { apiHost } from '../../../lib/api/config'

const when = (t?: string | null) => (t ? new Date(t).toLocaleString() : '—')

export function ApiOverview() {
  const pending = useApi('ov-approvals', () => api.listApprovals({ state: 'REQUESTED', limit: 20 }))
  const unknown = useApi('ov-unknown', () => api.listExecutions({ outcome: 'OUTCOME_UNKNOWN', limit: 20 }))
  const usage = useApi('ov-usage', () => api.getUsage('24h'))
  const conns = useApi('ov-conns', () => api.listConnections({ limit: 200 }))
  const n = (r: { status: string; data: { data: unknown[]; has_more: boolean } | null }) =>
    r.status === 'ready' && r.data ? `${r.data.data.length}${r.data.has_more ? '+' : ''}` : r.status === 'error' ? '!' : '…'
  return (
    <div>
      <PageHeader title="Operations overview" maturity="WIRED" sub={`Read from ${apiHost()} when this page loaded. Refresh any panel to re-read it.`} />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
        <Tile label="Approvals waiting" value={n(pending)} tone={pending.data?.data.length ? 'warn' : 'default'} />
        <Tile label="Outcome unknown" value={n(unknown)} sub="need reconciliation" tone={unknown.data?.data.length ? 'warn' : 'default'} />
        <Tile label="Executions (24h)" value={usage.status === 'ready' ? usage.data.executions.total : usage.status === 'error' ? '!' : '…'} />
        <Tile label="Connections" value={n(conns)} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Action queue — approvals" right={<Freshness loadedAt={pending.loadedAt} onRefresh={pending.reload} />}>
          <ApiView result={pending} isEmpty={(l) => !l.data.length} empty="No approvals are waiting.">
            {(l) => <Table head={['Approval', 'Run', 'Requested']} rows={l.data.map((a) => [<IdLink key="i" to={`/app/approvals/${a.approval_id}`}>{a.approval_id}</IdLink>, a.run_id, when(a.requested_at)])} />}
          </ApiView>
        </Panel>
        <Panel title="Action queue — reconciliation" right={<Freshness loadedAt={unknown.loadedAt} onRefresh={unknown.reload} />}>
          <ApiView result={unknown} isEmpty={(l) => !l.data.length} empty="Nothing awaits reconciliation.">
            {(l) => <Table head={['Execution', 'Tool', 'Created']} rows={l.data.map((e) => [<IdLink key="i" to={`/app/executions/${e.execution_id}`}>{e.execution_id}</IdLink>, e.tool_id, when(e.created_at)])} />}
          </ApiView>
        </Panel>
      </div>
      <div className="mt-4"><Panel title="Usage (24h)">
        <ApiView result={usage}>{(u) => <UsageBody u={u} />}</ApiView>
      </Panel></div>
    </div>
  )
}

function UsageBody({ u }: { u: S['Usage'] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <KV items={[['Window', u.window], ['Executions', u.executions.total], ...Object.entries(u.executions.by_outcome).map(([k, v]) => [k, v] as [string, number])]} />
      <KV items={[['Receipts issued', u.receipts.ISSUED], ['Receipts pending', u.receipts.PENDING], ['Receipts failed', u.receipts.FAILED], ['Cost', u.cost_note ?? 'not reported']]} />
    </div>
  )
}

export function ApiUsage() {
  const [w, setW] = useState<'24h' | '7d' | '30d'>('24h')
  const r = useApi(`usage:${w}`, () => api.getUsage(w))
  return (
    <div>
      <PageHeader title="Usage" maturity="WIRED" sub="Counts from the execution ledger and receipt index. Not billing." />
      <FilterBar>
        <label className="text-[12px] text-[#A9B6D3]">Window <select value={w} onChange={(e) => setW(e.target.value as typeof w)} className="ml-1 bg-[#0d1430] border border-white/[0.09] rounded-lg px-2 py-1 text-[12px] text-[#C7D2EA]"><option>24h</option><option>7d</option><option>30d</option></select></label>
        <span className="ml-auto"><Freshness loadedAt={r.loadedAt} onRefresh={r.reload} /></span>
      </FilterBar>
      <ApiView result={r}>{(u) => (
        <Panel>
          <UsageBody u={u} />
          {!!u.by_connector?.length && <div className="mt-4"><Table head={['Connector', 'Executions']} rows={u.by_connector.map((x) => [x.connector_id, x.executions])} /></div>}
        </Panel>
      )}</ApiView>
    </div>
  )
}

export function ApiSecurity() {
  const kills = usePagedList('kill-orders', (cursor) => api.listKillOrders({ cursor }))
  const health = useApi('provider-health', () => api.getProviderHealth())
  const [notice, setNotice] = useState<string | null>(null)
  return (
    <div>
      {notice && <Notice text={notice} onClose={() => setNotice(null)} />}
      <PageHeader title="Security / Kill" maturity="WIRED" sub="Emergency stops at system, tenant, connector, connection or tool scope. Restoring records a reviewer and a reason; contract 1.0.0 does not enforce that the reviewer differs from you."
        actions={<MutationButton label="Kill a scope…" danger capability="kill" testId="kill-create" confirmTitle="Activate a kill order?"
          confirmBody="Takes effect at the next dispatch check. Name the exact scope and target; the action and reason are audited."
          fields={[{ name: 'scope', label: 'Scope', required: true, type: 'select', options: ['connection', 'connector', 'tool', 'tenant', 'system'] }, { name: 'target', label: 'Target id', required: true },
            { name: 'reason', label: 'Reason', required: true, type: 'textarea' }, { name: 'reviewer', label: 'Reviewer', required: true }]}
          run={(v, key) => api.createKillOrder({ scope: v.scope as S['KillScope'], target: v.target, reason: v.reason, reviewer: v.reviewer }, key)}
          onDone={(k) => { setNotice(`Kill order ${k.kill_order_id} is active.`); kills.reload() }} />} />
      <PagedView list={kills} empty="No kill orders.">
        {(rows) => <Table head={['Kill order', 'Scope', 'Target', 'State', 'Reason', 'Initiated by', 'Activated', 'Restored', '']} rows={rows.map((k) => [
          <span key="i" className="font-mono text-[12px]">{k.kill_order_id}</span>, k.scope, k.target, <Pill key="s" v={k.state} />, k.reason, k.initiated_by, when(k.activated_at), when(k.restored_at),
          k.state === 'active' ? <MutationButton key="r" label="Restore" capability="restore" testId={`kill-restore-${k.kill_order_id}`} confirmTitle={`Restore ${k.kill_order_id}?`}
            confirmBody="Name a reviewer for the record. Core records it with the reason; it does not check the reviewer is a different person." fields={[{ name: 'reason', label: 'Reason', required: true, type: 'textarea' }, { name: 'reviewer', label: 'Reviewer', required: true }]}
            run={(v, key) => api.restoreKillOrder(k.kill_order_id, { reason: v.reason, reviewer: v.reviewer }, key)} onDone={() => { setNotice(`${k.kill_order_id} restored.`); kills.reload() }} /> : '—',
        ])} />}
      </PagedView>
      <div className="mt-4"><Panel title="Provider health (per connector, from connections)" right={<Freshness loadedAt={health.loadedAt} onRefresh={health.reload} />}>
        <ApiView result={health} isEmpty={(l) => !l.data.length} empty="No connections to roll up.">
          {(l) => <Table head={['Connector', 'Connections', 'Health', 'Probe']} rows={l.data.map((h) => [h.connector_id, h.connections, Object.entries(h.health).map(([k, v]) => `${k}: ${v}`).join(' · '), h.probe ?? '—'])} />}
        </ApiView>
      </Panel></div>
    </div>
  )
}

export function ApiEnvironments() {
  const r = useApi('environments', () => api.listEnvironments())
  return (
    <div>
      <PageHeader title="Environments" maturity="WIRED" sub="Dispatch eligibility per environment as the API reports it." />
      <ApiView result={r} isEmpty={(l) => !l.data.length} empty="The API reported no environments.">
        {(l) => <div className="glass-card p-5"><Table head={['Environment', 'Dispatchable connectors', 'Dispatchable tools', 'Catalogued', 'MODE ceiling', 'Notes']} rows={l.data.map((e) => [
          e.name, e.dispatchable_connectors, e.dispatchable_tools ?? '—', e.catalogued_connectors ?? '—', e.mode_ceiling ?? '—', (e.notes ?? []).join(' ')])} /></div>}
      </ApiView>
    </div>
  )
}

export function ApiDeveloper() {
  const auth = useAuth()
  const me = auth.principal
  return (
    <div>
      <PageHeader title="Developer" maturity="WIRED" sub="Your credential as the API describes it (GET /v1/me)." />
      {me && <Panel title="Current principal">
        <KV items={[['Principal', me.principal_id], ['Kind', me.kind], ['Tenant', me.tenant_id], ['Environment', me.environment],
          ['Capabilities', me.capabilities.join(', ') || '—'], ['Scopes', me.scopes.join(', ') || '—'], ['Key prefix', me.key_prefix ?? '—']]} />
      </Panel>}
      <div className="mt-4"><NotInContract what="API key issuance, rotation and revocation" why="Contract 1.0.0 has no key-management operations; issuance belongs to the identity seam (Lane 3)." /></div>
    </div>
  )
}

export function NotInContract({ what, why }: { what: string; why: string }) {
  return (
    <div className="glass-card p-6" data-testid="not-in-contract">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A9B6D3]">Not yet available</div>
      <p className="mt-2 text-[13.5px] text-[#D6E1FF]">{what}</p>
      <p className="mt-1 text-[12.5px] text-[#93A0C2]">{why}</p>
    </div>
  )
}

export function ApiTeam() {
  return <div><PageHeader title="Team / Roles" maturity="PLANNED" /><NotInContract what="Members, invitations and role changes" why="There is no membership endpoint in contract 1.0.0; members and roles come from the identity provider once it is wired." /></div>
}
export function ApiSettings() {
  return <div><PageHeader title="Settings" maturity="PLANNED" /><NotInContract what="Organisation and workspace settings" why="No settings operation exists in contract 1.0.0." /></div>
}
export function ApiTools() {
  return <div><PageHeader title="Tools" maturity="PLANNED" /><NotInContract what="Cross-connection tool registry" why="Contract 1.0.0 exposes no tool listing; use a policy's Evaluate action to dry-run a decision for a specific tool." /></div>
}
export function ApiAudit() {
  const list = usePagedList('audit-events', (cursor) => api.listEvents({ cursor }))
  return (
    <div>
      <PageHeader title="Audit" maturity="WIRED" sub="The platform event log is the audit substrate available in contract 1.0.0. Audit export (POST /v1/operator/audit-exports) is contract-only." />
      <FilterBar><span className="ml-auto"><Freshness loadedAt={list.loadedAt} onRefresh={list.reload} /></span></FilterBar>
      <PagedView list={list} empty="No events recorded.">
        {(rows) => <Table head={['When', 'Event', 'Run', 'Data']} rows={rows.map((ev) => [when(ev.occurred_at), ev.type, ev.run_id ?? '—',
          <span key="d" className="font-mono text-[11px] text-[#93A0C2]">{Object.entries(ev.data).map(([k, v]) => `${k}=${String(v)}`).join(' ')}</span>])} />}
      </PagedView>
      <div className="mt-4"><NotInContract what="Export (CSV + receipt bundle)" why="Audit export is CONTRACT_ONLY: the server answers 501 not_implemented." /></div>
    </div>
  )
}
