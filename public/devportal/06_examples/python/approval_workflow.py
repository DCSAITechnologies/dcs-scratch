"""Governed write: plan -> request approval -> HUMAN grant -> submit with attestation.

An API key can request an approval but never grant it. Execution goes through the ops-broker;
if MODE 2 is locked (the product default) the submit raises ModeLockedError.

    DCS_BASE_URL=... DCS_API_KEY=... DCS_OPERATOR_SESSION=... DCS_OPERATOR_ATTESTATION=... python approval_workflow.py
"""
from _env import attestation, developer, operator
from dcs_connector_os import HumanRequiredError, ModeLockedError

dev, human = developer(), operator()
conn = dev.connections.list(connector_id="github").data[0]
run = dev.runs.create({"mode": "mode_1", "objective": "example: governed write"})
plan = dev.runs.create_plan(run["run_id"], {"steps": [
    {"connector_id": "github", "tool_id": "update_issue", "operation_class": "write", "connection_id": conn["connection_id"]},
]})
step = plan["steps"][0]
print(f"policy decision: {step['policy_decision']['decision']}")

approval = dev.approvals.request({"run_id": run["run_id"], "plan_id": plan["plan_id"], "step_ids": [step["step_id"]]})
print(f"approval {approval['approval_id']} state={approval['state']}")
try:
    dev.approvals.grant(approval["approval_id"])
except HumanRequiredError as e:
    print(f"API key cannot grant: {e.code}")

granted = human.approvals.grant(approval["approval_id"], {"ttl_seconds": 600})
print(f"granted by {granted['approved_by']['principal_id']} oal_status={granted['oal_status']}")

try:
    ex = dev.executions.submit({"run_id": run["run_id"], "plan_id": plan["plan_id"], "step_id": step["step_id"],
                                "approval_id": approval["approval_id"]}, operator_attestation=attestation())
    print(f"execution {ex['execution_id']} outcome={ex['outcome']} receipt={ex['receipt']['status']}")
except ModeLockedError as e:
    print(f"MODE 2 locked; pending: {', '.join(e.pending)}")
