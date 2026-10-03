# Website route matrix — public, static and dynamic routes

## 0. Update: 03 Oct 2026 (core-derived catalogue + previews)

Measured from `dist/` after `npm run build && npm run prerender`:

| Item | Now | Was (02 Oct) | Why |
|---|---|---|---|
| Prerendered shells | **1419** (`dist/**/index.html`) | 1482 | Catalogue regenerated from core: 809 published canonical pages (was 868), because core founder holds and BLOCKED rows are now held. Plus 5 noindex preview shells. |
| Sitemap URLs | **1303** = 63 static + 809 published canonical + 431 preserved legacy | 1367 | Same reason. Five legacy surfaces (github, slack, notion, stripe, linear) became canonical rows. Previews are excluded. |
| Host rules | 157 lines in `_redirects`; `/preview/*` and `/app/*` carry `X-Robots-Tag: noindex` in `_headers` | 156 | — |
| Preview routes | `/preview/home`, `/preview/heroes`, `/preview/hero-a\|b\|c`: noindex meta + header, `Disallow: /preview`, unlinked | — | Founder hero review (`HERO_CONCEPTS.md`) |
| Major providers | github, gmail, slack, notion, stripe and linear are published canonical pages. openai, anthropic, azure-openai and google-gemini are preserved legacy reference pages. Each resolves as exactly one of the two. | — | legacy-route gate + `public.spec.ts` |
| Logos | Every logo path is site-absolute (387 rows fixed); `validate-catalogue` fails on a relative path | — | Nested routes were resolving `connectors/logos/…` and falling back to monograms |
| Route smoke | canonical + 474 legacy preserved routes return 200 | 479 | — |

Section 2 below was generated on 02 Oct. Its per-route structure is unchanged; the counts above supersede its totals.

**Date:** 02 Oct 2026. The per-route rows in §2 are generated from `dist/` after `npm run build && npm run prerender`.

## 1. Evidence behind each column

| Column | How it was checked | Result |
|---|---|---|
| Route exists | router (`src/App.tsx`) + every subpage key in `src/lib/subpages*.ts` | 11 main routes, 53 subpages: 6 product · 7 agents · 12 security · 8 enterprise · 16 developers · 4 company |
| Prerendered | `dist/<route>/index.html`; e2e `every subpage route … has a prerendered shell` | **all 64 static** after fixes. Baseline missed `/developers/status`. |
| Links valid | e2e `every internal link on every static page resolves`: crawls all 64 pages, then visits every unique internal href and fails on the 404 / "Connector not found" / console-404 text | green. Baseline red: alias cards on `/` |
| SEO / meta | e2e: unique `<title>` and exactly one meta description per static page; canonical + OG injected by prerender; console and redirect shells `noindex`; `robots.txt` disallows `/app`; sitemap lists 1367 URLs = 63 static (all but `/docs`) + 868 published canonical (alias rows included) + 436 preserved legacy; no redirects, no console | green. Baseline: duplicate `/contact` title; stale "750" counts; console indexable |
| Mobile | e2e: no horizontal overflow at 390 px and 820 px on `/`, `/connectors`, `/connectors/openai`, `/security`, `/developers`, `/pricing`, `/app`, `/app/connectors`, `/app/executions` | green. Baseline: `/` overflowed 83 px, `/connectors` 31 px |
| Accessibility | **partial.** Keyboard: Tab reaches catalogue search and typing filters (e2e); ⌘K + Escape in the console (e2e); `lang="en"`; logo `alt` text; console tables use real `<table>`/`<th>`. **No automated axe/WCAG scan was run.** | see §3 |
| Truthful claims | regex sweep of all copy for real-time / live / operational / verified / certified / percent claims; gates C3/C7 (dashboard) and G10 (status vocabulary) | fixed items in §4; public copy otherwise consistently hedged (HERMETIC claim level, "no certification claimed") |
| Source data current | catalogue counts derived from `connectors.json` everywhere (stale-count gate). Status from `platform-status.json` (as_of 2026-09-27) | the **catalogue itself is a snapshot**, not reconciled to core; see `CATALOGUE_RECONCILIATION.md` |

## 2. Static routes

