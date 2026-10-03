#!/usr/bin/env node
// Real brand logos for connector cards (vector, in brand colour), chosen conservatively.
//
// Sources (both CC0; the marks remain their owners' trademarks, used to identify the integration):
//   @iconify-json/logos — full-colour brand logos (prefer the square "-icon" marks)
//   simple-icons        — single-colour brand marks with the official brand hex
//
// Rules (a wrong logo is worse than a monogram):
//   1. The existing website logo (fetched from the provider's official domain) is kept, unless an
//      exact iconify "<id>-icon" mark exists for the connector id or its exact name — a crisper
//      vector of the same brand.
//   2. A connector with NO logo gets: an exact iconify match on id/name (square marks only), else a
//      simple-icons mark whose own source domain matches the connector's website domain.
//   3. Anything else keeps what it has (or the monogram fallback).
//
// Writes public/logos/brand/<id>.svg and src/lib/logo-map.json; `npm run sync:catalogue` applies the
// map. Review: audit/LOGO_SOURCES.md lists every replacement and its source.
//   node scripts/build-logos.mjs            (then npm run sync:catalogue)
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'public', 'logos', 'brand')
const MAP = join(ROOT, 'src', 'lib', 'logo-map.json')
const REPORT = join(ROOT, 'audit', 'LOGO_SOURCES.md')

const iconify = JSON.parse(readFileSync(join(ROOT, 'node_modules/@iconify-json/logos/icons.json'), 'utf8'))
const si = JSON.parse(readFileSync(join(ROOT, 'node_modules/simple-icons/data/simple-icons.json'), 'utf8'))
const siSlug = (title) => title.toLowerCase().replace(/\+/g, 'plus').replace(/^\./, 'dot-').replace(/&/g, 'and').replace(/[^a-z0-9]/g, '')
const rows = [
  ...JSON.parse(readFileSync(join(ROOT, 'src/lib/connectors.json'), 'utf8')),
  ...JSON.parse(readFileSync(join(ROOT, 'src/lib/connectors-legacy.json'), 'utf8')),
]

