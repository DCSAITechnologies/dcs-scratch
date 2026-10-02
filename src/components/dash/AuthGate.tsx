// Guards every /app route. Data mode and identity decide what renders:
//   demo                     → console on fixtures, DEMO banner (no auth exists to gate)
//   api + no IdP configured  → blocked: "sign-in not configured", no data requested
//   api + anonymous          → sign-in screen (deep link kept as returnTo)
//   api + expired            → "session expired" screen, sign in again → same page
//   api + authenticated      → console
// Route-level hiding is not the security boundary: the API rejects any request
// without a valid credential (401) or capability (403). This gate is UX on top.

import { useEffect, type ReactNode } from 'react'
import { AUTH_PROVIDER, initAuth, signIn, useAuth, safeReturnTo } from '../../lib/auth/session'
import { DEV_TOKENS, apiHost } from '../../lib/api/config'

function Screen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#070B18' }}>
      <main className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0C1330]/90 p-7">
        <div className="flex items-center gap-2 mb-5">
          <span className="w-6 h-6 rounded-full" style={{ background: 'conic-gradient(from 210deg, #5A7BFF, #8B5CF6, #5A7BFF)' }} aria-hidden="true" />
          <span className="text-[13px] font-semibold text-white">Connector OS Console</span>
        </div>
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        <div className="mt-3 text-[13px] leading-relaxed text-[#A9B6D3] space-y-4">{children}</div>
      </main>
    </div>
  )
}

const btn = 'w-full px-4 py-2.5 rounded-lg text-[13px] font-semibold text-white bg-[#3B5BDB] hover:bg-[#4C6EF5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9FB8FF]'

export function SignInPanel({ returnTo }: { returnTo: string }) {
  return (
    <Screen title="Sign in to the console">
      <p>Connected API: <span className="font-mono text-[12px] text-[#D6E1FF]">{apiHost()}</span></p>
      {AUTH_PROVIDER === 'oidc' && (
        <button type="button" className={btn} onClick={() => signIn({ returnTo })}>Sign in with your organisation</button>
      )}
      {AUTH_PROVIDER === 'dev' && (
        <>
          <p className="rounded-lg border border-[#F5A524]/30 bg-[#F5A524]/[0.06] px-3 py-2 text-[12px] text-[#E8C98A]">
            Development build: mock identities for the local mock API. A production build never offers this.
          </p>
          {Object.keys(DEV_TOKENS).map((role) => (
            <button key={role} type="button" className={btn} onClick={() => signIn({ returnTo, devRole: role })}>Sign in as {role} (mock)</button>
          ))}
        </>
      )}
    </Screen>
  )
}

export function AuthGate({ path, children }: { path: string; children: ReactNode }) {
  const auth = useAuth()
  useEffect(() => { void initAuth() }, [])
  const returnTo = safeReturnTo(path === '/app/sign-in' ? new URLSearchParams(window.location.search).get('returnTo') : path + window.location.search)

  if (auth.status === 'demo') return <>{children}</>
  if (auth.status === 'unconfigured') {
    return (
      <Screen title="Sign-in is not configured">
        <p>This console is connected to an API (<span className="font-mono text-[12px]">{apiHost()}</span>) but no identity provider is configured, so it will not load any data.</p>
        <p className="text-[12px] text-[#93A0C2]">Set <span className="font-mono">VITE_OIDC_ISSUER</span> and <span className="font-mono">VITE_OIDC_CLIENT_ID</span> for this build.</p>
      </Screen>
    )
  }
  if (auth.status === 'loading' || path === '/app/auth/callback') return <Screen title="Signing in…"><p role="status">Checking your session.</p></Screen>
  if (auth.status === 'error') {
    return (
      <Screen title="Could not start your session">
        <p role="alert">{auth.error}</p>
        <button type="button" className={btn} onClick={() => window.location.reload()}>Retry</button>
      </Screen>
    )
  }
  if (auth.status === 'expired') {
    return (
      <Screen title="Your session expired">
        <p>Sign in again to continue where you left off. Nothing was changed.</p>
        <button type="button" className={btn} onClick={() => signIn({ returnTo })}>Sign in again</button>
      </Screen>
    )
  }
  if (auth.status === 'anonymous') return <SignInPanel returnTo={returnTo} />
  // authenticated — leave the sign-in page for where the user was going
  if (path === '/app/sign-in') { window.history.replaceState({}, '', returnTo); window.dispatchEvent(new PopStateEvent('popstate')) }
  return <>{children}</>
}
