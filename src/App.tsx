import { lazy, Suspense, useLayoutEffect, type ReactElement } from 'react'
import { Nav } from './components/Nav'
import { Footer } from './components/Footer'
import { usePathRoute, navigate, locSearch } from './hooks/usePathRoute'
import { useConsoleTheme } from './lib/console-theme'
import { Home } from './pages/Home'
import { Product } from './pages/Product'
import { Agents } from './pages/Agents'
import { Security } from './pages/Security'
import { Receipts } from './pages/Receipts'
import { Enterprise } from './pages/Enterprise'
import { Pricing } from './pages/Pricing'
import { Developers } from './pages/Developers'
import { SignIn } from './pages/SignIn'
import { SubPageLayout } from './components/SubPageLayout'
import { SUBPAGES } from './lib/subpages'
import { NotFound } from './components/NotFound'
import { AreaSubPage } from './components/AreaSubPage'
import { areaLoader } from './lib/subpage-areas'

// Route-level code splitting: the catalogue pages carry the 2 MB connector JSON and
// the console carries its fixtures and screens; marketing pages load neither.
const loadConnectors = () => import('./pages/Connectors')
const Connectors = lazy(() => loadConnectors().then((m) => ({ default: m.Connectors })))
// fetch the catalogue chunk once the page is idle, or as soon as a catalogue link is hovered or
// touched, so "Explore the catalogue" opens without a loading step
if (typeof window !== 'undefined') {
  const warm = () => { void loadConnectors() }
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void }).requestIdleCallback
  if (idle) idle(warm, { timeout: 4000 }); else setTimeout(warm, 2000)
  const onIntent = (e: Event) => {
    if ((e.target as HTMLElement).closest?.('a[href^="/connectors"]')) warm()
  }
  document.addEventListener('pointerover', onIntent, { passive: true })
  document.addEventListener('touchstart', onIntent, { passive: true })
}
const ConnectorDetail = lazy(() => import('./pages/ConnectorDetail').then((m) => ({ default: m.ConnectorDetail })))
const DashApp = lazy(() => import('./pages/dash').then((m) => ({ default: m.DashApp })))
// Founder-review hero concepts (noindex; not linked from the site)
const HeroPreview = lazy(() => import('./pages/preview/HeroConcepts').then((m) => ({ default: m.HeroPreview })))

function RouteLoading({ console: inConsole = false }: { console?: boolean }) {
  return (
    <div role="status" aria-live="polite" className={inConsole ? 'console min-h-screen pt-24 text-center text-[13px] text-[var(--c-muted)]' : 'pt-36 pb-28 text-center text-[13px] text-[#566074]'}>
      Loading…
    </div>
  )
}



export default function App() {
  const route = usePathRoute()
  // the public website is light; the console is dark by default, light on request
  const consoleTheme = useConsoleTheme()
  const theme = route.startsWith('/app') ? consoleTheme : 'light'
  useLayoutEffect(() => { document.documentElement.dataset.theme = theme }, [theme])

  // Dashboard console (Track C) — own shell, no public Nav/Footer.
  if (route.startsWith('/app')) {
    return <Suspense fallback={<RouteLoading console />}><DashApp path={route} /></Suspense>
  }

  if (/^\/preview\/(heroes|hero-[abc])\/?$/.test(route)) {
    return <Suspense fallback={<RouteLoading />}><HeroPreview route={route} /></Suspense>
  }

  let page: ReactElement
  if (route.startsWith('/connectors/')) {
    page = <ConnectorDetail id={route.replace('/connectors/', '')} />
  } else if (SUBPAGES[route]) {
    page = <SubPageLayout page={SUBPAGES[route]} current={route} />
  } else if (areaLoader(route)) {
    // agents / security / enterprise / developers / company copy loads per area
    page = <AreaSubPage route={route} />
  } else {
    switch (route) {
      case '/product': page = <Product />; break
      case '/connectors': page = <Connectors key={locSearch()} />; break
      case '/agents': page = <Agents />; break
      case '/security': page = <Security />; break
      case '/receipts': page = <Receipts />; break
      case '/enterprise': page = <Enterprise />; break
      case '/pricing': page = <Pricing />; break
      case '/developers': page = <Developers />; break
      case '/docs': navigate('/developers'); page = <Developers />; break
      case '/signin': page = <SignIn />; break
      case '/': page = <Home />; break
      case '/preview/home': navigate('/'); page = <Home />; break // the demo became the homepage
      default: page = <NotFound />
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#F5F6F8', color: '#0B1220' }}>
      <Nav theme="light" />
      <main><Suspense fallback={<RouteLoading />}>{page}</Suspense></main>
      <Footer />
    </div>
  )
}
