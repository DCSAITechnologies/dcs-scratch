// Console in API mode (mock build) against scripts/mock-api.mjs.
// Covers: protected routes + deep-link return, session restore/expiry/sign-out,
// role-gated actions, real reads with pagination, every wired mutation with its
// confirmation and server result, error/empty states, and no fixture leakage.
import { test, expect, type Page } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

const API = 'http://127.0.0.1:4010'

async function signInAs(page: Page, role: 'operator' | 'approver' | 'viewer', path = '/app') {
  await page.goto(path)
  await expect(page.getByRole('heading', { name: 'Sign in to the console' })).toBeVisible()
  await page.getByRole('button', { name: `Sign in as ${role} (mock)` }).click()
  await expect(page.getByTestId('api-banner')).toBeVisible()
}

test('protected route: anonymous → sign-in, then back to the deep link', async ({ page }) => {
  await page.goto('/app/approvals')
  await expect(page.getByRole('heading', { name: 'Sign in to the console' })).toBeVisible()
  await expect(page.locator('body')).not.toContainText('apr_mock_001') // nothing loaded before sign-in
  await page.getByRole('button', { name: 'Sign in as operator (mock)' }).click()
  await expect(page).toHaveURL(/\/app\/approvals$/)
  await expect(page.getByRole('heading', { name: 'Approvals' })).toBeVisible()
  await expect(page.getByText('apr_mock_001')).toBeVisible()
  await expect(page.getByTestId('demo-banner')).toHaveCount(0)
})

test('session restores on reload and sign-out ends it', async ({ page }) => {
  await signInAs(page, 'operator', '/app/connections')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Connections' })).toBeVisible()
  await page.getByRole('button', { name: 'Sign out' }).first().click()
  await expect(page.getByRole('heading', { name: 'Sign in to the console' })).toBeVisible()
  await page.goto('/app/connections')
  await expect(page.getByRole('heading', { name: 'Sign in to the console' })).toBeVisible()
})

test('expired session shows the expiry screen and signs back in to the same page', async ({ page }) => {
  await signInAs(page, 'operator', '/app/executions')
  await page.evaluate(() => {
    const s = JSON.parse(sessionStorage.getItem('cos_dev_session')!)
    sessionStorage.setItem('cos_dev_session', JSON.stringify({ ...s, expires_at: Date.now() - 1 }))
  })
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Sign in to the console' })).toBeVisible()
  // a 401 from the API mid-session flips to the expiry screen
  await signInAs(page, 'operator', '/app/executions')
  await page.route(`${API}/v1/runs*`, (r) => r.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: { code: 'unauthenticated', message: 'expired', retriable: false, request_id: 'req_x' } }) }))
  await page.getByRole('link', { name: 'Agent runs' }).click()
  await expect(page.getByRole('heading', { name: 'Your session expired' })).toBeVisible()
  await page.unroute(`${API}/v1/runs*`)
  await page.getByRole('button', { name: 'Sign in again' }).click()
  await expect(page).toHaveURL(/\/app\/agents$/)
  await expect(page.getByRole('heading', { name: 'Agent runs' })).toBeVisible()
})

test('connector catalogue reads from the API with search and cursor paging', async ({ page }) => {
  await signInAs(page, 'operator', '/app/connectors')
  await expect(page.getByTestId('api-count')).toHaveText('50 loaded · more available')
  await page.getByRole('button', { name: 'Load more' }).click()
  await expect(page.getByTestId('api-count')).toContainText('100 loaded')
  await page.getByLabel('Search connectors').fill('zoho')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await expect(page).toHaveURL(/q=zoho/)
  await expect(page.getByTestId('api-count')).toContainText('loaded')
  await page.getByRole('link', { name: /Zoho/ }).first().click()
  await expect(page.getByText('Dispatch eligibility (API)')).toBeVisible()
  await expect(page.getByText('Not dispatchable in any environment')).toBeVisible()
})

test('search with no match renders the empty state', async ({ page }) => {
  await signInAs(page, 'operator', '/app/connectors?q=definitely-no-such-connector')
  await expect(page.getByTestId('api-empty')).toContainText('No connector matches')
})

