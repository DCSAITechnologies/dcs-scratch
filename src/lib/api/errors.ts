import type { components } from './schema.gen'

export type ErrorCode = components['schemas']['ErrorCode']

// Client-side conditions that never came from the server's error envelope.
export type ClientErrorCode = 'network' | 'timeout' | 'bad_response' | 'outcome_unknown'

export class ApiError extends Error {
  readonly status: number
  readonly code: ErrorCode | ClientErrorCode
  readonly retriable: boolean
  readonly requestId: string | null
  readonly correlationId: string
  readonly detail: Record<string, unknown>
  readonly retryAfter: number | null

  constructor(o: { status: number; code: ErrorCode | ClientErrorCode; message: string; retriable: boolean; requestId?: string | null; correlationId: string; detail?: Record<string, unknown>; retryAfter?: number | null }) {
    super(o.message)
    this.name = 'ApiError'
    this.status = o.status
    this.code = o.code
    this.retriable = o.retriable
    this.requestId = o.requestId ?? null
    this.correlationId = o.correlationId
    this.detail = o.detail ?? {}
    this.retryAfter = o.retryAfter ?? null
  }

  get unauthenticated() { return this.code === 'unauthenticated' }
  get forbidden() { return this.code === 'permission_denied' || this.code === 'human_required' }
  get notFound() { return this.code === 'not_found' }
  get notImplemented() { return this.code === 'not_implemented' }
  get unreachable() { return this.code === 'network' || this.code === 'timeout' }
}

// Human-facing summary of an error. Server messages are safe to show (the contract
// guarantees no secrets or provider bodies); client codes get our own wording.
export function describeError(e: unknown): { title: string; body: string } {
  if (!(e instanceof ApiError)) return { title: 'Unexpected error', body: 'The console hit an unexpected problem. Retry, or reload the page.' }
  switch (e.code) {
    case 'network': return { title: 'Backend unavailable', body: 'The Connector OS API could not be reached. Check your connection or the API status, then retry.' }
    case 'timeout': return { title: 'Request timed out', body: 'The API did not answer in time. Retry in a moment.' }
    case 'outcome_unknown': return { title: 'Outcome unknown', body: 'The request may or may not have been applied. Reload the record before trying again — a retry reuses the same Idempotency-Key.' }
    case 'bad_response': return { title: 'Unexpected response', body: 'The API answered with something the console could not read.' }
    case 'unauthenticated': return { title: 'Session expired', body: 'Sign in again to continue.' }
    case 'permission_denied': return { title: 'Permission denied', body: e.message }
    case 'human_required': return { title: 'Human operator required', body: e.message }
    case 'not_found': return { title: 'Not found', body: 'This record does not exist in your tenant.' }
    case 'not_implemented': return { title: 'Not available yet', body: 'This operation is specified in the API contract but not implemented by the server you are connected to.' }
    case 'rate_limited': return { title: 'Rate limited', body: `Too many requests.${e.retryAfter ? ` Retry in ${e.retryAfter}s.` : ''}` }
    case 'dependency_unavailable': return { title: 'Dependency unavailable', body: e.message }
    default: return { title: e.code.replaceAll('_', ' '), body: e.message }
  }
}
