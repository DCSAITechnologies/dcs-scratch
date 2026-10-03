// Founder review: three homepage hero concepts (HERO-A / HERO-B / HERO-C).
// Served at /preview/hero-a|b|c and /preview/heroes — noindex, disallowed in robots,
// not linked from the site. None of these replaces the live homepage hero until the
// founder selects one (audit/HERO_CONCEPTS.md).
//
// Every number shown is derived from the catalogue at build time
// (virtual:catalogue-summary). Product panels are labelled "Illustrative".
//
// Query flags (for review and screenshots):
//   ?frame=N  hold the motion sequence at step N, transitions off
//   ?still=1  the composed final state (same as reduced motion)
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { TOTAL_CATALOGUED, PUBLISHED_COUNT, CATEGORY_COUNTS, FEATURED, FEATURED_ROWS } from 'virtual:catalogue-summary'
import { ConnectorLogo } from '../../components/ConnectorLogo'

const C = {
  bg: '#F5F6F8', surface: '#FFFFFF', ink: '#0B1220', ink2: '#2B3446', muted: '#566074',
  line: '#E3E7EE', line2: '#D2D8E2', silver: '#5E6779', blue: '#2850D8', blueSoft: '#EDF2FF', blueLine: '#B9C9F6',
}
const SCALE = `${(Math.floor(TOTAL_CATALOGUED / 100) * 100).toLocaleString('en-US')}+`
const NODES = FEATURED.heroNodes.map((id) => FEATURED_ROWS[id])
const STAGES = ['Connect', 'Govern', 'Execute', 'Verify'] as const

// ---------------------------------------------------------------- motion helpers

function readFlags() {
  const q = new URLSearchParams(window.location.search)
  const f = q.get('frame')
  return { frame: f !== null && /^\d+$/.test(f) ? Number(f) : null, still: q.has('still') }
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return reduced
}

/**
 * Steps 0..last on a timer, resting on the last step before starting again.
 * Runs only while the hero is at least 35% on screen and the tab is visible.
 * Reduced motion / ?still → the final step, static. ?frame=N → step N, static.
 */
function useSequence(last: number, stepMs: number, restMs: number) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()
  const [{ frame, still }] = useState(readFlags)
  const fixed = frame !== null ? Math.min(frame, last) : reduced || still ? last : null
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || fixed !== null) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting && !document.hidden), { threshold: 0.35 })
    io.observe(el)
    const onVis = () => setVisible(!document.hidden && el.getBoundingClientRect().top < window.innerHeight)
    document.addEventListener('visibilitychange', onVis)
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', onVis) }
  }, [fixed])

  useEffect(() => {
    if (fixed !== null || !visible) return
    const t = window.setTimeout(() => setStep((s) => (s >= last ? 0 : s + 1)), step === last ? restMs : step === 0 ? 900 : stepMs)
    return () => window.clearTimeout(t)
  }, [fixed, visible, step, last, stepMs, restMs])

  return { ref, step: fixed ?? step, animate: fixed === null }
}

/** Light pointer parallax: sets --px / --py in [-1, 1] on the element. Fine pointers only. */
function useParallax(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !enabled || !window.matchMedia('(pointer: fine)').matches) return
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--px', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3))
      el.style.setProperty('--py', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3))
    }
    const leave = () => { el.style.setProperty('--px', '0'); el.style.setProperty('--py', '0') }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave) }
  }, [enabled])
  return ref
}

const depth = (n: number): CSSProperties => ({
  transform: `translate3d(calc(var(--px, 0) * ${n}px), calc(var(--py, 0) * ${n}px), 0)`,
  transition: 'transform 600ms cubic-bezier(.2,.7,.2,1)',
})

const ease = (on: boolean, ms = 520): CSSProperties => (on ? { transition: `all ${ms}ms cubic-bezier(.2,.7,.2,1)` } : {})

// ---------------------------------------------------------------- shared pieces