test('viewer cannot approve; approver grants with a confirmation and sees the server result', async ({ page }) => {
  await signInAs(page, 'viewer', '/app/approvals/apr_mock_001')
  await expect(page.getByTestId('approval-grant')).toBeDisabled()
  await page.getByRole('button', { name: 'Sign out' }).first().click()

  await signInAs(page, 'approver', '/app/approvals/apr_mock_001')
  await page.getByTestId('approval-deny').click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByTestId('confirm-submit')).toBeDisabled() // reason required
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await page.getByTestId('approval-grant').click()
  await expect(page.getByRole('dialog')).toContainText('Idempotency-Key idem_')
  await page.getByTestId('confirm-submit').click()
  await expect(page.getByRole('status')).toContainText('Approval is now GRANTED (by usr_mock_approver)')
  await expect(page.getByTestId('approval-revoke')).toBeVisible()
  await expect(page.getByTestId('approval-grant')).toHaveCount(0)
})

test('operator revokes a granted approval with a recorded reason', async ({ page }) => {
  await signInAs(page, 'operator', '/app/approvals/apr_mock_001')
  await page.getByTestId('approval-revoke').click()
  await page.getByRole('dialog').getByLabel('Reason').fill('rollback test')
  await page.getByTestId('confirm-submit').click()
  await expect(page.getByRole('status')).toContainText('Approval is now REVOKED')
})

test('reconcile an OUTCOME_UNKNOWN execution', async ({ page }) => {
  await signInAs(page, 'operator', '/app/executions/exe_mock_002')
  await page.getByTestId('exec-reconcile').click()
  const d = page.getByRole('dialog')
  await d.getByLabel('Observed outcome').selectOption('SUCCEEDED')
  await d.getByLabel('Evidence method').selectOption('read_back_by_resource_id')
  await d.getByLabel('Evidence note').fill('Order closed per provider read-back')
  await page.getByTestId('confirm-submit').click()
  await expect(page.getByRole('status')).toContainText('Reconciled as SUCCEEDED')
  await expect(page.getByTestId('exec-reconcile')).toHaveCount(0)
})

test('receipt verification reports the verifier kind truthfully', async ({ page }) => {
  await signInAs(page, 'operator', '/app/receipts/rcp_mock_001')
  await page.getByTestId('receipt-verify').click()
  await page.getByTestId('confirm-submit').click()
  await expect(page.getByTestId('verify-result')).toContainText('unverified_test_double')
  await expect(page.getByTestId('verify-result')).toContainText('this is not evidence')
})

