#!/usr/bin/env node
// Local mock of the Connector OS API (/v1, contract 1.0.0) for development and e2e.
//
// NOT the core reference server and NOT evidence of anything: an in-memory stand-in
// shaped by public/devportal/01_openapi/connector-os-v1.yaml so the console's API
// mode can be exercised without a backend. When core's hermetic reference server
// (devex/api-server, port 4010) is available, point VITE_COS_API_URL at it instead.
//
//   node scripts/mock-api.mjs [--port 4010]
//
// Auth: core's hermetic test credentials (devex/api-server README) — they
// authenticate nothing outside a hermetic server. coso_* = human operator,
// cosk_* = API key. Anything else → 401. Capabilities are enforced.

import http from 'node:http'
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = Number(process.argv[process.argv.indexOf('--port') + 1]) || Number(process.env.MOCK_API_PORT) || 4010
const now = () => new Date().toISOString()
const iso = (s) => new Date(s).toISOString()

// ── principals ───────────────────────────────────────────────────────────
const ALL_CAPS = ['configure', 'approve', 'execute', 'kill', 'restore', 'view']
const READ_SCOPES = ['connectors:read', 'connections:read', 'runs:read', 'approvals:read', 'executions:read', 'receipts:read', 'receipts:verify', 'policies:read', 'events:read', 'environments:read', 'usage:read']
const PRINCIPALS = {
  coso_hermetic_operator_0000000001: { kind: 'human', principal_id: 'usr_mock_operator', capabilities: ALL_CAPS, scopes: [] },
  coso_hermetic_approver_0000000001: { kind: 'human', principal_id: 'usr_mock_approver', capabilities: ['approve', 'view', 'execute'], scopes: [] },
  coso_hermetic_viewer_00000000001: { kind: 'human', principal_id: 'usr_mock_viewer', capabilities: ['view'], scopes: [] },
  cosk_hermetic_readonly_0000000001: { kind: 'api_key', principal_id: 'key_mock_ci', capabilities: [], scopes: READ_SCOPES, key_prefix: 'cosk_hermetic_' },
}

// ── catalogue: core's registry, projected exactly like core's WIRED adapter ──
// (devex/api-server/src/adapters/registry-catalog.mjs `project()`), read from the
// committed core snapshot so the mock's catalogue IS core's catalogue.
const snap = (f) => JSON.parse(readFileSync(join(ROOT, 'core-snapshot', f), 'utf8'))
const coreCatalogue = snap('catalogue.json')
const eligibilityRecord = snap('dispatch-eligibility.json')
const connectors = coreCatalogue.rows.map((row) => {
  const e = Object.hasOwn(eligibilityRecord.connectors, row.connector_id) ? eligibilityRecord.connectors[row.connector_id] : null
  const staging = e?.staging === true, production = e?.production === true
  return {
    object: 'connector', connector_id: row.connector_id, name: row.name, pack: row.pack ?? null,
    engineering_rank: row.engineering_rank ?? null, generation: row.generation ?? null, disposition: row.disposition,
    availability: production ? 'dispatchable_production' : staging ? 'dispatchable_staging' : 'not_dispatchable',
    dispatch: { staging, production, reasons: e ? [...(e.reasons ?? [])] : ['no_eligibility_record'], production_reasons: e ? [...(e.production_reasons ?? [])] : [] },
    founder_holds: [...(row.founder_holds ?? [])],
  }
})
const C = (i) => connectors[i].connector_id
const t0 = Date.parse('2026-09-27T09:00:00Z')
const at = (min) => iso(t0 + min * 60_000)

