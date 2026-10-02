import type { SubPage } from './subpages'

// Agents pages (spec §4). The canonical lifecycle lives in lib/lifecycle.ts —
// every page links to it rather than redefining it.

export const AGENT_PAGES: Record<string, SubPage> = {

  '/agents/lifecycle': {
    area: 'Agents',
    title: 'The agent lifecycle',
    tagline: 'Ten stages, each with an input, an output, an owner and a fact.',
    next: [['/agents/governance', 'Agent governance'], ['/agents/policies', 'Policies for agents']],
    sections: [
      {
        h: 'One definition, everywhere',
        p: ['The OAL lifecycle has exactly one definition — ten canonical stages — and every surface on this site renders from it: this page, the agents overview, and the homepage. Each stage below names its input, its output, its owner, and the fact it contributes to the evidence trail.'],
        diagram: 'lifecycle',
      },
      {
        h: 'Stages 1–2: Observe, Correlate',
        p: [
          'Observe — input: signals, events, schedules, user requests. Output: a signal set with provenance. Owner: OAL. Fact: what was seen and from where. Observation is read-oriented; no writes exist here.',
          'Correlate — input: the signal set. Output: one picture — related signals merged into a single situation view. Owner: OAL. Fact: the correlation links between signals, so later stages can show their working.',
        ],
      },
      {
        h: 'Stages 3–5: Diagnose, Plan, Recommend',
        p: [
          'Diagnose — input: the correlated picture. Output: findings, each bound to the evidence it rests on. Owner: OAL. Fact: evidence references that must resolve to real facts — a diagnosis that cannot cite its evidence is not complete.',
          'Plan — input: findings plus the discovered capability set (tools ∩ policy). Output: a structured plan of exact steps, hashed. Owner: OAL. Fact: the plan hash that anchors approval and execution.',
          'Recommend — input: the plan and its policy decision. Output: a proposal to a human or to the authorised next stage. Owner: OAL. Fact: the recommendation record. Nothing has executed at this point — recommendation is not action.',
        ],
      },
      {
        h: 'Stages 6–8: Authorise, Execute, Verify',
        p: [
          'Authorise — input: the plan. Output: policy decision and, for gated steps, an approval object. Owner: policy engine and the human approver — never the agent. Fact: decision object and approval state transitions.',
          'Execute — input: authorised steps. Output: attempts with outcomes. Owner: Ops Broker → Execution Engine. Fact: one EXEC-FACT per attempt.',
          'Verify — input: execution outcome. Output: verification status — provider acceptance and effect confirmation, tracked separately. Owner: engine / verification. Fact: verification result per the contract\u2019s declared method.',
        ],
      },
      {
        h: 'Stages 9–10: Recover / Escalate, Close',
        p: [
          'Recover / Escalate — input: failures, ambiguity, exhaustion. Output: reconciliation, bounded retry, compensation where declared — or escalation to a human with full context. Owner: the recovery path, then people. Fact: recovery and escalation records in the same causal chain.',
          'Close — input: terminal state. Output: a closed run with a complete evidence trail. Owner: the run itself. Fact: the closing receipt link that makes the chain final.',
        ],
      },
      {
        h: 'What a run is',
        p: ['A run is one cycle through the lifecycle under one run_id. In v1 there is one cycle per run: re-entering after escalation or closure starts a new run with a new id, linked to its ancestor. History is never edited; it is continued.'],
      },
      {
        h: 'Stage table',
        table: {
          head: ['Stage', 'Owner', 'Key fact'],
          rows: [
            ['1 Observe', 'OAL', 'signal provenance'],
            ['2 Correlate', 'OAL', 'correlation links'],
            ['3 Diagnose', 'OAL', 'evidence references'],
            ['4 Plan', 'OAL', 'plan hash'],
            ['5 Recommend', 'OAL', 'recommendation record'],
            ['6 Authorise', 'Policy / human', 'decision + approval'],
            ['7 Execute', 'Ops Broker → Engine', 'EXEC-FACT per attempt'],
            ['8 Verify', 'Engine / verification', 'verification status'],
            ['9 Recover / Escalate', 'Recovery / human', 'recovery + escalation records'],
            ['10 Close', 'Run', 'closing chain link'],
          ],
        },
      },
      {
        h: 'Why the stages are ordered this way',
        p: [
          'The order is a tightening funnel of commitment: the first five stages commit nothing, the authorisation stage is where commitment is decided, and the last four execute, check and account for it. An agent can never reach a high-commitment stage without passing through every lower-commitment stage — there is no fast path from signal to write.',
          'Mode boundaries are drawn on the same axis: MODE 0 covers stages 1–2, MODE 1 adds 3–5, and MODE 2 adds 6–10. A tenant’s mode is therefore a precise statement about which stages its agents may enter.',
        ],
      },
      {
        h: 'Stage facts compose the evidence chain',
        p: [
          'Each stage’s fact references the facts before it: the plan digest appears in the approval, the approval appears in the execution fact, the execution fact feeds the receipt. The run’s evidence is not assembled after the fact — it accumulates as the run happens, which is why it cannot be reconstructed falsely later.',
        ],
      },
      {
        h: 'What the lifecycle is not',
        p: [
          'It is not a pipeline you configure — the ten stages are fixed, and tenants configure policy and approvals, not the shape of a run. And it is not an agent framework: the lifecycle governs what a run may do, while your agent framework of choice does the reasoning inside stages 1–5. Connector OS is the layer that makes whatever the framework decides safe to execute.',
        ],
      },
      {
        h: 'Runs across time',
        p: [
          'A run that waits — on an approval, on a provider returning, on a human — stays open with its evidence accumulating. Runs do not time out into ambiguity: an expired approval is EXPIRED, an exhausted retry budget is RETRY_EXHAUSTED, and both are facts in the chain rather than silent drops. Closure is a stage a run reaches, not a state it falls into.',
        ],
      },
    ],
  },

  '/agents/governance': {
    area: 'Agents',
    title: 'Agent governance',
    tagline: 'The hard boundary between deciding and doing — enforced by what the reasoning layer cannot do.',
    next: [['/product/architecture', 'Architecture'], ['/security/credential-isolation', 'Credential isolation']],
    sections: [
      {
        h: 'The core rule',
        p: ['REASONING ≠ EXECUTION. The Operations Agent Layer decides what should happen; Connector OS decides whether, when and how it happens. This page documents the boundary\u2019s mechanics — the canonical architecture view lives on the architecture page.'],
      },
      {
        h: 'What the OAL cannot hold or reach',
        p: ['The boundary is enforced as static guards — structural properties of the integrated build, not code-review intentions:'],
        ul: [
          'No secrets — the OAL holds no provider tokens, keys or credentials; connections are referenced by identity only',
          'No egress — the reasoning layer has no network path to providers; it cannot open a socket',
          'No independent writes — the OAL cannot perform, schedule or smuggle a write outside the governed path',
        ],
      },
      {
        h: 'Tenant boundaries',
        p: ['Plans, connections, policies and evidence are tenant-scoped. An agent cannot reference another tenant\u2019s connections, and a plan carrying a foreign reference is BLOCKED at dispatch. The full mechanism is documented on the tenant boundaries page.'],
      },
      {
        h: 'Evidence-bound diagnosis',
        p: ['Diagnoses cite evidence references that must resolve to real facts. A conclusion that cannot point to the signals and provider state behind it is treated as incomplete — the governance layer distinguishes "the agent said so" from "the record shows".'],
      },
      {
        h: 'Planning over declared capabilities only',
        p: ['Agents plan against the JIT registry: connection capabilities ∩ policy, resolved per session. A plan referencing an undiscovered tool or an out-of-policy capability fails evaluation. There is no planning against assumed powers.'],
      },
      {
        h: 'The Ops Broker as the only door',
        p: ['Every authorised step reaches the Execution Engine through the Ops Broker — the sole caller. The OAL cannot call the engine directly, cannot ask another component to, and cannot construct a provider request itself. Governance is effective because it is unavoidable.'],
      },
      {
        h: 'Schedulers wake, never write',
        p: ['A scheduler can start observation; it cannot authorise action. Time-triggered runs face the same policy evaluation and approval gates as interactive ones. The calendar is not a credential.'],
      },
      {
        h: 'OAL may / may not',
        table: {
          head: ['The OAL may', 'The OAL may not'],
          rows: [
            ['observe signals and read via governed reads', 'hold or see provider credentials'],
            ['correlate, diagnose with evidence refs', 'call provider APIs — directly or indirectly'],
            ['plan over discovered capabilities', 'perform, schedule or trigger writes'],
            ['recommend action to people and policy', 'write to the evidence path'],
            ['receive outcomes and receipt references', 'widen approvals or re-authorise itself'],
          ],
        },
      },
      {
        h: 'Enforcement is static, not procedural',
        p: [
          'Many governance models are procedural: a reviewer checks that the agent did not call a provider. Here the guard is static — the reasoning layer has no network path and no credential material, so the rule holds even if every reviewer is asleep. What cannot be reached cannot be misused.',
          'The guards are properties of the integrated build: imports that do not exist, sockets that are never opened, credential handles that are never issued to that process. Governance by construction survives deadline pressure in a way governance by review does not.',
        ],
      },
      {
        h: 'What governance costs',
        p: [
          'Honesty about the trade-off: the boundary means the OAL cannot "just quickly" do anything. Every capability it uses was declared by a connector, permitted by policy and — for gated classes — approved by a person. That friction is the product. An agent platform where the fast path bypasses governance is an ungoverned platform with extra steps.',
        ],
      },
      {
        h: 'When the agent disagrees',
        p: [
          'A REFUSED plan is not an error to route around; it is the system working. The agent receives the refusal with reason codes and may re-plan within its envelope — narrower scope, different tool, smaller batch — or escalate to a human. What it may not do is retry the same step hoping the referee looks away: dispatch re-evaluates every time.',
        ],
      },
      {
        h: 'Governance of governance',
        p: [
          'The controls themselves are governed: policy changes are versioned and receipted, kills and restores are operator actions on the record, and approval routing is configuration with an audit trail. The question "who governs the governors" has a boring, correct answer — the same append-only evidence system, applied to the operators.',
        ],
      },
      {
        h: 'What this page deliberately does not promise',
        p: [
          'Static guards make exfiltration and direct action structurally impossible from the reasoning layer; they do not make a malicious plan impossible to propose. A compromised agent can still recommend bad actions — which is why the human gate, the policy floor and the evidence trail exist. Defence in depth means every layer assumes the layer above it can fail.',
        ],
      },
    ],
  },

  '/agents/policies': {
    area: 'Agents',
    title: 'Policies for agents',
    tagline: 'What an agent may plan, call and do — decided before every step, with the decision on the record.',
    next: [['/product/policies-approvals', 'Policies & Approvals (canonical)'], ['/developers/policies', 'Policies (developer view)']],
    sections: [
      {
        h: 'Inputs',
        p: ['A policy decision is a function of declared inputs — tenant, workspace, environment, connection, connector version, operation class, side-effect class, parameters and mode. Nothing ambient enters the evaluation; a decision that cannot name its inputs does not count as one.'],
      },
      {
        h: 'Decisions and reason codes',
        p: ['Three decision shapes: ALLOW, APPROVAL_REQUIRED (with the approval class named), and REFUSE — each with machine-readable reason codes. REFUSED is a normal outcome your agent should handle, not an exception. The full outcome enum lives in the developer errors reference.'],
      },
      {
        h: 'Evaluation timing',
        p: ['Policies evaluate at plan time — the agent learns the gate before it walks into it — and re-evaluate at dispatch, because kill state, revocation and policy edits may have changed the world between the two.'],
      },
      {
        h: 'Versioning',
        p: ['Policies are versioned, and every decision records the version that produced it. A decision made under pol_v13 remains explainable after pol_v14 ships — the evidence trail quotes the rule as it stood, not as it now reads.'],
      },
      {
        h: 'Fail-closed',
        p: ['Unknown tool, missing context, evaluation error, degraded policy service — all resolve to refusal. Agents lose latitude when guardrails cannot see clearly; they never gain it.'],
      },
      {
        h: 'Policy in the evidence trail',
        p: ['Every evaluation is recorded as part of execution facts: what was evaluated, which inputs applied, what was decided, under which version. Agent behavior becomes auditable without trusting the agent\u2019s own logs — the policy record is the referee\u2019s notebook.'],
      },
      {
        h: 'The canonical policy shape',
        p: ['One canonical example lives here; every other page links rather than re-derives it:'],
        code: '// Conceptual policy shape — the canonical example\n{\n  "subject": { "agent": "support-ops", "tenant": "tnt_acme" },\n  "rules": [\n    { "class": "read", "decision": "allow" },\n    { "class": "write", "decision": "allow",\n      "env": ["staging"], "reason": "writes limited to staging" },\n    { "class": ["destructive", "admin", "money-moving"],\n      "decision": "approval_required", "approval_class": "human" }\n  ],\n  "default": "refuse",\n  "version": "pol_v14"\n}',
      },
      {
        h: 'Refusal is information',
        p: [
          'A REFUSED decision carries machine-readable reason codes: which rule, which class, which input tipped it. An agent that reads its refusals learns the shape of its own envelope — "destructive in production needs a human" is actionable, and the agent can re-plan accordingly instead of flailing.',
          'Refusals are also evidence. A sudden rise in refusals against one policy version is a governance signal: either the agent’s behaviour drifted, or the policy did, and the record shows which.',
        ],
      },
      {
        h: 'Policy as the agent’s map',
        p: [
          'The JIT discovery set (tools ∩ policy) means the agent plans against what it may actually use, per session. There is no planning against assumed powers: a capability outside policy is not a capability that will be refused later — it is invisible at plan time. This makes plans smaller, refusals rarer and explanations simpler.',
        ],
      },
      {
        h: 'Environments in policy',
        p: [
          'Environment is a first-class policy input, which makes the standard posture a one-line rule: reads anywhere, writes in staging, gated writes in production, destructive and money-moving always human. The agent experiences this as different envelopes per environment — the same reasoning, different fences.',
        ],
      },
      {
        h: 'Composition with the org floor',
        p: [
          'Workspace policies refine the organization’s floor — they can tighten (add approval classes, narrow environments, reduce scope) and cannot loosen. An agent’s effective envelope is the intersection of floor and workspace policy, evaluated fresh at every decision. There is no "temporary exception" mechanism; exceptions are new policy versions, on the record.',
        ],
      },
      {
        h: 'Modes as policy inputs',
        p: [
          'The tenant’s mode is an input to evaluation: a plan containing executable steps evaluates REFUSED under MODE 1, regardless of how well-scoped it is. This is how the launch posture — MODE 1 ships, MODE 2 is hermetically proven but not customer-enabled — is enforced not by configuration but by the same evaluation path every other rule uses.',
        ],
      },
      {
        h: 'A worked decision',
        p: [
          'An agent plans github.repos.delete on acme/old in production. Evaluation reads the operation class (destructive), the environment, the connection and the policy version — and returns APPROVAL_REQUIRED with class "human" and reason destructive.requires_human. The agent routes to the approval surface; nothing has executed, and the decision itself is already on the record with the version that made it. Same plan in staging, same policy: REFUSED, if the floor forbids destructive deletes outside review — the envelope differs per environment by design.',
        ],
      },
    ],
  },

  '/agents/approvals': {
    area: 'Agents',
    title: 'Human approvals',
    tagline: 'Exact-step, single-use, expiring, revocable — and outranked by kill.',
    next: [['/product/policies-approvals', 'Approval state machine (canonical)'], ['/agents/executions', 'Agent executions']],
    sections: [
      {
        h: 'What the approver sees',
        p: ['The approval request shows the plan hash, the exact step (tool, parameters, target), the connector version, and the routing context — tenant, connection, environment. The approver evaluates the same facts the policy engine saw; approving means approving precisely that.'],
      },
      {
        h: 'The approval object',
        p: ['Approvals are data: plan hash, step ids, tenant, run, approver, policy version, issued/expires, nonce, consumed-by. The object\u2019s fields are the security — there is no ambient "approved-ness" to exploit. The full object shape is on the canonical policies & approvals page.'],
      },
      {
        h: 'Binding rules',
        p: ['The approval binds to the plan hash and the named steps. Any change to the plan — a parameter, a target, an added step — makes the approval SUPERSEDED. Approving step 3 grants nothing about step 4; approving "amount X" grants nothing about amount Y.'],
      },
      {
        h: 'Consumption at dispatch',
        p: ['Validity is re-checked at dispatch and the approval is consumed atomically with the dispatch marker — exactly once, enforced even across a crash between consumption and the provider call (hermetically proven). A second dispatch with the same approval is refused.'],
      },
      {
        h: 'Expiry and revocation',
        p: ['Approvals expire: issued-at and expires-at bound the window, and a stale approval cannot execute against changed conditions. Before use, an approval can be revoked — by the approver or by someone with the authority to withdraw it.'],
      },
      {
        h: 'Kill precedence',
        p: ['Kill and revoke controls outrank approvals. A kill takes precedence at the next dispatch check: no new step dispatches, and in-flight provider calls complete and are recorded — that honest phrasing replaces "instantly" everywhere on this site.'],
      },
      {
        h: 'Dual approval',
        p: ['Higher-risk classes can require two decisions — for example a team approver plus a finance approver for money-moving steps. Each approval is independently exact-step bound, single-use and expiring; the step dispatches only when the full chain is satisfied.'],
      },
      {
        h: 'Approvals are the launch gate for agency',
        p: [
          'The difference between a recommender and an operator is stage 6. MODE 1 ships at launch; MODE 2 — where approved steps execute — is integrated and hermetically proven but not customer-enabled. Approvals are where that line is drawn in practice, which is why their mechanics are specified so precisely.',
        ],
      },
      {
        h: 'Approver experience',
        p: [
          'The request shows the exact step with its parameters and target, the plan hash it belongs to, the connector version and the routing context, plus the policy decision that routed it to a human. The approver is not asked to trust the agent’s summary — they are shown the machine-readable thing that will execute.',
          'Decisions are one tap but not one glance: the evidence behind the plan is one level down for approvers who want it, and the approval records whether it was opened.',
        ],
      },
      {
        h: 'What agents see while waiting',
        p: [
          'A pending approval is a state, not a stall: the run shows APPROVAL_REQUIRED with the routing rule and the elapsed window. Expiry is visible in advance, so an agent can escalate a request that is about to lapse rather than discover the lapse at dispatch.',
        ],
      },
      {
        h: 'Approval classes',
        p: [
          'Classes are assigned per operation class and policy: routine gated writes route to the connection owner, destructive and admin to a named group, money-moving to a dual chain. The class determines routing, expiry window and chain length — one declaration, three consequences, all recorded with the request.',
        ],
      },
      {
        h: 'Denial is a first-class outcome',
        p: [
          'A denied approval is not a failed approval; it is the gate working. The agent receives DENIED with the approver’s reason where given, the plan closes with the denial on the record, and re-planning starts from an honest state. Systems that hide denials teach agents to retry; this one teaches them to rethink.',
        ],
      },
      {
        h: 'Approvals and the evidence chain',
        p: [
          'Every transition — requested, granted, denied, expired, revoked, consumed, superseded — is a fact with actor and timestamp, linked into the run’s chain. The approval history of a run is therefore reconstructible end to end: who was asked, what they saw, what they decided, and what the system did with the decision.',
        ],
      },
      {
        h: 'Claim boundary',
        p: [
          'Approval mechanics — exact-step binding, consume-once, expiry, revocation, precedence — are implemented and hermetically proven. The production identity of approvers (status item 19) and the operator approval surface are pre-launch; this page describes the model as built and labels what is pending.',
        ],
      },
    ],
  },

  '/agents/executions': {
    area: 'Agents',
    title: 'Agent executions',
    tagline: 'What the agent sees back — and what it never sees.',
    next: [['/developers/executions', 'Executions (developer reference)'], ['/agents/recovery', 'Agent recovery']],
    sections: [
      {
        h: 'From approved step to attempt',
        p: ['Once a step is authorised, the Ops Broker routes it to the Execution Engine with its routing context and consumed-once approval. The agent that planned the step is not the component that performs it — it waits for outcomes the way a client waits for a service.'],
      },
      {
        h: 'What comes back',
        ul: [
          'Outcome — succeeded, failed, or outcome_unknown, as explicit states',
          'Verification status — provider acceptance vs effect confirmation, separately',
          'Receipt reference — a pointer to the evidence record for the attempt',
          'Reconciliation result — for ambiguous outcomes, what the governed read found',
        ],
      },
      {
        h: 'What never comes back',
        ul: [
          'Credentials — no tokens, keys or secret material, ever',
          'Raw provider error bodies — errors arrive classified and redacted',
          'Provider secrets — secret-returning reads surface as digest-only results',
        ],
        p: ['This asymmetry is deliberate: the agent gets everything needed to reason about the result, and nothing that could arm it to act outside the governed path.'],
      },
      {
        h: 'Outcome states the agent must handle',
        table: {
          head: ['State', 'Agent handling'],
          rows: [
            ['SUCCEEDED', 'proceed; receipt ref available'],
            ['FAILED', 'read the classification; adjust the plan — do not blind-retry'],
            ['OUTCOME_UNKNOWN', 'do not resubmit; reconciliation resolves it'],
            ['RETRY_SCHEDULED / RETRY_EXHAUSTED', 'bounded retry is the system\u2019s job; exhaustion escalates'],
            ['REFUSED / BLOCKED', 'change the plan or resolve the block'],
          ],
        },
      },
      {
        h: 'Verification: accepted vs confirmed',
        p: ['"The provider accepted the call" and "the intended effect occurred" are different claims, and the agent sees them separately. A 200 is acceptance; confirmation comes from the contract\u2019s verification method against provider state. Agents that treat acceptance as confirmation build on sand.'],
      },
      {
        h: 'Facts the agent cannot author',
        p: ['Execution facts, verification results and receipts originate in the execution and evidence layers. The agent consumes them; it cannot write, amend or counter-sign them. The agent\u2019s account of what happened is narration — the record is evidence, and the two are never merged.'],
      },
      {
        h: 'One fact per attempt',
        p: [
          'Every attempt produces exactly one EXEC-FACT — the execution truth of that attempt — and every fact feeds exactly one cos-ops receipt. This one-to-one discipline is what makes the evidence chain auditable: there are no summary facts covering several attempts and no attempts that produced no fact.',
        ],
      },
      {
        h: 'Timeouts are the interesting case',
        p: [
          'Success and failure are easy; the timeout after a write is where integration systems lie to themselves. The agent receives OUTCOME_UNKNOWN with a reconciliation state, and the correct behaviour — wait, do not resubmit — is the behaviour the system enforces by refusing duplicate submission while reconciliation runs.',
        ],
      },
      {
        h: 'Reading results defensively',
        p: [
          'Agent-side result handling should branch on the full outcome enum, treat accepted ≠ confirmed, and treat refusals as planning input. The reference table lives in the developer errors page; this page is the agent-facing semantics: what each state means for the next reasoning step.',
        ],
      },
      {
        h: 'Scheduling and the calendar',
        p: [
          'Schedulers wake runs; they never write. A scheduled run enters at Observe and faces the same evaluation and approval gates as an interactive one — the calendar is not a credential. For the agent this means scheduled work may pause at stage 6 waiting for a human, and that pause is a designed state, not a bug.',
        ],
      },
      {
        h: 'Concurrency and isolation',
        p: [
          'Runs are isolated by run_id and tenant; concurrent runs against the same connection are serialized only where the contract requires it (e.g. non-idempotent writes to the same resource). The evidence chain records ordering per run, so concurrency never muddies causality.',
        ],
      },
      {
        h: 'From outcome to reasoning',
        p: [
          'The execution result feeds the agent’s next reasoning step: SUCCEEDED with confirmed verification means proceed; accepted-but-unconfirmed means check before depending on it; FAILED with a classification means adjust the plan, not the volume. The agent that reads outcomes precisely needs fewer retries, fewer escalations and fewer apologies — the enum is a reasoning tool, not just a status code.',
        ],
      },
    ],
  },

  '/agents/recovery': {
    area: 'Agents',
    title: 'Agent recovery',
    tagline: 'Recovery is a lifecycle stage with evidence — not an ad-hoc fix after the fact.',
    next: [['/product/reliability-recovery', 'Reliability & Recovery (canonical)'], ['/agents/lifecycle', 'The agent lifecycle']],
    sections: [
      {
        h: 'Triggers',
        table: {
          head: ['Trigger', 'First action', 'Evidence'],
          rows: [
            ['outcome_unknown', 'governed reconciliation read', 'ambiguity + reconciliation receipts'],
            ['provider unavailable', 'declare, monitor, resume on return', 'status events'],
            ['retry exhausted', 'open escalation with full context', 'attempt ancestry'],
            ['verification failed', 'classify; no auto-compensation', 'verification record'],
            ['receipt pending / failed', 'surface state; per-tenant policy applies', 'receipt state visible'],
          ],
        },
      },
      {
        h: 'Reconciliation first',
        p: ['For ambiguous writes, recovery begins by finding out what actually happened — a governed read against provider state. Only then: retry (if the contract declares it safe), compensate (if a compensating action is declared), or escalate. Retrying before reconciling is how duplicates happen; this system does not do it.'],
      },
      {
        h: 'Compensation vs retry',
        p: ['A retry re-attempts the same effect; a compensation applies a declared opposite effect. The operational contract states which exists for each capability. Where neither exists, the honest answer is escalation — not a creative third option invented at runtime.'],
      },
      {
        h: 'The escalation object and HUMAN_INTERVENTION',
        p: ['Escalation is data, not a ping: the trigger, the state, the evidence so far, and the options. HUMAN_INTERVENTION is a terminal state for automation — the run stops pretending it can self-heal and hands a person everything needed to decide.'],
      },
      {
        h: 'Re-entry as a new run',
        p: ['After escalation or closure, re-entering the work starts a new run with a new run_id, linked to its ancestor. History is continued, never edited — the failed run remains on the record exactly as it failed.'],
      },
      {
        h: 'Kill and revoke during recovery',
        p: ['Recovery is not a backdoor around stop controls: a kill during recovery takes precedence at the next dispatch check, and a revoked connection cannot be "recovered" back into use. The hierarchy holds even when the system is mid-fix.'],
      },
      {
        h: 'What the receipt chain shows',
        p: ['The receipts of a recovered run tell the whole story — original attempt, ambiguity, reconciliation, retry or escalation, resolution. Failures get receipts with the same rigor as successes, which is exactly when evidence matters most.'],
      },
      {
        h: 'Recovery has a budget',
        p: [
          'Retries are bounded by the operational contract; escalation is the defined end of the budget, not a failure of the design. A system that can always keep trying is a system that can always make things worse — the budget exists so that "keep trying" is a decision a person makes, with the evidence in front of them.',
        ],
      },
      {
        h: 'What the human receives',
        p: [
          'The escalation object contains the trigger, the current state, the evidence chain so far and the available options — reconcile again, compensate where declared, close as failed, or re-plan. The person deciding does not start from a pager message; they start from the run’s complete record.',
        ],
      },
      {
        h: 'Recovery and evidence',
        p: [
          'Every recovery step is in the same causal chain as the failure it addresses. A recovered run shows the failure, the ambiguity, the reconciliation read and the resolution — which is why the receipts page shows a failure timeline alongside the success one. Failures get receipts, and that is when receipts matter most.',
        ],
      },
      {
        h: 'Designing recoverable agents',
        p: [
          'Agents that recover well do three things: branch on the full outcome enum instead of success/failure, treat OUTCOME_UNKNOWN as "wait for reconciliation" rather than "try again", and write their plans so that steps are independently compensable where the contract allows. Recovery is designed at plan time, not improvised at failure time.',
        ],
      },
      {
        h: 'What recovery never does',
        p: [
          'Recovery never widens authority to fix a problem: it cannot approve its own retries, cannot borrow another connection’s scopes, and cannot edit the record of the failure it is fixing. Every recovery action is itself a governed step — reconciled reads are reads, compensations are writes with their own evaluation.',
        ],
      },
      {
        h: 'Recovery across the modes',
        p: [
          'Under MODE 1, recovery is mostly advisory: nothing executed, so recovery means re-diagnosis with better evidence. Under MODE 2, recovery is the machinery this page describes. The escalation path is identical in both — a human with full context — because the point of escalation is independent of how far the run got.',
        ],
      },
    ],
  },

  '/agents/use-cases': {
    area: 'Agents',
    title: 'Agent use cases',
    tagline: 'Real workflows across real tools — each one governed by the same policy, approval and evidence model.',
    next: [['/agents/lifecycle', 'The agent lifecycle'], ['/connectors', 'Browse the connector catalogue']],
    sections: [
      {
        h: 'Operations and support',
        ul: ['Support automation — triage, diagnose and resolve with approval-gated writes to ticketing systems', 'Incident response — observe signals, correlate, recommend, and execute runbooks under policy', 'Internal copilots — answer and act across workplace tools with tenant-scoped access'],
      },
      {
        h: 'Revenue workflows',
        ul: ['Sales workflows — CRM updates, outreach drafting and pipeline hygiene with human sign-off on writes', 'Marketing execution — campaign operations across ads and publishing surfaces under budget and scope policies', 'Customer success — health monitoring with evidence-bound diagnosis'],
      },
      {
        h: 'Finance and back office',
        ul: ['Finance operations — reconciliation assistance and reporting across accounting systems', 'Money-moving steps are always approval-gated — payouts, refunds and transfers require human sign-off', 'Procurement and vendor workflows with audit-ready evidence'],
      },
      {
        h: 'Engineering',
        ul: ['Developer workflows — issue triage, release coordination and repository operations under policy', 'Data operations — warehouse and pipeline actions with destructive-operation gates', 'Research agents — read-heavy investigation across documents and data sources'],
      },
      {
        h: 'Where the writes are',
        p: ['Different domains, same governance: the agent observes and plans; Connector OS authorises, executes, verifies and receipts. The workflow changes — the control model does not.'],
        table: {
          head: ['Use case', 'Stages that write', 'Approval class', 'What the receipt proves'],
          rows: [
            ['Support automation', 'Execute (ticket updates)', 'human for customer-facing writes', 'who approved each customer-visible change'],
            ['Incident response', 'Execute (runbook steps)', 'policy + human for destructive', 'the runbook ran as approved'],
            ['Sales workflows', 'Execute (CRM writes)', 'human per write batch', 'pipeline changes were reviewed'],
            ['Finance operations', 'Execute (money-moving)', 'dual human', 'segregation of duties held'],
            ['Data operations', 'Execute (sync jobs)', 'policy for reads; human for destructive', 'no unapproved deletions'],
            ['Research agents', 'none (MODE 1)', 'n/a — read-only', 'diagnosis rested on cited evidence'],
          ],
        },
      },
      {
        h: 'Reading the table',
        p: [
          'The pattern to notice is that approval class follows the consequence of the write, not the size of the workflow. A research agent reading a thousand documents needs no approvals; a finance agent moving a small amount needs two. Governance scales with consequence, and the receipts prove the shape it took.',
        ],
      },
    ],
  },
}
