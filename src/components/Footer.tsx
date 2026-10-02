import { PUBLISHED_COUNT } from '../lib/data'
import { Logo } from './BrandIcon'

const COLS: Record<string, [string, string][]> = {
  Product: [['Overview', '/product'], ['Connectors', '/connectors'], ['Agents', '/agents'], ['Security', '/security'], ['Enterprise', '/enterprise'], ['Pricing', '/pricing']],
  Developers: [['Quickstart', '/developers/quickstart'], ['Overview', '/developers'], ['SDKs', '/developers/sdk'], ['MCP', '/developers/mcp'], ['Resource model', '/developers/api'], ['Webhooks', '/developers/webhooks'], ['Changelog', '/developers/changelog'], ['Build status', '/developers/status']],
  Company: [['About', '/about'], ['Contact', '/contact']],
  Legal: [['Privacy', '/privacy'], ['Terms', '/terms'], ['Security', '/security']],
}

export function Footer() {
  return (
    <footer style={{ borderTop: '1px solid rgba(120,140,255,0.14)', background: '#04070F' }}>
      <div className="mx-auto max-w-[1400px] px-8 py-14 grid md:grid-cols-[280px_1fr] gap-12">
        <div>
          <Logo />
          <p className="mt-4 text-[12.5px] leading-relaxed text-[#93A0C2] max-w-[240px]">
            The governed execution layer between AI agents and real systems — {PUBLISHED_COUNT} published connectors, policy, approvals and receipts.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {Object.entries(COLS).map(([title, links]) => (
            <div key={title}>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#93A0C2] mb-3">{title}</div>
              <ul className="space-y-2">
                {links.map(([label, to]) => (
                  <li key={label}>
                    <a href={`${to}`} className="text-[12.5px] text-[#A9B6D3] hover:text-white transition-colors">{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-[rgba(120,140,255,0.1)]">
        <div className="mx-auto max-w-[1400px] px-8 py-5 flex items-center justify-between text-[11.5px] text-[#93A0C2]">
          <span>© {new Date().getFullYear()} DCS Connector OS</span>
          <span>Reasoning ≠ execution · Evidence over narration</span>
        </div>
      </div>
    </footer>
  )
}
