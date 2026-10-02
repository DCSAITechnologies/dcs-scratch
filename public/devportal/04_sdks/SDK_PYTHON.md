<!-- Generated from devex/sdk-python/README.md by devex/tools/gen-docs.mjs. Edit the source README. -->

# dcs-connector-os — Python SDK for the Connector OS API

> **PRE-LAUNCH.** Not published to PyPI. The package carries the `Private :: Do Not Upload`
> classifier, so an accidental upload is refused. No staging or production API endpoint is
> deployed yet. Today this SDK runs against the **hermetic reference server**
> (`devex/api-server`), which uses in-memory adapters and is not persistence.

- Python ≥ 3.9. **Zero runtime dependencies** (standard-library `urllib` and `json`).
- `Client` (sync) and `AsyncClient` (asyncio).
- Contract: `openapi/connector-os-v1.yaml` (v1.0.0, frozen). Types are generated from it into
  `dcs_connector_os/_generated.py`. Never hand-edit that file.

## Install (from source only)

```bash
cd devex/sdk-python
python -m venv .venv && . .venv/bin/activate
pip install .            # or: python -m build && pip install dist/*.whl
```

## Quickstart (hermetic server)

```bash
node devex/api-server/bin/serve.mjs --port 4010 --unlock-mode2   # prints its base URL
export DCS_BASE_URL=http://127.0.0.1:4010
export DCS_API_KEY=<a hermetic test key from devex/api-server/README.md>
```

```python
from dcs_connector_os import Client

client = Client()                       # reads DCS_API_KEY / DCS_BASE_URL
page = client.connectors.list(limit=5)
print(page.meta.adapter)                # "hermetic" — the server says what it is
for c in page.data:
    print(c["connector_id"], c["availability"])   # "not_dispatchable" today, truthfully
```

## Surface and maturity

Each operation carries the contract's maturity label.

| Resource | Methods | Maturity |
|---|---|---|
| `connectors` | `list`, `list_all`, `retrieve` | WIRED (registry catalogue + dispatch eligibility) |
| `connections` | `list`, `list_all`, `retrieve`, `create`, `test`, `activate` | HERMETIC · BLOCKED_BY_LANE3 |
| `runs` | `list`, `list_all`, `retrieve`, `create`, `create_plan`, `retrieve_plan` | HERMETIC · BLOCKED_BY_LANE3 |
| `approvals` | `list`, `list_all`, `retrieve`, `request`, `grant`, `deny`, `revoke` | HERMETIC · BLOCKED_BY_LANE3 |
| `executions` | `list`, `list_all`, `retrieve`, `submit` | HERMETIC · BLOCKED_BY_LANE3 + MODE 2 readiness |
| `receipts` | `list`, `list_all`, `retrieve`, `verify` | HERMETIC · BLOCKED_BY_LANE3 + EXTERNAL_DEPENDENCY (R-Series) |
| `policies` | `list`, `retrieve`, `evaluate` | HERMETIC |
| `events` | `list`, `list_all`, `retrieve` | HERMETIC · BLOCKED_BY_LANE3 |
| `webhooks` | `list`, `create`, `retrieve`, `delete` | CONTRACT_ONLY (raises `NotImplementedAPIError`) |
| `environments`, `usage` | `list` / `retrieve` | WIRED / HERMETIC |
| `operator` | `kill`, `restore`, `list_kill_orders`, `revoke_connection`, `list_reconciliations`, `reconcile`, `eligibility`, `provider_health`, audit exports | HERMETIC (audit exports CONTRACT_ONLY). **Human operator session only.** |
| `me()` | describe the calling credential | HERMETIC |

`AsyncClient` has the same surface. Each call runs the sync transport on a worker thread via
`asyncio.to_thread`, which keeps the SDK dependency-free at the cost of one blocking socket per
in-flight call. `list_all` becomes an async iterator (`async for x in c.connectors.list_all()`).

## Governance is not optional

Every consequential action follows `policy → approval (human) → ops-broker → execution engine`.
The SDK never calls a connector or a provider.

- `approvals.request()` never grants. Only a **human operator session** can call `grant`, `deny`
  or `revoke`; with an API key the call raises `HumanRequiredError`.
