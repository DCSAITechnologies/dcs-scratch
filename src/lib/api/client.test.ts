import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ApiError } from './errors'

// await a rejection and hand back the typed error
const rejection = async (p: Promise<unknown>): Promise<ApiError> => {
  try { await p } catch (e) { return e as ApiError }
  throw new Error('expected the request to fail')
}

type Call = { url: string; init: RequestInit }
let calls: Call[] = []
let responses: (() => Response | Promise<Response>)[] = []

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } })
const errorBody = (code: string, retriable = false) => ({ error: { code, message: `${code} msg`, retriable, request_id: 'req_1' } })

async function load() {
  vi.resetModules()
  vi.stubEnv('VITE_COS_API_URL', 'http://api.test/')
  return { client: await import('./client'), errors: await import('./errors') }
}

beforeEach(() => {
  calls = []
  responses = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init })
    const next = responses.shift()
    if (!next) throw new Error('unexpected fetch')
    return next()
  }))
  vi.useFakeTimers({ shouldAdvanceTime: true, advanceTimeDelta: 50 })
})

const header = (c: Call, h: string) => (c.init.headers as Record<string, string>)[h]

describe('request client', () => {
  it('builds the URL, sends correlation id, bearer token and query', async () => {
    const { client } = await load()
    client.setTokenProvider(() => 'tok_123')
    responses.push(json(200, { object: 'list', data: [] }))
    await client.request('GET', '/v1/connectors', { query: { q: 'git', limit: 10, cursor: null } })
    expect(calls[0].url).toBe('http://api.test/v1/connectors?q=git&limit=10')
    expect(header(calls[0], 'Authorization')).toBe('Bearer tok_123')
    expect(header(calls[0], 'X-Correlation-Id')).toMatch(/^corr_/)
    expect(calls[0].init.credentials).toBe('omit')
  })

  it('refuses a mutating POST without an Idempotency-Key, allows contract read-POSTs', async () => {
    const { client } = await load()
    await expect(client.request('POST', '/v1/approvals/ap_1/grant', { body: {} })).rejects.toThrow(/Idempotency-Key/)
    responses.push(json(200, { object: 'receipt_verification' }))
    await client.request('POST', '/v1/receipts/rc_1/verify', { readOnly: true })
    expect(header(calls[0], 'Idempotency-Key')).toBeUndefined()
  })

  it('parses the error envelope into a typed ApiError', async () => {
    const { client, errors } = await load()
    responses.push(json(403, { error: { code: 'permission_denied', message: 'needs approve', retriable: false, request_id: 'req_9', detail: { capability: 'approve' } } }))
    const e = await rejection(client.request('GET', '/v1/approvals'))
    expect(e).toBeInstanceOf(errors.ApiError)
    expect(e.code).toBe('permission_denied')
    expect(e.forbidden).toBe(true)
    expect(e.requestId).toBe('req_9')
    expect(e.detail).toEqual({ capability: 'approve' })
  })

  it('retries GET on 503 and succeeds; same correlation id across attempts', async () => {
    const { client } = await load()
    responses.push(json(503, errorBody('dependency_unavailable', true)), json(200, { ok: 1 }))
    await expect(client.request('GET', '/v1/receipts')).resolves.toEqual({ ok: 1 })
    expect(calls).toHaveLength(2)
    expect(header(calls[0], 'X-Correlation-Id')).toBe(header(calls[1], 'X-Correlation-Id'))
  })

  it('never retries 501 not_implemented', async () => {
    const { client } = await load()
    responses.push(json(501, errorBody('not_implemented')))
    const e = await rejection(client.request('GET', '/v1/webhooks'))
    expect(e.notImplemented).toBe(true)
    expect(calls).toHaveLength(1)
  })

  it('a write that fails with 500 becomes outcome_unknown and is not retried', async () => {
    const { client } = await load()
    responses.push(json(500, errorBody('internal')))
    const e = await rejection(client.request('POST', '/v1/approvals/ap_1/deny', { body: { reason: 'x' }, idempotencyKey: 'idem_12345' }))
    expect(e.code).toBe('outcome_unknown')
    expect(calls).toHaveLength(1)
  })

  it('a write rejected with 429 is retried with the same Idempotency-Key after Retry-After', async () => {
    const { client } = await load()
    responses.push(json(429, errorBody('rate_limited', true), { 'Retry-After': '1' }), json(200, { object: 'approval' }))
    await client.request('POST', '/v1/approvals/ap_1/deny', { body: { reason: 'x' }, idempotencyKey: 'idem_abcdef' })
    expect(calls).toHaveLength(2)
    expect(header(calls[1], 'Idempotency-Key')).toBe('idem_abcdef')
  })

  it('a write rejected with 409 is surfaced, not retried', async () => {
    const { client } = await load()
    responses.push(json(409, errorBody('approval_not_grantable')))
    const e = await rejection(client.request('POST', '/v1/approvals/ap_1/grant', { body: { ttl_seconds: 60 }, idempotencyKey: 'idem_123456' }))
    expect(e.code).toBe('approval_not_grantable')
    expect(calls).toHaveLength(1)
  })

  it('401 notifies the auth layer', async () => {
    const { client } = await load()
    const onExpired = vi.fn()
    client.setUnauthenticatedHandler(onExpired)
    responses.push(json(401, errorBody('unauthenticated')))
    const e = await rejection(client.request('GET', '/v1/me'))
    expect(e.unauthenticated).toBe(true)
    expect(onExpired).toHaveBeenCalledOnce()
  })

  it('GET network failures retry then surface as network errors', async () => {
    const { client } = await load()
    const fail = () => { throw new TypeError('fetch failed') }
    responses.push(fail, fail, fail)
    const e = await rejection(client.request('GET', '/v1/runs'))
    expect(e.code).toBe('network')
    expect(e.unreachable).toBe(true)
    expect(calls).toHaveLength(3)
  })
})

describe('describeError', () => {
  it('gives user-facing copy for client and server codes', async () => {
    const { errors } = await load()
    const mk = (code: string) => new errors.ApiError({ status: 0, code: code as never, message: 'm', retriable: false, correlationId: 'c' })
    expect(errors.describeError(mk('network')).title).toBe('Backend unavailable')
    expect(errors.describeError(mk('unauthenticated')).title).toBe('Session expired')
    expect(errors.describeError(mk('not_implemented')).title).toBe('Not available yet')
    expect(errors.describeError(new Error('x')).title).toBe('Unexpected error')
  })
})
