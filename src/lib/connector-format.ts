// Pure connector formatting helpers — no catalogue JSON import, so light pages can
// use them without pulling the 2 MB catalogue into their chunk.

type StatusFields = { runtime_status?: 'not_verified' | 'staging_verified' | 'production_verified' }

// Runtime status (M2): read from data so the flip to STAGING is a data edit
export const runtimeStatusLabel = (c: StatusFields): string =>
  c.runtime_status === 'staging_verified' ? 'Staging-verified'
  : c.runtime_status === 'production_verified' ? 'Production-verified'
  : 'Not yet runtime-verified'

export const RUNTIME_STATUSES = ['Not yet runtime-verified', 'Staging-verified', 'Production-verified']

// Status tones for the light public site (each ≥ 4.5:1 on white).
export function statusColor(s: string): string {
  switch (s) {
    case 'Available': return '#065F46'
    case 'Read Only': return '#1E40AF'
    case 'Preview': return '#155E75'
    case 'Limited Access': return '#92400E'
    case 'Provider Approval Required': return '#5B21B6'
    case 'Coming Soon': return '#475467'
    case 'Blocked': return '#991B1B'
    default: return '#3A4357'
  }
}

// Read/write as documented by the editorial record; rows with no record say so.
export const rwLabel = (rw: string) => (rw === 'read' ? 'Read only' : rw.includes('write') ? 'Read + write' : 'Not yet documented')

// Core dispatch-eligibility reasons in plain words (codes from packages/registry eligibility).
export function dispatchReasonLabel(r: string): string {
  if (r === 'no_explicit_grant') return 'no dispatch grant recorded in core'
  if (r === 'no_eligibility_record') return 'no eligibility record in core'
  if (r.startsWith('disposition:')) return `engineering status ${r.slice(12).replaceAll('_', ' ').toLowerCase()}`
  if (r.startsWith('founder_hold:')) return `founder hold (${r.slice(13).replace(/^gate:/, '')})`
  if (r.startsWith('open_finding:')) return `open audit finding ${r.slice(13)}`
  return r.replaceAll('_', ' ')
}

export function ctaLabel(c: { cta: string }): string {
  switch (c.cta) {
    // no notification capture exists yet — the CTA leads to launch status, not a signup
    case 'notify': return 'Launch status'
    case 'request_access': return 'Request Access'
    case 'coming_soon': return 'Coming Soon'
    case 'contact': return 'Contact Us'
    default: return 'Launch status'
  }
}
