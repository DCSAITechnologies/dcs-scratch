// The governed write path: plan → request approval → a HUMAN grants → submit → inspect.
// An API key can request an approval but can never grant one.
import { HumanRequiredError, ModeLockedError, BrokerRefusedError } from '@dcs-ai/connector-os';
import { client, operatorClient, required } from './_env.ts';

const dcs = client();
const human = operatorClient();
const attestation = required('DCS_OPERATOR_ATTESTATION');

const conn = (await dcs.connections.list({ connector_id: 'github', limit: 1 })).data[0]!;
const run = await dcs.runs.create({ mode: 'mode_1', objective: 'Close duplicate issue' });
const plan = await dcs.runs.createPlan(run.run_id, { steps: [{ connector_id: 'github', tool_id: 'update_issue', operation_class: 'write', connection_id: conn.connection_id }] });
const step = plan.steps[0]!;
console.log(`policy: ${step.policy_decision.decision}`);

const approval = await dcs.approvals.request({ run_id: run.run_id, plan_id: plan.plan_id, step_ids: [step.step_id], note: 'duplicate of #12' });
console.log(`approval ${approval.approval_id}: ${approval.state}`);
try { await dcs.approvals.grant(approval.approval_id); } catch (e) { if (e instanceof HumanRequiredError) console.log('API key cannot grant (expected)'); else throw e; }

const granted = await human.approvals.grant(approval.approval_id, { ttl_seconds: 600 });
console.log(`granted by ${granted.approved_by?.kind}:${granted.approved_by?.principal_id}, expires ${granted.expires_at}`);

try {
  const ex = await dcs.executions.submit({ run_id: run.run_id, plan_id: plan.plan_id, step_id: step.step_id, approval_id: approval.approval_id }, { operatorAttestation: attestation });
  console.log(`execution ${ex.execution_id}: outcome ${ex.outcome}; receipt ${ex.receipt.status}`);
} catch (e) {
  if (e instanceof ModeLockedError) console.log(`MODE 2 locked; pending: ${e.pending.join(', ')}`);
  else if (e instanceof BrokerRefusedError) console.log(`broker refused: ${e.refusalCode}`);
  else throw e;
}
