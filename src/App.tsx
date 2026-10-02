import type React from 'react'
import { Nav } from './components/Nav'
import { Footer } from './components/Footer'
import { usePathRoute, navigate } from './hooks/usePathRoute'
import { Home } from './pages/Home'
import { Connectors } from './pages/Connectors'
import { ConnectorDetail } from './pages/ConnectorDetail'
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
import { AGENT_PAGES } from './lib/subpages-agents'
import { SECURITY_PAGES } from './lib/subpages-security'
import { ENTERPRISE_PAGES } from './lib/subpages-enterprise'
import { DEVELOPER_PAGES } from './lib/subpages-developers'
import { COMPANY_PAGES } from './lib/subpages-company'
import { DashApp } from './pages/dash'

function NotFound() {
  return (
    <div className="pt-36 pb-28 text-center px-8">
      <div className="eyebrow mb-4">404</div>
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">This page is not on the map.</h1>
      <p className="mt-4 text-[14px] text-[#A9B6D3] max-w-md mx-auto">The route you asked for does not exist. Everything that does exist is listed below.</p>
      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <a href="/" className="cta-primary">Home</a>
        <a href="/connectors" className="cta-secondary">Connector catalogue</a>
        <a href="/developers/status" className="cta-secondary">Build status</a>
      </div>
    </div>
  )
}

const ALL_SUBPAGES = { ...SUBPAGES, ...AGENT_PAGES, ...SECURITY_PAGES, ...ENTERPRISE_PAGES, ...DEVELOPER_PAGES, ...COMPANY_PAGES }

export default function App() {
  const route = usePathRoute()

  // Dashboard console (Track C) — own shell, no public Nav/Footer.
  if (route.startsWith('/app')) {
    return <DashApp path={route} />
  }

  let page: React.ReactElement
  if (route.startsWith('/connectors/')) {
    page = <ConnectorDetail id={route.replace('/connectors/', '')} />
  } else if (ALL_SUBPAGES[route]) {
    page = <SubPageLayout page={ALL_SUBPAGES[route]} current={route} />
  } else {
    switch (route) {
      case '/product': page = <Product />; break
      case '/connectors': page = <Connectors />; break
      case '/agents': page = <Agents />; break
      case '/security': page = <Security />; break
      case '/receipts': page = <Receipts />; break
      case '/enterprise': page = <Enterprise />; break
      case '/pricing': page = <Pricing />; break
      case '/developers': page = <Developers />; break
      case '/docs': navigate('/developers'); page = <Developers />; break
      case '/signin': page = <SignIn />; break
      case '/': page = <Home />; break
      default: page = <NotFound />
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#060A16' }}>
      <Nav />
      <main>{page}</main>
      <Footer />
    </div>
  )
}
