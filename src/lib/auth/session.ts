// Console identity — provider-agnostic.
//
// Providers (chosen from build config, never at runtime by the user):
//   oidc — VITE_OIDC_ISSUER + VITE_OIDC_CLIENT_ID set. Authorization code + PKCE
//          via oidc-client-ts (lazy-loaded). Tokens live in sessionStorage (per tab,
//          cleared when the tab closes); silent renew on expiry. For production,
//          a backend-for-frontend with httpOnly cookies is the stronger option —
//          see audit/HANDOFF.md.
//   dev  — development / mock builds only: pick a mock identity whose bearer token
//          the local mock server understands. A production build never offers this.
//   none — no provider. In demo mode the console runs on fixtures with a labelled
//          demo identity; in api mode the console refuses to load data.
//
// Roles/permissions come from GET /v1/me (Principal.capabilities), not from the IdP
// token, so the API stays the single authority on what this principal may do.

import { useSyncExternalStore } from 'react'
import { DATA_MODE, DEV_TOKENS, OIDC, OIDC_CONFIGURED } from '../api/config'
import { setTokenProvider, setUnauthenticatedHandler } from '../api/client'
import { ApiError } from '../api/errors'
import type { components } from '../api/schema.gen'
import type { UserManager } from 'oidc-client-ts'

export type Principal = components['schemas']['Principal']
export type Capability = components['schemas']['Capability']
export type AuthProvider = 'oidc' | 'dev' | 'none'
export type AuthStatus = 'loading' | 'anonymous' | 'authenticated' | 'expired' | 'error' | 'unconfigured' | 'demo'

export type AuthState = {
  provider: AuthProvider
  status: AuthStatus
  principal: Principal | null
  displayName: string | null
  error: string | null
}

export const AUTH_PROVIDER: AuthProvider = OIDC_CONFIGURED ? 'oidc' : Object.keys(DEV_TOKENS).length ? 'dev' : 'none'

let state: AuthState = {
  provider: AUTH_PROVIDER,
  status: DATA_MODE === 'demo' ? 'demo' : AUTH_PROVIDER === 'none' ? 'unconfigured' : 'loading',
  principal: null, displayName: null, error: null,
}
const listeners = new Set<() => void>()
const set = (patch: Partial<AuthState>) => { state = { ...state, ...patch }; listeners.forEach((l) => l()) }
export const getAuthState = () => state
export const useAuth = () => useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, getAuthState)
export const hasCapability = (cap: Capability) => state.principal?.kind === 'human' && state.principal.capabilities.includes(cap)

// ── dev provider (mock / development builds only) ────────────────────────
const DEV_KEY = 'cos_dev_session'
type DevSession = { role: string; token: string; expires_at: number }
const DEV_SESSION_MS = 60 * 60 * 1000
const readDev = (): DevSession | null => {
  try { const s = JSON.parse(sessionStorage.getItem(DEV_KEY) ?? 'null') as DevSession | null; return s && s.expires_at > Date.now() ? s : null } catch { return null }
}

// ── oidc provider ────────────────────────────────────────────────────────
let manager: UserManager | null = null
async function oidcManager(): Promise<UserManager> {
  if (manager) return manager
  const { UserManager, WebStorageStateStore } = await import('oidc-client-ts')
  manager = new UserManager({
    authority: OIDC.issuer!, client_id: OIDC.clientId!,
    redirect_uri: `${window.location.origin}/app/auth/callback`,
    post_logout_redirect_uri: `${window.location.origin}/app`,
    response_type: 'code', scope: OIDC.scope,
    extraQueryParams: OIDC.audience ? { audience: OIDC.audience } : undefined,
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),
    automaticSilentRenew: true,
  })
  manager.events.addAccessTokenExpired(() => set({ status: 'expired' }))
  manager.events.addSilentRenewError(() => set({ status: 'expired' }))
  return manager
}

