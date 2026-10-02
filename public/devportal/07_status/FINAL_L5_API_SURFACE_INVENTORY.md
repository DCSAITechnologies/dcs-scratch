# FINAL_L5_API_SURFACE_INVENTORY — Connector OS public API (Lane 5, Phase 0)

| Field | Value |
|---|---|
| Lane | 5 — Developer platform / DevEx |
| Branch | `lane/l5-devex-platform` (worktree `~/dcs-lanes/l5`) |
| Base | `c40cd913bd8b6e4c24c5453d598819ea8d7431ed` (`core/shared-core-remediation` tip; same base as Lanes 1, 2, 4) |
| Base baseline | 2298/2298 tests, gates 12/12, guards 5/5 (evidence `~/dcs-lanes/l5-evidence/baseline-*.log`) |
| Prestart bundle | `~/CONNECTOR_OS_BACKUPS/connector-os_L5_PRESTART_c40cd91_20260928_200420.bundle` (sha256 `7e841e7b…5aa5c5c9`, restore proven) |
| Date | 28 Sep 2026 |

## 0. What exists today (read, not assumed)

| Surface | Where | Fact |
|---|---|---|
| HTTP server | `packages/read-api/src/server.mjs` (both c40cd91 and ec49ad8, byte-identical) | The **only** HTTP server in the monorepo. Express 4, GET-only, **founder-gated** (single shared `X-Founder-Token`, failed auth → 404), single tenant from env, offset pagination (`limit` ≤1000), untyped error bodies (`{error:'…'}`), 16 table-group routes at `/<name>` with **no `/v1` prefix**. It is a founder dashboard read path, not a public API. |
| Prototype console API | `packages/runtime/src/console-api.mjs` — **ec49ad8 only** | `/v0/console/*`, in-process, session tenant, error envelope `{error:{code,message,detail?}}`. Not on the base. |
| Product path | `packages/{oal-runtime,ops-broker,product,runtime}` — **ec49ad8 only** | In-process libraries, no HTTP. OAL facade (MODE 0/1/2), ops-broker (`submitApprovedStep`, approvals, kill switch), Runtime-E gateway, receipt verifier port. P5 = NO: ec49ad8 is not an ancestor of the base; `integrate/v1-rc` not built. |
| Frozen contracts | `contracts/v1`, `contracts/v1.3` (identical in both) | ToolCall v1, ToolResult v1(.2), errors.v1 (12 classes), Manifest 1.3, EXEC-FACTS v1 (9 outcomes), Webhook Contract v1. |
| Registry data | `packages/registry/data/{catalogue,dispatch-eligibility,staging-verified}.json` (base) | 1009 catalogue rows; **dispatchable_staging = 0, dispatchable_production = 0**; staging-verified `[]`. |
| Existing dev packages | `packages/cli` (`connector-os` bin, A10), `packages/sdk` (`@dcs/connector-os-sdk`, A10 — `main` points at a missing file), `packages/registry` MCP mapping (A7), `packages/connector-kit` (Lane 2) | All `private:true`. **Lane 5 does not edit any of them.** |
| Website Developers content | `~/Downloads/CONNECTOR_OS_WEBSITE_DASHBOARD_1000_FINAL/source/src` | States "no endpoint URLs yet", SDK/CLI **PRE-LAUNCH**, promises idempotency keys on every mutating call and **cursor** pagination, outbound events `approval.requested`, `execution.state_changed`, `receipt.issued`, `receipt.failed`. Package names on the site are inconsistent (`@dcs/connect-os`, `@dcslabs/connector-os`, `cos` CLI). |

## 1. Contract facts the public API must not contradict

