// §4.3 Connections — lifecycle CREATE → AUTHORIZE → TEST → ACTIVE → DEGRADED
// → SUSPENDED → REVOKED. Credential shown as opaque reference, never a secret.
// §4.2 Connectors — catalogue maturity and runtime maturity side by side.

import { useState } from 'react'
import { PageHeader, Panel, Pill, Table, IdLink, EmptyState, StateGate, FilterBar, Filter, Action, KV, MaturityTag } from '../../components/dash/ui'
import { CONNECTIONS, CATALOGUE_RUNTIME, TOOLS, EXECUTIONS, fmtConn } from '../../lib/fixtures'
import { LEGACY_REFERENCE_SURFACES } from '../../lib/data'
import { navigate } from '../../hooks/usePathRoute'

// ── Connections list ───────────────────────────────────────────────────────
export function DashConnections() {
  const [state, setState] = useState('')
  const [connector, setConnector] = useState('')
  const rows = CONNECTIONS.filter((c) => (!state || c.state === state) && (!connector || c.connector === connector))
  return (
    <StateGate empty={<EmptyState text="Connect your first provider" cta="Open the connect flow" href="/app/connections/new" />}>
      <div>
        <PageHeader
          title="Connections"
          sub="The connection lifecycle, per tenant and environment. Credentials render as opaque references — secrets never appear. Real-provider OAuth apps are an external dependency; the preview runs against simulator providers."
          maturity="HERMETIC ONLY"
          actions={<Action label="New connection" maturity="HERMETIC ONLY" title="Simulator providers until vault + OAuth apps exist" onClick={() => { window.history.pushState({}, '', '/app/connections/new'); window.dispatchEvent(new PopStateEvent('popstate')) }} />}
        />
        <FilterBar>
          <Filter label="State" value={state} options={['CREATE', 'AUTHORIZE', 'TEST', 'ACTIVE', 'DEGRADED', 'SUSPENDED', 'REVOKED']} onChange={setState} />
          <Filter label="Connector" value={connector} options={[...new Set(CONNECTIONS.map((c) => c.connector))]} onChange={setConnector} />
        </FilterBar>
        {rows.length === 0 ? <EmptyState text="No connections match these filters." /> : (
          <div className="glass-card p-5">
            <Table
              head={['Connection', 'Connector', 'Credential ref', 'Auth', 'Host', 'Env', 'Health', 'Last test', 'Last use', 'Expiry', 'State']}
              rows={rows.map((c) => [
                <IdLink key="id" to={`/app/connections/${c.id}`}>{c.id}</IdLink>,
                fmtConn(c.connector),
                <span key="cr" className="font-mono text-[11.5px]">{c.credential_ref}</span>,
                c.auth, c.host, c.environment, <Pill key="h" v={c.health} />, c.last_test, c.last_use, c.expiry, <Pill key="s" v={c.state} />,
              ])}
            />
          </div>
        )}
      </div>
    </StateGate>
  )
}

