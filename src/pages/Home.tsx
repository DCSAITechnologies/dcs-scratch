// Homepage (light theme). Founder direction, 03 Oct 2026: HERO-A and HERO-C alternate in the hero
// every 10 s; HERO-B is the "How it works" section. Every number is derived from the catalogue.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { TOTAL_CATALOGUED, PUBLISHED_COUNT, CATEGORY_COUNTS, FEATURED, FEATURED_ROWS } from 'virtual:catalogue-summary'
import { ConnectorLogo } from '../components/ConnectorLogo'
import { HeroA, HeroB, HeroC } from '../components/hero/Heroes'
import { C, SCALE } from '../components/hero/tokens'
import { usePrefersReducedMotion } from '../components/hero/motion'

const SLIDE_MS = 10_000
const SLIDES = [
  { id: 'a', label: 'Governed connections', Hero: HeroA },
  { id: 'c', label: `${SCALE} connector catalogue`, Hero: HeroC },
] as const

function initialSlide() {
  const s = new URLSearchParams(window.location.search).get('slide')
  return Math.max(0, SLIDES.findIndex((x) => x.id === s))
}

/**
 * Two heroes in one cell, cross-fading every 10 s.
 * - Pauses while the pointer is over it or focus is inside it, while it is off-screen
 *   or the tab is hidden, and when the visitor presses Pause (WCAG 2.2.2).
 * - Each slide restarts its own step sequence when it comes in (remount by key);
 *   the hidden slide's sequence is stopped.
 * - Reduced motion: no auto-rotation; the slide buttons still switch.
 */