| Route | Prerendered | Sitemap | Title (prerender) | Desc | Mobile 390/820 | Notes |
|---|---|---|---|---|---|---|
| `/` | yes | yes | DCS Connector OS — Governed execution for AI agents | 163 | ✓ | **fixed:** 9 alias cards broke; mobile overflow; counts |
| `/product` | yes | yes | Product — Connector OS | 80 | — |  |
| `/connectors` | yes | yes | Connector catalogue — 868 published connectors — DCS Connector OS | 183 | ✓ | **fixed:** counts derived; `?q=`/`?cat=` deep links; mobile overflow |
| `/agents` | yes | yes | Agents — the Operations Agent Layer — DCS Connector OS | 80 | — |  |
| `/security` | yes | yes | Security — twelve controls — DCS Connector OS | 115 | ✓ |  |
| `/receipts` | yes | yes | Receipts — what a receipt is — DCS Connector OS | 104 | — |  |
| `/enterprise` | yes | yes | Enterprise — the operating model — DCS Connector OS | 112 | — |  |
| `/pricing` | yes | yes | Pricing — Connector OS | 73 | ✓ | **fixed:** CTAs relabelled (no waitlist exists) |
| `/developers` | yes | yes | Developers — build against the governed path — DCS Connector OS | 84 | ✓ |  |
| `/docs` | yes | no | Developers — Connector OS | 34 | — | client redirect → /developers; not in sitemap |
| `/signin` | yes | yes | Sign in — Connector OS | 107 | — | **fixed:** credential form removed |
| `/product/how-it-works` | yes | yes | How Connector OS works | 102 | — |  |
| `/product/execution-layer` | yes | yes | The Execution Layer — DCS Connector OS | 77 | — |  |
| `/product/policies-approvals` | yes | yes | Policies & Approvals — DCS Connector OS | 81 | — |  |
| `/product/receipts-audit` | yes | yes | Receipts & Audit — DCS Connector OS | 96 | — |  |
| `/product/reliability-recovery` | yes | yes | Reliability & Recovery — DCS Connector OS | 109 | — |  |
| `/product/architecture` | yes | yes | Architecture — DCS Connector OS | 96 | — |  |
| `/agents/lifecycle` | yes | yes | The agent lifecycle — DCS Connector OS | 63 | — |  |
| `/agents/governance` | yes | yes | Agent governance — DCS Connector OS | 94 | — |  |
| `/agents/policies` | yes | yes | Policies for agents — DCS Connector OS | 97 | — |  |
| `/agents/approvals` | yes | yes | Human approvals — DCS Connector OS | 68 | — |  |
| `/agents/executions` | yes | yes | Agent executions — DCS Connector OS | 50 | — |  |
| `/agents/recovery` | yes | yes | Agent recovery — DCS Connector OS | 79 | — |  |
| `/agents/use-cases` | yes | yes | Agent use cases — DCS Connector OS | 101 | — |  |
| `/security/credential-isolation` | yes | yes | Credential isolation — DCS Connector OS | 120 | — |  |
| `/security/tenant-boundaries` | yes | yes | Tenant boundaries — DCS Connector OS | 116 | — |  |
| `/security/routing-egress` | yes | yes | Routing & egress controls — DCS Connector OS | 112 | — |  |
| `/security/approval-gated-actions` | yes | yes | Approval-gated actions — DCS Connector OS | 105 | — |  |
| `/security/blast-radius` | yes | yes | Blast-radius controls — DCS Connector OS | 155 | — |  |
| `/security/retry-reconciliation` | yes | yes | Retry & reconciliation safety — DCS Connector OS | 101 | — |  |
| `/security/kill-controls` | yes | yes | Kill & revoke controls — DCS Connector OS | 138 | — |  |
| `/security/webhook-security` | yes | yes | Webhook security — DCS Connector OS | 124 | — |  |
| `/security/redaction` | yes | yes | Secret & sensitive-data redaction — DCS Connector OS | 114 | — |  |
| `/security/receipts-verification` | yes | yes | Receipts & verification — DCS Connector OS | 99 | — |  |
| `/security/audit-history` | yes | yes | Audit history — DCS Connector OS | 113 | — |  |
| `/security/failure-behavior` | yes | yes | Failure behavior — DCS Connector OS | 97 | — |  |
| `/enterprise/organizations` | yes | yes | Organizations — DCS Connector OS | 76 | — |  |
| `/enterprise/workspaces` | yes | yes | Workspaces — DCS Connector OS | 79 | — |  |
| `/enterprise/roles-permissions` | yes | yes | Roles & permissions — DCS Connector OS | 60 | — |  |
| `/enterprise/approval-workflows` | yes | yes | Approval workflows — DCS Connector OS | 70 | — |  |
| `/enterprise/environments` | yes | yes | Environments — DCS Connector OS | 87 | — |  |
| `/enterprise/audit-governance` | yes | yes | Audit & governance — DCS Connector OS | 54 | — |  |
| `/enterprise/controls` | yes | yes | Controls & rollout — DCS Connector OS | 74 | — |  |
| `/enterprise/contact` | yes | yes | Enterprise contact — DCS Connector OS | 63 | — | **fixed:** duplicate title; no capture form or address (P1) |
| `/developers/quickstart` | yes | yes | Quickstart — DCS Connector OS | 85 | — |  |
| `/developers/authentication` | yes | yes | Authentication — DCS Connector OS | 78 | — |  |
| `/developers/api-surface` | yes | yes | API surface & maturity — DCS Connector OS | 99 | — |  |
| `/developers/api` | yes | yes | Resource model — DCS Connector OS | 65 | — | 68-row DevEx matrix — snapshot of core, re-check |
| `/developers/connectors` | yes | yes | Connectors & manifests — DCS Connector OS | 47 | — |  |
| `/developers/sdk` | yes | yes | SDK — DCS Connector OS | 72 | — |  |
| `/developers/webhooks` | yes | yes | Webhooks — DCS Connector OS | 56 | — |  |
| `/developers/policies` | yes | yes | Policies — developer view — DCS Connector OS | 51 | — |  |
| `/developers/executions` | yes | yes | Executions — DCS Connector OS | 67 | — |  |
| `/developers/receipts` | yes | yes | Receipts — DCS Connector OS | 65 | — |  |
| `/developers/cli-maturity` | yes | yes | CLI maturity — DCS Connector OS | 41 | — |  |
| `/developers/cli` | yes | yes | CLI — DCS Connector OS | 46 | — |  |
| `/developers/errors` | yes | yes | Outcome & refusal reference — DCS Connector OS | 70 | — |  |
| `/developers/changelog` | yes | yes | Changelog — DCS Connector OS | 50 | — |  |
| `/developers/status` | yes | yes | Build status — DCS Connector OS | 67 | — | **fixed:** had no shell (404 on static host) |
| `/about` | yes | yes | About Connector OS | 64 | — | count wording fixed |
| `/contact` | yes | yes | Contact — DCS Connector OS | 70 | — | no contact channel published (P1) |
| `/privacy` | yes | yes | Privacy policy — DCS Connector OS | 39 | — |  |
| `/terms` | yes | yes | Terms of service — DCS Connector OS | 39 | — |  |

