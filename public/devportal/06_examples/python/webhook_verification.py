"""Receive an event delivery: replay window, dedupe, parse. There is no signature check because
Connector OS has not defined an outbound signing scheme (FD-L5-1): every delivery is
`untrusted_trigger_only` — re-read the referenced resource through the API before acting.

    python webhook_verification.py        (self-contained; no server needed)
"""
import json
import time

from dcs_connector_os.webhooks import InMemoryReplayGuard, WebhookError, receive_webhook

event = {"object": "event", "event_id": "evt_example000000001", "type": "receipt.issued",
         "occurred_at": "2026-09-28T10:00:00Z", "dedupe_key": "receipt.issued:rcpt_example:1",
         "run_id": None, "data": {"receipt_id": "rcpt_example"}}
body = json.dumps(event).encode()
headers = {"DCS-Event-Id": event["event_id"], "DCS-Event-Timestamp": str(int(time.time())), "DCS-Event-Type": event["type"]}
guard = InMemoryReplayGuard()  # development only; use a durable, shared store in production

first = receive_webhook(raw_body=body, headers=headers, tolerance_seconds=300, tenant_id="ten_example", replay_guard=guard)
print(f"type={first['event']['type']} trust={first['trust']} duplicate={first['duplicate']}")
second = receive_webhook(raw_body=body, headers=headers, tolerance_seconds=300, tenant_id="ten_example", replay_guard=guard)
print(f"redelivery duplicate={second['duplicate']}")
try:
    stale = {**headers, "DCS-Event-Timestamp": str(int(time.time()) - 3600)}
    receive_webhook(raw_body=body, headers=stale, tolerance_seconds=300, tenant_id="ten_example", replay_guard=guard)
except WebhookError as e:
    print(f"stale delivery rejected: {e.failure}")
