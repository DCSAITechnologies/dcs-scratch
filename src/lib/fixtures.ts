// Hermetic reference stores for the dashboard (Track C).
// Deterministic fixture data that mirrors the integrated build's in-process
// reference stores (trial ec49ad8). NOTHING here is production data — the
// console is a preview against the integrated build, per platform-status.json
// claim_level = HERMETIC. When Track D wires real services, these stores are
// replaced seam-by-seam; the UI does not change.

import type { Conn } from './data'
import { CONNECTORS } from './data'

const conn = (id: string) => {
  const c = CONNECTORS.find((x) => x.id === id)
  if (!c) {
    // simulator/reference-store id not in the canonical catalogue — return a
    // display-only stub rather than crashing the console (fixture ids predate
    // the authoritative 1000 dataset; stripe/slack/etc. are simulator labels)
    return { id, n: id.charAt(0).toUpperCase() + id.slice(1), s: 'Preview' } as unknown as Conn
  }
  return c
}

// ── Tenancy ────────────────────────────────────────────────────────────────
export const ORG = { id: 'org_acme', name: 'Acme Industries' }
export const WORKSPACES = [
  { id: 'ws_ops', name: 'Operations', role: 'workspace_admin' },
  { id: 'ws_fin', name: 'Finance', role: 'viewer' },
]
export const ENVIRONMENTS = ['Development', 'Staging', 'Production'] as const
export type Environment = (typeof ENVIRONMENTS)[number]

// ── Connections (Runtime E connection store) ───────────────────────────────
export type ConnectionState = 'CREATE' | 'AUTHORIZE' | 'TEST' | 'ACTIVE' | 'DEGRADED' | 'SUSPENDED' | 'REVOKED'
export type Connection = {
  id: string; connector: string; workspace: string; environment: Environment
  credential_ref: string; auth: string; scopes: string[]; host: string; region: string
  health: 'active' | 'degraded' | 'suspended' | 'revoked'; last_test: string; last_use: string
  expiry: string; state: ConnectionState; simulator: boolean
}
export const CONNECTIONS: Connection[] = [
  { id: 'cn_01HZX3A1', connector: 'stripe', workspace: 'ws_fin', environment: 'Staging', credential_ref: 'cred_9f2…k41', auth: 'API Key', scopes: ['charges:read', 'refunds:write'], host: 'api.stripe.com', region: 'in-1', health: 'active', last_test: '2026-09-27 14:02', last_use: '2026-09-27 15:41', expiry: '—', state: 'ACTIVE', simulator: true },
  { id: 'cn_01HZX3B7', connector: 'shopify', workspace: 'ws_ops', environment: 'Staging', credential_ref: 'cred_7aa…m09', auth: 'OAuth2', scopes: ['orders:read', 'orders:write'], host: 'api.shopify.com', region: 'in-1', health: 'degraded', last_test: '2026-09-26 09:15', last_use: '2026-09-27 11:03', expiry: '2026-12-01', state: 'DEGRADED', simulator: true },
  { id: 'cn_01HZX3C2', connector: 'salesforce', workspace: 'ws_ops', environment: 'Development', credential_ref: 'cred_3d1…x77', auth: 'OAuth2', scopes: ['sobjects:read'], host: 'login.salesforce.com', region: 'in-1', health: 'active', last_test: '2026-09-25 18:44', last_use: '2026-09-26 10:22', expiry: '2026-11-14', state: 'ACTIVE', simulator: true },
  { id: 'cn_01HZX3D9', connector: 'slack', workspace: 'ws_ops', environment: 'Staging', credential_ref: 'cred_b65…p02', auth: 'OAuth2', scopes: ['chat:write'], host: 'slack.com', region: 'in-1', health: 'suspended', last_test: '2026-09-20 08:10', last_use: '2026-09-20 08:11', expiry: '2027-01-05', state: 'SUSPENDED', simulator: true },
  { id: 'cn_01HZX3E4', connector: 'razorpay', workspace: 'ws_fin', environment: 'Development', credential_ref: 'cred_11c…z58', auth: 'API Key', scopes: ['payments:read'], host: 'api.razorpay.com', region: 'in-1', health: 'active', last_test: '2026-09-27 07:55', last_use: '2026-09-27 07:56', expiry: '—', state: 'ACTIVE', simulator: true },
]

