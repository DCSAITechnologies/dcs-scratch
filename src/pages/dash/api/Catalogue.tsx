// API mode — catalogue and connections, read from the Connector OS API.
// Nothing here falls back to fixtures: an API failure renders an error state.

import { useState } from 'react'
import { PageHeader, Panel, Pill, Table, IdLink, KV, FilterBar, Filter } from '../../../components/dash/ui'
import { ApiView, PagedView, MutationButton, Notice, Freshness } from '../../../components/dash/api-ui'
import { useApi } from '../../../lib/api/useApi'
import { usePagedList } from '../../../lib/api/usePagedList'
import * as api from '../../../lib/api/endpoints'
import type { S } from '../../../lib/api/endpoints'
import { navigate } from '../../../hooks/usePathRoute'
import { hasCapability } from '../../../lib/auth/session'

const DISPOSITIONS: S['ConnectorDisposition'][] = ['CODED_LOCALLY_TESTED', 'SPEC_READY', 'ACCESS_GATED', 'PARKED', 'BLOCKED', 'RETIRED', 'EXTERNAL_DEPENDENCY', 'FOUNDER_LEGAL', 'NOT_STARTED']
const CONNECTION_STATUSES: S['ConnectionStatus'][] = ['CREATED', 'TESTED', 'ACTIVE', 'REVOKED']
const when = (t?: string | null) => (t ? new Date(t).toLocaleString() : '—')

// ── connectors ───────────────────────────────────────────────────────────
export function ApiConnectors() {
  const params = new URLSearchParams(window.location.search)
  const [q, setQ] = useState(params.get('q') ?? '')
  const [applied, setApplied] = useState(params.get('q') ?? '')
  const [disposition, setDisposition] = useState('')
  const list = usePagedList(`connectors:${applied}:${disposition}`, (cursor) =>
    api.listConnectors({ q: applied || undefined, disposition: (disposition || undefined) as S['ConnectorDisposition'] | undefined, cursor, limit: 50 }))
  const apply = () => { setApplied(q.trim()); window.history.replaceState({}, '', q.trim() ? `/app/connectors?q=${encodeURIComponent(q.trim())}` : '/app/connectors') }
  return (
    <div>
      <PageHeader title="Connectors" maturity="WIRED"
        sub="The catalogue as the API reports it (GET /v1/connectors), with real dispatch eligibility per environment. Connect is offered only where the API says a connector is dispatchable." />
      <FilterBar>
        <form onSubmit={(e) => { e.preventDefault(); apply() }} className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or id" aria-label="Search connectors"
            className="bg-[#0d1430] border border-white/[0.09] rounded-lg px-2.5 py-1.5 text-[12px] text-[#C7D2EA] w-52" />
          <button type="submit" className="px-2.5 py-1 rounded-lg text-[12px] text-[#9FB8FF] border border-[#4D8DFF]/40">Search</button>
        </form>
        <Filter label="Disposition" value={disposition} options={DISPOSITIONS} onChange={setDisposition} />
        <span className="ml-auto"><Freshness loadedAt={list.loadedAt} onRefresh={list.reload} /></span>
      </FilterBar>
      <PagedView list={list} empty={applied ? `No connector matches “${applied}”.` : 'The API returned an empty catalogue.'}>
        {(rows) => (
          <Table head={['Connector', 'Id', 'Disposition', 'Availability', 'Staging', 'Production', 'Holds']} rows={rows.map((c) => [
            <IdLink key="n" to={`/app/connectors/${c.connector_id}`}>{c.name}</IdLink>,
            <span key="i" className="font-mono text-[11.5px]">{c.connector_id}</span>,
            c.disposition.replaceAll('_', ' ').toLowerCase(),
            <Pill key="a" v={c.availability} />,
            c.dispatch.staging ? 'dispatchable' : '—', c.dispatch.production ? 'dispatchable' : '—',
            c.founder_holds?.length ? <span key="h" className="text-[#F5A524]">{c.founder_holds.join(', ')}</span> : '—',
          ])} />
        )}
      </PagedView>
    </div>
  )
}

