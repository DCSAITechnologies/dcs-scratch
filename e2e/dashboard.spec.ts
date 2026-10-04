import { test, expect, type Page } from '@playwright/test'
import { CANONICAL, PUBLISHED, HOLD, matches } from './catalogue'

// One concrete URL per router pattern (25). Detail ids come from the fixture stores.
const ROUTES = [
  '/app', '/app/connectors', '/app/connectors/' + CANONICAL[0].id, '/app/connections', '/app/connections/new',
  '/app/connections/cn_01HZX3A1', '/app/tools', '/app/agents', '/app/agents/runs/run_01J0AA11', '/app/policies',
  '/app/policies/pol_fin_refunds', '/app/approvals', '/app/approvals/ap_01J1K71', '/app/executions',
  '/app/executions/ex_01J2P88', '/app/receipts', '/app/receipts/rc_01J2Q24', '/app/events', '/app/security',
  '/app/environments', '/app/developer', '/app/usage', '/app/team', '/app/audit', '/app/settings',
]

const openSearch = async (page: Page) => {
  await page.locator('main').click({ position: { x: 5, y: 5 } })
  await page.keyboard.press('Control+k')
  await expect(page.getByRole('dialog', { name: 'Search' })).toBeVisible()
}
const search = async (page: Page, q: string) => {
  await openSearch(page)
  await page.getByLabel('Search the console').fill(q)
  await page.keyboard.press('Enter')
}

test.describe('console routes', () => {
  test(`all ${ROUTES.length} route patterns render without errors`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    // external resource loads (web fonts) are environment-dependent; app errors are not
    page.on('console', (m) => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(m.text()) })
    for (const r of ROUTES) {
      await page.goto(r)
      await expect(page.locator('main h1').first(), r).toBeVisible()
      await expect(page.locator('main'), r).not.toContainText(/This console route does not exist|not found/i)
    }
    expect(errors).toEqual([])
  })

  test('unknown console route and unknown ids render not-found states', async ({ page }) => {
    await page.goto('/app/nope')
    await expect(page.locator('main')).toContainText('This console route does not exist')
    await page.goto('/app/executions/ex_DOES_NOT_EXIST')
    await expect(page.locator('main')).toContainText(/not found/i)
  })

  test('four-state previews render', async ({ page }) => {
    await page.goto('/app/executions?state=empty')
    await expect(page.locator('main .glass-card').first()).toBeVisible()
    await page.goto('/app/executions?state=loading')
    await expect(page.locator('[aria-busy="true"]')).toBeVisible()
    await page.goto('/app/executions?state=error')
    await expect(page.locator('main')).toContainText('PROVIDER_UNAVAILABLE')
  })
})

test.describe('console connector catalogue', () => {
  test('paginates across every canonical row', async ({ page }) => {
    await page.goto('/app/connectors')
    const count = page.getByTestId('dash-connector-count')
    await expect(count).toContainText(`Showing 1–50 of ${CANONICAL.length} matching`)
    await expect(count).toContainText(`${CANONICAL.length} catalogued (${PUBLISHED.length} published, ${HOLD.length} on hold)`)
    const pages = Math.ceil(CANONICAL.length / 50)
    await expect(page.getByTestId('dash-page')).toHaveText(`Page 1 of ${pages}`)
    await page.getByRole('button', { name: 'Next →' }).click()
    await expect(count).toContainText(`Showing 51–100 of ${CANONICAL.length} matching`)
    await expect(page.locator('main tbody tr')).toHaveCount(50)
    await page.getByRole('button', { name: '← Prev' }).click()
    await expect(count).toContainText('Showing 1–50')
  })

  test('publication filter isolates HOLD rows', async ({ page }) => {
    await page.goto('/app/connectors')
    await page.locator('label:has-text("Publication") select').selectOption('on hold')
    await expect(page.getByTestId('dash-connector-count')).toContainText(`of ${HOLD.length} matching`)
  })

  test('provider-data filter shows the data-sourcing review queue (derived, never typed)', async ({ page }) => {
    const review = CANONICAL.filter((c) => (c as { data_review?: string }).data_review).length
    expect(review).toBeGreaterThan(0)
    await page.goto('/app/connectors')
    await page.locator('label:has-text("Provider data") select').selectOption('needs review')
    await expect(page.getByTestId('dash-connector-count')).toContainText(`of ${review} matching`)
  })

  test('Request access opens the contact flow', async ({ page }) => {
    await page.goto('/app/connectors/' + CANONICAL[0].id)
    await page.getByRole('button', { name: 'Request access' }).click()
    await expect(page).toHaveURL(/\/enterprise\/contact$/)
  })
})

test.describe('console search', () => {
  test('id prefixes open records', async ({ page }) => {
    await page.goto('/app')
    await search(page, 'ex_01J2P88')
    await expect(page).toHaveURL(/\/app\/executions\/ex_01J2P88$/)
    await search(page, 'run_01J0AA11')
    await expect(page).toHaveURL(/\/app\/agents\/runs\/run_01J0AA11$/)
  })

  test('exact canonical id opens the connector', async ({ page }) => {
    const c = CANONICAL[0]
    await page.goto('/app')
    await search(page, c.id)
    await expect(page).toHaveURL(new RegExp(`/app/connectors/${c.id}$`))
  })

  test('a second query while on /app/connectors updates the results (was stale)', async ({ page }) => {
    const n = (q: string) => CANONICAL.filter((c) => matches(c, q)).length
    await page.goto('/app')
    await search(page, 'zoho')
    await expect(page.getByTestId('dash-connector-count')).toContainText(`of ${n('zoho')} matching`)
    await search(page, 'azure')
    await expect(page).toHaveURL(/q=azure/)
    await expect(page.getByTestId('dash-connector-count')).toContainText(`of ${n('azure')} matching`)
  })

  for (const q of ['openai', 'anthropic']) {
    test(`"${q}" explains it is a legacy reference, not canonical`, async ({ page }) => {
      await page.goto('/app')
      await search(page, q)
      await expect(page.getByTestId('legacy-hint')).toContainText('not canonical')
      await expect(page.getByTestId('legacy-hint').locator(`a[href="/connectors/${q}"]`)).toBeVisible()
    })
  }

  test('Escape closes the search dialog', async ({ page }) => {
    await page.goto('/app')
    await openSearch(page)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Search' })).toBeHidden()
  })
})

test.describe('console truthfulness', () => {
  test('no liveness claims over fixture data', async ({ page }) => {
    await page.goto('/app')
    const body = page.locator('body')
    await expect(body).not.toContainText(/real-time|all systems operational/i)
    await expect(body).toContainText('demo identity')
    // fixture data is only ever shown under an unmistakable DEMO banner
    await expect(page.getByTestId('demo-banner')).toContainText('DEMO / NON-PRODUCTION')
    await expect(body).toContainText('HERMETIC')
  })
})