// ── Tools (A7 JIT registry ∩ policy evaluator) ─────────────────────────────
export type Tool = {
  id: string; connector: string; connection: string; operation_class: 'read' | 'write' | 'destructive' | 'admin' | 'money-moving'
  side_effects: boolean; approval_class: 'none' | 'standard' | 'dual'; retry_safety: 'safe' | 'unsafe' | 'unknown'
  verification: string; webhook_events: string[]; policy_preview: 'ALLOW' | 'APPROVAL_REQUIRED' | 'REFUSE'
}
export const TOOLS: Tool[] = [
  { id: 'stripe.charges.list', connector: 'stripe', connection: 'cn_01HZX3A1', operation_class: 'read', side_effects: false, approval_class: 'none', retry_safety: 'safe', verification: 'predicate on returned page', webhook_events: [], policy_preview: 'ALLOW' },
  { id: 'stripe.refunds.create', connector: 'stripe', connection: 'cn_01HZX3A1', operation_class: 'money-moving', side_effects: true, approval_class: 'dual', retry_safety: 'unknown', verification: 'governed read-back', webhook_events: ['charge.refunded'], policy_preview: 'APPROVAL_REQUIRED' },
  { id: 'shopify.orders.get', connector: 'shopify', connection: 'cn_01HZX3B7', operation_class: 'read', side_effects: false, approval_class: 'none', retry_safety: 'safe', verification: 'predicate on returned object', webhook_events: ['orders/create'], policy_preview: 'ALLOW' },
  { id: 'shopify.orders.close', connector: 'shopify', connection: 'cn_01HZX3B7', operation_class: 'write', side_effects: true, approval_class: 'standard', retry_safety: 'unsafe', verification: 'governed read-back', webhook_events: ['orders/updated'], policy_preview: 'APPROVAL_REQUIRED' },
  { id: 'salesforce.sobjects.query', connector: 'salesforce', connection: 'cn_01HZX3C2', operation_class: 'read', side_effects: false, approval_class: 'none', retry_safety: 'safe', verification: 'predicate on result set', webhook_events: [], policy_preview: 'ALLOW' },
  { id: 'slack.chat.postMessage', connector: 'slack', connection: 'cn_01HZX3D9', operation_class: 'write', side_effects: true, approval_class: 'standard', retry_safety: 'safe', verification: 'provider ack + ts', webhook_events: ['message.channels'], policy_preview: 'REFUSE' },
  { id: 'razorpay.payments.fetch', connector: 'razorpay', connection: 'cn_01HZX3E4', operation_class: 'read', side_effects: false, approval_class: 'none', retry_safety: 'safe', verification: 'predicate on returned object', webhook_events: ['payment.captured'], policy_preview: 'ALLOW' },
]

// ── Runs (OAL run state) ───────────────────────────────────────────────────
export type Run = {
  id: string; agent: string; mode: 0 | 1 | 2; stage: number; connectors: string[]
  policy_result: 'ALLOW' | 'APPROVAL_REQUIRED' | 'REFUSE'; approval_status: string
  execution_outcome: string; receipt_state: string; escalation: string
  started: string; updated: string; environment: Environment
}
export const RUNS: Run[] = [
  { id: 'run_01J0AA11', agent: 'agent_ops-reconciler', mode: 1, stage: 5, connectors: ['stripe', 'razorpay'], policy_result: 'APPROVAL_REQUIRED', approval_status: 'Pending', execution_outcome: '—', receipt_state: '—', escalation: '—', started: '2026-09-27 15:10', updated: '2026-09-27 15:38', environment: 'Staging' },
  { id: 'run_01J0A9ZK', agent: 'agent_orders-watch', mode: 2, stage: 8, connectors: ['shopify'], policy_result: 'ALLOW', approval_status: 'Granted', execution_outcome: 'SUCCEEDED', receipt_state: 'ISSUED', escalation: '—', started: '2026-09-27 11:02', updated: '2026-09-27 11:14', environment: 'Staging' },
  { id: 'run_01J0A7QM', agent: 'agent_crm-hygiene', mode: 1, stage: 10, connectors: ['salesforce'], policy_result: 'ALLOW', approval_status: '—', execution_outcome: '—', receipt_state: 'ISSUED', escalation: '—', started: '2026-09-26 09:31', updated: '2026-09-26 09:58', environment: 'Development' },
  { id: 'run_01J0A5TT', agent: 'agent_orders-watch', mode: 2, stage: 9, connectors: ['shopify'], policy_result: 'ALLOW', approval_status: 'Granted', execution_outcome: 'OUTCOME_UNKNOWN', receipt_state: 'PENDING', escalation: 'reconciliation queued', started: '2026-09-27 10:12', updated: '2026-09-27 10:20', environment: 'Staging' },
  { id: 'run_01J0A3BB', agent: 'agent_alerts-fanout', mode: 2, stage: 6, connectors: ['slack'], policy_result: 'REFUSE', approval_status: '—', execution_outcome: 'REFUSED', receipt_state: 'ISSUED', escalation: '—', started: '2026-09-25 16:40', updated: '2026-09-25 16:41', environment: 'Staging' },
]

