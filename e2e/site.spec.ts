import { test, expect } from '@playwright/test'
import { readdirSync, statSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// Every prerendered static / subpage route (dist/<route>/index.html), excluding the
// per-connector and console shells, which have their own suites.
const DIST = join(process.cwd(), 'dist')
function routes(dir = DIST, base = ''): string[] {
  if (!existsSync(dir)) return []
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (!statSync(p).isDirectory() || ['assets', 'logos', 'devportal'].includes(name)) continue
    const route = `${base}/${name}`
    if (route.startsWith('/connectors/') || route.startsWith('/app')) continue
    if (existsSync(join(p, 'index.html'))) out.push(route)
    out.push(...routes(p, route))
  }
  return out
}
const STATIC = ['/', ...routes()].filter((r) => r !== '/docs')

const NOT_FOUND = /This page is not on the map|Connector not found|This console route does not exist/

test('every internal link on every static page resolves', async ({ page }) => {
  test.setTimeout(240_000)
  expect(STATIC.length).toBeGreaterThan(50)
  const hrefs = new Set<string>()
  for (const r of STATIC) {
    await page.goto(r)
    await expect(page.locator('main'), r).not.toContainText(NOT_FOUND)
    const found = await page.$$eval('a[href^="/"]', (as) => as.map((a) => a.getAttribute('href') as string))
    found.forEach((h) => hrefs.add(h.split('#')[0]))
  }
  const broken: string[] = []
  for (const h of [...hrefs].filter((x) => !x.startsWith('/devportal') && !x.startsWith('/logos'))) {
    await page.goto(h)
    if (await page.locator('main').filter({ hasText: NOT_FOUND }).count()) broken.push(h)
  }
  expect(broken).toEqual([])
})

test('static pages have a unique title and a meta description', async ({ request }) => {
  const titles = new Map<string, string>()
  for (const r of STATIC) {
    const html = await (await request.get(r === '/' ? '/' : `${r}/`)).text()
    const title = /<title>(.*?)<\/title>/.exec(html)?.[1] ?? ''
    expect(title, r).not.toBe('')
    expect(html, r).toMatch(/<meta name="description" content="[^"]+"/)
    expect(html.match(/<meta name="description"/g)?.length, `${r}: exactly one meta description`).toBe(1)
    expect(titles.get(title), `${r} duplicates the title of ${titles.get(title)}`).toBeUndefined()
    titles.set(title, r)
  }
})

test('console shells are noindex and disallowed', async ({ request }) => {
  expect(await (await request.get('/app/')).text()).toContain('<meta name="robots" content="noindex, nofollow" />')
  expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /app')
  expect(await (await request.get('/sitemap.xml')).text()).not.toMatch(/\.dev\/app[</]/)
})

test.describe('responsive', () => {
  for (const vp of [{ name: 'mobile', width: 390, height: 844 }, { name: 'tablet', width: 820, height: 1180 }]) {
    test(`no horizontal overflow on key pages (${vp.name})`, async ({ page }) => {
      await page.setViewportSize(vp)
      for (const r of ['/', '/connectors', '/connectors/openai', '/security', '/developers', '/pricing', '/app', '/app/connectors', '/app/executions']) {
        await page.goto(r)
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
        expect(overflow, `${r} overflows by ${overflow}px at ${vp.width}px`).toBeLessThanOrEqual(1)
      }
    })
  }

  test('console mobile navigation drawer opens and navigates', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/app')
    await page.getByRole('button', { name: 'Open console navigation' }).click()
    const drawer = page.getByRole('dialog')
    await drawer.getByRole('link', { name: 'Executions' }).click()
    await expect(page).toHaveURL(/\/app\/executions$/)
  })
})

test('keyboard: the catalogue search is reachable by Tab and usable', async ({ page }) => {
  await page.goto('/connectors')
  let reached = false
  for (let i = 0; i < 60 && !reached; i++) {
    await page.keyboard.press('Tab')
    reached = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') === 'Search connectors')
  }
  expect(reached).toBe(true)
  await page.keyboard.type('anthropic')
  await expect(page.getByTestId('no-canonical-match')).toBeVisible()
})

test('sign-in collects no credentials while no identity backend exists', async ({ page }) => {
  await page.goto('/signin')
  await expect(page.locator('input[type="password"], input[type="email"]')).toHaveCount(0)
  await expect(page.locator('main')).not.toContainText(/free to start|no credit card/i)
  await page.goto('/pricing')
  await expect(page.locator('main')).not.toContainText(/join the waitlist/i)
})

test('every subpage route defined in src/lib has a prerendered shell', () => {
  const lib = join(process.cwd(), 'src', 'lib')
  const keys = readdirSync(lib).filter((f) => /^subpages.*\.ts$/.test(f))
    .flatMap((f) => [...readFileSync(join(lib, f), 'utf8').matchAll(/^ {2}'(\/[\w/-]+)':\s*\{/gm)].map((m) => m[1]))
  expect(keys.length).toBeGreaterThan(50)
  const missing = keys.filter((k) => !existsSync(join(DIST, k, 'index.html')))
  expect(missing).toEqual([])
})
