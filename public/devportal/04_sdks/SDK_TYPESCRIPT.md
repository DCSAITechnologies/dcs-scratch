<!-- Generated from devex/sdk-typescript/README.md by devex/tools/gen-docs.mjs. Edit the source README. -->

# @dcs-ai/connector-os — TypeScript / JavaScript SDK

> **PRE-LAUNCH — not published.** Install from source only. No public Connector OS endpoint is
> deployed yet; today the SDK runs against the **hermetic reference server** (`devex/api-server`).

| Capability | Maturity |
|---|---|
| Typed client for all 46 `/v1` operations | HERMETIC (reference server) — production API BLOCKED_BY_LANE3 |
| Connectors (catalogue + dispatch eligibility) | WIRED to the canonical registry data |
| Typed errors, retry safety, idempotency, pagination | HERMETIC (unit + contract tested) |
| Webhook helpers (`/webhooks`) | HERMETIC — outbound delivery PLANNED; signing scheme undefined (FD-L5-1) |
| Receipt tooling (`/receipts`) | HERMETIC — verification delegated to the R-Series verifier (EXTERNAL_DEPENDENCY) |

## Install (from source)

```bash
cd devex && npm ci && npm run build      # builds sdk-typescript/dist
```

Node ≥ 20. Zero runtime dependencies. ESM. Types generated from `openapi/connector-os-v1.yaml`
(`src/generated/openapi.ts`, never hand-edited; `node tools/gen-types.mjs --check` detects drift).

## Quick start

```ts
import { ConnectorOS } from '@dcs-ai/connector-os';

const dcs = new ConnectorOS({ baseUrl: process.env.DCS_BASE_URL, apiKey: process.env.DCS_API_KEY });

const page = await dcs.connectors.list({ limit: 20 });
for await (const c of dcs.connectors.listAll()) console.log(c.connector_id, c.availability);
```

Credentials come from your environment. The client never prints them: `JSON.stringify(client)`,
`util.inspect(client)` and every error redact the credential.

## Resources

`me()` · `connectors` · `connections` (`create`, `test`, `activate`) · `runs` (`create`, `createPlan`,
`retrievePlan`) · `approvals` (`request`, `grant`, `deny`, `revoke`) · `executions` (`submit`) ·
`receipts` (`verify`) · `policies` (`evaluate`) · `events` · `webhooks` (CONTRACT_ONLY) ·
`environments` · `usage` · `operator` (kill/restore, revoke connection, reconciliations, reconcile,
eligibility, provider health, audit exports). Every list has `list()` (one page) and `listAll()`
(async iterator; cursor pagination, stable under concurrent writes).

Response metadata (request id, correlation id, rate-limit headers, `adapter`, replay flag):

```ts
import { responseMeta } from '@dcs-ai/connector-os';
responseMeta(page)?.requestId;
```

## The governed write path

```ts
const run  = await dcs.runs.create({ mode: 'mode_1', objective: 'Close duplicate issue' });
const plan = await dcs.runs.createPlan(run.run_id, { steps: [{ connector_id: 'github', tool_id: 'update_issue', operation_class: 'write', connection_id }] });
const apr  = await dcs.approvals.request({ run_id: run.run_id, plan_id: plan.plan_id, step_ids: [plan.steps[0].step_id] });
// A HUMAN operator grants (an API key gets HumanRequiredError):
await operator.approvals.grant(apr.approval_id);
const ex = await dcs.executions.submit(
  { run_id: run.run_id, plan_id: plan.plan_id, step_id: plan.steps[0].step_id, approval_id: apr.approval_id },
  { operatorAttestation: 'att_…' },               // human attestation, required by the ops-broker
);
```

The SDK refuses locally, before sending: secret-shaped fields (`client_secret`, `access_token`, …),
broker-minted fields in `executions.submit` (`execution_id`, `idempotency_key`, …) and a missing
attestation. MODE 2 is locked by default: `submit` throws `ModeLockedError` with `pending` deps.

## Outcomes vs receipts

`execution.outcome` is the frozen EXEC-FACTS enum, verbatim. **`OUTCOME_UNKNOWN` is a normal
result, not an error**: the provider may or may not have applied the effect. Do not retry it —
an operator reconciles it. `isTerminalOutcome()` / `needsReconciliation()` help.
`execution.receipt.status` (`not_requested | PENDING | ISSUED | FAILED`) is separate and never
stands in for the outcome.

## Retry safety

| Situation | GET | POST / DELETE |
|---|---|---|
| Connection refused / DNS failure (provably not sent) | retried | retried, **same** Idempotency-Key |
| 429, or 503 with `retriable: true` | retried (Retry-After honoured) | retried, same key |
| Timeout, reset after send, 500 / 502 / 504, 503 not retriable | retried | **never retried** → `RequestOutcomeUnknownError` |
| 501 (CONTRACT_ONLY) | not retried | not retried |

`RequestOutcomeUnknownError` carries `idempotencyKey`: re-send with that same key (the server
replays a response it already produced) or read the resource. Never re-send with a new key.
Every POST that needs one carries an `Idempotency-Key` (generated if you do not pass one; use
`idempotencyKeyFrom(jobId, step)` for keys that survive a process restart). Only successful (2xx)
responses are recorded for replay; a refused request is re-evaluated when re-sent.

## Errors

`APIError` (status, code, retriable, requestId, detail) → `InvalidRequestError`,
`AuthenticationError`, `PermissionDeniedError` → `HumanRequiredError`, `NotFoundError`,
`ConflictError` → `ModeLockedError` (`pending`), `BrokerRefusedError` (`refusalCode`, the
ops-broker's code verbatim), `IllegalTransitionError`; `IdempotencyConflictError`,
`RateLimitError` (`retryAfterSeconds`), `DependencyUnavailableError`, `NotImplementedError`,
`InternalServerError`. Transport: `APIConnectionError`, `RequestOutcomeUnknownError`.
Local: `ClientValidationError`.

## Webhooks — `@dcs-ai/connector-os/webhooks`

`receiveWebhook({ rawBody, headers, toleranceSeconds, tenantId, replayGuard, verifier? })` checks
the replay window (required, 1–3600 s, past and future), optionally runs a `SignatureVerifier`,
parses/types the event and deduplicates on its stable identity. **No signing scheme is defined
(FD-L5-1)**, so without a verifier every delivery is `trust: 'untrusted_trigger_only'`. The SDK
performs no cryptography.

## Receipts — `@dcs-ai/connector-os/receipts`

`parseReceipt`, `describeReceipt`, `verifyReceipt(summary, verifierPort)`, `verifyViaApi(client, id)`,
`checkCausalLink(child, parent)` (structural only). "verified" only from an `rseries`-kind verifier
with `code: 'OK'`, matching outcome and `profile_status: 'frozen'`; a test double is always
`unverified_test_double`.

## Tests

`node --test test/*.test.mjs` — 25 tests: contract coverage (every operation has a method), typed
errors, idempotency, pagination, governed flow, OUTCOME_UNKNOWN, retry safety with a fake fetch,
webhook and receipt helpers.
