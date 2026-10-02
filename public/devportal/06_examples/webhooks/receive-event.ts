// Receiving a Connector OS event delivery (outbound delivery is CONTRACT_ONLY today).
// Order: timestamp window → (optional) signature verifier → parse → dedupe.
// No signing scheme is defined yet (FD-L5-1), so without a verifier every delivery is
// `untrusted_trigger_only`: re-read the referenced resource through the API before acting.
import { receiveWebhook, InMemoryReplayGuard, WebhookError, SIGNING_SCHEME } from '@dcs-ai/connector-os/webhooks';

const guard = new InMemoryReplayGuard(); // development only; use a durable store in production

export async function handle(rawBody: string, headers: Record<string, string>) {
  try {
    const r = await receiveWebhook({ rawBody, headers, toleranceSeconds: 300, tenantId: 'ten_example', replayGuard: guard });
    if (r.duplicate) return { status: 200, note: 'duplicate — already recorded' };
    // Record r.event durably HERE, then acknowledge.
    return { status: 200, note: `${r.event.type} (${r.trust})` };
  } catch (e) {
    if (e instanceof WebhookError) return { status: 400, note: e.failure };
    throw e;
  }
}

// Demo with a locally constructed delivery.
const now = Math.floor(Date.now() / 1000);
const event = { object: 'event', event_id: 'evt_example000001', type: 'receipt.issued', occurred_at: new Date().toISOString(), dedupe_key: 'receipt.issued:rcpt_x:1', run_id: null, data: { receipt_id: 'rcpt_x' } };
const headers = { 'DCS-Event-Id': event.event_id, 'DCS-Event-Timestamp': String(now), 'DCS-Event-Type': event.type };
console.log(`signing scheme: ${SIGNING_SCHEME ?? 'not defined (FD-L5-1)'}`);
console.log(await handle(JSON.stringify(event), headers));
console.log(await handle(JSON.stringify(event), headers));
console.log(await handle(JSON.stringify(event), { ...headers, 'DCS-Event-Timestamp': String(now - 3600) }));
