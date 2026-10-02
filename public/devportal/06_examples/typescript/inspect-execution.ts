// Inspect an execution: outcome and receipt are separate facts. OUTCOME_UNKNOWN is not a failure
// and is never retried — it is reconciled by an operator.
import { needsReconciliation, isTerminalOutcome } from '@dcs-ai/connector-os';
import { client } from './_env.ts';

const dcs = client();
const id = process.env.DCS_EXECUTION_ID ?? (await dcs.executions.list({ limit: 1 })).data[0]?.execution_id;
if (!id) { console.log('no executions yet (run approval-workflow.ts first)'); process.exit(0); }
const ex = await dcs.executions.retrieve(id);
console.log(`outcome:        ${ex.outcome} (${isTerminalOutcome(ex.outcome) ? 'settled' : 'not settled'})`);
if (needsReconciliation(ex)) console.log(`reconciliation: pending (${ex.reconciliation?.reconciliation_ref}) — do NOT retry`);
for (const a of ex.attempts) console.log(`  attempt ${a.attempt_n}: ${a.outcome}${a.error_class ? ` [${a.error_class}]` : ''}`);
console.log(`receipt:        ${ex.receipt.status} ${ex.receipt.receipt_id ?? ''} (evidence grade: ${ex.receipt.evidence_grade})`);
