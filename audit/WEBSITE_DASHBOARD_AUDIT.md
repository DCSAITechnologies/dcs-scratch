# Connector OS — website + dashboard audit

**Date:** 02 Oct 2026 · **Scope:** `CONNECTOR_OS_WEBSITE_DASHBOARD_1000_FINAL (5).zip` (baseline commit `f0ba35b`) → branch `claude/new-session-e3y98d`
**Companion documents:** `CATALOGUE_RECONCILIATION.md` · `DASHBOARD_WIRING_MATRIX.md` · `WEBSITE_ROUTE_MATRIX.md` · `FIX_PLAN.md` · `FINAL_RETURN.md`

> **Later pass (02 Oct):** this document records the first audit. Work since then is summarised in `HANDOFF.md` (current state) and `FINAL_RETURN.md` (numbers):
> - API mode with a typed client and an auth seam
> - API-backed console pages and wired mutations
> - the contact form
> - accessibility, with zero axe violations
> - a responsive/zoom matrix
> - bundle splitting
> - host rules and CSP
> - a security sweep
>
> Two items in the tables below are superseded. `/contact` and `/enterprise/contact` now carry a working form. The enterprise page always published enterprise@ and developers@dcslabs.dev; the first audit missed that.

## Answers to the brief's nine questions