const norm = (s) => s.toLowerCase().replace(/\(.*?\)/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
// registrable domain, treating two-level public suffixes (ifood.com.br, x.co.uk) correctly
const domain = (u) => {
  try {
    const parts = new URL(u).hostname.replace(/^www\./, '').split('.')
    const two = parts.length > 2 && parts.at(-1).length === 2 && ['com', 'co', 'org', 'net', 'gov', 'ac', 'edu'].includes(parts.at(-2))
    return parts.slice(two ? -3 : -2).join('.')
  } catch { return null }
}
// reviewed same-name collisions: the logo set's mark is a different product
// (logos:mono = the Mono .NET runtime, not mono.co; logos:daily* is not Daily.co)
const DENY = new Set(['mono', 'daily'])
// reviewed aliases: the logo set files these under a different key (same product)
const ALIAS = { gmail: 'google-gmail' }

function pngSize(p) {
  try {
    const b = readFileSync(p)
    if (b.readUInt32BE(0) === 0x89504e47) return Math.min(b.readUInt32BE(16), b.readUInt32BE(20))
  } catch { /* missing */ }
  return null
}
function existingQuality(logo) {
  if (!logo) return 'none'
  const p = join(ROOT, 'public', logo.replace(/^\//, ''))
  if (!existsSync(p)) return 'none'
  if (p.endsWith('.svg')) return 'vector'
  const s = pngSize(p)
  return s !== null && s < 64 ? 'low' : 'raster'
}

function iconifySvg(key) {
  const name = iconify.aliases?.[key]?.parent ?? key
  const icon = iconify.icons[name]
  if (!icon) return null
  const w = icon.width ?? iconify.width, h = icon.height ?? iconify.height
  if (w / h > 1.34 || h / w > 1.34) return null // wordmarks look tiny in a square tile
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.left ?? 0} ${icon.top ?? 0} ${w} ${h}">${icon.body}</svg>`
}

function simpleIcon(row) {
  const site = domain(row.site)
  if (!site) return null
  const want = new Set([norm(row.n), norm(row.id)])
  for (const ic of si) {
    const names = [ic.title, ...(ic.aliases?.aka ?? [])].map(norm)
    if (!names.some((n) => want.has(n))) continue
    if (domain(ic.source) !== site && domain(ic.guidelines) !== site) continue // the brand's own site must agree
    const file = join(ROOT, 'node_modules/simple-icons/icons', `${ic.slug ?? siSlug(ic.title)}.svg`)
    if (!existsSync(file)) continue
    return { svg: readFileSync(file, 'utf8').replace('<svg ', `<svg fill="#${ic.hex}" `), source: `simple-icons:${ic.slug ?? siSlug(ic.title)} (#${ic.hex}, source ${domain(ic.source)})` }
  }
  return null
}

rmSync(OUT_DIR, { recursive: true, force: true })
mkdirSync(OUT_DIR, { recursive: true })
const map = {}
const report = []
for (const row of rows) {
  if (DENY.has(row.id)) continue
  const editorial = row.logo_editorial ?? row.logo ?? ''
  const q = existingQuality(editorial)
  const keys = [...new Set([norm(row.id), norm(row.n)])].filter((k) => k.length >= 3)
  let pick = null
  if (ALIAS[row.id]) {
    const svg = iconifySvg(ALIAS[row.id])
    if (svg) pick = { svg, source: `iconify logos:${ALIAS[row.id]} (reviewed alias)` }
  }
  for (const k of pick ? [] : keys) {
    const svg = iconifySvg(`${k}-icon`)
    if (svg) { pick = { svg, source: `iconify logos:${k}-icon` }; break }
  }
  if (!pick && q === 'none') {
    for (const k of keys) {
      const svg = iconifySvg(k)
      if (svg) { pick = { svg, source: `iconify logos:${k}` }; break }
    }
    // a few providers file their product marks under the parent brand
    const parent = norm(row.p ?? '')
    if (!pick && ['google', 'microsoft', 'aws', 'amazon', 'atlassian', 'adobe'].includes(parent)) {
      for (const k of keys) {
        const svg = iconifySvg(`${parent}-${k.replace(new RegExp(`^${parent}-`), '')}`)
        if (svg) { pick = { svg, source: `iconify logos:${parent}-${k.replace(new RegExp(`^${parent}-`), '')}` }; break }
      }
    }
    if (!pick) pick = simpleIcon(row)
  }
  if (!pick) continue
  writeFileSync(join(OUT_DIR, `${row.id}.svg`), pick.svg)
  map[row.id] = { src: `/logos/brand/${row.id}.svg`, source: pick.source }
  report.push(`| \`${row.id}\` | ${row.n} | ${q === 'none' ? 'none' : editorial} | ${pick.source} |`)
}
writeFileSync(MAP, JSON.stringify(map, null, 1) + '\n')
// published canonical rows that still have no logo at all (they render a tinted monogram)
const canonical = JSON.parse(readFileSync(join(ROOT, 'src/lib/connectors.json'), 'utf8'))
const missing = canonical.filter((c) => !c.unpublished && !map[c.id] && existingQuality(c.logo_editorial ?? c.logo) === 'none')
writeFileSync(REPORT, [
  '# Connector logo sources',
  '',
  'Generated by `scripts/build-logos.mjs`. Brand marks come from **@iconify-json/logos** and **simple-icons** (both CC0). The marks remain their owners\' trademarks and are used only to identify each integration.',
  '',
  'Rules: the website logo (from the provider\'s official domain) is kept unless an exact `<id>-icon` mark exists. A connector with no logo gets an exact-name vector mark (square marks only) or a simple-icons mark whose source domain matches the connector\'s website. Otherwise it keeps a monogram.',
  '',
  `Replacements: **${report.length}** of ${rows.length} rows (canonical + legacy).`,
  '',
  '| id | name | previous | brand source |',
  '|---|---|---|---|',
  ...report.sort(),
  '',
  `## Published connectors still on a monogram (${missing.length})`,
  '',
  'No logo in the website data and no safe vector match. Supply an official logo (SVG preferred) as `public/logos/<id>.svg` and set it in the editorial record, or allow network access so logos can be fetched from each official site.',
  '',
  '| id | name | website |',
  '|---|---|---|',
  ...missing.map((c) => `| \`${c.id}\` | ${c.n} | ${c.site || '—'} |`),
  '',
].join('\n'))
console.log(`logos: ${report.length} brand marks written to public/logos/brand/; map at src/lib/logo-map.json`)
