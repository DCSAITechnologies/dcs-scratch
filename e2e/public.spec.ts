import { test, expect, type Page } from '@playwright/test'
import { PUBLISHED, CANONICAL, HOLD, ALIASES, LEGACY, legacy, matches } from './catalogue'

const NOT_FOUND = /This page is not on the map|Connector not found/

async function expectRenders(page: Page, path: string) {
  await page.goto(path)
  await expect(page.locator('main')).toBeVisible()
  await expect(page.locator('main')).not.toContainText(NOT_FOUND)
}

test.describe('public catalogue', () => {
  test('counts are derived from the catalogue and consistent', async ({ page }) => {
    await page.goto('/connectors')
    await expect(page.locator('h1')).toContainText(`${PUBLISHED.length} published connectors`)
    await expect(page.getByTestId('catalogue-counts')).toContainText(
      `${CANONICAL.length} records in the canonical catalogue · ${PUBLISHED.length} published · ${HOLD.length} on hold`)
    await expect(page.getByTestId('result-count')).toHaveText(`${PUBLISHED.length} connectors`)
  })

  test('load more pages through the published grid', async ({ page }) => {
    await page.goto('/connectors')
    const grid = page.locator('a[href^="/connectors/"]:has-text("Details →")')
    const legacyCards = page.locator('a[href^="/connectors/"]:has-text("Reference")')
    const canonicalCount = async () => (await grid.count()) - (await legacyCards.count())
    // the catalogue chunk loads lazily; wait for the grid before counting
    await expect(page.getByTestId('result-count')).toHaveText(`${PUBLISHED.length} connectors`)
    await expect.poll(canonicalCount).toBe(60)
    await page.getByRole('button', { name: /^Load more \(/ }).click()
    await expect.poll(canonicalCount).toBe(120)
  })

  for (const q of ['openai', 'anthropic']) {
    test(`search "${q}" finds the legacy reference surface, not a canonical row`, async ({ page }) => {
      const row = legacy(q)!
      await page.goto('/connectors')
      await page.getByLabel('Search connectors').fill(q)
      // canonical hits are rows whose name/provider/id match (e.g. Statsig's provider
      // field is "OpenAI"); OpenAI itself is not a canonical row
      const hits = PUBLISHED.filter((c) => matches(c, q))
      expect(hits.some((c) => c.id === q)).toBe(false)
      await expect(page.getByTestId('result-count')).toHaveText(`${hits.length} connectors`)
      if (hits.length === 0) await expect(page.getByTestId('no-canonical-match')).toContainText('legacy reference')
      const card = page.locator(`a[href="/connectors/${q}"]`)
      await expect(card).toContainText(row.n)
      await expect(card).toContainText('Reference')
      await card.click()
      await expect(page.locator('main')).toContainText('REFERENCE / LEGACY CATALOGUE SURFACE')
      await expect(page.locator('h1')).toHaveText(row.n)
    })
  }

  test('category deep link filters the grid', async ({ page }) => {
    const cat = 'Healthcare'
    await page.goto(`/connectors?cat=${encodeURIComponent(cat)}`)
    await expect(page.getByTestId('result-count')).toHaveText(`${PUBLISHED.filter((c) => c.cat === cat).length} connectors`)
  })

  test('nav category link applies the category', async ({ page }) => {
    await page.goto('/connectors')
    await page.getByRole('button', { name: 'Connectors' }).first().hover()
    const link = page.getByRole('menuitem', { name: /Developer Tools/ }).first()
    if (await link.isVisible()) {
      await link.click()
      await expect(page).toHaveURL(/cat=Developer%20Tools/)
      await expect(page.getByTestId('result-count')).toHaveText(`${PUBLISHED.filter((c) => c.cat === 'Developer Tools').length} connectors`)
    }
  })
})

test.describe('connector detail routing', () => {
  test('canonical rows render', async ({ page }) => {
    for (const c of PUBLISHED.filter((x) => !x.alias_of).slice(0, 5)) {
      await expectRenders(page, `/connectors/${c.id}`)
      await expect(page.locator('h1')).toHaveText(c.n)
    }
  })

  test('every published alias row renders its own record (was "Connector not found")', async ({ page }) => {
    for (const c of ALIASES.filter((x) => !x.unpublished)) {
      await expectRenders(page, `/connectors/${c.id}`)
      await expect(page.locator('h1')).toHaveText(c.n)
    }
  })

  test('an alias identifier redirects to its row', async ({ page }) => {
    const c = ALIASES.find((x) => !x.unpublished)!
    await page.goto(`/connectors/${c.alias_of}`)
    await expect(page).toHaveURL(new RegExp(`/connectors/${c.id}$`), { timeout: 5000 })
    await expect(page.locator('h1')).toHaveText(c.n)
  })

  test('HOLD rows never render their content, even on a direct URL', async ({ page }) => {
    const c = HOLD[0]
    await page.goto(`/connectors/${c.id}`)
    await expect(page.locator('main')).toContainText('not publicly listed')
    await expect(page.locator('main')).not.toContainText(c.d.slice(0, 40))
  })

  test('legacy route behaviours: preserve, redirect, gone, unlisted', async ({ page }) => {
    const preserve = LEGACY.find((c) => c.lane6_behavior === 'PRESERVE_REFERENCE_SURFACE')!
    await page.goto(`/connectors/${preserve.id}`)
    await expect(page.locator('main')).toContainText('REFERENCE / LEGACY CATALOGUE SURFACE')

    const redirect = LEGACY.find((c) => c.lane6_behavior === 'REDIRECT')!
    await page.goto(`/connectors/${redirect.id}`)
    await expect(page).toHaveURL(new RegExp(`${redirect.lane6_redirect_to}$`), { timeout: 5000 })
    await expect(page.locator('main')).not.toContainText(NOT_FOUND)

    const gone = LEGACY.find((c) => c.lane6_behavior === 'GONE')!
    await page.goto(`/connectors/${gone.id}`)
    await expect(page.locator('main')).toContainText('410 — Gone')

    const unlisted = LEGACY.find((c) => c.lane6_behavior === 'UNLIST_NO_REDIRECT')!
    await page.goto(`/connectors/${unlisted.id}`)
    await expect(page.locator('main')).toContainText('Connector not found')
  })

  test('unknown routes render the 404 page', async ({ page }) => {
    await page.goto('/definitely-not-a-route')
    await expect(page.locator('main')).toContainText('This page is not on the map')
    await page.goto('/connectors/definitely-not-a-connector')
    await expect(page.locator('main')).toContainText('Connector not found')
  })
})