// ── Connection detail ──────────────────────────────────────────────────────
export function DashConnectionDetail({ id }: { id: string }) {
  const c = CONNECTIONS.find((x) => x.id === id)
  if (!c) return <EmptyState text="Connection not found in this workspace." cta="Back to connections" href="/app/connections" />
  const execs = EXECUTIONS.filter((e) => e.connection === c.id)
  const tools = TOOLS.filter((t) => t.connection === c.id)
  const lifecycle = ['CREATE', 'AUTHORIZE', 'TEST', 'ACTIVE']
  const idx = c.state === 'DEGRADED' || c.state === 'SUSPENDED' || c.state === 'REVOKED' ? 3 : lifecycle.indexOf(c.state)
  return (
    <div>
      <PageHeader title={c.id} sub={`${fmtConn(c.connector)} · ${c.environment} · ${c.simulator ? 'simulator provider' : 'real provider'}`} maturity="HERMETIC ONLY"
        actions={
          <>
            <Action label="Test (governed read)" maturity="HERMETIC ONLY" />
            <Action label={c.state === 'SUSPENDED' ? 'Resume' : 'Suspend'} maturity="HERMETIC ONLY" title="Kill semantics; audit + receipt PENDING" />
            <Action label="Revoke" maturity="HERMETIC ONLY" danger title="Irreversible; confirmation names the environment" />
            <Action label="Rotate credential" maturity="PLANNED" title="Needs vault (roadmap item 20)" />
            <Action label="Authorize (OAuth)" maturity="STAGING ONLY" title="Real providers need OAuth apps — external dependency" />
          </>
        } />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Panel title="Lifecycle">
          <ol className="flex flex-wrap items-center gap-1.5">
            {[...lifecycle, 'DEGRADED/SUSPENDED/REVOKED'].map((s, i) => (
              <li key={s} className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${i <= idx ? 'bg-[#21C87A]/[0.08] text-[#21C87A] border-[#21C87A]/30' : c.state === s.split('/')[0] ? 'bg-[#F5A524]/[0.08] text-[#F5A524] border-[#F5A524]/30' : 'text-[#5B6884] border-white/[0.08]'}`}>{s}</li>
            ))}
          </ol>
          <div className="mt-4"><KV items={[
            ['State', <Pill key="s" v={c.state} />], ['Health', <Pill key="h" v={c.health} />],
            ['Credential reference', <span key="cr" className="font-mono text-[12px]">{c.credential_ref} (opaque — never a secret)</span>],
            ['Scopes granted', c.scopes.join(' · ')],
            ['Routing', `${c.host} · ${c.region} · ${c.environment}`],
            ['Lease', 'TTL-bound; see Security → leases'],
          ]} /></div>
        </Panel>
        <Panel title={`Tools on this connection (${tools.length})`}>
          <Table head={['Tool', 'Op class', 'Retry safety', 'Policy preview']} rows={tools.map((t) => [
            <span key="t" className="font-mono text-[12px]">{t.id}</span>, t.operation_class, t.retry_safety, <Pill key="p" v={t.policy_preview} />,
          ])} />
        </Panel>
      </div>
      <Panel title={`Executions using this connection (${execs.length})`}>
        {execs.length ? (
          <Table head={['Execution', 'Tool', 'Outcome', 'Receipt state', 'Started']} rows={execs.map((e) => [
            <IdLink key="id" to={`/app/executions/${e.id}`}>{e.id}</IdLink>,
            <span key="t" className="font-mono text-[12px]">{e.tool}</span>, <Pill key="o" v={e.outcome} />, <Pill key="r" v={e.receipt_state} />, e.started,
          ])} />
        ) : <p className="text-[12.5px] text-[#A9B6D3]">None yet.</p>}
      </Panel>
    </div>
  )
}

// ── Connect flow (simulators) ──────────────────────────────────────────────
export function DashConnectNew() {
  return (
    <div>
      <PageHeader
        title="Connect a provider"
        sub="Four steps: connector → auth scheme → authorize → test. The preview runs against simulator providers only; real providers arrive with vault and OAuth apps."
        maturity="HERMETIC ONLY"
      />
      <div className="mb-4 flex items-center gap-2 text-[11.5px] text-[#A9B6D3]"><MaturityTag m="STAGING ONLY" /> Real-provider Connect/Authorize · <MaturityTag m="EXTERNAL DEPENDENCY" /> provider OAuth apps, vault</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel title="1 · Connector">
          <p className="text-[12.5px] text-[#A9B6D3] mb-3">Runtime-verified connectors connect first. All {CATALOGUE_RUNTIME.length} catalogue rows are currently <b>not verified</b> at runtime, so the flow offers simulator connectors in this preview.</p>
          <div className="space-y-2">
            {['stripe', 'shopify', 'salesforce', 'slack', 'razorpay'].map((id) => (
              <div key={id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-white/[0.07] bg-white/[0.02]">
                <span className="text-[13px] text-[#C7D2EA]">{fmtConn(id)} <span className="text-[10.5px] text-[#5B6884]">simulator</span></span>
                <Action label="Select" maturity="HERMETIC ONLY" />
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="2–4 · Scheme, authorize, test">
          <ol className="space-y-3 text-[12.5px] text-[#A9B6D3]">
            <li><b className="text-white">Auth scheme</b> — from the connector manifest (API Key / OAuth2). Credentials are issued to the vault at runtime; here a simulator credential reference is created.</li>
            <li><b className="text-white">Authorize</b> — OAuth redirect for real providers <MaturityTag m="STAGING ONLY" />; simulator grants inline.</li>
            <li><b className="text-white">Test</b> — a governed read proves the connection before it can go ACTIVE. The test itself is receipted.</li>
          </ol>
          <div className="mt-5"><Action label="Create connection (simulator)" maturity="HERMETIC ONLY" title="Creates in the reference store; durable persistence is roadmap item 15" /></div>
        </Panel>
      </div>
    </div>
  )
}

// ── Connectors (console view: catalogue + runtime maturity side by side) ───
const CONSOLE_PAGE = 50
const LEGACY_LINKABLE = LEGACY_REFERENCE_SURFACES.filter((c) => c.lane6_behavior === 'PRESERVE_REFERENCE_SURFACE' || c.lane6_behavior === 'REDIRECT')

export function DashConnectors() {
  // q / page live in the URL so ⌘K search, back/forward and shared links all agree;
  // DashApp keys this component on location.search so a new query re-mounts it.
  const params = new URLSearchParams(window.location.search)
  const [cat, setCat] = useState('')
  const [runtime, setRuntime] = useState('')
  const [pub, setPub] = useState('')
  const [q, setQ] = useState(params.get('q') ?? '')
  const [page, setPage] = useState(Math.max(1, Number(params.get('page')) || 1))
  const needle = q.trim().toLowerCase()
  const matching = CATALOGUE_RUNTIME.filter((c) =>
    (!cat || c.category === cat) && (!runtime || c.runtime_status === runtime) &&
    (!pub || (pub === 'published' ? c.published : !c.published)) &&
    (!needle || c.name.toLowerCase().includes(needle) || c.id.includes(needle) || c.provider.toLowerCase().includes(needle))
  )
  const pages = Math.max(1, Math.ceil(matching.length / CONSOLE_PAGE))
  const current = Math.min(page, pages)
  const from = (current - 1) * CONSOLE_PAGE
  const rows = matching.slice(from, from + CONSOLE_PAGE)
  const legacyHits = needle ? LEGACY_LINKABLE.filter((c) => c.n.toLowerCase().includes(needle) || c.id.includes(needle)) : []
  const publishedTotal = CATALOGUE_RUNTIME.filter((c) => c.published).length
  const setFilter = (fn: () => void) => { fn(); setPage(1) }
  return (
    <StateGate empty={<EmptyState text="The catalogue is always populated — this state is unreachable in practice." />}>
      <div>
        <PageHeader
          title="Connectors"
          sub="Every canonical catalogue row, including rows on hold that the public site does not list. Catalogue status, publication and runtime status are independent fields. Connect appears only when a row is runtime staging-verified and claim_level reaches STAGING; today no row qualifies."
          maturity="SNAPSHOT"
        />
        <FilterBar>
          <input value={q} onChange={(e) => setFilter(() => setQ(e.target.value))} placeholder="Search name, provider or id" aria-label="Search connectors" className="bg-[#0d1430] border border-white/[0.09] rounded-lg px-2.5 py-1.5 text-[12px] text-[#C7D2EA] placeholder-[#3E4A66] outline-none w-52" />
          <Filter label="Category" value={cat} options={[...new Set(CATALOGUE_RUNTIME.map((c) => c.category))].sort()} onChange={(v) => setFilter(() => setCat(v))} />
          <Filter label="Publication" value={pub} options={['published', 'on hold']} onChange={(v) => setFilter(() => setPub(v))} />
          <Filter label="Runtime" value={runtime} options={['not_verified', 'staging_verified', 'production_verified']} onChange={(v) => setFilter(() => setRuntime(v))} />
        </FilterBar>
        {legacyHits.length > 0 && (
          <div className="mb-4 px-4 py-3 rounded-xl border border-[#FFB224]/30 bg-[#FFB224]/[0.06] text-[12.5px] text-[#E8C98A]" data-testid="legacy-hint">
            {legacyHits.length} legacy reference {legacyHits.length === 1 ? 'surface matches' : 'surfaces match'} “{q.trim()}” — not canonical connectors, not counted, no runtime status:{' '}
            {legacyHits.slice(0, 6).map((c, i) => (
              <span key={c.id}>{i > 0 && ', '}<a href={`/connectors/${c.id}`} className="underline underline-offset-2">{c.n}</a></span>
            ))}
            {legacyHits.length > 6 && ` and ${legacyHits.length - 6} more`}.
          </div>
        )}
        <div className="glass-card p-5">
          {rows.length === 0 ? <EmptyState text="No canonical connector matches these filters." /> : (
            <Table
              head={['#', 'Connector', 'Provider', 'Category', 'Catalogue status', 'Publication', 'Runtime status', 'Auth', 'R/W', 'Webhooks', 'Actions']}
              rows={rows.map((c) => [
                <span key="r" className="text-[#5B6884]">{c.rank}</span>,
                <IdLink key="id" to={`/app/connectors/${c.id}`}>{c.name}</IdLink>,
                c.provider, c.category, <Pill key="cs" v={c.catalogue_status} />,
                c.published ? <span key="p" className="text-[12px] text-[#A9B6D3]">published</span> : <span key="p" className="text-[12px] text-[#F5A524]" title={c.hold_category ?? undefined}>on hold</span>,
                <span key="rs" className="text-[12px] text-[#A9B6D3]">{c.runtime_status.replaceAll('_', ' ')}</span>,
                c.auth, c.rw, c.webhooks ? 'yes' : '—',
                <Action key="a" label="Connect" maturity="STAGING ONLY" title="Enabled when runtime status ≥ staging-verified and claim_level ≥ STAGING" />,
              ])}
            />
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-[#5B6884]">
            <span data-testid="dash-connector-count">
              {matching.length ? `Showing ${from + 1}–${from + rows.length} of ${matching.length} matching` : '0 matching'} · {CATALOGUE_RUNTIME.length} catalogued ({publishedTotal} published, {CATALOGUE_RUNTIME.length - publishedTotal} on hold)
            </span>
            {pages > 1 && (
              <nav className="ml-auto flex items-center gap-2" aria-label="Connector pages">
                <button type="button" disabled={current <= 1} onClick={() => setPage(current - 1)} className="px-2.5 py-1 rounded-lg border border-white/[0.1] text-[#A9B6D3] disabled:opacity-40 disabled:cursor-not-allowed hover:text-white">← Prev</button>
                <span data-testid="dash-page">Page {current} of {pages}</span>
                <button type="button" disabled={current >= pages} onClick={() => setPage(current + 1)} className="px-2.5 py-1 rounded-lg border border-white/[0.1] text-[#A9B6D3] disabled:opacity-40 disabled:cursor-not-allowed hover:text-white">Next →</button>
              </nav>
            )}
          </div>
        </div>
      </div>
    </StateGate>
  )
}

export function DashConnectorDetail({ id }: { id: string }) {
  const c = CATALOGUE_RUNTIME.find((x) => x.id === id)
  if (!c) {
    const legacy = LEGACY_REFERENCE_SURFACES.find((x) => x.id === id)
    return legacy
      ? <EmptyState text={`“${legacy.n}” is a legacy reference surface, not a canonical connector — it has no console record.`} cta="Open the public reference page" href={`/connectors/${legacy.id}`} />
      : <EmptyState text="Connector not found." cta="Back to connectors" href="/app/connectors" />
  }
  const tools = TOOLS.filter((t) => t.connector === id)
  const conns = CONNECTIONS.filter((x) => x.connector === id)
  const execs = EXECUTIONS.filter((e) => e.connector === id)
  return (
    <div>
      <PageHeader title={c.name} sub={`${c.provider} · ${c.category}`} maturity="SNAPSHOT"
        actions={<>
          <Action label="Connect" maturity="STAGING ONLY" title="Enabled when runtime staging-verified + claim_level ≥ STAGING" />
          <Action label="Request access" maturity="WIRED" title="Opens the enterprise contact flow" onClick={() => navigate('/enterprise/contact')} />
          <Action label="Test" maturity="HERMETIC ONLY" title="Needs an existing connection" />
        </>} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Panel title="Facts — independent statuses">
          <KV items={[
            ['Catalogue status', <Pill key="c" v={c.catalogue_status} />],
            ['Publication', c.published ? 'published on the public catalogue' : `on hold — not publicly listed${c.hold_category ? ` (${c.hold_category})` : ''}`],
            ['Runtime status', c.runtime_status.replaceAll('_', ' ')],
            ['Engineering status', c.engineering_status ?? '—'],
            ['Dispatch eligibility', c.dispatch_eligibility ?? '—'],
            ['Alias', c.alias_of ? `also known as ${c.alias_of}` : '—'],
            ['Auth scheme', c.auth], ['Read/write', c.rw], ['Webhooks', c.webhooks ? 'yes' : 'no'],
            ['Runtime verification date', '—'],
          ]} />
        </Panel>
        <Panel title={`Connections in this workspace (${conns.length})`}>
          {conns.length ? conns.map((x) => (
            <div key={x.id} className="flex items-center justify-between py-1.5 text-[12.5px]">
              <IdLink to={`/app/connections/${x.id}`}>{x.id}</IdLink><Pill v={x.state} />
            </div>
          )) : <EmptyState text="No connections yet" cta="Open connect flow" href="/app/connections/new" />}
        </Panel>
        <Panel title={`Executions (${execs.length})`}>
          {execs.length ? execs.map((e) => (
            <div key={e.id} className="flex items-center justify-between py-1.5 text-[12.5px]">
              <IdLink to={`/app/executions/${e.id}`}>{e.id}</IdLink>
              <span className="flex gap-2"><Pill v={e.outcome} /><Pill v={e.receipt_state} /></span>
            </div>
          )) : <p className="text-[12.5px] text-[#A9B6D3]">None yet.</p>}
        </Panel>
      </div>
      <Panel title={`Tools (${tools.length} discovered on workspace connections)`}>
        {tools.length ? (
          <Table head={['Tool', 'Capability class', 'Side effects', 'Retry safety', 'Verification', 'Webhook events']} rows={tools.map((t) => [
            <span key="t" className="font-mono text-[12px]">{t.id}</span>, t.operation_class, t.side_effects ? 'yes' : 'no', t.retry_safety, t.verification, t.webhook_events.join(', ') || '—',
          ])} />
        ) : <p className="text-[12.5px] text-[#A9B6D3]">Tools are discovered per connection — connect this connector to enumerate its tools from the manifest registry.</p>}
      </Panel>
    </div>
  )
}

// ── Tools browse (secondary nav) ───────────────────────────────────────────
export function DashTools() {
  const [oc, setOc] = useState('')
  const rows = TOOLS.filter((t) => !oc || t.operation_class === oc)
  return (
    <StateGate empty={<EmptyState text="No tools discovered yet — connect a provider to enumerate its tools." cta="Open connect flow" href="/app/connections/new" />}>
      <div>
        <PageHeader title="Tools" sub="Cross-connection view of discovered capabilities, with the policy decision the current policy set would produce. Nothing here executes." maturity="HERMETIC ONLY" />
        <FilterBar>
          <Filter label="Operation class" value={oc} options={['read', 'write', 'destructive', 'admin', 'money-moving']} onChange={setOc} />
        </FilterBar>
        <div className="glass-card p-5">
          <Table
            head={['Tool', 'Connector', 'Connection', 'Op class', 'Side effects', 'Approval class', 'Retry safety', 'Verification', 'Policy decision preview']}
            rows={rows.map((t) => [
              <span key="t" className="font-mono text-[12px]">{t.id}</span>, fmtConn(t.connector),
              <IdLink key="c" to={`/app/connections/${t.connection}`}>{t.connection}</IdLink>,
              t.operation_class, t.side_effects ? 'yes' : 'no', t.approval_class, t.retry_safety,
              <span key="v" className="text-[12px] text-[#A9B6D3]">{t.verification}</span>, <Pill key="p" v={t.policy_preview} />,
            ])}
          />
        </div>
      </div>
    </StateGate>
  )
}