| Fact | Source | Consequence for /v1 |
|---|---|---|
| Execution outcome is exactly `REFUSED, BLOCKED, STARTED, SUCCEEDED, FAILED, PROVIDER_UNAVAILABLE, OUTCOME_UNKNOWN, RETRY_SCHEDULED, RETRY_EXHAUSTED`; `OUTCOME_UNKNOWN` is "never a failure, never retried before reconciliation" | `contracts/v1.3/exec-facts.v1.json` | `Execution.outcome` is this closed enum, passed through verbatim. SDKs never map it to an error and never retry it. |
| `operation_class` = `read | write | admin` | EXEC-FACTS | The dashboard's `destructive`/`money-moving` are **impact tags** (`IMPACT_TAGS`), exposed as `impact[]`, not as operation classes. |
| `execution_id`, `attempt_n`, `idempotency_key`, `verification_ref`, `reconciliation_ref`, `receipt_ref` are **broker-minted** | `oal-runtime/src/exec-identity.mjs` `BROKER_MINTED_FIELDS` | No API request body may set them. The HTTP `Idempotency-Key` header is **request replay protection only** and is never forwarded as the execution idempotency key. |
| Replay authority is `execution_id`, not `idempotency_key` | `execution/src/engine.mjs` (ec49ad8) | Submitting the same approved step twice returns the same execution (or `APPROVAL-REPLAY`), never a second dispatch. |
| Approval status stored = `ISSUED | CONSUMED | REVOKED`; `EXPIRED` is derived; `approved_by.kind = 'human'`; TTL ≤ 24 h (broker default 15 min); consumption per step, atomic | `oal-runtime/src/schemas.mjs`, `approval.mjs`, `ops-broker/src/approvals.mjs` | Public `Approval.state` adds the *pre-issue* request lifecycle (`REQUESTED`, `DENIED`, `SUPERSEDED`) and carries `oal_status` verbatim. Grant/deny/revoke need a **human operator** credential; an API key can never grant. |
| Execute / approve / redrive require a verified **operator attestation** `{kind:'human', tenant_id, principal_id, attestation_ref}` | `ops-broker/src/broker.mjs` | `POST /v1/executions` requires the `DCS-Operator-Attestation` header in addition to credentials. |
| MODE 2 is locked until a readiness record asserted by ops-broker has all 6 `MODE_2_DEPENDENCIES` green | `oal-runtime/src/dependencies.mjs` | Default response to `POST /v1/executions` is `409 mode_locked` with `detail.pending`. |
| Broker refusal codes (`APPROVAL-REQUIRED`, `APPROVAL-REPLAY`, `PLAN-HASH-MISMATCH`, …, `RSERIES-UNAVAILABLE`) | `ops-broker/src/broker.mjs` | Surfaced verbatim as `error.detail.refusal_code`; HTTP `error.code` is `broker_refused`. |
| Receipt status = `ISSUED | PENDING | FAILED` (display adds `not_requested`); verification label = `not_verified | verified | verification_failed | verification_unavailable | unverified_test_double`; "verified" only from an `rseries`-kind verifier with `code=OK`, matching outcome, `profile_status=frozen` | `runtime/src/evidence-slot.mjs` | `Execution.receipt` is a separate object from `Execution.outcome`. The API never reports `verified` from a non-R-Series verifier. |
| Connector OS performs no receipt cryptography; R-Series owns digests, signatures and verification | `tools/guards/no-crypto.mjs`, `evidence-client/src/boundary.mjs` | Receipt verification in API/SDK/CLI/MCP is **delegation to the R-Series verifier port only**; offline tooling does structural checks only. |
| Kill scope (product path) = `system | tenant | connection | connector | tool`; kill/restore need `reason` + `reviewer` (≥3 chars); system kill is write-only | `ops-broker/src/kill-switch.mjs` | Operator kill endpoints use this enum. The legacy A9 scope (`agent`) is not exposed. |
| Connection lifecycle `CREATED | TESTED | ACTIVE | REVOKED` (Runtime-E) **and** credential state `pending | connected | refreshing | degraded | revoked | expired` (auth) **and** health `unknown | healthy | degraded | unhealthy | revoked` | `runtime/src/connection.mjs`, `contracts/src/types.mjs` | Three separate fields, verbatim; no merged invented enum. `credential_ref` matches `^cref_<uuid>$`; secrets never cross the API. |
| OAL run status `open | awaiting_approval | blocked | escalated | closed`; mode `mode_0 | mode_1 | mode_2`; policy decision `allow | deny | require_approval` | `oal-runtime/src/schemas.mjs` | `Run` and `PolicyDecision` enums verbatim. |
| Errors taxonomy (12 classes, retriable flags) | `contracts/v1/errors.v1.json` | `Attempt.error_class` uses it verbatim. |
| Webhook verification is provider-protocol only, via Manifest `webhook_profile` / `webhooks`; only `packages/webhooks/src/verify.mjs` may HMAC | `packages/webhooks`, `tools/guards/allowlist/no-crypto.json` | Connector OS has **no outbound developer webhook** and **no outbound signing scheme**. SDK signature verification cannot be implemented without inventing one and widening the crypto boundary → pluggable verifier + **FD-L5-1**. |
| No RBAC model exists in any backend tree; roles exist only in the dashboard (`org_admin, workspace_admin, approver, developer, viewer`; capabilities `configure, approve, execute, kill, restore, view`) | dashboard `lib/roles.ts` | Operator auth uses the dashboard capability names as the **proposed** shared model; identity issuance is **BLOCKED_BY_LANE3** (IdP/RBAC seam). |
| Dispatch eligibility default-deny; production needs a staging verification | `packages/registry/src/eligibility.mjs`, CR-39 | `Connector.dispatch` reports real eligibility (all false today). No connector is reported "Available". |

