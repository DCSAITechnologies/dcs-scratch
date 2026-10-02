// Pure connector formatting helpers — no catalogue JSON import, so light pages can
// use them without pulling the 2 MB catalogue into their chunk.

type StatusFields = { runtime_status?: 'not_verified' | 'staging_verified' | 'production_verified' }

// Runtime status (M2): read from data so the flip to STAGING is a data edit
export const runtimeStatusLabel = (c: StatusFields): string =>
  c.runtime_status === 'staging_verified' ? 'Staging-verified'
  : c.runtime_status === 'production_verified' ? 'Production-verified'
  : 'Not yet runtime-verified'

export const RUNTIME_STATUSES = ['Not yet runtime-verified', 'Staging-verified', 'Production-verified']

export function statusColor(s: string): string {
  switch (s) {
    case 'Available': return '#21C87A'
    case 'Read Only': return '#4D8DFF'
    case 'Preview': return '#00C2FF'
    case 'Limited Access': return '#F5A524'
    case 'Provider Approval Required': return '#8B5CF6'
    case 'Coming Soon': return '#93A0C2'
    default: return '#A9B6D3'
  }
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
