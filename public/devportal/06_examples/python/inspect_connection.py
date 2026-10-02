"""Inspect connections: lifecycle status, health and credential state are three separate fields.
The credential reference itself is never returned.

    DCS_BASE_URL=... DCS_API_KEY=... python inspect_connection.py
"""
from _env import developer

client = developer()
for conn in client.connections.list_all():
    c = client.connections.retrieve(conn["connection_id"])
    print(f"{c['connection_id']} connector={c['connector_id']} status={c['status']} "
          f"health={c['health']} credential_state={c['credential_state']} credential_ref_present={c['credential_ref_present']}")