- `executions.submit(body, operator_attestation="att_…")` requires a human attestation reference.
- The broker mints `execution_id`, `idempotency_key` and every other execution identity field.
  A body containing one is refused locally with `ClientValidationError`.
- MODE 2 is locked by default, so `submit` raises `ModeLockedError`; `e.pending` lists the six
  readiness dependencies.
- A broker refusal raises `BrokerRefusedError`; `e.refusal_code` is the broker's code verbatim
  (`APPROVAL-REQUIRED`, `APPROVAL-REPLAY`, …).

## Retry safety

The SDK retries only when a retry provably cannot duplicate an effect:

| Situation | GET | POST / DELETE |
|---|---|---|
| Connection refused or DNS failure (request never sent) | retried | retried, with the **same** Idempotency-Key |
| 429, or 503 with `retriable: true` (rejected before processing) | retried, honouring `Retry-After` | retried, with the same key |
| Timeout, reset, broken pipe (may have been processed) | retried | **never retried** → `RequestOutcomeUnknownError` |
| 500 / 502 / 504, or 503 not retriable | retried (not 501) | **never retried** → `RequestOutcomeUnknownError` |

`RequestOutcomeUnknownError` carries `idempotency_key`. Re-send with that same key and the server
replays the original response if it did process the request. Never re-send with a new key. Every
POST gets a generated key unless you pass one. Use `idempotency_key_from(job_id, step)` to get a
key that stays the same across restarts.

## `OUTCOME_UNKNOWN` is a result, not an error

`execution["outcome"]` is the frozen EXEC-FACTS enum, passed through verbatim. `OUTCOME_UNKNOWN`
means the provider may or may not have applied the effect. It arrives in a normal `202` response.
It is never a failure, it is not `settled`, and nothing retries it. A human operator reconciles it
(`operator.reconcile(...)` to `SUCCEEDED` or `FAILED`). `needs_reconciliation(execution)` and
`is_terminal_outcome(outcome)` encode these rules.

## Receipts are separate from outcomes

`execution["receipt"]["status"]` (`not_requested | PENDING | ISSUED | FAILED`) is independent of
`execution["outcome"]`. A `SUCCEEDED` execution can have a `PENDING` receipt. Connector OS performs
**no receipt cryptography**:

```python
from dcs_connector_os.receipts import parse_receipt, describe_receipt, verify_via_api, check_causal_link
r = parse_receipt(client.receipts.retrieve(receipt_id))
print("\n".join(describe_receipt(r)))
print(verify_via_api(client, r.receipt_id))   # the server's R-Series verifier; label reported verbatim
```

`verified` only ever comes from an **R-Series-kind** verifier: `valid`, code `OK`, the same
execution outcome, and profile status `frozen`. The hermetic server uses a test double, so it
always answers `unverified_test_double`. `check_causal_link(child, parent)` checks structure only
(parent pointer, run, sequence). It does not prove authenticity.

## Webhooks: signing scheme not defined (FD-L5-1)

`dcs_connector_os.webhooks` enforces a replay window you must choose (1–3600 s, past and future),
parses and types events, and deduplicates on `tenant:source:dedupe_key`. It does **not** verify
signatures. Connector OS has not defined an outbound signing scheme (founder decision FD-L5-1),
and this SDK does not invent one. Until it exists, every delivery is
`trust == "untrusted_trigger_only"`: re-read the referenced resource through the API before acting.
Once a scheme is defined, you plug it in through the `SignatureVerifier` protocol.
`InMemoryReplayGuard` is for development only.

## Security

- The credential is never shown by `repr`/`str` and never logged.
- Fields that look like secrets (`access_token`, `client_secret`, `password`, …) are refused
  before sending. The API takes credential **references** (`cref_<uuid>`).
- Redirects are not followed, so a credential cannot be forwarded.

## Tests

```bash
PYTHONPATH=src python -m pytest tests     # starts the hermetic Node server; needs node >= 20
```

The suite drives the real reference server. It also runs every example in
`devex/examples/python`, and checks that no `.py` file imports `hmac`, `hashlib`, `cryptography`,
`nacl` or `Crypto`.