const db = {
  connections: [
    { object: 'connection', connection_id: 'cn_mock_001', connector_id: C(0), label: 'Ops — primary', status: 'ACTIVE', health: 'healthy', credential_state: 'connected', credential_ref_present: true, routing: { environment: 'staging', target: 'simulator' }, last_tested_at: at(60), revoked_at: null, created_at: at(0) },
    { object: 'connection', connection_id: 'cn_mock_002', connector_id: C(1), label: 'Finance', status: 'TESTED', health: 'degraded', credential_state: 'degraded', credential_ref_present: true, routing: { environment: 'staging', target: 'simulator' }, last_tested_at: at(90), revoked_at: null, created_at: at(10) },
    { object: 'connection', connection_id: 'cn_mock_003', connector_id: C(2), label: null, status: 'CREATED', health: 'unknown', credential_state: 'pending', credential_ref_present: true, routing: { environment: 'staging', target: 'simulator' }, last_tested_at: null, revoked_at: null, created_at: at(20) },
  ],
  runs: [
    { object: 'run', run_id: 'run_mock_001', mode: 'mode_1', phase: 'authorise', status: 'awaiting_approval', objective: 'Reconcile payouts', trigger: { kind: 'operator', principal_id: 'usr_mock_operator' }, window: { not_before: at(0), not_after: at(600) }, connector_ids: [C(0)], plan_ids: ['plan_mock_001'], approval_ids: ['apr_mock_001'], execution_ids: [], opened_at: at(30), updated_at: at(45) },
    { object: 'run', run_id: 'run_mock_002', mode: 'mode_1', phase: 'verify', status: 'open', objective: 'Close stale orders', trigger: { kind: 'ops_event', principal_id: null }, window: { not_before: at(0), not_after: at(600) }, connector_ids: [C(1)], plan_ids: ['plan_mock_002'], approval_ids: ['apr_mock_002'], execution_ids: ['exe_mock_001', 'exe_mock_002'], opened_at: at(5), updated_at: at(80) },
    { object: 'run', run_id: 'run_mock_003', mode: 'mode_0', phase: 'close', status: 'closed', objective: 'Observe error rates', trigger: { kind: 'schedule', principal_id: null }, window: { not_before: at(0), not_after: at(60) }, connector_ids: [C(2)], plan_ids: [], approval_ids: [], execution_ids: [], opened_at: at(1), updated_at: at(60) },
  ],
  approvals: [
    { object: 'approval', approval_id: 'apr_mock_001', state: 'REQUESTED', oal_status: null, run_id: 'run_mock_001', plan_id: 'plan_mock_001', plan_revision: 1, steps: [{ step_id: 'step_mock_1', operation_class: 'write', execution_id: null, consumed_at: null, recorded_outcome: null }], requested_by: 'agent_ops', approved_by: null, decision_reason: null, policy_id: 'pol_mock_writes', requested_at: at(45), granted_at: null, expires_at: null },
    { object: 'approval', approval_id: 'apr_mock_002', state: 'CONSUMED', oal_status: 'CONSUMED', run_id: 'run_mock_002', plan_id: 'plan_mock_002', plan_revision: 1, steps: [{ step_id: 'step_mock_2', operation_class: 'write', execution_id: 'exe_mock_002', consumed_at: at(70), recorded_outcome: 'OUTCOME_UNKNOWN' }], requested_by: 'agent_orders', approved_by: { kind: 'human', principal_id: 'usr_mock_approver' }, decision_reason: 'Within policy', policy_id: 'pol_mock_writes', requested_at: at(50), granted_at: at(55), expires_at: at(115) },
    { object: 'approval', approval_id: 'apr_mock_003', state: 'GRANTED', oal_status: 'ISSUED', run_id: 'run_mock_002', plan_id: 'plan_mock_002', plan_revision: 1, steps: [{ step_id: 'step_mock_3', operation_class: 'write', execution_id: null, consumed_at: null, recorded_outcome: null }], requested_by: 'agent_orders', approved_by: { kind: 'human', principal_id: 'usr_mock_approver' }, decision_reason: 'ok', policy_id: 'pol_mock_writes', requested_at: at(52), granted_at: at(56), expires_at: at(9999) },
  ],
  executions: [
    { object: 'execution', execution_id: 'exe_mock_001', run_id: 'run_mock_002', plan_id: 'plan_mock_002', step_id: 'step_mock_0', approval_id: null, connection_id: 'cn_mock_002', connector_id: C(1), tool_id: `${C(1)}.orders.get`, operation_class: 'read', outcome: 'SUCCEEDED', settled: true, attempts: [{ attempt_n: 1, outcome: 'SUCCEEDED', provider_request_id: 'preq_1', provider_status: 200, recorded_at: at(65) }], reconciliation: { required: false, status: 'not_required' }, verification: { verdict: 'verified' }, receipt: { status: 'ISSUED', receipt_id: 'rcp_mock_001', verification: 'unverified_test_double', evidence_grade: 'test_double_not_evidence' }, created_at: at(64), updated_at: at(65) },
    { object: 'execution', execution_id: 'exe_mock_002', run_id: 'run_mock_002', plan_id: 'plan_mock_002', step_id: 'step_mock_2', approval_id: 'apr_mock_002', connection_id: 'cn_mock_002', connector_id: C(1), tool_id: `${C(1)}.orders.close`, operation_class: 'write', outcome: 'OUTCOME_UNKNOWN', settled: false, attempts: [{ attempt_n: 1, outcome: 'OUTCOME_UNKNOWN', error_class: 'timeout', recorded_at: at(71) }], reconciliation: { required: true, status: 'pending', strategy: null, reconciliation_ref: null }, verification: { verdict: 'inconclusive' }, receipt: { status: 'PENDING', receipt_id: null, verification: 'not_verified', evidence_grade: 'none' }, created_at: at(70), updated_at: at(71) },
  ],
  receipts: [
    { object: 'receipt', receipt_id: 'rcp_mock_001', status: 'ISSUED', execution_id: 'exe_mock_001', run_id: 'run_mock_002', attempt_n: 1, execution_outcome: 'SUCCEEDED', profile: 'cos-ops-v1', profile_version: '1.0.0', parent_receipt: null, seq: 1, issued_at: at(66), issuer_kind: 'test_double', document: null },
  ],
  policies: [
    { object: 'policy', policy_id: 'pol_mock_writes', name: 'Writes need a human', version: 'v1', status: 'active', rules: [{ operation_class: 'read', decision: 'allow' }, { operation_class: 'write', decision: 'require_approval' }, { operation_class: 'admin', decision: 'deny' }] },
  ],
  events: [
    { object: 'event', event_id: 'evt_mock_001', type: 'approval.requested', occurred_at: at(45), dedupe_key: 'apr_mock_001:requested', run_id: 'run_mock_001', data: { approval_id: 'apr_mock_001' } },
    { object: 'event', event_id: 'evt_mock_002', type: 'execution.state_changed', occurred_at: at(71), dedupe_key: 'exe_mock_002:OUTCOME_UNKNOWN', run_id: 'run_mock_002', data: { execution_id: 'exe_mock_002', outcome: 'OUTCOME_UNKNOWN' } },
    { object: 'event', event_id: 'evt_mock_003', type: 'receipt.issued', occurred_at: at(66), dedupe_key: 'rcp_mock_001', run_id: 'run_mock_002', data: { receipt_id: 'rcp_mock_001' } },
  ],
  killOrders: [],
}
const idempotency = new Map()