| # | Question | Answer |
|---|---|---|
| 1 | Does the website accurately represent the product? | **Mostly, after fixes.** The long-form copy is carefully hedged (claim level HERMETIC, test signer, no certifications). The inaccuracies were in data plumbing and UI chrome: stale "750" meta, a 1000 headline over 868 cards, 9 broken homepage cards, HOLD records readable by URL, a do-nothing credential form, "Free to start", "Join the waitlist", "Notify me". All are fixed. |
| 2 | Does the dashboard cover the full operator/developer workflow? | **Structurally yes** (25 route patterns spanning catalogue → connections → runs → policies → approvals → executions → receipts → events → kill → environments → developer → usage → team → audit → settings). **Functionally no:** there is no API client and no auth, every operational page reads fixtures, and the only enabled actions are 3 navigation links. |
| 3 | Is the catalogue the current authoritative one? | **No.** It is a frozen snapshot of the factory 1000 (`factory/a-f01@28bfc79`). The core repo was not reachable from this session; `npm run reconcile -- --core <path>` performs the comparison. |
| 4 | Why are OpenAI / Anthropic absent? | They are not in the factory 1000 identity list. They exist only as Lane 6 legacy reference rows (KEEP_REFERENCE / PRESERVE). The same is true of GitHub, Slack, Notion, Stripe, Salesforce and others; Gmail and Jira exist in neither dataset. Core ships at least GitHub as a golden connector, so core ≠ snapshot. |
| 5 | Why 868 and not 1000? | Publication policy: 132 rows are `unpublished` HOLD (provider terms, health data, minors' data, FCRA, …). The bug was the headline, not the grid. |
| 6 | Reconcile to ~1010 | **Blocked on access to core.** Tooling, procedure and bucketing are in place; no counts were hand-edited. |
| 7 | Mock vs wired | Public site: static content plus bundled JSON (no backend needed). Console: 100% fixture/snapshot; see `DASHBOARD_WIRING_MATRIX.md`. |
| 8 | Missing before staging | Core reconciliation, an API client + auth on `/app`, a contact/waitlist capture mechanism, host rules (410s, SPA fallback), an accessibility scan. See `FIX_PLAN.md`. |
| 9 | Fix what is safe | Done in 7 commits after the baseline import. Every code fix is covered by a gate or e2e test; the before/after runs are in `FINAL_RETURN.md` §2. |

## Defects found and fixed (all verified)

| # | Severity | Defect | Fix | Evidence |
|---|---|---|---|---|
| 1 | P0 | `npm ci` fails: 125 lockfile tarballs resolve to private mirror `npm.mirrors.msh.team` | host rewritten to registry.npmjs.org (integrity unchanged) | `npm ci` green |
| 2 | P0 | 53 published alias rows (9 on the homepage) render "Connector not found"; alias rows had no static shell | `resolvePublic`; alias shells + alias-id redirects | e2e alias tests (all 53) |
| 3 | P0 | HOLD rows render full content on a direct URL | "not publicly listed" notice | e2e HOLD test |
| 4 | P0 | Prerender meta says "750 catalogued connectors" | derived counts; stale-count gate | gate red on baseline, green now |
| 5 | P0 | `/connectors` H1 "1000" over 868 cards | published count + breakdown | e2e counts test |
| 6 | P0 | `/signin` email/password form wired to nothing; "Free to start / No credit card required" | pre-launch page, no inputs | e2e sign-in test |
| 7 | P0 | Console "Real-time view", green "Fresh" dot, "All systems operational" over fixtures | removed / reworded | gate C7 red on baseline |
| 8 | P0 | Console "Request access" labelled WIRED, enabled, no handler | navigates to contact | gate C7 + e2e |
| 9 | P1 | Console catalogue capped at the first 60 rows | 50/page pagination over all rows, filters retained | e2e pagination |
| 10 | P1 | Console search ignored a second query while on `/app/connectors` | route re-mounts on query; `searchTarget()` | e2e stale-query test |
| 11 | P1 | "openai"/"anthropic" in console search → silent empty table | legacy-reference hint with links | e2e |
| 12 | P1 | HOLD rows indistinguishable from published in console | Publication column + filter; engineering/dispatch/alias facts on detail | e2e publication filter |
| 13 | P1 | `/developers/status` had no prerendered shell (static-host 404) | extractor accepts template literals; fails on any miss | e2e subpage-shell test |
| 14 | P1 | Console shells indexable | `noindex` + `Disallow: /app` | e2e |
| 15 | P2 | Overview donut showed 6 runs vs a 5-run store; typed-in 67% / 98.5% | derived from fixture stores | code review + gate |
| 16 | P2 | `/` overflowed 83 px and `/connectors` 31 px at 390 px | explicit `grid-cols-1` | e2e responsive |
| 17 | P2 | `/contact` and `/enterprise/contact` share a title | "Enterprise contact" | e2e titles |
| 18 | P2 | Re-running prerender stacked duplicate meta tags | idempotent injection | e2e one-description test |
| 19 | P2 | Nav category links ignored the category; labels ≠ data categories | `?cat=` deep links mapped to real categories | e2e |
| 20 | P2 | Public status filter offered "HOLD" (always empty); search ignored ids | filters from published rows; id search | e2e |
| 21 | P2 | Redirect copy called legacy targets "canonical"; redirects listed in sitemap | neutral copy; sitemap excludes redirects | legacy-route gate |
| 22 | P2 | Router comment "24 routes" (actual 25) | gate C6 counts mechanically | gate C6 |
| 23 | P3 | Pricing CTAs promised a waitlist; connector CTA promised notification | "Launch status" | e2e |
| 24 | P3 | "Regions: Global" and "verified provider surfaces" unsupported | removed / reworded | review |

## Route audit — public website

Implementation for all subpages is `SubPageLayout` driven by `src/lib/subpages*.ts`, with content in TS objects. Data source is static copy unless noted. Owner "site" = this repo; "core" = connector-os-read-api; "founder" = decision needed.

| Route | Purpose | Implementation / data | Maturity | Missing / fix required | Owner | Evidence |
|---|---|---|---|---|---|---|
| `/` | landing | `Home.tsx`; published catalogue for strips; `platform-status.json` vocab | static | fixed: alias cards, counts, overflow, receipts chip | site | e2e links, responsive |
| `/product` + 6 subpages | product model | `Product.tsx` + `subpages.ts` | static | none found | site | e2e links/titles |
| `/connectors` | catalogue | `Connectors.tsx` ← `PUBLISHED_CONNECTORS` + legacy reference section | SNAPSHOT | **reconcile with core**; HOLD display policy (founder); a11y of `FilterSelect` | core / founder / site | e2e catalogue suite |
| `/connectors/:id` | connector detail | `ConnectorDetail.tsx` ← `resolvePublic` + legacy map | SNAPSHOT | true 410/301 need host rules | site/deploy | e2e routing suite, route smoke |
| `/agents` + 7 | OAL model | `Agents.tsx` + `subpages-agents.ts` | static | none found | site | e2e |
| `/security` + 12 | security model | `Security.tsx` + `subpages-security.ts` | static, hedged ("tamper-evident", no certification) | external security review (status item 29) before stronger claims | core | e2e + claim sweep |
| `/receipts` | receipt explainer | `Receipts.tsx`, illustrative hermetic run | static | none | site | e2e |
| `/enterprise` + 8 | operating model | `Enterprise.tsx` + `subpages-enterprise.ts` | static | `/enterprise/contact` has no capture mechanism or address | founder | e2e |
| `/pricing` | plans, no numbers | `Pricing.tsx` | static | waitlist/contact mechanism (founder) | founder | e2e |
| `/developers` + 16 | developer hub | `Developers.tsx` + `subpages-developers.ts`, `devex-matrix.json`, `/devportal/*.md` | static snapshot of core docs | re-sync DevEx matrix / API docs with current core OpenAPI | core | e2e |
| `/developers/status` | build status | `platform-status.json` (claim HERMETIC, as_of 2026-09-27) | static snapshot | fixed: no shell. Keep JSON in sync with core status | core | e2e |
| `/docs` | alias | client redirect → `/developers` | static | server-side 301 at deploy | deploy | e2e |
| `/signin` | entry | `SignIn.tsx` | **PRE-LAUNCH** | real IdP sign-in (status item 19) | core | e2e |
| `/about`, `/contact`, `/privacy`, `/terms` | company/legal | `subpages-company.ts` | static | `/contact` publishes no channel; legal text not reviewed in this audit | founder | e2e |
| 404 | not found | `NotFound` in `App.tsx`, `dist/404.html` | static | none | site | e2e |

## Route audit — dashboard (`/app`)

Every row: implementation `src/pages/dash/*` inside `DashShell`, no auth, data from `src/lib/fixtures.ts` unless noted. Per-action detail is in `DASHBOARD_WIRING_MATRIX.md`.

| Route | Purpose | Data source | Maturity | Missing / fix required | Owner | Evidence |
|---|---|---|---|---|---|---|
| `/app` | operations overview | fixtures (derived figures) | HERMETIC | API client; real freshness | site + core | e2e routes, truthfulness |
| `/app/connectors`, `/:id` | catalogue (operator view) | bundled JSON | SNAPSHOT | wire `GET /v1/connectors` (contract WIRED); eligibility | site | e2e pagination/search |
| `/app/connections`, `/new`, `/:id` | connection lifecycle | fixtures (simulators) | HERMETIC | connection store, vault, OAuth apps | core / external | e2e routes |
| `/app/tools` | discovered tools | fixtures | HERMETIC | no contract operation | core | e2e routes |
| `/app/agents`, `/runs/:id` | runs | fixtures | HERMETIC | OAL run-state store | core | e2e routes |
| `/app/policies`, `/:id` | policies | fixtures | HERMETIC | policy store; authoring PLANNED | core | e2e routes |
| `/app/approvals`, `/:id` | human gate | fixtures | HERMETIC | approval store + IdP | core | e2e routes |
| `/app/executions`, `/:id` | execution ledger | fixtures | HERMETIC | execution ledger | core | e2e routes |
| `/app/receipts`, `/:id` | evidence | fixtures (test signer) | HERMETIC | authenticated R-Series route, verifier | core | e2e routes |
| `/app/events` | inbound/outbound events | fixtures | HERMETIC / PLANNED | eventbus persistence; outbound delivery FD-L5-1 | core / founder | e2e routes |
| `/app/security` | kill / leases | fixtures | HERMETIC | kill store + IdP | core | e2e routes |
| `/app/environments` | env roll-up | fixtures | HERMETIC | wire `GET /v1/environments` (WIRED) | site | e2e routes |
| `/app/developer` | API keys | fixtures | PLANNED | key issuance (Lane 3) | core | e2e routes |
| `/app/usage` | counts | fixtures | HERMETIC | ledger aggregates | core | e2e routes |
| `/app/team` | members/roles | fixtures | PLANNED | IdP | core / external | e2e routes |
| `/app/audit` | audit log | fixtures | HERMETIC / PLANNED | no list endpoint; exports PLANNED | core | e2e routes |
| `/app/settings` | org config | static | PLANNED | no contract operation | core | e2e routes |

## Cross-cutting areas (brief §10 A–O)

| Area | Status |
|---|---|
| A Catalogue freshness | snapshot; reconcile with `--core` (blocked on access) |
| B 868 vs full | explained; display policy needs a founder decision; headline fixed |
| C OpenAI / Anthropic | legacy reference only; discoverable via search, card and hint; not promoted |
| D Other major providers | all legacy reference (Gmail and Jira absent from both); table in reconciliation §2 |
| E Console 60-row cap | fixed (pagination) |
| F Logos | 340 canonical / 289 published / 160 legacy without a logo field; every set path exists; monogram fallback renders |
| G Route count | 25 patterns, mechanically gated (C6) |
| H Fixtures vs API | fully mapped in the wiring matrix |
| I Search | id-prefix routing, exact canonical id, query preserved in URL, legacy hint, Escape/⌘K tested. Unknown ids → detail not-found states. No loading/error states because nothing is fetched. |
| J Connection flow | simulator-only; needs manifest-driven auth scheme from `GET /v1/connectors/{id}`, vault, OAuth apps |
| K Actions | 45 actions all disabled except 3 navigations; confirmations, guards, idempotency and receipts are specified per action in the wiring matrix, none implemented |
| L Auth / session | **absent**; `/app` is public (now noindex). Required before any staging exposure with real data. |
| M Data states | preview-only via `?state=`; real states arrive with the API client |
| N Developer experience | devportal docs and the DevEx matrix are snapshots of core; re-sync required |
| O Claims / maturity | no UI claims production-verified, available, or cryptographically verified; liveness claims removed; gates C3/C7/G10 enforce this |
