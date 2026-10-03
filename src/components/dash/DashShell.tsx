// Dashboard shell — Design 02: Operations Command Centre with Right Utility Rail.
// Three-zone desktop shell: fixed left nav · fluid central workspace · right
// utility rail (notifications, provider health, quick actions). Full viewport
// width — no centered max-width island. The PNG is the visual source of truth;
// truthful maturity labelling everywhere (rule 6/13 of the handoff).

import { useEffect, useState, type ReactNode } from 'react'
import { CLAIM_LEVEL, STATUS_AS_OF } from '../../lib/status'
import { WORKSPACES, ENVIRONMENTS, APPROVALS, KILLS, RECEIPTS, USAGE, type Environment } from '../../lib/fixtures'
import { navigate } from '../../hooks/usePathRoute'
import { MaturityTag } from './ui'
import { Dropdown, SearchModal } from './controls'
import { ApiRail } from './ApiRail'
import { DATA_MODE, apiHost } from '../../lib/api/config'
import { useAuth, signOut } from '../../lib/auth/session'
import { searchTarget } from '../../lib/search-target'
import { useConsoleTheme, setConsoleTheme } from '../../lib/console-theme'

type NavItem = { label: string; to: string; icon: ReactNode }
type NavGroup = { label: string; items: NavItem[] }

const ic = (d: string) => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const ICONS = {
  home: 'M3.5 9.5 10 4l6.5 5.5V16a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V9.5Z',
  grid: 'M4 4h5v5H4zM11 4h5v5h-5zM4 11h5v5H4zM11 11h5v5h-5z',
  wrench: 'M13.5 3.5a3.5 3.5 0 0 0-4.7 4.1L3 13.4V16h2.6l5.8-5.8a3.5 3.5 0 0 0 4.1-4.7l-2.2 2.2-1.9-.4-.4-1.9 2.5-1.9Z',
  link: 'M8 12a3.5 3.5 0 0 0 5 .3l2-2a3.5 3.5 0 0 0-5-5l-1 1M12 8a3.5 3.5 0 0 0-5-.3l-2 2a3.5 3.5 0 0 0 5 5l1-1',
  play: 'M6 4.5v11l9-5.5-9-5.5Z',
  shield: 'M10 3 4 5.5V10c0 4 2.7 6.4 6 7 3.3-.6 6-3 6-7V5.5L10 3Z',
  check: 'M4 10.5 8.5 15 16 6',
  bolt: 'M11 3 5 11h4l-1 6 6-8h-4l1-6Z',
  doc: 'M6 3h5l4 4v10H6V3Zm5 0v4h4',
  radio: 'M10 10m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M5.7 5.7a6 6 0 0 0 0 8.6M14.3 5.7a6 6 0 0 1 0 8.6M3.2 3.2a9.5 9.5 0 0 0 0 13.6M16.8 3.2a9.5 9.5 0 0 1 0 13.6',
  alert: 'M10 3 2.5 16h15L10 3Zm0 5.5v3.5M10 13.5v.01',
  layers: 'M10 3 3 7l7 4 7-4-7-4ZM3 10.5l7 4 7-4M3 14l7 4 7-4',
  users: 'M8 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5 7c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5M14 10.5a2.6 2.6 0 1 0-1.2-4.9M14.5 12.8c2 .4 3.5 1.8 3.5 4.2',
  list: 'M7 5.5h9M7 10h9M7 14.5h9M3.5 5.5h.01M3.5 10h.01M3.5 14.5h.01',
  code: 'm7 6-4 4 4 4M13 6l4 4-4 4',
  chart: 'M4 16V9M10 16V4M16 16v-5',
  cog: 'M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm6.5-2.5a6.5 6.5 0 0 0-.1-1.1l1.7-1.3-1.5-2.6-2 .8a6.6 6.6 0 0 0-1.9-1.1L12.3 2h-3l-.4 2.2a6.6 6.6 0 0 0-1.9 1.1l-2-.8-1.5 2.6L5.2 8.4a6.6 6.6 0 0 0 0 2.2l-1.7 1.3 1.5 2.6 2-.8c.6.5 1.2.9 1.9 1.1l.4 2.2h3l.4-2.2a6.6 6.6 0 0 0 1.9-1.1l2 .8 1.5-2.6-1.7-1.3c.06-.36.1-.72.1-1.1Z',
}

