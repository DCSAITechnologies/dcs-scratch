import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { PUBLISHED_CONNECTORS as CONNECTORS, LEGACY_REFERENCE_SURFACES, TOTAL_CATALOGUED, PUBLISHED_COUNT, UNPUBLISHED_COUNT, AVAILABLE_TO_CONNECT_COUNT, CORE_HEAD, byRank, CATEGORIES, STATUSES, AUTH_TYPES, RUNTIME_STATUSES, statusColor, runtimeStatusLabel, type Conn } from '../lib/data'
import { ConnectorLogo } from '../components/ConnectorLogo'
import { locSearch } from '../hooks/usePathRoute'
import POPULAR from '../lib/popular.json'

const PAGE = 60
const LEGACY_PAGE = 12

// Legacy rows that keep a public route (shells are prerendered only for these two behaviors)
const LEGACY_GRID = LEGACY_REFERENCE_SURFACES.filter(
  (c) => c.lane6_behavior === 'PRESERVE_REFERENCE_SURFACE' || c.lane6_behavior === 'REDIRECT'
)
// Founder curation (src/lib/popular.json): the everyday connectors, and the AI model leaders.
// Many of them (OpenAI, Anthropic, Salesforce, Shopify …) are reference pages until core lists them.
const REF_IDS = new Set(LEGACY_GRID.map((c) => c.id))
const byId = (id: string) => CONNECTORS.find((c) => c.id === id) ?? LEGACY_GRID.find((c) => c.id === id)
const AI_LEADERS = POPULAR.aiLeaders.map(byId).filter((c): c is Conn => Boolean(c) && REF_IDS.has(c!.id))
const POPULAR_REFS = new Set(POPULAR.popular.filter((id) => REF_IDS.has(id)))
const isRef = (c: Conn) => REF_IDS.has(c.id)
const TABS = ['Popular', ...CATEGORIES]