// ── helpers ──────────────────────────────────────────────────────────────
const reqId = () => `req_${randomUUID().replaceAll('-', '').slice(0, 20)}`
function send(res, status, body, extra = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'DCS-API-Version': '1.0.0', 'DCS-Adapter': 'mock', ...extra })
  res.end(body === undefined ? '' : JSON.stringify(body))
}
const fail = (res, status, code, message, retriable = false, detail) => send(res, status, { error: { code, message, retriable, request_id: res.requestId, ...(detail ? { detail } : {}) } })
function page(res, rows, q) {
  const limit = Math.min(Math.max(Number(q.get('limit')) || 50, 1), 200)
  const offset = q.get('cursor') ? Number(Buffer.from(q.get('cursor'), 'base64url').toString()) || 0 : 0
  const data = rows.slice(offset, offset + limit)
  const more = offset + limit < rows.length
  send(res, 200, { object: 'list', data, has_more: more, next_cursor: more ? Buffer.from(String(offset + limit)).toString('base64url') : null })
}
const SECRET_KEYS = /^(secret|password|api_key|apikey|token|access_token|refresh_token|client_secret|private_key)$/i
const hasSecret = (o) => o && typeof o === 'object' && Object.entries(o).some(([k, v]) => SECRET_KEYS.test(k) || hasSecret(v))
const find = (list, key, id) => list.find((x) => x[key] === id)

