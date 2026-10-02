import { useEffect, useMemo, useRef, useState } from 'react'
import { PUBLISHED_CONNECTORS as CONNECTORS, LEGACY_REFERENCE_SURFACES, TOTAL_CATALOGUED, PUBLISHED_COUNT, UNPUBLISHED_COUNT, CATEGORIES, STATUSES, AUTH_TYPES, RUNTIME_STATUSES, statusColor, runtimeStatusLabel, type Conn } from '../lib/data'
import { ConnectorLogo } from '../components/ConnectorLogo'

const PAGE = 60
const LEGACY_PAGE = 12

// Legacy rows that keep a public route (shells are prerendered only for these two behaviors)
const LEGACY_GRID = LEGACY_REFERENCE_SURFACES.filter(
  (c) => c.lane6_behavior === 'PRESERVE_REFERENCE_SURFACE' || c.lane6_behavior === 'REDIRECT'
)

// Custom dark dropdown — native <select> renders OS-styled (white) panels
function FilterSelect({ value, onChange, options, width = 150, ariaLabel }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  width?: number
  ariaLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  const current = options.find((o) => o.value === value) ?? options[0]
  return (
    <div ref={ref} className="relative" style={{ width }}>
      <button type="button" aria-label={ariaLabel} onClick={() => setOpen(!open)}
        className="dcs-input !py-1.5 !px-3 text-[12px] w-full flex items-center justify-between gap-2 text-left">
        <span className={`truncate ${value ? 'text-white' : 'text-[#93A0C2]'}`}>{current.label}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M1 1l4 4 4-4" stroke="#93A0C2" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-40 mt-1.5 w-full max-h-[260px] overflow-auto rounded-xl p-1.5"
          style={{ background: 'rgba(13,17,34,0.97)', border: '1px solid rgba(120,140,255,0.22)', boxShadow: '0 16px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)' }}>
          {options.map((o) => (
            <button key={o.value} type="button"
              onClick={() => { onChange(o.value); setOpen(false) }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-[12px] transition-colors"
              style={{
                color: o.value === value ? '#fff' : '#A9B6D3',
                background: o.value === value ? 'rgba(108,99,255,0.18)' : 'transparent',
              }}
              onMouseEnter={(e) => { if (o.value !== value) e.currentTarget.style.background = 'rgba(120,140,255,0.10)' }}
              onMouseLeave={(e) => { if (o.value !== value) e.currentTarget.style.background = 'transparent' }}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const matchesQuery = (c: Conn, q: string) => {
  const n = q.trim().toLowerCase()
  return !n || c.n.toLowerCase().includes(n) || c.p.toLowerCase().includes(n) || c.id.includes(n)
}

export function Connectors() {
  // ?q= and ?cat= deep links (used by the nav category menu and shared searches)
  const params = new URLSearchParams(window.location.search)
  const [q, setQ] = useState(params.get('q') ?? '')
  const [cat, setCat] = useState(CATEGORIES.includes(params.get('cat') ?? '') ? params.get('cat')! : 'All')
  const [status, setStatus] = useState('')
  const [runtime, setRuntime] = useState('')
  const [auth, setAuth] = useState('')
  const [rw, setRw] = useState('')
  const [wh, setWh] = useState(false)
  const [sort, setSort] = useState<'rank' | 'az'>('rank')
  const [shown, setShown] = useState(PAGE)
  const [legacyShown, setLegacyShown] = useState(LEGACY_PAGE)

  const filtered = useMemo(() => {
    let list = CONNECTORS.filter((c) =>
      (cat === 'All' || c.cat === cat) &&
      (!status || c.s === status) &&
      (!runtime || runtimeStatusLabel(c) === runtime) &&
      (!auth || c.auth === auth) &&
      (!rw || (rw === 'Read only' ? c.rw === 'read' : c.rw.includes('write'))) &&
      (!wh || c.wh) &&
      matchesQuery(c, q)
    )
    list = sort === 'rank' ? list.sort((a, b) => a.r - b.r) : list.sort((a, b) => a.n.localeCompare(b.n))
    return list
  }, [q, cat, status, runtime, auth, rw, wh, sort])

  // Legacy reference surfaces match the same filters but stay out of the canonical count
  const filteredLegacy = useMemo(() => {
    // legacy rows carry no runtime status, so a runtime filter excludes them all
    if (runtime) return []
    let list = LEGACY_GRID.filter((c) =>
      (cat === 'All' || c.cat === cat) &&
      (!status || c.s === status) &&
      (!auth || c.auth === auth) &&
      (!rw || (rw === 'Read only' ? c.rw === 'read' : c.rw.includes('write'))) &&
      (!wh || c.wh) &&
      matchesQuery(c, q)
    )
    list = sort === 'rank' ? list.sort((a, b) => a.r - b.r) : list.sort((a, b) => a.n.localeCompare(b.n))
    return list
  }, [q, cat, status, runtime, auth, rw, wh, sort])

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <div className="eyebrow mb-3">Connector catalogue</div>
        <h1 className="text-4xl font-semibold tracking-tight text-white">{PUBLISHED_COUNT} published connectors. One governed interface.</h1>
        <p className="mt-2 text-[12.5px] text-[#93A0C2]" data-testid="catalogue-counts">
          {TOTAL_CATALOGUED} records in the canonical catalogue · {PUBLISHED_COUNT} published · {UNPUBLISHED_COUNT} on hold (not listed pending policy, legal or provider review)
        </p>
        <p className="mt-3 max-w-2xl text-[14px] text-[#A9B6D3]">
          Every connector documents capabilities, authentication, permissions, webhooks and official documentation — from official provider sources, with verification status shown per connector. Catalogue status describes documentation and access model; runtime verification is published per connector as it is earned.
        </p>

        {/* Legend: catalogue status (6) vs runtime status (3) — two independent fields, never merged.
             This legend is static copy by design: it does NOT change with the claim level. */}
        <div className="mt-5 glass-panel px-4 py-3 text-[11.5px] leading-snug text-[#93A0C2] max-w-3xl">
          <div><span className="font-semibold text-[#D6E1FF]">Catalogue status</span> — Coming Soon · Provider Approval Required · Preview · Read Only · Limited Access · Available — documentation &amp; access model. HOLD records are not listed; Available is earned only after staging verification (none today).</div>
          <div className="mt-1"><span className="font-semibold text-[#D6E1FF]">Runtime status</span> — Not yet runtime-verified · Staging-verified · Production-verified — earned runtime proof, tracked independently.</div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          <input value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE) }} placeholder="Search connectors or providers…" aria-label="Search connectors" className="dcs-input w-full sm:w-[260px]" />
          <FilterSelect ariaLabel="Catalogue status filter" width={170} value={status}
            onChange={(v) => { setStatus(v); setShown(PAGE) }}
            options={[{ value: '', label: 'All statuses' }, ...STATUSES.map((s) => ({ value: s, label: s }))]} />
          <FilterSelect ariaLabel="Runtime status filter" width={190} value={runtime}
            onChange={(v) => { setRuntime(v); setShown(PAGE) }}
            options={[{ value: '', label: 'All runtime statuses' }, ...RUNTIME_STATUSES.map((s) => ({ value: s, label: s }))]} />
          <FilterSelect width={160} value={auth}
            onChange={(v) => { setAuth(v); setShown(PAGE) }}
            options={[{ value: '', label: 'All auth types' }, ...AUTH_TYPES.map((a) => ({ value: a, label: a }))]} />
          <FilterSelect width={150} value={rw}
            onChange={(v) => { setRw(v); setShown(PAGE) }}
            options={[{ value: '', label: 'Read + Write' }, { value: 'Read only', label: 'Read only' }, { value: 'write', label: 'Supports write' }]} />
          <label className="flex items-center gap-2 text-[12.5px] text-[#A9B6D3] cursor-pointer">
            <input type="checkbox" checked={wh} onChange={(e) => { setWh(e.target.checked); setShown(PAGE) }} className="accent-[#6C63FF]" /> Webhooks
          </label>
          <FilterSelect width={130} value={sort}
            onChange={(v) => setSort(v as 'rank' | 'az')}
            options={[{ value: 'rank', label: 'Sort: rank' }, { value: 'az', label: 'Sort: A–Z' }]} />
          <span className="ml-auto text-[12px] text-[#93A0C2]" data-testid="result-count">{filtered.length} connectors</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => { setCat(c); setShown(PAGE) }} className={`chip ${cat === c ? 'active' : ''}`}>{c}</button>
          ))}
        </div>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.slice(0, shown).map((c: Conn) => (
            <a key={c.id} href={`/connectors/${c.id}`} className="glass-card glass-card-hover p-5 flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <ConnectorLogo name={c.n} src={c.logo} size={38} />
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold text-white truncate">{c.n}</div>
                  <div className="text-[11px] text-[#93A0C2] truncate">{c.p}</div>
                </div>
                <span className="ml-auto text-[10px] font-bold text-[#5A7BFF]">#{c.r}</span>
              </div>
              <p className="text-[12px] leading-relaxed text-[#A9B6D3] line-clamp-2 flex-1">{c.d}</p>
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color: statusColor(c.s), background: `${statusColor(c.s)}1f`, border: `1px solid ${statusColor(c.s)}44` }}>{c.s}</span>
                {c.runtime_status && c.runtime_status !== 'not_verified' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full text-[#93A0C2]" style={{ background: 'rgba(120,140,255,0.08)', border: '1px solid rgba(120,140,255,0.25)' }}>{runtimeStatusLabel(c)}</span>
                )}
                <span className="text-[10px] px-2 py-0.5 rounded-full text-[#A9B6D3]" style={{ background: 'rgba(120,140,255,0.08)', border: '1px solid rgba(120,140,255,0.18)' }}>{c.auth}</span>
                {c.wh && <span className="text-[10px] px-2 py-0.5 rounded-full text-[#00C2FF]" style={{ background: 'rgba(0,194,255,0.08)', border: '1px solid rgba(0,194,255,0.25)' }}>Webhooks</span>}
                <span className="ml-auto text-[11px] font-semibold text-[#5A7BFF]">Details →</span>
              </div>
            </a>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="glass-panel p-6 text-center" data-testid="no-canonical-match">
            <p className="text-[13.5px] text-[#D6E1FF]">No published canonical connector matches these filters.</p>
            <p className="mt-1.5 text-[12px] text-[#93A0C2]">
              {filteredLegacy.length > 0
                ? `${filteredLegacy.length} legacy reference ${filteredLegacy.length === 1 ? 'surface matches' : 'surfaces match'} below. Reference surfaces are not canonical connectors and carry no runtime status.`
                : 'Try a different search or clear the filters.'}
            </p>
          </div>
        )}

        {shown < filtered.length && (
          <div className="mt-10 text-center">
            <button onClick={() => setShown(shown + PAGE)} className="cta-secondary">Load more ({filtered.length - shown} remaining)</button>
          </div>
        )}

        {filteredLegacy.length > 0 && (
          <div className="mt-14">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h2 className="text-xl font-semibold tracking-tight text-white">Legacy reference surfaces</h2>
              <span className="text-[11.5px] text-[#93A0C2]">{filteredLegacy.length} preserved from the previous catalogue — reference only, not part of the canonical catalogue or any count above</span>
            </div>
            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredLegacy.slice(0, legacyShown).map((c: Conn) => (
                <a key={`legacy-${c.id}`} href={`/connectors/${c.id}`} className="glass-card glass-card-hover p-5 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <ConnectorLogo name={c.n} src={c.logo} size={38} />
                    <div className="min-w-0">
                      <div className="text-[14px] font-semibold text-white truncate">{c.n}</div>
                      <div className="text-[11px] text-[#93A0C2] truncate">{c.p}</div>
                    </div>
                  </div>
                  <p className="text-[12px] leading-relaxed text-[#A9B6D3] line-clamp-2 flex-1">{c.d}</p>
                  <div className="mt-4 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-[#FFB224]" style={{ background: 'rgba(255,178,36,0.08)', border: '1px solid rgba(255,178,36,0.3)' }}>Reference</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full text-[#A9B6D3]" style={{ background: 'rgba(120,140,255,0.08)', border: '1px solid rgba(120,140,255,0.18)' }}>{c.cat}</span>
                    <span className="ml-auto text-[11px] font-semibold text-[#5A7BFF]">Details →</span>
                  </div>
                </a>
              ))}
            </div>
            {legacyShown < filteredLegacy.length && (
              <div className="mt-8 text-center">
                <button onClick={() => setLegacyShown(legacyShown + LEGACY_PAGE * 4)} className="cta-secondary">Load more reference surfaces ({filteredLegacy.length - legacyShown} remaining)</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
