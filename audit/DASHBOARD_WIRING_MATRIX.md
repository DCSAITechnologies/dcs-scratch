# Dashboard wiring matrix: `/app`

**Updated:** 03 Oct 2026
**Core:** `f6a3161e04e2f37da266e74adc54e8ecd974686a` (`coord/step2b-r4`)
**Verified against:** Connector OS core's **real** `/v1` reference server (`devex/api-server`), assembled from the four core packs by `scripts/assemble-core.sh`. Core was not modified.

## How it was verified

- **Assemble core:** `npm run core:assemble -- <4 pack zips>` builds `.core/tree`. The packs' checksums verify, all four report the same HEAD, and no pack file conflicts with another. The import check reports `MISSING 0`.
- **Start core's server:** `node .core/tree/devex/api-server/bin/serve.mjs --port 4020 --unlock-mode2`. Core's own contract tests pass on this tree: `node --test test/api-contract.test.mjs test/ag-f1-revoke-await.test.mjs`, **36/36**.
- **Build the console against core:** `npm run build:core`. The console runs in API mode against `http://127.0.0.1:4330`. `npm run preview:core` serves it and reverse-proxies `/v1` to core, same-origin, because core sends no CORS headers.
- **Test:** `npx playwright test --project=core-api` runs `e2e/core-api.spec.ts`, **11/11 passing**.
  - The agent-side steps (create a run, plan it, request an approval, submit the approved step) go over core's own HTTP contract, with core's hermetic developer key and human attestation. This is exactly what core's contract tests do.
  - The console performs every human/operator step itself.

**What "REAL_API_WIRED" means here.** The page calls core's real `/v1` contract (1.0.0) through the typed client, and has been exercised against core's real server code.

Core's adapters behind that server are mostly **HERMETIC** (in-memory mirrors of OAL, the ops-broker, EXEC-FACTS and the R-Series boundary). The exceptions are the catalogue, environments and eligibility, which are **WIRED** to core's registry data. Production composition is `BLOCKED_BY_LANE3` in core (`createProductionAdapters()` throws).

So "REAL_API_WIRED" means the console is ready for core's API. It does **not** mean the data is production data.

## Classification key

| Class | Meaning |
|---|---|
| REAL_API_WIRED | Uses core's `/v1` contract and is verified against core's real reference server |
| REAL_API_WIRED (mock-verified) | Wired to a contract operation, but core's HTTP surface cannot produce the precondition; verified against the mock only |
| API_EXISTS_NOT_WIRED | A contract operation exists; the console does not call it |
| PLANNED | No contract operation, or the operation is `CONTRACT_ONLY` (answers 501). The page says "Not yet available". |
| FIXTURE_ONLY | Renders fixtures in API mode. **None remain.** |

## Pages: API mode (25 route patterns, counted by gate C6)

Every page also has the shared states: loading, empty, 401 (session expiry screen), 403 (scope named), 404, 400, 501, backend unreachable with Retry, and refresh. Every write carries a capability gate, a confirmation dialog (destructive ones name the target and environment), one Idempotency-Key per dialog, the server's result, and a re-read.