export function ApiConnectorDetail({ id }: { id: string }) {
  const r = useApi(`connector:${id}`, () => api.getConnector(id))
  const conns = useApi(`connector-conns:${id}`, () => api.listConnections({ connector_id: id, limit: 50 }))
  return (
    <ApiView result={r}>
      {(c) => (
        <div>
          <PageHeader title={c.name} sub={`${c.connector_id} · ${c.disposition.replaceAll('_', ' ').toLowerCase()}`} maturity="WIRED"
            actions={c.availability === 'not_dispatchable'
              ? <span className="text-[12px] text-[#93A0C2]">Not dispatchable in any environment — connecting is not offered.</span>
              : <button type="button" onClick={() => navigate(`/app/connections/new?connector=${encodeURIComponent(c.connector_id)}`)} className="px-2.5 py-1 rounded-lg text-[12px] font-semibold text-[#9FB8FF] bg-[#4D8DFF]/10 border border-[#4D8DFF]/40">Connect</button>} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Dispatch eligibility (API)">
              <KV items={[
                ['Availability', <Pill key="a" v={c.availability} />],
                ['Staging', c.dispatch.staging ? 'dispatchable' : 'not dispatchable'],
                ['Production', c.dispatch.production ? 'dispatchable' : 'not dispatchable'],
                ['Reasons', c.dispatch.reasons.join(', ') || '—'],
                ['Production reasons', c.dispatch.production_reasons?.join(', ') || '—'],
                ['Engineering rank', c.engineering_rank ?? '—'],
                ['Founder holds', c.founder_holds?.join(', ') || 'none'],
              ]} />
            </Panel>
            <Panel title="Connections in this tenant">
              <ApiView result={conns} isEmpty={(l) => l.data.length === 0} empty="No connections to this connector.">
                {(l) => <Table head={['Connection', 'Status', 'Health']} rows={l.data.map((x) => [
                  <IdLink key="i" to={`/app/connections/${x.connection_id}`}>{x.connection_id}</IdLink>, <Pill key="s" v={x.status} />, <Pill key="h" v={x.health} />,
                ])} />}
              </ApiView>
            </Panel>
          </div>
        </div>
      )}
    </ApiView>
  )
}

// ── connections ──────────────────────────────────────────────────────────
// Lifecycle shown to the operator. The contract's states map to the product
// vocabulary: CREATED → awaiting test, TESTED → validated, ACTIVE → connected,
// health degraded/unhealthy → degraded/failed, REVOKED → revoked.
function lifecycleLabel(c: S['Connection']): string {
  if (c.status === 'REVOKED') return 'revoked'
  if (c.health === 'unhealthy' || c.credential_state === 'expired') return 'failed'
  if (c.health === 'degraded' || c.credential_state === 'degraded') return 'degraded'
  if (c.status === 'ACTIVE') return 'connected'
  if (c.status === 'TESTED') return 'validated — activate to connect'
  if (c.credential_state === 'pending') return 'awaiting auth / test'
  return 'created — test pending'
}

export function ApiConnections() {
  const [status, setStatus] = useState('')
  const list = usePagedList(`connections:${status}`, (cursor) => api.listConnections({ status: (status || undefined) as S['ConnectionStatus'] | undefined, cursor }))
  return (
    <div>
      <PageHeader title="Connections" maturity="WIRED"
        sub="Bound credentials, by vault reference only — the API never returns a secret, and the console never sends one."
        actions={hasCapability('configure') ? <button type="button" onClick={() => navigate('/app/connections/new')} className="px-2.5 py-1 rounded-lg text-[12px] font-semibold text-[#9FB8FF] bg-[#4D8DFF]/10 border border-[#4D8DFF]/40">New connection</button> : undefined} />
      <FilterBar>
        <Filter label="Status" value={status} options={CONNECTION_STATUSES} onChange={setStatus} />
        <span className="ml-auto"><Freshness loadedAt={list.loadedAt} onRefresh={list.reload} /></span>
      </FilterBar>
      <PagedView list={list} empty={status ? `No ${status} connections.` : 'No connections yet.'}>
        {(rows) => <Table head={['Connection', 'Connector', 'Label', 'Lifecycle', 'Status', 'Health', 'Credential', 'Last test', 'Created']} rows={rows.map((c) => [
          <IdLink key="i" to={`/app/connections/${c.connection_id}`}>{c.connection_id}</IdLink>,
          <IdLink key="c" to={`/app/connectors/${c.connector_id}`}>{c.connector_id}</IdLink>,
          c.label ?? '—', lifecycleLabel(c), <Pill key="s" v={c.status} />, <Pill key="h" v={c.health} />, <Pill key="cr" v={c.credential_state} />,
          when(c.last_tested_at), when(c.created_at),
        ])} />}
      </PagedView>
    </div>
  )
}

