# Dashboard wiring matrix — `/app`

**Date:** 02 Oct 2026

## Update — later pass (02 Oct): API mode implemented

Everything below "Ground truth about the console today" describes the **demo** build, which is still the default when no API URL is configured.

A second mode now exists. With `VITE_COS_API_URL` set, every one of the 25 route patterns renders an API-backed page from `src/pages/dash/api/*`:
- reads use the typed client, with loading, empty, 401, 403, 404, 501 and unreachable states
- the contract mutations are wired through a confirmation dialog: connection create/test/activate/revoke, approval grant/deny/revoke, reconcile, receipt verify, policy evaluate, kill-order create/restore
- surfaces with no contract operation say "Not yet available"
- auth is provider-agnostic OIDC, with mock identities only in mock/dev builds

All of this is verified end-to-end against `scripts/mock-api.mjs` (`e2e/api-mode.spec.ts`). It has **not** been run against a real deployed `/v1` server, because none exists yet (core's only HTTP server is the founder-gated read-api). Demo-mode labels were corrected to the contract (PLANNED where no operation exists). See `HANDOFF.md` §3–5.

## Sources and caveats

- **Endpoint source:** `public/devportal/02_api/API_ROUTE_MAP.md`, shipped in the ZIP. It is generated from `openapi/connector-os-v1.yaml` (contract 1.0.0, frozen) and lists 46 operations: WIRED 4 · HERMETIC 36 · PLANNED 6.
- **Caveat:** this is the snapshot's copy of the contract. The current core OpenAPI and rc.1 staging server were not reachable (see `CATALOGUE_RECONCILIATION.md` §0), so re-check every target endpoint against current core before wiring.

## Ground truth about the console today

- **No API client exists.** There is no `fetch`, no base URL, no `VITE_*` config and no auth header anywhere in `src/`. Every page reads either `src/lib/fixtures.ts` (hermetic fixture stores) or the bundled catalogue JSON.
- **No authentication.** `/app` is publicly reachable. The user chip ("A. Sharma, Org admin") is a hard-coded demo identity, now labelled "demo identity, no sign-in". The workspace and environment selectors change local state only; no data is filtered by them.
- **Four data states are preview-only.** `?state=empty|loading|error|permission` drives a demo `StateGate`. Real loading, error, stale and 401/403 handling does not exist because nothing is fetched.
- **Actions.** All 45 `<Action>` instances carry a literal maturity (gate C1). Only WIRED actions are enabled, and all three WIRED actions are navigation:
  - "View run chain"
  - "View kill audit"
  - "Request access", which was a dead button and now opens `/enterprise/contact`

  No action performs a backend mutation.

## Classification key

| Class | Meaning |
|---|---|
| REAL_API_WIRED | reads/writes a live core API |
| CORE_API_EXISTS_BUT_UI_NOT_WIRED | contract operation exists (any maturity), UI reads fixtures |
| HERMETIC_FIXTURE | UI reads `fixtures.ts` |
| SNAPSHOT | UI reads the bundled catalogue JSON |
| STAGING_ONLY | only meaningful against staging |
| PLANNED | contract-only (answers 501) or not in the contract |
| EXTERNAL_DEPENDENCY | blocked on IdP, vault, KMS or provider OAuth |
| NO_ENDPOINT | no operation in the 46-op contract |

## Pages (25 route patterns, counted mechanically by gate C6)

Receipt/audit requirement: every mutating action below must, once wired, produce an audit event and a receipt reference (per the product's own receipts model). None does today.

| # | Route | Data today | Class | Target endpoint(s) (contract maturity) | Auth / RBAC needed | Env scoping | Loading / error / empty | Completion |
|---|---|---|---|---|---|---|---|---|
| 1 | `/app` | fixtures (approvals, runs, connections, usage) — figures now derived from the stores | HERMETIC_FIXTURE | aggregate of `listApprovals`, `listRuns`, `listConnections`, `getUsage` (all HERMETIC) | any member | must follow env selector | demo only | 25% |
| 2 | `/app/connectors` | bundled `connectors.json` (all rows; paginated 50/page) | SNAPSHOT → CORE_API_EXISTS_BUT_UI_NOT_WIRED | `GET /v1/connectors` (**WIRED**) | `connectors:read` | env-independent | needs real states | 60% |
| 3 | `/app/connectors/:id` | bundled JSON + fixtures | SNAPSHOT | `GET /v1/connectors/{id}` (**WIRED**) | `connectors:read` | — | not-found ✓ | 55% |
| 4 | `/app/connections` | fixtures (5 simulator connections) | HERMETIC_FIXTURE | `GET /v1/connections` (HERMETIC; blocked by Lane 3 connection store) | `connections:read` | yes | demo only | 20% |
| 5 | `/app/connections/new` | static simulator list | HERMETIC_FIXTURE + EXTERNAL_DEPENDENCY | `POST /v1/connections` (HERMETIC; vault + provider OAuth apps) | `connections:write` | yes | none | 10% |
| 6 | `/app/connections/:id` | fixtures | HERMETIC_FIXTURE | `GET /v1/connections/{id}`, `POST …/test`, `POST …/activate` (HERMETIC) | read / write | yes | not-found ✓ | 20% |
| 7 | `/app/tools` | fixtures (7 tools) | HERMETIC_FIXTURE, NO_ENDPOINT | none — no tools/registry operation in the contract; `POST /v1/policies/evaluate` for decision preview | `connections:read` | yes | demo only | 10% |
| 8 | `/app/agents` | fixtures (5 runs) | HERMETIC_FIXTURE | `GET /v1/runs` (HERMETIC) | `runs:read` | yes | demo only | 20% |
| 9 | `/app/agents/runs/:id` | fixtures | HERMETIC_FIXTURE | `GET /v1/runs/{id}`, `GET …/plans/{plan_id}` (HERMETIC) | `runs:read` | yes | not-found ✓ | 20% |
| 10 | `/app/policies` | fixtures (6 policies) | HERMETIC_FIXTURE | `GET /v1/policies` (HERMETIC; authoring PLANNED) | `policies:read` | yes | demo only | 20% |
| 11 | `/app/policies/:id` | fixtures | HERMETIC_FIXTURE | `GET /v1/policies/{id}`, `POST /v1/policies/evaluate` | `policies:read` | yes | not-found ✓ | 20% |
| 12 | `/app/approvals` | fixtures (6) | HERMETIC_FIXTURE | `GET /v1/approvals` (HERMETIC) | `approvals:read` | yes | demo only | 20% |
| 13 | `/app/approvals/:id` | fixtures | HERMETIC_FIXTURE + EXTERNAL_DEPENDENCY | `GET …/{id}`, `POST …/grant`, `…/deny`, `…/revoke` (HERMETIC; IdP + operator attestation) | human `approve` | yes | not-found ✓ | 15% |
| 14 | `/app/executions` | fixtures (6) | HERMETIC_FIXTURE | `GET /v1/executions` (HERMETIC) | `executions:read` | yes | demo only | 20% |
| 15 | `/app/executions/:id` | fixtures | HERMETIC_FIXTURE | `GET …/{id}`, `POST /v1/operator/executions/{id}/reconcile` (HERMETIC) | read / operator `execute` | yes | not-found ✓ | 20% |
| 16 | `/app/receipts` | fixtures (4) | HERMETIC_FIXTURE | `GET /v1/receipts` (HERMETIC; authenticated R-Series route) | `receipts:read` | yes | demo only | 20% |
| 17 | `/app/receipts/:id` | fixtures | HERMETIC_FIXTURE + EXTERNAL_DEPENDENCY | `GET …/{id}`, `POST …/{id}/verify` (HERMETIC; R-Series verifier) | `receipts:read`, `receipts:verify` | yes | not-found ✓ | 15% |
| 18 | `/app/events` | fixtures (inbound 4, outbound 3) | HERMETIC_FIXTURE + PLANNED | `GET /v1/events` (HERMETIC); outbound subscriptions `/v1/webhooks` (PLANNED, FD-L5-1) | `events:read` | yes | demo only | 15% |
| 19 | `/app/security` | fixtures (kills, leases, drill) | HERMETIC_FIXTURE + EXTERNAL_DEPENDENCY | `GET/POST /v1/operator/kill-orders`, `…/restore`, `POST /v1/operator/connections/{id}/revoke` (HERMETIC; kill store + IdP); leases: NO_ENDPOINT | operator `view`/`kill`/`restore` | yes | demo only | 15% |
| 20 | `/app/environments` | fixtures (roll-up) | HERMETIC_FIXTURE → CORE_API_EXISTS_BUT_UI_NOT_WIRED | `GET /v1/environments` (**WIRED**); create: NO_ENDPOINT | `environments:read` | — | demo only | 30% |
| 21 | `/app/developer` | fixtures (2 API keys) | PLANNED + EXTERNAL_DEPENDENCY | `GET /v1/me` (HERMETIC); key issuance: NO_ENDPOINT (Lane 3 API-key issuance) | org admin | — | demo only | 10% |
| 22 | `/app/usage` | fixtures (`USAGE`) | HERMETIC_FIXTURE | `GET /v1/usage` (HERMETIC) | `usage:read` | yes | demo only | 20% |
| 23 | `/app/team` | fixtures (6 members) | PLANNED + EXTERNAL_DEPENDENCY | NO_ENDPOINT — members/roles need IdP (status item 19) | org admin | — | demo only | 5% |
| 24 | `/app/audit` | fixtures (8 events) | HERMETIC_FIXTURE + PLANNED | no list endpoint; `POST /v1/operator/audit-exports` (PLANNED) | operator `view` | yes | demo only | 10% |
| 25 | `/app/settings` | static | NO_ENDPOINT | none in the contract | org admin | — | demo only | 5% |

Also wireable today: `GET /v1/operator/eligibility` (**WIRED**) has no console surface. It belongs on `/app/connectors` beside each row's "Connect" gate.

## Actions (all 45 `<Action>` instances, plus the rail quick actions)

| Page | Action | Maturity label | Enabled? | Target endpoint | Confirmation / guard needed when wired |
|---|---|---|---|---|---|
| Connections | New connection | HERMETIC ONLY | no | `POST /v1/connections` | env named in dialog; Idempotency-Key |
| Connection detail | Test (governed read) | HERMETIC ONLY | no | `POST /v1/connections/{id}/test` | receipt id shown on result |
| Connection detail | Suspend / Resume | HERMETIC ONLY | no | `POST /v1/operator/kill-orders` (scope=connection) / `…/restore` | confirm + reason; second identity for restore |
| Connection detail | Revoke | HERMETIC ONLY | no | `POST /v1/operator/connections/{id}/revoke` | irreversible; type-to-confirm env + id |
| Connection detail | Rotate credential | PLANNED | no | NO_ENDPOINT (vault, item 20) | — |
| Connection detail | Authorize (OAuth) | STAGING ONLY | no | part of `createConnection` flow; provider OAuth apps (external) | redirect + state check |
| Connect flow | Select / Create connection (simulator) | HERMETIC ONLY | no | `POST /v1/connections` | — |
| Connectors / detail | Connect | STAGING ONLY | no | `POST /v1/connections` gated by `GET /v1/operator/eligibility` | only when runtime ≥ staging-verified and claim_level ≥ STAGING |
| Connector detail | Request access | WIRED (navigation) | **yes** | `/enterprise/contact`; no backend capture exists | — |
| Connector detail | Test | HERMETIC ONLY | no | `POST /v1/connections/{id}/test` | needs a connection |
| Run detail | Submit plan for approval | HERMETIC ONLY | no | `POST /v1/runs/{id}/plans` → `POST /v1/approvals` | Idempotency-Key |
| Run detail | Escalate to human / Cancel run | HERMETIC ONLY | no | NO_ENDPOINT | — |
| Policies | Create policy / Clone / Activate / Disable / Compare versions | HERMETIC ONLY | no | NO_ENDPOINT (authoring PLANNED) | versioned, audited |
| Policy detail | Test against sample plan | HERMETIC ONLY | no | `POST /v1/policies/evaluate` | read-only, safe to wire first |
| Approval detail | Approve / Reject (reason required) / Revoke | HERMETIC ONLY | no | `POST /v1/approvals/{id}/grant`, `…/deny`, `…/revoke` | human identity (IdP), single-use, dual where `dual` set |
| Execution detail | Reconcile now | HERMETIC ONLY | no | `POST /v1/operator/executions/{id}/reconcile` | operator `execute` |
| Execution detail | Retry / Escalate | HERMETIC ONLY | no | NO_ENDPOINT (retry is broker-owned) | retry only when retry_safety = safe |
| Receipt detail | Verify receipt | HERMETIC ONLY | no | `POST /v1/receipts/{id}/verify` | show verifier + key id; test signer stated |
| Receipt detail | Export receipt + proof | PLANNED | no | `POST /v1/operator/audit-exports` (PLANNED) | — |
| Receipt detail | View run chain | WIRED (navigation) | yes | — | — |
| Security | Kill a scope… | HERMETIC ONLY | no | `POST /v1/operator/kill-orders` | type-to-confirm; env shown |
| Security | Restore | PLANNED | no | `POST /v1/operator/kill-orders/{id}/restore` | second identity |
| Security | View kill audit | WIRED (navigation) | yes | — | — |
| Events | Replay | HERMETIC ONLY | no | NO_ENDPOINT | — |
| Events | Create outbound subscription | PLANNED | no | `POST /v1/webhooks` (PLANNED, FD-L5-1) | — |
| Environments | Create environment | PLANNED | no | NO_ENDPOINT | — |
| Environments | Set MODE ceiling | HERMETIC ONLY | no | NO_ENDPOINT | — |
| Developer | Create key / Rotate / Revoke | PLANNED | no | NO_ENDPOINT (Lane 3 key issuance) | secret shown once |
| Team | Invite | PLANNED | no | NO_ENDPOINT (IdP) | — |
| Team | Change role / Remove | HERMETIC ONLY | no | NO_ENDPOINT (IdP) | — |
| Audit | Export (CSV + receipt bundle) | PLANNED | no | `POST /v1/operator/audit-exports` (PLANNED) | — |
| Settings | Rename | HERMETIC ONLY | no | NO_ENDPOINT | — |
| Rail | Run a connector / Create policy / Invite | HERMETIC ONLY / PLANNED | no (plain text) | as above | — |
| Rail | View audit log | WIRED (navigation) | yes | — | — |

**Label inconsistency to resolve with core.** Several actions are labelled HERMETIC ONLY although the contract has no operation for them (Cancel run, Escalate, Replay, Set MODE ceiling, Change role, Rename, policy authoring). They should read PLANNED unless core has added operations since contract 1.0.0. They were not relabelled in this pass because the current core contract could not be checked; either label renders the button disabled.

## Wiring order (smallest safe steps first)

1. **API client seam.** `src/lib/api.ts` with base URL from `VITE_COS_API_URL`, typed errors from the closed error taxonomy (`public/devportal/02_api/ERROR_MODEL.md`), and real loading/error/stale states replacing the `?state=` demo. Without a URL configured, the console keeps fixtures and says so.
2. **Read-only WIRED endpoints first.** `GET /v1/connectors`, `/v1/connectors/{id}`, `/v1/environments`, `/v1/operator/eligibility`. These replace the bundled catalogue snapshot in the console and resolve the SNAPSHOT label.
3. **HERMETIC reads against the reference server** (staging only): runs, approvals, executions, receipts, events, usage, policies.
4. **Auth (blocks everything mutating).** IdP session, `/v1/me` for identity/role, auth guard on `/app` with deep-link return, 401 → sign-in and 403 → `PermissionNote` driven by the real role.
5. **Mutations in risk order.**
   - `policies/evaluate`
   - connection test
   - approvals grant/deny
   - reconcile
   - kill/revoke

   Each needs an Idempotency-Key, a confirmation naming the environment, and an audit event plus receipt reference displayed on success.
