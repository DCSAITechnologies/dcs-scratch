# API overview

The Connector OS API is versioned by path (`/v1`), JSON over HTTPS, cursor-paginated, and
governed: **no API call reaches a provider except through policy, human approval and the
ops-broker.** Full route list: [API_ROUTE_MAP.md](API_ROUTE_MAP.md). Contract:
`openapi/connector-os-v1.yaml` (OpenAPI 3.1, FROZEN 1.0.0).

## Resources

| Resource | Purpose | Maturity |
|---|---|---|
| Connectors | catalogue (1009 rows) + real dispatch eligibility | WIRED |
| Connections | a tenant's bound credentials, by **reference** only (`cref_…`) | HERMETIC |
| Runs, Plans | OAL runs (`mode_0` observe, `mode_1` plan); plans are recommendations | HERMETIC |
| Approvals | human decisions on `require_approval` steps | HERMETIC |
| Executions | one dispatched step; EXEC-FACTS outcome + attempts + reconciliation | HERMETIC |
| Receipts | R-Series receipts per fact; verification via the R-Series verifier | HERMETIC |
| Policies | policy rules; `POST /v1/policies/evaluate` dry-runs a decision | HERMETIC |
| Events | platform event log (reference-only payloads) | HERMETIC |
| Webhooks | outbound subscriptions | PLANNED (501) |
| Environments, Usage, Me | eligibility counts, usage rollup, credential description | WIRED / HERMETIC |
| Operator (`/v1/operator/*`) | kill/restore, revoke, reconciliation, eligibility, provider health, audit export | HERMETIC (audit export PLANNED); human operators only |

## The governed path

```
POST /v1/runs                   open a mode_1 run
POST /v1/runs/{id}/plans        steps → each gets a policy decision: allow | require_approval | deny
POST /v1/approvals              request approval (REQUESTED) — never grants
POST /v1/approvals/{id}/grant   HUMAN operator only → GRANTED (OAL ISSUED); broker mints execution ids
POST /v1/executions             + DCS-Operator-Attestation (human) → ops-broker:
                                  policy re-evaluated · approval consumed once · kill switch · dispatch
GET  /v1/executions/{id}        outcome (EXEC-FACTS) · attempts · reconciliation · receipt (separate)
```

MODE 2 (execution) is **locked** until the ops-broker asserts readiness; until then
`POST /v1/executions` answers `409 mode_locked` listing the pending dependencies.

## Conventions

- **Pagination:** `?limit=1..200` (default 50), opaque `cursor`; responses are
  `{object:"list", data, has_more, next_cursor}`, newest first, stable under concurrent writes.
- **Idempotency:** every mutating POST requires `Idempotency-Key`. See [ERROR_MODEL.md](ERROR_MODEL.md).
- **Correlation:** send `X-Correlation-Id`; every response carries `X-Request-Id` and echoes the correlation id.
- **Rate limits:** `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`; `429` carries `Retry-After`.
- **Versioning:** [VERSIONING.md](VERSIONING.md). **Errors:** [ERROR_MODEL.md](ERROR_MODEL.md).
- **Tenancy:** the tenant comes from the credential, never the request. Another tenant's resource is a `404`, identical to a missing one.
- **Secrets never cross the API.** A body with a secret-shaped field is refused (`400 secret_in_request`).

## Outcomes are not receipts

`Execution.outcome` is the frozen EXEC-FACTS v1 enum: `REFUSED, BLOCKED, STARTED, SUCCEEDED,
FAILED, PROVIDER_UNAVAILABLE, OUTCOME_UNKNOWN, RETRY_SCHEDULED, RETRY_EXHAUSTED`.
`OUTCOME_UNKNOWN` means the provider may or may not have applied the effect: it is **not a
failure**, is **never retried**, and is resolved by an operator
(`POST /v1/operator/executions/{id}/reconcile`, `OUTCOME_UNKNOWN → SUCCEEDED | FAILED` only).
`Execution.receipt.status` (`not_requested | PENDING | ISSUED | FAILED`) is a separate field.
