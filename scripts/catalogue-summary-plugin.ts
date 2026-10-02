// Vite plugin: `virtual:catalogue-summary`.
// Light pages (nav, footer, home, product, enterprise, developer/company copy,
// status) need only counts and a handful of featured rows. Importing the full
// catalogue JSON (2.3 MB with legacy) for that put it in every page's entry chunk.
// This module is computed from the same JSON at build/dev time, so counts can
// never drift from the data, and featured ids are validated (published canonical
// rows only) — an unknown or HOLD id fails the build.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Plugin } from 'vite'

const ID = 'virtual:catalogue-summary'
const RESOLVED = '\0' + ID

type Row = { id: string; n: string; p: string; cat: string; s: string; auth: string; logo: string; d: string; r: number; caps: string[]; unpublished?: boolean; runtime_status?: string }

export function catalogueSummary(root: string): Plugin {
  const lib = join(root, 'src', 'lib')
  const files = ['connectors.json', 'connectors-legacy.json', 'featured.json'].map((f) => join(lib, f))
  return {
    name: 'catalogue-summary',
    resolveId(id) { return id === ID ? RESOLVED : null },
    load(id) {
      if (id !== RESOLVED) return null
      files.forEach((f) => this.addWatchFile(f))
      const canonical: Row[] = JSON.parse(readFileSync(files[0], 'utf8'))
      const legacy: Row[] = JSON.parse(readFileSync(files[1], 'utf8'))
      const featured: Record<string, string[] | string> = JSON.parse(readFileSync(files[2], 'utf8'))
      const byId = new Map(canonical.map((c) => [c.id, c]))
      const rows: Record<string, Pick<Row, 'id' | 'n' | 'p' | 'cat' | 's' | 'auth' | 'logo' | 'd' | 'r' | 'caps'>> = {}
      const lists: Record<string, string[]> = {}
      for (const [key, ids] of Object.entries(featured)) {
        if (key.startsWith('_')) continue
        for (const id of ids as string[]) {
          const c = byId.get(id)
          if (!c) this.error(`featured.json ${key}: "${id}" is not a canonical connector`)
          if (c.unpublished) this.error(`featured.json ${key}: "${id}" is unpublished (HOLD) and must not be featured`)
          rows[id] = { id: c.id, n: c.n, p: c.p, cat: c.cat, s: c.s, auth: c.auth, logo: c.logo, d: c.d, r: c.r, caps: c.caps.slice(0, 2) }
        }
        lists[key] = ids as string[]
      }
      const published = canonical.filter((c) => !c.unpublished).length
      const summary = {
        TOTAL_CATALOGUED: canonical.length,
        PUBLISHED_COUNT: published,
        UNPUBLISHED_COUNT: canonical.length - published,
        RUNTIME_VERIFIED_COUNT: canonical.filter((c) => c.runtime_status && c.runtime_status !== 'not_verified').length,
        LEGACY_REFERENCE_COUNT: legacy.length,
      }
      return [
        ...Object.entries(summary).map(([k, v]) => `export const ${k} = ${JSON.stringify(v)}`),
        `export const FEATURED_ROWS = ${JSON.stringify(rows)}`,
        `export const FEATURED = ${JSON.stringify(lists)}`,
      ].join('\n')
    },
  }
}
