import { test, expect, type Page } from '@playwright/test'
import { PUBLISHED, CANONICAL, HOLD, FOUNDER_LISTED, ALIASES, LEGACY, POPULAR, legacy, matches } from './catalogue'

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
    const counts = page.getByTestId('catalogue-counts')
    await expect(counts).toHaveAttribute('aria-label', `${CANONICAL.length.toLocaleString('en-US')} records in the canonical catalogue · ${PUBLISHED.length} published · ${HOLD.length} on hold`)
    await expect(counts).toContainText(`${CANONICAL.length.toLocaleString('en-US')}catalogued`)
    await expect(counts).toContainText(`${PUBLISHED.length}published`)
    await expect(counts).toContainText(`${HOLD.length}on hold`)
    await expect(page.getByTestId('availability-line')).toContainText('0available to connect today')
    await expect(page.getByTestId('result-count')).toHaveText(`${PUBLISHED.length} connectors`)
  })

  test('phone: filters fold behind a Filters button; search and categories stay visible', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/connectors')
    await expect(page.getByLabel('Search connectors')).toBeVisible()
    await expect(page.getByRole('group', { name: 'Category' })).toBeVisible()
    const toggle = page.getByRole('button', { name: /^Filters/ })
    await expect(page.getByRole('button', { name: 'Catalogue status filter' })).toBeHidden()
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('button', { name: 'Catalogue status filter' })).toBeVisible()
    await page.getByRole('checkbox', { name: 'Webhooks' }).check()
    await expect(toggle).toHaveText('Filters (1)')
    await page.getByRole('button', { name: 'Clear filters' }).click()
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
      // a founder-curated leader is pinned at the top of the grid, labelled Reference, outside the count
      const card = page.locator(`a[href="/connectors/${q}"]`).first()
      await expect(page.getByTestId('pinned-count')).toContainText('reference')
      await expect(card).toContainText(row.n)
      await expect(card).toContainText('Reference')
      await card.click()
      await expect(page.locator('main')).toContainText('REFERENCE / LEGACY CATALOGUE SURFACE')
      await expect(page.locator('h1')).toHaveText(row.n)
    })
  }

  test('AI & Models opens with the founder-curated leaders, Anthropic first', async ({ page }) => {
    await page.goto(`/connectors?cat=${encodeURIComponent('AI & Models')}`)
    const cards = page.locator('a[href^="/connectors/"]:has-text("Details →")')
    await expect(cards.first()).toHaveAttribute('href', `/connectors/${POPULAR.aiLeaders[0]}`)
    await expect(cards.nth(1)).toHaveAttribute('href', `/connectors/${POPULAR.aiLeaders[1]}`)
  })

  test('Popular tab lists the curated connectors in order, and no extra reference section', async ({ page }) => {
    await page.goto('/connectors')
    await page.getByRole('button', { name: 'Popular', exact: true }).click()
    const cards = page.locator('a[href^="/connectors/"]:has-text("Details →")')
    await expect(cards).toHaveCount(POPULAR.popular.length)
    await expect(cards.first()).toHaveAttribute('href', `/connectors/${POPULAR.popular[0]}`)
    await expect(page.getByText('More reference pages')).toHaveCount(0)
  })

  test('category deep link filters the grid', async ({ page }) => {
    const cat = 'Healthcare'
    await page.goto(`/connectors?cat=${encodeURIComponent(cat)}`)
    await expect(page.getByTestId('result-count')).toHaveText(`${PUBLISHED.filter((c) => c.cat === cat).length} connectors`)
  })

  test('nav category link applies the category', async ({ page }) => {
    await page.goto('/connectors')
    await page.getByRole('button', { name: 'Connectors' }).first().hover()
    const link = page.getByRole('menuitem', { name: /^Developer Tools/ }).first()
    if (await link.isVisible()) {
      await link.click()
      await expect(page).toHaveURL(/cat=Developer%20Tools/)
      await expect(page.getByTestId('result-count')).toHaveText(`${PUBLISHED.filter((c) => c.cat === 'Developer Tools').length} connectors`)
    }
  })
})

test.describe('connector detail routing', () => {
  test('facts card carries clickable provider links and similar connectors', async ({ page }) => {
    await page.goto('/connectors/github')
    const links = page.getByTestId('connector-links')
    await expect(links.getByRole('link', { name: /Official website/ })).toHaveAttribute('href', /github\.com/)
    await expect(links.getByRole('link', { name: /API documentation/ })).toHaveAttribute('target', '_blank')
    const similar = page.getByTestId('similar-connectors')
    await expect(similar.getByRole('link')).toHaveCount(5) // 4 connectors + "All … connectors"
    await similar.getByRole('link').first().click()
    await expect(page).toHaveURL(/\/connectors\/[a-z0-9-]+$/)
    await expect(page).not.toHaveURL(/\/connectors\/github$/)
  })

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

  test('founder-listed held rows show the provider-terms notice, and compliance categories say so', async ({ page }) => {
    const compliance = /\bPHI\b|health data|minors|money-mov|likeness/i
    expect(FOUNDER_LISTED.every((c) => c.dispatch_eligibility === 'NOT_DISPATCHABLE')).toBe(true)
    const plain = FOUNDER_LISTED.find((c) => !compliance.test(c.review_note ?? '') && !c.alias_of)!
    await page.goto(`/connectors/${plain.id}`)
    await expect(page.locator('main')).toContainText("Use of this connector is subject to the provider's terms.")
    await expect(page.locator('main')).not.toContainText('Additional compliance review applies')
    const gated = FOUNDER_LISTED.find((c) => compliance.test(c.review_note ?? '') && !c.alias_of)!
    await page.goto(`/connectors/${gated.id}`)
    await expect(page.locator('main')).toContainText('Additional compliance review applies before it can run.')
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

test.describe('sourced provider facts (data-sourcing)', () => {
  test('labelled as provider facts, separate from core, with the source', async ({ page }) => {
    await page.goto('/connectors/heygen')
    await page.getByRole('button', { name: 'Tools', exact: true }).click()
    await expect(page.getByTestId('provider-caps')).toContainText('What the HeyGen API supports')
    await expect(page.getByTestId('provider-caps').getByRole('link', { name: /source/ })).toHaveAttribute('href', /heygen\.com/)
    await page.getByRole('button', { name: 'Documentation', exact: true }).click()
    await expect(page.getByTestId('sourced-links-note')).toContainText("provider's official pages")
  })
  test('no empty scope table: the documented permission model is stated instead', async ({ page }) => {
    await page.goto('/connectors/ideogram')
    await page.getByRole('button', { name: 'Permissions', exact: true }).click()
    await expect(page.getByTestId('scope-model')).toContainText('permissions of the API key')
  })
})