// ── Policies (policy store + evaluator, A4) ────────────────────────────────
export type Policy = {
  id: string; name: string; version: string; scope: 'tenant' | 'workspace'; environment: Environment
  connectors: string[]; tools: string; operation_class: string; side_effects: string
  decision: 'ALLOW' | 'APPROVAL_REQUIRED' | 'REFUSE'; approval_class?: string
  limits: string; status: 'active' | 'disabled' | 'draft'; changed: string; changed_by: string
}
export const POLICIES: Policy[] = [
  { id: 'pol_floor', name: 'Org floor — destructive & money-moving', version: 'v3', scope: 'tenant', environment: 'Production', connectors: ['*'], tools: '*', operation_class: 'destructive, admin, money-moving', side_effects: 'any', decision: 'APPROVAL_REQUIRED', approval_class: 'dual', limits: 'blast-radius ≤ workspace', status: 'active', changed: '2026-09-20', changed_by: 'org.admin@acme' },
  { id: 'pol_fin_refunds', name: 'Finance — refunds above ₹5,000', version: 'v2', scope: 'workspace', environment: 'Staging', connectors: ['stripe', 'razorpay'], tools: '*.refunds.*', operation_class: 'money-moving', side_effects: 'true', decision: 'APPROVAL_REQUIRED', approval_class: 'standard', limits: 'rate 10/h · budget ₹50,000/day', status: 'active', changed: '2026-09-22', changed_by: 'ws.admin@acme' },
  { id: 'pol_ops_read', name: 'Ops — read-only catalogue', version: 'v5', scope: 'workspace', environment: 'Staging', connectors: ['shopify', 'salesforce'], tools: '*.get, *.list, *.query', operation_class: 'read', side_effects: 'false', decision: 'ALLOW', limits: 'rate 120/min', status: 'active', changed: '2026-09-18', changed_by: 'ws.admin@acme' },
  { id: 'pol_slack_hold', name: 'Slack — hold all posts', version: 'v1', scope: 'workspace', environment: 'Staging', connectors: ['slack'], tools: 'chat.postMessage', operation_class: 'write', side_effects: 'true', decision: 'REFUSE', limits: '—', status: 'active', changed: '2026-09-25', changed_by: 'ws.admin@acme' },
  { id: 'pol_mode_stripe', name: 'MODE settings — Stripe', version: 'v1', scope: 'tenant', environment: 'Staging', connectors: ['stripe'], tools: '*', operation_class: 'any', side_effects: 'any', decision: 'ALLOW', limits: 'MODE 2 ceiling', status: 'active', changed: '2026-09-21', changed_by: 'org.admin@acme' },
  { id: 'pol_draft_growth', name: 'Growth workspace — draft', version: 'v0-draft', scope: 'workspace', environment: 'Development', connectors: ['hubspot'], tools: '*', operation_class: 'read', side_effects: 'false', decision: 'ALLOW', limits: 'rate 60/min', status: 'draft', changed: '2026-09-26', changed_by: 'dev@acme' },
]

