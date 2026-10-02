# FINAL_PUBLIC_API_SURFACE — Connector OS /v1

| Field | Value |
|---|---|
| Contract | `openapi/connector-os-v1.yaml` — OpenAPI 3.1.0, contract **1.0.0, FROZEN 28 Sep 2026** |
| Operations | **46** — WIRED 4 · HERMETIC 36 · CONTRACT_ONLY 6 (+ 1 outbound `webhooks.event`, CONTRACT_ONLY) |
| Production-deployed | **none** |
| Validation | `openapi-spec-validator` (official 3.1 meta-schema): OK · `devex/tools/validate-openapi.mjs`: 0 problems (refs, operationIds, maturity/blocker on every op, 400/401 declared, Idempotency-Key on every mutating POST, privileged routes human-only, no broker-minted request fields, enum agreement with the frozen contracts, 80 schemas compile, every example validates) |
| Full route list | [portal/API_ROUTE_MAP.md](portal/API_ROUTE_MAP.md) (generated) |
| Phase 0 classification | [FINAL_L5_API_SURFACE_INVENTORY.md](FINAL_L5_API_SURFACE_INVENTORY.md) |
| Maturity matrix | [FINAL_DEVEX_MATURITY_MATRIX.csv](FINAL_DEVEX_MATURITY_MATRIX.csv) (generated) |

## Surface

| Area | Operations | Maturity |
|---|---|---|
| Identity | `GET /v1/me` | HERMETIC |
| Connectors | list, get | **WIRED** (registry catalogue + `DispatchEligibility`) |
| Connections | list, create, get, test, activate | HERMETIC |
| Runs / plans | list, create, get, create plan, get plan | HERMETIC |
| Approvals | list, request, get, grant, deny, revoke | HERMETIC (grant/deny/revoke human-only) |
| Executions | list, submit, get | HERMETIC (MODE 2 locked by default) |
| Receipts | list, get, verify | HERMETIC (test-double verifier) |
| Policies | list, get, evaluate | HERMETIC |
| Events | list, get | HERMETIC |
| Webhooks | list, create, get, delete | CONTRACT_ONLY (501) |
| Environments | list | **WIRED** (eligibility counts) |
| Usage | get | HERMETIC |
| Operator | kill-orders list/create/restore, revoke connection, reconciliations, reconcile, eligibility (**WIRED**), provider health, audit exports (CONTRACT_ONLY) | HERMETIC, human-only |

## Guarantees the contract encodes (and the tests enforce)

1. **Governance path.** `POST /v1/executions` = human attestation → MODE 2 readiness → step from the recorded plan → policy re-evaluated → ops-broker (approval consumed once, atomically; kill switch after consumption, before dispatch) → engine. No handler imports a connector, provider, proxy or network client (static test).
2. **Frozen vocabulary.** Execution outcome, operation class, refusal/blocked/error classes are the EXEC-FACTS / errors.v1 enums verbatim (validator compares against `contracts/`). OAL run/approval/policy values, receipt status, verification labels and kill scopes mirror the product path.
3. **`OUTCOME_UNKNOWN` preserved.** Returned as data (`202`), `settled: false`, reconciled only by a human operator through `OUTCOME_UNKNOWN → SUCCEEDED | FAILED`; SDKs never retry it.
4. **Receipt ≠ outcome.** `Execution.receipt` is a separate object; `verified` only from an R-Series-kind verifier.
5. **Idempotency.** Mutating POSTs require `Idempotency-Key`; 2xx replayed, different body → 422, refusals re-evaluated. Broker-minted fields (`execution_id`, `idempotency_key`, …) cannot be set by clients.
6. **Tenancy and secrets.** Tenant from the credential; foreign = 404. Secret-shaped request fields → 400; credentials never returned.
7. **Human-only surfaces.** Approvals grant/deny/revoke and all `/v1/operator/*` refuse every API key.
8. **Typed errors, cursor pagination, correlation and rate-limit headers** on every operation.
9. **No false availability.** `Connector.availability` derives only from dispatch eligibility — today `not_dispatchable` for all 1009 rows.

## What production needs (not Lane 5)

| Need | Owner |
|---|---|
| Identity: API-key issuance, IdP operator sessions, attestation verification, RBAC store | Lane 3 |
| Persistence for connections, runs, approvals, execution ledger, receipt index, kill orders, events | Lane 3 |
| Authenticated R-Series route + verifier service | Lane 3 + R-Series (EXTERNAL_DEPENDENCY) |
| `integrate/v1-rc` (OAL / ops-broker / Runtime-E on the base) and MODE 2 readiness | Integrator / Lane 2 |
| Deployment, TLS, domains, rate-limit store, observability | Lane 4 |
| Outbound webhook delivery + signing scheme | PLANNED; **FD-L5-1** |
