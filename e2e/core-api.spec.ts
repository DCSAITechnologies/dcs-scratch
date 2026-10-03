// Console in API mode against Connector OS core's REAL hermetic /v1 reference server
// (devex/api-server at CORE_HEAD, assembled by scripts/assemble-core.sh). No mock.
// The console is served same-origin (vite preview proxies /v1 to core on :4020).
//
// Agent-side steps that the console never performs (create a run, plan it, request an
// approval, submit the approved step) are driven over core's own HTTP contract with
// core's hermetic developer key and human attestation — exactly as core's contract tests do.
import { test, expect, type Page } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

const CORE = 'http://127.0.0.1:4020'
const DEV_KEY = 'cosk_hermetic_developer_000000001'
const ATTEST = 'att_hermetic_approver_0001'
let n = 0
const idem = () => `e2e_core_${Date.now()}_${++n}`

async function core<T = Record<string, unknown>>(method: string, path: string, body?: unknown, headers: Record<string, string> = {}): Promise<{ status: number; body: T }> {
  const h: Record<string, string> = { authorization: `Bearer ${DEV_KEY}`, ...headers }
  if (method === 'POST') h['idempotency-key'] = idem()
  if (body !== undefined) h['content-type'] = 'application/json'
  const r = await fetch(CORE + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) })
  return { status: r.status, body: (await r.json()) as T }
}

/** run → plan (one write step on the seeded GitHub connection) → approval request. */
async function governedPathToApproval() {
  const conns = await core<{ data: { connection_id: string; connector_id: string }[] }>('GET', '/v1/connections?connector_id=github')
  const conn = conns.body.data[0]
  const run = await core<{ run_id: string }>('POST', '/v1/runs', { mode: 'mode_1', objective: 'console e2e against core' })
  expect(run.status).toBe(201)
  const plan = await core<{ plan_id: string; steps: { step_id: string }[] }>('POST', `/v1/runs/${run.body.run_id}/plans`,
    { steps: [{ connector_id: 'github', tool_id: 'update_issue', operation_class: 'write', connection_id: conn.connection_id }] })
  expect(plan.status).toBe(201)
  const apr = await core<{ approval_id: string; state: string }>('POST', '/v1/approvals', { run_id: run.body.run_id, plan_id: plan.body.plan_id, step_ids: [plan.body.steps[0].step_id] })
  expect(apr.status).toBe(201)
  expect(apr.body.state).toBe('REQUESTED')
  return { run_id: run.body.run_id, plan_id: plan.body.plan_id, step_id: plan.body.steps[0].step_id, approval_id: apr.body.approval_id }
}

async function signInAs(page: Page, role: 'operator' | 'approver' | 'viewer', path = '/app') {
  await page.goto(path)
  await expect(page.getByRole('heading', { name: 'Sign in to the console' })).toBeVisible()
  await page.getByRole('button', { name: `Sign in as ${role} (core hermetic)` }).click()
  await expect(page.getByTestId('api-banner')).toBeVisible()
}

const ROUTES = ['/app', '/app/connectors', '/app/connectors/gmail', '/app/connections', '/app/connections/new', '/app/tools', '/app/agents',
  '/app/policies', '/app/policies/oal-default-v1', '/app/approvals', '/app/executions', '/app/receipts', '/app/events', '/app/security',
  '/app/environments', '/app/developer', '/app/usage', '/app/team', '/app/audit', '/app/settings']

test('every /app route renders from core: all /v1 reads succeed, no error state, no demo data', async ({ page }) => {
  test.setTimeout(120_000)
  const failed: string[] = []
  page.on('response', (r) => { const u = new URL(r.url()); if (u.pathname.startsWith('/v1') && r.status() >= 400) failed.push(`${r.request().method()} ${u.pathname} ${r.status()}`) })
  await signInAs(page, 'operator')
  for (const r of ROUTES) {
    await page.goto(r)
    await expect(page.locator('main h1').first()).toBeVisible()
    await expect(page.getByTestId('api-error')).toHaveCount(0)
    await expect(page.getByTestId('demo-banner')).toHaveCount(0)
  }
  expect(failed).toEqual([])
})

