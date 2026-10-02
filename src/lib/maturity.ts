// Feature maturity classes (Dashboard Architecture §0, Contract Matrix §1).
// Every dashboard action carries one of these. An action whose backend path is
// not wired is rendered disabled with its label — nothing fake, no optimistic UI.

export type Maturity =
  | 'WIRED'
  | 'HERMETIC ONLY'
  | 'STAGING ONLY'
  | 'PLANNED'
  | 'EXTERNAL DEPENDENCY'
  | 'PRE-LAUNCH'

// Is this action usable in the current console build? Only WIRED actions are
// enabled. Everything else renders disabled with its maturity label.
export const isUsable = (m: Maturity): boolean => m === 'WIRED'

export const MATURITY_HINT: Record<Maturity, string> = {
  'WIRED': 'Available now',
  'HERMETIC ONLY': 'Proven against the integrated build; not connected to production services',
  'STAGING ONLY': 'Available on staging',
  'PLANNED': 'On the roadmap; not built yet',
  'EXTERNAL DEPENDENCY': 'Blocked on an external service (IdP, vault, KMS/HSM, provider OAuth)',
  'PRE-LAUNCH': 'Ships at launch',
}
