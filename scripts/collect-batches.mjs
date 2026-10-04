// Merge research batch returns into one ingest part, checking every link first.
//   node scripts/collect-batches.mjs            # needs internet: opens every URL
//   node scripts/collect-batches.mjs --no-check  # merge only (links unchecked: not for a real ingest)
// Input:  data-sourcing/batches/returns/batch-*.jsonl (+ returns/logos/*)
// Output: data-sourcing/returns/part-7/records.jsonl (+ logos), LINK_CHECK.md
// A URL that does not answer 200 (after redirects) is removed from its record and listed under
// notFound, so an invented link (common with chat assistants) never reaches the catalogue.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const B = 'data-sourcing/batches/returns'
const OUT = 'data-sourcing/returns/part-7'
const check = !process.argv.includes('--no-check')
const LINK_FIELDS = ['site', 'portal', 'api', 'authDocs', 'whDocs', 'statusUrl']

const files = existsSync(B) ? readdirSync(B).filter((f) => /^batch-\d+\.jsonl$/.test(f)).sort() : []
const recs = new Map()
const errors = []
for (const f of files) {
  readFileSync(join(B, f), 'utf8').split('\n').forEach((line, i) => {
    if (!line.trim()) return
    try {
      const r = JSON.parse(line)
      if (!r.id) throw new Error('no id')
      recs.set(r.id, { ...(recs.get(r.id) || {}), ...r, _from: f }) // a later batch wins per field
    } catch (e) { errors.push(`${f}:${i + 1} ${e.message}`) }
  })
}

async function ok(url) {
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(20000), headers: { 'user-agent': 'Mozilla/5.0 (link check)' } })
    return res.status
  } catch (e) { return `error: ${e.cause?.code || e.name}` }
}

const report = []
for (const r of recs.values()) {
  const urls = new Map()
  for (const k of LINK_FIELDS) if (typeof r[k] === 'string') urls.set(k, r[k])
  for (const [k, v] of Object.entries(r.evidence || {})) if (typeof v === 'string') urls.set(`evidence.${k}`, v)
  if (r.logo?.source) urls.set('logo.source', r.logo.source)
  if (!check) continue
  for (const [field, url] of urls) {
    const status = await ok(url)
    if (status === 200) continue
    report.push(`| ${r.id} | ${field} | ${url} | ${status} |`)
    r.notFound = [...new Set([...(r.notFound || []), field.split('.').pop()])]
    if (field.startsWith('evidence.')) delete r.evidence[field.slice(9)]
    else if (field === 'logo.source') delete r.logo
    else delete r[field]
  }
}

mkdirSync(join(OUT, 'logos'), { recursive: true })
if (existsSync(join(B, 'logos'))) for (const f of readdirSync(join(B, 'logos'))) copyFileSync(join(B, 'logos', f), join(OUT, 'logos', f))
writeFileSync(join(OUT, 'records.jsonl'), [...recs.values()].map(({ _from, ...r }) => JSON.stringify(r)).join('\n') + '\n')
writeFileSync('data-sourcing/batches/LINK_CHECK.md', [
  '# Batch link check', '', check ? `Every URL in ${recs.size} records was opened; the ones below did not answer 200 and were removed (moved to notFound).` : '**Links were NOT checked (--no-check).** Do not ingest this for real.', '',
  '| Connector | Field | URL | Answer |', '|---|---|---|---|', ...(report.length ? report : ['| — | — | — | all links answered 200 |']),
  '', errors.length ? `Unreadable lines: ${errors.join('; ')}` : 'All lines parsed.',
].join('\n') + '\n')
console.log(`${files.length} batch files, ${recs.size} records -> ${OUT}; ${report.length} links removed; ${errors.length} bad lines`)
console.log('next: python3 scripts/ingest-sourced-data.py && npm run sync:catalogue')
