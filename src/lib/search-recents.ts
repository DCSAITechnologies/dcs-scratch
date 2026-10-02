// ⌘K search recents + suggestions — browser-local only (localStorage), never server state.

const RECENT_KEY = 'cos_recent_searches'

export const POPULAR_SEARCHES = ['run_01J0AA11', 'ex_01J2P88', 'rc_01J2Q24', 'ap_01J1K71', 'stripe', 'shopify']
export const SUGGESTED = [
  { type: 'run', id: 'run_01J0AA11', label: 'ops-reconciler · refunds', env: 'Staging' },
  { type: 'execution', id: 'ex_01J2P88', label: 'shopify.orders.close · OUTCOME_UNKNOWN', env: 'Staging' },
  { type: 'receipt', id: 'rc_01J2Q24', label: 'ISSUED · orders.close', env: 'Staging' },
  { type: 'approval', id: 'ap_01J1K71', label: 'Pending · refunds.create', env: 'Staging' },
  { type: 'connection', id: 'cn_01HZX3A1', label: 'Stripe · ACTIVE', env: 'Staging' },
  { type: 'policy', id: 'pol_fin_refunds', label: 'Refunds above ₹5,000', env: 'Staging' },
]

export function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') } catch { return [] }
}
export function pushRecent(q: string) {
  const r = [q, ...getRecent().filter((x) => x !== q)].slice(0, 6)
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(r)) } catch { /* private mode */ }
}
