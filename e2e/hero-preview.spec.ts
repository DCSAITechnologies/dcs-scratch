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

test('the homepage does not link to the concept previews or show their review ribbon', async ({ page }) => {
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

test.describe('homepage: HERO-A/C rotator, HERO-B as How it works (light theme)', () => {
  test('indexable homepage; /preview/home redirects; light header with working dropdowns; axe clean; no overflow', async ({ page, request }) => {
    expect(await (await request.get('/')).text()).not.toContain('noindex')
    expect(readFileSync('dist/_redirects', 'utf8')).toContain('/preview/home  /  301!')
    await page.goto('/?still=1')
    await expect(page.getByRole('heading', { name: 'How it works' })).toHaveCount(0) // eyebrow, not a heading
    await expect(page.getByRole('heading', { name: /Connect\. Govern\./ })).toBeVisible()
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('h1')).toHaveText('Governed connections for every agent action.')
    const trigger = page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name: 'Connectors' })
    await trigger.focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('menu', { name: 'Connectors menu' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('menu')).toHaveCount(0)
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    expect(r.violations.map((v) => `${v.id}: ${v.nodes[0].html.slice(0, 90)}`)).toEqual([])
    for (const width of [390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
    }
  })

  test('hero rotates A -> C after 10 s; the slide buttons and Pause work', async ({ page }) => {
    test.setTimeout(60_000)
    await page.goto('/')
    await page.mouse.move(5, 890) // keep the pointer off the hero (hover pauses rotation)
    const slide = (n: string) => page.getByRole('group', { name: new RegExp(n) })
    await expect(slide('1 of 2')).toHaveAttribute('aria-hidden', 'false')
    await expect(page.locator('h1')).toContainText('Governed connections')
    await expect(slide('2 of 2')).toHaveAttribute('aria-hidden', 'false', { timeout: 13_000 })
    await expect(page.locator('h1')).toContainText('One control plane')
    // manual choice, then pause holds it
    await page.getByRole('button', { name: 'Governed connections' }).click()
    await expect(page.locator('h1')).toContainText('Governed connections')
    await page.getByRole('button', { name: 'Pause hero rotation' }).click()
    await page.mouse.move(5, 890)
    await page.waitForTimeout(11_000)
    await expect(page.locator('h1')).toContainText('Governed connections')
    await expect(page.getByRole('button', { name: 'Play hero rotation' })).toBeVisible()
  })

  test('reduced motion: no auto-rotation and no pause control', async ({ browser }) => {
    test.setTimeout(30_000)
    const ctx = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await ctx.newPage()
    await page.goto('/')
    await expect(page.getByRole('button', { name: /hero rotation/ })).toHaveCount(0)
    await page.waitForTimeout(11_000)
    await expect(page.locator('h1')).toContainText('Governed connections')
    await page.getByRole('button', { name: /connector catalogue/ }).click()
    await expect(page.locator('h1')).toContainText('One control plane')
    await ctx.close()
  })
})
