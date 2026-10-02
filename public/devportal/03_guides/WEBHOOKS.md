# Webhooks

Two different things share the word — keep them apart.

## 1. Inbound provider webhooks (providers → Connector OS)

Handled inside Connector OS by `packages/webhooks` (Lane 2 semantics), declared per connector in
the Manifest 1.3 `webhook_profile` (Webhook Contract v1):

- **Verification** is provider protocol, done only in `packages/webhooks/src/verify.mjs` (the single
  allowlisted HMAC site). Signed profiles use the provider's own algorithm; unsigned providers are
  `untrusted_trigger_only`.
- **Replay window** comes from the manifest (`replay_tolerance_seconds` / `replay_window_seconds`,
  1–3600). There is **no default** — an unbound window is refused. Past *and* future skew are rejected.
- **Dedupe identity** is `${tenant}:${connector}:${delivery_id}`, with the delivery id taken from the
  declared `dedupe_key` (header, body field or composite). The delivery is durably recorded before
  it is acknowledged.
- Webhook bodies become reference-only OAL `ops_event`s; they never carry instructions to an agent.

Connector authors declare this in the manifest; `dcs connector validate` checks the profile
(bounded window, declared dedupe) and ships unsigned/stale fixtures. The kit never computes a signature.

## 2. Outbound Connector OS events (Connector OS → your endpoint) — **PLANNED**

Specified in the contract (`webhooks.event`, `/v1/webhooks`) but **not implemented**: there is no
delivery service yet (the endpoints answer `501`), and the **signing scheme is not defined**
(founder decision **FD-L5-1**). Until it is, `DCS-Signature` is absent and every delivery must be
treated as an untrusted trigger.

Delivery headers: `DCS-Event-Id`, `DCS-Event-Timestamp` (unix seconds), `DCS-Event-Type`,
`DCS-Signature` (reserved). Event types: `approval.requested`, `approval.granted`,
`approval.denied`, `approval.revoked`, `execution.state_changed`, `receipt.issued`,
`receipt.failed`, `run.opened`, `run.closed`, `kill_order.activated`, `kill_order.restored`,
`connection.revoked`. Payloads are reference-only (ids, states, outcomes).

### Receiving (SDK helpers — HERMETIC)

```ts
import { receiveWebhook, InMemoryReplayGuard } from '@dcs-ai/connector-os/webhooks';
const r = await receiveWebhook({ rawBody, headers, toleranceSeconds: 300, tenantId, replayGuard });
// r.trust === 'untrusted_trigger_only' until a signing scheme exists → re-read r.event.data via the API
```

```python
from dcs_connector_os.webhooks import receive_webhook, InMemoryReplayGuard
r = receive_webhook(raw_body=body, headers=headers, tolerance_seconds=300, tenant_id=tenant, replay_guard=guard)
```

Order: timestamp window → optional `SignatureVerifier` (plug point for the future scheme) → parse →
dedupe on `DCS-Event-Id`/`dedupe_key`. Record durably, then answer 2xx; a duplicate is acknowledged,
not reprocessed. `InMemoryReplayGuard` is for development only — use a durable store.

**Why no signature helper:** Connector OS may not add cryptography outside the allowlisted
provider-verification module (the `no-crypto` guard), and inventing an outbound scheme would be an
unreviewed trust decision. FD-L5-1 asks the founder to choose the scheme and the allowlisted home
for its verifier.