// Custom dark dropdown — native <select> renders OS-styled (white) panels.
// Listbox pattern: button (aria-haspopup/expanded) + listbox of options;
// ArrowUp/Down/Home/End move, Enter/Space select, Escape/Tab/outside click close.
function FilterSelect({ value, onChange, options, width = 150, ariaLabel }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  width?: number
  ariaLabel: string
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listId = useId()
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    listRef.current?.focus()
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  const current = options.find((o) => o.value === value) ?? options[0]
  const openList = () => { setActive(Math.max(0, options.findIndex((o) => o.value === value))); setOpen(true) }
  const choose = (i: number) => { onChange(options[i].value); setOpen(false); buttonRef.current?.focus() }
  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, options.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0) }
    else if (e.key === 'End') { e.preventDefault(); setActive(options.length - 1) }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active) }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); buttonRef.current?.focus() }
    else if (e.key === 'Tab') setOpen(false)
  }
  return (
    <div ref={ref} className="relative" style={{ width }}>
      <button ref={buttonRef} type="button" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listId : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={(e) => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); openList() } }}
        className="dcs-input !py-1.5 !px-3 text-[12px] w-full flex items-center justify-between gap-2 text-left">
        <span className={`truncate ${value ? 'text-[#0B1220]' : 'text-[#566074]'}`}>{current.label}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true" className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M1 1l4 4 4-4" stroke="#566074" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <ul ref={listRef} id={listId} role="listbox" aria-label={ariaLabel} tabIndex={-1} onKeyDown={onListKey}
          aria-activedescendant={`${listId}-${active}`}
          className="absolute z-40 mt-1.5 w-full max-h-[260px] overflow-auto rounded-xl p-1.5 outline-none"
          style={{ background: 'rgba(13,17,34,0.97)', border: '1px solid #E3E7EE', boxShadow: '0 16px 40px rgba(16,24,40,0.10)', backdropFilter: 'blur(12px)' }}>
          {options.map((o, i) => (
            <li key={o.value} id={`${listId}-${i}`} role="option" aria-selected={o.value === value}
              onMouseDown={(e) => e.preventDefault()} onClick={() => choose(i)} onMouseEnter={() => setActive(i)}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-[12px] cursor-pointer"
              style={{ color: o.value === value ? '#fff' : '#3A4357', background: i === active ? '#E3E7EE' : o.value === value ? '#EDF2FF' : 'transparent' }}>
              {o.label}
            </li>
          ))}
        </ul>
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
  const params = new URLSearchParams(locSearch())
  const [q, setQ] = useState(params.get('q') ?? '')
  const [cat, setCat] = useState(TABS.includes(params.get('cat') ?? '') ? params.get('cat')! : 'All')
  const [status, setStatus] = useState('')
  const [runtime, setRuntime] = useState('')
  const [auth, setAuth] = useState('')
  const [rw, setRw] = useState('')
  const [wh, setWh] = useState(false)
  const [sort, setSort] = useState<'rank' | 'az'>('rank')
  const [shown, setShown] = useState(PAGE)
  const [legacyShown, setLegacyShown] = useState(LEGACY_PAGE)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const activeFilters = [status, runtime, auth, rw].filter(Boolean).length + (wh ? 1 : 0)
  const filtered = useMemo(() => {
    let list = CONNECTORS.filter((c) =>
      (cat === 'All' || c.cat === cat || (cat === 'Popular' && POPULAR.popular.includes(c.id))) &&
      (!status || c.s === status) &&
      (!runtime || runtimeStatusLabel(c) === runtime) &&
      (!auth || c.auth === auth) &&
      (!rw || (rw === 'Read only' ? c.rw === 'read' : c.rw.includes('write'))) &&
      (!wh || c.wh) &&
      matchesQuery(c, q)
    )
    list = cat === 'Popular' && sort === 'rank'
      ? list.sort((a, b) => POPULAR.popular.indexOf(a.id) - POPULAR.popular.indexOf(b.id))
      : sort === 'rank' ? list.sort(byRank) : list.sort((a, b) => a.n.localeCompare(b.n))
    return list
  }, [q, cat, status, runtime, auth, rw, wh, sort])

  // Legacy reference surfaces match the same filters but stay out of the canonical count
  const filteredLegacy = useMemo(() => {
    // legacy rows carry no runtime status, so a runtime filter excludes them all
    if (runtime) return []
    let list = LEGACY_GRID.filter((c) =>
      (cat === 'All' || c.cat === cat || (cat === 'Popular' && POPULAR_REFS.has(c.id))) &&
      (!status || c.s === status) &&
      (!auth || c.auth === auth) &&
      (!rw || (rw === 'Read only' ? c.rw === 'read' : c.rw.includes('write'))) &&
      (!wh || c.wh) &&
      matchesQuery(c, q)
    )
    list = sort === 'rank' ? list.sort((a, b) => (a.r ?? 0) - (b.r ?? 0)) : list.sort((a, b) => a.n.localeCompare(b.n))
    return list
  }, [q, cat, status, runtime, auth, rw, wh, sort])

  const needle = q.trim().toLowerCase()
  const pinned: Conn[] = sort !== 'rank' ? [] :
    cat === 'Popular' ? filteredLegacy.filter((c) => POPULAR_REFS.has(c.id))
    : cat === 'AI & Models' ? AI_LEADERS.filter((c) => filteredLegacy.includes(c))
    : needle.length > 1 ? filteredLegacy.filter((c) => POPULAR_REFS.has(c.id) && (c.n.toLowerCase().includes(needle) || c.id.includes(needle)))
    : []
  // Popular keeps the curated order across both kinds; elsewhere the pinned pages lead, then the catalogue
  const grid: Conn[] = cat === 'Popular' && sort === 'rank'
    ? [...pinned, ...filtered].sort((a, b) => POPULAR.popular.indexOf(a.id) - POPULAR.popular.indexOf(b.id))
    : [...pinned, ...filtered]
  const moreRefs = cat === 'Popular' ? [] : filteredLegacy.filter((c) => !pinned.includes(c))

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto px-4 sm:px-8 xl:px-12 2xl:px-16 max-w-[1760px] ">
        <div className="eyebrow mb-3">Connector catalogue</div>
        <h1 className="text-[26px] leading-tight sm:text-4xl font-semibold tracking-tight text-[#0B1220]">{PUBLISHED_COUNT} published connectors. One governed interface.</h1>
        <p className="mt-2 max-w-3xl text-[14px] sm:text-[15px] text-[#3A4357]">
          Capabilities, authentication, permissions and webhooks for every connector — documented from official provider sources.
        </p>

        {/* every figure is derived from the core-generated catalogue */}
        <dl className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3" data-testid="catalogue-counts"
          aria-label={`${TOTAL_CATALOGUED.toLocaleString('en-US')} records in the canonical catalogue · ${PUBLISHED_COUNT} published · ${UNPUBLISHED_COUNT} on hold`}>
          {[
            { k: TOTAL_CATALOGUED.toLocaleString('en-US'), v: 'catalogued', d: 'records in the canonical catalogue' },
            { k: String(PUBLISHED_COUNT), v: 'published', d: 'documented and listed here' },
            { k: String(UNPUBLISHED_COUNT), v: 'on hold', d: 'pending policy, legal or provider review' },
            { k: String(AVAILABLE_TO_CONNECT_COUNT), v: 'available to connect today', d: 'opens per connector after staging verification', testid: 'availability-line' },
          ].map((x) => (
            <div key={x.v} className="glass-card px-3 py-2 sm:px-4 sm:py-3" data-testid={x.testid}>
              <dt className="sr-only">{x.v}</dt>
              <dd className="flex items-baseline gap-2"><span className="text-[19px] sm:text-[22px] font-semibold tabular-nums text-[#0B1220]">{x.k}</span><span className="text-[12.5px] sm:text-[13px] font-medium text-[#1E2638] leading-tight">{x.v}</span></dd>
              <dd className="mt-0.5 hidden sm:block text-[12px] text-[#566074]">{x.d}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          <div className="flex w-full gap-2 sm:w-auto">
            <input value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE) }} placeholder="Search connectors or providers…" aria-label="Search connectors" className="dcs-input min-w-0 flex-1 sm:w-[250px] sm:flex-none px-3 py-2 text-[13.5px]" />
            <button type="button" className="chip sm:hidden !rounded-xl" aria-expanded={filtersOpen} aria-controls="catalogue-filters" onClick={() => setFiltersOpen((o) => !o)}>
              Filters{activeFilters ? ` (${activeFilters})` : ''}
            </button>
          </div>
          <div id="catalogue-filters" className={`${filtersOpen ? 'flex' : 'hidden'} sm:contents flex-wrap items-center gap-2.5`}>
          <FilterSelect ariaLabel="Catalogue status filter" width={160} value={status}
            onChange={(v) => { setStatus(v); setShown(PAGE) }}
            options={[{ value: '', label: 'All statuses' }, ...STATUSES.map((s) => ({ value: s, label: s }))]} />
          <FilterSelect ariaLabel="Runtime status filter" width={175} value={runtime}
            onChange={(v) => { setRuntime(v); setShown(PAGE) }}
            options={[{ value: '', label: 'All runtime statuses' }, ...RUNTIME_STATUSES.map((s) => ({ value: s, label: s }))]} />
          <FilterSelect ariaLabel="Authentication filter" width={150} value={auth}
            onChange={(v) => { setAuth(v); setShown(PAGE) }}
            options={[{ value: '', label: 'All auth types' }, ...AUTH_TYPES.map((a) => ({ value: a, label: a }))]} />
          <FilterSelect ariaLabel="Read/write filter" width={140} value={rw}
            onChange={(v) => { setRw(v); setShown(PAGE) }}
            options={[{ value: '', label: 'Read + Write' }, { value: 'Read only', label: 'Read only' }, { value: 'write', label: 'Supports write' }]} />
          <label className="flex items-center gap-2 text-[12.5px] text-[#3A4357] cursor-pointer">
            <input type="checkbox" checked={wh} onChange={(e) => { setWh(e.target.checked); setShown(PAGE) }} className="accent-[#2850D8]" /> Webhooks
          </label>
          <FilterSelect ariaLabel="Sort order" width={125} value={sort}
            onChange={(v) => setSort(v as 'rank' | 'az')}
            options={[{ value: 'rank', label: 'Sort: rank' }, { value: 'az', label: 'Sort: A–Z' }]} />
          </div>
        </div>

        {/* categories: one scrollable row instead of four wrapped rows */}
        <div className="relative mt-3">
          <div className="flex gap-2 overflow-x-auto pb-1.5 [scrollbar-width:thin]" role="group" aria-label="Category">
            {TABS.map((c) => (
              <button key={c} onClick={() => { setCat(c); setShown(PAGE) }} aria-pressed={cat === c} className={`chip shrink-0 whitespace-nowrap !py-1 !px-3 ${cat === c ? 'active' : ''}`}>{c}</button>
            ))}
          </div>
          <div aria-hidden className="pointer-events-none absolute right-0 top-0 bottom-1.5 w-10" style={{ background: 'linear-gradient(90deg, rgba(245,246,248,0), #F5F6F8)' }} />
        </div>

        <div className="mt-5 flex items-center gap-3 text-[12.5px] text-[#566074]">
          <span data-testid="result-count" className="font-medium text-[#1E2638]">{filtered.length} connectors</span>
          {pinned.length > 0 && <span data-testid="pinned-count">+ {pinned.length} reference {pinned.length === 1 ? 'page' : 'pages'} (not in the catalogue count)</span>}
          {(q || cat !== 'All' || status || runtime || auth || rw || wh) && (
            <button type="button" className="font-semibold text-[#2850D8] hover:underline"
              onClick={() => { setQ(''); setCat('All'); setStatus(''); setRuntime(''); setAuth(''); setRw(''); setWh(false); setShown(PAGE) }}>Clear filters</button>
          )}
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5">
          {grid.slice(0, shown).map((c: Conn) => (
            <a key={c.id} href={`/connectors/${c.id}`} className="glass-card glass-card-hover p-4 flex flex-col">
              <div className="flex items-center gap-3">
                <ConnectorLogo name={c.n} src={c.logo} size={40} />
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold text-[#0B1220] truncate">{c.n}</div>
                  <div className="text-[11.5px] text-[#566074] truncate">{c.cat}</div>
                </div>
              </div>
              <p className="mt-2.5 text-[12.5px] leading-snug text-[#3A4357] line-clamp-2">{c.d}</p>
              <div className="flex-1" />
              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                {isRef(c)
                  ? <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full text-[#92400E]" style={{ background: 'rgba(255,178,36,0.08)', border: '1px solid rgba(255,178,36,0.3)' }} title="Reference page: not yet in the Connector OS catalogue, outside every count">Reference</span>
                  : <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full" style={{ color: statusColor(c.s), background: `${statusColor(c.s)}1f`, border: `1px solid ${statusColor(c.s)}44` }}>{c.s}</span>}
                {c.runtime_status && c.runtime_status !== 'not_verified' && (
                  <span className="text-[10.5px] px-2 py-0.5 rounded-full text-[#566074]" style={{ background: '#F5F7FB', border: '1px solid #E3E7EE' }}>{runtimeStatusLabel(c)}</span>
                )}
                <span className="text-[10.5px] px-2 py-0.5 rounded-full text-[#3A4357]" style={{ background: '#F5F7FB', border: '1px solid #E3E7EE' }}>{c.auth}</span>
                {c.wh && <span className="text-[10.5px] px-2 py-0.5 rounded-full text-[#155E75]" style={{ background: 'rgba(14,116,144,0.06)', border: '1px solid rgba(14,116,144,0.22)' }}>Webhooks</span>}
                <span className="ml-auto text-[11.5px] font-semibold text-[#2850D8]">Details →</span>
              </div>
            </a>
          ))}
        </div>

        {grid.length === 0 && (
          <div className="glass-panel p-6 text-center" data-testid="no-canonical-match">
            <p className="text-[13.5px] text-[#1E2638]">No published canonical connector matches these filters.</p>
            <p className="mt-1.5 text-[12px] text-[#566074]">
              {filteredLegacy.length > 0
                ? `${filteredLegacy.length} legacy reference ${filteredLegacy.length === 1 ? 'surface matches' : 'surfaces match'} below. Reference surfaces are not canonical connectors and carry no runtime status.`
                : 'Try a different search or clear the filters.'}
            </p>
          </div>
        )}

        {shown < grid.length && (
          <div className="mt-10 text-center">
            <button onClick={() => setShown(shown + PAGE)} className="cta-secondary">Load more ({grid.length - shown} remaining)</button>
          </div>
        )}

        {moreRefs.length > 0 && (
          <div className="mt-14">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h2 className="text-xl font-semibold tracking-tight text-[#0B1220]">More reference pages</h2>
              <span className="text-[11.5px] text-[#566074]">{moreRefs.length} from the previous catalogue — reference only, not part of the canonical catalogue or any count above</span>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {moreRefs.slice(0, legacyShown).map((c: Conn) => (
                <a key={`legacy-${c.id}`} href={`/connectors/${c.id}`} className="glass-card glass-card-hover p-5 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <ConnectorLogo name={c.n} src={c.logo} size={44} />
                    <div className="min-w-0">
                      <div className="text-[14px] font-semibold text-[#0B1220] truncate">{c.n}</div>
                      <div className="text-[11px] text-[#566074] truncate">{c.p}</div>
                    </div>
                  </div>
                  <p className="text-[12px] leading-relaxed text-[#3A4357] line-clamp-2 flex-1">{c.d}</p>
                  <div className="mt-4 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-[#92400E]" style={{ background: 'rgba(255,178,36,0.08)', border: '1px solid rgba(255,178,36,0.3)' }}>Reference</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full text-[#3A4357]" style={{ background: '#F5F7FB', border: '1px solid #E3E7EE' }}>{c.cat}</span>
                    <span className="ml-auto text-[11px] font-semibold text-[#2850D8]">Details →</span>
                  </div>
                </a>
              ))}
            </div>
            {legacyShown < moreRefs.length && (
              <div className="mt-8 text-center">
                <button onClick={() => setLegacyShown(legacyShown + LEGACY_PAGE * 4)} className="cta-secondary">Load more reference pages ({moreRefs.length - legacyShown} remaining)</button>
              </div>
            )}
          </div>
        )}

        {/* Legend: catalogue status vs runtime status — two independent fields, never merged.
             Static copy by design: it does NOT change with the claim level. */}
        <div className="mt-14 border-t border-[#E3E7EE] pt-5 text-[12px] leading-relaxed text-[#566074] max-w-4xl">
          <p><span className="font-semibold text-[#1E2638]">Catalogue status</span> (Coming Soon · Provider Approval Required · Preview · Read Only · Limited Access · Available) describes documentation and access model; Available is earned only after staging verification — none today.</p>
          <p className="mt-1"><span className="font-semibold text-[#1E2638]">Runtime status</span> (Not yet runtime-verified · Staging-verified · Production-verified) is earned runtime proof, tracked separately. Records on hold are not listed.{CORE_HEAD ? ` Counts and statuses come from Connector OS core ${CORE_HEAD.slice(0, 7)}.` : ''}</p>
        </div>
      </div>
    </div>
  )
}
