// Product-grade custom dropdown (replaces native <select> in the console
// topbar) and the centered search modal — refinement brief items 3 and 4.

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { POPULAR_SEARCHES, SUGGESTED, getRecent, pushRecent } from '../../lib/search-recents'

// ── Custom dropdown / popover ──────────────────────────────────────────────
export function Dropdown({
  value, options, onChange, ariaLabel, accent,
}: {
  value: string
  options: readonly string[]
  onChange: (v: string) => void
  ariaLabel: string
  accent?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])

  const color = accent ?? '#C7D2EA'
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12px] font-semibold outline-none transition-colors hover:bg-white/[0.04]"
        style={{ color, borderColor: `${color}55`, background: open ? 'rgba(255,255,255,0.05)' : 'transparent' }}
      >
        {value}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform ${open ? 'rotate-180' : ''}`}><path d="m2 3.5 3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 mt-1.5 min-w-[150px] rounded-xl border border-white/[0.1] py-1 z-[70] shadow-2xl"
          style={{ background: '#0C1330', boxShadow: '0 12px 36px rgba(0,0,0,0.55)' }}
        >
          {options.map((o) => (
            <li key={o}>
              <button
                type="button"
                role="option"
                aria-selected={o === value}
                onClick={() => { onChange(o); setOpen(false) }}
                className={`w-full text-left px-3 py-1.5 text-[12.5px] transition-colors ${o === value ? 'text-white bg-[#3B5BDB]/[0.25]' : 'text-[#A9B6D3] hover:text-white hover:bg-white/[0.05]'}`}
              >
                {o}
                {o === value && <span className="float-right text-[#5A7BFF]">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Search modal — recent / popular / suggested ids ────────────────────────
export function SearchModal({
  open, initial, onClose, onSubmit, suggestions = true,
}: {
  open: boolean; initial: string; onClose: () => void; onSubmit: (q: string) => void
  // fixture ids are only suggested in demo mode
  suggestions?: boolean
}) {
  const [q, setQ] = useState(initial)
  const inputRef = useRef<HTMLInputElement>(null)
  const recent = getRecent()

  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) { // reset query on open/close transition — render-phase, no cascading effect
    setWasOpen(open)
    if (open) setQ(initial)
  }
  useEffect(() => {
    if (open) { const t = setTimeout(() => inputRef.current?.focus(), 30); return () => clearTimeout(t) }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const go = (v: string) => { if (v.trim()) { pushRecent(v.trim()); onSubmit(v.trim()) } }

  const section = (title: string, items: ReactNode) => (
    <div className="px-3 pt-3">
      <div className="px-1 pb-1.5 text-[9.5px] uppercase tracking-[0.16em] text-[#8592AE] font-semibold">{title}</div>
      {items}
    </div>
  )

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} style={{ backdropFilter: 'blur(3px)' }} />
      <div className="relative w-[min(600px,calc(100vw-32px))] rounded-2xl border border-white/[0.1] shadow-2xl overflow-hidden" style={{ background: '#0B1128' }}>
        <div className="flex items-center gap-2.5 px-4 border-b border-white/[0.08]">
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none" className="text-[#8592AE] shrink-0"><circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" /><path d="m13.5 13.5 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && go(q)}
            placeholder="Search id: run_, ex_, rc_, ap_, cn_, pol_, connector…"
            aria-label="Search the console"
            className="w-full h-11 bg-transparent text-[13.5px] text-white placeholder-[#8592AE] outline-none"
          />
          <kbd className="text-[9.5px] text-[#8592AE] border border-white/[0.1] rounded px-1.5 py-0.5 shrink-0">esc</kbd>
        </div>
        <div className="max-h-[46vh] overflow-y-auto pb-3">
          {recent.length > 0 && section('Recent searches', (
            <div className="flex flex-wrap gap-1.5 px-1">
              {recent.map((r) => (
                <button key={r} type="button" onClick={() => go(r)} className="px-2.5 py-1 rounded-full text-[11.5px] text-[#A9B6D3] bg-white/[0.04] border border-white/[0.08] hover:text-white hover:border-[#4D8DFF]/40 font-mono">{r}</button>
              ))}
            </div>
          ))}
          {suggestions && section('Popular', (
            <div className="flex flex-wrap gap-1.5 px-1">
              {POPULAR_SEARCHES.map((r) => (
                <button key={r} type="button" onClick={() => go(r)} className="px-2.5 py-1 rounded-full text-[11.5px] text-[#A9B6D3] bg-white/[0.04] border border-white/[0.08] hover:text-white hover:border-[#4D8DFF]/40 font-mono">{r}</button>
              ))}
            </div>
          ))}
          {suggestions && section('Suggested', (
            <ul>
              {SUGGESTED.filter((s) => !q || s.id.includes(q) || s.label.toLowerCase().includes(q.toLowerCase())).map((s) => (
                <li key={s.id}>
                  <button type="button" onClick={() => go(s.id)} className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/[0.05] text-left">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-[#4D8DFF]/[0.12] text-[#7EA2FF] border border-[#4D8DFF]/25 w-[74px] text-center shrink-0">{s.type}</span>
                    <span className="font-mono text-[12px] text-[#7EA2FF]">{s.id}</span>
                    <span className="text-[11.5px] text-[#A9B6D3] truncate">{s.label}</span>
                    <span className="ml-auto text-[10px] text-[#8592AE] shrink-0">{s.env}</span>
                  </button>
                </li>
              ))}
            </ul>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-white/[0.06] text-[10px] text-[#8592AE]">Hermetic preview data — results resolve against the reference stores.</div>
      </div>
    </div>
  )
}
