// Test-side view of the catalogue, read from the same JSON the app bundles, so
// every expected count is derived — never typed into a test.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

type Row = {
  id: string; n: string; p: string; r: number; cat: string; d: string; s: string
  unpublished?: boolean; alias_of?: string | null
  lane6_behavior?: string; lane6_redirect_to?: string | null
}

const lib = join(process.cwd(), 'src', 'lib')
export const CANONICAL: Row[] = JSON.parse(readFileSync(join(lib, 'connectors.json'), 'utf8'))
export const LEGACY: Row[] = JSON.parse(readFileSync(join(lib, 'connectors-legacy.json'), 'utf8'))
export const PUBLISHED = CANONICAL.filter((c) => !c.unpublished)
export const HOLD = CANONICAL.filter((c) => c.unpublished)
export const ALIASES = CANONICAL.filter((c) => c.alias_of)
export const legacy = (id: string) => LEGACY.find((c) => c.id === id)
// mirrors the app's search: name, provider or id
export const matches = (c: Row, q: string) => c.n.toLowerCase().includes(q) || c.p.toLowerCase().includes(q) || c.id.includes(q)
