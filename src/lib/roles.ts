// Shared role matrix (Completion Spec §4 Enterprise + Dashboard spec §15).
// The website and the dashboard both render from this file so the two never diverge.

export type RoleKey = 'org_admin' | 'workspace_admin' | 'approver' | 'developer' | 'viewer'
export type Capability = 'configure' | 'approve' | 'execute' | 'kill' | 'restore' | 'view'

export const ROLE_LABELS: Record<RoleKey, string> = {
  org_admin: 'Org admin',
  workspace_admin: 'Workspace admin',
  approver: 'Approver',
  developer: 'Developer',
  viewer: 'Viewer',
}

export const CAPABILITY_LABELS: Record<Capability, string> = {
  configure: 'Configure',
  approve: 'Approve',
  execute: 'Execute',
  kill: 'Kill',
  restore: 'Restore',
  view: 'View',
}

// 'yes' | 'scoped' | 'dual' | 'no' — scoped = workspace-scoped, dual = requires a second identity
export const ROLE_MATRIX: Record<RoleKey, Record<Capability, 'yes' | 'scoped' | 'dual' | 'no'>> = {
  org_admin:       { configure: 'yes',    approve: 'no',  execute: 'no',  kill: 'yes',    restore: 'dual', view: 'yes' },
  workspace_admin: { configure: 'scoped', approve: 'no',  execute: 'no',  kill: 'scoped', restore: 'no',   view: 'scoped' },
  approver:        { configure: 'no',     approve: 'yes', execute: 'no',  kill: 'no',     restore: 'no',   view: 'scoped' },
  developer:       { configure: 'scoped', approve: 'no',  execute: 'yes', kill: 'no',     restore: 'no',   view: 'scoped' },
  viewer:          { configure: 'no',     approve: 'no',  execute: 'no',  kill: 'no',     restore: 'no',   view: 'yes' },
}

export const matrixCell = (v: 'yes' | 'scoped' | 'dual' | 'no'): string =>
  v === 'yes' ? '✓' : v === 'scoped' ? '✓ workspace' : v === 'dual' ? '✓ dual-control' : '—'

export const ROLLOUT_STAGES: [string, string, string][] = [
  ['Pilot workspace', 'MODE 0–1', 'evidence reviewed; policies drafted'],
  ['Policy tuning', 'MODE 1', 'refusal and approval patterns stable'],
  ['Team expansion', 'MODE 1', 'workspaces refined; roles assigned'],
  ['Production enablement', 'MODE 1 (+ gated writes)', 'human approval chain proven in staging'],
]
