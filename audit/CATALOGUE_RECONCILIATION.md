# Catalogue reconciliation — website snapshot vs Connector OS core

**Date:** 02 Oct 2026 · **Package:** `CONNECTOR_OS_WEBSITE_DASHBOARD_1000_FINAL (5).zip`, imported unmodified as commit `f0ba35b`
**Generated detail:** [`catalogue-snapshot-report.md`](catalogue-snapshot-report.md) (from `npm run reconcile -- --self`)

## Update — core evidence found in the shipped contract docs (02 Oct, later pass)

The core repo is still not accessible to this session. The ZIP does ship core's own status documents, though, and they settle the core total.

| Fact | Value | Source (in this repo) |
|---|---|---|
| Core registry file | `packages/registry/data/catalogue.json` | `public/devportal/07_status/FINAL_L5_API_SURFACE_INVENTORY.md` |
| **Core catalogue total** | **1009 rows** | same file; also `02_api/API_OVERVIEW.md` ("catalogue (1009 rows)") and `02_api/FINAL_PUBLIC_API_SURFACE.md` |
| Dispatchable staging / production | 0 / 0 | same inventory |
| Staging-verified | `[]` (none) | same inventory |
| `github` is a canonical core connector | yes | OpenAPI examples (`connector_id: github`); `05_tools/CONNECTOR_KIT.md` ("golden connector") |
| Website canonical total | 1000 | `src/lib/connectors.json` |

So **core = 1009 and website = 1000, a difference of at least 9 rows**. GitHub is one of them: canonical in core, legacy reference on the website. The brief's "~1010" is consistent with one more change after the contract freeze (the Gmail change mentioned in the brief).

`scripts/reconcile-catalogue.py --core <path>` now reads `packages/registry/data/catalogue.json` directly, falling back to manifests. It also reads `dispatch-eligibility.json` and `staging-verified.json`, and reports:
- promote / re-key / new / website-only buckets
- the staging-verified ids
- name and category drift for rows present in both

It was tested on a synthetic registry. **Running it against the real core is the one remaining step.**

Reconciliation report fields (website side now; core side after `--core`):

