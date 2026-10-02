// Content config for all product-area subpages.
// Wording is conservative by design: no certifications, no absolute claims,
// no invented endpoints or metrics. Terminology follows the Connector OS
// architecture (Runtime E, OAL, Ops Broker, Execution Engine, R-Series, EXEC-FACTS).
// Claim ceiling: CODED · TESTED · INTEGRATED · HERMETICALLY PROVEN.

export type Section = {
  h: string
  p?: string[]
  ul?: string[]
  flow?: string[]
  code?: string
  note?: string
  diagram?: 'architecture' | 'lifecycle' | 'approval-sm' | 'execution-sm' | 'retry-flow' | 'evidence-path' | 'connection-lifecycle' | 'org-model' | 'tenant-boundary' | 'credential-flow' | 'webhook-pipeline' | 'rseries-flow'
  table?: { head: string[]; rows: string[][] }
}

export type SubPage = {
  area: string
  title: string
  tagline: string
  sections: Section[]
  next?: [string, string][]  // per-page "Next" links (spec §10)
  noStatus?: boolean
  badge?: 'CURRENT' | 'PRE-LAUNCH' | 'PLANNED'  // developer-surface maturity label (spec §4)
}

export const AREA_ROUTES: Record<string, string> = {
  Product: '/product',
  Agents: '/agents',
  Security: '/security',
  Enterprise: '/enterprise',
  Developers: '/developers',
  Company: '/about',
  Legal: '/privacy',
}

export const AREA_LINKS: Record<string, [string, string][]> = {
  Product: [
    ['/product', 'Overview'],
    ['/product/how-it-works', 'How it works'],
    ['/product/execution-layer', 'Execution Layer'],
    ['/product/policies-approvals', 'Policies & Approvals'],
    ['/product/receipts-audit', 'Receipts & Audit'],
    ['/product/reliability-recovery', 'Reliability & Recovery'],
    ['/product/architecture', 'Architecture'],
  ],
  Agents: [
    ['/agents', 'Overview'],
    ['/agents/lifecycle', 'Lifecycle'],
    ['/agents/governance', 'Governance'],
    ['/agents/policies', 'Policies'],
    ['/agents/approvals', 'Approvals'],
    ['/agents/executions', 'Executions'],
    ['/agents/recovery', 'Recovery'],
    ['/agents/use-cases', 'Use cases'],
  ],
  Security: [
    ['/security', 'Overview'],
    ['/security/credential-isolation', 'Credential isolation'],
    ['/security/approval-gated-actions', 'Approval-gated actions'],
    ['/security/tenant-boundaries', 'Tenant boundaries'],
    ['/security/routing-egress', 'Routing & egress'],
    ['/security/blast-radius', 'Blast-radius controls'],
    ['/security/retry-reconciliation', 'Retry & reconciliation'],
    ['/security/kill-controls', 'Kill controls'],
    ['/security/webhook-security', 'Webhook security'],
    ['/security/redaction', 'Redaction'],
    ['/security/audit-history', 'Audit history'],
    ['/security/receipts-verification', 'Receipts & verification'],
    ['/security/failure-behavior', 'Failure behavior'],
  ],
  Enterprise: [
    ['/enterprise', 'Overview'],
    ['/enterprise/organizations', 'Organizations'],
    ['/enterprise/workspaces', 'Workspaces'],
    ['/enterprise/roles-permissions', 'Roles & permissions'],
    ['/enterprise/approval-workflows', 'Approval workflows'],
    ['/enterprise/environments', 'Environments'],
    ['/enterprise/audit-governance', 'Audit & governance'],
    ['/enterprise/controls', 'Enterprise controls'],
    ['/enterprise/contact', 'Contact'],
  ],
  Developers: [
    ['/developers', 'Overview'],
    ['/developers/quickstart', 'Quickstart'],
    ['/developers/authentication', 'Authentication'],
    ['/developers/api', 'API Reference'],
    ['/developers/connectors', 'Connectors'],
    ['/developers/sdk', 'SDKs'],
    ['/developers/mcp', 'MCP'],
    ['/developers/webhooks', 'Webhooks'],
    ['/developers/policies', 'Policies'],
    ['/developers/executions', 'Executions'],
    ['/developers/receipts', 'Receipts'],
    ['/developers/cli', 'CLI'],
    ['/developers/errors', 'Errors'],
    ['/developers/changelog', 'Changelog'],
    ['/developers/status', 'Build status'],
  ],
  Company: [
    ['/about', 'About'],
    ['/contact', 'Contact'],
  ],
  Legal: [
    ['/privacy', 'Privacy'],
    ['/terms', 'Terms'],
  ],
}

