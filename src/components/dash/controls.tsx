// Product-grade custom dropdown (replaces native <select> in the console
// topbar) and the centered search modal — refinement brief items 3 and 4.

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { POPULAR_SEARCHES, SUGGESTED, getRecent, pushRecent } from '../../lib/search-recents'
import { tint } from '../../lib/console-theme'

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

  const color = accent ?? 'var(--c-text-2)'
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12px] font-semibold outline-none transition-colors hover:bg-[var(--c-card-2)]"
        style={{ color, borderColor: tint(color, 33), background: open ? 'var(--c-card-2)' : 'transparent' }}
      >
        {value}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform ${open ? 'rotate-180' : ''}`}><path d="m2 3.5 3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 mt-1.5 min-w-[150px] rounded-xl border border-[var(--c-border)] py-1 z-[70] shadow-2xl"
          style={{ background: 'var(--c-card)', boxShadow: '0 12px 36px rgba(0,0,0,0.55)' }}
        >
          {options.map((o) => (
            <li key={o}>
              <button
                type="button"
                role="option"
                aria-selected={o === value}
                onClick={() => { onChange(o); setOpen(false) }}
                className={`w-full text-left px-3 py-1.5 text-[12.5px] transition-colors ${o === value ? 'text-[var(--c-text)] bg-[color-mix(in_srgb,var(--c-info)_25%,transparent)]' : 'text-[var(--c-text-2)] hover:text-[var(--c-text)] hover:bg-[var(--c-card-2)]'}`}
              >
                {o}
                {o === value && <span className="float-right text-[var(--c-info)]">✓</span>}
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
      <div className="px-1 pb-1.5 text-[9.5px] uppercase tracking-[0.16em] text-[var(--c-muted)] font-semibold">{title}</div>
      {items}
    </div>
  )

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} style={{ backdropFilter: 'blur(3px)' }} />
      <div className="relative w-[min(600px,calc(100vw-32px))] rounded-2xl border border-[var(--c-border)] shadow-2xl overflow-hidden" style={{ background: 'var(--c-panel)' }}>
        <div className="flex items-center gap-2.5 px-4 border-b border-[var(--c-border)]">
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none" className="text-[var(--c-muted)] shrink-0"><circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" /><path d="m13.5 13.5 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && go(q)}
            placeholder="Search id: run_, ex_, rc_, ap_, cn_, pol_, connector…"
            aria-label="Search the console"
            className="w-full h-11 bg-transparent text-[13.5px] text-[var(--c-text)] placeholder-[var(--c-muted)] outline-none"
          />
          <kbd className="text-[9.5px] text-[var(--c-muted)] border border-[var(--c-border)] rounded px-1.5 py-0.5 shrink-0">esc</kbd>
        </div>
        <div className="max-h-[46vh] overflow-y-auto pb-3">
          {recent.length > 0 && section('Recent searches', (
            <div className="flex flex-wrap gap-1.5 px-1">
              {recent.map((r) => (
                <button key={r} type="button" onClick={() => go(r)} className="px-2.5 py-1 rounded-full text-[11.5px] text-[var(--c-text-2)] bg-[var(--c-card-2)] border border-[var(--c-border)] hover:text-[var(--c-text)] hover:border-[color-mix(in_srgb,var(--c-info)_40%,transparent)] font-mono">{r}</button>
              ))}
            </div>
          ))}
          {suggestions && section('Popular', (
            <div className="flex flex-wrap gap-1.5 px-1">
              {POPULAR_SEARCHES.map((r) => (
                <button key={r} type="button" onClick={() => go(r)} className="px-2.5 py-1 rounded-full text-[11.5px] text-[var(--c-text-2)] bg-[var(--c-card-2)] border border-[var(--c-border)] hover:text-[var(--c-text)] hover:border-[color-mix(in_srgb,var(--c-info)_40%,transparent)] font-mono">{r}</button>
              ))}
            </div>
          ))}
          {suggestions && section('Suggested', (
            <ul>
              {SUGGESTED.filter((s) => !q || s.id.includes(q) || s.label.toLowerCase().includes(q.toLowerCase())).map((s) => (
                <li key={s.id}>
                  <button type="button" onClick={() => go(s.id)} className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[var(--c-card-2)] text-left">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-[color-mix(in_srgb,var(--c-info)_12%,transparent)] text-[var(--c-link)] border border-[color-mix(in_srgb,var(--c-info)_25%,transparent)] w-[74px] text-center shrink-0">{s.type}</span>
                    <span className="font-mono text-[12px] text-[var(--c-link)]">{s.id}</span>
                    <span className="text-[11.5px] text-[var(--c-text-2)] truncate">{s.label}</span>
                    <span className="ml-auto text-[10px] text-[var(--c-muted)] shrink-0">{s.env}</span>
                  </button>
                </li>
              ))}
            </ul>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-[var(--c-border)] text-[10px] text-[var(--c-muted)]">Hermetic preview data — results resolve against the reference stores.</div>
      </div>
    </div>
  )
}