export function ApiConnectionDetail({ id }: { id: string }) {
  const r = useApi(`connection:${id}`, () => api.getConnection(id))
  const created = new URLSearchParams(window.location.search).get('created')
  const [notice, setNotice] = useState<string | null>(created ? `Connection ${id} created (status ${created}). Test it next.` : null)
  const done = (text: string) => { setNotice(text); r.reload() }
  return (
    <ApiView result={r}>
      {(c) => (
        <div>
          {notice && <Notice text={notice} onClose={() => setNotice(null)} />}
          <PageHeader title={c.connection_id} sub={`${c.connector_id} · ${lifecycleLabel(c)}`} maturity="WIRED"
            actions={c.status === 'REVOKED' ? <span className="text-[12px] text-[#93A0C2]">Revoked {when(c.revoked_at)} — no further actions.</span> : <>
              <MutationButton label="Test" capability="configure" testId="conn-test" confirmTitle="Test this connection?"
                confirmBody={<>Runs the governed test probe for <b>{c.connection_id}</b>. The result is recorded by the API.</>}
                run={(_, key) => api.testConnection(c.connection_id, key)}
                onDone={(t) => done(t.ok ? `Test passed — status ${t.status}, health ${t.health}.` : `Test failed — ${t.error_class ?? 'unknown error'}.`)} />
              {c.status === 'TESTED' && <MutationButton label="Activate" capability="configure" testId="conn-activate" confirmTitle="Activate this connection?"
                confirmBody="Only a tested connection can be activated." run={(_, key) => api.activateConnection(c.connection_id, key)} onDone={() => done('Connection is ACTIVE.')} />}
              <MutationButton label="Revoke" danger capability="kill" testId="conn-revoke" confirmTitle={`Revoke ${c.connection_id}?`}
                confirmBody={<>Irreversible. Environment: <b>{c.routing?.environment ?? 'unspecified'}</b>. The vault credential is revoked and the connection can never be used again.</>}
                fields={[{ name: 'reason', label: 'Reason', required: true, type: 'textarea' }, { name: 'reviewer', label: 'Reviewer (second identity)', required: true }]}
                run={(v, key) => api.revokeConnection(c.connection_id, { reason: v.reason, reviewer: v.reviewer }, key)} onDone={() => done('Connection revoked.')} />
            </>} />
          <Panel title="Connection">
            <KV items={[
              ['Connector', <IdLink key="c" to={`/app/connectors/${c.connector_id}`}>{c.connector_id}</IdLink>],
              ['Status', <Pill key="s" v={c.status} />], ['Health', <Pill key="h" v={c.health} />], ['Credential state', <Pill key="cs" v={c.credential_state} />],
              ['Credential', c.credential_ref_present ? 'vault reference present (value never returned)' : 'no credential reference'],
              ['Routing', [c.routing?.environment, c.routing?.target, c.routing?.organization].filter(Boolean).join(' · ') || '—'],
              ['Last tested', when(c.last_tested_at)], ['Created', when(c.created_at)], ['Revoked', when(c.revoked_at)],
            ]} />
          </Panel>
        </div>
      )}
    </ApiView>
  )
}