// ── Approvals (approval store + ops-broker consumption) ────────────────────
export type ApprovalState = 'Pending' | 'Granted' | 'Denied' | 'Expired' | 'Revoked' | 'Consumed' | 'Superseded'
export type Approval = {
  id: string; state: ApprovalState; agent: string; run: string; connector: string; tool: string
  operation_class: string; risk: 'low' | 'medium' | 'high' | 'critical'; environment: Environment
  requested: string; expires: string; approver: string; submitted_by: string
  plan_hash: string; step: string; policy: string; dual?: string
}
export const APPROVALS: Approval[] = [
  { id: 'ap_01J1K71', state: 'Pending', agent: 'agent_ops-reconciler', run: 'run_01J0AA11', connector: 'stripe', tool: 'stripe.refunds.create', operation_class: 'money-moving', risk: 'high', environment: 'Staging', requested: '2026-09-27 15:38', expires: '2026-09-28 15:38', approver: '—', submitted_by: 'agent_ops-reconciler', plan_hash: 'sha256:9d2e…41ab', step: 'step 3 of 5', policy: 'pol_fin_refunds v2', dual: '1 of 2' },
  { id: 'ap_01J1K02', state: 'Pending', agent: 'agent_orders-watch', run: 'run_01J0A5TT', connector: 'shopify', tool: 'shopify.orders.close', operation_class: 'write', risk: 'medium', environment: 'Staging', requested: '2026-09-27 10:13', expires: '2026-09-28 10:13', approver: '—', submitted_by: 'agent_orders-watch', plan_hash: 'sha256:71c0…9fe2', step: 'step 2 of 4', policy: 'pol_ops_read v5' },
  { id: 'ap_01J1J88', state: 'Granted', agent: 'agent_orders-watch', run: 'run_01J0A9ZK', connector: 'shopify', tool: 'shopify.orders.close', operation_class: 'write', risk: 'medium', environment: 'Staging', requested: '2026-09-27 11:05', expires: '2026-09-27 23:05', approver: 'approver.1@acme', submitted_by: 'agent_orders-watch', plan_hash: 'sha256:a1f4…77d0', step: 'step 2 of 3', policy: 'pol_ops_read v5' },
  { id: 'ap_01J1H12', state: 'Consumed', agent: 'agent_orders-watch', run: 'run_01J0A9ZK', connector: 'shopify', tool: 'shopify.orders.close', operation_class: 'write', risk: 'medium', environment: 'Staging', requested: '2026-09-26 14:00', expires: '2026-09-27 14:00', approver: 'approver.1@acme', submitted_by: 'agent_orders-watch', plan_hash: 'sha256:55be…01c9', step: 'step 2 of 3', policy: 'pol_ops_read v5' },
  { id: 'ap_01J1F90', state: 'Denied', agent: 'agent_alerts-fanout', run: 'run_01J0A3BB', connector: 'slack', tool: 'slack.chat.postMessage', operation_class: 'write', risk: 'low', environment: 'Staging', requested: '2026-09-25 16:40', expires: '2026-09-26 16:40', approver: 'approver.2@acme', submitted_by: 'agent_alerts-fanout', plan_hash: 'sha256:c8aa…3b17', step: 'step 1 of 2', policy: 'pol_slack_hold v1' },
  { id: 'ap_01J1D44', state: 'Expired', agent: 'agent_crm-hygiene', run: 'run_01J0A7QM', connector: 'salesforce', tool: 'salesforce.sobjects.update', operation_class: 'write', risk: 'medium', environment: 'Development', requested: '2026-09-24 09:00', expires: '2026-09-25 09:00', approver: '—', submitted_by: 'agent_crm-hygiene', plan_hash: 'sha256:0f91…a6d4', step: 'step 4 of 6', policy: 'pol_ops_read v5' },
]