test('identity comes from core /v1/me; the session restores and signs out', async ({ page }) => {
  await signInAs(page, 'viewer', '/app/developer')
  await expect(page.locator('main')).toContainText('usr_hermetic_viewer')
  await page.reload()
  await expect(page.locator('main')).toContainText('usr_hermetic_viewer')
  await page.getByRole('button', { name: 'Sign out' }).first().click()
  await expect(page.getByRole('heading', { name: 'Sign in to the console' })).toBeVisible()
})

test('catalogue: core rows, cursor paging, Golden Five Gmail with core dispatch truth', async ({ page }) => {
  await signInAs(page, 'operator', '/app/connectors')
  await expect(page.getByTestId('api-count')).toHaveText('50 loaded · more available')
  await page.getByRole('button', { name: 'Load more' }).click()
  await expect(page.getByTestId('api-count')).toContainText('100 loaded')
  await page.goto('/app/connectors/gmail')
  await expect(page.locator('main h1')).toHaveText('Gmail')
  await expect(page.getByText('Dispatch eligibility (API)')).toBeVisible()
  await expect(page.getByText('Not dispatchable in any environment')).toBeVisible()
  await expect(page.locator('main')).toContainText('no_explicit_grant')
})

test('governed path: viewer cannot grant; approver grants in the console; core executes and issues a test-double receipt', async ({ page }) => {
  const p = await governedPathToApproval()

  await signInAs(page, 'viewer', `/app/approvals/${p.approval_id}`)
  await expect(page.getByTestId('approval-grant')).toBeDisabled()
  await page.getByRole('button', { name: 'Sign out' }).first().click()

  await signInAs(page, 'approver', `/app/approvals/${p.approval_id}`)
  await page.getByTestId('approval-grant').click()
  await expect(page.getByRole('dialog')).toContainText('Idempotency-Key idem_')
  await page.getByTestId('confirm-submit').click()
  await expect(page.getByRole('status')).toContainText('Approval is now GRANTED (by usr_hermetic_approver)')

  // the agent submits the approved step (MODE 2 unlocked on this local server only)
  const ex = await core<{ execution_id: string; outcome: string; receipt: { receipt_id: string; evidence_grade: string } }>('POST', '/v1/executions',
    { run_id: p.run_id, plan_id: p.plan_id, step_id: p.step_id, approval_id: p.approval_id }, { 'dcs-operator-attestation': ATTEST })
  expect(ex.status).toBe(202)
  expect(ex.body.outcome).toBe('SUCCEEDED')
  expect(ex.body.receipt.evidence_grade).toBe('test_double_not_evidence')

  await page.goto(`/app/approvals/${p.approval_id}`)
  await expect(page.locator('main')).toContainText('CONSUMED')
  await page.goto(`/app/executions/${ex.body.execution_id}`)
  await expect(page.locator('main')).toContainText('SUCCEEDED')
  await page.goto(`/app/receipts/${ex.body.receipt.receipt_id}`)
  await page.getByTestId('receipt-verify').click()
  await page.getByTestId('confirm-submit').click()
  await expect(page.getByTestId('verify-result')).toContainText('unverified_test_double')
  await expect(page.getByTestId('verify-result')).toContainText('this is not evidence')
})

test('approver denies a second approval with a required reason', async ({ page }) => {
  const p = await governedPathToApproval()
  await signInAs(page, 'approver', `/app/approvals/${p.approval_id}`)
  await page.getByTestId('approval-deny').click()
  const d = page.getByRole('dialog')
  await expect(d.getByTestId('confirm-submit')).toBeDisabled()
  await d.getByLabel('Reason').fill('not this change')
  await d.getByTestId('confirm-submit').click()
  await expect(page.getByRole('status')).toContainText('Approval is now DENIED')
})

test('connection flow against core: refuse a raw secret, create with a vault reference, test, activate', async ({ page }) => {
  await signInAs(page, 'operator', '/app/connections/new?connector=deepl')
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
})