// ── connect flow ─────────────────────────────────────────────────────────
// Connector → Configure → Authenticate → Save → Test → Activate → Connected.
// Contract rule: secrets never cross the API. The browser never collects one —
// authentication produces a vault credential reference (cref_…) issued by the
// credential broker / vault, and only that reference is sent. Provider OAuth and
// vault issuance are external dependencies today, so the reference is entered.
const CREF = /^cref_[0-9a-f-]{8,}$/i
export function ApiConnectNew() {
  const params = new URLSearchParams(window.location.search)
  const [connectorId, setConnectorId] = useState(params.get('connector') ?? '')
  const [label, setLabel] = useState('')
  const [environment, setEnvironment] = useState<'staging' | 'development' | 'sandbox'>('staging')
  const [credentialRef, setCredentialRef] = useState('')
  const connector = useApi(`connect-connector:${connectorId}`, () => (connectorId ? api.getConnector(connectorId) : Promise.resolve(null)))
  const canConfigure = hasCapability('configure')
  const valid = connector.status === 'ready' && connector.data && CREF.test(credentialRef.trim())
  const input = 'w-full mt-1 bg-[#0d1430] border border-white/[0.12] rounded-lg px-3 py-2 text-[13px] text-[#E6ECFF]'

  return (
    <div>
      <PageHeader title="Connect a provider" maturity="WIRED"
        sub="Connector → configure → authenticate (vault reference) → save → test → activate. No secret is ever entered here." />
      {!canConfigure && <p role="alert" className="mb-4 text-[12.5px] text-[#E8C98A]">Creating connections requires the “configure” capability.</p>}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="1 · Connector">
          <label className="block text-[12px] text-[#A9B6D3]">Connector id
            <input className={input} value={connectorId} onChange={(e) => setConnectorId(e.target.value.trim())} placeholder="e.g. deepl" />
          </label>
          <div className="mt-3 text-[12.5px]">
            {!connectorId ? <span className="text-[#5B6884]">Enter a connector id from the catalogue.</span>
              : connector.status === 'loading' ? <span className="text-[#5B6884]">Checking…</span>
              : connector.status === 'error' ? <span role="alert" className="text-[#FF8A8A]">Unknown connector.</span>
              : connector.data && <span className="text-[#C7D2EA]">{connector.data.name} — <Pill v={connector.data.availability} /></span>}
          </div>
        </Panel>
        <Panel title="2 · Configure">
          <label className="block text-[12px] text-[#A9B6D3]">Label (optional)<input className={input} value={label} onChange={(e) => setLabel(e.target.value)} /></label>
          <label className="block mt-3 text-[12px] text-[#A9B6D3]">Environment
            <select className={input} value={environment} onChange={(e) => setEnvironment(e.target.value as typeof environment)}>
              <option value="staging">staging</option><option value="development">development</option><option value="sandbox">sandbox</option>
            </select>
            <span className="block mt-1 text-[11px] text-[#5B6884]">Production connections are not offered from this console.</span>
          </label>
        </Panel>
        <Panel title="3 · Authenticate (vault reference)">
          <p className="text-[12px] text-[#93A0C2] mb-2">OAuth and API-key capture happen in the credential broker / vault, which returns a reference. Paste that reference — never a key or token.</p>
          <label className="block text-[12px] text-[#A9B6D3]">Credential reference
            <input className={`${input} font-mono`} value={credentialRef} onChange={(e) => setCredentialRef(e.target.value)} placeholder="cref_…" autoComplete="off" spellCheck={false} aria-invalid={credentialRef !== '' && !CREF.test(credentialRef.trim())} />
          </label>
          {credentialRef !== '' && !CREF.test(credentialRef.trim()) && <p role="alert" className="mt-1 text-[11.5px] text-[#FF8A8A]">Must be a vault reference (cref_ followed by an id). Secrets are refused.</p>}
        </Panel>
        <Panel title="4 · Save">
          <p className="text-[12px] text-[#93A0C2] mb-3">Creates the connection in state CREATED. You then test it, and activate it once the test passes.</p>
          {canConfigure && valid
            ? <MutationButton label="Create connection" capability="configure" testId="conn-create" confirmTitle="Create this connection?"
                confirmBody={<>Connector <b>{connectorId}</b> in <b>{environment}</b>, credential <span className="font-mono">{credentialRef.trim()}</span>.</>}
                run={(_, key) => api.createConnection({ connector_id: connectorId, credential_ref: credentialRef.trim(), label: label || undefined, routing: { environment } }, key)}
                onDone={(c) => navigate(`/app/connections/${c.connection_id}?created=${c.status}`)} />
            : <button type="button" disabled className="px-2.5 py-1 rounded-lg text-[12px] text-[#5B6884] border border-white/[0.07] cursor-not-allowed">Create connection</button>}
        </Panel>
      </div>
    </div>
  )
}
