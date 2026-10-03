import connectorsJson from './connectors.json'
import connectorsLegacyJson from './connectors-legacy.json'
export { runtimeStatusLabel, RUNTIME_STATUSES, statusColor, ctaLabel, rwLabel, dispatchReasonLabel } from './connector-format'

export type Conn = {
  id: string; r: number | null; n: string; p: string; cat: string; s: string; auth: string
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
  // core-derived (scripts/sync-catalogue.py from core-snapshot/) — never edited by hand
  editorial_hold?: string | null
  editorial_source?: string
  core?: CoreFacts
}

export type CoreFacts = {
  pack: string; generation: string; disposition: string; source_ref: string
  founder_holds: string[]; notes?: string | null; replaced_by?: string | null; blocked_from_rank?: number | null
  website_public_status?: string | null
  dispatch: { staging: boolean; production: boolean; reasons: string[]; production_reasons: string[] }
  staging_verified: boolean; core_head: string | null
}

export const CONNECTORS: Conn[] = connectorsJson as unknown as Conn[]

// A3: the auto-summary banner is driven by the data field, not derived from `verified`
export const isTemplated = (c: Conn): boolean => c.description_source === 'auto-pending'

// A1: unpublished records stay in the JSON (audit trail) but never render
export const isUnpublished = (c: Conn): boolean => c.unpublished === true
export const PUBLISHED_CONNECTORS = CONNECTORS.filter((c) => !isUnpublished(c))

// LEGACY_REFERENCE_SURFACES — legacy (750-row catalogue) rows with no canonical mapping.
// Preserved for Lane 6 reconciliation (KEEP AS REFERENCE / MERGE-ALIAS / PROMOTE / RETIRE / DELETE).
// Never counted in the canonical total, never presented as engineered/runtime connectors.
export const LEGACY_REFERENCE_SURFACES: Conn[] = (connectorsLegacyJson as unknown as Conn[])
export const LEGACY_REFERENCE_MAP = new Map(LEGACY_REFERENCE_SURFACES.map((c) => [c.id, c]))

// alias_of semantics (Lane 6): the row is published under its own id; alias_of names
// another identifier for the same connector. When that identifier is itself a
// canonical row, the alias row redirects to it. When it is NOT a canonical row (true
// for every alias in the current snapshot), the row stands on its own and the alias
// identifier redirects here instead. Previously the row resolved to null and every
// alias card rendered "Connector not found".
const CANONICAL_MAP = new Map(CONNECTORS.map((c) => [c.id, c]))
const ALIAS_TARGET_MAP = new Map(
  CONNECTORS.filter((c) => c.alias_of && !CANONICAL_MAP.has(c.alias_of)).map((c) => [c.alias_of as string, c])
)

export type Resolution =
  | { kind: 'record'; c: Conn }
  | { kind: 'redirect'; to: string; c: Conn }
  | { kind: 'unpublished'; c: Conn }
  | null

// Public-site resolution: published canonical rows render; unpublished (HOLD) rows
// never render their content, even on a direct URL.
export function resolvePublic(id: string): Resolution {
  const c = CANONICAL_MAP.get(id)
  if (c) {
    if (c.alias_of && CANONICAL_MAP.has(c.alias_of)) {
      const t = CANONICAL_MAP.get(c.alias_of)!
      return isUnpublished(t) ? { kind: 'unpublished', c: t } : { kind: 'redirect', to: `/connectors/${t.id}`, c: t }
    }
    return isUnpublished(c) ? { kind: 'unpublished', c } : { kind: 'record', c }
  }
  const viaAlias = ALIAS_TARGET_MAP.get(id)
  if (viaAlias) {
    return isUnpublished(viaAlias) ? { kind: 'unpublished', c: viaAlias } : { kind: 'redirect', to: `/connectors/${viaAlias.id}`, c: viaAlias }
  }
  return null
}

export const TOTAL_CATALOGUED = CONNECTORS.length
export const PUBLISHED_COUNT = PUBLISHED_CONNECTORS.length
export const UNPUBLISHED_COUNT = TOTAL_CATALOGUED - PUBLISHED_COUNT

// "Available to connect" is core's dispatch eligibility (staging or production), nothing else.
export const isAvailableToConnect = (c: Conn): boolean => Boolean(c.core?.dispatch.staging || c.core?.dispatch.production)
export const AVAILABLE_TO_CONNECT_COUNT = CONNECTORS.filter(isAvailableToConnect).length
export const CORE_HEAD = CONNECTORS.find((c) => c.core?.core_head)?.core?.core_head ?? null
// rank order with unranked core rows (Golden Five, reference, blocked) after the ranked ones
export const byRank = (a: Conn, b: Conn) => (a.r ?? Number.MAX_SAFE_INTEGER) - (b.r ?? Number.MAX_SAFE_INTEGER) || a.n.localeCompare(b.n)
export const RUNTIME_VERIFIED_COUNT = CONNECTORS.filter((c) => c.runtime_status && c.runtime_status !== 'not_verified').length

// Public filters are built from what the public grid can show (published rows),
// so no filter option yields an always-empty result (e.g. the HOLD status).
export const CATEGORIES = ['All', ...Array.from(new Set(PUBLISHED_CONNECTORS.map((c) => c.cat))).sort()]
export const STATUSES = Array.from(new Set(PUBLISHED_CONNECTORS.map((c) => c.s)))
export const AUTH_TYPES = Array.from(new Set(PUBLISHED_CONNECTORS.map((c) => c.auth))).sort()

