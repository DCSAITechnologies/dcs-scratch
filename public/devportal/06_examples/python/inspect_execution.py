"""Inspect executions: outcome (EXEC-FACTS), attempts, reconciliation and receipt are separate.
OUTCOME_UNKNOWN is never a failure and is never retried; it waits for reconciliation.

    DCS_BASE_URL=... DCS_API_KEY=... python inspect_execution.py
"""
from _env import developer
from dcs_connector_os import is_terminal_outcome, needs_reconciliation

client = developer()
page = client.executions.list(limit=10)
if not page.data:
    print("no executions yet — run approval_workflow.py first")
for e in page.data:
    ex = client.executions.retrieve(e["execution_id"])
    print(f"{ex['execution_id']} {ex['connector_id']}/{ex['tool_id']} outcome={ex['outcome']} "
          f"terminal={is_terminal_outcome(ex['outcome'])} reconcile={needs_reconciliation(ex)} "
          f"receipt={ex['receipt']['status']}")
    for a in ex["attempts"]:
        print(f"   attempt {a['attempt_n']}: {a['outcome']} at {a['recorded_at']}")