export const SUBPAGES: Record<string, SubPage> = {

  // ==================== PRODUCT (canonical deep pages, spec §3) ====================

  '/product/how-it-works': {
    area: 'Product',
    title: 'How Connector OS works',
    tagline: 'One governed path from intent to evidence — every stage has an owner, produces a fact, and can refuse.',
    next: [['/product/execution-layer', 'The Execution Layer'], ['/product/receipts-audit', 'Receipts & Audit']],
    sections: [
      {
        h: 'Two lifecycles, one path',
        p: [
          'Two different lifecycles are easy to confuse, and earlier versions of this page did. The connection lifecycle governs a provider account: connect → test → active → suspend → revoke. The OAL run lifecycle governs one agent run: the ten stages from Observe to Close, documented on the agents pages. They meet — but they are not the same list.',
          'This page is the canonical product path: the single governed route a step travels from agent intent to a verifiable receipt. Every stage below names its owner — the component responsible — and the fact it produces for the evidence trail.',
        ],
        diagram: 'architecture',
      },
      {
        h: 'Connect and bind',
        p: [
          'A connection binds a provider account to your tenant. At authorize time the scopes are recorded, a credential reference is stored (never the secret itself), and the connection is bound to a routing context: tenant, connection, host, region, environment. Owner: Runtime E — the connection and operator runtime. Fact produced: the connection\u2019s declared context, against which every later dispatch is checked.',
        ],
        diagram: 'connection-lifecycle',
      },
      {
        h: 'Discover',
        p: [
          'What an agent may see is resolved just-in-time: the JIT registry computes the intersection of the connection\u2019s discovered capabilities and the applicable policy, per session. The tool list an agent reasons over is therefore already governed — it reflects what this agent, in this tenant, in this mode, may actually use right now. Owner: OAL. Fact: the declared capability set the plan is allowed to reference.',
        ],
      },
      {
        h: 'Plan and evaluate',
        p: [
          'The agent declares a plan: exact steps, each naming a discovered tool, an operation class and parameters. The plan is hashed — the hash becomes the anchor for everything downstream. Policy evaluates the plan and returns a decision object: ALLOW, APPROVAL_REQUIRED (with class), or REFUSE with reason codes. Owner: OAL / Policy. Facts: plan hash, policy decision, policy version.',
        ],
      },
      {
        h: 'Approve',
        p: [
          'Steps above the policy threshold pause for a human. The approver sees the plan hash, the exact step, the connector version and the routing context. A granted approval is an object with fields — plan hash, step ids, tenant, run, approver, policy version, validity window, nonce — bound so tightly that plan changes supersede it and reuse is impossible. Owner: the human approver, recorded by the approval service. Fact: the approval object and its state transitions.',
        ],
      },
      {
        h: 'Execute',
        p: [
          'Approved steps route through the Ops Broker — the sole caller of the Execution Engine; nothing else imports the engine — and dispatch with their routing context and a consumed-once approval. One authorised step is one execution; retries are numbered attempts, each emitting its own fact. Owner: Ops Broker → Execution Engine. Facts: dispatch record, attempt facts.',
        ],
      },
      {
        h: 'Verify and reconcile',
        p: [
          'After execution, outcomes are checked against provider state where the provider surface allows it — "the provider accepted the call" and "the intended effect occurred" are tracked separately. Ambiguous writes enter OUTCOME_UNKNOWN and are reconciled before any retry decision. Owner: Execution Engine / verification. Facts: outcome, verification status, reconciliation result.',
        ],
      },
      {
        h: 'Evidence',
        p: [
          'Every execution fact flows to the Evidence Client and R-Series, which issues exactly one cos-ops receipt per fact. Execution outcome and receipt state are separate fields — a failed execution still receives a receipt, and a missing receipt is itself visible. The receipts of a run link into one causal chain: plan → approval → attempt → verification → recovery. Owner: R-Series. Fact: the receipt itself — signed, sequenced, verifiable.',
        ],
      },
      {
        h: 'Stage owners and facts',
        table: {
          head: ['Stage', 'Owner', 'Fact produced', 'Receipt type'],
          rows: [
            ['Connect / bind', 'Runtime E', 'Connection context, scopes', 'connection event'],
            ['Discover', 'OAL', 'Declared capability set', '— (session-scoped)'],
            ['Plan / evaluate', 'OAL / Policy', 'Plan hash, decision object', 'policy decision'],
            ['Approve', 'Human approver', 'Approval object + state', 'approval receipt'],
            ['Execute', 'Ops Broker → Engine', 'Dispatch + attempt facts', 'EXEC-FACT → cos-ops receipt'],
            ['Verify / reconcile', 'Engine / verification', 'Outcome, verification, reconciliation', 'verification sub-event'],
            ['Evidence', 'R-Series', 'Signed, sequenced receipt', 'cos-ops receipt'],
          ],
        },
        note: 'Hermetically proven on the integrated build against simulated providers; real-provider staging is the next gate. Status of every capability is published on the Build status page.',
      },
    ],
  },

  '/product/execution-layer': {
    area: 'Product',
    title: 'The Execution Layer',
    tagline: 'The only component that touches a provider — and everything it refuses to do.',
    next: [['/product/reliability-recovery', 'Reliability & Recovery'], ['/developers/executions', 'Executions (developer reference)']],
    sections: [
      {
        h: 'Position in the system',
        p: [
          'The path to a provider is Ops Broker → Execution Engine → transport. The invariant that matters: the Ops Broker is the sole caller of the engine, and nothing in the reasoning layer, the API surface or your application code imports it. There is exactly one door, and it is guarded by everything upstream — tenant checks, kill state, policy, approval.',
          'This is what makes governance structural rather than advisory: an agent cannot route around the engine because there is no second route.',
        ],
      },
      {
        h: 'Executions and attempts',
        p: [
          'One execution is one authorised step. Within it, attempts are numbered: the first try, a bounded retry, each recorded separately. Every attempt emits its own execution fact — the evidence trail shows the attempt history, not just the final outcome.',
        ],
      },
      {
        h: 'Operation classes and side effects',
        p: ['Every capability is classified on two axes before it can run. The operation class drives policy strictness; the side-effect class (from the operational contract) drives retry and verification behavior.'],
        table: {
          head: ['Operation class', 'Meaning', 'Side-effect classes (Manifest 1.3)'],
          rows: [
            ['Read', 'Fetch provider state', 'none · provider_state'],
            ['Write', 'Create or update resources', 'provider_state · external_notification'],
            ['Destructive', 'Delete or irreversibly alter', 'data_destructive'],
            ['Admin', 'Change configuration or access', 'identity_or_access'],
            ['Money-moving', 'Transfers, payouts, charges, refunds', 'money_moving'],
          ],
        },
      },
      {
        h: 'Routing context',
        p: [
          'Each dispatch carries its routing context: tenant, connection, host, region, account/portal and environment. The credential lease is bound to that context; a mismatch — wrong tenant, off-list host, wrong environment — resolves to BLOCKED before the provider is contacted. Context is checked at dispatch, not assumed from session state.',
        ],
      },
      {
        h: 'The operational contract (Manifest 1.3)',
        p: ['Every capability declares its behavior contract. The engine enforces what is declared and refuses what is not — an unknown capability fails closed, never open.'],
        ul: [
          'Retry safety — whether a retry can ever be safe, and under what semantics',
          'Idempotency semantics — provider keys, natural keys, or none (and none means no blind retry)',
          'Verification method — how the effect is confirmed against provider state',
          'Compensating action — the declared undo, where one exists',
          'Secret-returning read flag — outputs are digest-only by contract',
          'PII class — the data classification applied to evidence',
        ],
      },
      {
        h: 'The outcome model',
        p: ['Outcomes are a closed enum — ten states, no silent others. Attempt-level outcomes below; RECOVERED, HUMAN_INTERVENTION and KILL_SWITCH exist as run-level states.'],
        diagram: 'execution-sm',
        table: {
          head: ['Outcome', 'Meaning', 'Next'],
          rows: [
            ['REFUSED', 'Policy refused before execution', 'change the plan; do not retry'],
            ['BLOCKED', 'Kill, suspension or revocation stopped it', 'resolve the block; evidence recorded'],
            ['STARTED', 'Attempt dispatched', 'awaits outcome'],
            ['SUCCEEDED', 'Effect confirmed or accepted per contract', 'receipt issues'],
            ['FAILED', 'Attempt failed; classified cause attached', 'bounded retry or terminal'],
            ['PROVIDER_UNAVAILABLE', 'Provider unreachable/down', 'declared, monitored, recovered'],
            ['OUTCOME_UNKNOWN', 'Possible write unconfirmed', 'reconcile before anything else'],
            ['RETRY_SCHEDULED', 'Bounded retry queued', 'dispatch at schedule'],
            ['RETRY_EXHAUSTED', 'Retry limits reached', 'escalation opens'],
            ['RECOVERED / HUMAN_INTERVENTION / KILL_SWITCH', 'Run-level states', 'receipted like everything else'],
          ],
        },
      },
      {
        h: 'Provider realities',
        p: [
          'Real providers are messier than their documentation: 2xx envelopes wrapping error bodies, 403s that mean rate limiting, 404s that mean "deleted" or "never existed" depending on the endpoint, per-IP limits that differ from per-token limits. The operational contract captures these per capability rather than treating HTTP status as truth.',
          'One rule sits above all provider nuance: paid reads are never auto-retried. Whatever the error looks like, an operation that costs money per call waits for a decision, not a loop.',
        ],
      },
      {
        h: 'Execution facts',
        p: ['Every attempt emits an EXEC-FACT (shape frozen at v1.0.0):'],
        code: '// Conceptual EXEC-FACT — frozen shape v1.0.0\n{\n  "fact_id": "ef_01J9…",\n  "run_id": "run_7c2…",\n  "tenant": "tnt_acme",\n  "connection": "conn_github_prod",\n  "step": { "plan_hash": "sha256:9f2…", "step_id": 3, "tool": "issues.create" },\n  "policy": { "decision": "ALLOW", "version": "pol_v14" },\n  "approval": null,\n  "attempt": { "n": 1, "started": "…", "duration_ms": 841 },\n  "outcome": "SUCCEEDED",\n  "verification": { "method": "provider_readback", "status": "effect_confirmed" },\n  "redaction": { "profile": "red_v3" }\n}',
      },
      {
        h: 'What the execution layer never does',
        ul: [
          'Hold plans — plans arrive authorised; the engine does not keep or amend them',
          'Decide policy — decisions arrive from the policy evaluation; the engine enforces, not judges',
          'Mint approvals — approvals come from humans via the approval service',
          'Sign receipts — evidence cryptography belongs to R-Series alone',
        ],
        note: 'Controlled egress: provider calls leave through restricted routing only. There is no direct agent-to-provider network path.',
      },
    ],
  },

  '/product/policies-approvals': {
    area: 'Product',
    title: 'Policies & Approvals',
    tagline: 'Declarative rules decide; people approve exact steps; kill controls outrank both.',
    next: [['/agents/approvals', 'Human approvals (agent view)'], ['/security/approval-gated-actions', 'Approval-gated actions (security view)']],
    sections: [
      {
        h: 'Policy inputs and decisions',
        p: [
          'A policy decision is a function of declared inputs: tenant, workspace, environment, connection, connector version, operation class, side-effect class, parameters and mode. Nothing ambient — no time-of-day guesses, no model vibes — enters the decision.',
          'Decisions come in three shapes with machine-readable reason codes: ALLOW, APPROVAL_REQUIRED (with the approval class named), and REFUSE. Policies are versioned; every decision records the policy version that produced it, so yesterday\u2019s decision remains explainable after today\u2019s edit.',
        ],
      },
      {
        h: 'Evaluation timing',
        p: ['Policy is evaluated twice by design: at plan time, so the agent and the approver see the decision before anything moves; and re-checked at dispatch, because the world — kill state, revocation, policy edits — may have changed between the two. A plan that passed an hour ago passes again or does not run.'],
      },
      {
        h: 'The approval object',
        p: ['An approval is data, not a vibe. Its fields make it un-forgeable and un-widenable:'],
        code: '// Conceptual approval object\n{\n  "approval_id": "apv_4d1…",\n  "plan_hash": "sha256:9f2…",\n  "step_ids": [3],\n  "tenant": "tnt_acme",\n  "run_id": "run_7c2…",\n  "approver": "user_129",\n  "policy_version": "pol_v14",\n  "issued_at": "…", "expires_at": "…",\n  "nonce": "n_8xq…",\n  "consumed_by": null\n}',
      },
      {
        h: 'The approval state machine',
        p: ['Every approval lives in exactly one state, and every transition is receipted:'],
        diagram: 'approval-sm',
      },
      {
        h: 'Approval classes and precedence',
        p: ['Approval classes scale with risk: auto (policy-sufficient), pre-approved policy (standing approval for narrow cases), human, dual-human, and forbidden (no approval can permit). Defaults follow the operation class — destructive, admin and money-moving always require human approval in v1.'],
        table: {
          head: ['Precedence', 'Control', 'Wins over'],
          rows: [
            ['1 (highest)', 'Kill', 'everything — including valid approvals'],
            ['2', 'Revoke (connection / lease)', 'approvals, schedules, retries'],
            ['3', 'Approval', 'policy ALLOW for gated steps'],
            ['4', 'Policy allow', 'nothing below it — refusal needs no permit'],
          ],
        },
      },
      {
        h: 'Fail-closed cases',
        p: ['The approval path fails closed in both directions: if validity cannot be confirmed at dispatch, the step does not run; if the plan changed since approval, the approval is SUPERSEDED and the step waits again. "Mostly matches" is not a state that exists.'],
      },
      {
        h: 'Consumption and crash semantics',
        p: ['An approval is consumed atomically with the dispatch marker — one operation, exactly once. If the process crashes between consumption and the provider call, the consumption stands and the evidence shows it; there is no window where a crash yields a second use. This is proven in the integrated test suite.'],
      },
      {
        h: 'Modes',
        p: [
          'MODE 1 is the launch mode: observe, correlate, diagnose, recommend — no writes. MODE 2, approval-gated writes, is the v1 ceiling: writes exist only inside approval gates. MODE 3/4 (broader autonomy) are later and are not promised on this site.',
          'Precedence footnote: nothing in this page outranks kill. "Stop" is checked at every dispatch — at the next dispatch check, to be precise, since in-flight provider calls complete and are recorded rather than recalled.',
        ],
      },
      {
        h: 'How policy and approval compose',
        p: [
          'Policy answers "may this class of thing happen here"; approval answers "may this exact step happen now". A step needs both: policy ALLOW alone never executes a gated class, and an approval never substitutes for a policy decision — APPROVAL_REQUIRED is a policy outcome, not an alternative to one. The composition is what makes "the human approved it" meaningful: they approved inside a fence that was already closed.',
        ],
      },
      {
        h: 'Reading the state machines together',
        p: [
          'The approval machine (seven states) and the execution machine (nine outcomes) interlock at one edge: CONSUMED at dispatch. Every other transition is independent — an approval can expire while an execution retries, a kill can block a dispatch whose approval was granted. The two machines sharing exactly one edge is what keeps the model comprehensible and the evidence clean.',
        ],
      },
      {
        h: 'Claim boundary',
        p: [
          'The policy engine, decision records, approval object and precedence rules are implemented and hermetically proven. The operator identity provider and the console approval surface are pre-launch (status items 19 and 27); what this page describes is the model as built, with the pending integration points named on the build status page.',
        ],
      },
    ],
  },

  '/product/receipts-audit': {
    area: 'Product',
    title: 'Receipts & Audit',
    tagline: 'Evidence from execution, not narration — one receipt per execution fact, truthful under failure.',
    next: [['/receipts', 'See an illustrative run'], ['/developers/receipts', 'Receipts (developer reference)']],
    sections: [
      {
        h: 'Who does what — the three rules',
        p: [
          'Facts come from execution, never from the agent. What happened is recorded by the components that performed it; the agent’s account is narration, and the two are never merged.',
          'Connector OS emits facts; R-Series creates, signs, chains and verifies receipts. Connector OS performs no receipt cryptography — the boundary is explicit so the evidence does not depend on trusting the executor.',
          'Execution outcome and receipt state are two fields. An attempt can succeed while its receipt is still pending, and both states are shown — never merged into a single reassuring green.',
        ],
        diagram: 'rseries-flow',
      },
      {
        h: 'From fact to receipt',
        p: [
          'Every execution attempt emits an EXEC-FACT. Every fact flows through the Evidence Client to R-Series, which issues exactly one cos-ops receipt per fact — never aggregated, never skipped. Tool-invoke sub-calls exist only as linked sub-events of their parent receipt; they cannot float free as independent evidence.',
        ],
        diagram: 'evidence-path',
      },
      {
        h: 'The ownership split — Connector OS / R-Series',
        p: [
          'Connector OS owns sanitisation, execution facts, runtime identity and tenant/connection context. R-Series owns canonical digests, receipt creation, integrity, signatures, the causal chain, verification and historical verification. Connector OS performs no receipt cryptography — the system that executes cannot mint its own proof.',
          'This boundary is the R-Series evidence boundary: facts cross it, authority does not cross back.',
        ],
      },
      {
        h: 'Receipt field groups (cos-ops-v1)',
        table: {
          head: ['Field group', 'Contents'],
          rows: [
            ['Schema identity', 'receipt type, cos-ops version, receipt id'],
            ['Causal identity', 'run id, sequence number, parent links'],
            ['Tenant / actor', 'tenant binding, agent identity, runtime identity'],
            ['Connector execution', 'connector, tool, attempt, routing context'],
            ['Intent + plan', 'plan hash, step ids (digests)'],
            ['Policy + approval', 'decision, policy version, approval reference'],
            ['Input evidence', 'digests only — never payloads'],
            ['Provider evidence', 'acceptance, response classification (digests)'],
            ['Outcome', 'execution outcome enum value'],
            ['Verification', 'method, status, when checked'],
            ['Recovery', 'reconciliation and retry ancestry'],
            ['Crypto / transparency', 'signature, signer identity, chain links'],
          ],
        },
      },
      {
        h: 'Outcome vs receipt state — two fields',
        p: ['A receipt always carries both fields, because they answer different questions:'],
        table: {
          head: ['Execution outcome', 'Receipt state', 'What it means'],
          rows: [
            ['SUCCEEDED', 'ISSUED', 'effect confirmed, evidence complete'],
            ['FAILED', 'ISSUED', 'the failure itself is evidenced'],
            ['OUTCOME_UNKNOWN', 'ISSUED', 'ambiguity on record, reconciliation follows'],
            ['SUCCEEDED', 'PENDING', 'effect confirmed; evidence still collecting'],
            ['SUCCEEDED', 'FAILED', 'receipt path failed — surfaced, never hidden'],
          ],
        },
      },
      {
        h: 'The causal chain',
        p: ['Receipts of one run form one chain: plan → policy decision → approval → attempt(s) → verification → recovery. Parent links are signed; reordering, inserting or deleting a link breaks verification. History is not a log someone can tidy — it is a structure that resists editing.'],
      },
      {
        h: 'The privacy boundary',
        p: ['Receipts carry digests, not payloads: no tokens, no headers, no raw bodies, no request content. Secret-returning reads are digest-only by contract, and the redaction profile applied is itself recorded. An auditor can verify that something happened and what it changed — without ever holding the sensitive material involved.'],
      },
      {
        h: 'Verification — what it proves',
        p: [
          'A verifier checks the signature (this receipt is what R-Series issued, unaltered), the lineage (the chain is intact and sequential), and optionally the world-state witness where one exists. Precisely: a signature proves the record; provider evidence proves the effect. Verification today is with the R-Series verifier against the published key — that is the whole claim, and it is stated, not inflated.',
        ],
      },
      {
        h: 'Tamper-evident audit history',
        p: ['Hash-linked, signed receipts with sequence numbers per stream: modification breaks the chain, deletion breaks the sequence. "Tamper-evident" means exactly this — detectable. No external anchoring or third-party audit is claimed today.'],
      },
      {
        h: 'An illustrative receipt',
        code: '// Illustrative cos-ops receipt — not a production event\n{\n  "schema": "cos-ops-v1",\n  "receipt_id": "rcpt_01H8K3F2",\n  "run_id": "run_7c2…",\n  "seq": 4, "parent": "rcpt_01H8K3F1",\n  "tenant": "tnt_acme",\n  "execution": { "connector": "github", "tool": "issues.create", "attempt": 1 },\n  "plan": { "hash": "sha256:9f2…", "step_id": 3 },\n  "policy": { "decision": "ALLOW", "version": "pol_v14" },\n  "outcome": "SUCCEEDED",\n  "receipt_state": "ISSUED",\n  "verification": { "status": "effect_confirmed" },\n  "signature": { "signer": "r-series:test-signer", "alg": "Ed25519" }\n}',
        note: 'Signer posture: receipts today are signed with a test signer in the integrated build; production key custody (KMS/HSM) is a launch gate. See Build status.',
      },
    ],
  },

  '/product/reliability-recovery': {
    area: 'Product',
    title: 'Reliability & Recovery',
    tagline: 'Failures are explicit states with defined behavior — and ambiguity is always reconciled before it is retried.',
    next: [['/agents/recovery', 'Agent recovery (agent view)'], ['/security/failure-behavior', 'Failure behavior (security view)']],
    sections: [
      {
        h: 'Explicit failure handling',
        p: ['Every failure mode maps to a declared state and a declared next step. Nothing fails silently; nothing retries blindly.'],
        table: {
          head: ['Failure', 'Behavior', 'Evidence'],
          rows: [
            ['429 / rate limit', 'back off per provider limits; per-IP and per-token tracked separately', 'rate-limit fact'],
            ['500 / 503', 'classified as provider fault; bounded retry', 'attempt facts'],
            ['timeout-before-write', 'safe to retry after checks', 'timing evidence'],
            ['timeout-after-possible-write', 'OUTCOME_UNKNOWN — reconcile first', 'ambiguity receipt'],
            ['provider unavailable', 'declared, monitored, recovered on return', 'status events'],
            ['connection revoked', 'in-flight stops at next dispatch check', 'revocation receipt'],
            ['receipt service down', 'receipt-required classes block; others go PENDING', 'per-tenant policy FD-1'],
            ['2xx-failure envelope', 'contract classification, not HTTP truth', 'classified outcome'],
          ],
        },
      },
      {
        h: 'Outcome unknown and reconciliation',
        p: [
          'When a write may or may not have happened, the execution enters OUTCOME_UNKNOWN — a first-class state, not an error to hide. Before anything else, a governed reconciliation read checks provider state.',
          'Three exits: effect found → RECOVERED, no retry, no duplicate. Effect absent → retry may proceed if the operational contract declares it safe. Still unknown → escalate; no automatic retry happens. Duplicate prevention holds where reconciliation or provider idempotency exists — and where neither exists, the step is not retried automatically. That restraint is the mechanism.',
        ],
        diagram: 'retry-flow',
      },
      {
        h: 'Retry exhaustion and escalation',
        p: ['Retries are bounded with declared limits. Exhaustion is a terminal state that opens escalation — the execution surfaces with its full evidence: attempts, classifications, reconciliation results. RETRY_EXHAUSTED is a state you can build against, not a log line you find later.'],
      },
      {
        h: 'Provider unavailability',
        p: ['When a provider is down, executions against it enter PROVIDER_UNAVAILABLE — declared and monitored, not retried into a wall. Recovery picks up from recorded state when the provider returns; nothing replays that already completed, because the record shows what completed.'],
      },
      {
        h: 'Revoked connections mid-flight',
        p: ['Revocation takes effect at the next dispatch check: queued steps against the revoked connection refuse, in-flight provider calls complete and are recorded. The evidence trail shows precisely where the revocation landed in the attempt sequence — no ambiguous "was it stopped in time".'],
      },
      {
        h: 'Receipt-service degradation',
        p: ['If the receipt path is unavailable, per-tenant policy (FD-1) decides: receipt-required action classes block until evidence can flow; other executions proceed with receipt state PENDING, completing when the service returns. Either way the state is explicit — a receipt outage never silently becomes a missing receipt.'],
      },
      {
        h: 'Durability — stated honestly',
        p: [
          'Recovery is designed to be durable: executions resume from their last recorded fact rather than restarting or duplicating. Today this is designed and tested in simulation against the reference stores — hermetically proven. Production durability across real infrastructure failure is a staging gate, and this site will say so until it is earned.',
        ],
        note: 'Crash/restart, reconciliation, stolen-lease, blast-radius and inbound-firewall drills: hermetically proven. Full infrastructure-outage drills: pending — tracked on Build status.',
      },
      {
        h: 'When the receipt service is down',
        p: [
          'Behaviour is per-policy: a policy declares whether its executions block or proceed with receipts pending (status FD-1). Executions that proceed keep recording facts — execution truth does not depend on the receipt pipeline — and issuance shows PENDING until the pipeline catches up, visible as a state rather than hidden as a gap.',
        ],
      },
    ],
  },

  '/product/architecture': {
    area: 'Product',
    title: 'Architecture',
    tagline: 'Three planes — control, execution, evidence — and one governed path between intent and provider.',
    next: [['/product/how-it-works', 'How Connector OS works'], ['/agents/governance', 'Agent governance']],
    sections: [
      {
        h: 'The execution path',
        p: ['Agent intent travels down a strict chain. Each layer can refuse, and no layer can be skipped.'],
        diagram: 'architecture',
      },
      {
        h: 'Layer responsibilities — and what each never does',
        table: {
          head: ['Component', 'Owns', 'Never does'],
          rows: [
            ['Agent / Application', 'intent, plans over discovered tools', 'holds credentials; calls providers'],
            ['Runtime E', 'connection + operator runtime: connect, bind, test, revoke', 'executes agent plans; holds policy'],
            ['OAL', 'reasoning: observe→recommend; plan hashing', 'holds secrets; has egress; writes'],
            ['Policy / Approval', 'decisions; human sign-off objects', 'executes; widens its own grants'],
            ['Ops Broker', 'routing authorised steps to the engine', 'is bypassed — it is the sole caller'],
            ['Execution Engine', 'the only provider-bound path; attempts', 'plans, policy, approvals, receipt crypto'],
            ['R-Series', 'receipts, signatures, chains, verification', 'executes; reasons; holds provider credentials'],
          ],
        },
      },
      {
        h: 'Runtime E — corrected',
        p: ['Runtime E is the connection and operator runtime: it owns the connection lifecycle (connect → test → active → suspend → revoke), credential references and routing context, and the operator-facing control surface. Earlier copy called it "the agent runtime boundary" — that description is superseded. Agents reason in the OAL; connections live in Runtime E; the two meet only through governed dispatch.'],
      },
      {
        h: 'The Ops Broker sole-caller invariant',
        p: ['The Ops Broker is the only component that calls the Execution Engine. Not the OAL, not the API layer, not a scheduler, not an operator console shortcut. This single invariant is what makes every upstream control — tenant, kill, policy, approval — unavoidably effective: there is one door, and it is watched.'],
      },
      {
        h: 'The scheduler rule',
        p: ['Schedulers wake agents; they never authorise action. A time-triggered run passes through the same policy evaluation, approval gates and dispatch checks as any interactive run. Cron is not a permission.'],
      },
      {
        h: 'The evidence path',
        p: ['In parallel with execution, facts flow Execution Facts → Evidence Client → R-Series → Receipt / Verify / Audit. The reasoning layer cannot write to this path; the execution layer cannot sign on it. Evidence comes from execution, not from any component\u2019s account of itself — and receipt cryptography belongs to R-Series alone.'],
      },
      {
        h: 'Why the separation holds',
        p: ['A compromised or mistaken agent cannot act outside policy (no credentials, no egress), cannot widen its own approvals (plan-hash binding), cannot rewrite the record (evidence path independence), and cannot route around the engine (sole-caller invariant). Each property is structural — a consequence of what components cannot do, not a promise about what they usually do.'],
      },
      {
        h: 'What is hermetically proven vs pending',
        p: [
          'From the public status table: the shared execution core is complete and integrated (item 2); the Ops Broker sole-write path is complete and integrated (item 10); the R-Series seam — fact to receipt to verify — is exercised hermetically with the deployed authenticated route pending (item 12). Production persistence, the vault, operator identity and real-provider staging are pending, and each pending item is listed with its note on the build status page.',
        ],
      },
      {
        h: 'Why the seams are the architecture',
        p: [
          'Each component boundary exists to make one class of failure impossible: the OAL seam makes credential access impossible from reasoning; the Ops Broker seam makes unauthorised dispatch impossible from anywhere; the EvidenceClient seam makes execution-dependent evidence impossible to fake. An architecture diagram with fewer boxes would be simpler to draw and harder to trust.',
        ],
      },
      {
        h: 'Deployment shape',
        p: [
          'The control plane (policy, approvals, connections, evidence) is platform-operated; the data plane (execution engine, egress) follows the deployment model agreed per tenant. What never varies: the sole-write path, the frozen contracts and the receipt chain — those are the product, and they are the same in every deployment.',
        ],
      },
      {
        h: 'Reading the diagram',
        p: [
          'Follow one write across the component table: the OAL plans it, policy evaluates it, a human approves it, the Ops Broker carries it, the engine performs it, R-Series receipts it. At every hand-off the receiving component re-checks the authority of the sending one — trust is not transitive here, it is re-established at each seam.',
        ],
      },
    ],
  },
}
