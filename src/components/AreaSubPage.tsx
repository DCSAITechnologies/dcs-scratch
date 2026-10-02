import { use } from 'react'
import { areaLoader, type Pages } from '../lib/subpage-areas'
import { SubPageLayout } from './SubPageLayout'
import { NotFound } from './NotFound'

// one promise per area module, cached for the session so React's use() can suspend
// on it without recreating anything during render
const cache = new Map<() => Promise<Pages>, Promise<Pages>>()
function pagesFor(route: string): Promise<Pages> {
  const load = areaLoader(route)!
  let p = cache.get(load)
  if (!p) { p = load(); cache.set(load, p) }
  return p
}

export function AreaSubPage({ route }: { route: string }) {
  const pages = use(pagesFor(route))
  return pages[route] ? <SubPageLayout page={pages[route]} current={route} /> : <NotFound />
}