function BrandMark() {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ background: 'var(--c-primary)', color: 'var(--c-on-primary)' }} aria-hidden="true">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /><circle cx="12" cy="14" r="3.2" fill="currentColor" /></svg>
    </span>
  )
}

function ThemeToggle() {
  const theme = useConsoleTheme()
  return (
    <div className="flex items-center rounded-lg border border-[var(--c-border)] bg-[var(--c-card)] p-0.5 text-[12px]" role="group" aria-label="Colour theme">
      {(['light', 'dark'] as const).map((t) => (
        <button key={t} type="button" aria-pressed={theme === t} onClick={() => setConsoleTheme(t)}
          className={`rounded-md px-2.5 py-1 font-medium transition-colors ${theme === t ? 'bg-[var(--c-active)] text-[var(--c-text)]' : 'text-[var(--c-muted)] hover:text-[var(--c-text)]'}`}>
          {t === 'light' ? 'Light' : 'Dark'}
        </button>
      ))}
    </div>
  )
}

const NAV: NavGroup[] = [
  { label: '', items: [{ label: 'Overview', to: '/app', icon: ic(ICONS.home) }] },
  { label: 'Catalogue', items: [
    { label: 'Connectors', to: '/app/connectors', icon: ic(ICONS.grid) },
    { label: 'Tools', to: '/app/tools', icon: ic(ICONS.wrench) },
  ]},
  { label: 'Operate', items: [
    { label: 'Connections', to: '/app/connections', icon: ic(ICONS.link) },
    { label: 'Agent runs', to: '/app/agents', icon: ic(ICONS.play) },
    { label: 'Policies', to: '/app/policies', icon: ic(ICONS.shield) },
    { label: 'Approvals', to: '/app/approvals', icon: ic(ICONS.check) },
    { label: 'Executions', to: '/app/executions', icon: ic(ICONS.bolt) },
    { label: 'Receipts', to: '/app/receipts', icon: ic(ICONS.doc) },
    { label: 'Events', to: '/app/events', icon: ic(ICONS.radio) },
  ]},
  { label: 'Govern', items: [
    { label: 'Security / Kill', to: '/app/security', icon: ic(ICONS.alert) },
    { label: 'Environments', to: '/app/environments', icon: ic(ICONS.layers) },
    { label: 'Team / Roles', to: '/app/team', icon: ic(ICONS.users) },
    { label: 'Audit', to: '/app/audit', icon: ic(ICONS.list) },
  ]},
  { label: 'Workspace', items: [
    { label: 'Developer', to: '/app/developer', icon: ic(ICONS.code) },
    { label: 'Usage', to: '/app/usage', icon: ic(ICONS.chart) },
    { label: 'Settings', to: '/app/settings', icon: ic(ICONS.cog) },
  ]},
]

const CLAIM_BANNER: Record<string, string> = {
  HERMETIC: 'Preview console — connected to the integrated build, not to production',
  STAGING: 'Staging console — staging-verified connectors only',
  PRODUCTION: 'Production console',
}

// Provider health rows — simulator/reference data (handoff §6.2: say so).
const PROVIDER_HEALTH = [
  { name: 'Stripe', state: 'healthy', availability: '99.7%', latency: '189 ms', simulator: true },
  { name: 'Shopify', state: 'healthy', availability: '100%', latency: '121 ms', simulator: true },
  { name: 'Salesforce', state: 'healthy', availability: '99.9%', latency: '164 ms', simulator: true },
  { name: 'Razorpay', state: 'healthy', availability: '99.8%', latency: '142 ms', simulator: true },
  { name: 'Slack', state: 'degraded', availability: '99.8%', latency: '152 ms', simulator: true },
]

