// Canonical outcome enum (Completion Spec §4 Developers).
// The outcome/refusal tables are defined ONCE here and imported wherever the
// enum renders — /developers/errors is the canonical page.

export const ATTEMPT_OUTCOMES: [string, string, string][] = [
  ['REFUSED', 'policy said no, with reason codes', 'change the plan or the policy; do not retry as-is'],
  ['BLOCKED', 'kill, revocation or environment gate stopped dispatch', 'resolve the block; check kill and connection state'],
  ['STARTED', 'dispatch confirmed, provider call in flight', 'await outcome; do not resubmit'],
  ['SUCCEEDED', 'provider accepted and the effect verified per contract', 'proceed; receipt ref available'],
  ['FAILED', 'provider definitively rejected or the effect did not occur', 'read classification; adjust the plan'],
  ['PROVIDER_UNAVAILABLE', 'provider down or unreachable', 'retry when it returns; the system monitors'],
  ['OUTCOME_UNKNOWN', 'timeout after the call — effect unknown', 'do not resubmit; reconciliation resolves it'],
  ['RETRY_SCHEDULED', 'safe retry queued per contract', 'wait; bounded, with ancestry'],
  ['RETRY_EXHAUSTED', 'retry budget spent without resolution', 'escalation opens with full context'],
]

export const RUN_OUTCOMES: [string, string, string][] = [
  ['RECOVERED', 'reconciliation resolved an ambiguous run', 'continue from the recorded state'],
  ['HUMAN_INTERVENTION', 'terminal for automation; a person must decide', 'read the escalation object — trigger, state, evidence, options'],
  ['KILL_SWITCH', 'a kill control ended the run', 'restore is dual-control; audit the kill event'],
]

export const OUTCOME_TABLE_HEAD = ['State', 'Meaning', 'Handling']