function Ctas({ center = false }: { center?: boolean }) {
  return (
    <div className={`flex flex-wrap gap-3 ${center ? 'justify-center' : ''}`}>
      <a href="/contact" className="inline-flex items-center rounded-lg px-5 py-3 text-[14.5px] font-semibold text-white" style={{ background: C.ink }}>Request access</a>
      <a href="/connectors" className="inline-flex items-center rounded-lg px-5 py-3 text-[14.5px] font-semibold" style={{ color: C.ink, border: `1px solid ${C.line2}`, background: C.surface }}>Explore the catalogue <span aria-hidden className="ml-1.5">→</span></a>
    </div>
  )
}

function ScaleLine({ center = false }: { center?: boolean }) {
  return (
    <p className={`text-[13px] ${center ? 'text-center' : ''}`} style={{ color: C.muted }} data-testid="hero-scale">
      <strong style={{ color: C.ink2 }}>{SCALE} connectors catalogued</strong> · {PUBLISHED_COUNT} published · availability is enabled per connector and per environment
    </p>
  )
}

function Illustrative() {
  return <span className="rounded px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-wide" style={{ color: C.muted, background: C.bg, border: `1px solid ${C.line}` }}>Illustrative</span>
}

function Chip({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'blue' | 'ink' }) {
  const s = tone === 'blue' ? { color: C.blue, background: C.blueSoft, border: `1px solid ${C.blueLine}` }
    : tone === 'ink' ? { color: '#fff', background: C.ink2, border: `1px solid ${C.ink2}` }
      : { color: C.ink2, background: C.bg, border: `1px solid ${C.line}` }
  return <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap" style={s}>{children}</span>
}

