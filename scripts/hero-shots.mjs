// Renders the HERO-A/B/C concept stills for founder review into audit/hero/.
// Usage: npm run build && npm run prerender && node scripts/hero-shots.mjs  (serves dist on :4319)
import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'

const PORT = 4319
const BASE = `http://127.0.0.1:${PORT}`
const LAST = { a: 4, b: 4, c: 3 }
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { stdio: 'ignore' })
const wait = async () => { for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE)).ok) return } catch { /* not up yet */ } await new Promise((r) => setTimeout(r, 500)) } throw new Error('preview server did not start') }

try {
  await wait()
  const browser = await chromium.launch()
  const shot = async (url, file, viewport, opts = {}) => {
    const page = await browser.newPage({ viewport, deviceScaleFactor: opts.dpr ?? 1, reducedMotion: opts.reduced ? 'reduce' : 'no-preference' })
    await page.goto(BASE + url, { waitUntil: 'networkidle' })
    await page.waitForTimeout(opts.wait ?? 400)
    await page.screenshot({ path: `audit/hero/${file}.png`, fullPage: opts.full ?? false })
    await page.close()
  }
  for (const id of ['a', 'b', 'c']) {
    await shot(`/preview/hero-${id}?still=1`, `hero-${id}-desktop`, { width: 1440, height: 900 })
    await shot(`/preview/hero-${id}?still=1`, `hero-${id}-mobile`, { width: 390, height: 844 }, { dpr: 2, full: true })
    await shot(`/preview/hero-${id}`, `hero-${id}-reduced-motion`, { width: 1440, height: 900 }, { reduced: true })
    for (let f = 0; f <= LAST[id]; f++) await shot(`/preview/hero-${id}?frame=${f}`, `hero-${id}-frame-${f}`, { width: 1280, height: 800 })
  }
  await shot('/preview/heroes', 'heroes-index', { width: 1440, height: 900 })
  await browser.close()
  console.log('hero stills written to audit/hero/')
} finally {
  server.kill()
}
