// Shared request client for the Connector OS API (/v1, contract 1.0.0).
//
// - Base URL from config (VITE_COS_API_URL); calling it in demo mode is a bug and throws.
// - Bearer token from the auth layer via setTokenProvider() — never read from storage here.
// - X-Correlation-Id on every request; the server echoes it and adds X-Request-Id.
// - Idempotency-Key on every mutating POST (required by the contract). The caller
//   passes one key per user action so a retry replays instead of duplicating.
// - Retry policy exactly as ERROR_MODEL.md "SDK retry policy":
//     GET  → retry transport failures and 5xx except 501 (and 429 after Retry-After).
//     POST → retry only when the request provably never arrived (connection
//            refused / DNS) or was rejected before processing (429, or 503 with
//            retriable:true) — always with the same Idempotency-Key. A timeout or
//            500/502/504 on a write becomes `outcome_unknown` and is never retried.
// - 401 notifies the auth layer (session expired) before the error propagates.

import { API_BASE_URL } from './config'
import { ApiError } from './errors'

type TokenProvider = () => Promise<string | null> | string | null
let tokenProvider: TokenProvider = () => null
let onUnauthenticated: (() => void) | null = null

export function setTokenProvider(p: TokenProvider) { tokenProvider = p }
export function setUnauthenticatedHandler(h: (() => void) | null) { onUnauthenticated = h }

export const newId = (prefix: string) =>
  `${prefix}_${(globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`).replaceAll('-', '')}`

export type RequestOptions = {
  query?: Record<string, string | number | boolean | null | undefined>
  body?: unknown
  idempotencyKey?: string
  // a POST the contract defines as a read (verify, policy evaluate): no Idempotency-Key
  readOnly?: boolean
  signal?: AbortSignal
  timeoutMs?: number
  maxRetries?: number
}

const RETRYABLE_GET_STATUS = (s: number) => s === 429 || (s >= 500 && s !== 501)
const sleep = (ms: number, signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
  const t = setTimeout(resolve, ms)
  signal?.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('Aborted', 'AbortError')) }, { once: true })
})

function buildUrl(path: string, query?: RequestOptions['query']): string {
  if (!API_BASE_URL) throw new Error('API client used in demo mode (VITE_COS_API_URL is not set)')
  const url = new URL(API_BASE_URL + path)
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
  return url.toString()
}

async function parseError(res: Response, correlationId: string): Promise<ApiError> {
  const retryAfterHeader = res.headers.get('Retry-After')
  const retryAfter = retryAfterHeader && /^\d+$/.test(retryAfterHeader) ? Number(retryAfterHeader) : null
  let payload: unknown = null
  try { payload = await res.json() } catch { /* non-JSON error body */ }
  const err = (payload as { error?: Record<string, unknown> } | null)?.error
  if (err && typeof err.code === 'string') {
    return new ApiError({
      status: res.status, code: err.code as ApiError['code'], message: String(err.message ?? res.statusText),
      retriable: Boolean(err.retriable), requestId: (err.request_id as string) ?? res.headers.get('X-Request-Id'),
      correlationId, detail: (err.detail as Record<string, unknown>) ?? {}, retryAfter,
    })
  }
  return new ApiError({ status: res.status, code: 'bad_response', message: `HTTP ${res.status}`, retriable: false, requestId: res.headers.get('X-Request-Id'), correlationId, retryAfter })
}

export async function request<T>(method: 'GET' | 'POST' | 'DELETE', path: string, opts: RequestOptions = {}): Promise<T> {
  const write = method !== 'GET' && !opts.readOnly
  if (write && method === 'POST' && !opts.idempotencyKey) throw new Error(`POST ${path} needs an Idempotency-Key (contract: every mutating POST)`)
  const correlationId = newId('corr')
  const maxRetries = opts.maxRetries ?? 2
  const url = buildUrl(path, opts.query)

  for (let attempt = 0; ; attempt++) {
    const token = await tokenProvider()
    const headers: Record<string, string> = { Accept: 'application/json', 'X-Correlation-Id': correlationId }
    if (token) headers.Authorization = `Bearer ${token}`
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
    if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort('timeout'), opts.timeoutMs ?? 15_000)
    opts.signal?.addEventListener('abort', () => controller.abort(opts.signal?.reason), { once: true })

    let res: Response
    try {
      res = await fetch(url, { method, headers, body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined, signal: controller.signal, credentials: 'omit' })
    } catch (e) {
      clearTimeout(timeout)
      if (opts.signal?.aborted) throw e
      const timedOut = controller.signal.reason === 'timeout'
      // A timed-out write may have been applied; a refused connection was not.
      if (write && timedOut) throw new ApiError({ status: 0, code: 'outcome_unknown', message: 'The write timed out; its outcome is unknown.', retriable: false, correlationId })
      if (attempt < maxRetries) { await sleep(300 * 2 ** attempt, opts.signal); continue }
      throw new ApiError({ status: 0, code: timedOut ? 'timeout' : 'network', message: timedOut ? 'Request timed out' : 'Network error', retriable: true, correlationId })
    }
    clearTimeout(timeout)

    if (res.ok) {
      if (res.status === 204) return undefined as T
      try { return (await res.json()) as T } catch {
        throw new ApiError({ status: res.status, code: 'bad_response', message: 'Response was not JSON', retriable: false, requestId: res.headers.get('X-Request-Id'), correlationId })
      }
    }

    const err = await parseError(res, correlationId)
    if (err.unauthenticated) onUnauthenticated?.()
    const canRetry = attempt < maxRetries && (write
      ? res.status === 429 || (res.status === 503 && err.retriable)
      : RETRYABLE_GET_STATUS(res.status))
    if (canRetry) { await sleep((err.retryAfter ?? 0.3 * 2 ** attempt) * 1000, opts.signal); continue }
    if (write && [500, 502, 504].includes(res.status)) {
      throw new ApiError({ status: res.status, code: 'outcome_unknown', message: 'The server failed while processing the write; its outcome is unknown.', retriable: false, requestId: err.requestId, correlationId })
    }
    throw err
  }
}