function Tick({ on }: { on: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden style={{ flexShrink: 0 }}>
      <circle cx="7" cy="7" r="6.25" fill={on ? C.blue : 'none'} stroke={on ? C.blue : C.line2} strokeWidth="1.5" />
      {on && <path d="M4.2 7.2l1.9 1.9 3.8-4" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  )
}

// ---------------------------------------------------------------- HERO-A — control plane canvas

const A_LAST = 4

function HeroA() {
  const { ref, step, animate } = useSequence(A_LAST, 2100, 4200)
  const px = useParallax(animate)
  const stage = Math.max(0, step - 1) // 0..3 once the sequence starts
  const scatter = [[-7, 5], [6, -6], [-3, 7], [8, 3], [-8, -4], [4, 8], [-6, -7], [7, -3], [3, 6]]
  const tiles = [...NODES, null]
  const cards: { k: string; title: string; body: ReactNode }[] = [
    { k: 'connect', title: 'Connection · GitHub', body: (
      <>
        <Row label="Credential" value={<span className="font-mono2">vault ref · cref_••••7f2a</span>} />
        <Row label="Scopes" value="repo:read · issues:write" />
        <Row label="State" value={<Chip tone={step >= 3 ? 'blue' : 'neutral'}>{step >= 3 ? 'Active' : step >= 1 ? 'Configured' : 'Draft'}</Chip>} />
      </>) },
    { k: 'govern', title: 'Policy · writes need approval', body: (
      <>
        <Row label="Action" value={<span className="font-mono2">issues.create</span>} />
        <Row label="Decision" value={<Chip tone={step >= 3 ? 'blue' : 'neutral'}>{step >= 3 ? 'Approved by operator' : 'Awaiting approval'}</Chip>} />
      </>) },
    { k: 'execute', title: 'Execution', body: (
      <>
        <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: C.line }}>
          <div className="h-full rounded-full" style={{ background: C.blue, width: step >= 4 ? '100%' : step >= 3 ? '62%' : '0%', ...ease(animate, 900) }} />
        </div>
        <Row label="Status" value={<Chip tone={step >= 4 ? 'blue' : 'neutral'}>{step >= 4 ? 'Completed' : step >= 3 ? 'Running' : 'Queued'}</Chip>} />
      </>) },
    { k: 'verify', title: 'Receipt', body: (
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
        {['Policy decision', 'Approval', 'Provider response', 'Outcome'].map((f) => (
          <li key={f} className="flex items-center gap-1.5 text-[11.5px]" style={{ color: C.ink2 }}><Tick on={step >= 4} />{f}</li>
        ))}
      </ul>) },
  ]

  return (
    <section className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 pb-20 pt-14 lg:grid-cols-[0.95fr_1.05fr] lg:pt-20 lg:px-8">
      <div className="min-w-0">
        <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: C.blue }}>Connector OS</p>
        <h1 className="mt-4 text-[40px] font-semibold leading-[1.06] tracking-[-0.025em] sm:text-[52px]" style={{ color: C.ink }}>Governed connections for every agent action.</h1>
        <p className="mt-5 max-w-[540px] text-[17px] leading-relaxed" style={{ color: C.muted }}>
          Connector OS connects agents to the systems your business runs on, applies policy and approval before anything executes, and keeps an evidence record of every action.
        </p>
        <ol className="mt-7 flex flex-wrap gap-2" aria-label="How it works">
          {STAGES.map((s, i) => (
            <li key={s} className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-medium"
              style={{ ...ease(animate), color: step >= 1 && stage === i ? C.blue : C.ink2, background: step >= 1 && stage === i ? C.blueSoft : C.surface, border: `1px solid ${step >= 1 && stage === i ? C.blueLine : C.line}` }}>
              <span className="text-[11px] tabular-nums" style={{ color: C.silver }}>0{i + 1}</span>{s}
            </li>
          ))}
        </ol>
        <div className="mt-8"><Ctas /></div>
        <div className="mt-6"><ScaleLine /></div>
      </div>

      <div ref={px} className="min-w-0">
        <div ref={ref} role="img" aria-label="Illustration: a GitHub connection is configured with a vault reference, a policy holds a write for approval, the approved action executes, and a receipt records the policy decision, approval, provider response and outcome."
          className="relative rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: '0 1px 2px rgba(16,24,40,.04), 0 24px 48px -24px rgba(16,24,40,.18)', ...depth(4) }}>
          <div aria-hidden className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: C.line }}>
            <div className="flex min-w-0 items-center gap-2 text-[12px]" style={{ color: C.muted }}>
              <Chip>Environment: staging</Chip><span className="truncate">Connections / github</span>
            </div>
            <Illustrative />
          </div>
          <div aria-hidden className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-[auto_1fr] sm:gap-7 sm:p-6">
            {/* phones: one compact row — the chosen connector first */}
            <div className="flex items-center gap-2 sm:hidden">
              {NODES.slice(0, 5).map((t, i) => (
                <span key={t.id} className="rounded-xl p-1" style={{ border: `1px solid ${i === 0 && step >= 1 ? C.blue : C.line}`, opacity: step >= 1 && i > 0 ? 0.5 : 1, filter: step >= 1 && i > 0 ? 'grayscale(1)' : 'none', ...ease(animate) }}>
                  <ConnectorLogo name={t.n} src={t.logo} size={28} />
                </span>
              ))}
              <span className="text-[11px] font-semibold" style={{ color: C.muted }}>{SCALE}</span>
            </div>
            <div className="relative hidden sm:block">
              <div className="grid grid-cols-3 gap-2.5" style={depth(-3)}>
                {tiles.map((t, i) => {
                  const selected = i === 0 && step >= 1
                  const settled = step >= 1
                  return (
                    <div key={t?.id ?? 'more'} className="flex h-[50px] w-[50px] items-center justify-center rounded-xl sm:h-[58px] sm:w-[58px]"
                      style={{
                        ...ease(animate, 700), transitionDelay: animate ? `${i * 40}ms` : undefined,
                        background: C.surface, border: `1px solid ${selected ? C.blue : C.line}`,
                        boxShadow: selected ? `0 0 0 3px ${C.blueSoft}, 0 8px 20px -10px rgba(40,80,216,.45)` : '0 1px 2px rgba(16,24,40,.05)',
                        transform: settled ? (selected ? 'translateY(-2px)' : 'none') : `translate(${scatter[i][0]}px, ${scatter[i][1]}px)`,
                        opacity: settled && !selected && t ? 0.5 : 1, filter: settled && !selected && t ? 'grayscale(1)' : 'none',
                      }}>
                      {t ? <ConnectorLogo name={t.n} src={t.logo} size={32} /> : <span className="text-[11px] font-semibold" style={{ color: C.muted }}>{SCALE}</span>}
                    </div>
                  )
                })}
              </div>
              {/* link from the selected tile to the lifecycle rail */}
              <div className="absolute left-full top-[25px] h-px origin-left sm:top-[29px]" style={{ width: 28, background: C.blue, transform: `scaleX(${step >= 1 ? 1 : 0})`, ...ease(animate, 500) }} />
            </div>
            <div className="relative min-w-0 pl-5" style={depth(2)}>
              <div className="absolute bottom-3 left-[5px] top-3 w-px" style={{ background: C.line }} />
              <div className="absolute left-[5px] top-3 w-px origin-top" style={{ background: C.blue, height: 'calc(100% - 24px)', transform: `scaleY(${step === 0 ? 0 : step / A_LAST})`, ...ease(animate, 700) }} />
              <div className="flex flex-col gap-2.5">
                {cards.map((c, i) => {
                  const reached = step >= i + 1
                  const active = step === i + 1
                  return (
                    <div key={c.k} className="relative rounded-xl px-3.5 py-3"
                      style={{ ...ease(animate), background: C.surface, border: `1px solid ${active ? C.blueLine : C.line}`, boxShadow: active ? '0 10px 24px -14px rgba(40,80,216,.35)' : 'none', opacity: reached ? 1 : 0.42, transform: reached ? 'none' : 'translateY(4px)' }}>
                      <span className="absolute -left-[20px] top-4 h-[11px] w-[11px] rounded-full" style={{ background: reached ? C.blue : C.surface, border: `2px solid ${reached ? C.blue : C.line2}`, ...ease(animate) }} />
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-[12.5px] font-semibold" style={{ color: C.ink }}>{c.title}</span>
                        <span className="text-[10.5px] font-medium uppercase tracking-wide" style={{ color: reached ? C.blue : C.silver }}>{STAGES[i]}</span>
                      </div>
                      <div className="flex flex-col gap-1.5">{c.body}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[11.5px]">
      <span style={{ color: C.muted }}>{label}</span>
      <span className="truncate text-right" style={{ color: C.ink2 }}>{value}</span>
    </div>
  )
}

// ---------------------------------------------------------------- HERO-B — four-stage ledger

const B_LAST = 4

function HeroB() {
  const { ref, step, animate } = useSequence(B_LAST, 2000, 4200)
  const px = useParallax(animate)
  const active = step - 1 // -1 before the sequence starts
  const cards: { title: string; line: string; body: ReactNode }[] = [
    { title: 'Connect', line: 'A provider account, held as a vault reference.', body: (
      <div className="flex flex-col gap-2">
        <div className="flex -space-x-1.5">{NODES.slice(0, 4).map((n) => <span key={n.id} className="rounded-lg" style={{ boxShadow: `0 0 0 2px ${C.surface}` }}><ConnectorLogo name={n.n} src={n.logo} size={28} /></span>)}</div>
        <span className="font-mono2 text-[11px]" style={{ color: C.muted }}>credential → cref_••••7f2a</span>
      </div>) },
    { title: 'Govern', line: 'Policy decides; people approve what policy holds.', body: (
      <div className="flex flex-col gap-1.5 font-mono2 text-[11px]" style={{ color: C.ink2 }}>
        <span><span style={{ color: C.muted }}>when</span> action.writes</span>
        <span><span style={{ color: C.muted }}>require</span> approval(operator)</span>
        <span className="mt-1"><Chip tone={step >= 3 ? 'blue' : 'neutral'}>{step >= 3 ? 'Approved' : 'Held for approval'}</Chip></span>
      </div>) },
    { title: 'Execute', line: 'Runs once, through the execution layer.', body: (
      <ul className="flex flex-col gap-1 text-[11px]" style={{ color: C.ink2 }}>
        {[['requested', 1], ['approved', 3], ['executed', 3]].map(([l, at]) => (
          <li key={l as string} className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5"><Tick on={step >= (at as number)} />{l}</span><span className="font-mono2 tabular-nums" style={{ color: C.silver }}>10:42</span></li>
        ))}
      </ul>) },
    { title: 'Verify', line: 'A receipt records what happened, and why.', body: (
      <div className="rounded-lg p-2.5" style={{ background: C.bg, border: `1px dashed ${C.line2}` }}>
        <div className="flex items-center justify-between text-[11px]"><span className="font-mono2" style={{ color: C.ink2 }}>rcpt_••••91c0</span><Chip tone={step >= 4 ? 'blue' : 'neutral'}>{step >= 4 ? 'Recorded' : 'Pending'}</Chip></div>
        <div className="mt-1.5 text-[10.5px]" style={{ color: C.muted }}>decision · approval · provider response · outcome</div>
      </div>) },
  ]

  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-16 lg:px-8 lg:pt-24">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[520px]" style={{ background: `linear-gradient(180deg, ${C.surface} 0%, ${C.bg} 100%)` }} />
      <div className="relative mx-auto max-w-[1180px]">
        <div className="mx-auto max-w-[820px] text-center">
          <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: C.blue }}>Connector OS</p>
          <h1 className="mt-4 text-[40px] font-semibold leading-[1.06] tracking-[-0.025em] sm:text-[56px]" style={{ color: C.ink }}>
            Connect. Govern.<br className="hidden sm:block" /> Execute. Verify.
          </h1>
          <p className="mx-auto mt-5 max-w-[640px] text-[17px] leading-relaxed" style={{ color: C.muted }}>
            One governed path from an agent’s intent to a recorded outcome — policy, approval and an evidence record on every action, across {SCALE} catalogued connectors.
          </p>
          <div className="mt-8"><Ctas center /></div>
        </div>

        <div ref={px} className="mt-12">
          <div aria-hidden className="mb-1 flex justify-end"><Illustrative /></div>
          <div ref={ref} role="img" aria-label="Illustration of four stages: connect a provider account as a vault reference, a policy holds a write for approval, the approved action executes, and a receipt records the outcome."
            className="relative" style={{ perspective: 1400 }}>
            {/* progress track: horizontal on desktop, vertical on phones */}
            <div aria-hidden className="absolute left-[12.5%] right-[12.5%] top-[27px] hidden h-px md:block" style={{ background: C.line2 }}>
              <div className="h-full origin-left" style={{ background: C.blue, transform: `scaleX(${active <= 0 ? 0 : active / 3})`, ...ease(animate, 800) }} />
            </div>
            <div aria-hidden className="absolute bottom-6 left-[15px] top-[22px] w-px md:hidden" style={{ background: C.line2 }}>
              <div className="w-full origin-top" style={{ height: '100%', background: C.blue, transform: `scaleY(${active <= 0 ? 0 : active / 3})`, ...ease(animate, 800) }} />
            </div>
            <div aria-hidden className="relative grid gap-4 pl-9 md:grid-cols-4 md:pl-0"
              style={{ transform: 'rotateX(calc(var(--py, 0) * -1.5deg)) rotateY(calc(var(--px, 0) * 1.5deg))', transition: 'transform 600ms cubic-bezier(.2,.7,.2,1)' }}>
              {cards.map((c, i) => {
                const on = i === active
                const done = i <= active
                return (
                  <div key={c.title} className="relative">
                    <span className="absolute -left-[26px] top-[16px] h-[11px] w-[11px] rounded-full md:hidden" style={{ background: done ? C.blue : C.surface, border: `2px solid ${done ? C.blue : C.line2}` }} />
                    <div className="mx-auto mb-3 hidden h-[11px] w-[11px] rounded-full md:block" style={{ marginTop: 22, background: done ? C.blue : C.surface, border: `2px solid ${done ? C.blue : C.line2}`, ...ease(animate) }} />
                    <div className="rounded-2xl p-4"
                      style={{ ...ease(animate, 600), background: C.surface, border: `1px solid ${on ? C.blueLine : C.line}`, transform: on ? 'translateY(-6px)' : 'none',
                        boxShadow: on ? '0 22px 40px -22px rgba(40,80,216,.40), 0 1px 2px rgba(16,24,40,.05)' : '0 1px 2px rgba(16,24,40,.05)', opacity: active < 0 || done ? 1 : 0.62 }}>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[15px] font-semibold" style={{ color: C.ink }}>{c.title}</span>
                        <span className="text-[11px] tabular-nums" style={{ color: C.silver }}>0{i + 1}</span>
                      </div>
                      <p className="mt-1 text-[12.5px] leading-snug" style={{ color: C.muted }}>{c.line}</p>
                      <div className="mt-3.5">{c.body}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="flex flex-wrap justify-center gap-2.5" aria-hidden>
            {NODES.map((n) => <span key={n.id} style={{ filter: 'grayscale(1)', opacity: 0.75 }}><ConnectorLogo name={n.n} src={n.logo} size={30} /></span>)}
          </div>
          <ScaleLine center />
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- HERO-C — catalogue field + operator controls

const C_LAST = 3
const COLS = 44
const CELL = 10

type Dot = { cat: string; published: boolean }
const DOTS: Dot[] = CATEGORY_COUNTS.flatMap((c) => [
  ...Array.from({ length: c.published }, () => ({ cat: c.cat, published: true })),
  ...Array.from({ length: c.held }, () => ({ cat: c.cat, published: false })),
])
const FOCUS_CAT = CATEGORY_COUNTS.some((c) => c.cat === 'Developer Tools') ? 'Developer Tools' : CATEGORY_COUNTS[0]?.cat
const FOCUS = CATEGORY_COUNTS.find((c) => c.cat === FOCUS_CAT)
// deterministic interleave for the "unsorted catalogue" layout
const SHUFFLED = DOTS.map((_, i) => i).sort((a, b) => ((a * 7919) % 1013) - ((b * 7919) % 1013))
const UNSORTED_POS = new Map(SHUFFLED.map((dotIndex, slot) => [dotIndex, slot]))
// grouped layout: categories in sequence, one empty cell between groups
const GROUPED_POS = (() => {
  const pos = new Map<number, number>()
  let slot = 0
  DOTS.forEach((d, i) => {
    if (i > 0 && DOTS[i - 1].cat !== d.cat) slot += 1
    pos.set(i, slot++)
  })
  return { pos, slots: slot }
})()
const ROWS = Math.ceil(Math.max(GROUPED_POS.slots, DOTS.length) / COLS)

function HeroC() {
  const { ref, step, animate } = useSequence(C_LAST, 2300, 5200)
  const px = useParallax(animate)
  const grouped = step >= 1
  const focus = step >= 2

  return (
    <section className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 pb-20 pt-14 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:pt-20">
      <div className="min-w-0">
        <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: C.blue }}>Connector OS</p>
        <h1 className="mt-4 text-[40px] font-semibold leading-[1.06] tracking-[-0.025em] sm:text-[52px]" style={{ color: C.ink }}>
          One control plane for {SCALE} connectors.
        </h1>
        <p className="mt-5 max-w-[520px] text-[17px] leading-relaxed" style={{ color: C.muted }}>
          Catalogue, connections, policy, approvals, executions and receipts — operated from one console, and enabled per connector and per environment.
        </p>
        <div className="mt-8"><Ctas /></div>
        <ul className="mt-8 grid max-w-[520px] grid-cols-2 gap-x-6 gap-y-2 text-[13.5px]" style={{ color: C.ink2 }}>
          {['Connect through vault references', 'Policy and approval before execution', 'Kill switch and environment controls', 'A receipt for every action'].map((t) => (
            <li key={t} className="flex items-start gap-2"><span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: C.blue }} />{t}</li>
          ))}
        </ul>
      </div>

      <div ref={px} className="min-w-0">
        <div ref={ref} role="img" aria-label={`Illustration: one square per catalogued connector (${DOTS.length}), grouped by category, with ${FOCUS_CAT} highlighted, and an operator panel with environment, approvals, kill switch and receipts.`}
          className="relative rounded-2xl p-5 sm:p-6" style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: '0 1px 2px rgba(16,24,40,.04), 0 24px 48px -24px rgba(16,24,40,.16)' }}>
          <div aria-hidden className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3 text-[11.5px]" style={{ color: C.muted }}>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-[2px]" style={{ background: C.ink2 }} />published</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-[2px]" style={{ background: C.line2 }} />held for review</span>
            </div>
            <span className="text-[11.5px] font-medium" style={{ color: focus ? C.blue : C.muted, ...ease(animate) }}>
              {focus && FOCUS ? `${FOCUS_CAT} · ${FOCUS.published} published` : grouped ? `${CATEGORY_COUNTS.length} categories` : `${DOTS.length.toLocaleString('en-US')} catalogued`}
            </span>
          </div>
          <div aria-hidden style={depth(-3)}>
            <svg viewBox={`0 0 ${COLS * CELL} ${ROWS * CELL}`} className="block h-auto w-full">
              {DOTS.map((d, i) => {
                const slot = grouped ? GROUPED_POS.pos.get(i)! : UNSORTED_POS.get(i)!
                const x = (slot % COLS) * CELL, y = Math.floor(slot / COLS) * CELL
                const inFocus = d.cat === FOCUS_CAT
                const fill = !grouped ? '#B8C0CD' : focus && inFocus ? (d.published ? C.blue : C.blueLine) : d.published ? C.ink2 : C.line2
                return (
                  <rect key={i} width={CELL - 3} height={CELL - 3} rx="1.5" fill={fill}
                    style={{ transform: `translate(${x}px, ${y}px)`, opacity: focus && !inFocus ? 0.28 : 1,
                      transition: animate ? `transform 900ms cubic-bezier(.2,.7,.2,1) ${(i % 29) * 11}ms, fill 500ms, opacity 500ms` : undefined }} />
                )
              })}
            </svg>
          </div>

          {/* operator panel */}
          <div aria-hidden className="relative mt-4 rounded-xl p-4 lg:absolute lg:-bottom-8 lg:-right-6 lg:mt-0 lg:w-[300px]"
            style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: '0 24px 50px -20px rgba(16,24,40,.28)',
              opacity: step >= 3 ? 1 : 0, transform: step >= 3 ? 'none' : 'translateY(12px)', ...ease(animate, 600), ...(step >= 3 ? {} : { pointerEvents: 'none' as const }) }}>
            <div style={depth(5)}>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[12.5px] font-semibold" style={{ color: C.ink }}>Operator controls</span>
                <Illustrative />
              </div>
              <div className="mb-3 inline-flex rounded-lg p-0.5 text-[11.5px] font-medium" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
                <span className="rounded-md px-2.5 py-1" style={{ background: C.surface, color: C.ink, boxShadow: '0 1px 2px rgba(16,24,40,.08)' }}>Staging</span>
                <span className="px-2.5 py-1" style={{ color: C.silver }}>Production · locked</span>
              </div>
              <div className="flex flex-col gap-2">
                <Row label="Approvals" value={<Chip tone="blue">2 awaiting review</Chip>} />
                <Row label="Kill switch" value={<Chip>Armed · per connection</Chip>} />
                <Row label="Receipts" value="Recorded for every action" />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 lg:mt-14"><ScaleLine /></div>
      </div>
    </section>
  )
}

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
        Concept preview for founder review — not the live homepage ·{' '}
        {CONCEPTS.map((c, i) => (
          <span key={c.id}>{i > 0 && ' · '}<a href={`/preview/hero-${c.id}`} aria-current={current === c.id ? 'page' : undefined} className={current === c.id ? 'font-semibold underline' : 'underline decoration-[#6B7385] underline-offset-2'}>HERO-{c.id.toUpperCase()}</a></span>
        ))}
        {' · '}<a href="/preview/heroes" className={current === 'all' ? 'font-semibold underline' : 'underline decoration-[#6B7385] underline-offset-2'}>All</a>
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
