// Canonical OAL lifecycle — the ONLY lifecycle definition in the codebase (gate G2).
// /agents, /agents/lifecycle and home §5 all render from this source.

export const LIFECYCLE_10 = [
  'Observe', 'Correlate', 'Diagnose', 'Plan', 'Recommend',
  'Authorise', 'Execute', 'Verify', 'Recover / Escalate', 'Close',
]

export const LIFECYCLE_10_DESC = [
  'Signals, events, schedules and requests come in.',
  'Related signals merge into one picture.',
  'Findings are bound to evidence.',
  'A structured plan of declared steps.',
  'The plan is proposed — nothing has executed.',
  'Policy evaluation and human approval where required.',
  'Approved steps run in the Execution Engine.',
  'Outcomes checked against provider state.',
  'Ambiguity reconciled; limits escalate to people.',
  'The run closes with a complete evidence trail.',
]

export const MODE_BOUNDARIES = [
  { mode: 'MODE 0 · observe', range: [1, 2] as [number, number] },
  { mode: 'MODE 1 · diagnose & recommend (launch)', range: [3, 5] as [number, number] },
  { mode: 'MODE 2 · approval-gated execute (v1 ceiling)', range: [6, 10] as [number, number] },
]
