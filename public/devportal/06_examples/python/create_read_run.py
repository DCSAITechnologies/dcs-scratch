"""Open an OAL run (mode_1), plan a read step, and read the run back.

    DCS_BASE_URL=... DCS_API_KEY=... python create_read_run.py
"""
from _env import developer
from dcs_connector_os import idempotency_key_from

client = developer()
conn = client.connections.list(connector_id="github").data[0]
run = client.runs.create({"mode": "mode_1", "objective": "example: read one issue"},
                         idempotency_key=idempotency_key_from("example", "create-read-run", conn["connection_id"]))
plan = client.runs.create_plan(run["run_id"], {"steps": [
    {"connector_id": "github", "tool_id": "get_issue", "operation_class": "read", "connection_id": conn["connection_id"]},
]})
again = client.runs.retrieve(run["run_id"])
print(f"run={again['run_id']} mode={again['mode']} status={again['status']} phase={again['phase']} replayed={run.meta.replayed}")
for step in plan["steps"]:
    print(f"step={step['step_id']} {step['connector_id']}/{step['tool_id']} decision={step['policy_decision']['decision']}")