async function currentToken(): Promise<string | null> {
  if (state.status === 'expired') return null
  if (AUTH_PROVIDER === 'dev') {
    const s = readDev()
    if (!s) { if (state.status === 'authenticated') set({ status: 'expired' }); return null }
    return s.token
  }
  if (AUTH_PROVIDER === 'oidc') {
    const user = await (await oidcManager()).getUser()
    return user && !user.expired ? user.access_token : null
  }
  return null
}

// Resolve the principal for the current token. 401 → expired/anonymous.
async function loadPrincipal(name: string | null) {
  try {
    const { getMe } = await import('../api/endpoints')
    const me = await getMe()
    set({ status: 'authenticated', principal: me, displayName: name ?? me.principal_id, error: null })
  } catch (e) {
    if (e instanceof ApiError && e.unauthenticated) set({ status: 'expired', principal: null })
    else set({ status: 'error', error: e instanceof ApiError ? `${e.code}: ${e.message}` : String(e) })
  }
}

let initialised = false
export async function initAuth() {
  if (initialised) return
  initialised = true
  setTokenProvider(currentToken)
  setUnauthenticatedHandler(() => { if (state.status === 'authenticated') set({ status: 'expired' }) })
  if (DATA_MODE === 'demo' || AUTH_PROVIDER === 'none') return
  if (AUTH_PROVIDER === 'dev') {
    const s = readDev()
    if (!s) return set({ status: 'anonymous' })
    return loadPrincipal(`${s.role} (mock identity)`)
  }
  // oidc: complete a redirect, or restore the session from sessionStorage
  const m = await oidcManager()
  if (window.location.pathname === '/app/auth/callback') {
    try {
      const user = await m.signinRedirectCallback()
      const returnTo = (user.state as { returnTo?: string } | undefined)?.returnTo ?? '/app'
      window.history.replaceState({}, '', safeReturnTo(returnTo))
      window.dispatchEvent(new PopStateEvent('popstate'))
      return loadPrincipal((user.profile.name as string) ?? (user.profile.email as string) ?? null)
    } catch (e) {
      return set({ status: 'error', error: `Sign-in failed: ${e instanceof Error ? e.message : String(e)}` })
    }
  }
  const user = await m.getUser()
  if (!user) return set({ status: 'anonymous' })
  if (user.expired) return set({ status: 'expired' })
  return loadPrincipal((user.profile.name as string) ?? (user.profile.email as string) ?? null)
}

// Only same-origin console paths are allowed as return targets (no open redirect).
export const safeReturnTo = (r: string | null | undefined) => (r && /^\/app(\/|$|\?)/.test(r) && !r.startsWith('//') ? r : '/app')

export async function signIn(opts: { returnTo?: string; devRole?: string } = {}) {
  const returnTo = safeReturnTo(opts.returnTo)
  if (AUTH_PROVIDER === 'dev') {
    const role = opts.devRole ?? Object.keys(DEV_TOKENS)[0]
    const token = DEV_TOKENS[role]
    if (!token) throw new Error(`unknown dev role ${role}`)
    sessionStorage.setItem(DEV_KEY, JSON.stringify({ role, token, expires_at: Date.now() + DEV_SESSION_MS }))
    set({ status: 'loading' })
    await loadPrincipal(`${role} (mock identity)`)
    window.history.pushState({}, '', returnTo)
    window.dispatchEvent(new PopStateEvent('popstate'))
    return
  }
  if (AUTH_PROVIDER === 'oidc') await (await oidcManager()).signinRedirect({ state: { returnTo } })
}

export async function signOut() {
  if (AUTH_PROVIDER === 'dev') {
    sessionStorage.removeItem(DEV_KEY)
    set({ status: 'anonymous', principal: null, displayName: null })
    window.history.pushState({}, '', '/app/sign-in')
    window.dispatchEvent(new PopStateEvent('popstate'))
    return
  }
  if (AUTH_PROVIDER === 'oidc') {
    set({ status: 'anonymous', principal: null, displayName: null })
    await (await oidcManager()).signoutRedirect()
  }
}
