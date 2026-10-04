// Homepage (light theme). Founder direction, 03 Oct 2026: HERO-A and HERO-C alternate in the hero
// every 10 s; HERO-B is the "How it works" section. Every number is derived from the catalogue.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { LIFECYCLE_10, LIFECYCLE_10_DESC } from '../lib/lifecycle'
import { TOTAL_CATALOGUED, PUBLISHED_COUNT, CATEGORY_COUNTS, FEATURED, FEATURED_ROWS } from 'virtual:catalogue-summary'
import { ConnectorLogo } from '../components/ConnectorLogo'
import { HeroA, HeroB, HeroC } from '../components/hero/Heroes'
import { C, SCALE } from '../components/hero/tokens'
import { usePrefersReducedMotion } from '../components/hero/motion'
import { locSearch } from '../hooks/usePathRoute'

const SLIDE_MS = 10_000
const SLIDES = [
  { id: 'a', label: 'Governed connections', Hero: HeroA },
  { id: 'c', label: `${SCALE} connector catalogue`, Hero: HeroC },
] as const

function initialSlide() {
  const s = new URLSearchParams(locSearch()).get('slide')
  return Math.max(0, SLIDES.findIndex((x) => x.id === s))
}

/**
 * Two heroes in one cell, cross-fading every 10 s.
 * - Pauses while keyboard focus is inside it, while it is off-screen or the tab is hidden,
 *   and when the visitor presses Pause (WCAG 2.2.2). Not on hover: the hero fills the
 *   viewport, so a hover pause kept it on one slide for most visitors.
 * - Each slide restarts its own step sequence when it comes in (remount by key);
 *   the hidden slide's sequence is stopped.
 * - Reduced motion: no auto-rotation; the slide buttons still switch.
 */
function HeroRotator() {
  const reduced = usePrefersReducedMotion()
  const [state, setState] = useState(() => ({ index: initialSlide(), runs: [0, 0] }))
  const [userPaused, setUserPaused] = useState(false)
  const [focusIn, setFocusIn] = useState(false)
  const [visible, setVisible] = useState(true)
  const ref = useRef<HTMLElement>(null)
  const auto = !reduced && !new URLSearchParams(locSearch()).has('still')
  const paused = userPaused || focusIn || !visible

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

      <div className="mx-auto px-4 sm:px-8 xl:px-12 2xl:px-16 -mt-6 flex max-w-[1760px] flex-wrap items-center gap-3 pb-10 ">
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

const WRAP = 'mx-auto max-w-[1760px] px-4 sm:px-8 xl:px-12 2xl:px-16'

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: C.blue }}>{children}</p>
}
function H2({ id, children, className = '' }: { id?: string; children: ReactNode; className?: string }) {
  return <h2 id={id} className={`mt-3 text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[36px] ${className}`} style={{ color: C.ink, textWrap: 'balance' }}>{children}</h2>
}
function Lede({ children }: { children: ReactNode }) {
  return <p className="mt-4 max-w-[640px] text-[15.5px] leading-relaxed" style={{ color: C.muted }}>{children}</p>
}
function More({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} className="group mt-6 inline-flex items-center text-[14px] font-semibold" style={{ color: C.blue }}>{children} <span aria-hidden className="ml-1.5 transition-transform group-hover:translate-x-0.5">→</span></a>
}
const card = { background: C.surface, border: `1px solid ${C.line}` }