| Field | Value |
|---|---|
| Website count | 1000 canonical · 868 published |
| Canonical / core count | 1009 (core's own inventory) |
| Missing (in core, not on website) | ≥ 9 by count; `github` confirmed; full list needs `--core` |
| Added | 0 by this work (no rows invented) |
| Removed | 0 by this work |
| Renamed | 63 alias rows (`alias_of` targets exist nowhere); exact core ids need `--core` (re-key bucket) |
| HOLD | 132 (11 hold categories), hidden publicly, visible in the console |
| Unpublished | 132 (= HOLD) |
| Unresolved | OpenAI, Anthropic, Azure OpenAI, Gemini, Slack, Notion, Stripe, Salesforce, HubSpot, … (legacy reference); Gmail, Jira (absent from both); category/capability/logo/status drift against core |

## 0. What this document can and cannot settle

The authoritative registry is the core repo `connector-os-read-api`. It lives on the founder's machine (`/Users/NEWUSER/Desktop/Project DCSAI/connector-os-read-api`). It is not on GitHub under any organisation this session can reach, so **this audit could not read it.** Everything below about the ZIP is measured. Everything about core is either quoted from documents shipped inside the ZIP or marked as a hypothesis to confirm.

The decision step is mechanical and ships with this work:

```bash
npm run reconcile -- --core "/Users/NEWUSER/Desktop/Project DCSAI/connector-os-read-api" --out audit/core-reconciliation.md
```

The script scans `packages/connectors/*/manifest.json`, the path every snapshot row cites in `source_provenance`, e.g. `manifest 28bfc79:packages/connectors/deepl/manifest.json`. It sorts every difference into one of four buckets:
- **promote from legacy**
- **re-key alias**
- **new in core**
- **website-only**

`--ids <csv|json>` accepts an exported id list instead, such as `FINAL_1000_IDENTITY_LIST.csv`. The script never edits `connectors.json`.

## 1. Totals

| Measure | Value | Source |
|---|---|---|
| Current core authoritative total | **Not measured** (brief expects ~1010) | core repo not reachable — run the command above |
| ZIP canonical total | **1000** | `src/lib/connectors.json` |
| Published (rendered on `/connectors`) | **868** | rows without `unpublished: true` |
| HOLD / unpublished | **132** | all have catalogue status `HOLD`; 11 hold categories, see report |
| Unique ids / rank range | 1000 / 1–1000, no gaps or duplicates | `validate-catalogue.py` |
| Runtime-verified | **0** | every row `runtime_status: not_verified` |
| Dispatch-eligible | **0** | every row `dispatch_eligibility: NOT_DISPATCHABLE` |
| Categories | 25 | |
| Legacy reference rows | **547** (479 publicly routable: 436 preserved + 43 redirect) | `src/lib/connectors-legacy.json` |
| Alias rows (`alias_of` set) | **63** (53 published) | all 63 targets exist in **neither** dataset |

### Why 868 and not 1000

`PUBLISHED_CONNECTORS` filters out `unpublished === true`, and every one of the 132 HOLD rows carries that flag. This is the intended publication policy, not a rendering bug. The ZIP's actual bug was that the `/connectors` headline printed the 1000 total above a grid of 868. It now reads:

> **868 published connectors**
> 1000 records in the canonical catalogue · 868 published · 132 on hold

All of these numbers are derived from the data.

The dashboard's catalogue view shows all 1000, with a new Publication column and filter. It used to show only the first 60.

## 2. OpenAI / Anthropic / major providers — resolution

| Provider | ZIP canonical | ZIP legacy (Lane 6) | Where it appears after this work |
|---|---|---|---|
| OpenAI (`openai`) | **no** | KEEP_REFERENCE / PRESERVE (legacy rank 1) | `/connectors/openai` reference page (banner: not canonical, not counted). Public search shows it under "Legacy reference surfaces"; console search shows a "legacy reference, not canonical" hint linking to it. |
| Anthropic (`anthropic`) | **no** | KEEP_REFERENCE / PRESERVE (legacy rank 2) | same as OpenAI |
| Azure OpenAI | no | KEEP_REFERENCE / PRESERVE | reference page |
| Google Gemini | no | KEEP_REFERENCE / PRESERVE | reference page |
| GitHub | no | KEEP_REFERENCE / PRESERVE | reference page. **Core ships `packages/connectors/github` as a golden connector** (`public/devportal/05_tools/CONNECTOR_KIT.md`). |
| Slack, Notion, Google Drive, Stripe, Salesforce, HubSpot, Shopify, Linear, Zendesk, Teams, Twilio | no | KEEP_REFERENCE / PRESERVE | reference pages |
| Gmail, Jira | no | **absent from both** | nowhere |
| Statsig | yes, rank 45, Coming Soon | — | canonical. Its provider field is "OpenAI", so it is the only canonical hit for "openai". |

**Finding.** The ZIP's "canonical 1000" is the `FINAL_1000_IDENTITY_LIST` factory batch (`engineering: factory/a-f01@28bfc79` on every row). It contains **none** of the household providers. Two pieces of evidence point the same way:
- The devportal docs in the same ZIP say core carries golden connectors such as GitHub.
- The brief notes a Gmail catalogue change in core DevEx work.

**Hypothesis (to confirm with `--core`).** The current core catalogue ≈ factory 1000 + golden/staging connectors (GitHub, Gmail, …) ≈ 1010. If true, OpenAI and Anthropic are either:
- (a) in core under these ids, and will land in the **promote from legacy** bucket; or
- (b) not in core at all, in which case they stay reference-only until Lane 6 promotes them.

**Not done, deliberately.** OpenAI and Anthropic were **not** appended to `connectors.json`. That would have created 1002 rows with invented ranks, statuses and engineering facts. Discoverability is fixed through truthful search and empty-state surfaces. Promotion must come from core.

## 3. Aliases

All 63 `alias_of` targets (e.g. `bugsnag → bugsnag-insight-hub`, `linode → linode-akamai-cloud`, `azure-devops → azure-devops-services`) exist in neither dataset.

**Defect (fixed).** `byIdOrAlias` resolved each alias row to its missing target and returned `null`, so all 53 published alias rows rendered "Connector not found". That includes 9 homepage cards: 5 in the marquee (bugsnag, browserstack-automate, linode, appwrite, meilisearch) and 4 in the preview grid (singlestore, surrealdb, sumo-logic, pingdom). Prerender also skipped alias rows, so they had no static shell.

**Fix.** `resolvePublic`:
- A row whose `alias_of` names another canonical row redirects to it (none do today).
- Otherwise the row stands on its own id, and the alias identifier redirects to the row.

Both kinds of route now have prerendered shells. The alias-id shells are `noindex`. Covered by e2e.

**Open question for core.** `alias_of` likely names the identity-list slug while the row id is the engineering package dir, or the reverse. `--core` reports which of the two ids core uses, under **re-key alias**.

## 4. Legacy redirects

43 legacy rows are REDIRECT:
- 35 point at published canonical rows.
- 8 point at other legacy reference rows (e.g. `stripe-billing → stripe`, `figjam → figma`).

All 43 resolve. The redirect copy used to say "now resolves to the canonical catalogue entry", which was false for those 8. It now names the target. Redirect shells are excluded from the sitemap.

## 5. Rank / ID conflicts, category / status drift

- No duplicate ids, no rank gaps, and no canonical/legacy id collisions (the gates check this).
- Catalogue status: 798 Coming Soon, 70 Provider Approval Required, 132 HOLD. No row claims Available, Preview, Read Only or Limited Access. The public legend lists all six statuses but none is in use besides those three.
- Engineering status vs publication (independent fields, not conflated):

| Engineering status | Published | HOLD |
|---|---|---|
| CODED_LOCALLY_TESTED | 668 | 104 |
| SPEC_READY | 134 | 2 |
| ACCESS_GATED | 66 | 1 |
| PARKED | 0 | 13 |
| FOUNDER_LEGAL | 0 | 7 |
| BLOCKED | 0 | 5 |

- Docs status: 766 VERIFIED, 207 PARTIAL_WEBSITE_ONLY, 27 UNVERIFIED. The detail page shows "Docs verified" only from the row's `verified` date.
- Category or status drift against core cannot be measured until `--core` runs.

## 6. Logos

| Set | Logo file present | No logo field (monogram fallback) |
|---|---|---|
| Canonical | 660 | 340 |
| Published | 579 | 289 |
| Legacy | 387 | 160 |

Every logo path that is set exists in `public/logos` (1048 files; 1 orphan). The `ConnectorLogo` monogram fallback renders for missing or erroring logos. No connector is blocked or hidden for lack of a logo.

## 7. The six conceptual states — where each lives

| State | Field | Public site | Console |
|---|---|---|---|
| 1 Canonical membership | row in `connectors.json` | yes | yes |
| 2 Publication visibility | `unpublished`, `hold_category` | filters the grid; HOLD detail shows "not publicly listed" | Publication column and filter (new) |
| 3 Catalogue / access status | `s`, `cta` | badge, filter | Catalogue status column |
| 4 Runtime verification | `runtime_status`, `verified` | separate badge/filter | Runtime column |
| 5 Engineering / dispatch | `engineering_status`, `dispatch_eligibility` | not shown | detail facts (new) |
| 6 Legacy / alias | `connectors-legacy.json` `lane6_*`, `alias_of` | reference section, banners, redirects | legacy hint in search; detail "Alias" row (new) |

## 8. Publication-policy decision

**Kept:** HOLD rows are hidden from the public grid and their detail pages show no content. Before this work a direct URL rendered the full HOLD record, which contradicted the policy in the source comment. They remain visible to operators in the console, clearly marked as on hold.

**Founder decision still required** (brief §6): stay hidden, or show as "unavailable / under review" cards. If the latter is chosen, it is a one-line change in `resolvePublic`/`PUBLISHED_CONNECTORS` plus copy. Do not simply remove the filter, because the hold reasons include health data, minors' education data and FCRA reviews.

## 9. Exact generated output source

| Artefact | Generated from |
|---|---|
| `/connectors` grid, filters, counts | `src/lib/data.ts` ← `src/lib/connectors.json` (+ `connectors-legacy.json` for the reference section) |
| Prerender meta, sitemap, connector shells | `scripts/prerender.py` ← same JSON (counts via `CAT_TOTAL` / `CAT_PUBLISHED`) |
| Console catalogue | `CATALOGUE_RUNTIME` in `src/lib/fixtures.ts` ← `CONNECTORS` |
| Reconciliation report | `scripts/reconcile-catalogue.py` |

`connectors.json` itself is still a **hand-delivered snapshot**; there is no generator in this repo. To close the loop:
1. Add a `scripts/sync-catalogue.py` that exports from core's registry into this file, keeping the field contract in `Conn`.
2. Run it in CI before `npm run gates`.

This needs a core export format, which is a core-side item.