## 3. Dynamic routes

| Pattern | Count | Prerendered | Sitemap | Behaviour | Evidence |
|---|---|---|---|---|---|
| `/connectors/:id` — published canonical | 868 | yes | yes | detail page | route smoke (HTTP); e2e renders sample + **all 53 published alias rows** |
| `/connectors/:id` — alias row | 53 published (of 63) | yes (**new**) | yes | renders own record. **Baseline: "Connector not found"** | e2e |
| `/connectors/:alias_of` — alias identifier | 53 | yes, noindex (**new**) | no | client redirect to the row | e2e |
| `/connectors/:id` — HOLD | 132 | no | no | "not publicly listed", no content. **Baseline: full record rendered** | e2e |
| `/connectors/:id` — legacy PRESERVE | 436 | yes | yes | REFERENCE banner, excluded from counts | `test-legacy-routes.py`, route smoke, e2e |
| `/connectors/:id` — legacy REDIRECT | 43 | yes, noindex | no (**changed**) | client redirect; 8 land on other legacy rows | e2e |
| `/connectors/:id` — legacy GONE / RETIRED | 45 / 17 | no | no | 410 notice | e2e |
| `/connectors/:id` — legacy UNLIST | 6 | no | no | not found | e2e |
| unknown | — | `404.html` | no | site 404 | e2e |

Hosting note: rows without a shell (HOLD, GONE, UNLIST, console detail ids) depend on the host serving `404.html` as an SPA fallback. They answer **HTTP 404** with the client-rendered notice. True `410` for GONE needs host rules (e.g. `_redirects`/headers), which is a deploy item.

## 4. Claims corrected on public routes

| Route | Before | After |
|---|---|---|
| `/`, `/connectors` meta | "750 catalogued connectors" | derived: "868 published connectors (1000 catalogued)" |
| `/connectors` H1 | "1000 catalogued connectors" over an 868-card grid | "868 published connectors" + total / published / on-hold breakdown |
| `/` hero chips | "Verifiable receipts" | "Receipts for every action". Receipts are signed by a test signer at claim level HERMETIC. |
| `/connectors/:id` | "Regions: Global"; "capabilities reflect verified provider surfaces" | removed; "drafted from the manifest and provider docs, not runtime-verified" |
| `/connectors/:id` CTA | "Notify me at launch" (no capture exists) | "Launch status" |
| `/signin` | email + password form that did nothing; "Free to start", "No credit card required" | pre-launch page, no inputs |
| `/pricing` | "Get started" / "Join the waitlist" → `/signin` | "Launch status"; Enterprise → `/enterprise/contact` |

## 5. Known remaining public-site gaps

See `FIX_PLAN.md`.
- No contact or waitlist capture anywhere: `/contact` and `/enterprise/contact` describe a conversation but publish no address or form.
- No automated accessibility scan. The custom `FilterSelect` dropdown on `/connectors` is a button + div list without listbox semantics or arrow-key support.
- 3 MB single JS chunk (Vite warns); no code-splitting between site and console.
- Pages are SPA shells with per-route meta only; no server-rendered body text for crawlers.
