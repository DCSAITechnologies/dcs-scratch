import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Logo } from './BrandIcon'
import { ConnectorLogo } from './ConnectorLogo'
import { PUBLISHED_COUNT, FEATURED, FEATURED_ROWS } from 'virtual:catalogue-summary'
import { navigate } from '../hooks/usePathRoute'

const NAV_ITEMS = ['Product', 'Connectors', 'Agents', 'Security', 'Enterprise', 'Developers', 'Pricing']

const ITEM_ROUTES: Record<string, string> = {
  Product: '/product', Connectors: '/connectors', Agents: '/agents', Security: '/security',
  Enterprise: '/enterprise', Developers: '/developers', Pricing: '/pricing',
}

type DropCol = { title: string; w?: number; items: { label: string; sub?: string; to?: string; conn?: string; one?: boolean }[] }
type Drop = { cols: DropCol[]; featured?: { title: string; desc: string; cta: string } }

// featured ids live in src/lib/featured.json and are validated at build time
const popularRows = FEATURED.navPopular
  .map((id) => FEATURED_ROWS[id])
  .map((c) => ({ label: c.n, sub: `${c.cat} · ${c.auth}`, conn: c.id }))

const DROPS: Record<string, Drop> = {
  Product: {
    cols: [
      {
        title: 'Product',
        items: [
          { label: 'Overview', sub: 'What Connector OS is', to: '/product' },
          { label: 'How it works', sub: 'The governed path, end to end', to: '/product/how-it-works' },
          { label: 'Execution Layer', sub: 'Controlled runtime for actions', to: '/product/execution-layer' },
          { label: 'Policies & Approvals', sub: 'Guardrails for sensitive actions', to: '/product/policies-approvals' },
          { label: 'Receipts & Audit', sub: 'Verifiable evidence records', to: '/product/receipts-audit' },
          { label: 'Reliability & Recovery', sub: 'Explicit failure handling', to: '/product/reliability-recovery' },
          { label: 'Architecture', sub: 'Control plane and data plane', to: '/product/architecture' },
        ],
      },
    ],
    featured: { title: 'Explore Connector OS', desc: 'Secure execution for AI agents across real systems.', cta: 'Explore product' },
  },
  Connectors: {
    cols: [
      { title: 'Popular connectors', items: popularRows },
      {
        title: 'Categories',
        items: [
          { label: 'AI & Models', sub: 'LLMs and model providers', to: '/connectors?cat=AI%20%26%20Models' },
          { label: 'Productivity', sub: 'Docs, tasks and notes', to: '/connectors?cat=Productivity' },
          { label: 'Communications', sub: 'Chat, email and calls', to: '/connectors?cat=Communications%20/%20Voice%20/%20Video' },
          { label: 'Developer Tools', sub: 'Repos, CI and issues', to: '/connectors?cat=Developer%20Tools' },
          { label: 'Cloud & Hosting', sub: 'Infra and deployments', to: '/connectors?cat=Cloud%20%26%20Hosting' },
          { label: 'Databases & Search', sub: 'Stores and indexes', to: '/connectors?cat=Databases%20%26%20Search' },
          { label: 'CRM & Sales', sub: 'Pipelines and contacts', to: '/connectors?cat=CRM%20%26%20Sales' },
        ],
      },
      {
        title: '',
        items: [
          { label: 'Finance & Accounting', sub: 'Books and billing', to: '/connectors?cat=Finance%20/%20Accounting%20/%20Tax' },
          { label: 'Payments & Fintech', sub: 'Payments and banking', to: '/connectors?cat=Payments%20/%20Banking%20/%20Fintech' },
          { label: 'Commerce & Marketplaces', sub: 'Stores and orders', to: '/connectors?cat=Commerce%20/%20Marketplaces' },
          { label: 'Security & Identity', sub: 'Auth, SSO and scanning', to: '/connectors?cat=Security%20%26%20Identity' },
          { label: 'Healthcare & Life Sciences', sub: 'Care and lab systems', to: '/connectors?cat=Healthcare' },
          { label: 'Education', sub: 'Courses and students', to: '/connectors?cat=Education' },
          { label: 'Government & Public Data', sub: 'Open public datasets', to: '/connectors?cat=Government%20/%20Public%20Data' },
        ],
      },
      {
        title: 'Use cases',
        items: [
          { label: 'Research agents', sub: 'Gather and cite sources', to: '/agents/use-cases' },
          { label: 'Support automation', sub: 'Resolve tickets safely', to: '/agents/use-cases' },
          { label: 'Sales workflows', sub: 'Update CRM from intent', to: '/agents/use-cases' },
          { label: 'Finance operations', sub: 'Reconcile and report', to: '/agents/use-cases' },
          { label: 'Marketing execution', sub: 'Run governed campaigns', to: '/agents/use-cases' },
          { label: 'Developer workflows', sub: 'Ship with guardrails', to: '/agents/use-cases' },
          { label: 'Internal copilots', sub: 'Act across workplace tools', to: '/agents/use-cases' },
          { label: 'Enterprise operations', sub: 'Cross-team automations', to: '/agents/use-cases' },
        ],
      },
    ],
    featured: { title: 'Explore all connectors', desc: `${PUBLISHED_COUNT} published connectors across major categories.`, cta: 'Browse catalogue' },
  },
  Agents: {
    cols: [
      {
        title: 'Agents',
        items: [
          { label: 'Operations Agent Layer', sub: 'Reasoning without uncontrolled access', to: '/agents' },
          { label: 'Agent lifecycle', sub: 'Ten canonical stages', to: '/agents/lifecycle' },
          { label: 'Agent governance', sub: 'Policy-driven tool access', to: '/agents/governance' },
          { label: 'Policy controls', sub: 'Rules, limits and guardrails', to: '/agents/policies' },
          { label: 'Human-in-the-loop', sub: 'Approvals for sensitive actions', to: '/agents/approvals' },
          { label: 'Executions', sub: 'Run, monitor, retry', to: '/agents/executions' },
          { label: 'Verification & Recovery', sub: 'Check outcomes, reconcile', to: '/agents/recovery' },
          { label: 'Agent use cases', sub: 'Real workflows, real tools', to: '/agents/use-cases' },
        ],
      },
    ],
    featured: { title: 'Build controlled agents', desc: 'Tools, policy, approval and execution in one layer.', cta: 'Explore agents' },
  },
  Security: {
    cols: [
      {
        title: 'Controls',
        items: [
          { label: 'Credential isolation', sub: 'Agents never hold raw credentials', to: '/security/credential-isolation' },
          { label: 'Tenant boundaries', sub: 'Tenant isolation controls', to: '/security/tenant-boundaries' },
          { label: 'Routing & egress controls', sub: 'Host and region binding', to: '/security/routing-egress' },
          { label: 'Approval-gated actions', sub: 'Policy checks before action', to: '/security/approval-gated-actions' },
          { label: 'Blast-radius controls', sub: 'Scoped, fine-grained access', to: '/security/blast-radius' },
          { label: 'Kill switch', sub: 'Emergency kill controls', to: '/security/kill-controls' },
          { label: 'Webhook security', sub: 'Unsigned never triggers writes', to: '/security/webhook-security' },
        ],
      },
      {
        title: 'Assurance',
        items: [
          { label: 'Retry & reconciliation', sub: 'Safe failure handling', to: '/security/retry-reconciliation' },
          { label: 'Redaction', sub: 'Digest-only by construction', to: '/security/redaction' },
          { label: 'Receipts & verification', sub: 'Proof for every action', to: '/security/receipts-verification' },
          { label: 'Audit history', sub: 'Tamper-evident audit history', to: '/security/audit-history' },
          { label: 'Failure behavior', sub: 'Fail-closed, component by component', to: '/security/failure-behavior' },
          { label: 'Security overview', sub: 'Architecture and model', to: '/security' },
        ],
      },
    ],
    featured: { title: 'Security overview', desc: 'How execution stays governed end to end.', cta: 'Read the overview' },
  },
  Enterprise: {
    cols: [
      {
        title: 'Enterprise',
        items: [
          { label: 'Organizations', sub: 'Multi-team top-level structure', to: '/enterprise/organizations' },
          { label: 'Workspaces', sub: 'Isolated team environments', to: '/enterprise/workspaces' },
          { label: 'Roles & permissions', sub: 'Granular access model', to: '/enterprise/roles-permissions' },
          { label: 'Approval workflows', sub: 'Human-in-the-loop at scale', to: '/enterprise/approval-workflows' },
          { label: 'Environments', sub: 'Dev, staging, production', to: '/enterprise/environments' },
          { label: 'Audit & governance', sub: 'Full activity visibility', to: '/enterprise/audit-governance' },
          { label: 'Enterprise controls', sub: 'Policy and connector governance', to: '/enterprise/controls' },
          { label: 'Contact sales', sub: 'Custom terms, talk to the team', to: '/enterprise/contact' },
        ],
      },
    ],
    featured: { title: 'Contact sales', desc: 'Deployment models, custom terms, dedicated support.', cta: 'Talk to us' },
  },
  Developers: {
    cols: [
      {
        title: 'Build',
        items: [
          { label: 'Quickstart', sub: 'The governed path, end to end', to: '/developers/quickstart' },
          { label: 'Authentication', sub: 'Two layers, never mixed', to: '/developers/authentication' },
          { label: 'Resource model', sub: 'Objects, fields and states', to: '/developers/api' },
          { label: 'Connectors', sub: 'Manifests and declarations', to: '/developers/connectors' },
          { label: 'SDK', sub: 'PRE-LAUNCH — design and shape', to: '/developers/sdk' },
          { label: 'MCP', sub: 'Governed tools for MCP clients', to: '/developers/mcp' },
          { label: 'Webhooks', sub: 'Two directions, labelled trust', to: '/developers/webhooks' },
        ],
      },
      {
        title: 'Reference',
        items: [
          { label: 'Policies', sub: 'Evaluate before you execute', to: '/developers/policies' },
          { label: 'Executions', sub: 'Attempts, outcomes, verification', to: '/developers/executions' },
          { label: 'Receipts', sub: 'cos-ops-v1 field groups', to: '/developers/receipts' },
          { label: 'CLI', sub: 'PRE-LAUNCH — same governance', to: '/developers/cli' },
          { label: 'Outcome reference', sub: 'Every state and how to handle it', to: '/developers/errors' },
          { label: 'Changelog', sub: "What's new", to: '/developers/changelog' },
          { label: 'Build status', sub: 'What is built, proven and next', to: '/developers/status' },
        ],
      },
    ],
    featured: { title: 'Start building', desc: 'Build your first governed agent integration.', cta: 'Start building' },
  },
}

