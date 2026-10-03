// Import-closure check for a merged Connector OS core tree (Interface Pack + Runtime Supplement).
// Usage: node scripts/core-import-closure.mjs <tree> <entry.mjs> [...]  — lists unresolved relative/workspace imports and external npm deps.
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
const ROOT = process.argv[2]; const entries = process.argv.slice(3)
// workspace package map
const pk = {}
for (const base of ['packages', 'devex']) for (const d of readdirSync(join(ROOT, base))) {
  const p = join(ROOT, base, d, 'package.json'); if (existsSync(p)) { const j = JSON.parse(readFileSync(p)); pk[j.name] = { dir: join(ROOT, base, d), j } }
}
const seen = new Set(), missing = new Map(), external = new Map()
const re = /(?:import|export)\s[^'"`;]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]|readFileSync\(\s*new URL\(\s*['"]([^'"]+)['"]/g
function resolveFile(p) { for (const c of [p, p + '.mjs', p + '.js', join(p, 'index.mjs'), join(p, 'index.js')]) if (existsSync(c) && statSync(c).isFile()) return c; return null }
function pkgEntry(name, sub) {
  const P = pk[name]; if (!P) return undefined
  const ex = P.j.exports
  if (sub) { const key = './' + sub; let t = ex && (ex[key] ?? ex[key + '.mjs']); if (t && typeof t === 'object') t = t.import ?? t.default; return resolveFile(join(P.dir, t ?? sub)) ?? join(P.dir, t ?? sub) }
  let t = ex ? (typeof ex === 'string' ? ex : ex['.']) : P.j.main; if (t && typeof t === 'object') t = t.import ?? t.default
  return resolveFile(join(P.dir, t ?? 'index.mjs')) ?? join(P.dir, t ?? 'index.mjs')
}
function walk(f, from) {
  if (seen.has(f)) return; seen.add(f)
  if (!/\.(mjs|js|cjs)$/.test(f)) return
  const src = readFileSync(f, 'utf8')
  for (const m of src.matchAll(re)) {
    const s = m[1] ?? m[2] ?? m[3] ?? m[4]
    if (m[4]) { const t = resolve(dirname(f), s); if (!existsSync(t)) missing.set(t, f); else seen.add(t); continue }
    if (s.startsWith('node:') ) continue
    if (s.startsWith('.') || s.startsWith('/')) { const r = resolveFile(resolve(dirname(f), s)); if (!r) missing.set(resolve(dirname(f), s), f); else walk(r, f); continue }
    const parts = s.split('/'); const name = s.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]; const sub = parts.slice(s.startsWith('@') ? 2 : 1).join('/')
    const e = pkgEntry(name, sub)
    if (e === undefined) { if (!external.has(name)) external.set(name, f); continue }
    if (!existsSync(e)) missing.set(`${s} -> ${e}`, f); else walk(e, f)
  }
}
for (const e of entries) walk(resolve(ROOT, e))
console.log('files reached', seen.size)
if (process.env.LIST_REACHED) for (const f of seen) console.log('  REACHED', f.replace(ROOT + '/', ''))
console.log('EXTERNAL', [...external].map(([k, v]) => `${k} (first ${v.replace(ROOT + '/', '')})`).join('\n  '))
console.log('MISSING', missing.size); for (const [k, v] of missing) console.log('  ', k.replace(ROOT + '/', ''), '<=', v.replace(ROOT + '/', ''))