function HeroRotator() {
  const reduced = usePrefersReducedMotion()
  const [state, setState] = useState(() => ({ index: initialSlide(), runs: [0, 0] }))
  const [userPaused, setUserPaused] = useState(false)
  const [hover, setHover] = useState(false)
  const [focusIn, setFocusIn] = useState(false)
  const [visible, setVisible] = useState(true)
  const ref = useRef<HTMLElement>(null)
  const auto = !reduced && !new URLSearchParams(window.location.search).has('still')
  const paused = userPaused || hover || focusIn || !visible

  const show = (index: number) => setState((s) => (s.index === index ? s : { index, runs: s.runs.map((r, i) => (i === index ? r + 1 : r)) }))

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting && !document.hidden), { threshold: 0.3 })
    io.observe(el)
    const onVis = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  // the progress bar's animationend drives the advance, so pausing (animation-play-state)
  // also freezes the countdown exactly where it is
  const advance = () => show((state.index + 1) % SLIDES.length)

  return (
    <section ref={ref} aria-roledescription="carousel" aria-label="Connector OS overview"
      onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}
      onFocus={() => setFocusIn(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocusIn(false) }}
      className="relative">
      <div className="grid">
        {SLIDES.map((s, i) => {
          const on = i === state.index
          return (
            <div key={s.id} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${SLIDES.length}: ${s.label}`} aria-hidden={!on} inert={!on}
              className="[grid-area:1/1]"
              style={{ opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(10px)', pointerEvents: on ? 'auto' : 'none', transition: auto ? 'opacity 800ms cubic-bezier(.2,.7,.2,1), transform 800ms cubic-bezier(.2,.7,.2,1)' : undefined }}>
              <s.Hero key={state.runs[i]} running={on} heading={on ? 'h1' : 'div'} />
            </div>
          )
        })}
      </div>

      <div className="mx-auto -mt-6 flex max-w-[1240px] flex-wrap items-center gap-3 px-5 pb-10 lg:px-8">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a slide">
          {SLIDES.map((s, i) => {
            const on = i === state.index
            return (
              <button key={s.id} type="button" onClick={() => show(i)} aria-current={on ? 'true' : undefined}
                className="relative overflow-hidden rounded-full px-3.5 py-1.5 text-[12.5px] font-medium"
                style={{ color: on ? C.ink : C.muted, background: C.surface, border: `1px solid ${on ? C.line2 : C.line}` }}>
                {on && auto && (
                  <span key={`${state.index}-${state.runs[i]}`} aria-hidden className="absolute bottom-0 left-0 h-[2px]"
                    onAnimationEnd={advance}
                    style={{ background: C.blue, animation: `demo-progress ${SLIDE_MS}ms linear forwards`, animationPlayState: paused ? 'paused' : 'running' }} />
                )}
                {s.label}
              </button>
            )
          })}
        </div>
        {auto && (
          <button type="button" onClick={() => setUserPaused((p) => !p)} aria-label={userPaused ? 'Play hero rotation' : 'Pause hero rotation'}
            className="grid h-8 w-8 place-items-center rounded-full" style={{ color: C.ink2, background: C.surface, border: `1px solid ${C.line}` }}>
            {userPaused
              ? <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M3 1.5v9l7.5-4.5z" fill="currentColor" /></svg>
              : <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M3 1.5h2v9H3zM7 1.5h2v9H7z" fill="currentColor" /></svg>}
          </button>
        )}
      </div>
      <style>{'@keyframes demo-progress { from { width: 0 } to { width: 100% } }'}</style>
    </section>
  )
}

function LogoStrip() {
  const rows = FEATURED.homeStrip.map((id) => FEATURED_ROWS[id])
  const loop = [...rows, ...rows]
  return (
    <section aria-labelledby="strip-title" className="border-y py-10" style={{ borderColor: C.line, background: C.surface }}>
      <p id="strip-title" className="mb-6 text-center text-[12.5px] font-medium" style={{ color: C.muted }}>
        From the catalogue — {PUBLISHED_COUNT} published of {TOTAL_CATALOGUED.toLocaleString('en-US')} catalogued connectors
      </p>
      <div className="marquee-mask overflow-hidden">
        <div className="marquee-track">
          {loop.map((c, i) => (
            <a key={`${c.id}-${i}`} href={`/connectors/${c.id}`} tabIndex={i >= rows.length ? -1 : undefined} aria-hidden={i >= rows.length ? true : undefined}
              className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 transition-colors hover:bg-[#F5F7FB]" style={{ border: `1px solid ${C.line}` }}>
              <ConnectorLogo name={c.n} src={c.logo} size={32} />
              <span className="text-[13px] font-medium" style={{ color: C.ink2 }}>{c.n}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

const PILLARS: { title: string; body: string; to: string; icon: ReactNode }[] = [
  { title: 'Credential isolation', body: 'Agents never hold raw credentials. Connections reference a vault entry; the browser and the agent see a reference only.', to: '/security/credential-isolation',
    icon: <path d="M7 10V7a5 5 0 0 1 10 0v3M5 10h14v10H5z" /> },
  { title: 'Policy and approval', body: 'Every action is evaluated before it runs. Sensitive writes wait for a named approver, in the environment you choose.', to: '/product/policies-approvals',
    icon: <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6zM9 12l2 2 4-4" /> },
  { title: 'Controlled execution', body: 'Approved steps run once through the execution layer, with retries, reconciliation and a kill switch per connection.', to: '/product/execution-layer',
    icon: <path d="M5 4h14v16H5zM9 9l3 3-3 3M13 15h3" /> },
  { title: 'Receipts and audit', body: 'Each action leaves an evidence record: the policy decision, the approval, the provider response and the outcome.', to: '/product/receipts-audit',
    icon: <path d="M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21zM10 8h4M10 12h4" /> },
]

function Pillars() {
  return (
    <section aria-labelledby="pillars" className="px-5 py-20 lg:px-8" style={{ background: C.surface, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
      <div className="mx-auto max-w-[1180px]">
        <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: C.blue }}>Governance built in</p>
        <h2 id="pillars" className="mt-3 max-w-[640px] text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[34px]" style={{ color: C.ink }}>
          Reasoning stays with the agent. Execution stays governed.
        </h2>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <li key={p.title}>
              <a href={p.to} className="group flex h-full flex-col rounded-2xl p-5 transition-shadow hover:shadow-[0_18px_36px_-20px_rgba(16,24,40,.25)]" style={{ border: `1px solid ${C.line}`, background: C.surface }}>
                <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: C.blueSoft, color: C.blue }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{p.icon}</svg>
                </span>
                <span className="mt-4 text-[15.5px] font-semibold" style={{ color: C.ink }}>{p.title}</span>
                <span className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.muted }}>{p.body}</span>
                <span className="mt-auto pt-4 text-[13px] font-semibold" style={{ color: C.blue }}>Learn more <span aria-hidden className="inline-block transition-transform group-hover:translate-x-0.5">→</span></span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function CatalogueBand() {
  const stats = [
    { k: SCALE, v: 'connectors catalogued' },
    { k: String(PUBLISHED_COUNT), v: 'published in the catalogue' },
    { k: String(CATEGORY_COUNTS.length), v: 'categories' },
  ]
  return (
    <section aria-labelledby="catalogue" className="px-5 py-20 lg:px-8">
      <div className="mx-auto grid max-w-[1180px] items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: C.blue }}>Catalogue</p>
          <h2 id="catalogue" className="mt-3 text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[34px]" style={{ color: C.ink }}>One catalogue, one governance model.</h2>
          <p className="mt-4 max-w-[520px] text-[15.5px] leading-relaxed" style={{ color: C.muted }}>
            Every connector carries the same manifest, policy hooks and receipt shape. Availability is enabled per connector and per environment as each one passes staging verification — the catalogue shows exactly where each stands.
          </p>
          <a href="/connectors" className="mt-7 inline-flex items-center rounded-lg px-5 py-3 text-[14px] font-semibold text-white" style={{ background: C.ink }}>Browse the catalogue <span aria-hidden className="ml-1.5">→</span></a>
        </div>
        <dl className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.v} className="rounded-2xl p-5" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
              <dt className="sr-only">{s.v}</dt>
              <dd className="text-[26px] font-semibold tracking-tight tabular-nums sm:text-[30px]" style={{ color: C.ink }}>{s.k}</dd>
              <dd className="mt-1 text-[12.5px] leading-snug" style={{ color: C.muted }}>{s.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

function DevelopersBand() {
  return (
    <section aria-labelledby="devs" className="px-5 pb-20 lg:px-8">
      <div className="mx-auto grid max-w-[1180px] gap-8 rounded-3xl p-6 sm:p-10 lg:grid-cols-[1fr_1.1fr]" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
        <div>
          <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: C.blue }}>Developers</p>
          <h2 id="devs" className="mt-3 text-[24px] font-semibold leading-[1.2] tracking-[-0.02em] sm:text-[28px]" style={{ color: C.ink }}>One contract for every connector.</h2>
          <p className="mt-3 text-[14.5px] leading-relaxed" style={{ color: C.muted }}>A typed REST API (contract 1.0.0), MCP tools and webhooks. An execution submits one approved plan step; the approval is consumed once, and a repeated Idempotency-Key replays instead of dispatching twice.</p>
          <ul className="mt-5 grid grid-cols-2 gap-2 text-[13.5px] font-medium">
            {[['Quickstart', '/developers/quickstart'], ['Resource model', '/developers/api'], ['MCP', '/developers/mcp'], ['Webhooks', '/developers/webhooks']].map(([l, h]) => (
              <li key={h}><a href={h} className="underline decoration-[#B9C9F6] underline-offset-4 hover:decoration-[#2850D8]" style={{ color: C.ink2 }}>{l}</a></li>
            ))}
          </ul>
        </div>
        <pre className="overflow-x-auto rounded-2xl p-5 text-[12.5px] leading-[1.75]" style={{ background: '#0B1220', color: '#D6DEEF' }} aria-label="Example request">
          <code className="font-mono2">{`POST /v1/executions
Idempotency-Key: 6f1c…

{ "run_id":      "run_…",
  "plan_id":     "plan_…",
  "step_id":     "step_…",
  "approval_id": "apr_…" }

→ 202 Accepted
{ "object": "execution", "execution_id": "…", "outcome": "…" }`}</code>
        </pre>
      </div>
    </section>
  )
}

function ClosingCta() {
  return (
    <section className="px-5 py-20 lg:px-8" style={{ background: C.ink }}>
      <div className="mx-auto flex max-w-[1180px] flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
        <div>
          <h2 className="text-[26px] font-semibold leading-[1.2] tracking-[-0.02em] text-white sm:text-[30px]">Bring governed execution to your agents.</h2>
          <p className="mt-2 text-[15px]" style={{ color: '#B7C1D6' }}>Talk to us about early access, deployment models and the connectors you need first.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="/contact" className="rounded-lg bg-white px-5 py-3 text-[14px] font-semibold" style={{ color: C.ink }}>Request access</a>
          <a href="/developers" className="rounded-lg px-5 py-3 text-[14px] font-semibold text-white" style={{ border: '1px solid #3A4357' }}>Read the docs</a>
        </div>
      </div>
    </section>
  )
}

export function Home() {
  return (
    <div className="pt-16">
      <HeroRotator />
      <LogoStrip />
      <HeroB section heading="h2" />
      <Pillars />
      <CatalogueBand />
      <DevelopersBand />
      <ClosingCta />
    </div>
  )
}
