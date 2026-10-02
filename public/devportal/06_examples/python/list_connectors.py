"""List connectors and their real dispatch eligibility (the catalogue is WIRED to the registry).

    DCS_BASE_URL=... DCS_API_KEY=... python list_connectors.py
"""
from _env import developer

client = developer()
page = client.connectors.list(limit=5)
print(f"adapter={page.meta.adapter} request_id={page.meta.request_id}")
for c in page.data:
    print(f"{c['connector_id']:<24} {c['disposition']:<22} availability={c['availability']}")

total = sum(1 for _ in client.connectors.list_all(limit=200))
dispatchable = [c for c in client.connectors.list_all(limit=200) if c["availability"] != "not_dispatchable"]
print(f"catalogued={total} dispatchable={len(dispatchable)}")
