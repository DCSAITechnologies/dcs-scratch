// Hosted preview of the website + demo console as one claude.ai artifact (no Cloudflare needed).
//   node scripts/build-preview-artifact.mjs <outDir>
// The frame cannot change its URL or serve 1,000+ files, so this build routes in memory
// (VITE_MEMORY_ROUTER) and ships the logos as one JSON map of data URIs (VITE_LOGO_BUNDLE).
// Demo mode only: no API URL, no tokens; the console shows its DEMO banner.
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { extname, join } from 'node:path'

const out = process.argv[2]
if (!out) throw new Error('usage: node scripts/build-preview-artifact.mjs <outDir>')
const build = 'dist-artifact'
const env = { ...process.env, VITE_MEMORY_ROUTER: '1', VITE_LOGO_BUNDLE: '1' }
for (const k of Object.keys(env)) if (k.startsWith('VITE_COS_') || k.startsWith('VITE_OIDC_')) delete env[k]
execFileSync('npx', ['vite', 'build', '--base', './', '--outDir', build, '--emptyOutDir'], { stdio: 'inherit', env })

// logos referenced by any catalogue row, as data URIs keyed by their site path
const rows = [...JSON.parse(readFileSync('src/lib/connectors.json', 'utf8')), ...JSON.parse(readFileSync('src/lib/connectors-legacy.json', 'utf8'))]
const mime = { '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon' }
const logos = {}
for (const r of rows) {
  const p = r.logo && join('public', r.logo)
  if (!p || logos[r.logo] || !existsSync(p) || !mime[extname(p).toLowerCase()]) continue
  logos[r.logo] = `data:${mime[extname(p).toLowerCase()]};base64,${readFileSync(p).toString('base64')}`
}

// the artifact wraps the page in its own document skeleton: keep head links + body content only
const html = readFileSync(join(build, 'index.html'), 'utf8')
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1]
  .replace(/<meta charset[^>]*>|<meta name="viewport"[^>]*>/g, '')
  .replace(/<title>[\s\S]*?<\/title>/, '<title>Connector OS Preview</title>')
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1]
rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
writeFileSync(join(out, 'index.html'), `${head.trim()}\n<style>html,body{background:#F5F6F8;margin:0}</style>\n${body.trim()}\n`)
cpSync(join(build, 'assets'), join(out, 'assets'), { recursive: true })
writeFileSync(join(out, 'logos.json'), JSON.stringify(logos))
const files = readdirSync(join(out, 'assets'))
console.log(`preview artifact: ${out} (index.html, ${files.length} assets, ${Object.keys(logos).length} logos, ${(JSON.stringify(logos).length / 1e6).toFixed(1)} MB logo bundle)`)
