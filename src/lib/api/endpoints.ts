// Typed operations for the Connector OS API, one function per OpenAPI operationId.
// Types come from schema.gen.ts (generated from public/devportal/01_openapi/
// connector-os-v1.yaml by `npm run api:types`). Mutating calls take the
// Idempotency-Key from the caller: one key per user action.

import type { components } from './schema.gen'
import { request } from './client'

export type S = components['schemas']
export type List<T> = { object: 'list'; data: T[]; has_more: boolean; next_cursor: string | null }
export type Page = { limit?: number; cursor?: string | null }

const enc = encodeURIComponent

// ── identity / environment ───────────────────────────────────────────────
export const getMe = () => request<S['Principal']>('GET', '/v1/me')
export const listEnvironments = () => request<List<S['Environment']>>('GET', '/v1/environments')
export const getUsage = (window: '24h' | '7d' | '30d' = '24h') => request<S['Usage']>('GET', '/v1/usage', { query: { window } })

// ── catalogue ────────────────────────────────────────────────────────────
export const listConnectors = (q: Page & { disposition?: S['ConnectorDisposition']; q?: string } = {}) =>
  request<List<S['Connector']>>('GET', '/v1/connectors', { query: q })
export const getConnector = (id: string) => request<S['Connector']>('GET', `/v1/connectors/${enc(id)}`)
export const getEligibility = (q: { connector_id?: string; tool_id?: string; environment?: 'staging' | 'production' } = {}) =>
  request<S['EligibilityReport']>('GET', '/v1/operator/eligibility', { query: q })
export const getProviderHealth = () => request<List<S['ProviderHealth']>>('GET', '/v1/operator/provider-health')

// ── connections ──────────────────────────────────────────────────────────
export const listConnections = (q: Page & { connector_id?: string; status?: S['ConnectionStatus'] } = {}) =>
  request<List<S['Connection']>>('GET', '/v1/connections', { query: q })
export const getConnection = (id: string) => request<S['Connection']>('GET', `/v1/connections/${enc(id)}`)
export const createConnection = (body: S['ConnectionCreate'], idempotencyKey: string) =>
  request<S['Connection']>('POST', '/v1/connections', { body, idempotencyKey })
export const testConnection = (id: string, idempotencyKey: string) =>
  request<S['ConnectionTestResult']>('POST', `/v1/connections/${enc(id)}/test`, { idempotencyKey })
export const activateConnection = (id: string, idempotencyKey: string) =>
  request<S['Connection']>('POST', `/v1/connections/${enc(id)}/activate`, { idempotencyKey })
export const revokeConnection = (id: string, body: S['ReviewedReasonBody'], idempotencyKey: string) =>
  request<S['Connection']>('POST', `/v1/operator/connections/${enc(id)}/revoke`, { body, idempotencyKey })

// ── runs / plans ─────────────────────────────────────────────────────────
export const listRuns = (q: Page & { status?: S['RunStatus'] } = {}) => request<List<S['Run']>>('GET', '/v1/runs', { query: q })
export const getRun = (id: string) => request<S['Run']>('GET', `/v1/runs/${enc(id)}`)
export const getPlan = (runId: string, planId: string) => request<S['Plan']>('GET', `/v1/runs/${enc(runId)}/plans/${enc(planId)}`)

// ── approvals ────────────────────────────────────────────────────────────
export const listApprovals = (q: Page & { state?: S['ApprovalState']; run_id?: string } = {}) =>
  request<List<S['Approval']>>('GET', '/v1/approvals', { query: q })
export const getApproval = (id: string) => request<S['Approval']>('GET', `/v1/approvals/${enc(id)}`)
export const grantApproval = (id: string, body: S['ApprovalGrant'], idempotencyKey: string) =>
  request<S['Approval']>('POST', `/v1/approvals/${enc(id)}/grant`, { body, idempotencyKey })
export const denyApproval = (id: string, body: S['ReasonBody'], idempotencyKey: string) =>
  request<S['Approval']>('POST', `/v1/approvals/${enc(id)}/deny`, { body, idempotencyKey })
export const revokeApproval = (id: string, body: S['ReasonBody'], idempotencyKey: string) =>
  request<S['Approval']>('POST', `/v1/approvals/${enc(id)}/revoke`, { body, idempotencyKey })

// ── executions / reconciliation ──────────────────────────────────────────
export const listExecutions = (q: Page & { run_id?: string; outcome?: S['ExecutionOutcome'] } = {}) =>
  request<List<S['Execution']>>('GET', '/v1/executions', { query: q })
export const getExecution = (id: string) => request<S['Execution']>('GET', `/v1/executions/${enc(id)}`)
export const listReconciliations = (q: Page = {}) => request<List<S['Execution']>>('GET', '/v1/operator/reconciliations', { query: q })
export const reconcileExecution = (id: string, body: S['ReconcileRequest'], idempotencyKey: string) =>
  request<S['Execution']>('POST', `/v1/operator/executions/${enc(id)}/reconcile`, { body, idempotencyKey })

// ── receipts ─────────────────────────────────────────────────────────────
export const listReceipts = (q: Page & { execution_id?: string; status?: S['ReceiptStatus'] } = {}) =>
  request<List<S['Receipt']>>('GET', '/v1/receipts', { query: q })
export const getReceipt = (id: string) => request<S['Receipt']>('GET', `/v1/receipts/${enc(id)}`)
// verify and evaluate are POST-shaped reads: no body/key per the contract
export const verifyReceipt = (id: string) =>
  request<S['ReceiptVerification']>('POST', `/v1/receipts/${enc(id)}/verify`, { readOnly: true })

// ── policies ─────────────────────────────────────────────────────────────
export const listPolicies = (q: Page = {}) => request<List<S['Policy']>>('GET', '/v1/policies', { query: q })
export const getPolicy = (id: string) => request<S['Policy']>('GET', `/v1/policies/${enc(id)}`)
export const evaluatePolicy = (body: S['PolicyEvaluateRequest']) =>
  request<S['PolicyDecision']>('POST', '/v1/policies/evaluate', { body, readOnly: true })

// ── events / kill orders ─────────────────────────────────────────────────
export const listEvents = (q: Page & { type?: S['EventType'] } = {}) => request<List<S['Event']>>('GET', '/v1/events', { query: q })
export const listKillOrders = (q: Page = {}) => request<List<S['KillOrder']>>('GET', '/v1/operator/kill-orders', { query: q })
export const createKillOrder = (body: S['KillOrderCreate'], idempotencyKey: string) =>
  request<S['KillOrder']>('POST', '/v1/operator/kill-orders', { body, idempotencyKey })
export const restoreKillOrder = (id: string, body: S['ReviewedReasonBody'], idempotencyKey: string) =>
  request<S['KillOrder']>('POST', `/v1/operator/kill-orders/${enc(id)}/restore`, { body, idempotencyKey })