## 2. Endpoint classification

**Legend.** `EXISTS` = served today by shipped code · `HERMETIC` = implemented in the Lane 5 reference server over in-memory adapters that mirror the product-path port semantics; not persistence, not deployed · `CONTRACT_ONLY` = in the OpenAPI, the reference server answers `501 not_implemented` · `PLANNED` = not in v1 contract yet · `BLOCKED_BY_LANE3` = production wiring needs Lane 3 (persistence / identity / vault / R-Series route) or the `integrate/v1-rc` base · `EXTERNAL_DEPENDENCY` = needs something outside the repo (provider apps, KMS, R-Series deployment). **WIRED** (in the maturity matrix) = handler reads a canonical in-repo source through its owning package's own loader.

| # | Method | Path | Base state | Reference server | Production blocker |
|---|---|---|---|---|---|
| 1 | GET | `/v1/connectors` | no /v1 route (read-api `/integrations` reads a different DB table) | **WIRED** — `@dcs/connector-os-registry` `catalogue.json` + `DispatchEligibility` | deploy (Lane 4) |
| 2 | GET | `/v1/connectors/{connector_id}` | — | **WIRED** | deploy |
| 3 | GET | `/v1/connections` | — | HERMETIC | BLOCKED_BY_LANE3 (connection store) |
| 4 | POST | `/v1/connections` | — | HERMETIC (`credential_ref` only) | BLOCKED_BY_LANE3 (vault) + EXTERNAL_DEPENDENCY (provider apps) |
| 5 | GET | `/v1/connections/{connection_id}` | — | HERMETIC | BLOCKED_BY_LANE3 |
| 6 | POST | `/v1/connections/{connection_id}/test` | — | HERMETIC (simulator target only) | BLOCKED_BY_LANE3 + EXTERNAL_DEPENDENCY |
| 6b | POST | `/v1/connections/{connection_id}/activate` | — | HERMETIC (TESTED → ACTIVE, Runtime-E lifecycle) | BLOCKED_BY_LANE3 |
| 7 | GET | `/v1/runs` | — | HERMETIC | BLOCKED_BY_LANE3 (OAL run-state store) + v1-rc |
| 8 | POST | `/v1/runs` | — | HERMETIC (MODE 0/1, trigger `operator`) | BLOCKED_BY_LANE3 + v1-rc |
| 9 | GET | `/v1/runs/{run_id}` | — | HERMETIC | BLOCKED_BY_LANE3 |
| 10 | POST | `/v1/runs/{run_id}/plans` | — | HERMETIC (recommendation-only plan) | BLOCKED_BY_LANE3 + v1-rc |
| 11 | GET | `/v1/runs/{run_id}/plans/{plan_id}` | — | HERMETIC | BLOCKED_BY_LANE3 |
| 12 | GET | `/v1/approvals` | — | HERMETIC | BLOCKED_BY_LANE3 (approval store) |
| 13 | POST | `/v1/approvals` | — | HERMETIC (creates `REQUESTED`) | BLOCKED_BY_LANE3 |
| 14 | GET | `/v1/approvals/{approval_id}` | — | HERMETIC | BLOCKED_BY_LANE3 |
| 15 | POST | `/v1/approvals/{approval_id}/grant` | — | HERMETIC (human operator session) | BLOCKED_BY_LANE3 (IdP + attestation) |
| 16 | POST | `/v1/approvals/{approval_id}/deny` | — | HERMETIC | BLOCKED_BY_LANE3 |
| 17 | POST | `/v1/approvals/{approval_id}/revoke` | — | HERMETIC | BLOCKED_BY_LANE3 |
| 18 | POST | `/v1/executions` | — | HERMETIC (policy → approval consume → ops-broker → engine double; **MODE 2 locked by default**) | BLOCKED_BY_LANE3 + v1-rc + MODE 2 readiness |
| 19 | GET | `/v1/executions` | — | HERMETIC | BLOCKED_BY_LANE3 (execution ledger) |
| 20 | GET | `/v1/executions/{execution_id}` | — | HERMETIC | BLOCKED_BY_LANE3 |
| 21 | GET | `/v1/receipts` | read-api `/receipts` (founder, legacy thin rows) | HERMETIC | BLOCKED_BY_LANE3 (authenticated R-Series route) |
| 22 | GET | `/v1/receipts/{receipt_id}` | — | HERMETIC | BLOCKED_BY_LANE3 |
| 23 | POST | `/v1/receipts/{receipt_id}/verify` | — | HERMETIC (verifier port kind `test_double` → label `unverified_test_double`) | BLOCKED_BY_LANE3 + EXTERNAL_DEPENDENCY (R-Series service) |
| 24 | GET | `/v1/policies` | read-api `/policies` (founder, legacy table) | HERMETIC (OAL default policy `oal-default-v1`) | BLOCKED_BY_LANE3 (policy store) |
| 25 | GET | `/v1/policies/{policy_id}` | — | HERMETIC | BLOCKED_BY_LANE3 |
| 26 | POST | `/v1/policies/evaluate` | — | HERMETIC (dry run; no side effects) | v1-rc |
| 27 | GET | `/v1/events` | — | HERMETIC | BLOCKED_BY_LANE3 (eventbus persistence) |
| 28 | GET | `/v1/events/{event_id}` | — | HERMETIC | BLOCKED_BY_LANE3 |
| 29 | GET | `/v1/webhooks` | — | CONTRACT_ONLY (501) | PLANNED (no outbound delivery) + FD-L5-1 |
| 30 | POST | `/v1/webhooks` | — | CONTRACT_ONLY (501) | PLANNED + FD-L5-1 |
| 31 | GET | `/v1/webhooks/{webhook_id}` | — | CONTRACT_ONLY (501) | PLANNED |
| 32 | DELETE | `/v1/webhooks/{webhook_id}` | — | CONTRACT_ONLY (501) | PLANNED |
| 33 | GET | `/v1/environments` | — | **WIRED** (eligibility summary) + HERMETIC (key environment) | deploy |
| 34 | GET | `/v1/usage` | read-api `/usage` (founder, legacy table) | HERMETIC (derived from hermetic ledgers) | BLOCKED_BY_LANE3 |
| 35 | GET | `/v1/me` | — | HERMETIC (static test credentials) | BLOCKED_BY_LANE3 (IdP, API-key issuance) |
| 36 | GET | `/v1/operator/kill-orders` | — | HERMETIC | BLOCKED_BY_LANE3 (kill store + IdP) |
| 37 | POST | `/v1/operator/kill-orders` | CLI `connector-os kill` (A9 file state, not API) | HERMETIC | BLOCKED_BY_LANE3 |
| 38 | POST | `/v1/operator/kill-orders/{kill_order_id}/restore` | CLI `connector-os restore` | HERMETIC | BLOCKED_BY_LANE3 |
| 39 | POST | `/v1/operator/connections/{connection_id}/revoke` | — | HERMETIC | BLOCKED_BY_LANE3 (vault revoke) |
| 40 | GET | `/v1/operator/reconciliations` | — | HERMETIC | BLOCKED_BY_LANE3 |
| 41 | POST | `/v1/operator/executions/{execution_id}/reconcile` | — | HERMETIC | BLOCKED_BY_LANE3 + v1-rc |
| 42 | POST | `/v1/operator/audit-exports` | read-api `/security` lists `compliance_exports` rows | CONTRACT_ONLY (501) | BLOCKED_BY_LANE3 |
| 43 | GET | `/v1/operator/audit-exports/{export_id}` | — | CONTRACT_ONLY (501) | BLOCKED_BY_LANE3 |
| 44 | GET | `/v1/operator/eligibility` | — | **WIRED** (`DispatchEligibility`) | deploy |
| 45 | GET | `/v1/operator/provider-health` | — | HERMETIC (connection health rollup) | EXTERNAL_DEPENDENCY (real probes) + BLOCKED_BY_LANE3 |

**Totals: 46 operations** — EXISTS (as /v1) 0 · WIRED 4 (rows 1, 2, 33, 44) · HERMETIC 36 · CONTRACT_ONLY 6 (rows 29–32, 42, 43) · production-blocked by Lane 3 / v1-rc 38 (rows 3–28 incl. 6b, 34–43, 45) · PLANNED delivery 4 (rows 29–32) · no operation is production-deployed. Row 6b (`activateConnection`) was added during implementation: without it the Runtime-E `TESTED → ACTIVE` move had no API path.

Deliberately **not** in v1: policy authoring (PLANNED), API-key management (PLANNED; issuance is Lane 3 identity), plan-step input authoring (OAL open item: plans carry `input {}`), connector marketplace publication (never automatic).

## 3. Ownership (Lane 5)

Lane 5 writes only: `openapi/**`, `devex/**`, `docs/lane5/**`. It does **not** touch `packages/**`, `contracts/**`, `tools/**`, `migrations/**`, `.github/**`, root `package.json`/lockfile, `CODEOWNERS`. `devex/` is a separate npm root (its own lockfile), outside the `packages/*` workspace glob, so the Integrator-owned root lockfile is unchanged. Requests to other owners are listed in `RETURN_L5.md`.