// ── Executions (execution ledger / EXEC-FACTS) ─────────────────────────────
export type Attempt = { n: number; started: string; classification: string; outcome: string; provider_request_id: string }
export type Execution = {
  id: string; run: string; connector: string; connection: string; tool: string
  operation_class: string; attempts: Attempt[]; outcome: string; verification: string
  reconciliation: string; receipt_state: 'ISSUED' | 'PENDING' | 'FAILED'; receipt_ref: string
  started: string; ended: string; environment: Environment
  routing: { tenant: string; host: string; region: string }
  policy_ref: string; approval_ref: string; retry_safety: 'safe' | 'unsafe' | 'unknown'
}
export const EXECUTIONS: Execution[] = [
  { id: 'ex_01J2Q11', run: 'run_01J0A9ZK', connector: 'shopify', connection: 'cn_01HZX3B7', tool: 'shopify.orders.get', operation_class: 'read', attempts: [{ n: 1, started: '2026-09-27 11:06:02', classification: '2xx success', outcome: 'SUCCEEDED', provider_request_id: 'req_9f2ac1' }], outcome: 'SUCCEEDED', verification: 'predicate passed (read receipt rc_01J2Q12)', reconciliation: '—', receipt_state: 'ISSUED', receipt_ref: 'rc_01J2Q13', started: '2026-09-27 11:06', ended: '2026-09-27 11:06', environment: 'Staging', routing: { tenant: 'org_acme', host: 'api.shopify.com', region: 'in-1' }, policy_ref: 'pol_ops_read v5', approval_ref: '—', retry_safety: 'safe' },
  { id: 'ex_01J2Q21', run: 'run_01J0A9ZK', connector: 'shopify', connection: 'cn_01HZX3B7', tool: 'shopify.orders.close', operation_class: 'write', attempts: [{ n: 1, started: '2026-09-27 11:07:41', classification: '2xx success', outcome: 'SUCCEEDED', provider_request_id: 'req_9f2b07' }], outcome: 'SUCCEEDED', verification: 'governed read-back matched', reconciliation: '—', receipt_state: 'ISSUED', receipt_ref: 'rc_01J2Q24', started: '2026-09-27 11:07', ended: '2026-09-27 11:08', environment: 'Staging', routing: { tenant: 'org_acme', host: 'api.shopify.com', region: 'in-1' }, policy_ref: 'pol_ops_read v5', approval_ref: 'ap_01J1H12 (consumed)', retry_safety: 'unsafe' },
  { id: 'ex_01J2P88', run: 'run_01J0A5TT', connector: 'shopify', connection: 'cn_01HZX3B7', tool: 'shopify.orders.close', operation_class: 'write', attempts: [{ n: 1, started: '2026-09-27 10:15:20', classification: 'timeout after dispatch', outcome: 'OUTCOME_UNKNOWN', provider_request_id: 'req_9f1e90' }], outcome: 'OUTCOME_UNKNOWN', verification: 'pending', reconciliation: 'queued — governed read at +5 min', receipt_state: 'PENDING', receipt_ref: '—', started: '2026-09-27 10:15', ended: '—', environment: 'Staging', routing: { tenant: 'org_acme', host: 'api.shopify.com', region: 'in-1' }, policy_ref: 'pol_ops_read v5', approval_ref: 'ap_01J1K02 (pending)', retry_safety: 'unknown' },
  { id: 'ex_01J2N02', run: 'run_01J0A3BB', connector: 'slack', connection: 'cn_01HZX3D9', tool: 'slack.chat.postMessage', operation_class: 'write', attempts: [], outcome: 'REFUSED', verification: 'n/a — never dispatched', reconciliation: '—', receipt_state: 'ISSUED', receipt_ref: 'rc_01J2N05', started: '2026-09-25 16:41', ended: '2026-09-25 16:41', environment: 'Staging', routing: { tenant: 'org_acme', host: 'slack.com', region: 'in-1' }, policy_ref: 'pol_slack_hold v1', approval_ref: 'ap_01J1F90 (denied)', retry_safety: 'safe' },
  { id: 'ex_01J2M51', run: 'run_01J0A7QM', connector: 'salesforce', connection: 'cn_01HZX3C2', tool: 'salesforce.sobjects.query', operation_class: 'read', attempts: [{ n: 1, started: '2026-09-26 09:44:10', classification: '5xx provider fault', outcome: 'PROVIDER_UNAVAILABLE', provider_request_id: 'req_9e77aa' }, { n: 2, started: '2026-09-26 09:47:33', classification: '2xx success', outcome: 'SUCCEEDED', provider_request_id: 'req_9e77e1' }], outcome: 'SUCCEEDED', verification: 'predicate passed', reconciliation: '—', receipt_state: 'ISSUED', receipt_ref: 'rc_01J2M60', started: '2026-09-26 09:44', ended: '2026-09-26 09:47', environment: 'Development', routing: { tenant: 'org_acme', host: 'login.salesforce.com', region: 'in-1' }, policy_ref: 'pol_ops_read v5', approval_ref: '—', retry_safety: 'safe' },
  { id: 'ex_01J2K30', run: 'run_01J0AA11', connector: 'stripe', connection: 'cn_01HZX3A1', tool: 'stripe.charges.list', operation_class: 'read', attempts: [{ n: 1, started: '2026-09-27 15:12:55', classification: '2xx success', outcome: 'SUCCEEDED', provider_request_id: 'req_9d01f2' }], outcome: 'SUCCEEDED', verification: 'predicate passed', reconciliation: '—', receipt_state: 'FAILED', receipt_ref: '—', started: '2026-09-27 15:12', ended: '2026-09-27 15:13', environment: 'Staging', routing: { tenant: 'org_acme', host: 'api.stripe.com', region: 'in-1' }, policy_ref: 'pol_ops_read v5', approval_ref: '—', retry_safety: 'safe' },
]

