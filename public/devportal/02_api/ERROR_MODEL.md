# Error model

Every error is one envelope:

```json
{ "error": { "code": "broker_refused", "message": "The ops-broker refused the submission.",
             "retriable": false, "request_id": "req_…", "detail": { "refusal_code": "APPROVAL-REPLAY" } } }
```

`message` never contains secrets, credentials or provider bodies. `retriable` says whether the
**same** request may be retried.

| `code` | HTTP | Meaning | SDK error |
|---|---|---|---|
| `invalid_request` | 400 | malformed request; `detail.field` | `InvalidRequestError` |
| `secret_in_request` | 400 | a secret-shaped field was sent | `InvalidRequestError` |
| `idempotency_key_required` | 400 | mutating POST without `Idempotency-Key` | `InvalidRequestError` |
| `unauthenticated` | 401 | missing/unknown credential | `AuthenticationError` |
| `permission_denied` | 403 | missing scope/capability (`detail.scope` / `detail.capability`) | `PermissionDeniedError` |
| `human_required` | 403 | a human operator is required | `HumanRequiredError` |
| `not_found` | 404 | absent **or in another tenant** | `NotFoundError` |
| `conflict` | 409 | state conflict | `ConflictError` |
| `illegal_transition` | 409 | lifecycle move not allowed (`detail.from/to`) | `IllegalTransitionError` |
| `mode_locked` | 409 | MODE 2 locked (`detail.pending`) | `ModeLockedError` |
| `broker_refused` | 409 | ops-broker refused before dispatch (`detail.refusal_code`, verbatim) | `BrokerRefusedError` |
| `approval_not_grantable` | 409 | approval not in `REQUESTED` | `ConflictError` |
| `idempotency_key_reuse` | 422 | key already used with a different body | `IdempotencyConflictError` |
| `rate_limited` | 429 | slow down (`Retry-After`) | `RateLimitError` |
| `not_implemented` | 501 | CONTRACT_ONLY operation | `NotImplementedError` |
| `dependency_unavailable` | 503 | ops-broker / R-Series unavailable | `DependencyUnavailableError` |
| `internal` | 500 | server fault | `InternalServerError` |

Broker refusal codes you may see in `detail.refusal_code`: `APPROVAL-REQUIRED`, `APPROVAL-REPLAY`,
`APPROVAL-REVOKED`, `APPROVAL-EXPIRED`, `STEP-NOT-APPROVED`, `PLAN-SUBSTITUTED`, `POLICY-MISMATCH`,
`POLICY-REFUSED`, `ALREADY-RECORDED`, `APPROVER-NOT-HUMAN`, `INVALID-REQUEST`, `NOT-REVOCABLE`,
`STEP-ALREADY-APPROVED` (the ops-broker's own vocabulary, passed through unchanged).

## Idempotency

- Every mutating POST requires `Idempotency-Key` (8–255 chars `[A-Za-z0-9_.:-]`).
- Same key + same body after a **successful (2xx)** response → the original response is replayed with `Idempotent-Replayed: true`.
- Same key + different body → `422 idempotency_key_reuse`.
- A refused or failed request had no effect and is **not recorded**: re-sending its key is evaluated afresh.
- This key is request replay protection only. The **execution** idempotency key is minted by the ops-broker and can never be set by a client.

## `outcome_unknown` — two different things

1. **Execution outcome `OUTCOME_UNKNOWN`** (a normal `202`/`200` body): the provider may or may not have applied the effect. Not an error. Never retried. Reconciled by an operator.
2. **SDK `RequestOutcomeUnknownError`**: the client could not tell whether the *API* processed a write (timeout, reset, 500/502/504). The SDK never retries it; re-send with the **same** Idempotency-Key, or read the resource.

## SDK retry policy

GETs retry on transport failures and 5xx (not 501). Writes retry **only** when the request provably
never arrived (connection refused / DNS) or the server rejected it before processing (429, or 503
with `retriable: true`) — always with the same Idempotency-Key.
