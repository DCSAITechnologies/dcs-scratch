# API route map — Connector OS /v1

Generated from `openapi/connector-os-v1.yaml` (contract 1.0.0, FROZEN) by `devex/tools/gen-docs.mjs`. Do not edit.

**Maturity:** WIRED = reads canonical in-repo data · HERMETIC = reference server over in-memory adapters (not persistence, not deployed) · PLANNED = specified, answers `501`. **No operation is production-deployed.**

| # | Method | Path | Operation | Who | Idempotency-Key | Maturity | Production blocker |
|---|---|---|---|---|---|---|---|
| 1 | GET | `/v1/me` | `getMe` | any credential | — | **HERMETIC** | BLOCKED_BY_LANE3 (IdP / API-key issuance) |
| 2 | GET | `/v1/connectors` | `listConnectors` | API key `connectors:read` / human | — | **WIRED** | deploy (Lane 4) |
| 3 | GET | `/v1/connectors/{connector_id}` | `getConnector` | API key `connectors:read` / human | — | **WIRED** | deploy (Lane 4) |
| 4 | GET | `/v1/connections` | `listConnections` | API key `connections:read` / human | — | **HERMETIC** | BLOCKED_BY_LANE3 (connection store) |
| 5 | POST | `/v1/connections` | `createConnection` | API key `connections:write` / human | required | **HERMETIC** | BLOCKED_BY_LANE3 (vault / credential lifecycle) + EXTERNAL_DEPENDENCY (provider app registrations) |
| 6 | GET | `/v1/connections/{connection_id}` | `getConnection` | API key `connections:read` / human | — | **HERMETIC** | BLOCKED_BY_LANE3 (connection store) |
| 7 | POST | `/v1/connections/{connection_id}/test` | `testConnection` | API key `connections:write` / human | required | **HERMETIC** | BLOCKED_BY_LANE3 + EXTERNAL_DEPENDENCY (real provider probe; reference server tests simulator targets only) |
| 8 | POST | `/v1/connections/{connection_id}/activate` | `activateConnection` | API key `connections:write` / human | required | **HERMETIC** | BLOCKED_BY_LANE3 (connection store) |
| 9 | GET | `/v1/runs` | `listRuns` | API key `runs:read` / human | — | **HERMETIC** | BLOCKED_BY_LANE3 (OAL run-state store) + integrate/v1-rc |
| 10 | POST | `/v1/runs` | `createRun` | API key `runs:write` / human | required | **HERMETIC** | BLOCKED_BY_LANE3 + integrate/v1-rc |
| 11 | GET | `/v1/runs/{run_id}` | `getRun` | API key `runs:read` / human | — | **HERMETIC** | BLOCKED_BY_LANE3 |
| 12 | POST | `/v1/runs/{run_id}/plans` | `createPlan` | API key `runs:write` / human | required | **HERMETIC** | BLOCKED_BY_LANE3 + integrate/v1-rc |
| 13 | GET | `/v1/runs/{run_id}/plans/{plan_id}` | `getPlan` | API key `runs:read` / human | — | **HERMETIC** | BLOCKED_BY_LANE3 |
| 14 | GET | `/v1/approvals` | `listApprovals` | API key `approvals:read` / human | — | **HERMETIC** | BLOCKED_BY_LANE3 (approval store) |
| 15 | POST | `/v1/approvals` | `requestApproval` | API key `approvals:request` / human | required | **HERMETIC** | BLOCKED_BY_LANE3 (approval store) |
| 16 | GET | `/v1/approvals/{approval_id}` | `getApproval` | API key `approvals:read` / human | — | **HERMETIC** | BLOCKED_BY_LANE3 |
| 17 | POST | `/v1/approvals/{approval_id}/grant` | `grantApproval` | human operator · `approve` | required | **HERMETIC** | BLOCKED_BY_LANE3 (IdP + operator attestation) |
| 18 | POST | `/v1/approvals/{approval_id}/deny` | `denyApproval` | human operator · `approve` | required | **HERMETIC** | BLOCKED_BY_LANE3 (IdP) |
| 19 | POST | `/v1/approvals/{approval_id}/revoke` | `revokeApproval` | human operator · `approve` | required | **HERMETIC** | BLOCKED_BY_LANE3 (IdP) |
| 20 | GET | `/v1/executions` | `listExecutions` | API key `executions:read` / human | — | **HERMETIC** | BLOCKED_BY_LANE3 (execution ledger) |
| 21 | POST | `/v1/executions` | `submitExecution` | API key `executions:write` / human | required | **HERMETIC** | BLOCKED_BY_LANE3 + integrate/v1-rc + MODE 2 readiness (ops-broker) |
| 22 | GET | `/v1/executions/{execution_id}` | `getExecution` | API key `executions:read` / human | — | **HERMETIC** | BLOCKED_BY_LANE3 |
| 23 | GET | `/v1/receipts` | `listReceipts` | API key `receipts:read` / human | — | **HERMETIC** | BLOCKED_BY_LANE3 (authenticated R-Series route) |
| 24 | GET | `/v1/receipts/{receipt_id}` | `getReceipt` | API key `receipts:read` / human | — | **HERMETIC** | BLOCKED_BY_LANE3 (authenticated R-Series route) |
| 25 | POST | `/v1/receipts/{receipt_id}/verify` | `verifyReceipt` | API key `receipts:verify` / human | — | **HERMETIC** | BLOCKED_BY_LANE3 + EXTERNAL_DEPENDENCY (R-Series verifier service) |
| 26 | GET | `/v1/policies` | `listPolicies` | API key `policies:read` / human | — | **HERMETIC** | BLOCKED_BY_LANE3 (policy store); authoring PLANNED |
| 27 | GET | `/v1/policies/{policy_id}` | `getPolicy` | API key `policies:read` / human | — | **HERMETIC** | BLOCKED_BY_LANE3 |
| 28 | POST | `/v1/policies/evaluate` | `evaluatePolicy` | API key `policies:read` / human | — | **HERMETIC** | integrate/v1-rc (OAL policy binding) |
| 29 | GET | `/v1/events` | `listEvents` | API key `events:read` / human | — | **HERMETIC** | BLOCKED_BY_LANE3 (eventbus persistence) |
| 30 | GET | `/v1/events/{event_id}` | `getEvent` | API key `events:read` / human | — | **HERMETIC** | BLOCKED_BY_LANE3 |
| 31 | GET | `/v1/webhooks` | `listWebhookEndpoints` | API key `webhooks:read` / human | — | **PLANNED** | PLANNED: no outbound delivery service exists; signing scheme awaits founder decision FD-L5-1 |
| 32 | POST | `/v1/webhooks` | `createWebhookEndpoint` | API key `webhooks:write` / human | required | **PLANNED** | PLANNED + FD-L5-1 |
| 33 | GET | `/v1/webhooks/{webhook_id}` | `getWebhookEndpoint` | API key `webhooks:read` / human | — | **PLANNED** | PLANNED |
| 34 | DELETE | `/v1/webhooks/{webhook_id}` | `deleteWebhookEndpoint` | API key `webhooks:write` / human | — | **PLANNED** | PLANNED |
| 35 | GET | `/v1/environments` | `listEnvironments` | API key `environments:read` / human | — | **WIRED** | deploy (Lane 4) |
| 36 | GET | `/v1/usage` | `getUsage` | API key `usage:read` / human | — | **HERMETIC** | BLOCKED_BY_LANE3 (execution ledger / receipt index) |
| 37 | GET | `/v1/operator/kill-orders` | `listKillOrders` | human operator · `view` | — | **HERMETIC** | BLOCKED_BY_LANE3 (kill store + IdP) |
| 38 | POST | `/v1/operator/kill-orders` | `createKillOrder` | human operator · `kill` | required | **HERMETIC** | BLOCKED_BY_LANE3 (kill store + IdP) |
| 39 | POST | `/v1/operator/kill-orders/{kill_order_id}/restore` | `restoreKillOrder` | human operator · `restore` | required | **HERMETIC** | BLOCKED_BY_LANE3 |
| 40 | POST | `/v1/operator/connections/{connection_id}/revoke` | `revokeConnection` | human operator · `kill` | required | **HERMETIC** | BLOCKED_BY_LANE3 (vault revoke) |
| 41 | GET | `/v1/operator/reconciliations` | `listReconciliations` | human operator · `view` | — | **HERMETIC** | BLOCKED_BY_LANE3 |
| 42 | POST | `/v1/operator/executions/{execution_id}/reconcile` | `reconcileExecution` | human operator · `execute` | required | **HERMETIC** | BLOCKED_BY_LANE3 + integrate/v1-rc |
| 43 | POST | `/v1/operator/audit-exports` | `createAuditExport` | human operator · `view` | required | **PLANNED** | BLOCKED_BY_LANE3 (persistence + IdP) |
| 44 | GET | `/v1/operator/audit-exports/{export_id}` | `getAuditExport` | human operator · `view` | — | **PLANNED** | BLOCKED_BY_LANE3 |
| 45 | GET | `/v1/operator/eligibility` | `getEligibility` | human operator · `view` | — | **WIRED** | deploy (Lane 4) |
| 46 | GET | `/v1/operator/provider-health` | `getProviderHealth` | human operator · `view` | — | **HERMETIC** | EXTERNAL_DEPENDENCY (real provider probes) + BLOCKED_BY_LANE3 |

**Totals:** 46 operations — WIRED 4 · HERMETIC 36 · PLANNED (contract only) 6.

Outbound event delivery (OpenAPI `webhooks.event`) is CONTRACT_ONLY: no delivery service exists and the signing scheme is undefined (FD-L5-1).