const WIDE = new Set(['Developers', 'Security'])
const CENTER = new Set(['Connectors', 'Security'])
const RIGHT_ALIGN = new Set(['Security', 'Enterprise', 'Developers'])

// Colour tokens. Light is the public website; dark is kept for dark surfaces
// (the public site since 03 Oct 2026). Same menus, keyboard model and mobile drawer in both.
const THEMES = {
  dark: {
    header: (solid: boolean) => solid ? 'rgba(6,10,22,0.92)' : 'rgba(6,10,22,0.5)', border: 'rgba(120,140,255,0.14)',
    item: 'text-[#A9B6D3] hover:text-white', itemOpen: 'text-white', colTitle: 'text-[#93A0C2]', rowLabel: 'text-[#D6E1FF]', rowSub: 'text-[#93A0C2]',
    rowBorder: 'rgba(120,140,255,0.09)', dot: 'bg-[#5A7BFF]',
    featured: { background: 'linear-gradient(150deg, rgba(90,123,255,0.22), rgba(124,77,255,0.18))', border: '1px solid rgba(124,77,255,0.4)', boxShadow: '0 0 24px rgba(108,99,255,0.18)' },
    featuredTitle: 'text-white', featuredDesc: 'text-[#A9B6D3]', featuredCta: 'text-white', featuredArrow: 'text-[#8B9BFF]',
    signin: 'text-[#A9B6D3] hover:text-white', cta: 'cta-primary !py-2 !px-4 text-[13px]',
    burger: { border: '1px solid rgba(120,140,255,0.3)', background: 'rgba(16,26,56,0.6)' }, burgerText: 'text-white',
    mobileBg: 'rgba(6,10,22,0.97)', mobileItem: 'text-white', mobileToggle: 'text-[#A9B6D3]', mobileSub: 'text-[#C6D2EE] hover:bg-[rgba(108,99,255,0.1)]', mobileTitle: 'text-[#93A0C2]',
    mobileSecondary: 'text-[#C6D2EE]', mobileSecondaryBorder: '1px solid rgba(120,140,255,0.3)', mobilePrimary: 'cta-primary !m-0',
  },
  light: {
    header: (solid: boolean) => solid ? 'rgba(255,255,255,0.94)' : 'rgba(255,255,255,0.78)', border: '#E3E7EE',
    item: 'text-[#3A4357] hover:text-[#0B1220]', itemOpen: 'text-[#0B1220]', colTitle: 'text-[#5E6779]', rowLabel: 'text-[#0B1220]', rowSub: 'text-[#566074]',
    rowBorder: '#EEF1F5', dot: 'bg-[#2850D8]',
    featured: { background: '#F5F7FB', border: '1px solid #E3E7EE', boxShadow: 'none' },
    featuredTitle: 'text-[#0B1220]', featuredDesc: 'text-[#566074]', featuredCta: 'text-[#2850D8]', featuredArrow: 'text-[#2850D8]',
    signin: 'text-[#3A4357] hover:text-[#0B1220]', cta: 'rounded-lg bg-[#0B1220] text-white font-semibold py-2 px-4 text-[13px] hover:bg-[#1C2436] transition-colors',
    burger: { border: '1px solid #D2D8E2', background: '#FFFFFF' }, burgerText: 'text-[#0B1220]',
    mobileBg: 'rgba(255,255,255,0.98)', mobileItem: 'text-[#0B1220]', mobileToggle: 'text-[#566074]', mobileSub: 'text-[#2B3446] hover:bg-[#F1F4F9]', mobileTitle: 'text-[#5E6779]',
    mobileSecondary: 'text-[#0B1220]', mobileSecondaryBorder: '1px solid #D2D8E2', mobilePrimary: 'bg-[#0B1220] text-white',
  },
} as const