test('kill order against core: create, restore records reviewer and reason (core enforces no second identity)', async ({ page }) => {
  const conns = await core<{ data: { connection_id: string; connector_id: string }[] }>('GET', '/v1/connections?connector_id=slack')
  await signInAs(page, 'operator', '/app/security')
  await page.getByTestId('kill-create').click()
  const d = page.getByRole('dialog')
  await d.getByLabel('Scope').selectOption('connection')
  await d.getByLabel('Target id').fill(conns.body.data[0].connection_id)
  await d.getByLabel('Reason').fill('suspicious activity drill')
  await d.getByLabel('Reviewer').fill('usr_hermetic_approver')
  await page.getByTestId('confirm-submit').click()
  await expect(page.getByRole('status')).toContainText('is active')
  await page.locator('[data-testid^="kill-restore-"]').first().click()
  const r = page.getByRole('dialog')
  await r.getByLabel('Reason').fill('drill over')
  await r.getByLabel('Reviewer').fill('usr_hermetic_approver')
  await page.getByTestId('confirm-submit').click()
  await expect(page.getByRole('status')).toContainText('restored')
  const after = await core<{ data: { state: string; restore_reason: string }[] }>('GET', '/v1/operator/kill-orders', undefined, { authorization: 'Bearer coso_hermetic_operator_0000000001' })
  expect(after.body.data.some((k) => k.state === 'restored' && k.restore_reason === 'drill over (reviewer: usr_hermetic_approver)')).toBe(true)
})

test('run detail, then operator revokes a granted approval against core', async ({ page }) => {
  const p = await governedPathToApproval()
  const granted = await core<{ state: string }>('POST', `/v1/approvals/${p.approval_id}/grant`, { ttl_seconds: 600 }, { authorization: 'Bearer coso_hermetic_approver_0000000001' })
  expect(granted.body.state).toBe('GRANTED')
  await signInAs(page, 'operator', `/app/agents/runs/${p.run_id}`)
  await expect(page.locator('main h1')).toHaveText(p.run_id)
  await expect(page.locator('main')).toContainText(p.approval_id)
  await page.goto(`/app/approvals/${p.approval_id}`)
  await page.getByTestId('approval-revoke').click()
  await page.getByRole('dialog').getByLabel('Reason').fill('plan superseded')
  await page.getByTestId('confirm-submit').click()
  await expect(page.getByRole('status')).toContainText('Approval is now REVOKED')
})

test('policy dry-run evaluation is answered by core', async ({ page }) => {
  await signInAs(page, 'viewer', '/app/policies/oal-default-v1')
  await page.getByTestId('policy-evaluate').click()
  const d = page.getByRole('dialog')
  await d.getByLabel('Connector id').fill('github')
  await d.getByLabel('Tool id').fill('update_issue')
  await d.getByLabel('Operation class').selectOption('write')
  await page.getByTestId('confirm-submit').click()
  await expect(page.getByTestId('policy-decision')).toContainText('oal-default-v1')
  const direct = await core<{ decision: string }>('POST', '/v1/policies/evaluate', { connector_id: 'github', tool_id: 'update_issue', operation_class: 'write' })
  await expect(page.getByTestId('policy-decision')).toContainText(direct.body.decision)
})

test('operator revokes a connection against core (irreversible, reason + reviewer recorded)', async ({ page }) => {
  const created = await core<{ connection_id: string }>('POST', '/v1/connections', { connector_id: 'deepl', credential_ref: 'cref_11111111-2222-4333-8444-555555555555', label: 'revoke-me' }, { authorization: 'Bearer coso_hermetic_operator_0000000001' })
  expect(created.status).toBe(201)
  await signInAs(page, 'operator', `/app/connections/${created.body.connection_id}`)
  await page.getByTestId('conn-revoke').click()
  const d = page.getByRole('dialog')
  await expect(d).toContainText('Irreversible')
  await d.getByLabel('Reason').fill('credential rotated')
  await d.getByLabel('Reviewer').fill('usr_hermetic_approver')
  await page.getByTestId('confirm-submit').click()
  await expect(page.getByRole('status')).toContainText('Connection revoked')
  await expect(page.locator('main')).toContainText('no further actions')
})

test('not-found, invalid id and backend-unreachable states with core', async ({ page }) => {
  await signInAs(page, 'operator', '/app/executions/00000000-0000-4000-8000-000000000000')
  await expect(page.getByTestId('api-error')).toHaveAttribute('data-code', 'not_found')
  // core validates the id shape before lookup: a malformed id is a 400, shown as such
  await page.goto('/app/executions/exe_does_not_exist')
  await expect(page.getByTestId('api-error')).toHaveAttribute('data-code', 'invalid_request')
  await page.route('**/v1/receipts*', (r) => r.abort('connectionrefused'))
  await page.goto('/app/receipts')
  await expect(page.getByTestId('api-error')).toContainText('Backend unavailable')
})