export const EXECUTION_STATES = ['REFUSED', 'BLOCKED', 'STARTED', 'SUCCEEDED', 'FAILED', 'PROVIDER_UNAVAILABLE', 'OUTCOME_UNKNOWN', 'RETRY_SCHEDULED', 'RETRY_EXHAUSTED']

// ── Receipts (receipt-per-fact index, EvidenceClient read seam) ────────────
export type Receipt = {
  id: string; state: 'ISSUED' | 'PENDING' | 'FAILED'; execution_outcome: string; type: string
  sequence: number; parent: string; run: string; connector: string; tool: string
  issued_at: string; verification: 'signature ✓' | 'signature ✓ · lineage ✓' | 'unverified' | '—'
  profile: string; suite: string; key_id: string
}
export const RECEIPTS: Receipt[] = [
  { id: 'rc_01J2Q13', state: 'ISSUED', execution_outcome: 'SUCCEEDED', type: 'exec.fact', sequence: 4, parent: 'rc_01J2Q12', run: 'run_01J0A9ZK', connector: 'shopify', tool: 'shopify.orders.get', issued_at: '2026-09-27 11:06:09', verification: 'signature ✓ · lineage ✓', profile: 'cos-ops-v1', suite: 'test signer', key_id: 'key_test_01' },
  { id: 'rc_01J2Q24', state: 'ISSUED', execution_outcome: 'SUCCEEDED', type: 'exec.fact', sequence: 5, parent: 'rc_01J2Q13', run: 'run_01J0A9ZK', connector: 'shopify', tool: 'shopify.orders.close', issued_at: '2026-09-27 11:08:02', verification: 'signature ✓ · lineage ✓', profile: 'cos-ops-v1', suite: 'test signer', key_id: 'key_test_01' },
  { id: 'rc_01J2N05', state: 'ISSUED', execution_outcome: 'REFUSED', type: 'exec.fact', sequence: 2, parent: 'rc_01J2N01', run: 'run_01J0A3BB', connector: 'slack', tool: 'slack.chat.postMessage', issued_at: '2026-09-25 16:41:11', verification: 'signature ✓', profile: 'cos-ops-v1', suite: 'test signer', key_id: 'key_test_01' },
  { id: 'rc_01J2M60', state: 'ISSUED', execution_outcome: 'SUCCEEDED', type: 'exec.fact', sequence: 7, parent: 'rc_01J2M58', run: 'run_01J0A7QM', connector: 'salesforce', tool: 'salesforce.sobjects.query', issued_at: '2026-09-26 09:47:40', verification: 'signature ✓ · lineage ✓', profile: 'cos-ops-v1', suite: 'test signer', key_id: 'key_test_01' },
]

// ── Events (webhook verify + dedupe + inbound firewall + eventbus) ─────────
export type InboundEvent = { id: string; connector: string; connection: string; event_type: string; received: string; verification: 'verified' | 'unsigned' | 'rejected'; algorithm: string; dedupe: string; replay: string; downstream: string }
export type OutboundEvent = { id: string; subscription: string; event: string; delivery: string; attempts: number }
export const INBOUND_EVENTS: InboundEvent[] = [
  { id: 'ev_01J3A1', connector: 'shopify', connection: 'cn_01HZX3B7', event_type: 'orders/create', received: '2026-09-27 11:01', verification: 'verified', algorithm: 'HMAC-SHA256', dedupe: 'new', replay: 'fresh', downstream: 'delivered to run_01J0A9ZK' },
  { id: 'ev_01J3A2', connector: 'stripe', connection: 'cn_01HZX3A1', event_type: 'charge.refunded', received: '2026-09-27 14:20', verification: 'verified', algorithm: 'HMAC-SHA256', dedupe: 'new', replay: 'fresh', downstream: 'delivered to run_01J0AA11' },
  { id: 'ev_01J3A3', connector: 'razorpay', connection: 'cn_01HZX3E4', event_type: 'payment.captured', received: '2026-09-27 07:56', verification: 'unsigned', algorithm: '—', dedupe: 'new', replay: 'fresh', downstream: 'quarantined by inbound firewall' },
  { id: 'ev_01J3A4', connector: 'shopify', connection: 'cn_01HZX3B7', event_type: 'orders/updated', received: '2026-09-27 10:14', verification: 'rejected', algorithm: 'HMAC-SHA256', dedupe: '—', replay: '—', downstream: 'dropped' },
]
export const OUTBOUND_EVENTS: OutboundEvent[] = [
  { id: 'sub_01.ops', subscription: 'sub_01.ops', event: 'approval.requested', delivery: 'delivered', attempts: 1 },
  { id: 'sub_01.exec', subscription: 'sub_01.ops', event: 'execution.state_changed', delivery: 'delivered', attempts: 1 },
  { id: 'sub_02.rcpt', subscription: 'sub_02.audit', event: 'receipt.issued', delivery: 'retrying', attempts: 3 },
]

