import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFileSync } from 'node:fs'

// Founder-review hero concepts: noindex preview routes only; the live homepage is untouched.
const ROUTES = ['/preview/heroes', '/preview/hero-a', '/preview/hero-b', '/preview/hero-c']

test('preview routes are noindex, disallowed and absent from the sitemap', async ({ page, request }) => {
  for (const r of ROUTES) {
    expect(await (await request.get(`${r}/`)).text()).toContain('<meta name="robots" content="noindex, nofollow" />')
    await page.goto(r)
    await expect(page.getByText('Concept preview for founder review')).toBeVisible()
  }
  expect(readFileSync('dist/robots.txt', 'utf8')).toContain('Disallow: /preview')
  expect(readFileSync('dist/sitemap.xml', 'utf8')).not.toContain('/preview')
  expect(readFileSync('dist/_headers', 'utf8')).toMatch(/\/preview\/\*\n {2}X-Robots-Tag: noindex/)
})

test('the live homepage does not use a concept hero and does not link to the previews', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Concept preview for founder review')).toHaveCount(0)
  await expect(page.locator('a[href^="/preview"]')).toHaveCount(0)
})

for (const id of ['a', 'b', 'c']) {
  test(`HERO-${id.toUpperCase()}: derived scale copy, axe clean, no overflow on phone and desktop`, async ({ page }) => {
    await page.goto(`/preview/hero-${id}?still=1`)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.getByTestId('hero-scale')).toContainText('connectors catalogued')
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    expect(r.violations.map((v) => `${v.id}: ${v.nodes[0].html.slice(0, 90)}`)).toEqual([])
    for (const width of [390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
    }
  })

  test(`HERO-${id.toUpperCase()}: reduced motion renders the final state without stepping`, async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await ctx.newPage()
    await page.goto(`/preview/hero-${id}`)
    const first = await page.locator('[role="img"]').first().innerHTML()
    await page.waitForTimeout(2600)
    expect(await page.locator('[role="img"]').first().innerHTML()).toBe(first)
    await ctx.close()
  })
}

test('with motion allowed the sequence advances; ?frame=N holds a step', async ({ page }) => {
  await page.goto('/preview/hero-a')
  const canvas = page.locator('[role="img"]').first()
  const start = await canvas.innerHTML()
  await expect.poll(() => canvas.innerHTML(), { timeout: 6000 }).not.toBe(start)
  await page.goto('/preview/hero-a?frame=2')
  const held = await canvas.innerHTML()
  await page.waitForTimeout(2600)
  expect(await canvas.innerHTML()).toBe(held)
  await expect(canvas).toContainText('Awaiting approval')
})
