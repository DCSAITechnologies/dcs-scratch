// Four-state model (empty / loading / error / permission) driven by ?state= for previews.

export type RouteState = 'normal' | 'empty' | 'loading' | 'error' | 'permission'

export function currentRouteState(): RouteState {
  const q = new URLSearchParams(window.location.search).get('state')
  return q === 'empty' || q === 'loading' || q === 'error' || q === 'permission' ? q : 'normal'
}
