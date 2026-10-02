import connectorsJson from './connectors.json'
import connectorsLegacyJson from './connectors-legacy.json'

export type Conn = {
  id: string; r: number; n: string; p: string; cat: string; s: string; auth: string
  rw: string; wh: boolean; whEvents: string[]; d: string; l: string
  caps: string[]; res: string[]; uc: string[]; ops: string[]
  scopes: string[]; optScopes: string[]; flow: string; reqs: string[]
  logo: string; site: string; portal: string | null; api: string | null
  authDocs: string | null; whDocs: string | null; statusUrl: string | null
  verified: string | null; cta: string
  runtime_status?: 'not_verified' | 'staging_verified' | 'production_verified'
  unreconciled?: boolean
  unpublished?: boolean
  description_source?: 'editorial' | 'provider' | 'auto-pending'
  engineering_rank?: number | null
  research_rank?: string | null
  engineering_status?: string | null
  dispatch_eligibility?: string | null
  dispatch_reason?: string | null
  founder_hold?: boolean
  legal_hold?: boolean
  hold_category?: string | null
  alias_of?: string | null
  docs_status?: string | null
  source_provenance?: string | null
  // Lane 6 legacy-surface fields (connectors-legacy.json only)
  legacy_surface?: boolean
  lane6_classification?: string
  lane6_behavior?: string
  lane6_redirect_to?: string | null
}

export const CONNECTORS: Conn[] = connectorsJson as unknown as Conn[]

// A3: the auto-summary banner is driven by the data field, not derived from `verified`
export const isTemplated = (c: Conn): boolean => c.description_source === 'auto-pending'

// A1: unpublished records stay in the JSON (audit trail) but never render
export const isUnpublished = (c: Conn): boolean => c.unpublished === true
export const PUBLISHED_CONNECTORS = CONNECTORS.filter((c) => !isUnpublished(c))

// LEGACY_REFERENCE_SURFACES — 547 legacy 750-catalogue rows with no canonical-1000 mapping.
// Preserved for Lane 6 reconciliation (KEEP AS REFERENCE / MERGE-ALIAS / PROMOTE / RETIRE / DELETE).
// Never counted in the 1000, never presented as engineered/runtime connectors.
export const LEGACY_REFERENCE_SURFACES: Conn[] = (connectorsLegacyJson as unknown as Conn[])
export const LEGACY_REFERENCE_COUNT = LEGACY_REFERENCE_SURFACES.length
export const LEGACY_REFERENCE_MAP = new Map(LEGACY_REFERENCE_SURFACES.map((c) => [c.id, c]))

// alias rows resolve to their canonical record; unknown/legacy ids return null
export const byIdOrAlias = (id: string): Conn | null => {
  const c = CONNECTORS.find((x) => x.id === id)
  if (!c) return null
  if (c.alias_of) return CONNECTORS.find((x) => x.id === c.alias_of) ?? null
  return c
}
export const PUBLISHED_MAP = new Map(PUBLISHED_CONNECTORS.map((c) => [c.id, c]))
export const TOTAL_CATALOGUED = CONNECTORS.length
export const PUBLISHED_COUNT = PUBLISHED_CONNECTORS.length

// Runtime status (M2): read from data so the flip to STAGING is a data edit
export const runtimeStatusLabel = (c: Conn): string =>
  c.runtime_status === 'staging_verified' ? 'Staging-verified'
  : c.runtime_status === 'production_verified' ? 'Production-verified'
  : 'Not yet runtime-verified'

export const RUNTIME_STATUSES = ['Not yet runtime-verified', 'Staging-verified', 'Production-verified']
export const RUNTIME_VERIFIED_COUNT = CONNECTORS.filter((c) => c.runtime_status && c.runtime_status !== 'not_verified').length

export const CATEGORIES = ['All', ...Array.from(new Set(CONNECTORS.map((c) => c.cat)))]
export const STATUSES = Array.from(new Set(CONNECTORS.map((c) => c.s)))
export const AUTH_TYPES = Array.from(new Set(CONNECTORS.map((c) => c.auth))).sort()

export const CATEGORY_COUNTS: Record<string, number> = {}
CONNECTORS.forEach((c) => { CATEGORY_COUNTS[c.cat] = (CATEGORY_COUNTS[c.cat] ?? 0) + 1 })

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

export function ctaLabel(c: Conn): string {
  switch (c.cta) {
    case 'notify': return 'Notify me at launch'
    case 'request_access': return 'Request Access'
    case 'coming_soon': return 'Coming Soon'
    case 'contact': return 'Contact Us'
    default: return 'Notify me at launch'
  }
}

export const EXECUTIONS = [
  { task: 'Summarise Q3 board notes', agent: 'Research Agent', connector: 'Notion', status: 'Success', duration: '12s', time: '2m ago' },
  { task: 'Sync closed-won deals', agent: 'Sales Agent', connector: 'Salesforce', status: 'Success', duration: '28s', time: '4m ago' },
  { task: 'Post launch update', agent: 'Marketing Agent', connector: 'Slack', status: 'Success', duration: '14s', time: '8m ago' },
  { task: 'Reconcile payout report', agent: 'Finance Agent', connector: 'Stripe', status: 'Unknown', duration: '32s', time: '14m ago' },
  { task: 'File expense receipts', agent: 'Ops Agent', connector: 'Google Drive', status: 'Success', duration: '19s', time: '36m ago' },
]

export const RECEIPTS = [
  { id: 'rcpt_01J8K3F2', action: 'File created', tool: 'files.create', conn: 'google-drive' },
  { id: 'rcpt_01J8K5P1', action: 'Message sent', tool: 'messages.send', conn: 'slack' },
  { id: 'rcpt_01J8K3E9', action: 'Record updated', tool: 'opportunities.update', conn: 'salesforce' },
  { id: 'rcpt_01J8K2E8', action: 'Page published', tool: 'pages.create', conn: 'notion' },
  { id: 'rcpt_01J8K3E7', action: 'Refund issued', tool: 'refunds.create', conn: 'stripe' },
]

export const TRUTHFUL_STATES = [
  { name: 'Refused', desc: 'Request explicitly refused by policy.', color: '#EF4444' },
  { name: 'Blocked', desc: 'Blocked due to risk, policy or missing permission.', color: '#EF4444' },
  { name: 'Started', desc: 'Request accepted and in progress.', color: '#4D8DFF' },
  { name: 'Succeeded', desc: 'Completed successfully.', color: '#21C87A' },
  { name: 'Failed', desc: 'Execution failed.', color: '#EF4444' },
  { name: 'Provider unavailable', desc: 'Provider is unavailable or unreachable.', color: '#F5A524' },
  { name: 'Retry scheduled', desc: 'Scheduled to retry after backoff.', color: '#8B5CF6' },
  { name: 'Outcome unknown', desc: 'Final status yet to be determined.', color: '#A9B6D3' },
  { name: 'Receipt pending', desc: 'Execution complete, receipt being generated.', color: '#00C2FF' },
  { name: 'Receipt issued', desc: 'Verifiable receipt is available.', color: '#21C87A' },
]
