// Responsive + browser-zoom QA. Browser zoom Z on a W×H window lays out like a
// (W/Z)×(H/Z) CSS-pixel viewport, so each size×zoom pair is tested as that viewport.
import { test, expect, type Page } from '@playwright/test'

const DESKTOPS = [[1280, 720], [1366, 768], [1440, 900], [1536, 864], [1728, 1117], [1920, 1080]] as const
const ZOOMS = [0.8, 0.9, 1, 1.1, 1.25, 1.5]
const DEVICES = [[390, 844], [430, 932], [768, 1024], [820, 1180], [1024, 768]] as const
const PAGES = ['/', '/connectors', '/connectors/deepl', '/security', '/pricing', '/developers/status', '/enterprise/contact', '/app', '/app/connectors', '/app/executions/ex_01J2P88']

async function overflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
}

for (const [w, h] of DESKTOPS) {
  test(`desktop ${w}×${h} at every zoom level: no horizontal overflow`, async ({ page }) => {
    test.setTimeout(240_000)
    const problems: string[] = []
    for (const z of ZOOMS) {
      await page.setViewportSize({ width: Math.round(w / z), height: Math.round(h / z) })
      for (const p of PAGES) {
        await page.goto(p)
        await page.locator('main').first().waitFor()
        const o = await overflow(page)
        if (o > 1) problems.push(`${p} @${Math.round(z * 100)}% (${Math.round(w / z)}px css): overflows ${o}px`)
      }
    }
    expect(problems).toEqual([])
  })
}

for (const [w, h] of DEVICES) {
  test(`device ${w}×${h}: no overflow; navigation reachable`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h })
    const problems: string[] = []
    for (const p of PAGES) {
      await page.goto(p)
      await page.locator('main').first().waitFor()
      const o = await overflow(page)
      if (o > 1) problems.push(`${p}: overflows ${o}px`)
    }
    expect(problems).toEqual([])
    await page.goto('/')
    const desktopNav = page.getByRole('navigation', { name: 'Primary' })
    if (await desktopNav.isVisible()) return
    await page.getByRole('button', { name: /menu/i }).first().click()
    await expect(page.getByRole('link', { name: 'Pricing' }).or(page.getByRole('button', { name: 'Pricing' })).first()).toBeVisible()
  })
}

test('public header stays pinned while scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 })
  await page.goto('/security')
  await page.mouse.wheel(0, 2500)
  await page.waitForTimeout(300)
  const top = await page.locator('header').first().evaluate((el) => el.getBoundingClientRect().top)
  expect(top).toBe(0)
})

test('console: sticky top bar, sidebar and wide tables scroll inside their region', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('/app/connectors')
  await expect(page.getByTestId('dash-connector-count')).toBeVisible() // lazily loaded catalogue rendered
  await page.evaluate(() => window.scrollTo(0, 1500))
  await page.waitForTimeout(200)
  const header = page.locator('header').first()
  expect(await header.evaluate((el) => el.getBoundingClientRect().top)).toBeLessThanOrEqual(1)
  // sidebar is pinned directly under the 54px top bar (no gap, no overlap)
  const nav = page.getByRole('navigation', { name: 'Console' }).first()
  const asideTop = await nav.evaluate((el) => el.closest('aside')!.getBoundingClientRect().top)
  expect(Math.abs(asideTop - 54)).toBeLessThanOrEqual(1)
  const region = page.getByRole('region', { name: /^Table:/ }).first()
  const { scroll, client } = await region.evaluate((el) => ({ scroll: el.scrollWidth, client: el.clientWidth }))
  expect(scroll).toBeGreaterThanOrEqual(client) // table scrolls in its own region, page does not
  expect(await overflow(page)).toBeLessThanOrEqual(1)
})

test('browser back/forward through public and console routes', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /Explore the catalogue/ }).first().click()
  await expect(page).toHaveURL(/\/connectors$/)
  await page.locator('a[href^="/connectors/"]:has-text("Details →")').first().click()
  await expect(page).toHaveURL(/\/connectors\/[a-z0-9-]+$/)
  const detail = page.url()
  await page.goBack()
  await expect(page).toHaveURL(/\/connectors$/)
  await expect(page.getByTestId('result-count')).toBeVisible()
  await page.goForward()
  await expect(page).toHaveURL(detail)
  await page.goto('/app')
  await page.getByRole('link', { name: 'Executions' }).first().click()
  await expect(page).toHaveURL(/\/app\/executions$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/app$/)
  await expect(page.getByRole('heading', { name: 'Operations overview' })).toBeVisible()
})