// ── Security: kills, leases, drills ────────────────────────────────────────
export type Kill = { id: string; scope: string; target: string; initiated_by: string; reason: string; time: string; affected: string; restore_auth: string }
export const KILLS: Kill[] = [
  { id: 'kill_01', scope: 'connection', target: 'cn_01HZX3D9 (slack)', initiated_by: 'ws.admin@acme', reason: 'Suspicious post pattern from agent_alerts-fanout', time: '2026-09-20 08:12', affected: '1 run halted · 0 approvals pending', restore_auth: 'ws.admin + second identity' },
]
export const LEASES = [
  { id: 'lease_9f01', connection: 'cn_01HZX3A1', ttl: '04:12 remaining', scope: 'stripe.read' },
  { id: 'lease_9f02', connection: 'cn_01HZX3B7', ttl: '11:40 remaining', scope: 'shopify.read_write' },
]
export const STOLEN_LEASE_DRILL = { last_run: '2026-09-19 (CI evidence)', result: 'stolen lease rejected in 41 ms · provider never reached' }
export const EGRESS_SUMMARY = 'Egress is allow-listed per connection host; no wildcard routes; DNS-pinned.'

// ── Developer: API keys ────────────────────────────────────────────────────
export const API_KEYS = [
  { name: 'ci-pipeline', prefix: 'cosk_ci_…', scopes: ['runs:read', 'executions:read'], environment: 'Staging', created: '2026-09-10', last_used: '2026-09-27 15:40', status: 'active' },
  { name: 'local-dev', prefix: 'cosk_lv_…', scopes: ['connectors:read'], environment: 'Development', created: '2026-09-15', last_used: '2026-09-21 09:02', status: 'active' },
]

// ── Usage (ledger aggregates; cost where provider reports it) ─────────────
export const USAGE = {
  executions_24h: 41, provider_calls_24h: 57, receipts_issued: 133, receipts_pending: 1, receipts_failed: 1,
  failed_24h: 3, reconciled_24h: 2,
  by_connector: [['shopify', 22], ['stripe', 9], ['salesforce', 6], ['razorpay', 3], ['slack', 1]] as [string, number][],
  by_agent: [['agent_orders-watch', 19], ['agent_ops-reconciler', 12], ['agent_crm-hygiene', 7], ['agent_alerts-fanout', 3]] as [string, number][],
  cost_note: 'Provider-reported cost is not captured by the integrated build — shown where a provider reports it; otherwise “not reported”.',
}

// ── Team ───────────────────────────────────────────────────────────────────
export const TEAM = [
  { name: 'A. Sharma', email: 'org.admin@acme', role: 'org_admin' as const, last_active: '2026-09-27 15:44' },
  { name: 'R. Verma', email: 'ws.admin@acme', role: 'workspace_admin' as const, last_active: '2026-09-27 14:20' },
  { name: 'K. Iyer', email: 'approver.1@acme', role: 'approver' as const, last_active: '2026-09-27 11:06' },
  { name: 'M. Joseph', email: 'approver.2@acme', role: 'approver' as const, last_active: '2026-09-25 16:41' },
  { name: 'S. Rao', email: 'dev@acme', role: 'developer' as const, last_active: '2026-09-26 09:47' },
  { name: 'P. Nair', email: 'viewer@acme', role: 'viewer' as const, last_active: '2026-09-27 08:12' },
]

