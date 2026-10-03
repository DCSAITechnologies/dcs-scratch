// Founder-review concept pages: /preview/heroes and /preview/hero-a|b|c (noindex, unlinked).
// The homepage uses A + C (rotating) and B as "How it works"; these pages keep each concept on its own.
import type { ReactNode } from 'react'
import { HeroA, HeroB, HeroC } from '../../components/hero/Heroes'
import { C } from '../../components/hero/tokens'

// ---------------------------------------------------------------- page shell

const CONCEPTS = [
  { id: 'a', name: 'Control plane canvas', Hero: HeroA,
    pitch: 'Split layout. A single product canvas tells the whole story: a connector is chosen from a calm tile grid, then the connection, policy, execution and receipt cards light up along one rail.' },
  { id: 'b', name: 'Four-stage ledger', Hero: HeroB,
    pitch: 'Centred statement — “Connect. Govern. Execute. Verify.” — over a four-card band. The active card lifts while a thin track advances; the strongest expression of the product sentence.' },
  { id: 'c', name: 'Catalogue field', Hero: HeroC,
    pitch: 'Scale made literal and honest: one square per catalogued connector, regrouping by category, then an operator panel (environment, approvals, kill switch, receipts) settles in front.' },
] as const

function PreviewChrome({ current, children }: { current: string; children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: C.bg, color: C.ink }}>
      <div className="px-5 py-2 text-center text-[12px] font-medium lg:px-8" style={{ background: C.ink, color: '#E6EAF2' }}>
        Concept preview for founder review — the homepage now uses A + C ·{' '}
        {CONCEPTS.map((c, i) => (
          <span key={c.id}>{i > 0 && ' · '}<a href={`/preview/hero-${c.id}`} aria-current={current === c.id ? 'page' : undefined} className={current === c.id ? 'font-semibold underline' : 'underline decoration-[#6B7385] underline-offset-2'}>HERO-{c.id.toUpperCase()}</a></span>
        ))}
        {' · '}<a href="/" className="underline decoration-[#6B7385] underline-offset-2">Homepage</a>{' · '}<a href="/preview/heroes" className={current === 'all' ? 'font-semibold underline' : 'underline decoration-[#6B7385] underline-offset-2'}>All</a>
      </div>
      <header className="border-b" style={{ borderColor: C.line, background: 'rgba(255,255,255,.86)' }}>
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-6 px-5 lg:px-8">
          <a href="/" className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight" style={{ color: C.ink }}>
            <span aria-hidden className="grid h-7 w-7 place-items-center rounded-lg text-[11px] font-bold text-white" style={{ background: C.ink }}>DCS</span>
            Connector OS
          </a>
          <nav aria-label="Site (preview)" className="hidden items-center gap-6 text-[13.5px] font-medium lg:flex" style={{ color: C.ink2 }}>
            {[['Product', '/product'], ['Connectors', '/connectors'], ['Agents', '/agents'], ['Security', '/security'], ['Pricing', '/pricing'], ['Developers', '/developers']].map(([l, h]) => <a key={h} href={h} className="hover:underline">{l}</a>)}
          </nav>
          <div className="flex items-center gap-3 text-[13.5px] font-medium">
            <a href="/signin" className="hidden sm:inline" style={{ color: C.ink2 }}>Sign in</a>
            <a href="/contact" className="rounded-lg px-3.5 py-2 text-white" style={{ background: C.ink }}>Request access</a>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}

export function HeroPreview({ route }: { route: string }) {
  const m = /^\/preview\/hero-([abc])\/?$/.exec(route)
  if (m) {
    const c = CONCEPTS.find((x) => x.id === m[1])!
    return <PreviewChrome current={c.id}><c.Hero /></PreviewChrome>
  }
  return (
    <PreviewChrome current="all">
      <section className="mx-auto max-w-[1240px] px-5 py-14 lg:px-8">
        <h1 className="text-[32px] font-semibold tracking-tight" style={{ color: C.ink }}>Homepage hero — three concepts</h1>
        <p className="mt-3 max-w-[720px] text-[15.5px]" style={{ color: C.muted }}>
          Each concept tells the same story — connect, govern, execute, verify — with derived counts and labelled illustrative panels. The live homepage is unchanged until one is selected.
        </p>
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {CONCEPTS.map((c) => (
            <li key={c.id} className="rounded-2xl p-6" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: C.blue }}>HERO-{c.id.toUpperCase()}</p>
              <h2 className="mt-2 text-[19px] font-semibold" style={{ color: C.ink }}>{c.name}</h2>
              <p className="mt-2 text-[14px] leading-relaxed" style={{ color: C.muted }}>{c.pitch}</p>
              <a href={`/preview/hero-${c.id}`} className="mt-5 inline-flex text-[14px] font-semibold" style={{ color: C.blue }}>Open HERO-{c.id.toUpperCase()} <span aria-hidden className="ml-1">→</span></a>
            </li>
          ))}
        </ul>
      </section>
    </PreviewChrome>
  )
}