test('connection flow: refuse a non-reference credential, create, test, activate', async ({ page }) => {
  await signInAs(page, 'operator', '/app/connections/new?connector=deepl')
  await expect(page.getByText('DeepL')).toBeVisible()
  await page.getByLabel('Credential reference').fill('sk-live-not-a-reference')
  await expect(page.getByText('Must be a vault reference')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Create connection' })).toBeDisabled()
  await page.getByLabel('Credential reference').fill('cref_0b6f5d3e-3c1a-4b8e-9d2f-1a2b3c4d5e6f')
  await page.getByTestId('conn-create').click()
  await page.getByTestId('confirm-submit').click()
  await expect(page.getByRole('status')).toContainText('created (status CREATED)')
  await page.getByTestId('conn-test').click()
  await page.getByTestId('confirm-submit').click()
  await expect(page.getByRole('status')).toContainText('Test passed')
  await page.getByTestId('conn-activate').click()
  await page.getByTestId('confirm-submit').click()
  await expect(page.getByRole('status')).toContainText('Connection is ACTIVE')
  await expect(page.getByText('connected', { exact: false }).first()).toBeVisible()
})

test('kill order: restore by the same identity is refused, by a second identity succeeds', async ({ page }) => {
  await signInAs(page, 'operator', '/app/security')
  await page.getByTestId('kill-create').click()
  const d = page.getByRole('dialog')
  await d.getByLabel('Scope').selectOption('connection')
  await d.getByLabel('Target id').fill('cn_mock_001')
  await d.getByLabel('Reason').fill('suspicious activity drill')
  await d.getByLabel('Reviewer').fill('usr_mock_approver')
  await page.getByTestId('confirm-submit').click()
  await expect(page.getByRole('status')).toContainText('is active')
  await page.locator('[data-testid^="kill-restore-"]').first().click()
  const r = page.getByRole('dialog')
  await r.getByLabel('Reason').fill('drill over')
  await r.getByLabel('Reviewer (second identity)').fill('usr_mock_operator')
  await page.getByTestId('confirm-submit').click()
  await expect(r.getByTestId('api-error')).toContainText('Restore needs a second identity')
  await r.getByLabel('Reviewer (second identity)').fill('usr_mock_approver')
  await page.getByTestId('confirm-submit').click()
  await expect(page.getByRole('status')).toContainText('restored')
})

test('error states: backend unreachable, permission denied, not implemented, not found', async ({ page }) => {
  await signInAs(page, 'operator', '/app')
  await page.route(`${API}/v1/receipts*`, (r) => r.abort('connectionrefused'))
  await page.getByRole('link', { name: 'Receipts' }).click()
  await expect(page.getByTestId('api-error')).toContainText('Backend unavailable')
  await expect(page.getByTestId('api-error').getByRole('button', { name: 'Retry' })).toBeVisible()
  await page.unroute(`${API}/v1/receipts*`)
  await page.getByTestId('api-error').getByRole('button', { name: 'Retry' }).click()
  await expect(page.getByText('rcp_mock_001')).toBeVisible()

  await page.route(`${API}/v1/policies*`, (r) => r.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ error: { code: 'permission_denied', message: 'policies:read required', retriable: false, request_id: 'req_p', detail: { scope: 'policies:read' } } }) }))
  await page.getByRole('link', { name: 'Policies' }).click()
  await expect(page.getByTestId('api-error')).toContainText('Permission denied')
  await expect(page.getByTestId('api-error')).toContainText('Required scope: policies:read')
  await expect(page.getByTestId('api-error')).toContainText('request req_p')

  await page.goto('/app/executions/exe_does_not_exist')
  await expect(page.getByTestId('api-error')).toHaveAttribute('data-code', 'not_found')
  await page.goto('/app/team')
  await expect(page.getByTestId('not-in-contract')).toContainText('Members, invitations and role changes')
})

test('no fixture data appears in API mode', async ({ page }) => {
  await signInAs(page, 'operator', '/app')
  await expect(page.getByRole('heading', { name: 'Operations overview' })).toBeVisible()
  for (const path of ['/app', '/app/agents', '/app/executions', '/app/connections']) {
    await page.goto(path)
    await expect(page.locator('main h1').first()).toBeVisible()
    const text = await page.locator('body').innerText()
    for (const fixture of ['A. Sharma', 'run_01J0AA11', 'ex_01J2P88', 'cn_01HZX3A1', 'Acme']) expect(text, `${path} shows fixture ${fixture}`).not.toContain(fixture)
  }
})

test.describe('contact form with a configured endpoint', () => {
  const fill = async (page: Page) => {
    const form = page.getByTestId('contact-form')
    await form.getByLabel('Name *').fill('Asha Rao')
    await form.getByLabel('Work email *').fill('asha@acme.io')
    await form.getByLabel(/What are you trying to do/).fill('We need governed writes to our CRM with approvals.')
    return form
  }
  test('submits to the endpoint and confirms', async ({ page }) => {
    await page.goto('/enterprise/contact')
    const form = await fill(page)
    await form.getByRole('button', { name: 'Send message' }).click()
    await expect(page.getByTestId('contact-sent')).toContainText('your message was sent')
  })
  test('a server error keeps the message and says it was not sent', async ({ page }) => {
    await page.route(`${API}/forms/contact`, (r) => r.fulfill({ status: 500, body: 'boom' }))
    await page.goto('/enterprise/contact')
    const form = await fill(page)
    await form.getByRole('button', { name: 'Send message' }).click()
    await expect(page.getByTestId('contact-error')).toContainText('was not sent')
    await expect(form.getByLabel('Name *')).toHaveValue('Asha Rao')
  })
  test('rate limiting is explained', async ({ page }) => {
    await page.route(`${API}/forms/contact`, (r) => r.fulfill({ status: 429, body: '' }))
    await page.goto('/enterprise/contact')
    const form = await fill(page)
    await form.getByRole('button', { name: 'Send message' }).click()
    await expect(page.getByTestId('contact-error')).toContainText('Too many submissions')
  })
})