// ── server ───────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  res.requestId = reqId()
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Idempotency-Key, X-Correlation-Id')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Expose-Headers', 'X-Request-Id, X-Correlation-Id, Idempotent-Replayed, Retry-After')
  res.setHeader('X-Request-Id', res.requestId)
  if (req.headers['x-correlation-id']) res.setHeader('X-Correlation-Id', req.headers['x-correlation-id'])
  if (req.method === 'OPTIONS') return send(res, 204)

  const url = new URL(req.url, `http://${req.headers.host}`)
  const p = url.pathname, q = url.searchParams
  if (p === '/healthz') return send(res, 200, { ok: true })
  // contact-form endpoint stand-in (VITE_CONTACT_ENDPOINT in mock builds); no auth
  if (p === '/forms/contact' && req.method === 'POST') {
    const raw = await new Promise((r) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => r(b)) })
    let f; try { f = JSON.parse(raw) } catch { return fail(res, 400, 'invalid_request', 'Body is not JSON.') }
    if (!f.name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email ?? '') || !f.topic || (f.message ?? '').length < 20) return fail(res, 400, 'invalid_request', 'Missing or invalid fields.')
    return send(res, 201, { ok: true, id: `msg_${randomUUID().slice(0, 8)}` })
  }

  const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '')
  const me = PRINCIPALS[token]
  if (!me) return fail(res, 401, 'unauthenticated', 'Missing or unknown credential.')
  const canRead = (scope) => me.kind === 'human' ? me.capabilities.includes('view') : me.scopes.includes(scope)
  const needCap = (cap) => {
    if (me.kind !== 'human') { fail(res, 403, 'human_required', 'A human operator is required.'); return false }
    if (!me.capabilities.includes(cap)) { fail(res, 403, 'permission_denied', `Requires capability "${cap}".`, false, { capability: cap }); return false }
    return true
  }

  let body
  if (req.method === 'POST') {
    const raw = await new Promise((r) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => r(b)) })
    try { body = raw ? JSON.parse(raw) : {} } catch { return fail(res, 400, 'invalid_request', 'Body is not JSON.') }
    if (hasSecret(body)) return fail(res, 400, 'secret_in_request', 'Secret-shaped fields are refused; send a vault credential reference.')
    const readOnlyPost = /^\/v1\/receipts\/[^/]+\/verify$/.test(p) || p === '/v1/policies/evaluate'
    const key = req.headers['idempotency-key']
    if (!readOnlyPost) {
      if (!key) return fail(res, 400, 'idempotency_key_required', 'Mutating POST requires Idempotency-Key.')
      const prior = idempotency.get(key)
      if (prior) {
        if (prior.fingerprint !== p + raw) return fail(res, 422, 'idempotency_key_reuse', 'Idempotency-Key reused with a different request.')
        return send(res, prior.status, prior.body, { 'Idempotent-Replayed': 'true' })
      }
      const realSend = send
      res.remember = (status, b) => { if (status < 300) idempotency.set(key, { fingerprint: p + raw, status, body: b }); realSend(res, status, b) }
    }
  }
  const ok = (status, b) => (res.remember ? res.remember(status, b) : send(res, status, b))
  let m

  // ── reads ──
  if (req.method === 'GET') {
    if (p === '/v1/me') return send(res, 200, { object: 'principal', tenant_id: 'tnt_mock', environment: 'hermetic', key_prefix: me.key_prefix, ...me })
    if (p === '/v1/connectors') {
      if (!canRead('connectors:read')) return fail(res, 403, 'permission_denied', 'connectors:read required', false, { scope: 'connectors:read' })
      const s = (q.get('q') ?? '').toLowerCase(); const d = q.get('disposition')
      return page(res, connectors.filter((c) => (!s || c.connector_id.includes(s) || c.name.toLowerCase().includes(s)) && (!d || c.disposition === d)), q)
    }
    if ((m = p.match(/^\/v1\/connectors\/([^/]+)$/))) return find(connectors, 'connector_id', m[1]) ? send(res, 200, find(connectors, 'connector_id', m[1])) : fail(res, 404, 'not_found', 'No such connector.')
    const lists = {
      '/v1/connections': ['connections', 'connections:read', (x) => (!q.get('connector_id') || x.connector_id === q.get('connector_id')) && (!q.get('status') || x.status === q.get('status'))],
      '/v1/runs': ['runs', 'runs:read', (x) => !q.get('status') || x.status === q.get('status')],
      '/v1/approvals': ['approvals', 'approvals:read', (x) => (!q.get('state') || x.state === q.get('state')) && (!q.get('run_id') || x.run_id === q.get('run_id'))],
      '/v1/executions': ['executions', 'executions:read', (x) => (!q.get('run_id') || x.run_id === q.get('run_id')) && (!q.get('outcome') || x.outcome === q.get('outcome'))],
      '/v1/receipts': ['receipts', 'receipts:read', (x) => (!q.get('execution_id') || x.execution_id === q.get('execution_id')) && (!q.get('status') || x.status === q.get('status'))],
      '/v1/policies': ['policies', 'policies:read', () => true],
      '/v1/events': ['events', 'events:read', (x) => !q.get('type') || x.type === q.get('type')],
    }
    if (lists[p]) {
      const [k, scope, f] = lists[p]
      if (!canRead(scope)) return fail(res, 403, 'permission_denied', `${scope} required`, false, { scope })
      return page(res, db[k].filter(f), q)
    }
    const singles = [[/^\/v1\/connections\/([^/]+)$/, 'connections', 'connection_id'], [/^\/v1\/runs\/([^/]+)$/, 'runs', 'run_id'], [/^\/v1\/approvals\/([^/]+)$/, 'approvals', 'approval_id'], [/^\/v1\/executions\/([^/]+)$/, 'executions', 'execution_id'], [/^\/v1\/receipts\/([^/]+)$/, 'receipts', 'receipt_id'], [/^\/v1\/policies\/([^/]+)$/, 'policies', 'policy_id'], [/^\/v1\/events\/([^/]+)$/, 'events', 'event_id']]
    for (const [re, k, key] of singles) if ((m = p.match(re))) { const x = find(db[k], key, m[1]); return x ? send(res, 200, x) : fail(res, 404, 'not_found', 'Not found in this tenant.') }
    if (p === '/v1/environments') {
      const sum = eligibilityRecord.summary
      return page(res, ['staging', 'production'].map((name) => ({ object: 'environment', name, dispatchable_connectors: name === 'staging' ? sum.dispatchable_staging : sum.dispatchable_production, dispatchable_tools: name === 'staging' ? sum.tools_dispatchable_staging : 0, catalogued_connectors: connectors.length, mode_ceiling: 'mode_1', notes: [`From core dispatch-eligibility (${eligibilityRecord.schema}).`] })), q)
    }
    if (p === '/v1/usage') return send(res, 200, { object: 'usage', window: q.get('window') ?? '24h', executions: { total: db.executions.length, by_outcome: db.executions.reduce((a, e) => ({ ...a, [e.outcome]: (a[e.outcome] ?? 0) + 1 }), {}) }, receipts: { ISSUED: db.receipts.filter((r) => r.status === 'ISSUED').length, PENDING: db.executions.filter((e) => e.receipt.status === 'PENDING').length, FAILED: 0 }, by_connector: [], cost_note: 'Mock server: no cost data.' })
    if (p === '/v1/operator/kill-orders') return needCap('view') && page(res, db.killOrders, q)
    if (p === '/v1/operator/reconciliations') return needCap('view') && page(res, db.executions.filter((e) => e.outcome === 'OUTCOME_UNKNOWN'), q)
    if (p === '/v1/operator/eligibility') return needCap('view') && send(res, 200, { object: 'eligibility_report', schema: eligibilityRecord.schema, summary: { ...eligibilityRecord.summary }, check: q.get('connector_id') ? (() => { const c = find(connectors, 'connector_id', q.get('connector_id')); const env = q.get('environment') ?? 'staging'; return { connector_id: q.get('connector_id'), environment: env, dispatchable: Boolean(c?.dispatch[env]), reasons: c ? c.dispatch.reasons : ['no_eligibility_record'] } })() : null })
    if (p === '/v1/operator/provider-health') return needCap('view') && page(res, [...new Set(db.connections.map((c) => c.connector_id))].map((id) => ({ connector_id: id, connections: db.connections.filter((c) => c.connector_id === id).length, health: db.connections.filter((c) => c.connector_id === id).reduce((a, c) => ({ ...a, [c.health]: (a[c.health] ?? 0) + 1 }), {}), probe: 'hermetic_rollup' })), q)
    if (p.startsWith('/v1/webhooks') || p.startsWith('/v1/operator/audit-exports')) return fail(res, 501, 'not_implemented', 'CONTRACT_ONLY operation.')
    return fail(res, 404, 'not_found', 'No such route.')
  }

  // ── writes ──
  if (req.method === 'POST') {
    if (p === '/v1/connections') {
      if (me.kind === 'human') { if (!needCap('configure')) return }
      else if (!me.scopes.includes('connections:write')) return fail(res, 403, 'permission_denied', 'connections:write required', false, { scope: 'connections:write' })
      if (!body.connector_id || !find(connectors, 'connector_id', body.connector_id)) return fail(res, 400, 'invalid_request', 'Unknown connector_id.', false, { field: 'connector_id' })
      if (!/^cref_[0-9a-f-]{8,}$/.test(body.credential_ref ?? '')) return fail(res, 400, 'invalid_request', 'credential_ref must be a vault reference (cref_…).', false, { field: 'credential_ref' })
      const c = { object: 'connection', connection_id: `cn_${randomUUID().slice(0, 8)}`, connector_id: body.connector_id, label: body.label ?? null, status: 'CREATED', health: 'unknown', credential_state: 'pending', credential_ref_present: true, routing: body.routing ?? {}, last_tested_at: null, revoked_at: null, created_at: now() }
      db.connections.unshift(c); return ok(201, c)
    }
    if ((m = p.match(/^\/v1\/connections\/([^/]+)\/(test|activate)$/))) {
      if (!needCap('configure')) return
      const c = find(db.connections, 'connection_id', m[1]); if (!c) return fail(res, 404, 'not_found', 'Not found in this tenant.')
      if (c.status === 'REVOKED') return fail(res, 409, 'illegal_transition', 'Connection is revoked.', false, { from: c.status })
      if (m[2] === 'test') { Object.assign(c, { status: c.status === 'CREATED' ? 'TESTED' : c.status, health: 'healthy', credential_state: 'connected', last_tested_at: now() }); return ok(200, { object: 'connection_test', connection_id: c.connection_id, ok: true, status: c.status, health: c.health, target: 'simulator', error_class: null, tested_at: c.last_tested_at }) }
      if (c.status !== 'TESTED') return fail(res, 409, 'illegal_transition', 'Only a TESTED connection can be activated.', false, { from: c.status, to: 'ACTIVE' })
      c.status = 'ACTIVE'; return ok(200, c)
    }
    if ((m = p.match(/^\/v1\/approvals\/([^/]+)\/(grant|deny|revoke)$/))) {
      if (!needCap('approve')) return
      const a = find(db.approvals, 'approval_id', m[1]); if (!a) return fail(res, 404, 'not_found', 'Not found in this tenant.')
      if (m[2] !== 'grant' && !body.reason) return fail(res, 400, 'invalid_request', 'reason is required.', false, { field: 'reason' })
      if (m[2] === 'grant' || m[2] === 'deny') {
        if (a.state !== 'REQUESTED') return fail(res, 409, 'approval_not_grantable', `Approval is ${a.state}, not REQUESTED.`)
        Object.assign(a, m[2] === 'grant'
          ? { state: 'GRANTED', oal_status: 'ISSUED', approved_by: { kind: 'human', principal_id: me.principal_id }, decision_reason: body.note ?? null, granted_at: now(), expires_at: iso(Date.now() + (body.ttl_seconds ?? 3600) * 1000) }
          : { state: 'DENIED', decision_reason: body.reason, approved_by: { kind: 'human', principal_id: me.principal_id } })
      } else {
        if (a.state !== 'GRANTED') return fail(res, 409, 'illegal_transition', `Only a GRANTED approval can be revoked (is ${a.state}).`, false, { from: a.state, to: 'REVOKED' })
        Object.assign(a, { state: 'REVOKED', oal_status: 'REVOKED', decision_reason: body.reason })
      }
      db.events.unshift({ object: 'event', event_id: `evt_${randomUUID().slice(0, 8)}`, type: `approval.${m[2] === 'grant' ? 'granted' : m[2] === 'deny' ? 'denied' : 'revoked'}`, occurred_at: now(), dedupe_key: `${a.approval_id}:${a.state}`, run_id: a.run_id, data: { approval_id: a.approval_id, actor: me.principal_id } })
      return ok(200, a)
    }
    if ((m = p.match(/^\/v1\/operator\/executions\/([^/]+)\/reconcile$/))) {
      if (!needCap('execute')) return
      const e = find(db.executions, 'execution_id', m[1]); if (!e) return fail(res, 404, 'not_found', 'Not found in this tenant.')
      if (e.outcome !== 'OUTCOME_UNKNOWN') return fail(res, 409, 'illegal_transition', 'Only OUTCOME_UNKNOWN can be reconciled.', false, { from: e.outcome })
      if (!['SUCCEEDED', 'FAILED'].includes(body.outcome) || !body.evidence?.note) return fail(res, 400, 'invalid_request', 'outcome (SUCCEEDED|FAILED) and evidence.note are required.')
      Object.assign(e, { outcome: body.outcome, settled: true, reconciliation: { required: true, status: 'reconciled', strategy: body.evidence.method, reconciliation_ref: `rec_${randomUUID().slice(0, 8)}` }, updated_at: now() })
      return ok(200, e)
    }
    if ((m = p.match(/^\/v1\/receipts\/([^/]+)\/verify$/))) {
      const r = find(db.receipts, 'receipt_id', m[1]); if (!r) return fail(res, 404, 'not_found', 'Not found in this tenant.')
      return send(res, 200, { object: 'receipt_verification', receipt_id: r.receipt_id, verification: 'unverified_test_double', verifier_kind: 'test_double', code: 'TEST_DOUBLE', execution_outcome_matches: true, profile_status: 'ok', evidence_grade: 'test_double_not_evidence', checked_at: now() })
    }
    if (p === '/v1/policies/evaluate') {
      const pol = db.policies[0]; const rule = pol.rules.find((r) => r.operation_class === body.operation_class)
      return send(res, 200, { object: 'policy_decision', decision: rule?.decision ?? 'deny', policy_id: pol.policy_id, decision_id: null, reasons: [rule ? `rule:${rule.operation_class}` : 'no_rule'], dispatch_eligible: false })
    }
    if (p === '/v1/operator/kill-orders') {
      if (!needCap('kill')) return
      if (!body.scope || !body.target || !body.reason || !body.reviewer) return fail(res, 400, 'invalid_request', 'scope, target, reason and reviewer are required.')
      const k = { object: 'kill_order', kill_order_id: `kill_${randomUUID().slice(0, 8)}`, scope: body.scope, target: body.target, state: 'active', writes_only: false, reason: body.reason, reviewer: body.reviewer, initiated_by: me.principal_id, activated_at: now(), restored_at: null, restore_reason: null }
      db.killOrders.unshift(k); return ok(201, k)
    }
    if ((m = p.match(/^\/v1\/operator\/kill-orders\/([^/]+)\/restore$/))) {
      if (!needCap('restore')) return
      const k = find(db.killOrders, 'kill_order_id', m[1]); if (!k) return fail(res, 404, 'not_found', 'Not found in this tenant.')
      if (k.state !== 'active') return fail(res, 409, 'illegal_transition', 'Kill order is not active.')
      Object.assign(k, { state: 'restored', restored_at: now(), restore_reason: body.reason }); return ok(200, k)
    }
    if ((m = p.match(/^\/v1\/operator\/connections\/([^/]+)\/revoke$/))) {
      if (!needCap('kill')) return
      const c = find(db.connections, 'connection_id', m[1]); if (!c) return fail(res, 404, 'not_found', 'Not found in this tenant.')
      if (c.status === 'REVOKED') return fail(res, 409, 'illegal_transition', 'Already revoked.')
      Object.assign(c, { status: 'REVOKED', health: 'revoked', credential_state: 'revoked', revoked_at: now() }); return ok(200, c)
    }
    if (p.startsWith('/v1/webhooks') || p.startsWith('/v1/operator/audit-exports')) return fail(res, 501, 'not_implemented', 'CONTRACT_ONLY operation.')
    if (p === '/v1/runs' || p === '/v1/approvals' || p === '/v1/executions' || /\/plans$/.test(p)) return fail(res, 501, 'not_implemented', 'Not implemented by the mock.')
  }
  return fail(res, 404, 'not_found', 'No such route.')
})

server.listen(PORT, '127.0.0.1', () => console.log(`mock Connector OS API on http://127.0.0.1:${PORT} (${connectors.length} connectors)`))
