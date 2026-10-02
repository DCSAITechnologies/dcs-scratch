// Open a run, propose a plan, read it back. Plans are recommendations; nothing executes here.
import { idempotencyKeyFrom } from '@dcs-ai/connector-os';
import { client } from './_env.ts';

const dcs = client();
const conn = (await dcs.connections.list({ connector_id: 'github', limit: 1 })).data[0];
// A key derived from your own job identity makes a crashed-and-restarted job re-send the SAME key.
const run = await dcs.runs.create({ mode: 'mode_1', objective: 'Triage stale issues' }, { idempotencyKey: idempotencyKeyFrom('example-job', Date.now(), 'open-run') });
const plan = await dcs.runs.createPlan(run.run_id, {
  operator_explanation: 'Read one issue, then relabel it.',
  steps: [
    { connector_id: 'github', tool_id: 'get_issue', operation_class: 'read', ...(conn ? { connection_id: conn.connection_id } : {}) },
    { connector_id: 'github', tool_id: 'add_label', operation_class: 'write', ...(conn ? { connection_id: conn.connection_id } : {}) },
  ],
});
for (const s of plan.steps) console.log(`${s.step_id}  ${s.connector_id}/${s.tool_id}  ${s.operation_class}  → ${s.policy_decision.decision}`);
const again = await dcs.runs.retrieve(run.run_id);
console.log(`run ${again.run_id}: ${again.status}, phase ${again.phase}, ${again.plan_ids?.length ?? 0} plan(s)`);
