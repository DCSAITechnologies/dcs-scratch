import type { SubPage } from './subpages'

// Security pages follow the fixed six-section structure (spec §5):
// Threat / problem · Control · Runtime behaviour · Failure behaviour ·
// Evidence / audit behaviour · Limitations / claim boundary.

export const SECURITY_PAGES: Record<string, SubPage> = {

  '/security/credential-isolation': {
    area: 'Security',
    title: 'Credential isolation',
    tagline: 'Provider credentials never leave the vault boundary — agents hold references, the engine resolves, and nothing else can.',
    next: [['/security/tenant-boundaries', 'Tenant boundaries'], ['/developers/authentication', 'Authentication (developer view)']],
    sections: [
      {
        h: 'Threat / problem',
        p: [
          'The dominant risk in agentic systems is credential exposure: a token in a prompt, a key in a log line, a secret in a tool response. Once an agent — or anything that can influence an agent — can read a credential, every downstream control is decoration. Prompt injection becomes exfiltration; a bug becomes a breach.',
          'The second risk is standing access: long-lived tokens that work from anywhere, for anything, forever. Even without leakage, a stolen or misused session has unlimited blast radius.',
        ],
      },
      {
        h: 'Control',
        diagram: 'credential-flow',
        p: ['Connector OS isolates credentials behind four mechanisms:'],
        ul: [
          'Vault references — connections store a reference to the secret, never the secret; application and agent code only ever see the reference.',
          'Leases — short-lived credentials with a TTL, issued for a specific routing context; single-flight refresh means exactly one component renews a lease.',
          'Secret closures — credentials are resolved inside the Execution Engine at dispatch time, within a closed scope; they are not passed between components as values.',
          'Engine-only resolution — the engine is the only component that can turn a reference into a usable credential. The OAL cannot, the API layer cannot, your code cannot.',
        ],
      },
      {
        h: 'Runtime behaviour',
        p: [
          'An agent plans against a connection by identity. When an approved step dispatches, the engine resolves the lease for that connection, binds it to the routing context — tenant, connection, host, region, environment — performs the call, and discards the material. The agent sees the outcome and a receipt reference. It never sees the credential, and it cannot construct a request that carries one.',
          'In the integrated build this is enforced as a static guard: no code path in the reasoning layer imports credential material — the boundary is structural, not a code-review hope.',
        ],
      },
      {
        h: 'Failure behaviour',
        p: ['Credential failures resolve toward refusal:'],
        ul: [
          'Expired lease — dispatch is refused; the step does not leave the engine.',
          'Stolen lease — a lease cannot be refreshed by a thief (single-flight), cannot leave its host allowlist, and cannot reach a tool outside its scope; misuse drills confirm containment.',
          'Refresh failure — the step pauses in a declared state; it does not fall back to a stored long-lived secret.',
        ],
      },
      {
        h: 'Evidence / audit behaviour',
        p: ['Refusals are evidence. Lease refusals, scope mismatches and resolution failures emit security.event receipts that record what was attempted, which context failed, and which control fired. The evidence records that a credential was used — never the credential itself; values are redacted before facts are emitted.'],
      },
      {
        h: 'Limitations / claim boundary',
        p: ['The integrated build uses a software vault reference. A hosted production vault with full secret lifecycle management is a launch gate, tracked publicly on the Build status page. We do not claim hardware-backed key custody today.'],
      },
      {
        h: 'Why leases, not standing credentials',
        p: [
          'A standing credential is a standing breach: anything that holds it can use it, at any time, for anything it allows. The lease model replaces possession with per-dispatch resolution — the credential exists in memory only for the moment of the call, inside the engine, inside the routing context that was authorised.',
          'This is the difference between "we handle credentials carefully" and "most of the system structurally cannot touch them". The OAL, the planner, the scheduler, the evidence path — none of these processes ever contain secret material, so none of them can leak it.',
        ],
      },
      {
        h: 'What a compromise looks like from here',
        p: [
          'If an agent is compromised, the attacker gains the ability to propose plans — nothing more. Every step still faces policy evaluation, and gated steps still need a human approval the attacker cannot forge, because approvals are issued by people against plan hashes the approver sees.',
          'If a lease is somehow intercepted, revocation disables the connection at the next dispatch check and the blast-radius model bounds what the lease could have reached: scopes ∩ policy ∩ approval, nothing wider.',
        ],
      },
      {
        h: 'Claim boundary',
        p: [
          'The credential-isolation model is implemented and exercised in the integrated build; the hosted production vault (status item 20) is a launch gate. We describe the mechanism as built, and the production key custody as pending — both statements are on the public build status page.',
        ],
      },
    ],
  },

  '/security/tenant-boundaries': {
    area: 'Security',
    title: 'Tenant boundaries',
    tagline: 'Tenant isolation controls across organizations and connections — bound at every layer, enforced before the provider.',
    next: [['/security/routing-egress', 'Routing & egress controls'], ['/enterprise/organizations', 'Organizations (enterprise view)']],
    sections: [
      {
        h: 'Threat / problem',
        p: [
          'Multi-tenant systems fail at boundaries: a connection resolved under the wrong tenant, a receipt visible to the wrong organization, an approval granted in one tenant consumed in another. Tenant misbinding is usually silent — nothing crashes; data simply crosses a line it should never cross.',
          'Agentic systems add a sharper edge: an agent that can reach across tenants does not just read the wrong data — it acts on it.',
        ],
      },
      {
        h: 'Control',
        diagram: 'tenant-boundary',
        p: ['Tenant is not a filter applied at the UI; it is a binding carried by every object that matters:'],
        ul: [
          'Connection — created under exactly one tenant',
          'Lease — issued for a tenant-bound routing context',
          'Routing — tenant is part of the dispatch context, checked before provider contact',
          'Approval — bound to the tenant at grant time',
          'Fact and receipt — stamped with the tenant that produced them',
          'Visibility — per-tenant evidence visibility governs who can see which receipts',
        ],
      },
      {
        h: 'Runtime behaviour',
        p: [
          'At dispatch, the routing context is assembled and the tenant binding is verified. A mismatch — a plan from tenant A referencing a connection of tenant B, an approval minted elsewhere, a lease presented out of context — resolves to BLOCKED before any provider call is made. There is no cross-tenant data path in the execution layer: not a query, not a fallback, not an admin shortcut.',
        ],
      },
      {
        h: 'Failure behaviour',
        p: ['Boundary evaluation fails closed. If tenant context is missing, ambiguous or cannot be verified, dispatch does not proceed. There is no degraded mode in which tenant checks are relaxed.'],
      },
      {
        h: 'Evidence / audit behaviour',
        p: ['Every receipt carries its tenant binding, so the evidence trail itself is partitioned: an auditor reviewing one tenant\u2019s history sees exactly that tenant\u2019s chain. Cross-tenant access attempts are recorded as BLOCKED with the mismatch documented — the attempt becomes evidence too.'],
      },
      {
        h: 'Limitations / claim boundary',
        p: ['Execution-layer tenant isolation is implemented and exercised in the integrated build. Receipt-store tenant isolation (row-level visibility in the evidence store) is under remediation as a release gate — it must be proven before staging. We claim no per-tenant encryption keys and no physical isolation today.'],
      },
      {
        h: 'Isolation that is checked, not assumed',
        p: [
          'Tenant scoping is enforced at dispatch, where the routing context is assembled — not only at query time in a dashboard. A plan referencing a connection from another tenant, or a workspace it does not belong to, is BLOCKED with a reason code, and the attempt is on the record.',
          'The same discipline applies to evidence: receipt chains are tenant-owned, and a tenant export contains exactly that tenant’s chain — the causal links make silent gaps detectable.',
        ],
      },
      {
        h: 'The receipt-store release gate',
        p: [
          'One boundary is not yet proven to the standard we require: tenant-safe receipt storage (status item 14) is under remediation as a release gate. Until row-level isolation on the receipt store passes its negative test suite on the production database, staging does not open. This is stated here, on the security overview, and on the build status page — the same sentence, from the same source.',
        ],
      },
      {
        h: 'Cross-tenant tests we run',
        ul: [
          'plan with foreign connection reference → BLOCKED',
          'dispatch with swapped routing context → refused, event recorded',
          'receipt query across tenant boundary → empty, not error',
          'kill in tenant A → no effect on tenant B dispatch',
        ],
      },
    ],
  },

  '/security/routing-egress': {
    area: 'Security',
    title: 'Routing & egress controls',
    tagline: 'The destination is governed, not just the payload — allowlisted hosts, pinned resolution, no agent network path.',
    next: [['/security/approval-gated-actions', 'Approval-gated actions'], ['/security/blast-radius', 'Blast-radius controls']],
    sections: [
      {
        h: 'Threat / problem',
        p: [
          'The classic agentic exfiltration play does not need exotic access: it needs one outbound call to the wrong place. SSRF through a "fetch this URL" tool, a redirect that silently moves a request off the provider\u2019s host, DNS rebinding that swaps an allowlisted name for an attacker\u2019s address, or a legitimate provider call with the payload pointed at a paste site.',
          'If the network layer trusts the agent\u2019s intent, every higher control can be bypassed by simply asking for a different destination.',
        ],
      },
      {
        h: 'Control',
        ul: [
          'Per-connection host allowlist — each connection declares the provider hosts it may reach; nothing else resolves.',
          'Redirect re-check — redirects are re-validated against the allowlist before being followed; a redirect off-list is a refusal, not a follow.',
          'Private-IP refusal — link-local, loopback and private ranges are refused, closing cloud-metadata and internal-network SSRF.',
          'Resolve-then-pin — DNS is resolved and the result pinned for the connection, defeating rebinding between check and connect.',
          'Engine-only egress — the only component with an outbound path to providers is the Execution Engine. MCP clients, agents and application code have no provider network path at all.',
        ],
      },
      {
        h: 'Runtime behaviour',
        p: [
          'When a step dispatches, the engine resolves the destination against the connection\u2019s allowlist before any bytes leave. An off-list destination is refused before DNS resolution completes. The routing context — host and region binding included — travels with the execution, so a connection configured for one region cannot quietly egress through another.',
          'This is also why "the agent called a tool" can never mean "the agent opened a socket": there is no path from reasoning to network. The governed path is the only path.',
        ],
      },
      {
        h: 'Failure behaviour',
        p: ['Egress controls fail closed. Allowlist lookup failure, DNS anomalies, redirect chains that cannot be fully validated — all resolve to refusal before the provider (or any host) is contacted. Ambiguity never results in "try it and see".'],
      },
      {
        h: 'Evidence / audit behaviour',
        p: ['Egress refusals emit refusal receipts: the requested destination, the allowlist entry that failed, the redirect hop or DNS result that triggered the control. Security teams can review attempted escapes with the same rigor as successful executions — the attempt is on the record.'],
      },
      {
        h: 'Limitations / claim boundary',
        p: ['The allowlist and pinning model is implemented in the integrated build and exercised in drills. Provider host lists are maintained per connector; an incomplete allowlist for a niche provider surface can cause over-refusal — a safe failure, but one we tune per connector rather than loosen globally.'],
      },
      {
        h: 'What the allowlist binds',
        p: [
          'The egress allowlist is assembled from the manifest’s declared routing — the host patterns the connector says it needs — intersected with the tenant’s connection configuration. A connector cannot reach a host it never declared, and a tenant cannot widen a connector’s reach without changing its own connection record, which is an audited act.',
          'Redirects are re-checked against the same allowlist: a provider response cannot bounce a call to an undeclared host. Private and link-local addresses are refused outright, which closes the SSRF path where a "provider URL" points inward.',
        ],
      },
      {
        h: 'Resolve-then-pin',
        p: [
          'DNS is resolved at dispatch and the connection is pinned to the resolved address for the call, so a DNS rebinding between resolution and connect cannot redirect traffic. This is a small mechanism with a large effect: the network identity checked is the network identity used.',
        ],
      },
      {
        h: 'Failure posture',
        p: [
          'If the egress guard itself cannot evaluate — allowlist unavailable, resolver failed — the call does not go out. Routing is fail-closed like everything else on the dispatch path: unclear network identity means no egress.',
        ],
      },
    ],
  },

  '/security/approval-gated-actions': {
    area: 'Security',
    title: 'Approval-gated actions',
    tagline: 'Approvals that cannot be replayed, widened or used stale — bound to the plan hash, consumed exactly once.',
    next: [['/agents/approvals', 'Human approvals (agent view)'], ['/product/policies-approvals', 'Policies & Approvals (canonical)']],
    sections: [
      {
        h: 'Threat / problem',
        p: [
          'An approval system that can be gamed is worse than none — it manufactures trust. The attacks: replaying a consumed approval for a second execution, widening "update record X" into "update record Y", using a week-old approval against changed conditions, or swapping the plan after the human said yes.',
          'Each of these turns a human\u2019s signature into a blank cheque. Approval-gated execution exists to make the cheque name the exact amount.',
        ],
      },
      {
        h: 'Control',
        ul: [
          'Plan-hash binding — the approval references the hash of the exact plan; any change to the plan makes the approval SUPERSEDED.',
          'Step binding — the approval names specific step ids within the plan, not the plan in general.',
          'Single-use nonce — consumed atomically with the dispatch marker; a second dispatch with the same approval is refused.',
          'Expiry — issued-at and expires-at on every approval; stale approvals cannot execute.',
          'Dispatch-time re-check — approval validity is verified again at dispatch, not just when the plan was evaluated.',
        ],
      },
      {
        h: 'Runtime behaviour',
        p: [
          'The approver sees the plan hash, the exact step, the connector version and the routing context — the same facts the policy engine evaluated. On grant, the approval object is minted with tenant, run, approver, policy version, validity window and nonce. At dispatch, the engine verifies all of it once more, then consumes the approval atomically: the consumption and the dispatch marker are one operation.',
          'Crash semantics matter here: "consumed exactly once" holds even if the process dies between consumption and the provider call — the consumption is durable before the call is attempted. This is proven in the integrated test suite.',
        ],
      },
      {
        h: 'Failure behaviour',
        p: ['The approval path fails closed in both directions: if the approval service is degraded and validity cannot be confirmed, the step does not execute — an unverifiable approval is treated as no approval. If a plan changes after approval, the old approval does not "mostly match" — it is superseded and the step waits for a new decision.'],
      },
      {
        h: 'Evidence / audit behaviour',
        p: ['Approvals produce their own receipts: requested, granted, denied, expired, revoked, superseded, consumed — each with the plan hash and the consumed-by link to the execution that used it. The causal chain lets an auditor walk from receipt → execution → approval → plan without trusting any component\u2019s narration.'],
      },
      {
        h: 'Limitations / claim boundary',
        p: ['"Immediate" is never claimed for approval revocation: controls take effect at the next dispatch check, and in-flight provider calls complete and are recorded. A durable production approval store is a staging gate, tracked on Build status.'],
      },
      {
        h: 'Why exact-step binding matters',
        p: [
          'Approvals that approve a spirit rather than a step are how governance theatre starts: a human approves "update the ticket" and the system executes "update the ticket and refund the customer". Exact-step binding makes the approval a cryptographic fact about parameters, not a vibe — plan hash, step id, parameters, target, connector version.',
          'The approver sees exactly what will execute. Any change — even a well-meaning correction by the agent — supersedes the approval and sends the step back for a fresh decision.',
        ],
      },
      {
        h: 'The dispatch re-check',
        p: [
          'Between approval and dispatch the world can change: a kill can land, the connection can be revoked, the policy can tighten. So validity is re-evaluated at dispatch, and the approval is consumed atomically with the dispatch marker — once, even across a crash between consumption and the provider call, which is hermetically proven.',
          'An approval is therefore not a credential that circulates; it is a single-use authorisation that dies with its dispatch.',
        ],
      },
      {
        h: 'Claim boundary',
        p: [
          'Approval objects, state machine and consume-once semantics are implemented and proven in the integrated build. Production operator identity (who the human approver is, backed by an identity provider) is status item 19 — pending, and stated as such wherever approvals are described.',
        ],
      },
    ],
  },

  '/security/blast-radius': {
    area: 'Security',
    title: 'Blast-radius controls',
    tagline: 'Scope ∩ policy ∩ approval — the effective permission of any step is the smallest of three circles, with automatic revocation when behavior breaks baseline.',
    next: [['/security/kill-controls', 'Kill & revoke controls'], ['/security/retry-reconciliation', 'Retry & reconciliation safety']],
    sections: [
      {
        h: 'Threat / problem',
        p: [
          'Assume the agent is wrong — hallucinating, compromised, or simply given a bad instruction. The question is not whether it can be stopped in theory, but how much damage exists between "something is wrong" and "it is stopped". That area is the blast radius, and in most systems it is the full permission set of the integration.',
          'Volume attacks make it worse: a stolen lease used at machine speed can produce thousands of actions before a human notices.',
        ],
      },
      {
        h: 'Control',
        ul: [
          'Intersection model — effective permission = connection scopes ∩ policy ∩ approval. The agent can never exceed the smallest circle.',
          'Per-mode envelopes — MODE 0 observes; MODE 1 recommends; MODE 2 executes only approval-gated writes. Higher modes do not exist in v1.',
          'Scoped permissions — connections carry only the scopes granted at authorize time; policy further narrows by tool, class, resource and environment.',
          'Baseline-driven revocation — behavior that breaks the learned baseline (volume, novel tools, unusual targets) triggers automatic lease revocation, receipted like any other control action.',
        ],
      },
      {
        h: 'Runtime behaviour',
        p: [
          'Every step is evaluated against all three circles at plan time and again at dispatch. A step that passes scopes but fails policy is refused; one that passes policy but lacks approval waits; one that has all three executes — for exactly its approved effect, on exactly its approved target.',
          'When baseline detection fires, the lease is revoked first and the investigation happens second. Containment is not a workflow someone must remember to run.',
        ],
      },
      {
        h: 'Failure behaviour',
        p: ['Where any of the three circles cannot be evaluated, the step does not proceed — the intersection of known and unknown is treated as empty. Automatic revocation errs toward containment: a false positive costs a re-authorization; a false negative costs a breach.'],
      },
      {
        h: 'Evidence / audit behaviour',
        p: ['Revocations — human, automatic or policy-driven — are receipted with the baseline signal that triggered them. The evidence trail therefore shows not just what the agent did, but the moment the system decided it had done enough.'],
      },
      {
        h: 'Limitations / claim boundary',
        p: ['The baseline model is hermetically proven in the integrated test suite against simulated behavior; it has not yet been tuned against real production traffic. Sensitivity settings will be published per mode as they are earned, not asserted in advance.'],
      },
      {
        h: 'Three intersecting fences',
        p: [
          'What a step can touch is the intersection of three independent constraints: the scopes granted on the connection, the policy decision for that operation class, and — for gated steps — the exact-step approval. Each fence alone can be misconfigured; the intersection means a mistake in one does not silently widen the others.',
          'Baseline-driven revocation tightens this over time: behaviour that departs from a tenant’s observed baseline triggers review and can revoke access. This mechanism is hermetically proven only — it has not yet watched real production behaviour, and the copy says so wherever it appears.',
        ],
      },
      {
        h: 'Failure posture',
        p: [
          'If scope or policy context is unavailable at evaluation, the intersection is empty and the step is refused. Blast-radius controls fail toward smaller, never toward wider.',
        ],
      },
    ],
  },

  '/security/retry-reconciliation': {
    area: 'Security',
    title: 'Retry & reconciliation safety',
    tagline: 'Ambiguous writes are reconciled before any retry — duplicates are prevented by evidence, not by hope.',
    next: [['/product/reliability-recovery', 'Reliability & Recovery (canonical)'], ['/developers/errors', 'Errors (developer reference)']],
    sections: [
      {
        h: 'Threat / problem',
        p: [
          'A timeout after a possible write is the most dangerous moment in any integration: retry blindly and you may charge twice, post twice, transfer twice. Related attacks and failure modes: idempotency laundering (reusing keys to mask distinct operations), 2xx-failure envelopes (provider returns success around an error body), and "safe-looking" automatic retries of operations that cost money per attempt.',
          'Most duplicate-effect incidents are not malice — they are a retry policy that never asked what actually happened.',
        ],
      },
      {
        h: 'Control',
        ul: [
          'Reconciliation-before-retry — no ambiguous write is retried until provider state has been checked.',
          'Contract-declared retry safety — each capability in Manifest 1.3 declares whether retry is safe, and under what semantics; undeclared means not safe.',
          'Provider idempotency — where the provider supports idempotency keys, the engine uses them; where it does not, the engine does not pretend.',
          'Paid reads never auto-retried — operations that cost money per call are never retried automatically, whatever the error looks like.',
        ],
      },
      {
        h: 'Runtime behaviour',
        p: [
          'When a write\u2019s outcome is ambiguous, the execution enters OUTCOME_UNKNOWN — a first-class state, not an error to hide. A governed reconciliation read checks provider state: effect found → RECOVERED with no retry and no duplicate; effect absent → a retry may proceed if the contract declares it safe; still unknown → the step escalates and no automatic retry happens.',
          'Duplicate prevention is therefore honest about its foundations: it holds where reconciliation or provider idempotency exists — and where neither exists, the step is simply not retried automatically. That restraint is the control.',
        ],
      },
      {
        h: 'Failure behaviour',
        p: ['If reconciliation itself cannot determine the outcome, the system does not guess. The step remains OUTCOME_UNKNOWN, escalation opens, and the evidence trail shows exactly how much is known. Bounded retries have explicit limits; exhaustion is a declared terminal state, not a silent loop.'],
      },
      {
        h: 'Evidence / audit behaviour',
        p: ['Reconciliation produces receipts: the read performed, the state found, the decision taken and by which rule. A retried step shows its full ancestry — original attempt, ambiguity, reconciliation, retry — in one causal chain.'],
      },
      {
        h: 'Limitations / claim boundary',
        p: ['Provider idempotency support varies by provider and by endpoint; it is declared per connector in the operational contract, not assumed. The retry-safety model is hermetically proven against simulated providers; per-provider live proof is the staging gate.'],
      },
      {
        h: 'The duplicate-write problem',
        p: [
          'The classic integration failure is the timeout after a write: the provider may have applied it, the caller cannot tell, and a blind retry creates two. The system treats this as a first-class state — OUTCOME_UNKNOWN — with one permitted response: a governed read to find out what actually happened.',
          'Only after reconciliation does the contract decide: effect found → RECOVERED, no retry; effect absent → retry if and only if the manifest declares the capability retry-safe; still unknown → escalate to a human. The retry decision is evidence-led, not timer-led.',
        ],
      },
      {
        h: 'Bounded by contract',
        p: [
          'Retry budgets, backoff and ancestry come from the operational contract per capability, not from global defaults. Attempt 2 names attempt 1 in its fact, so the retry history is reconstructible from the record alone — and exhaustion opens an escalation with full context instead of looping quietly.',
        ],
      },
      {
        h: 'Claim boundary',
        p: [
          'OUTCOME_UNKNOWN handling and reconciliation-before-retry are proven against simulated providers (status item 3). Per-provider live proof is part of the golden-five staging gate — the strongest claim here is hermetic, and it is labelled that way.',
        ],
      },
    ],
  },

  '/security/kill-controls': {
    area: 'Security',
    title: 'Kill & revoke controls',
    tagline: 'One control that outranks every other — scoped kill objects, dual-control restore, and honest semantics about what "stop" means.',
    next: [['/security/failure-behavior', 'Failure behavior'], ['/enterprise/roles-permissions', 'Roles & permissions (restore control)']],
    sections: [
      {
        h: 'Threat / problem',
        p: [
          'Every system that can act needs a way to stop acting — completely, quickly, and ahead of every other signal. The threat is twofold: needing to stop everything right now (a runaway agent, a compromised connection, an incident in progress) and kill abuse (an unauthorized or accidental kill causing an outage of its own).',
          'A kill switch that can be fired by one tired click, or one that quietly loses to a scheduled retry, fails at its only job.',
        ],
      },
      {
        h: 'Control',
        ul: [
          'Kill object with scope — kills are scoped: one connection, one agent, one environment, or the whole tenant. The scope is explicit, never implied.',
          'Precedence — kill outranks approvals, policies, schedules and retries. A valid approval does not survive a kill.',
          'Checked at every dispatch — kill state is evaluated at each dispatch check, the same gate that enforces everything else.',
          'Dual-control restore — restoring after a kill requires a second identity. The person who fired the kill cannot alone un-fire it.',
        ],
      },
      {
        h: 'Runtime behaviour',
        p: [
          'A kill takes effect at the next dispatch check: no new step dispatches against the killed scope. Honest semantics matter here — an in-flight provider call cannot be recalled; it completes and is recorded. "Stop" means nothing new starts and everything in flight is evidenced, not that time runs backward.',
          'Scheduled work is not a loophole: a scheduler can wake an agent, but the dispatch gate still applies — a killed scope stays killed at 3am the same as at 3pm.',
        ],
      },
      {
        h: 'Failure behaviour',
        p: ['The kill path itself fails closed: if the kill service is unavailable and kill state cannot be verified, dispatch does not proceed. A system that cannot confirm it is allowed to act does not act.'],
      },
      {
        h: 'Evidence / audit behaviour',
        p: ['Kills and restores are receipted like any governed action: who fired, what scope, what was in flight, and who provided the second identity for restore. Emergency control is accountable control — the audit trail treats the kill switch as a first-class actor.'],
      },
      {
        h: 'Limitations / claim boundary',
        p: ['Kill semantics are tested in the integrated build; persistent multi-instance enforcement (kill state shared across a deployed fleet) is pending and tracked on Build status. We deliberately do not say "instant" anywhere: the accurate phrase is "at the next dispatch check".'],
      },
      {
        h: 'What kill does and does not stop',
        p: [
          'A kill stops new dispatches at the next dispatch check — the phrase matters, because in-flight provider calls cannot be un-sent; they complete and are recorded, which is the honest behaviour of any system that talks to other people’s infrastructure.',
          'What kill always stops: new work, at every scope it was issued for — connection, workspace, or the whole organisation. Kill outranks approvals, policies and schedules; there is no configuration in which a dispatch proceeds against an active kill.',
        ],
      },
      {
        h: 'Restore is deliberately hard',
        p: [
          'Kill is one-handed because emergencies are; restore is dual-control because quiet re-opening is the dangerous direction. Two authorised identities must both act, and both acts are receipted with actor, scope and time.',
        ],
      },
      {
        h: 'Claim boundary',
        p: [
          'Kill semantics are tested in the integrated build; persistent multi-instance enforcement of the control plane is status item 25 — in progress. The public kill guarantee is stated at the level the build has earned.',
        ],
      },
    ],
  },

  '/security/webhook-security': {
    area: 'Security',
    title: 'Webhook security',
    tagline: 'Forged, replayed and duplicated events are rejected before they become state — and unsigned events are never allowed to act.',
    next: [['/developers/webhooks', 'Webhooks (developer view)'], ['/security/redaction', 'Secret & sensitive-data redaction']],
    sections: [
      {
        h: 'Threat / problem',
        p: [
          'Webhooks are unauthenticated input at internet scale. Forged events can fabricate provider state ("payment succeeded" that never happened); replayed events can double-count effects; duplicated deliveries — which providers send routinely — can corrupt downstream logic; key rotation can lock out legitimate traffic or, worse, leave old keys accepted indefinitely.',
          'The subtlest case is the unsigned provider: real events with no cryptographic proof, indistinguishable from forgery by design.',
        ],
      },
      {
        h: 'Control',
        diagram: 'webhook-pipeline',
        ul: [
          'Signature verification — per-provider algorithm as declared in the connector\u2019s operational contract; no algorithm, no "probably fine".',
          'Timestamp windows — events outside the accepted window are rejected as stale.',
          'Deduplication — delivery keys are deduplicated so provider retries do not double-apply.',
          'Rotating keys — key rotation is supported per provider without accepting retired keys.',
          'Classification — events from setups where a customer API key acts as the secret are classified and handled accordingly; unsigned providers form their own explicitly-labelled class.',
        ],
      },
      {
        h: 'Runtime behaviour',
        p: [
          'Every inbound event carries a verification label into the pipeline: verified, unsigned, or rejected. The label travels with the event everywhere it goes — downstream systems can always tell provenance.',
          'The hard rule: an unsigned event never triggers MODE ≥ 2 behavior. It can inform; it cannot act. A "payment received" webhook without a signature can update a dashboard, but it will never, by itself, cause a governed write.',
        ],
      },
      {
        h: 'Failure behaviour',
        p: ['Bad signature → rejected and recorded. Stale timestamp → rejected and recorded. Duplicate delivery → deduplicated, with the duplicate recorded. There is no path where a suspicious event is accepted "just in case" — ingestion fails closed.'],
      },
      {
        h: 'Evidence / audit behaviour',
        p: ['Ingestion receipts record what arrived, what verification was applied, and what was decided — for rejections and duplicates as well as acceptances. The rejection log is the audit trail for attacks that never made it in.'],
      },
      {
        h: 'Limitations / claim boundary',
        p: ['The verification and replay framework exists in the integrated build; provider-specific signature algorithms and durable dedupe storage are in progress and tracked on Build status. Where a provider offers no signing, we say so — we do not launder unsigned events into "verified".'],
      },
      {
        h: 'Why "unsigned" is a label, not a rejection',
        p: [
          'Many providers send valuable events without signatures, or with schemes that rotation occasionally breaks. Dropping all unsigned events would blind the Observe stage; trusting them would let anyone on the internet write into your operations. The third option is the label: unsigned events may inform observation and correlation, and may never authorise anything.',
          'This is the inbound mirror of the outbound rule: just as the OAL cannot write, an unverified event cannot cause a write. Trust is earned by verification, and the label is on the record either way.',
        ],
      },
      {
        h: 'Replay and dedupe',
        p: [
          'Inbound events carry a dedupe key; a replayed or double-delivered event resolves to the same record. The replay framework exists in the integrated build; provider-specific signature algorithms and durable dedupe storage are tracked as item 22 on the build status page — in progress, not claimed complete.',
        ],
      },
      {
        h: 'Claim boundary',
        p: [
          'Webhook verification is implemented against the manifest-declared schemes and exercised hermetically. Per-provider algorithm coverage is completed connector by connector as they qualify for staging, and shown per connector — not asserted catalogue-wide.',
        ],
      },
    ],
  },

  '/security/redaction': {
    area: 'Security',
    title: 'Secret & sensitive-data redaction',
    tagline: 'Secrets and sensitive values are removed before facts exist — the evidence trail can never leak what it never saw.',
    next: [['/security/credential-isolation', 'Credential isolation'], ['/security/receipts-verification', 'Receipts & verification']],
    sections: [
      {
        h: 'Threat / problem',
        p: [
          'Evidence systems have an uncomfortable tendency to become leak channels: a token echoed in an error body, a PAN in a logged request, an Authorization header preserved "for debugging". The record built to prove security becomes the thing that breaks it.',
          'The risk compounds in agentic systems because facts and receipts flow to more places — dashboards, auditors, verifiers — than raw logs ever did.',
        ],
      },
      {
        h: 'Control',
        ul: [
          'Redaction before emission — a redaction profile is applied in the engine before any fact is emitted; sensitive material is stripped at the source, not filtered later downstream.',
          'Digest-only evidence — where content must be referenced, receipts carry digests, never payloads.',
          'Secret-returning-read flag — capabilities that return secrets (token introspection, key retrieval) are flagged in Manifest 1.3; their outputs are digest-only by contract.',
          'Pattern coverage — PAN, IBAN, payment links, JWTs and provider token formats are matched by published patterns.',
        ],
      },
      {
        h: 'Runtime behaviour',
        p: [
          'Redaction runs inside the Execution Engine, upstream of both the OAL and the evidence path. By the time a fact exists, it has already been redacted — the reasoning layer and the receipt pipeline never handle unredacted material at all.',
          'Error bodies get the same treatment: a provider error that echoes the request\u2019s credentials is redacted before it becomes part of any record. What the evidence trail stores is that an error occurred and its classified shape — not the secret it happened to contain.',
        ],
      },
      {
        h: 'Failure behaviour',
        p: ['A value that matches no known pattern but is classified sensitive by the capability contract is treated as sensitive — the contract outranks the pattern list. Where classification is unavailable, the conservative default applies.'],
      },
      {
        h: 'Evidence / audit behaviour',
        p: ['Receipts record which redaction profile was applied (redaction.profile), so a verifier knows the evidence was sanitised under a named, versioned profile. The audit trail proves redaction happened; it does not contain what was redacted.'],
      },
      {
        h: 'Limitations / claim boundary',
        p: ['The pattern list is published and grows per provider, but redaction is not a DLP product: it is a boundary for secrets and defined sensitive classes in the execution evidence path, not a general content-classification service. That boundary is stated, not inflated.'],
      },
      {
        h: 'What gets redacted, and when',
        p: [
          'Redaction happens before emission, not before storage-of-everything: provider error bodies, response payloads and any field the manifest marks sensitive are reduced before they enter the evidence path. The record keeps the classification, the status, the digests — and drops the content. An audit trail that stores secrets is a liability; one that stores proof without content is an asset.',
          'Digest-only results apply to secret-returning reads: if a capability legitimately reads a token or key from a provider, the fact records its digest and metadata, never the value. Verification can then prove "the same secret" without the secret ever touching the trail.',
        ],
      },
      {
        h: 'What redaction is not',
        p: [
          'This is not a DLP product. Redaction here is a property of the evidence path — what the platform itself records — not a scanning layer over your data. Provider content your agents legitimately read is returned to your agent; what changes is what the platform’s own records retain about it.',
        ],
      },
      {
        h: 'Failure posture',
        p: [
          'If the redaction rules for a payload cannot be evaluated, the payload is treated as sensitive: classified status and digests are recorded, content is dropped. Redaction fails toward recording less, never more.',
        ],
      },
      {
        h: 'Claim boundary',
        p: [
          'Redaction-before-emission and digest-only handling are implemented in the evidence path of the integrated build and exercised hermetically. Coverage per provider surface is completed connector by connector as they qualify for staging; the catalogue shows verification status per connector rather than asserting blanket coverage.',
        ],
      },
    ],
  },

  '/security/receipts-verification': {
    area: 'Security',
    title: 'Receipts & verification',
    tagline: 'Evidence that proves the record — and an honest account of what that proof does and does not cover.',
    next: [['/product/receipts-audit', 'Receipts & Audit (canonical)'], ['/developers/receipts', 'Receipts (developer reference)']],
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
        h: 'Threat / problem',
        p: [
          'If evidence can be forged, every assurance built on it is theatre. The threats: a receipt generated to match a desired story rather than actual events, an agent\u2019s own narration accepted as proof, records silently edited after the fact, and gaps in a sequence presented as completeness.',
          'The deepest version is self-attestation: a system grading its own homework and calling the grade independent.',
        ],
      },
      {
        h: 'Control',
        ul: [
          'Independent evidence path — facts flow from the execution layer to the Evidence Client and R-Series; the reasoning layer cannot write to it.',
          'Signed receipts — R-Series signs each receipt; the causal chain links receipts per run with signed parent references.',
          'Verifier — a verifier checks signature and lineage, confirming the record is what R-Series issued and has not been altered.',
          'Outcome/state separation — execution outcome and receipt state are separate fields; a failed execution still gets a receipt, and a missing receipt is itself visible.',
        ],
      },
      {
        h: 'Runtime behaviour',
        p: [
          'Every attempt emits an execution fact; every fact produces exactly one cos-ops receipt. Verification answers two distinct questions: the signature proves the record (this receipt was issued by R-Series and is unaltered), and the provider evidence within proves the effect (the provider accepted the call; where verifiable, the intended state occurred).',
          'A receipt that says an execution failed is as valuable as one that says it succeeded — often more so. The system does not grade outcomes; it proves records.',
        ],
      },
      {
        h: 'Failure behaviour',
        p: ['Receipt failure is surfaced, never hidden: receipt state FAILED is a declared state visible wherever the receipt is shown. Per-tenant policy decides the execution consequence — receipt-required action classes block when the receipt path is down; other executions proceed with receipt PENDING.'],
      },
      {
        h: 'Evidence / audit behaviour',
        p: ['The verification trail is itself auditable: which verifier version checked which receipt against which key. Historical verification — re-checking old receipts later — is part of the design, because evidence that cannot be re-verified is a snapshot, not a record.'],
      },
      {
        h: 'Limitations / claim boundary',
        p: ['Verification today trusts the R-Series key — receipts are signed with a software test signer in the integrated build, and production key custody (KMS/HSM) is a launch gate. No external audit or independent review is claimed; an independent exact-SHA review precedes any such claim. "Independently verifiable" means verifiable with the R-Series verifier against the published key — nothing more is asserted.'],
      },
      {
        h: 'What the verifier checks',
        p: [
          'Verification is mechanical, not testimonial: the signature over the receipt body, the recomputed digests of plan, intent and input evidence, the causal chain (every parent resolves, sequence contiguous), and the verification fields against the declared method. The verifier runs offline — trust comes from recomputation, not from the platform’s say-so.',
        ],
      },
      {
        h: 'Signer posture',
        p: [
          'Receipts today are signed with a software test signer (status item 18); production key custody — a KMS/HSM-backed signer — is a launch gate. No external audit is claimed. The receipt schema reserves a signature-suite field so that a future suite change is read from the receipt itself, never typed into copy.',
        ],
      },
      {
        h: 'What verification does not prove',
        p: [
          'A verified receipt proves the record is intact and internally consistent — that this chain says this happened. It does not by itself prove the provider behaved well, or that the policy was wise. Evidence answers "what occurred and who authorised it"; judgement remains human.',
        ],
      },
    ],
  },

  '/security/audit-history': {
    area: 'Security',
    title: 'Audit history',
    tagline: 'Tamper-evident history with sequence numbers and signed links — gaps and edits are detectable, not just unlikely.',
    next: [['/enterprise/audit-governance', 'Audit & governance (enterprise view)'], ['/product/receipts-audit', 'Receipts & Audit (canonical)']],
    sections: [
      {
        h: 'Threat / problem',
        p: [
          'Audit trails fail in two quiet ways: records altered after the fact (a deleted line, an edited outcome) and records that were never written (a gap presented as a quiet afternoon). Both are invisible in systems where history is just rows someone can modify.',
          'For agentic systems the stakes rise: the audit trail is the only account of what software did unsupervised at 3am.',
        ],
      },
      {
        h: 'Control',
        ul: [
          'Hash-linked, signed receipts — each receipt is signed and linked to its predecessors; altering one record breaks the chain.',
          'Sequence numbers per stream — every stream of receipts is numbered; a missing number is a detectable gap, not a mystery.',
          'Causal links — receipts reference the plan, approval and execution that caused them, so reconstruction follows structure, not guesswork.',
        ],
      },
      {
        h: 'Runtime behaviour',
        p: [
          'History is append-structured: new receipts extend chains; nothing rewrites them. Verification of a chain re-checks signatures, links and sequence continuity — a tampered record fails verification, and a removed record fails continuity.',
          'This is what "tamper-evident" means here, precisely: modification and deletion are detectable by verification. We do not claim tamper-proof storage, external anchoring or third-party notarisation.',
        ],
      },
      {
        h: 'Failure behaviour',
        p: ['A gap in a sequence is itself evidence — the missing number is visible in the stream. Where the evidence path is degraded, receipt state (PENDING, FAILED) makes the incompleteness explicit rather than letting a partial history pose as a whole one.'],
      },
      {
        h: 'Evidence / audit behaviour',
        p: ['The audit history spans plans, policy decisions, approvals, executions, retries, reconciliation, recovery, and administrative actions — kills, suspensions, role and policy changes. Administrative actions are receipted like agent actions; the people running the system are inside the audit model, not above it.'],
      },
      {
        h: 'Limitations / claim boundary',
        p: ['No external anchoring claim is made today: chains are verifiable against the R-Series key, and an independent review precedes any stronger assurance language. Receipt-store tenant isolation is a release gate under remediation, tracked publicly.'],
      },
      {
        h: 'Append-only, continued never edited',
        p: [
          'The audit trail is a causal chain: each record links its parent, sequences are contiguous, and a deleted or reordered link fails verification. History is continued by new records — corrections are new entries, not edits — so the trail shows what was believed at the time, which is exactly what an audit needs.',
        ],
      },
      {
        h: 'What is in the trail',
        ul: [
          'plans, policy decisions with versions, refusals with reason codes',
          'approvals: requested, granted, denied, expired, revoked, consumed',
          'execution attempts with outcomes and verification status',
          'recovery, reconciliation and escalation records',
          'operator actions: kills, restores, policy and connection changes',
        ],
      },
      {
        h: 'Claim boundary',
        p: [
          'The trail is tamper-evident — alteration breaks the chain and fails verification. We do not claim external anchoring or third-party audit of the history; the integrity property is structural and checkable offline.',
        ],
      },
      {
        h: 'Retention and the founder decision',
        p: [
          'Raw-evidence retention — whether provider response material is held customer-local or platform-side — is founder decision FD-2, pending. What is settled: the digest-and-chain layer of the trail is complete regardless of that ruling, because verification depends on digests and links, not on where raw bytes live.',
        ],
      },
      {
        h: 'Anatomy of one entry',
        p: [
          'Every trail entry carries the actor, the tenant and workspace, the object touched, the before/after where meaningful, the timestamp, and the causal parent. The parent link is the property that matters: it is what turns a log into a chain, and a chain into something an auditor can verify rather than merely read.',
        ],
      },
      {
        h: 'Reading a chain during an incident',
        p: [
          'During an incident the chain is the first artifact, not the last: open the run, walk parent links backwards from the failure to the approval and the plan, and the question "how was this allowed" answers itself with citations. Post-incident reviews built on the chain produce policy changes with evidence attached — which then appear in the same trail.',
        ],
      },
    ],
  },

  '/security/failure-behavior': {
    area: 'Security',
    title: 'Failure behavior',
    tagline: 'When any component goes down, the default is refusal — a published table, not a runtime surprise.',
    next: [['/security/kill-controls', 'Kill & revoke controls'], ['/product/reliability-recovery', 'Reliability & Recovery (canonical)']],
    sections: [
      {
        h: 'Threat / problem',
        p: [
          'Every control system eventually faces its own outage: the policy service is down, the approval path is degraded, the kill state cannot be read, the receipt pipeline is unavailable, the database is unreachable, the provider is gone. The question that defines the security posture is what happens by default.',
          'Systems that "degrade gracefully" toward permissiveness are failing open with better marketing. Connector OS fails closed, per a published table.',
        ],
      },
      {
        h: 'Control — the fail-closed table',
        table: {
          head: ['Component down', 'Behavior', 'Why'],
          rows: [
            ['Policy service', 'No dispatch — unevaluated steps are refused', 'An unchecked step is an ungoverned step'],
            ['Approval path', 'Approval-required steps wait; nothing self-approves', 'Unverifiable approval = no approval'],
            ['Kill service', 'No dispatch — kill state must be verifiable', 'Cannot confirm allowed = not allowed'],
            ['Identity provider', 'Human actions pause; machine policy continues', 'People cannot be re-verified mid-outage'],
            ['Receipt service', 'Receipt-required classes block; others proceed with receipt PENDING', 'Per-tenant policy (FD-1) decides'],
            ['Database', 'Dependent control-plane actions refuse', 'State cannot be trusted unverified'],
            ['Provider', 'PROVIDER_UNAVAILABLE declared; monitored; recovered on return', 'Declared beats pretending'],
          ],
        },
      },
      {
        h: 'Runtime behaviour',
        p: [
          'The table is enforced at the dispatch gate — the same choke point that checks tenant, kill state, policy and approval. Each dependency is verified at the moment it matters, not assumed from a health check minutes ago.',
          'Degraded states are declared states: they appear in execution records, receipts and status surfaces as themselves. Nothing is retried into a different truth.',
        ],
      },
      {
        h: 'Failure behaviour',
        p: ['The failure of a failure handler gets the same treatment: if the component that records a refusal is down, the step does not proceed either. There is no level of nesting at which the answer becomes "just run it".'],
      },
      {
        h: 'Evidence / audit behaviour',
        p: ['Every refusal is receipted with the component that was unavailable and the rule that fired. Outage reviews can therefore reconstruct not just what stopped, but which control made the call and whether the table was followed.'],
      },
      {
        h: 'Limitations / claim boundary',
        p: ['Crash/restart, reconciliation, stolen-lease, blast-radius and inbound-firewall drills are proven hermetically; full infrastructure-outage drills are pending and tracked on Build status. The receipt-service policy (FD-1) is per tenant — defaults are documented, not universal.'],
      },
      {
        h: 'The design rule',
        p: [
          'Every component on the governed path has the same failure posture: when it cannot see clearly, it refuses. The table above enumerates the components; the rule behind all rows is that degraded guardrails mean reduced latitude, never increased latitude. An agent whose policy service is down is an agent that waits.',
        ],
      },
      {
        h: 'Degradation is visible, not silent',
        p: [
          'Each failure mode emits an event on the record — the system does not merely stop, it says that it stopped and why. Operator-facing surfaces show the degraded component; the receipt pipeline’s own failures are a visible state (PENDING / FAILED) rather than a hidden backlog.',
        ],
      },
      {
        h: 'Drills',
        p: [
          'Crash/restart, stolen-lease, blast-radius and inbound-firewall drills are proven hermetically (status item 23); infrastructure-outage drills are pending staging infrastructure. The distinction between "tested in simulation" and "tested against real failure" is maintained in the copy everywhere this page is summarised.',
        ],
      },
    ],
  },
}