| # | Route | Reads (core) | Actions | Class | Verified against core |
|---|---|---|---|---|---|
| 1 | `/app` | `listApprovals`, `listExecutions`, `getUsage`, `listConnections` | — | REAL_API_WIRED | ✓ all reads 200 |
| 2 | `/app/connectors` | `listConnectors` (core adapter **WIRED**, 1010 rows) | search, cursor paging | REAL_API_WIRED | ✓ 50 → 100 rows loaded |
| 3 | `/app/connectors/:id` | `getConnector`, `listConnections` | connect (links to #5) | REAL_API_WIRED | ✓ Gmail: GOLDEN-FIVE, not dispatchable, `no_explicit_grant` |
| 4 | `/app/connections` | `listConnections` | — | REAL_API_WIRED | ✓ core's seeded github/slack connections |
| 5 | `/app/connections/new` | — | create (vault reference only; a raw secret is refused client-side), then test, then activate | REAL_API_WIRED | ✓ CREATED → test passed → ACTIVE |
| 6 | `/app/connections/:id` | `getConnection` | test, activate, revoke (operator; irreversible) | REAL_API_WIRED | ✓ revoke recorded; "no further actions" |
| 7 | `/app/tools` | — | — | PLANNED | No tool-listing operation in contract 1.0.0 |
| 8 | `/app/agents` | `listRuns` | — | REAL_API_WIRED | ✓ |
| 9 | `/app/agents/runs/:id` | `getRun`, `getPlan`, approvals, executions | — | REAL_API_WIRED | ✓ run shows its approval |
| 10 | `/app/policies` | `listPolicies` | — | REAL_API_WIRED | ✓ `oal-default-v1` |
| 11 | `/app/policies/:id` | `getPolicy` | evaluate (dry run) | REAL_API_WIRED | ✓ decision matches core's direct answer |
| 12 | `/app/approvals` | `listApprovals` | — | REAL_API_WIRED | ✓ |
| 13 | `/app/approvals/:id` | `getApproval` | grant / deny (approve capability), revoke | REAL_API_WIRED | ✓ viewer disabled; approver GRANTED; DENIED with a reason; operator REVOKED; CONSUMED after execution |
| 14 | `/app/executions` | `listExecutions`, `listReconciliations` | — | REAL_API_WIRED | ✓ |
| 15 | `/app/executions/:id` | `getExecution` | reconcile `OUTCOME_UNKNOWN` | REAL_API_WIRED; reconcile is mock-verified | ✓ SUCCEEDED execution shown. Reconcile needs core's non-HTTP scenario control. |
| 16 | `/app/receipts` | `listReceipts` | — | REAL_API_WIRED | ✓ |
| 17 | `/app/receipts/:id` | `getReceipt` | verify | REAL_API_WIRED | ✓ `unverified_test_double`, "this is not evidence" |
| 18 | `/app/events` | `listEvents` | — | REAL_API_WIRED | ✓ (outbound webhooks: PLANNED) |
| 19 | `/app/security` | `listKillOrders`, `getProviderHealth` | kill order create / restore | REAL_API_WIRED | ✓ active → restored, with reviewer and reason recorded |
| 20 | `/app/environments` | `listEnvironments`, `getEligibility` (WIRED) | — | REAL_API_WIRED | ✓ |
| 21 | `/app/developer` | `getMe` | API key issuance / rotation | REAL_API_WIRED (keys: PLANNED) | ✓ `usr_hermetic_viewer` |
| 22 | `/app/usage` | `getUsage` | — | REAL_API_WIRED | ✓ |
| 23 | `/app/team` | — | — | PLANNED | No membership operation |
| 24 | `/app/audit` | `listEvents` | export | REAL_API_WIRED (export: PLANNED, `CONTRACT_ONLY` → 501) | ✓ |
| 25 | `/app/settings` | — | — | PLANNED | No settings operation |

**Totals:**
- 21 route patterns REAL_API_WIRED. All 21 are verified against core's real server; on one of them (#15), the reconcile action is mock-verified only.
- 4 route patterns PLANNED: tools, team, settings, and the not-in-contract parts of developer and audit.
- FIXTURE_ONLY in API mode: **0** (gate C8: API pages never import fixtures).

## Contract operations the console does not call

| Operation | Why |
|---|---|
| `createRun`, `createPlan`, `requestApproval`, `submitExecution` | Agent / broker side by design. The console is the human control surface; agents run and plan, and humans decide. The e2e drives these over HTTP as the agent would. |
| `getEvent` | API_EXISTS_NOT_WIRED. The list view shows each event in full, so there is no per-event page yet. |
| `listWebhookEndpoints`, `createWebhookEndpoint`, `getWebhookEndpoint`, `deleteWebhookEndpoint` | `CONTRACT_ONLY` (501). Labelled PLANNED. |
| `createAuditExport`, `getAuditExport` | `CONTRACT_ONLY` (501). Labelled PLANNED on `/app/audit`. |

That makes 35 of 46 contract operations called by the console. The other 11 are 4 agent-side, 6 `CONTRACT_ONLY` and 1 not wired (`getEvent`).

## Findings from running against core (fixed)

1. **Kill-order restore: an invented rule removed.**
   - The mock refused a restore whose reviewer equalled the caller, and the console labelled the field "Reviewer (second identity)".
   - Core does not enforce this. It records `restore_reason: "<reason> (reviewer: <id>)"`, and the contract does not require a second identity.
   - Fixed: the mock now matches core; the console says "Name a reviewer for the record… it does not check the reviewer is a different person". Both test suites were updated.
   - Marketing pages (`/security/kill-controls`, enterprise roles copy) still describe dual-control restore as product design. This is flagged in `STAGING_READINESS.md` to confirm against the staging server before launch.
2. **Malformed ids:** core validates id shape before lookup, so `exe_does_not_exist` gets `400 invalid_request` rather than 404. The console shows core's code verbatim, and the test now covers both cases.
3. **CORS:** core's reference server answers `OPTIONS` with 404 and sends no CORS headers. The console must be served **same-origin** with `/v1` reverse-proxied, which `preview:core` does; or the staging server must allow the console origin. See `STAGING_READINESS.md`.

## Demo mode (no `VITE_COS_API_URL`)

This is the default public build. Every console page renders hermetic fixtures under a **DEMO / NON-PRODUCTION** banner, and no request is made.
- Actions carry literal maturity labels (gate C1).
- No liveness claims (gate C7).
- Demo and API code paths never mix: `pick(demo, api)`, with gate C8.

## Auth / RBAC (API mode)

| Item | Status |
|---|---|
| Sign-in | OIDC (code + PKCE) when `VITE_OIDC_*` is set. In development, mock and core builds only: core's hermetic identities (operator, approver, viewer). Gate C9 fails if any hermetic token reaches `dist/`. |
| Capabilities | Read from `/v1/me`. Buttons are gated on core's capabilities: configure, approve, execute, kill, restore, view. A viewer sees disabled actions. |
| 401 | Session-expired screen, then sign in again to the same deep link |
| 403 | Required scope named, plus request id |
| Restore / logout / deep link | Verified (core-api and api-mode suites) |
