import type { SubPage } from './subpages'
import { TOTAL_CATALOGUED } from 'virtual:catalogue-summary'
import DEVEX_MATRIX from './devex-matrix.json'
import { STATUS_ITEMS, v, STATUS_AS_OF } from './status'
import { ATTEMPT_OUTCOMES, RUN_OUTCOMES, OUTCOME_TABLE_HEAD } from './outcomes'

// Developers pages (spec §7). Rule: no endpoint URLs; object shapes are
// labelled conceptual. SDK and CLI are PRE-LAUNCH surfaces.

const CONCEPT = 'Conceptual — contract frozen (EXEC-FACTS v1.0.0 / Manifest 1.3.0 / Webhook 1.0.0); public API surface pending.'

const grouped = (label: string) => STATUS_ITEMS.filter(i => i.label === label)

const statusTable = (label: string) => ({
  head: ['#', 'Capability', 'Status', 'Note'],
  rows: grouped(label).map(i => [String(i.id), i.name, i.label, i.note || '—']),
})

export const DEVELOPER_PAGES: Record<string, SubPage> = {

  '/developers/quickstart': {
    area: 'Developers',
    badge: 'CURRENT',
    title: 'Quickstart',
    tagline: 'One governed path, end to end: connect → plan → approve → execute → verify → receipt.',
    next: [['/developers/authentication', 'Authentication'], ['/developers/api', 'Resource model']],
    sections: [
      {
        h: 'The lifecycle you are building on',
        p: ['Everything your integration does maps to the canonical ten-stage lifecycle. As a developer you touch stages 6–10 directly; stages 1–5 are where agents reason.'],
        diagram: 'lifecycle',
      },
      {
        h: 'A worked example with GitHub',
        flow: ['Connect — create a connection to GitHub with the auth scheme the manifest declares', 'Inspect tools — the JIT registry returns capabilities ∩ policy for your tenant', 'Plan — submit a plan; the policy decision comes back with it (ALLOW / APPROVAL_REQUIRED / REFUSED)', 'Approval — if gated, a human approver sees the exact step and approves it', 'Execute — the Ops Broker dispatches the consumed-once approval to the engine', 'Outcome + verification — you receive the outcome and, separately, the verification status', 'Receipt ref — a pointer to the cos-ops receipt for the attempt', 'Verify — check the receipt offline with the published verifier'],
      },
      {
        h: 'The failure branch you must handle',
        p: ['Timeout after the provider call returns OUTCOME_UNKNOWN — not FAILED. The system opens a reconciliation read against provider state and reports what it finds. Do not resubmit the request: if the effect landed, a resubmit duplicates it. Wait for reconciliation, which returns RECOVERED or escalates.'],
      },
      {
        h: 'What you cannot do',
        ul: [
          'Hold raw provider credentials — connections resolve credentials inside the engine only',
          'Call the provider directly through the platform — there is no passthrough',
          'Execute without a policy decision — every step is evaluated, even at MODE 0',
          'Widen an approval — approvals are exact-step and single-use',
        ],
      },
      { h: 'Conceptual: creating a connection', code: `// ${CONCEPT}\nconst conn = await dcs.connections.create({\n  connector: "github",\n  environment: "staging",\n  auth: { scheme: "oauth2", /* credential material never stored here */ },\n  scopes: ["repo:read", "issues:write"],\n})` },
      { h: 'Conceptual: submitting a plan', code: `// ${CONCEPT}\nconst plan = await dcs.plans.create({\n  steps: [{ tool: "github.issues.create",\n    params: { repo: "acme/api", title: "Sev-2: webhook retries" } }],\n})\n// plan.decision => { outcome: "APPROVAL_REQUIRED", class: "human" }` },
      { h: 'Conceptual: reading the outcome', code: `// ${CONCEPT}\nconst exec = await dcs.executions.get(plan.run_id)\n// exec.attempts[0].outcome      => "SUCCEEDED"\n// exec.attempts[0].verification => { accepted: true, confirmed: true }\n// exec.attempts[0].receipt_ref  => "rcpt_01J…"  — verify offline` },
      {
        h: 'Why the quickstart is a lifecycle, not a curl',
        p: [
          'There is no "hello world" endpoint to hit, because the thing you are integrating is not an API of endpoints — it is a governed path. The smallest honest quickstart is one full traversal of it: connection, discovery, plan, decision, approval, execution, outcome, verification, receipt. Each step above maps to a stage of the canonical lifecycle, and the receipt at the end is the proof you did it.',
          'When the public API surface ships, this same path will be code you can run. Until then, the shapes are conceptual renderings of the frozen contracts — labelled as such everywhere they appear.',
        ],
      },
      {
        h: 'Checklist before your first gated write',
        ul: [
          'the connection is in the right environment — staging for anything you are still shaping',
          'the tool you plan to call is in your JIT discovery set — if it is not, policy will refuse it anyway',
          'your idempotency key strategy is decided before you submit, not after a timeout',
          'you handle OUTCOME_UNKNOWN by waiting for reconciliation — never by resubmitting',
        ],
      },
      {
        h: 'Where to go from here',
        p: [
          'Authentication explains the two-layer model this example relied on; the resource model gives every object you touched its fields and states; the errors reference is the table you will actually keep open while building. The receipt you end with is verified offline — the verifier does not trust the platform, and neither should your integration.',
        ],
      },
    ],
  },

  '/developers/authentication': {
    area: 'Developers',
    badge: 'CURRENT',
    title: 'Authentication',
    tagline: 'Two kinds of auth: your app to the platform, and the platform to the provider.',
    next: [['/developers/connectors', 'Connectors & manifests'], ['/security/credential-isolation', 'Credential isolation']],
    sections: [
      {
        h: 'Two layers, never mixed',
        p: ['App auth identifies your tenant and actor to Connector OS. Provider connection auth is the credential material the engine uses to call the provider. The two never meet: your app token cannot impersonate a provider credential, and a provider credential is never exposed to your app.'],
      },
      {
        h: 'Auth schemes (from Manifest 1.3)',
        table: {
          head: ['Scheme', 'Credential material', 'Resolution point'],
          rows: [
            ['oauth2', 'refresh token held in the vault', 'engine exchanges at call time'],
            ['bearer / api_key', 'secret reference', 'engine resolves, never returns'],
            ['basic', 'username + secret reference', 'engine resolves, never returns'],
            ['mtls', 'certificate reference', 'engine presents at TLS'],
            ['custom (declared)', 'per-manifest fields', 'engine resolves per contract'],
          ],
        },
      },
      {
        h: 'The connection object',
        p: ['A connection is a tenant-scoped binding of connector + environment + auth. Its fields: id, connector, version, environment, auth scheme, credential reference (an opaque vault ref — never material), scopes, status, and the tenant/workspace it belongs to.'],
        code: `// ${CONCEPT}\n{\n  "id": "conn_01J…",\n  "connector": "github",\n  "version": "1.4.0",\n  "environment": "staging",\n  "auth": { "scheme": "oauth2", "credential_ref": "vault://tnt_acme/gh/…" },\n  "scopes": ["repo:read", "issues:write"],\n  "status": "active"\n}` },
      {
        h: 'Credential reference semantics',
        p: ['Everything outside the engine sees the reference, not the credential. Plans, facts and receipts carry the reference identity only. The engine resolves the reference at call time inside its own process; resolution is the only moment secret material exists in memory.'],
      },
      {
        h: 'Routing context',
        p: ['Every dispatch carries tenant, connection, environment and connector version. The engine resolves credentials inside that context — a connection from another tenant or environment cannot be coerced into the call.'],
      },
      {
        h: 'Rotation and revocation',
        p: ['Rotating a credential updates the vault entry behind the same reference — connections and plans are untouched. Revoking a connection disables it at the next dispatch check: in-flight calls complete and are recorded, but nothing new dispatches against it.'],
      },
      {
        h: 'Why two layers must never mix',
        p: [
          'If app auth could reach provider credentials, every client bug would be a credential leak; if provider credentials could act as app identity, every stolen token would be a tenant takeover. Keeping the layers disjoint is what bounds both failure modes. The engine is the only component that holds both sides, and it holds them for exactly one dispatch at a time.',
        ],
      },
      {
        h: 'Scope discipline',
        p: [
          'Scopes are recorded at authorisation and bound to the connection; plans that need a scope the connection does not have fail at evaluation with a reason code, not at the provider with a 403. Request the scopes your workflows actually need — the blast-radius model treats granted-but-unused scope as attack surface, not as convenience.',
        ],
      },
      {
        h: 'Environments are separate connections',
        p: [
          'A staging GitHub connection and a production GitHub connection are two connection objects with two credential references and two policies. Promotion moves the plan shape, never the credential — production access is earned through production authorisation, not inherited from staging.',
        ],
      },
      {
        h: 'Claim boundary',
        p: [
          'The credential-reference model and engine-side resolution are complete and exercised in the integrated build; the hosted production vault with its full secret lifecycle is status item 20 — pending, and listed as pending on the build status page this page links to.',
        ],
      },
    ],
  },

  '/developers/api-surface': {
    area: 'Developers',
    badge: 'CURRENT',
    title: 'API surface & maturity',
    tagline: 'Every operation and component, with its evidence and its production blocker — verbatim from Lane 5.',
    next: [['/developers/api', 'Resource model'], ['/developers/status', 'Build status']],
    sections: [
      {
        h: 'How to read this',
        p: ['WIRED = reads canonical in-repo data. HERMETIC = reference server over in-memory adapters — tested, not persistence, not deployed. PLANNED = specified, answers 501. BLOCKED_BY_LANE3 and EXTERNAL_DEPENDENCY name the dependency. No operation is production-deployed; no package is published.'],
      },
      {
        h: 'The matrix (68 rows)',
        table: {
          head: ['Area', 'Feature', 'Status', 'Evidence', 'Production blocker'],
          rows: (DEVEX_MATRIX as { area: string; feature: string; status: string; evidence: string; production_blocker: string }[]).map((r) => [r.area, r.feature, r.status, r.evidence, r.production_blocker]),
        },
      },
    ],
  },

  '/developers/api': {
    area: 'Developers',
    badge: 'CURRENT',
    title: 'Resource model',
    tagline: 'The objects you integrate against — with their fields and states.',
    next: [['/developers/errors', 'Outcome & refusal reference'], ['/developers/executions', 'Executions']],
    sections: [
      {
        h: 'Contract principles',
        ul: [
          'Frozen contracts: EXEC-FACTS v1.0.0, Manifest 1.3.0, Webhook 1.0.0 — object shapes below are conceptual renderings of these',
          'No endpoint URLs yet: the public API surface is pending; integrate against the resource model',
          'Every write produces a fact; every fact feeds a receipt — the API is read-what-you-did, not trust-what-we-say',
          'Idempotency keys on every mutating call — a retried submission resolves to the same object',
          'Pagination is cursor-based and stable under concurrent writes',
        ],
      },
      {
        h: 'Resources',
        table: {
          head: ['Resource', 'Key fields', 'States'],
          rows: [
            ['Connections', 'connector, version, env, credential_ref, scopes', 'active · suspended · revoked'],
            ['Tools', 'name, operation class, side-effect class, verification method', 'discovered per session (JIT)'],
            ['Plans', 'steps, plan_hash, decision, policy_version', 'draft · evaluated · authorised · refused'],
            ['Policies', 'subject, rules, default, version', 'draft · active · superseded'],
            ['Approvals', 'plan_hash, step_ids, approver, nonce, expires', 'REQUESTED · GRANTED · DENIED · CONSUMED · EXPIRED · REVOKED · SUPERSEDED'],
            ['Executions', 'run_id, steps, attempts', 'per attempt outcome (see errors)'],
            ['Attempts', 'outcome, verification, receipt_ref', 'full outcome enum'],
            ['Receipts', 'receipt_ref, chain links, field groups', 'PENDING · ISSUED · FAILED'],
            ['Events', 'type, actor, object, timestamp', 'append-only'],
            ['Kill orders', 'scope (org/workspace/connection), dual-control flag', 'armed · active · restored'],
          ],
        },
      },
      {
        h: 'Idempotency keys',
        p: ['Every mutating call accepts an idempotency key. A submission retried with the same key returns the original object — no duplicate plans, no duplicate executions. The key, the request hash and the resolution are all on the record.'],
      },
      {
        h: 'Honesty about surface',
        p: ['This page documents the resource model and frozen contracts. The public endpoint surface — URLs, SDK method names, CLI verbs — is pending and will be published at launch. What is described here is what the integrated build actually implements.'],
      },
      {
        h: 'Reading the states column',
        p: [
          'The states listed per resource are the ones your integration can observe — they are states of the governed path, not of an internal implementation. Approvals show the full seven-state machine because you act on those transitions; connections show three because the rest are operator-side. If you ever observe a state not listed here, treat it as a bug and report it: the contract is the contract.',
        ],
      },
      {
        h: 'Events are the audit spine',
        p: [
          'Every state change on every resource emits an event: append-only, actor-labelled, tenant-scoped. Your audit queries, the dashboard timelines and the receipt chain all read from the same spine — which is why the answers agree.',
        ],
      },
      {
        h: 'Why no endpoints yet',
        p: [
          'Publishing URLs before the surface is frozen would make the website a liar on every breaking change. The contracts are frozen; the transport surface is not. When it ships, this page becomes the reference and the shapes above become literal. Until then, conceptual is the honest word, and it is on every snippet.',
        ],
      },
    ],
  },

  '/developers/connectors': {
    area: 'Developers',
    badge: 'CURRENT',
    title: 'Connectors & manifests',
    tagline: 'What a connector declares, and how to read one.',
    next: [['/connectors', 'The catalogue'], ['/developers/mcp', 'MCP']],
    sections: [
      {
        h: 'The manifest concept',
        p: ['Every connector is described by a manifest (Manifest 1.3.0, frozen): what it can do, how it authenticates, what each capability risks, and how effects are verified. The platform governs what the manifest declares — nothing more, nothing assumed.'],
      },
      {
        h: 'What a connector declares',
        table: {
          head: ['Declaration', 'Meaning'],
          rows: [
            ['auth', 'supported schemes and required scopes'],
            ['routing', 'host patterns for the egress allowlist'],
            ['capabilities', 'each tool with an operation class (read / write / destructive / admin / money-moving)'],
            ['side effects', 'what the capability changes at the provider'],
            ['retry safety', 'whether a timed-out call may be retried as-is'],
            ['verification method', 'how the engine confirms the effect occurred'],
            ['webhooks', 'inbound event surfaces and their verification'],
          ],
        },
      },
      {
        h: 'API surface — 46 operations, one frozen contract',
        p: ['The public API surface is frozen as OpenAPI 3.1 (contract 1.0.0, FROZEN) with 46 /v1 operations across connectors, connections, runs, plans, approvals, executions, receipts, policies, events, webhooks, environments, usage and operator controls. Every operation carries a maturity label — WIRED (4), HERMETIC (49 areas incl. the contract), PLANNED (10) — with the production blocker named per row. The full matrix: /developers/api-surface. The contract itself: /devportal/01_openapi/connector-os-v1.yaml.'],
      },
      {
        h: 'Catalogue status vs runtime maturity',
        p: [`The catalogue shows six public statuses describing documentation and access model. Catalogue status is not runtime verification: runtime verification is published per connector as it is earned. The catalogue documents ${TOTAL_CATALOGUED} catalogued connectors from official provider sources, with verification status shown per connector.`],
      },
      {
        h: 'Reading a connector detail page',
        p: ['The detail page shows the manifest-derived facts: auth flow, capability classes, side effects, verification, webhooks — plus catalogue status and runtime status as separate fields. Treat catalogue rank and status as documentation maturity, and runtime status as operational maturity.'],
      },
      {
        h: 'Building a connector',
        p: ['Author a manifest against Manifest 1.3.0: declare auth, routing and capabilities with honest operation classes and verification methods. The contract is frozen; the authoring tooling is PRE-LAUNCH. Connectors with declared verification earn trust that undeclared ones cannot.'],
        code: `// ${CONCEPT}\n{\n  "connector": "acme-crm",\n  "version": "0.9.0",\n  "auth": { "schemes": ["oauth2"] },\n  "capabilities": [{\n    "tool": "contacts.update",\n    "operation_class": "write",\n    "side_effects": ["contact record mutated"],\n    "retry_safe": false,\n    "verification": { "method": "read-back", "tool": "contacts.get" }\n  }]\n}` },
      {
        h: 'Why declarations are the whole game',
        p: [
          'Governance can only be as precise as what is declared. A connector that marks a money-moving capability as "write" defeats the approval class system; one that declares retry-safe carelessly creates duplicates. The manifest is therefore a claims document: the platform enforces what you declare and the catalogue shows verification status per connector, so honest declarations are visible and lazy ones are too.',
        ],
      },
      {
        h: 'Verification method is the trust anchor',
        p: [
          'The declared verification method — read-back, event, or stated-absent — is what turns a 200 into evidence. Connectors with declared verification earn "confirmed" effects; connectors without it can only ever report "accepted". When choosing between two connectors for the same provider, this row of the manifest is the one that matters.',
        ],
      },
      {
        h: 'Catalogue vs runtime, once more',
        p: [
          'Two status fields travel with every connector: catalogue status (documentation and access model, six values) and runtime status (earned proof, three values). They are never merged into one badge, on the directory or the detail page. A connector can be fully documented and not yet runtime-verified — most of the catalogue is exactly that today, and the pre-launch status vocabulary says so.',
        ],
      },
    ],
  },

  '/developers/sdk': {
    area: 'Developers',
    badge: 'PRE-LAUNCH',
    title: 'SDK',
    tagline: '@dcs-ai/connector-os — typed clients, not yet published to any registry.',
    next: [['/developers/quickstart', 'Quickstart'], ['/developers/cli', 'CLI']],
    sections: [
      {
        h: 'Status: PRE-LAUNCH — not published',
        p: ['No npm or PyPI package exists yet. The TypeScript SDK (@dcs-ai/connector-os, 46 operations) and the Python SDK (dcs-connector-os, sync + async clients) run against the hermetic reference server only — there is no public endpoint. Maturity per capability is listed verbatim from the Lane 5 test evidence below.'],
      },
      {
        h: 'TypeScript SDK — capability maturity',
        ul: [
          'Typed client for all 46 /v1 operations — HERMETIC (reference server; production API BLOCKED_BY_LANE3)',
          'Connectors catalogue + dispatch eligibility — WIRED to the canonical registry data',
          'Typed errors, retry safety, idempotency, pagination — HERMETIC (unit + contract tested)',
          'Webhook helpers — HERMETIC; outbound delivery PLANNED, signing scheme undefined (FD-L5-1)',
          'Receipt tooling — HERMETIC; verification delegated to R-Series verifier (EXTERNAL_DEPENDENCY)',
        ],
      },
      {
        h: 'Python SDK',
        ul: [
          'dcs-connector-os Client + AsyncClient — HERMETIC (53/53 pytest on source and installed wheel); BLOCKED_BY_LANE3; not published',
        ],
      },
      {
        h: 'Design principles',
        ul: [
          'Governance is not optional: there is no SDK path around policy evaluation, approvals or receipts',
          'Outcomes are typed: the SDK surfaces the full outcome enum, not just success/error',
          'Receipt refs are first-class: every attempt result carries one',
          'Idempotency is built in: mutating calls require keys and the client retries safely',
        ],
      },
      {
        h: 'Verified examples',
        p: ['Every example is executed by the Lane 5 test suite against the hermetic reference server (TypeScript/CLI/MCP/webhook 10 tests, Python 8). Source: the developer portal content pack at /devportal/06_examples/.'],
      },
      {
        h: 'What the SDK will never offer',
        p: [
          'No method bypasses policy evaluation, no option turns off receipts, no constructor accepts provider credentials. If you find yourself wanting one of those, the answer is a policy change, a connection configuration, or a conversation — not a flag. The SDK is a client of governance, not an escape from it.',
        ],
      },
    ],
  },

'/developers/mcp': {
    area: 'Developers',
    badge: 'CURRENT',
    title: 'MCP',
    tagline: 'Connector OS as an MCP server of governed tools.',
    next: [['/developers/policies', 'Policies (developer view)'], ['/agents/governance', 'Agent governance']],
    sections: [
      {
        h: 'Status (Lane 5 evidence)',
        ul: [
          'MCP read tools (8) — HERMETIC (9 tests incl. stdio process); BLOCKED_BY_LANE3',
          'MCP governed action tools (3) — HERMETIC; governed path end to end; no grant/kill/raw-provider tools; BLOCKED_BY_LANE3 + MODE 2 readiness',
          'Hosted per-tenant MCP endpoint — PLANNED (Lane 4 deployment + Lane 3 identity)',
          'Package: @dcs-ai/connector-os-mcp — PRE-LAUNCH, not published',
        ],
      },
      {
        h: 'The model',
        p: ['Connector OS exposes governed tools to MCP clients. The client sees tools — it does not see connectors, credentials or providers. Every tool call passes the same policy evaluation, approval gates and evidence pipeline as any other execution.'],
      },
      {
        h: 'JIT registry mechanics',
        p: ['Tool discovery is just-in-time: when a client connects, the registry resolves connection capabilities ∩ policy for that tenant and session, and advertises exactly that set. A tool the tenant may not use is not merely refused — it is invisible.'],
        diagram: 'architecture',
      },
      {
        h: 'What the client sees',
        ul: [
          'tools ∩ policy — the discoverable set, resolved per session',
          'typed results — outcome enum values, not raw provider bodies',
          'receipt references — every executed call returns one',
        ],
      },
      {
        h: 'Approvals over MCP',
        p: ['A call that requires approval returns APPROVAL_REQUIRED with the approval reference — it never executes on the back of the tool call itself. The human gate happens in the approval surface; the client polls or receives the event, then the step dispatches.'],
      },
      {
        h: 'Inbound-trust tagging',
        p: ['Results returned to the client carry inbound-trust tagging: content from external systems is marked as untrusted input, so client-side agents treat it as data, not instructions.'],
      },
      {
        h: 'MCP clients are not connectors',
        p: ['A connector is a manifest-declared provider integration. An MCP client is a consumer of governed tools. Clients do not become connectors by connecting; they inherit the governance of the connections behind the tools they can see.'],
      },
      {
        h: 'Why governed tools beat raw connectors',
        p: [
          'An MCP client connected to raw provider tools must implement policy, approvals, idempotency and evidence itself — or skip them. Connected to Connector OS, the client inherits all four: the tool list is already filtered by policy, gated calls return APPROVAL_REQUIRED instead of executing, and every result carries a receipt reference. The governance is not a wrapper you add; it is the server you connect to.',
        ],
      },
      {
        h: 'Trust boundaries for client agents',
        p: [
          'Inbound-trust tagging exists because tool results are prompt content for the client’s model. A provider response is data from the outside world, and the envelope marks it as such — so a malicious or merely weird payload is handled as untrusted input by construction, not by the client developer remembering.',
        ],
      },
      {
        h: 'Session lifecycle',
        p: [
          'A client session begins with discovery (the JIT registry resolves tools ∩ policy for the tenant), continues with calls (each evaluated, gated ones returning APPROVAL_REQUIRED), and ends with the evidence: every executed call has produced a receipt reference the client can hand to its user or its own audit trail. Reconnecting later re-resolves the registry — a policy change between sessions changes the visible tools, which is the point.',
        ],
      },
      {
        h: 'What MCP is not, here',
        p: [
          'The MCP surface is not a second governance model — there is one policy engine, one approval system, one evidence pipeline, and MCP is a door into it. If you integrate via the resource model instead, nothing about governance changes; if you use both, the record treats them identically. Doors differ; the room is one.',
        ],
      },
    ],
  },

  '/developers/webhooks': {
    area: 'Developers',
    badge: 'CURRENT',
    title: 'Webhooks',
    tagline: 'Two directions: provider events in, platform events out.',
    next: [['/security/webhook-security', 'Webhook security'], ['/developers/receipts', 'Receipts']],
    sections: [
      {
        h: 'Inbound: provider → platform',
        p: ['Where a manifest declares inbound surfaces, provider events arrive as signals for the Observe stage. Every inbound payload gets a verification label: verified (signature checked against the declared scheme), unsigned (accepted as a hint, never trusted), or rejected (malformed or wrong signature — dropped, with an event on the record).'],
        table: {
          head: ['Label', 'Meaning', 'What it can trigger'],
          rows: [
            ['verified', 'signature validated', 'normal lifecycle entry'],
            ['unsigned', 'no valid signature', 'MODE 0/1 only — never a write'],
            ['rejected', 'invalid or malformed', 'nothing; logged'],
          ],
        },
      },
      {
        h: 'Outbound: platform → you',
        ul: [
          'approval.requested — a plan needs a human decision',
          'execution.state_changed — attempt outcomes, including OUTCOME_UNKNOWN and retry states',
          'receipt.issued / receipt.failed — receipt finality, good or bad',
        ],
      },
      {
        h: 'Delivery semantics',
        p: ['Outbound delivery is at-least-once with a dedupe key on every event. Consumers must be idempotent: the same event may arrive twice, and the dedupe key is the contract for recognising it.'],
      },
      {
        h: 'Conceptual event',
        code: `// ${CONCEPT}\n{\n  "type": "execution.state_changed",\n  "dedupe_key": "evt_01J…",\n  "data": {\n    "run_id": "run_01J…",\n    "attempt": 2,\n    "outcome": "OUTCOME_UNKNOWN",\n    "receipt_ref": null,\n    "reconciliation": "in_progress"\n  }\n}` },
      {
        h: 'Designing consumers',
        p: [
          'Consumers should be idempotent on the dedupe key, should treat execution.state_changed as the source of truth for outcomes (poll the execution for detail), and should never treat receipt.issued as proof of execution success — receipt state and outcome are two fields, and the event carries both for exactly that reason.',
        ],
      },
      {
        h: 'Inbound events are signals, not instructions',
        p: [
          'A provider webhook enters at the Observe stage of the lifecycle. Even a verified event only informs — the lifecycle decides what, if anything, happens next, and gated steps still face a human. The pipeline diagram on the webhook security page shows the three labels and what each may trigger.',
        ],
      },
      {
        h: 'Failure handling',
        p: [
          'Undeliverable outbound events retry with backoff and surface in the events stream; an endpoint that stays down accumulates a visible backlog, not a silent one. Inbound surfaces that fail signature checks repeatedly emit their own event — a misconfigured provider looks like a signal, because it is one.',
        ],
      },
      {
        h: 'Security posture in one paragraph',
        p: [
          'Inbound: signatures checked against the manifest-declared scheme, three labels on the record, unsigned never triggers a write. Outbound: signed payloads with a dedupe key, at-least-once delivery, idempotent consumers expected. Both directions are covered in depth on the webhook security page; this page is the integration contract.',
        ],
      },
      {
        h: 'Endpoints and rotation',
        p: [
          'Outbound endpoints are registered per workspace with their own signing secret; rotation updates the secret without breaking in-flight verification windows (old and new accepted briefly, the overlap recorded). Endpoint failures are visible in the events stream — a dying endpoint is a signal you can alert on, not a silent gap.',
        ],
      },
      {
        h: 'Choosing events',
        p: [
          'Subscribe narrowly: approval.requested if you run an approval surface, execution.state_changed if you track runs, receipt.issued/failed if you verify evidence. Broad subscriptions cost you dedupe volume and alert fatigue; the event stream is dense because the system is honest, and your consumer should be selective for the same reason.',
        ],
      },
    ],
  },

  '/developers/policies': {
    area: 'Developers',
    badge: 'CURRENT',
    title: 'Policies — developer view',
    tagline: 'Evaluate before you execute; test before you trust.',
    next: [['/agents/policies', 'Canonical policy shape'], ['/developers/executions', 'Executions']],
    sections: [
      {
        h: 'Policy inputs',
        table: {
          head: ['Input', 'Example'],
          rows: [
            ['tenant / workspace', 'tnt_acme / wsp_support'],
            ['environment', 'staging · production'],
            ['connection', 'conn_01J… (github)'],
            ['connector version', '1.4.0'],
            ['operation class', 'read · write · destructive · admin · money-moving'],
            ['side-effect class', 'per manifest declaration'],
            ['parameters', 'the exact step parameters'],
            ['mode', '0 · 1 · 2'],
          ],
        },
      },
      {
        h: 'The decision object',
        p: ['Evaluation returns ALLOW, APPROVAL_REQUIRED (with the approval class) or REFUSED, plus machine-readable reason codes and the policy version that decided. Your code should branch on all three outcomes — REFUSED is routine, not exceptional.'],
        code: `// ${CONCEPT}\nconst decision = await dcs.policies.evaluate({\n  tool: "github.repos.delete", params: { repo: "acme/old" },\n})\n// => { outcome: "APPROVAL_REQUIRED", class: "human",\n//      reasons: ["destructive.requires_human"], version: "pol_v14" }` },
      {
        h: 'Evaluation timing',
        p: ['Evaluate at plan time to learn the gate early; the platform re-evaluates at dispatch regardless. If your cached decision is stale, dispatch wins — build with that assumption.'],
      },
      {
        h: 'Versioning and testing',
        p: ['Decisions record their policy version, so behaviour changes are explainable after the fact. Policy testing tooling (evaluate-as-if, decision replay) is PRE-LAUNCH and ships with the public surface.'],
      },
      {
        h: 'Decision hygiene',
        p: [
          'Evaluate at plan time for UX, never for correctness: dispatch re-evaluates regardless, and dispatch wins. Cache decisions to shape the plan you submit; do not cache them to skip evaluation. The reason codes are stable identifiers — branch on codes, not on message text.',
        ],
      },
      {
        h: 'Versioning in practice',
        p: [
          'When a policy changes, in-flight plans keep the version they were decided under, and new evaluations use the new version. The decision record quotes the version, so a post-incident review compares like with like. Testing tooling (evaluate-as-if against draft versions) is PRE-LAUNCH and ships with the public surface.',
        ],
      },
      {
        h: 'Common evaluation patterns',
        p: [
          'Each pattern is a few lines of the canonical policy shape on the agents policies page — compose them rather than writing bespoke logic. Policies that read like rules stay reviewable; policies that read like programs stop being governable.',
        ],
        ul: [
          'reads allowed everywhere; writes staging-only; destructive always human',
          'money-moving dual approval with a one-hour expiry window',
          'admin classes refused outright for agent subjects, allowed for operator subjects',
          'environment gates: production requires the production policy version explicitly',
        ],
      },
      {
        h: 'Why policy is data, not code',
        p: [
          'A policy that is code must be reviewed like code and debugged like code — under incident pressure, neither happens. As data, a policy can be diffed, versioned, evaluated as-if, and quoted in a decision record. The version field on every decision is what makes "what rule fired?" a lookup instead of an archaeology project.',
        ],
      },
      {
        h: 'Refusal budgets',
        p: [
          'Track refusal rates per agent and per rule: a spike means drift — agent-side or policy-side — and the reason codes tell you which. Healthy systems refuse a small, stable set of plans; a system that never refuses is not governed, and one that refuses everything is not useful. The sweet spot is visible in the numbers.',
        ],
      },
      {
        h: 'From evaluation to approval',
        p: [
          'When evaluation returns APPROVAL_REQUIRED, the decision object carries the approval class and the routing rule that will apply. Your integration can pre-compute who will be asked and how long the window is — surfacing "this will need finance, window one hour" in your own UI before anyone clicks approve. The gate becomes predictable, which is what makes humans willing to hold it.',
        ],
      },
    ],
  },

  '/developers/executions': {
    area: 'Developers',
    badge: 'CURRENT',
    title: 'Executions',
    tagline: 'The execution and attempt objects — and the states you must handle.',
    next: [['/developers/errors', 'Outcome & refusal reference'], ['/developers/receipts', 'Receipts']],
    sections: [
      {
        h: 'Execution and attempt objects',
        p: ['An execution is one run\u2019s authorised steps. Each step produces attempts; each attempt carries an outcome, a verification status and a receipt reference. One EXEC-FACT is recorded per attempt — execution truth and receipt state are tracked separately.'],
        code: `// ${CONCEPT}\n{\n  "run_id": "run_01J…",\n  "steps": [{ "tool": "github.issues.create", "status": "done" }],\n  "attempts": [{\n    "n": 1,\n    "outcome": "SUCCEEDED",\n    "verification": { "accepted": true, "confirmed": true },\n    "receipt_ref": "rcpt_01J…"\n  }]\n}` },
      {
        h: 'Idempotency rules',
        p: ['Step submission accepts an idempotency key; a retried submission resolves to the same attempt. The engine also pins attempt ancestry — attempt 2 names attempt 1 — so retry history is reconstructible from the record alone.'],
      },
      {
        h: 'Outcome states',
        p: ['The full outcome enum is defined once and shared with the errors reference — this is the same table, not a copy.'],
        table: { head: [...OUTCOME_TABLE_HEAD], rows: ATTEMPT_OUTCOMES.map((r) => [...r]) },
      },
      {
        h: 'Reconciliation in state',
        p: ['OUTCOME_UNKNOWN is surfaced with a reconciliation field: in_progress, then the result. The state machine link on the reliability page shows the retry and reconciliation flow; this object is how it looks from the API side.'],
      },
      {
        h: 'Verification fields',
        p: ['accepted (the provider acknowledged the call) and confirmed (the declared verification method found the effect) are separate fields. A call can be accepted but unconfirmed — treat that as its own state, not as success.'],
      },
      {
        h: 'Polling vs events',
        p: [
          'Subscribe to execution.state_changed for notification; poll the execution object for detail. The event tells you something changed and carries the outcome; the object carries attempts, ancestry, verification fields and reconciliation state. Treat the event as a doorbell, not as the conversation.',
        ],
      },
      {
        h: 'Attempt ancestry',
        p: [
          'Attempt 2 names attempt 1; the receipt chain preserves the whole lineage. When you read an execution after retries, read the attempts in order — the story of the run is the sequence, and the sequence is the evidence.',
        ],
      },
      {
        h: 'Claim boundary',
        p: [
          'Execution semantics — consume-once dispatch, outcome states, reconciliation — are proven hermetically against simulated providers. Real-provider behaviour at scale is the staging gate, and per-connector runtime status is published on the connector detail page as it is earned.',
        ],
      },
      {
        h: 'A full attempt lifecycle',
        p: [
          'Submit with an idempotency key → STARTED → terminal outcome (SUCCEEDED / FAILED / PROVIDER_UNAVAILABLE / OUTCOME_UNKNOWN) → for unknowns, reconciliation → RETRY_SCHEDULED where the contract allows → RETRY_EXHAUSTED or RECOVERED. Every transition emits an event; every attempt emits exactly one fact; every fact feeds one receipt. If your integration mirrors that state machine, it will never be surprised by the platform’s.',
        ],
      },
      {
        h: 'Reading verification correctly',
        p: [
          'accepted=true, confirmed=false is the state most integrations mishandle: the provider took the call, the declared verification method has not (yet) found the effect. Depending on the contract this may resolve on a later read, or escalate. Build the branch; do not round it up to success.',
        ],
      },
      {
        h: 'Claim boundary',
        p: [
          'All semantics on this page are exercised in the integrated build against simulated providers; per-provider behaviour at production scale is the staging gate (status item 21). Where provider behaviour differs from the model, the connector’s manifest and its runtime status are the source of truth.',
        ],
      },
    ],
  },

  '/developers/receipts': {
    area: 'Developers',
    badge: 'CURRENT',
    title: 'Receipts',
    tagline: 'cos-ops-v1 field groups, verification flow, and the causal chain.',
    next: [['/receipts', 'Example run (illustrative)'], ['/product/receipts-audit', 'Receipts & Audit (canonical)']],
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
        h: 'Receipt references',
        p: ['Every attempt returns a receipt_ref. The reference resolves to the cos-ops receipt for that attempt — or to a receipt state of PENDING or FAILED if issuance has not completed. Outcome and receipt state are separate fields; fetch both.'],
      },
      {
        h: 'cos-ops-v1 field groups',
        table: {
          head: ['Group', 'Contents'],
          rows: [
            ['schema identity', 'format name and version (cos-ops-v1)'],
            ['causal identity', 'receipt id, run id, sequence, parent link'],
            ['tenant / actor', 'tenant, workspace, acting identity'],
            ['connector execution', 'connector, version, tool, routing context'],
            ['intent + plan digests', 'digests of what was intended and planned'],
            ['policy + approval', 'decision, version, approval binding and consumption'],
            ['input evidence digests', 'digests of the facts the plan rested on'],
            ['provider evidence', 'response metadata and verification material'],
            ['outcome', 'the attempt outcome, exactly as executed'],
            ['verification', 'accepted vs confirmed and the method used'],
            ['recovery', 'reconciliation / retry / escalation records, when present'],
            ['crypto / transparency', 'signature over the receipt (software test signer)'],
          ],
        },
      },
      {
        h: 'Verify flow',
        flow: ['Fetch the receipt by receipt_ref', 'Check the signature over the receipt body', 'Recompute digests — plan, intent, input evidence — and compare', 'Walk the causal chain: parent links must resolve, sequence must be contiguous', 'Compare outcome and verification fields against your own records'],
        p: ['The verifier is published as dcslabs-r2-verify so this entire flow runs offline, without trusting the platform.'],
      },
      {
        h: 'Causal chain query',
        p: ['Receipts link parent→child within a run. Querying a run returns the chain in sequence — RUN OPEN through CLOSE — so an auditor reads the story in order, with gaps impossible to hide: a missing link fails verification.'],
      },
      {
        h: 'Outcome vs receipt state',
        p: ['A SUCCEEDED outcome with a FAILED receipt is a visible, explorable state — the event happened and the evidence is incomplete. The receipt pipeline is isolated from execution and pursues its own retry path; the state is surfaced, never hidden.'],
      },
      {
        h: 'One illustrative receipt',
        code: '// Illustrative — from the hermetic test suite, not a production event\n{\n  "schema": "cos-ops-v1",\n  "receipt_id": "rcpt_01JEXAMPLE…",\n  "run_id": "run_01JEXAMPLE…",\n  "sequence": 4, "parent": "rcpt_01JEXAMPLE…-3",\n  "tenant": "tnt_example",\n  "connector": { "name": "github", "version": "1.4.0", "tool": "issues.create" },\n  "plan_digest": "sha256:…",\n  "policy": { "decision": "APPROVAL_REQUIRED", "version": "pol_v14" },\n  "approval": { "state": "CONSUMED", "nonce": "…" },\n  "outcome": "SUCCEEDED",\n  "verification": { "accepted": true, "confirmed": true },\n  "signature": "illustrative"\n}',
      },
      {
        h: 'Verification levels',
        p: [
          'The verifier reports levels, not a single green: signature (the body is intact and signed), lineage (the causal chain is complete and contiguous), and world (the recorded digests match what you independently know — your plan, your approval). A receipt can pass signature and fail world; that is a finding, not a false positive.',
        ],
      },
      {
        h: 'Retention and export',
        p: [
          'Receipts export per run or per tenant window for offline verification with dcslabs-r2-verify. Raw-evidence retention policy (customer-local vs platform-held) is a founder decision tracked in the build order; the export format is stable either way because verification never depends on where the bytes live.',
        ],
      },
    ],
  },

  '/developers/cli-maturity': {
    area: 'Developers',
    badge: 'PRE-LAUNCH',
    title: 'CLI maturity',
    tagline: 'dcs CLI — hermetic-tested, not published.',
    next: [['/developers/cli', 'CLI design'], ['/developers/sdk', 'SDK']],
    sections: [
      {
        h: 'Lane 5 evidence',
        ul: [
          'dcs read commands — HERMETIC (17 tests incl. snapshots); BLOCKED_BY_LANE3',
          'dcs kill/restore/revoke (privileged) — HERMETIC; refusal paths tested; requires human operator session + capability + --confirm; BLOCKED_BY_LANE3 (IdP)',
          'dcs receipts verify — HERMETIC; delegates to the server verifier; local files return verification_unavailable; EXTERNAL_DEPENDENCY (R-Series)',
        ],
      },
    ],
  },

  '/developers/cli': {
    area: 'Developers',
    badge: 'PRE-LAUNCH',
    title: 'CLI',
    tagline: 'PRE-LAUNCH — same governance, terminal-shaped.',
    next: [['/developers/sdk', 'SDK'], ['/developers/quickstart', 'Quickstart']],
    sections: [
      {
        h: 'Status: PRE-LAUNCH',
        p: ['The CLI is not published. It lands at launch alongside the SDK and public API surface.'],
      },
      {
        h: 'Same governance',
        p: ['The CLI is a client of the same governed path: every command that changes state passes policy evaluation, approval gates and receipt issuance. There is no administrative backdoor in the terminal — a kill from the CLI is receipted like a kill from anywhere else.'],
      },
      {
        h: 'Shape',
        p: ['Verbs mirror the resource model: connections, plans, approvals, executions, receipts — with the outcome enum printed as first-class output and receipt refs piped straight to the verifier.'],
      },
      {
        h: 'Scriptable evidence',
        p: [
          'The CLI prints receipt refs you can pipe straight into dcslabs-r2-verify, so a terminal session can end with offline-verified evidence of what it did. Automation that operates infrastructure should produce its own audit trail as a side effect — that is the design, not a feature you enable.',
        ],
      },
    ],
  },

  '/developers/errors': {
    area: 'Developers',
    badge: 'CURRENT',
    title: 'Outcome & refusal reference',
    tagline: 'The canonical outcome enum — every state, its meaning, and what to do.',
    next: [['/developers/executions', 'Executions'], ['/developers/api', 'Resource model']],
    sections: [
      {
        h: 'Attempt-level outcomes',
        table: { head: [...OUTCOME_TABLE_HEAD], rows: ATTEMPT_OUTCOMES.map((r) => [...r]) },
      },
      {
        h: 'Run-level outcomes',
        table: { head: [...OUTCOME_TABLE_HEAD], rows: RUN_OUTCOMES.map((r) => [...r]) },
      },
      {
        h: 'Reason-code families',
        ul: [
          'policy.* — evaluation refusals (class not allowed, environment gate, parameter rule)',
          'approval.* — missing, expired, superseded or revoked approvals',
          'connection.* — revoked, suspended or cross-tenant references',
          'provider.* — classified provider rejections (rate limit, invalid request, auth)',
          'platform.* — internal guardrail failures; always fail-closed',
        ],
      },
      {
        h: 'The two rules behind every row',
        p: ['Ambiguity is a state, not a guess — OUTCOME_UNKNOWN exists so nothing is silently assumed. And refusals carry reasons — a REFUSED you cannot explain is a bug, on our side, and the record will show it.'],
      },
      {
        h: 'Designing against this table',
        p: [
          'Integrations that handle SUCCEEDED and FAILED only will mishandle a third of reality. The minimum correct client branches on all nine attempt states, treats OUTCOME_UNKNOWN as "wait", treats REFUSED as "re-plan", and treats run-level HUMAN_INTERVENTION as a handoff, not an error. This table is the contract; the SDK surfaces it as typed results when it ships.',
        ],
      },
    ],
  },

  '/developers/changelog': {
    area: 'Developers',
    badge: 'CURRENT',
    title: 'Changelog',
    tagline: 'Contract and surface changes, dated and versioned.',
    next: [['/developers/status', 'Build status'], ['/developers/api', 'Resource model']],
    sections: [
      {
        h: 'Frozen contracts',
        ul: [
          'EXEC-FACTS v1.0.0 — execution fact schema, frozen',
          'Manifest 1.3.0 — connector manifest schema, frozen',
          'Webhook 1.0.0 — event envelope, frozen',
        ],
      },
      {
        h: 'Recent',
        ul: [
          `Connector catalogue documented at ${TOTAL_CATALOGUED} catalogued connectors, from official provider sources, with verification status shown per connector`,
          'Public build-status surface added — the 30-item capability table renders on this site',
          'cos-ops-v1 receipt field groups published in the developer reference',
          'Verifier published as dcslabs-r2-verify for offline receipt verification',
        ],
      },
      {
        h: 'How changes ship',
        p: ['Contract changes are versioned, never silent: a frozen schema changes only by a new version, and evidence records quote the version they were produced under. Surface changes (SDK, CLI, endpoints) will be listed here at launch.'],
      },
      {
        h: 'Reading old entries',
        p: [
          `Entries are never rewritten. Where wording has been corrected — for example, the catalogue is described as ${TOTAL_CATALOGUED} catalogued connectors, a documentation set distinct from runtime verification — the correction is a new entry, not an edit. The changelog is append-only for the same reason the evidence chain is.`,
        ],
      },
    ],
  },

  '/developers/status': {
    area: 'Developers',
    badge: 'CURRENT',
    title: 'Build status',
    tagline: `What is built, what is proven, and what is next — as of ${STATUS_AS_OF}.`,
    noStatus: true,
    next: [['/developers/changelog', 'Changelog'], ['/product/reliability-recovery', 'Reliability & Recovery']],
    sections: [
      {
        h: 'The claim level of this site',
        p: [
          v('overall'),
          'Claim-level vocabulary is fixed: we say CODED, TESTED, INTEGRATED and HERMETICALLY PROVEN. We do not say staging verified, production verified, live, or externally audited — because those have not happened yet, and this page exists to say exactly that.',
        ],
      },
      { h: 'Complete', table: statusTable('Complete') },
      { h: 'Complete (integrated)', table: statusTable('Complete (integrated)') },
      { h: 'Complete (hermetically proven)', table: statusTable('Complete (hermetically proven)') },
      { h: 'In progress', table: statusTable('In progress') },
      { h: 'Pending', table: statusTable('Pending') },
      { h: 'Pending (release gate)', table: statusTable('Pending (release gate)') },
      { h: 'External dependency', table: statusTable('External dependency') },
      {
        h: 'A note on receipts during outages',
        p: ['If the receipt pipeline is degraded, executions continue to record facts and receipt issuance shows its state (PENDING, then ISSUED or FAILED) rather than pretending finality. An outage degrades evidence freshness, not execution truth — and the state is visible, never hidden.'],
      },
      {
        h: 'How to read the labels',
        p: [
          'Complete means coded and tested. Complete (integrated) means wired into the governed architecture and exercised end-to-end in the integrated build. Complete (hermetically proven) means proven against simulated providers with failure injection. In progress and Pending mean exactly what they say. Nothing on this page claims staging or production verification — that flip is a data change to this table and the claim level, publicly visible the moment it happens.',
        ],
      },
      {
        h: 'Why publish pending work',
        p: [
          'A status page that only shows green is marketing. The value of this table is precisely the Pending rows: they tell you what to ask about, what to wait for, and what "launch" actually means here — the golden-five staging gate, the receipt-store isolation gate, and the identity and vault gates, all listed with their current state.',
        ],
      },
    ],
  },
}