// §4 · Catalogue: derived stats, the biggest categories and a set of featured connectors
function CatalogueShowcase() {
  const cats = CATEGORY_COUNTS.filter((c) => c.published > 0).sort((a, b) => b.published - a.published)
  const featured = FEATURED.homePreview.map((id) => FEATURED_ROWS[id])
  return (
    <section aria-labelledby="catalogue" className="py-20">
      <div className={WRAP}>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-end">
          <div>
            <Eyebrow>Connector catalogue</Eyebrow>
            <H2 id="catalogue">One interface. Real systems across {cats.length} categories.</H2>
            <Lede>Every connector carries the same manifest, policy hooks and receipt shape. Availability is enabled per connector and per environment as each one passes staging verification, and the catalogue shows where each one stands.</Lede>
          </div>
          <dl className="grid grid-cols-3 gap-3">
            {[{ k: SCALE, v: 'connectors catalogued' }, { k: String(PUBLISHED_COUNT), v: 'published in the catalogue' }, { k: String(cats.length), v: 'categories' }].map((x) => (
              <div key={x.v} className="rounded-2xl p-5" style={card}>
                <dt className="sr-only">{x.v}</dt>
                <dd className="text-[26px] font-semibold tracking-tight tabular-nums sm:text-[32px]" style={{ color: C.ink }}>{x.k}</dd>
                <dd className="mt-1 text-[12.5px] leading-snug" style={{ color: C.muted }}>{x.v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
          {featured.map((c) => (
            <li key={c.id}>
              <a href={`/connectors/${c.id}`} className="flex h-full items-center gap-3 rounded-xl p-3.5 transition-shadow hover:shadow-[0_14px_30px_-20px_rgba(16,24,40,.35)]" style={card}>
                <ConnectorLogo name={c.n} src={c.logo} size={40} />
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-semibold" style={{ color: C.ink }}>{c.n}</span>
                  <span className="block truncate text-[12px]" style={{ color: C.muted }}>{c.cat}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-2" aria-label="Largest categories">
          {cats.slice(0, 12).map((c) => (
            <a key={c.cat} href={`/connectors?cat=${encodeURIComponent(c.cat)}`} className="rounded-full px-3.5 py-1.5 text-[13px] font-medium hover:border-[#B9C9F6]" style={{ ...card, color: C.ink2 }}>
              {c.cat} <span className="tabular-nums" style={{ color: C.muted }}>{c.published}</span>
            </a>
          ))}
          <a href="/connectors" className="rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-white" style={{ background: C.ink }}>Browse all {PUBLISHED_COUNT} →</a>
        </div>
      </div>
    </section>
  )
}

// §5 · Operations Agent Layer: the canonical 10-stage lifecycle (src/lib/lifecycle.ts)
function AgentLayer() {
  return (
    <section aria-labelledby="agents" className="py-20" style={{ background: C.surface, borderBlock: `1px solid ${C.line}` }}>
      <div className={`${WRAP} grid gap-12 xl:grid-cols-[0.8fr_1.2fr]`}>
        <div>
          <Eyebrow>Operations Agent Layer</Eyebrow>
          <H2 id="agents">Agents reason. Connector OS executes.</H2>
          <Lede>Agents plan with declared capabilities. Provider actions run only through the governed execution layer, under policy, with approval where it is required, and with evidence for every step.</Lede>
          <ul className="mt-6 space-y-2.5 text-[14.5px]" style={{ color: C.ink2 }}>
            {['Agents never hold raw provider credentials', 'Reasoning never calls a provider directly', 'Sensitive steps wait for policy and a named approver', 'Every step leaves an evidence record'].map((t) => (
              <li key={t} className="flex gap-2.5"><span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: C.blue }} />{t}</li>
            ))}
          </ul>
          <More href="/agents">Explore the agent layer</More>
        </div>
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-5" aria-label="Agent lifecycle, ten stages">
          {LIFECYCLE_10.map((s, i) => (
            <li key={s} className="min-w-0 rounded-xl p-4" style={{ background: i >= 5 ? C.blueSoft : C.bg, border: `1px solid ${i >= 5 ? C.blueLine : C.line}` }}>
              <span className="font-mono2 text-[11px] font-semibold" style={{ color: i >= 5 ? C.blue : C.muted }}>{String(i + 1).padStart(2, '0')}</span>
              <span className="mt-1 block text-[14px] font-semibold" style={{ color: C.ink }}>{s}</span>
              <span className="mt-1 block text-[12.5px] leading-snug" style={{ color: C.muted }}>{LIFECYCLE_10_DESC[i]}</span>
            </li>
          ))}
        </ol>
      </div>
      <p className={`${WRAP} mt-4 text-right text-[12px]`} style={{ color: C.muted }}>Stages 6–10 (highlighted) are the governed side: authorise, execute, verify, recover, close.</p>
    </section>
  )
}

// §6 · Policies and approval, with an illustrative approval card
function Approvals() {
  const rows: [string, string][] = [['Tool', 'opportunities.update'], ['Operation class', 'Write'], ['Environment', 'Staging'], ['Policy decision', 'Approval required']]
  return (
    <section aria-labelledby="approvals" className="py-20">
      <div className={`${WRAP} grid items-center gap-12 lg:grid-cols-2`}>
        <div>
          <Eyebrow>Policies and human approval</Eyebrow>
          <H2 id="approvals">Sensitive actions wait for policy and a person.</H2>
          <Lede>Policy is evaluated before anything runs. Writes, admin and money-moving actions pause for an approver you name. An approval is bound to one exact plan step, used once, scoped to one tenant, and it expires.</Lede>
          <div className="mt-6 flex flex-wrap gap-2">
            {['Plan-bound', 'Single use', 'Expires', 'Tenant-scoped', 'Revocable', 'Kill switch'].map((t) => (
              <span key={t} className="rounded-full px-3 py-1 text-[12.5px] font-medium" style={{ ...card, color: C.ink2 }}>{t}</span>
            ))}
          </div>
          <More href="/product/policies-approvals">How policies and approvals work</More>
        </div>
        <figure className="rounded-2xl p-6 shadow-[0_30px_60px_-40px_rgba(16,24,40,.45)]" style={card} aria-label="Illustrative approval request">
          <div className="flex items-center justify-between">
            <span className="rounded-full px-2.5 py-1 text-[11.5px] font-semibold" style={{ background: '#FFF4E5', color: '#92400E' }}>Approval required</span>
            <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: C.muted }}>Illustrative</span>
          </div>
          <p className="mt-4 text-[16px] font-semibold" style={{ color: C.ink }}>Agent wants to update a CRM opportunity</p>
          <dl className="mt-4 divide-y" style={{ borderColor: C.line }}>
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-2.5 text-[13.5px]" style={{ borderColor: C.line }}>
                <dt style={{ color: C.muted }}>{k}</dt>
                <dd className={k === 'Tool' ? 'font-mono2 text-[12.5px]' : 'font-medium'} style={{ color: C.ink }}>{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 flex gap-2" aria-hidden>
            <span className="rounded-lg px-4 py-2 text-[13px] font-semibold text-white" style={{ background: C.ink }}>Approve this step</span>
            <span className="rounded-lg px-4 py-2 text-[13px] font-semibold" style={{ ...card, color: C.ink2 }}>Reject</span>
          </div>
          <figcaption className="mt-4 text-[12px]" style={{ color: C.muted }}>The approval covers this one step and expires if unused.</figcaption>
        </figure>
      </div>
    </section>
  )
}

// §7 · Secure execution: the controls, each linked to its security page
const CONTROLS: [string, string, string][] = [
  ['Credential isolation', 'Connections hold a vault reference; agents and browsers never see the secret.', '/security/credential-isolation'],
  ['Tenant boundaries', 'Every connection, policy and receipt belongs to one tenant.', '/security/tenant-boundaries'],
  ['Routing and egress', 'Provider traffic leaves only through controlled, allow-listed routes.', '/security/routing-egress'],
  ['Blast radius', 'A step can reach only scope ∩ policy ∩ approval, nothing wider.', '/security/blast-radius'],
  ['Approval-gated actions', 'Destructive, admin and money-moving steps wait for a person.', '/security/approval-gated-actions'],
  ['Kill controls', 'Stop a connection, agent or tenant at once; restore is recorded.', '/security/kill-controls'],
  ['Webhook security', 'Inbound events are verified and treated as untrusted triggers.', '/security/webhook-security'],
  ['Redaction', 'Secrets and sensitive values stay out of logs and receipts.', '/security/redaction'],
]
function SecureExecution() {
  return (
    <section aria-labelledby="secure" className="py-20" style={{ background: C.surface, borderBlock: `1px solid ${C.line}` }}>
      <div className={WRAP}>
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Eyebrow>Secure execution layer</Eyebrow>
            <H2 id="secure">Real-system access without handing over control.</H2>
            <Lede>Execution runs inside a controlled boundary: credentials stay in the vault, traffic stays on known routes, and sensitive actions stay gated.</Lede>
          </div>
          <a href="/security" className="inline-flex rounded-lg px-5 py-3 text-[14px] font-semibold text-white" style={{ background: C.ink }}>Read the security model →</a>
        </div>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CONTROLS.map(([t, d, h]) => (
            <li key={t}>
              <a href={h} className="group flex h-full flex-col rounded-2xl p-5 transition-shadow hover:shadow-[0_18px_36px_-24px_rgba(16,24,40,.3)]" style={{ ...card, background: C.bg }}>
                <span className="text-[15px] font-semibold" style={{ color: C.ink }}>{t}</span>
                <span className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: C.muted }}>{d}</span>
                <span className="mt-auto pt-3 text-[13px] font-semibold" style={{ color: C.blue }}>Details <span aria-hidden className="inline-block transition-transform group-hover:translate-x-0.5">→</span></span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

// §8 · Receipts: two illustrative chains (success, and a timeout that was reconciled)
type Tone = 'ok' | 'warn' | 'info'
const TONE: Record<Tone, [string, string]> = { ok: ['#E7F6EE', '#065F46'], warn: ['#FFF4E5', '#92400E'], info: ['#EDF2FF', '#1E40AF'] }
function ReceiptCard({ title, rows }: { title: string; rows: [string, string, Tone][] }) {
  return (
    <div className="rounded-2xl p-5" style={card}>
      <p className="text-[13px] font-semibold" style={{ color: C.ink }}>{title}</p>
      <dl className="mt-3 space-y-2">
        {rows.map(([k, v, t]) => (
          <div key={k} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[13px]">
            <dt className="min-w-0" style={{ color: C.muted }}>{k}</dt>
            <dd className="whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold" style={{ background: TONE[t][0], color: TONE[t][1] }}>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
function Receipts() {
  return (
    <section aria-labelledby="receipts" className="py-20">
      <div className={`${WRAP} grid items-center gap-12 lg:grid-cols-2`}>
        <div>
          <Eyebrow>Receipts and outcomes</Eyebrow>
          <H2 id="receipts">Know what happened, with the evidence to show it.</H2>
          <Lede>Each step records what was attempted, which policy decided, whether an approval existed, what the provider returned, how the outcome was checked and every retry. The outcome and the receipt are two separate fields, so a missing receipt is visible, never assumed.</Lede>
          <More href="/receipts">See a receipt chain</More>
        </div>
        <div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <ReceiptCard title="Step completed" rows={[['Policy decision', 'APPROVED', 'ok'], ['Execution', 'SUCCEEDED', 'ok'], ['Verification', 'CONFIRMED', 'ok'], ['Receipt', 'ISSUED', 'ok']]} />
            <ReceiptCard title="Timeout, then reconciled" rows={[['Execution', 'OUTCOME_UNKNOWN', 'warn'], ['Reconciliation', 'EFFECT FOUND', 'info'], ['Run', 'RECOVERED', 'ok'], ['Receipt', 'ISSUED', 'ok']]} />
          </div>
          <p className="mt-3 text-[12px]" style={{ color: C.muted }}>Illustrative chains from the hermetic test suite, not production events.</p>
        </div>
      </div>
    </section>
  )
}

// §9 · Reliability: failure states are explicit
function Reliability() {
  const chain = ['Write sent', 'Provider timeout', 'Outcome unknown', 'Provider state checked', 'Effect found', 'No duplicate retry', 'Run reconciled']
  const states: [string, string][] = [
    ['Rate limited', 'Backs off within the provider\'s limits and records every attempt.'],
    ['Timeout on a write', 'Never blindly retried: the provider is checked first.'],
    ['Outcome unknown', 'A real state, shown to people, until reconciliation settles it.'],
  ]
  return (
    <section aria-labelledby="reliability" className="py-20" style={{ background: C.surface, borderBlock: `1px solid ${C.line}` }}>
      <div className={WRAP}>
        <Eyebrow>Reliability and recovery</Eyebrow>
        <H2 id="reliability">Failures are explicit, never hidden.</H2>
        <Lede>Rate limits, timeouts and unknown outcomes are states with defined behaviour. An ambiguous write is checked against the provider before any retry, so effects are not duplicated.</Lede>
        <ol className="mt-10 flex flex-wrap items-center gap-2" aria-label="Recovery after a timeout">
          {chain.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span className="rounded-full px-3.5 py-1.5 text-[13px] font-medium" style={i === 2 ? { background: '#FFF4E5', color: '#92400E', border: '1px solid #F5D9A8' } : i === chain.length - 1 ? { background: '#E7F6EE', color: '#065F46', border: '1px solid #B7E4CB' } : { ...card, color: C.ink2 }}>{s}</span>
              {i < chain.length - 1 && <span aria-hidden style={{ color: C.muted }}>→</span>}
            </li>
          ))}
        </ol>
        <ul className="mt-8 grid gap-3 md:grid-cols-3">
          {states.map(([t, d]) => (
            <li key={t} className="rounded-2xl p-5" style={{ ...card, background: C.bg }}>
              <span className="text-[15px] font-semibold" style={{ color: C.ink }}>{t}</span>
              <span className="mt-1.5 block text-[13.5px] leading-relaxed" style={{ color: C.muted }}>{d}</span>
            </li>
          ))}
        </ul>
        <More href="/product/reliability-recovery">Reliability and recovery</More>
      </div>
    </section>
  )
}

function DevelopersBand() {
  return (
    <section aria-labelledby="devs" className="py-20">
      <div className={WRAP}>
        <div className="grid gap-8 rounded-3xl p-6 sm:p-10 lg:grid-cols-[1fr_1.1fr]" style={card}>
          <div>
            <Eyebrow>Developers</Eyebrow>
            <H2 id="devs">One contract for every connector.</H2>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: C.muted }}>A typed REST API (contract 1.0.0), MCP tools and webhooks. An execution submits one approved plan step; the approval is consumed once, and a repeated Idempotency-Key replays instead of dispatching twice.</p>
            <ul className="mt-5 grid grid-cols-2 gap-2 text-[14px] font-medium">
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
      </div>
    </section>
  )
}

// §11 · Use cases: each links to its category; the count is derived
const USE_CASES: [string, string, string][] = [
  ['AI agent platforms', 'Give agents governed access to customer systems through one execution layer.', 'AI & Models'],
  ['Developer workflows', 'Issues, pull requests and deployments driven by policy-aware agents.', 'Developer Tools'],
  ['Support automation', 'Resolve tickets end to end, with approval-gated escalations.', 'Support & Success'],
  ['CRM and sales', 'Keep pipelines accurate with approved, receipt-backed writes.', 'CRM & Sales'],
  ['Finance operations', 'Invoices, payouts and reconciliation under strict approval policy.', 'Finance / Accounting / Tax'],
  ['Payments', 'Refunds and payment actions that always wait for a person.', 'Payments / Banking / Fintech'],
  ['Security operations', 'Triage and response with read-first access and kill controls.', 'Security & Identity'],
  ['Data operations', 'Query and sync across databases with read-scoped credentials.', 'Databases & Search'],
  ['Commerce and logistics', 'Orders, shipments and inventory updated with approvals.', 'Commerce / Marketplaces'],
  ['Back-office documents', 'Documents, signatures and records handled with receipts.', 'Documents / E-sign / Forms'],
]
function UseCases() {
  const count = Object.fromEntries(CATEGORY_COUNTS.map((c) => [c.cat, c.published]))
  const rows = USE_CASES.filter(([, , cat]) => count[cat])
  return (
    <section aria-labelledby="usecases" className="py-20" style={{ background: C.surface, borderTop: `1px solid ${C.line}` }}>
      <div className={WRAP}>
        <Eyebrow>Use cases</Eyebrow>
        <H2 id="usecases">Where governed agents go to work.</H2>
        <Lede>Each workflow runs on governed connector access, with approvals where the risk calls for them.</Lede>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          {rows.map(([t, d, cat]) => (
            <li key={t}>
              <a href={`/connectors?cat=${encodeURIComponent(cat)}`} className="group flex h-full flex-col rounded-2xl p-5 transition-shadow hover:shadow-[0_18px_36px_-24px_rgba(16,24,40,.3)]" style={{ ...card, background: C.bg }}>
                <span className="text-[15px] font-semibold" style={{ color: C.ink }}>{t}</span>
                <span className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: C.muted }}>{d}</span>
                <span className="mt-auto pt-4 text-[12.5px] font-medium" style={{ color: C.blue }}>{count[cat]} {cat} connectors <span aria-hidden>→</span></span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function ClosingCta() {
  return (
    <section className="py-20" style={{ background: C.ink }}>
      <div className={`${WRAP} flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center`}>
        <div>
          <h2 className="text-[26px] font-semibold leading-[1.2] tracking-[-0.02em] text-white sm:text-[34px]">Bring governed execution to your agents.</h2>
          <p className="mt-2 text-[15.5px]" style={{ color: '#B7C1D6' }}>Talk to us about early access, deployment models and the connectors you need first.</p>
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
      <CatalogueShowcase />
      <AgentLayer />
      <Approvals />
      <SecureExecution />
      <Receipts />
      <Reliability />
      <DevelopersBand />
      <UseCases />
      <ClosingCta />
    </div>
  )
}
