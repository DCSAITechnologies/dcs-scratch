import type { SubPage } from './subpages'

// Long-form subpage copy is ~220 KB; each area module loads only when one of its
// routes is visited. Product subpages stay in the entry (they share the module
// that defines the area navigation).
export type Pages = Record<string, SubPage>
const COMPANY = ['/about', '/contact', '/privacy', '/terms']
const LOADERS: [(r: string) => boolean, () => Promise<Pages>][] = [
  [(r) => r.startsWith('/agents/'), () => import('./subpages-agents').then((m) => m.AGENT_PAGES)],
  [(r) => r.startsWith('/security/'), () => import('./subpages-security').then((m) => m.SECURITY_PAGES)],
  [(r) => r.startsWith('/enterprise/'), () => import('./subpages-enterprise').then((m) => m.ENTERPRISE_PAGES)],
  [(r) => r.startsWith('/developers/'), () => import('./subpages-developers').then((m) => m.DEVELOPER_PAGES)],
  [(r) => COMPANY.includes(r), () => import('./subpages-company').then((m) => m.COMPANY_PAGES)],
]

export const areaLoader = (route: string) => LOADERS.find(([match]) => match(route))?.[1]
