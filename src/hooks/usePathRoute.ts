import { useEffect, useState } from 'react'

// History-API routing (Completion Spec B2 / gate G13).
// Static pre-render writes one HTML per route; this hook drives client-side nav.

export function navigate(to: string) {
  if (to.startsWith('#')) to = to.slice(1)
  if (to === window.location.pathname + window.location.search) return
  window.history.pushState({}, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo({ top: 0 })
}

const currentLocation = () => (window.location.pathname || '/') + window.location.search

// Returns the pathname. The query string is tracked too, so a navigation that only
// changes ?q= / ?cat= still re-renders (pages key on window.location.search).
export function usePathRoute(): string {
  const [loc, setLoc] = useState(currentLocation)
  useEffect(() => {
    const onPop = () => { setLoc(currentLocation()); window.scrollTo({ top: 0 }) }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  return loc.split('?')[0]
}

// Global interceptor: internal <a href="/…"> navigates client-side, no reload.
export function installLinkInterceptor() {
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest?.('a[href]') as HTMLAnchorElement | null
    if (!a) return
    const href = a.getAttribute('href') || ''
    if (a.target === '_blank' || href.startsWith('http') || href.startsWith('mailto:')) return
    if (href.startsWith('/')) { e.preventDefault(); navigate(href) }
    else if (href.startsWith('#/')) { e.preventDefault(); navigate(href.slice(1)) }
  })
}
