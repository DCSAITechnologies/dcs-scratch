// Runtime configuration for the console's data source and identity.
//
// Two explicit modes — never mixed:
//   api  — VITE_COS_API_URL is set. Every console read goes to the Connector OS
//          API; a failure renders an error state. Fixture data is never shown.
//   demo — no API URL. Console renders the hermetic fixture stores under a
//          DEMO / NON-PRODUCTION banner. Nothing is fetched.
//
// All values are public build-time config (VITE_*). Secrets must never be put here:
// anything VITE_* is compiled into the browser bundle.

export type DataMode = 'api' | 'demo'

const env = import.meta.env

const trimSlash = (u: string) => u.replace(/\/+$/, '')

export const API_BASE_URL: string | null = env.VITE_COS_API_URL ? trimSlash(String(env.VITE_COS_API_URL)) : null
export const DATA_MODE: DataMode = API_BASE_URL ? 'api' : 'demo'

// OIDC (provider-agnostic, authorization code + PKCE). Unset → no IdP wired.
export const OIDC = {
  issuer: env.VITE_OIDC_ISSUER ? String(env.VITE_OIDC_ISSUER) : null,
  clientId: env.VITE_OIDC_CLIENT_ID ? String(env.VITE_OIDC_CLIENT_ID) : null,
  scope: env.VITE_OIDC_SCOPE ? String(env.VITE_OIDC_SCOPE) : 'openid profile email',
  audience: env.VITE_OIDC_AUDIENCE ? String(env.VITE_OIDC_AUDIENCE) : null,
}
export const OIDC_CONFIGURED = Boolean(OIDC.issuer && OIDC.clientId)

// Development-only bearer tokens for the local mock / hermetic reference server.
// Honoured only in `development` and `mock` builds — a production build ignores
// them even if set, so a test token can never ship as a credential.
export const DEV_AUTH_ALLOWED = env.MODE === 'development' || env.MODE === 'mock'
export const DEV_TOKENS: Record<string, string> = DEV_AUTH_ALLOWED && env.VITE_COS_DEV_TOKENS
  ? Object.fromEntries(String(env.VITE_COS_DEV_TOKENS).split(',').map((pair) => pair.split('=').map((s) => s.trim()) as [string, string]))
  : {}

// Contact / request-access form. Unset → the form renders "not open yet".
export const CONTACT_ENDPOINT: string | null = env.VITE_CONTACT_ENDPOINT ? String(env.VITE_CONTACT_ENDPOINT) : null
export const TURNSTILE_SITE_KEY: string | null = env.VITE_TURNSTILE_SITE_KEY ? String(env.VITE_TURNSTILE_SITE_KEY) : null

export const apiHost = () => (API_BASE_URL ? new URL(API_BASE_URL).host : null)