// ── Audit ledger ───────────────────────────────────────────────────────────
export type AuditEvent = { id: string; time: string; actor: string; class: string; action: string; target: string; environment: Environment; receipt: string }
export const AUDIT_EVENTS: AuditEvent[] = [
  { id: 'au_01J41', time: '2026-09-27 15:38', actor: 'agent_ops-reconciler', class: 'approvals', action: 'approval requested', target: 'ap_01J1K71', environment: 'Staging', receipt: 'PENDING' },
  { id: 'au_01J42', time: '2026-09-27 11:05', actor: 'approver.1@acme', class: 'approvals', action: 'granted (single-use)', target: 'ap_01J1J88', environment: 'Staging', receipt: 'PENDING' },
  { id: 'au_01J39', time: '2026-09-25 16:41', actor: 'approver.2@acme', class: 'approvals', action: 'denied — reason recorded', target: 'ap_01J1F90', environment: 'Staging', receipt: 'PENDING' },
  { id: 'au_01J35', time: '2026-09-25 16:41', actor: 'policy evaluator', class: 'executions', action: 'REFUSED — pol_slack_hold v1', target: 'ex_01J2N02', environment: 'Staging', receipt: 'ISSUED rc_01J2N05' },
  { id: 'au_01J28', time: '2026-09-22 10:02', actor: 'ws.admin@acme', class: 'policy changes', action: 'activated pol_fin_refunds v2', target: 'pol_fin_refunds', environment: 'Staging', receipt: 'PENDING' },
  { id: 'au_01J20', time: '2026-09-20 08:12', actor: 'ws.admin@acme', class: 'kill/restore', action: 'kill — connection scope', target: 'cn_01HZX3D9', environment: 'Staging', receipt: 'PENDING' },
  { id: 'au_01J18', time: '2026-09-18 17:30', actor: 'ws.admin@acme', class: 'policy changes', action: 'activated pol_ops_read v5', target: 'pol_ops_read', environment: 'Staging', receipt: 'PENDING' },
  { id: 'au_01J11', time: '2026-09-15 09:00', actor: 'org.admin@acme', class: 'role changes', action: 'role approver → K. Iyer', target: 'approver.1@acme', environment: 'Staging', receipt: 'PENDING' },
]

// ── Environments roll-up ───────────────────────────────────────────────────
export const ENV_ROLLUP = [
  { env: 'Development' as Environment, connections: 2, policies: 1, approvals_pending: 0, executions_24h: 6, mode_ceiling: 'MODE 2', notes: 'Sandbox work; simulator providers only.' },
  { env: 'Staging' as Environment, connections: 3, policies: 4, approvals_pending: 2, executions_24h: 35, mode_ceiling: 'MODE 2', notes: 'Pre-production proof runs against the integrated build.' },
  { env: 'Production' as Environment, connections: 0, policies: 1, approvals_pending: 0, executions_24h: 0, mode_ceiling: 'MODE 1', notes: 'Org floor applies. No production connections until claim_level reaches STAGING.' },
]

// ── Helpers ────────────────────────────────────────────────────────────────
export const connectorName = (id: string) => (id === '*' ? '*' : conn(id).n)
export const RUNTIME_STATUS_LABEL: Record<string, string> = {
  not_verified: 'Not verified',
  staging_verified: 'Staging verified',
  production_verified: 'Production verified',
}
export const fmtConn = (id: string) => (id === '*' ? 'all connectors' : `${conn(id).n}`)

// Catalogue-side runtime maturity for the dashboard Connectors view:
// all catalogue records are not_verified today (wave-0 pipeline), so the console
// shows runtime status next to catalogue status for every row.
// Publication (public listing) is a separate field from catalogue status and
// runtime status — the console shows all canonical rows, including HOLD rows.
export const CATALOGUE_RUNTIME = CONNECTORS.map((c) => ({
  id: c.id, name: c.n, provider: c.p, category: c.cat, catalogue_status: c.s,
  runtime_status: c.runtime_status ?? 'not_verified', auth: c.auth, rw: c.rw, webhooks: c.wh,
  published: c.unpublished !== true, hold_category: c.hold_category ?? null,
  engineering_status: c.engineering_status ?? null, dispatch_eligibility: c.dispatch_eligibility ?? null,
  alias_of: c.alias_of ?? null, rank: c.r,
}))
