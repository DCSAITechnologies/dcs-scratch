import type { ReactNode } from 'react'
import { PUBLISHED_COUNT, FEATURED, FEATURED_ROWS } from 'virtual:catalogue-summary'
import { LightLogo } from './Nav'

// Footer columns mirror the header menus. Every link is a real route (the e2e link
// crawl visits each one); popular connectors come from featured.json (build-validated).
const COLS: { title: string; links: [string, string][] }[] = [
  { title: 'Product', links: [['Overview', '/product'], ['How it works', '/product/how-it-works'], ['Execution layer', '/product/execution-layer'], ['Policies & approvals', '/product/policies-approvals'], ['Receipts & audit', '/product/receipts-audit'], ['Reliability & recovery', '/product/reliability-recovery'], ['Architecture', '/product/architecture'], ['Pricing', '/pricing']] },
  { title: 'Connectors', links: [['Browse the catalogue', '/connectors'], ...FEATURED.navPopular.slice(0, 6).map((id): [string, string] => [FEATURED_ROWS[id].n, `/connectors/${id}`]), ['Developer Tools', '/connectors?cat=Developer%20Tools']] },
  { title: 'Agents', links: [['Overview', '/agents'], ['Lifecycle', '/agents/lifecycle'], ['Governance', '/agents/governance'], ['Policy controls', '/agents/policies'], ['Human approvals', '/agents/approvals'], ['Executions', '/agents/executions'], ['Recovery', '/agents/recovery'], ['Use cases', '/agents/use-cases']] },
  { title: 'Security', links: [['Overview', '/security'], ['Credential isolation', '/security/credential-isolation'], ['Tenant boundaries', '/security/tenant-boundaries'], ['Approval-gated actions', '/security/approval-gated-actions'], ['Kill controls', '/security/kill-controls'], ['Webhook security', '/security/webhook-security'], ['Audit history', '/security/audit-history'], ['Receipts & verification', '/security/receipts-verification']] },
  { title: 'Enterprise', links: [['Overview', '/enterprise'], ['Organizations', '/enterprise/organizations'], ['Workspaces', '/enterprise/workspaces'], ['Roles & permissions', '/enterprise/roles-permissions'], ['Environments', '/enterprise/environments'], ['Audit & governance', '/enterprise/audit-governance'], ['Contact sales', '/enterprise/contact']] },
  { title: 'Developers', links: [['Overview', '/developers'], ['Quickstart', '/developers/quickstart'], ['API reference', '/developers/api'], ['Authentication', '/developers/authentication'], ['MCP', '/developers/mcp'], ['Webhooks', '/developers/webhooks'], ['Changelog', '/developers/changelog'], ['Build status', '/developers/status']] },
  { title: 'Company', links: [['About', '/about'], ['Contact', '/contact'], ['Receipts', '/receipts'], ['Sign in', '/signin'], ['Privacy', '/privacy'], ['Terms', '/terms']] },
]

export function Footer({ logo }: { logo?: ReactNode } = {}) {
  return (
    <footer style={{ borderTop: '1px solid #E3E7EE', background: '#FFFFFF' }}>
      <div className="mx-auto max-w-[1400px] px-6 sm:px-8 pt-12 pb-10">
        <div className="flex flex-col gap-6 border-b border-[#EEF1F5] pb-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md">
            {logo ?? <LightLogo />}
            <p className="mt-3 text-[13px] leading-relaxed text-[#566074]">
              The governed execution layer between AI agents and real systems — {PUBLISHED_COUNT} published connectors, with policy, approvals and a receipt for every action.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/contact" className="rounded-lg bg-[#0B1220] px-4 py-2.5 text-[13.5px] font-semibold text-white hover:bg-[#1C2436]">Request access</a>
            <a href="/connectors" className="rounded-lg border border-[#D2D8E2] bg-white px-4 py-2.5 text-[13.5px] font-semibold text-[#0B1220] hover:border-[#AEB7C6]">Browse connectors</a>
          </div>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-9 pt-10 sm:grid-cols-4 lg:grid-cols-7">
          {COLS.map((col) => (
            <div key={col.title}>
              <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#566074]">{col.title}</h2>
              <ul className="space-y-2">
                {col.links.map(([label, to]) => (
                  <li key={to}><a href={to} className="text-[13px] text-[#2B3446] hover:text-[#2850D8]">{label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-[#EEF1F5]">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-6 py-5 text-[12px] text-[#566074] sm:px-8">
          <span>© {new Date().getFullYear()} DCS Connector OS · <a href="/privacy" className="hover:text-[#0B1220]">Privacy</a> · <a href="/terms" className="hover:text-[#0B1220]">Terms</a> · <a href="/security" className="hover:text-[#0B1220]">Security</a></span>
          <span>Reasoning ≠ execution · Evidence over narration</span>
        </div>
      </div>
    </footer>
  )
}