export function DashShell({ path, children }: { path: string; children: ReactNode }) {
  const [ws, setWs] = useState(WORKSPACES[0].id)
  const [env, setEnv] = useState<Environment>('Staging')
  const [drawer, setDrawer] = useState(false)
  const [railOpen, setRailOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  const [prevPath, setPrevPath] = useState(path)
  if (prevPath !== path) { // close drawers on navigation — render-phase reset, no cascading effect
    setPrevPath(path); setDrawer(false); setRailOpen(false)
  }

  const demo = DATA_MODE === 'demo'
  const pageTitle = NAV.flatMap((g) => g.items).filter((it) => (it.to === '/app' ? path === '/app' || path === '/app/' : path.startsWith(it.to))).sort((a, b) => b.to.length - a.to.length)[0]?.label ?? 'Console'
  const auth = useAuth()
  // fixture approvals feed the badge/alert only in demo mode; API mode shows the API rail
  const pending = demo ? APPROVALS.filter((a) => a.state === 'Pending') : []

  const notifications = [
    { dot: 'var(--c-err)', title: 'Receipt issuance failed', ctx: 'ex_01J2K30 · 5 min ago', to: '/app/executions/ex_01J2K30' },
    { dot: 'var(--c-warn)', title: 'Reconciliation queued', ctx: 'ex_01J2P88 · 12 min ago', to: '/app/executions/ex_01J2P88' },
    { dot: 'var(--c-info)', title: 'Connector degraded', ctx: 'Slack · 28 min ago', to: '/app/connections/cn_01HZX3D9' },
    { dot: 'var(--c-ok)', title: 'Policy updated', ctx: 'pol_fin_refunds v2 · fixture', to: '/app/policies/pol_fin_refunds' },
    { dot: 'var(--c-info)', title: 'New team member', ctx: 'P. Nair joined · 3 hours ago', to: '/app/team' },
  ]

  // ⌘K opens the search modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const navBody = (
    <nav className="flex-1 py-3 px-2.5 space-y-4 overflow-y-auto" aria-label="Console">
      {NAV.map((g, gi) => (
        <div key={gi}>
          {g.label && <div className="px-2.5 mb-1 text-[11.5px] font-semibold text-[var(--c-muted)]">{g.label}</div>}
          {g.items.map((it) => {
            const active = it.to === '/app' ? path === '/app' || path === '/app/' : path.startsWith(it.to)
            return (
              <a key={it.to} href={it.to}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2.5 px-2.5 py-[6px] rounded-md text-[13px] transition-colors ${
                  active ? 'text-[var(--c-text)] bg-[var(--c-active)] font-medium' : 'text-[var(--c-text-2)] hover:text-[var(--c-text)] hover:bg-[var(--c-card-2)]'
                }`}>
                <span className={active ? 'text-[var(--c-text)]' : 'text-[var(--c-muted)]'}>{it.icon}</span>
                {it.label}
                {it.label === 'Approvals' && pending.length > 0 && (
                  <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[color-mix(in_srgb,var(--c-warn)_15%,transparent)] text-[var(--c-warn)] border border-[color-mix(in_srgb,var(--c-warn)_40%,transparent)]">{pending.length}</span>
                )}
              </a>
            )
          })}
        </div>
      ))}
    </nav>
  )

  const navFoot = (
    <div className="px-3 py-2.5 border-t border-[var(--c-border)]">
      <div className="text-[10.5px] text-[var(--c-muted)]">Connector OS v0.9.0 · claim {CLAIM_LEVEL}</div>
      <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-[var(--c-text-2)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--c-subtle)]" /> {demo ? 'Demo data · no backend connected' : `API · ${apiHost()}`}
      </div>
      <div className="mt-2 lg:hidden"><ThemeToggle /></div>
    </div>
  )

  const rail = !demo ? <ApiRail /> : (
    <div className="p-3 space-y-3">
      {/* Notifications */}
      <section className="rounded-xl border border-[var(--c-border)] bg-[color-mix(in_srgb,var(--c-card)_80%,transparent)] p-3.5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[12.5px] font-semibold text-[var(--c-text)]">Notifications</h2>
          <a href="/app/events" className="text-[11px] font-semibold text-[var(--c-info)]">View all</a>
        </div>
        <ul className="space-y-2">
          {notifications.map((n, i) => (
            <li key={i}>
              <a href={n.to} className="flex gap-2 group">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: n.dot }} />
                <span>
                  <span className="block text-[12px] text-[var(--c-text-2)] group-hover:text-[var(--c-text)] leading-snug">{n.title}</span>
                  <span className="block text-[10.5px] text-[var(--c-muted)] mt-0.5 font-mono">{n.ctx}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* Provider health — simulator rows say so (handoff §6.2) */}
      <section className="rounded-xl border border-[var(--c-border)] bg-[color-mix(in_srgb,var(--c-card)_80%,transparent)] p-3.5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[12.5px] font-semibold text-[var(--c-text)]">Provider health</h2>
          <a href="/app/connectors" className="text-[11px] font-semibold text-[var(--c-info)]">All providers →</a>
        </div>
        <div className="mb-2 text-[9.5px] uppercase tracking-wide text-[var(--c-muted)] font-semibold">Simulator providers · reference data</div>
        <ul className="space-y-1.5">
          {PROVIDER_HEALTH.map((p) => (
            <li key={p.name} className="flex items-center gap-2 text-[12px]">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: p.state === 'healthy' ? 'var(--c-ok)' : p.state === 'degraded' ? 'var(--c-warn)' : 'var(--c-err)' }} />
              <span className="text-[var(--c-text-2)]">{p.name}</span>
              <span className="ml-auto text-[11px]" style={{ color: p.state === 'healthy' ? 'var(--c-ok)' : 'var(--c-warn)' }}>{p.availability}</span>
              <span className="text-[10.5px] text-[var(--c-muted)] w-[48px] text-right">{p.latency}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Quick actions — compact rows, maturity as quiet right-side tag */}
      <section className="rounded-xl border border-[var(--c-border)] bg-[color-mix(in_srgb,var(--c-card)_80%,transparent)] p-3.5">
        <h2 className="text-[12.5px] font-semibold text-[var(--c-text)] mb-1">Quick actions</h2>
        <ul className="divide-y divide-[var(--c-border)]">
          <li className="flex items-center gap-2 py-1.5">
            <span className="text-[12px] font-medium text-[var(--c-muted)] cursor-not-allowed" title="Submits a plan for approval — never executes directly">Run a connector</span>
            <span className="ml-auto"><MaturityTag m="HERMETIC ONLY" /></span>
          </li>
          <li className="flex items-center gap-2 py-1.5">
            <span className="text-[12px] font-medium text-[var(--c-muted)] cursor-not-allowed">Create policy</span>
            <span className="ml-auto"><MaturityTag m="PLANNED" /></span>
          </li>
          <li className="flex items-center gap-2 py-1.5">
            <span className="text-[12px] font-medium text-[var(--c-muted)] cursor-not-allowed" title="Needs IdP (roadmap item 19)">Invite team member</span>
            <span className="ml-auto"><MaturityTag m="PLANNED" /></span>
          </li>
          <li className="flex items-center gap-2 py-1.5">
            <a href="/app/audit" className="text-[12px] font-medium text-[var(--c-text-2)] hover:text-[var(--c-text)]">View audit log</a>
            <span className="ml-auto"><MaturityTag m="WIRED" /></span>
          </li>
        </ul>
      </section>

      {/* Platform state */}
      <section className="rounded-xl border border-[var(--c-border)] bg-[color-mix(in_srgb,var(--c-card)_80%,transparent)] p-3.5">
        <h2 className="text-[12.5px] font-semibold text-[var(--c-text)] mb-1.5">Platform state</h2>
        <ul className="space-y-1.5 text-[11px] text-[var(--c-text-2)]">
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[var(--c-warn)]" /> Kill: {KILLS.length ? `partial — ${KILLS.length} active` : 'none'}</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[var(--c-ok)]" /> Receipts: {RECEIPTS.filter((r) => r.state === 'PENDING').length} pending · {USAGE.receipts_failed} failed</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[var(--c-ok)]" /> Providers: {PROVIDER_HEALTH.filter((p) => p.state === 'healthy').length} healthy · {PROVIDER_HEALTH.filter((p) => p.state !== 'healthy').length} degraded (simulator)</li>
          <li className="pt-0.5"><MaturityTag m="HERMETIC ONLY" /></li>
        </ul>
      </section>
    </div>
  )

  return (
    <div className="console min-h-screen w-full">
      {/* Data-mode banner. Demo mode must be unmistakable: fixture data is never production truth. */}
      {demo ? (
        <div role="note" data-testid="demo-banner" className="px-4 py-1 text-center text-[11px] font-semibold tracking-wide text-[var(--c-text)] bg-[color-mix(in_srgb,var(--c-warn)_18%,var(--c-bg))] border-b border-[color-mix(in_srgb,var(--c-warn)_40%,transparent)]">
          DEMO / NON-PRODUCTION — fixture data from the hermetic reference stores. No backend is connected; nothing here is live.
        </div>
      ) : (
        <div role="note" data-testid="api-banner" className="px-4 py-1 text-center text-[11px] font-medium text-[var(--c-text-2)] bg-[var(--c-panel)] border-b border-[var(--c-border)]">
          Connected to <span className="font-mono">{apiHost()}</span> · environment {auth.principal?.environment ?? '—'}
        </div>
      )}
      <div className="px-4 py-0.5 text-center text-[10.5px] font-medium text-[var(--c-muted)] bg-[var(--c-panel)] border-b border-[var(--c-border)]">
        {CLAIM_BANNER[CLAIM_LEVEL] ?? CLAIM_BANNER.HERMETIC}
        <span className="text-[var(--c-muted)]"> · claim level {CLAIM_LEVEL} · as of {STATUS_AS_OF} · </span>
        <a href="/developers/status" className="text-[var(--c-link)] underline underline-offset-2">build status</a>
      </div>

      {/* Top application bar — compact 54px (compactness spec) */}
      <header className="sticky top-0 z-40 h-[54px] flex items-center gap-2.5 px-3.5 border-b border-[var(--c-border)]" style={{ background: 'var(--c-bg)' }}>
        <button type="button" className="lg:hidden p-2 -ml-1 text-[var(--c-text-2)] hover:text-[var(--c-text)]" aria-label="Open console navigation" aria-expanded={drawer} onClick={() => setDrawer(true)}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </button>
        <a href="/app" className="flex items-center gap-2 shrink-0 lg:hidden">
          <BrandMark />
          <span className="text-[13px] font-semibold text-[var(--c-text)] tracking-tight">Connector OS</span>
        </a>
        <nav aria-label="Breadcrumb" className="hidden lg:flex items-center gap-1.5 text-[13px] text-[var(--c-muted)] shrink-0">
          <a href="/app" className="hover:text-[var(--c-text)]">Console</a>
          <span aria-hidden="true">/</span>
          <span className="text-[var(--c-text)]" aria-current="page">{pageTitle}</span>
        </nav>

        {demo && <span className="hidden sm:block">
          <Dropdown value={WORKSPACES.find((w) => w.id === ws)?.name ?? ws} options={WORKSPACES.map((w) => w.name)} ariaLabel="Workspace"
            onChange={(n) => setWs(WORKSPACES.find((w) => w.name === n)?.id ?? ws)} />
        </span>}

        {demo && <Dropdown value={env} options={ENVIRONMENTS} ariaLabel="Environment" onChange={(v) => setEnv(v as Environment)}
          accent={env === 'Production' ? 'var(--c-err)' : env === 'Staging' ? 'var(--c-warn)' : 'var(--c-ok)'} />}

        {/* Search — opens centered modal (refinement item 4) */}
        <div className="flex-1 hidden md:flex justify-center px-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Open search"
            className="relative w-full max-w-xl text-left bg-[var(--c-card)] border border-[var(--c-border)] rounded-lg pl-8 pr-11 h-9 text-[12px] text-[var(--c-muted)] hover:border-[color-mix(in_srgb,var(--c-info)_40%,transparent)] transition-colors"
          >
            Search id: run_, ex_, rc_, ap_, cn_, connector…
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--c-muted)]" width="13" height="13" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" /><path d="m13.5 13.5 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9.5px] text-[var(--c-muted)] border border-[var(--c-border)] rounded px-1.5 py-0.5">⌘K</kbd>
          </button>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button type="button" onClick={() => setRailOpen(true)} aria-label="Notifications" className="xl:hidden relative p-2 text-[var(--c-text-2)] hover:text-[var(--c-text)]">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 3a5 5 0 0 0-5 5v3l-1.5 3h13L15 11V8a5 5 0 0 0-5-5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><path d="M8 16.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.4" /></svg>
            {pending.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--c-warn)]" />}
          </button>
          <span className="hidden lg:block"><ThemeToggle /></span>
          <div className="hidden sm:block w-px h-6 bg-[var(--c-border)]" />
          {demo ? (
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10.5px] font-bold text-[var(--c-text)]" style={{ background: 'var(--c-active)' }} title="Demo identity — the console has no authentication yet">AS</span>
            <span className="hidden lg:block leading-tight">
              <span className="block text-[12px] font-semibold text-[var(--c-text)]">A. Sharma</span>
              <span className="block text-[10px] text-[var(--c-muted)]">Org admin · demo identity, no sign-in</span>
            </span>
          </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="hidden lg:block leading-tight text-right">
                <span className="block text-[12px] font-semibold text-[var(--c-text)] max-w-[180px] truncate">{auth.displayName}</span>
                <span className="block text-[10px] text-[var(--c-muted)]">{auth.principal?.kind === 'human' ? 'operator' : 'api key'}</span>
              </span>
              <button type="button" onClick={() => void signOut()} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-[var(--c-text)] bg-[var(--c-card)] border border-[var(--c-border)] hover:border-[var(--c-border-2)]">Sign out</button>
            </div>
          )}
        </div>
      </header>

      {/* Three-zone shell — full width, no max-width island (handoff §2.2) */}
      <div className="grid lg:grid-cols-[224px_minmax(0,1fr)] xl:grid-cols-[224px_minmax(0,1fr)_296px]">
        <aside className="hidden lg:flex flex-col h-[calc(100vh-54px)] sticky top-[54px] border-r border-[var(--c-border)]" style={{ background: 'var(--c-panel)' }}>
          <a href="/app" className="flex items-center gap-2.5 px-4 pt-4 pb-1">
            <BrandMark />
            <span className="text-[14px] font-semibold tracking-tight text-[var(--c-text)]">Connector OS</span>
          </a>
          {navBody}
          {navFoot}
        </aside>

        {/* Mobile nav drawer */}
        {drawer && (
          <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/70" onClick={() => setDrawer(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-72 flex flex-col border-r border-[var(--c-border)]" style={{ background: 'var(--c-panel)' }}>
              <div className="flex items-center justify-between px-4 h-14 border-b border-[var(--c-border)]">
                <span className="text-[13px] font-semibold text-[var(--c-text)]">Console</span>
                <button type="button" onClick={() => setDrawer(false)} aria-label="Close navigation" className="p-2 text-[var(--c-text-2)]">✕</button>
              </div>
              <div className="p-3 border-b border-[var(--c-border)]">
                <a href="/app/approvals" className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[color-mix(in_srgb,var(--c-warn)_8%,transparent)] border border-[color-mix(in_srgb,var(--c-warn)_30%,transparent)] text-[13px] font-semibold text-[var(--c-warn)]">
                  Approvals waiting <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[color-mix(in_srgb,var(--c-warn)_15%,transparent)] border border-[color-mix(in_srgb,var(--c-warn)_40%,transparent)]">{pending.length}</span>
                </a>
              </div>
              {navBody}
              {navFoot}
            </div>
          </div>
        )}

        {/* Central workspace — fluid, compact padding (compactness spec) */}
        <main className="min-w-0 px-4 md:px-5 py-4" data-env={env} data-ws={ws}>
          {children}
        </main>

        {/* Right utility rail — desktop */}
        <aside className="hidden xl:block w-[296px] shrink-0 border-l border-[var(--c-border)] h-[calc(100vh-54px)] sticky top-[54px] overflow-y-auto" style={{ background: 'var(--c-panel)' }}>
          {rail}
        </aside>

        {/* Rail drawer — <1280px */}
        {railOpen && (
          <div className="xl:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/70" onClick={() => setRailOpen(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-[320px] overflow-y-auto border-l border-[var(--c-border)]" style={{ background: 'var(--c-panel)' }}>
              <div className="flex items-center justify-between px-4 h-14 border-b border-[var(--c-border)]">
                <span className="text-[13px] font-semibold text-[var(--c-text)]">Activity</span>
                <button type="button" onClick={() => setRailOpen(false)} aria-label="Close" className="p-2 text-[var(--c-text-2)]">✕</button>
              </div>
              {rail}
            </div>
          </div>
        )}
      </div>

      {/* Action-required alert — FLOATING OVERLAY (compactness spec §2).
          position: fixed, high z-index; never consumes document layout height.
          Opening/closing moves nothing underneath. */}
      {path === '/app' && pending.length > 0 && !bannerDismissed && (
        <div
          role="alert"
          className="fixed z-[60] right-6 top-[86px] flex items-center gap-3 pl-3.5 pr-2.5 py-2.5 rounded-xl border border-[color-mix(in_srgb,var(--c-warn)_35%,transparent)] shadow-2xl"
          style={{
            width: 'min(680px, calc(100vw - 48px))',
            background: 'var(--c-card)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px color-mix(in srgb, var(--c-warn) 12%, transparent)',
          }}
        >
          <span className="text-[var(--c-warn)] shrink-0" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 3 2.5 16h15L10 3Z" fill="color-mix(in srgb, var(--c-warn) 20%, transparent)" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><path d="M10 8v3.5M10 14v.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </span>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-[var(--c-warn)]">{pending.length} approvals pending</div>
            <div className="text-[11.5px] text-[var(--c-warn)]">High-risk actions require your review.</div>
          </div>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <a href="/app/approvals" className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-[var(--c-on-primary)] bg-[var(--c-primary)] hover:opacity-90">Review approvals →</a>
            <button type="button" onClick={() => setBannerDismissed(true)} aria-label="Dismiss" className="p-1.5 text-[var(--c-warn)] hover:text-[var(--c-text)]">✕</button>
          </div>
        </div>
      )}

      <SearchModal open={searchOpen} initial={search} suggestions={demo} onClose={() => setSearchOpen(false)} onSubmit={(q) => { setSearch(q); setSearchOpen(false); navigate(searchTarget(q)) }} />
    </div>
  )
}
