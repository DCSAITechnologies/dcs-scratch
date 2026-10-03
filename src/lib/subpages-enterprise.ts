import type { SubPage } from './subpages'
import { ROLE_MATRIX, ROLE_LABELS, CAPABILITY_LABELS, matrixCell, ROLLOUT_STAGES, type RoleKey, type Capability } from './roles'

// Enterprise pages (spec §6). No SSO, SCIM or certification wording.
// Each page 500–800 words.

export const ENTERPRISE_PAGES: Record<string, SubPage> = {

  '/enterprise/organizations': {
    area: 'Enterprise',
    title: 'Organizations',
    tagline: 'The organization is the tenant boundary — everything else refines inside it.',
    next: [['/enterprise/workspaces', 'Workspaces'], ['/enterprise/roles-permissions', 'Roles & permissions']],
    sections: [
      {
        h: 'Organization = tenant boundary',
        p: ['An organization is the tenant: the unit of isolation for connections, policies, agents, evidence and kill state. Nothing crosses an organization boundary by default — not a connection reference, not an approval, not a receipt chain. Tenant isolation controls are documented on the security pages; this page is the operating model view.'],
      },
      {
        h: 'What is org-scoped',
        ul: [
          'The policy floor — the minimum governance every workspace inherits and cannot loosen',
          'Roles — who may configure, approve, execute, kill, restore and view',
          'Audit — the evidence trail is owned at org level; workspaces contribute, the org retains',
          'Kill at org level — one control that stops every dispatch in the tenant at the next dispatch check',
          'Environments — staging / production separation with its own gates',
        ],
      },
      {
        h: 'What workspaces refine',
        p: ['Workspaces carve the org into governed sub-spaces: their own connections, agents and views, and policies that tighten — never loosen — the org floor. A workspace can add an approval requirement the floor does not demand; it cannot remove one the floor does.'],
      },
      {
        h: 'Org-level kill and restore',
        p: ['An org-level kill takes precedence over every approval and policy at the next dispatch check: nothing new dispatches, in-flight provider calls complete and are recorded. Restore is dual-control — two authorised identities must both act — so no single person can quietly reopen a stopped organisation.'],
      },
      {
        h: 'Audit ownership',
        p: ['Receipts and events roll up to the org. A departing workspace cannot take its evidence with it, and a compromised workspace cannot rewrite the org\u2019s record — history is append-only, continued never edited.'],
      },
      { h: 'The model', diagram: 'org-model' },
      {
        h: 'Why the boundary is at the org',
        p: [
          'Isolation is only as strong as its largest shared surface. Putting the tenant boundary at the organization — rather than at the workspace or the connection — means the things that must never mix (credentials, evidence, kill state) share nothing across orgs by construction. Workspaces exist for convenience inside that wall; the wall itself is org-shaped.',
        ],
      },
      {
        h: 'Lifecycle of an organization',
        p: [
          'An org is created with its policy floor and first admin; environments and workspaces come after. Suspension of an org stops all dispatch at the next check — the same kill machinery, at the largest scope — and offboarding exports the complete evidence chain before anything is deleted, because the audit obligation outlives the account.',
        ],
      },
      {
        h: 'Claim boundary',
        p: [
          'The org model described here is implemented in the governed architecture; production operator identity (status item 19) and the production vault (item 20) are pending launch gates, listed publicly on the build status page.',
        ],
      },
      {
        h: 'Multi-org realities',
        p: [
          'Some companies run several organizations — an agency managing client tenants, a group with regulatory separation. Orgs never share connections, evidence or kill state with each other; cooperation happens through export and review, not through shared control. If two orgs need the same provider account, each holds its own connection with its own credential reference.',
        ],
      },
      {
        h: 'Claim boundary',
        p: [
          'Org-level kill, audit ownership and the policy floor are implemented; the hosted vault and operator identity behind them are pending gates (items 19–20). This page describes the operating model as specified and built, with the pending pieces named rather than smoothed over.',
        ],
      },
    ],
  },

  '/enterprise/workspaces': {
    area: 'Enterprise',
    title: 'Workspaces',
    tagline: 'Governed sub-spaces inside the tenant — with powers that tighten, never loosen.',
    next: [['/enterprise/organizations', 'Organizations'], ['/enterprise/controls', 'Controls & rollout']],
    sections: [
      {
        h: 'A workspace is a governed sub-space',
        p: ['Workspaces give teams their own room inside the organization: their own connections, agents and operating views, under the same evidence model. The workspace is where day-to-day work happens; the organization is where authority lives.'],
      },
      {
        h: 'What a workspace contains',
        ul: [
          'Connections — bound to the workspace and its environments',
          'Agents — with policies evaluated in workspace context',
          'Policies — refinements within the org floor',
          'Roles — workspace-scoped assignments (approver, developer, viewer)',
          'Views — usage and evidence filtered to the workspace',
        ],
      },
      {
        h: 'What a workspace cannot override',
        ul: [
          'The org policy floor — refinement goes one way: stricter',
          'Kill state — a workspace cannot dispatch through an org or workspace kill',
          'Environment gates — production gates apply regardless of workspace preference',
        ],
      },
      {
        h: 'Cross-workspace access',
        p: ['None by default. A connection in workspace A is invisible to agents in workspace B; a plan carrying a cross-workspace reference is BLOCKED at dispatch. Sharing, where it is ever introduced, would be an explicit org-level act — never a side effect.'],
      },
      {
        h: 'Escalation',
        p: ['When a workspace run exhausts its options, escalation carries the full context upward: trigger, state, evidence, options. Org-level roles see workspace escalations; workspace roles do not see each other\u2019s.'],
      },
      {
        h: 'When to make a workspace',
        p: [
          'The unit of a workspace is a team with its own connections and its own approval authority: support, revenue, data. If two teams share connections and approvers, they are one workspace with views; if they need separate kill authority or separate policies, they are two. Fewer, well-scoped workspaces beat many overlapping ones — every boundary you draw is a boundary you must govern.',
        ],
      },
      {
        h: 'Workspace lifecycle',
        p: [
          'Creating a workspace inherits the org floor; tuning happens by refinement. Archiving a workspace suspends its connections and stops its dispatches, while its evidence stays on the org’s record — teams come and go, the audit trail does not.',
        ],
      },
      {
        h: 'Claim boundary',
        p: [
          'Workspace scoping and the no-cross-workspace rule are enforced at dispatch in the integrated build; multi-instance persistence of that enforcement is part of the production persistence item (15) — pending, and shown as such.',
        ],
      },
      {
        h: 'Views and visibility',
        p: [
          'Workspace views filter the evidence and usage surfaces: a support workspace’s timeline shows its own runs, while org-level roles can query across workspaces. Visibility follows the same boundary as action — a workspace admin sees deeply into their workspace and not at all into the next one.',
        ],
      },
      {
        h: 'Claim boundary',
        p: [
          'The workspace model — containment, refinement, no cross-workspace access by default — is enforced at dispatch in the integrated build. Persistent multi-instance enforcement rides on the production persistence item (15), pending and labelled pending on the build status page.',
        ],
      },
      {
        h: 'Patterns that work',
        p: [
          'The cleanest workspace layouts mirror accountability, not org charts: one workspace per team that owns its own provider relationships and approval authority. Splitting a team across two workspaces because it uses two connectors is over-partitioning — connections are cheap, boundaries are not.',
        ],
      },
    ],
  },

  '/enterprise/roles-permissions': {
    area: 'Enterprise',
    title: 'Roles & permissions',
    tagline: 'People have roles. Agents have policies. The two never blur.',
    next: [['/enterprise/approval-workflows', 'Approval workflows'], ['/security/kill-controls', 'Kill controls']],
    sections: [
      {
        h: 'The split that keeps this honest',
        p: ['Humans act through roles — configure, approve, kill, restore, view. Agents act through policies — what they may plan and have executed. A person\u2019s role never widens an agent\u2019s policy, and an agent\u2019s policy never grants a person a role. The two systems meet only at the approval gate, where a person with the approver role decides on an agent\u2019s exact step.'],
      },
      {
        h: 'Role matrix',
        table: {
          head: ['Role', ...Object.values(CAPABILITY_LABELS)],
          rows: (Object.keys(ROLE_MATRIX) as RoleKey[]).map((r) => [
            ROLE_LABELS[r],
            ...(Object.keys(CAPABILITY_LABELS) as Capability[]).map((cap) => matrixCell(ROLE_MATRIX[r][cap])),
          ]),
        },
        p: ['This matrix is the single shared definition — the dashboard renders the same table from the same source, so the two never diverge.'],
      },
      {
        h: 'Separation of duties',
        p: ['The approver is not the executor: the person who approves a step cannot be the system that performs it — execution is the engine\u2019s job alone. And restore after a kill names a second identity as reviewer, so the path back from a stop is deliberately two-handed (enforced once the identity provider lands, status item 19).'],
      },
      {
        h: 'What no role can do',
        p: ['No role — including org admin — can widen an agent beyond its policy, execute outside the governed path, see credential material, or edit the evidence trail. Administration changes configuration; it never bypasses governance.'],
      },
      {
        h: 'Operator actions are receipted',
        p: ['Kills, restores, policy changes and approvals all land in the evidence trail with actor, scope and time. "Who did what to the governance itself" is auditable with the same rigor as what agents did through it.'],
      },
      {
        h: 'Designing your role assignments',
        p: [
          'The matrix above is the ceiling, not the recommendation. Most organisations should grant kill authority to few, approval authority to named accountable people, and developer scope to those building integrations. The viewer role exists so that oversight — finance, security, leadership — can read everything without touching anything.',
        ],
      },
      {
        h: 'Why "no role can widen an agent"',
        p: [
          'It would be easy to let an org admin grant an agent more power "just for today". That exception is exactly where governance dies. Policy changes are deliberate, versioned and receipted; there is no interactive override, because the value of the system is that the record and reality cannot diverge by one impatient click.',
        ],
      },
      {
        h: 'Claim boundary',
        p: [
          'Roles are modelled and tested; the identity provider that will authenticate the humans holding these roles is a pending launch gate (status item 19). The matrix describes the model as built, the identity layer as pending.',
        ],
      },
      {
        h: 'Joiners, movers, leavers',
        p: [
          'Role assignment and removal are operator actions — receipted with actor and time. A leaver’s approvals remain valid historical facts (the decision was made by someone authorised at the time), but their pending requests re-route by rule. The audit trail answers "who could do what when" without reconstructing org charts from memory.',
        ],
      },
      {
        h: 'Reading the matrix with your counsel',
        p: [
          'For regulated teams, the separation-of-duties rows are the ones to walk through with counsel: approver ≠ executor, restore names a second identity (enforced with the identity provider), no role sees credential material. The matrix is small enough to review in one sitting — that is deliberate, because a permission model nobody can hold in their head gets held by nobody.',
        ],
      },
    ],
  },

  '/enterprise/approval-workflows': {
    area: 'Enterprise',
    title: 'Approval workflows',
    tagline: 'Routing, chains, expiry and escalation — the human gate, run properly.',
    next: [['/enterprise/roles-permissions', 'Roles & permissions'], ['/agents/approvals', 'Approvals (agent view)']],
    sections: [
      {
        h: 'Routing rules',
        p: ['Approval requests route by rule: to the connection owner for routine gated steps, by risk class for elevated ones (destructive, admin, money-moving), or to a named group where a team shares the gate. Routing is policy, not habit — the rule that routed a decision is on the record with it.'],
      },
      {
        h: 'Chains and dual approval',
        p: ['Higher classes can require a chain: a team approver plus a finance approver for money-moving steps, for example. Each link is independently exact-step bound, single-use and expiring; the step dispatches only when the whole chain is satisfied.'],
      },
      {
        h: 'Expiry policy per class',
        p: ['Approval windows are set per class: short for high-risk steps, longer for routine ones. An expired approval cannot execute — the plan must be re-approved against current conditions. Expiry is a control, not an inconvenience.'],
      },
      {
        h: 'Escalation when unanswered',
        p: ['A request that sits unanswered escalates by rule — to a backup approver, then to a workspace admin — with the full request context attached. Silence never becomes approval; it becomes visibility.'],
      },
      {
        h: 'Environment-bound approvals',
        p: ['An approval granted in staging grants nothing in production. The routing context — tenant, connection, environment — is part of the approval\u2019s binding, so a production step always faces a production approver.'],
      },
      {
        h: 'Evidence',
        p: ['Every request, decision, expiry, revocation and consumption is in the receipt chain: who was asked, what they saw, what they decided, and when the approval was consumed. The human gate is as auditable as the machine path around it.'],
      },
      {
        h: 'Choosing expiry windows',
        p: [
          'Short windows for money-moving and destructive classes (hours), longer for routine writes (days). The window should match how quickly the underlying reality changes: an approval to refund against yesterday’s ledger state should not execute against next week’s. When in doubt, shorter — re-approval is cheap, wrong execution is not.',
        ],
      },
      {
        h: 'Approval load is a metric',
        p: [
          'If approvers are drowning, the answer is policy tuning — tighten which classes gate, or batch related steps into one plan for one exact-step approval — not rubber-stamping. The audit trail shows approval latency and grant rates; use them. A gate everyone waves through is worse than no gate, because it looks like control.',
        ],
      },
      {
        h: 'Claim boundary',
        p: [
          'Routing, chains, expiry and consumption are hermetically proven; the approval surface operators will use ships with the console, which is pre-launch and interest-only until the staging gate.',
        ],
      },
      {
        h: 'Approval surfaces',
        p: [
          'Approvals are answered in the console (pre-launch) and over outbound webhook events into your own tooling. The decision is the same object either way — exact-step, single-use, expiring — so an approval given in Slack-adjacent tooling carries identical weight and identical evidence to one given in the console.',
        ],
      },
      {
        h: 'Claim boundary',
        p: [
          'Approval routing, chains, expiry and consumption are hermetically proven. The operator identity provider that authenticates approvers is a pending launch gate (status item 19); until it lands, approvals are exercised in the integrated build and the console remains pre-launch.',
        ],
      },
      {
        h: 'Expiry and timezone reality',
        p: [
          'Windows are absolute timestamps, not business hours; an approval requested Friday evening with a four-hour window expires Friday evening. Route long-window classes to groups with coverage, or accept that expiry is the system protecting you from stale context — both are coherent policies.',
        ],
      },
    ],
  },

  '/enterprise/environments': {
    area: 'Enterprise',
    title: 'Environments',
    tagline: 'Staging and production are different worlds — with a controlled bridge, not a shortcut.',
    next: [['/enterprise/controls', 'Controls & rollout'], ['/developers/authentication', 'Authentication']],
    sections: [
      {
        h: 'Environment in the routing context',
        p: ['Every connection, plan, approval and execution carries its environment. It is part of the routing context at dispatch — not a label, a binding. A staging connection physically cannot be used for a production step.'],
      },
      {
        h: 'Env-scoped connections and policies',
        p: ['Connections are created per environment, and policies evaluate environment as an input. The common pattern — writes allowed in staging, gated in production, refused elsewhere — is a policy statement, not a convention.'],
      },
      {
        h: 'The promotion model',
        p: ['Work moves to production by promotion: the same connector version, the same plan shape, re-authorised against the production environment with production policies and production approvers. Nothing "graduates" implicitly; promotion is an act with evidence.'],
      },
      {
        h: 'Production gates',
        p: ['In production, destructive, admin and money-moving classes always require human approval — this is a floor, not a default a workspace can relax. Staging is where agents earn trust; production is where they spend it, step by gated step.'],
      },
      {
        h: 'No cross-environment references',
        p: ['A plan that mixes environments — a staging connection in a production step — is BLOCKED at dispatch. The boundary holds even against misconfiguration, because it is checked where the dispatch happens.'],
      },
      {
        h: 'What "production" means here',
        p: [
          'Production is not a compliment the platform pays a connection; it is a routing context with stricter floors. The same connector version, the same plan shape and the same receipt pipeline run in both environments — what changes is who must approve what, and what evidence a promotion must show.',
        ],
      },
      {
        h: 'Staging as the proving ground',
        p: [
          'The platform itself follows this discipline: the golden-five connectors verify on the staging build before any production claim, and the public build status flips only on that evidence. Your rollout should work the same way — gated writes proven in staging, then enabled in production with the approval chain already exercised.',
        ],
      },
      {
        h: 'Claim boundary',
        p: [
          'Environment binding in the routing context is implemented; the platform’s own staging environment is infrastructure track E in the public build order — pending, with the golden-five gate (item 21) behind it.',
        ],
      },
      {
        h: 'A third environment?',
        p: [
          'Some organisations add a QA or sandbox context between staging and production. The model accommodates named environments with per-environment floors; the discipline that matters is not the count but the rule that no reference crosses contexts and every promotion is an explicit, evidenced act.',
        ],
      },
      {
        h: 'Claim boundary',
        p: [
          'Environment scoping of connections and policies is implemented in the routing context; the platform’s own staging infrastructure is pending (build order track E). The gates described here apply to your rollout exactly as they apply to ours.',
        ],
      },
      {
        h: 'Evidence per environment',
        p: [
          'Receipt chains record the environment of every attempt, so the audit answer "what ran in production" is a filter, not an investigation. Staging evidence is kept with the same rigor — today’s staging run is tomorrow’s promotion justification.',
        ],
      },
    ],
  },

  '/enterprise/audit-governance': {
    area: 'Enterprise',
    title: 'Audit & governance',
    tagline: 'Evidence your auditors can verify without trusting us.',
    next: [['/receipts', 'Example run (illustrative)'], ['/developers/receipts', 'Receipt reference']],
    sections: [
      {
        h: 'What is recorded',
        p: ['Plans, policy decisions with versions, approvals and their consumption, execution attempts with outcomes, verification results, recovery and escalations, operator actions, kills and restores — each as facts in a causal chain, each feeding cos-ops receipts. The record is append-only: history is continued, never edited.'],
      },
      {
        h: 'Receipt export for auditors',
        p: ['Receipts export for offline verification: an auditor recomputes digests, walks the causal chain and checks signatures with the published verifier (dcslabs-r2-verify) — without a platform account, and without taking the platform\u2019s word for anything. Verification is something they do, not something we assert.'],
      },
      {
        h: 'Usage visibility',
        p: ['Per workspace, per connection, per agent: what ran, what was refused, what waited on approval, what failed and how it recovered. The same evidence pipeline that serves auditors serves operations — one record, many readers.'],
      },
      {
        h: 'Reviews and questions',
        p: ['Governance reviews start from the record: which policies refused the most, which approvals expired unused, which agents plan outside their usual envelope. Because decisions carry reason codes and versions, "why did the system do that" is a query, not an investigation.'],
      },
      {
        h: 'Claim boundary',
        p: ['The audit history is tamper-evident — alteration breaks the chain and fails verification. We do not claim external audit or third-party certification: receipts are signed by a software test signer, and the system is hermetically proven — integrated and proven end-to-end against simulated providers, not yet verified with real providers.'],
      },
      {
        h: 'Running a review from the record',
        p: [
          'A quarterly access review becomes: which connections exist per workspace, which scopes they hold, which policies decided what, which approvals were granted and by whom, which kills fired. All of it is a query over the evidence spine. The review output is itself an event, so the next review can see what the last one concluded.',
        ],
      },
      {
        h: 'Answering an auditor',
        p: [
          'The strongest answer this system enables is a demonstration, not a document: export the receipt chain for the period in question and let the auditor verify it offline with the published verifier. The claims are checkable, so the conversation is about evidence, not assurances.',
        ],
      },
      {
        h: 'Claim boundary',
        p: [
          'Tamper-evidence is structural and offline-checkable today, against the hermetic build; no external audit or certification is claimed, and the independent review (item 29) is listed as pending on the build status page.',
        ],
      },
      {
        h: 'Questions the record answers',
        p: [
          'If a question matters to your auditors, check it is in this list before rollout. Gaps in the record are far cheaper to close before the first real run than after the first audit.',
        ],
        ul: [
          'what did agents do this quarter, per workspace, per connector',
          'which steps needed humans, and how long did humans take',
          'what was refused, by which rule, under which version',
          'who changed governance — policies, roles, kills — and when',
          'which runs recovered, and how',
        ],
      },
    ],
  },

  '/enterprise/controls': {
    area: 'Enterprise',
    title: 'Controls & rollout',
    tagline: 'Adopt governed execution in stages — earning each expansion with evidence.',
    next: [['/enterprise/environments', 'Environments'], ['/developers/status', 'Build status']],
    sections: [
      {
        h: 'Policy floor and refinement',
        p: ['The organization sets the floor: which classes always need approval, which environments exist, what kill authority looks like. Workspaces refine downward — stricter, never looser — so central governance holds even as teams tune their own rules.'],
      },
      {
        h: 'Connector governance',
        p: ['Connector availability is controlled per workspace and environment: which connectors exist for which teams, with what scope constraints and approval classes. A connector can be suspended org-wide at once — availability is a governance decision, and it is enforced at dispatch.'],
      },
      {
        h: 'Staged rollout',
        p: [
          'Roll out in stages, each with a mode and a gate: pilot workspace observes and recommends (MODE 1 at launch), policies are tuned against refusals and approvals, the team expands, and only then production enablement — with gated writes facing human approval. Every expansion is justified by the evidence the previous stage produced.',
          'MODE 2 — governed autonomous execution — is the v1 ceiling of the lifecycle and is in progress on the public build status. Rollout plans should treat MODE 1 as the launch reality.',
        ],
        table: {
          head: ['Rollout stage', 'Allowed modes', 'Gate to advance'],
          rows: ROLLOUT_STAGES.map((r) => [...r]),
        },
      },
      {
        h: 'Usage budgets',
        p: ['Budgets bound how much an agent or workspace may do per window — attempts, gated writes, provider spend where metered. A budget exhausted is a BLOCKED with a reason code, visible and explainable, not a silent slowdown.'],
      },
      {
        h: 'Operating model',
        p: ['In one paragraph: the organization sets the floor and owns the evidence; workspaces run the work inside it; people gate the risky steps through roles; agents do the reasoning and the routine through policies; and the platform records all of it so the next governance decision is made from evidence, not anecdote.'],
      },
      {
        h: 'Budgets as blast-radius for spend',
        p: [
          'Usage budgets apply the same philosophy as scopes: a bound that fails closed. An agent that exhausts its attempt budget is BLOCKED with a reason code and the event is on the record — budgets are governance, and their exhaustion is evidence, not an outage.',
        ],
      },
      {
        h: 'Signs you are ready to advance a stage',
        p: [
          'Refusals have stabilised into a small set of understood reason codes; approvals are answered inside their windows; the evidence from the pilot answers "what did the agents do" without anyone opening a debugger. Advancement is earned by boring predictability — excitement is a signal to stay in the current stage.',
        ],
      },
      {
        h: 'Claim boundary',
        p: [
          'The rollout model reflects the platform’s own launch posture: MODE 1 at launch, MODE 2 hermetically proven but not customer-enabled. Where this page says "proven in staging", it means your staging, gated the same way ours is.',
        ],
      },
      {
        h: 'Operating reviews',
        p: [
          'The controls page is also a cadence: weekly on refusals and approval latency, monthly on budgets and connector availability, quarterly on the full access review from the audit page. Governance that is reviewed stays calibrated; governance that is installed decays.',
        ],
      },
    ],
  },

  '/enterprise/contact': {
    area: 'Enterprise',
    title: 'Enterprise contact',
    tagline: 'Talk through your governance model with the people building it.',
    noStatus: true,
    form: { kind: 'contact', topic: 'enterprise' },
    next: [['/enterprise/controls', 'Controls & rollout'], ['/developers/status', 'Build status']],
    sections: [
      {
        h: 'What to bring',
        p: ['The useful conversation is concrete: which systems your agents need to touch, which action classes worry you, who should hold approval and kill authority, and what your auditors ask for today. We will map that to the governance model — policy floor, workspaces, approval chains, environments and evidence — as it actually exists in the build.'],
      },
      {
        h: 'Where the platform stands',
        p: ['The system is pre-launch: integrated and proven end-to-end against simulated providers, with real-provider staging as the next major gate. The full capability table is public on the Build status page — we would rather you evaluate the honest table than a polished claim.'],
      },
      {
        h: 'Reach us',
        p: ['Write to the team with your scenario and we will respond with a concrete read on fit — including, where true, "not yet".'],
        ul: ['Enterprise & governance conversations: enterprise@dcslabs.dev', 'Developer & integration questions: developers@dcslabs.dev'],
      },
    ],
  },
}