export function LightLogo() {
  return (
    <a href="/" className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: '#0B1220' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 12a8 8 0 0 1 16 0" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="12" cy="14" r="3.2" fill="#fff" />
          <circle cx="12" cy="4" r="1.6" fill="#9DB4FF" />
        </svg>
      </span>
      <span className="font-display text-[15px] font-semibold tracking-tight text-[#0B1220]">DCS Connector OS</span>
    </a>
  )
}

export function Nav({ theme = 'dark' }: { theme?: 'dark' | 'light' } = {}) {
  const T = THEMES[theme]
  const [open, setOpen] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileArea, setMobileArea] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  // Keyboard + pointer model for the mega menu: ArrowDown/Enter-free open from
  // the trigger moves focus to the first item; Arrow keys move between items;
  // Escape closes and returns focus to the trigger; Tab or a click outside closes.
  const navRef = useRef<HTMLElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({})
  const focusFirst = useRef(false)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(null) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  useEffect(() => {
    if (open && focusFirst.current) { menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus(); focusFirst.current = false }
  }, [open])

  // keep the panel inside the viewport (narrow windows, browser zoom): measure
  // after layout and nudge with the CSS `translate` property (composes with the
  // existing transform), no re-render needed
  useLayoutEffect(() => {
    const el = menuRef.current
    if (!open || !el) return
    el.style.translate = ''
    const r = el.getBoundingClientRect()
    const margin = 16
    const dx = r.right > window.innerWidth - margin ? window.innerWidth - margin - r.right : r.left < margin ? margin - r.left : 0
    if (dx) el.style.translate = `${Math.round(dx)}px 0`
  }, [open])

  const menuKeys = (e: React.KeyboardEvent, item: string) => {
    const items = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])]
    const i = items.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus()
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault(); items[e.key === 'Home' ? 0 : items.length - 1]?.focus()
    } else if (e.key === 'Escape') {
      e.preventDefault(); setOpen(null); triggers.current[item]?.focus()
    } else if (e.key === 'Tab') {
      setOpen(null)
    }
  }

  const enter = (item: string) => { clearTimeout(closeTimer.current); if (DROPS[item]) setOpen(item) }
  const leave = () => { closeTimer.current = setTimeout(() => setOpen(null), 150) }
  const go = (to: string) => { setOpen(null); setMobileOpen(false); navigate(to) }

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${theme === 'light' ? 'nav-light' : ''}`}
      style={{ background: T.header(scrolled || mobileOpen), backdropFilter: 'blur(16px)', borderBottom: `1px solid ${T.border}` }}
    >
      <div className={`mx-auto max-w-[1760px] px-4 sm:px-8 xl:px-12 2xl:px-16 flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-14' : 'h-16'}`}>
        <a href="/" className="shrink-0" onClick={() => setMobileOpen(false)}>{theme === 'light' ? <LightLogo /> : <Logo />}</a>
        <nav ref={navRef} className="hidden lg:flex items-center gap-0.5" aria-label="Primary" onMouseLeave={leave}>
          {NAV_ITEMS.map((item) => (
            <div key={item} className="relative" onMouseEnter={() => enter(item)}>
              <button
                ref={(el) => { triggers.current[item] = el }}
                onClick={() => go(ITEM_ROUTES[item])}
                onKeyDown={(e) => {
                  if ((e.key === 'ArrowDown' || e.key === ' ') && DROPS[item]) { e.preventDefault(); focusFirst.current = true; setOpen(item) }
                  if (e.key === 'Escape') setOpen(null)
                }}
                aria-haspopup={DROPS[item] ? 'menu' : undefined}
                aria-expanded={open === item}
                className={`px-2 xl:px-3 py-2 text-[13px] xl:text-[13.5px] font-medium whitespace-nowrap rounded-lg transition-colors duration-200 flex items-center gap-1 ${open === item ? T.itemOpen : T.item}`}
              >
                {item}
                {DROPS[item] && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className={`transition-transform duration-200 ${open === item ? 'rotate-180' : ''}`} aria-hidden="true">
                    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                  </svg>
                )}
              </button>

              {open === item && DROPS[item] && (
                <div ref={menuRef} role="menu" aria-label={`${item} menu`} onKeyDown={(e) => menuKeys(e, item)} className="nav-dropdown absolute top-full" style={CENTER.has(item) ? { position: 'fixed', left: '50%', transform: 'translateX(-50%)', top: scrolled ? 56 : 64, paddingTop: 12, width: item === 'Connectors' ? 'min(1200px, calc(100vw - 48px))' : 880, animation: 'dropdownInCenter 200ms cubic-bezier(0.22,1,0.36,1)' } : RIGHT_ALIGN.has(item) ? { right: 0, paddingTop: 12, animation: 'dropdownIn 200ms cubic-bezier(0.22,1,0.36,1)' } : { left: 0, paddingTop: 12, animation: 'dropdownIn 200ms cubic-bezier(0.22,1,0.36,1)' }}>
                  <div className="p-4 flex gap-5" style={CENTER.has(item) ? {} : { width: WIDE.has(item) ? 720 : 460, maxWidth: 'calc(100vw - 32px)' }}>
                    {DROPS[item].cols.map((col, ci) => (
                      <div key={col.title || ci} className={col.w ? 'shrink-0 min-w-0' : 'flex-1 min-w-0'} style={col.w ? { width: col.w } : undefined}>
                        <div className={`text-[10.5px] font-semibold uppercase tracking-[0.16em] ${T.colTitle} mb-2 px-2 min-h-[13px]`}>{col.title}</div>
                        {col.items.map((it, idx) => (
                          <button key={it.label} role="menuitem" onClick={() => go(it.conn ? `/connectors/${it.conn}` : it.to ?? ITEM_ROUTES[item])} className="nav-dropdown-row flex items-center gap-2.5 w-full text-left px-2 py-[7px]" style={idx < col.items.length - 1 ? { borderBottom: `1px solid ${T.rowBorder}` } : undefined}>
                            {it.conn ? (
                              <ConnectorLogo name={it.label} src={FEATURED_ROWS[it.conn].logo} size={28} />
                            ) : (
                              <span className={`w-1 h-1 rounded-full ${T.dot} shrink-0 ml-1`} aria-hidden="true" />
                            )}
                            <span className="min-w-0">
                              <span className={`block text-[13px] ${T.rowLabel} leading-tight ${it.one ? 'whitespace-nowrap' : ''}`}>{it.label}</span>
                              {it.sub && <span className={`block text-[10.5px] ${T.rowSub} leading-tight mt-0.5 truncate`}>{it.sub}</span>}
                            </span>
                          </button>
                        ))}
                      </div>
                    ))}
                    {DROPS[item].featured && (
                      <div className="w-[200px] shrink-0 rounded-xl p-4 flex flex-col justify-between" style={T.featured}>
                        <div>
                          <div className={`text-[13px] font-semibold ${T.featuredTitle}`}>{DROPS[item].featured!.title}</div>
                          <p className={`mt-1.5 text-[11px] leading-relaxed ${T.featuredDesc}`}>{DROPS[item].featured!.desc}</p>
                        </div>
                        <button onClick={() => go(ITEM_ROUTES[item])} className={`group mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold ${T.featuredCta}`}>
                          {DROPS[item].featured!.cta}
                          <span className={`transition-transform duration-200 group-hover:translate-x-1 ${T.featuredArrow}`}>→</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a href="/signin" className={`hidden sm:block lg:hidden xl:block whitespace-nowrap text-[13.5px] font-medium ${T.signin} transition-colors`}>Sign in</a>
          <a href="/signin" className={`${T.cta} hidden sm:inline-flex whitespace-nowrap`}>Start building</a>
          <button
            className={`lg:hidden w-10 h-10 flex items-center justify-center rounded-lg ${T.burgerText}`}
            style={T.burger}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => { setMobileOpen((v) => !v); setMobileArea(null) }}
          >
            {mobileOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav aria-label="Mobile" className="lg:hidden overflow-y-auto" style={{ maxHeight: 'calc(100vh - 64px)', background: T.mobileBg, borderTop: `1px solid ${T.border}` }}>
          <div className="px-6 py-4">
            {NAV_ITEMS.map((item) => (
              <div key={item} style={{ borderBottom: `1px solid ${theme === 'light' ? T.rowBorder : 'rgba(120,140,255,0.1)'}` }}>
                <div className="flex items-center">
                  <button onClick={() => go(ITEM_ROUTES[item])} className={`flex-1 text-left py-3.5 text-[15px] font-semibold ${T.mobileItem}`}>
                    {item}
                  </button>
                  {DROPS[item] && (
                    <button
                      onClick={() => setMobileArea((cur) => (cur === item ? null : item))}
                      aria-expanded={mobileArea === item}
                      aria-label={`Toggle ${item} submenu`}
                      className={`w-10 h-10 flex items-center justify-center ${T.mobileToggle}`}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={`transition-transform duration-200 ${mobileArea === item ? 'rotate-180' : ''}`} aria-hidden="true">
                        <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                </div>
                {mobileArea === item && DROPS[item] && (
                  <div className="pb-3 pl-3">
                    {DROPS[item].cols.map((col, ci) => (
                      <div key={col.title || ci} className="mb-2">
                        <div className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${T.mobileTitle} py-1.5`}>{col.title}</div>
                        {col.items.map((it) => (
                          <button key={it.label} onClick={() => go(it.conn ? `/connectors/${it.conn}` : it.to ?? ITEM_ROUTES[item])} className={`block w-full text-left py-2 px-2 text-[13.5px] ${T.mobileSub} rounded-lg`}>
                            {it.label}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="py-4 flex gap-3">
              <a href="/receipts" onClick={() => setMobileOpen(false)} className={`flex-1 text-center py-3 rounded-xl text-[14px] font-semibold ${T.mobileSecondary}`} style={{ border: T.mobileSecondaryBorder }}>Receipts</a>
              <a href="/signin" onClick={() => setMobileOpen(false)} className={`flex-1 text-center py-3 rounded-xl text-[14px] font-semibold ${T.mobilePrimary}`}>Sign in</a>
            </div>
          </div>
        </nav>
      )}
      <style>{`
        @keyframes dropdownIn { from { opacity: 0; transform: translateY(-6px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes dropdownInCenter { from { opacity: 0; transform: translateX(-50%) translateY(-6px) scale(0.98); } to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); } }
      `}</style>
    </header>
  )
}
