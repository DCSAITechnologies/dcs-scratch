# Core reconciliation — final

**Date:** 03 Oct 2026 · **Site branch:** `claude/new-session-e3y98d` (DCSAITechnologies/dcs-scratch)
**Authority:** Connector OS Core Interface Pack `CONNECTOR_OS_CORE_INTERFACE_PACK_20261003_182824.zip`
**Core:** `DCS-LabsAI/dcs-platform-read-api` @ `f6a3161e04e2f37da266e74adc54e8ecd974686a` (branch `coord/step2b-r4`). The pack checksums verified. Core was **not modified**.

Every number in this document is produced by a script from the core files. Nothing is typed in by hand:

| Step | Command | Output |
|---|---|---|
| Copy core registry files verbatim, with SHA-256 | `python3 scripts/sync-catalogue.py --core <unzipped pack>` | `core-snapshot/` |
| Generate the website catalogue from core | `npm run sync:catalogue` | `src/lib/connectors.json`, `connectors-legacy.json` |
| Generate the inventory and the summary | (same command) | `audit/CONNECTOR_MASTER_INVENTORY.csv`, `audit/CONNECTOR_STATUS_SUMMARY.md` |
| Fail the build when anything is stale or differs from core | `npm run gates` | `sync --check`, `inventory --check`, `validate-catalogue` (membership + ranks = core) |

## 1. Which number is right

The materials contained four different connector counts. Each one is a different snapshot:

| Count | Where it came from | Status |
|---|---|---|
| 1000 | Website ZIP `connectors.json` = core factory identity list (`inputs/identity-list.csv`, ranks 1–1000) | Superseded |
| 868 | Website ZIP public rows (1000 minus 132 Lane 6 editorial holds) | Superseded |
| 1009 | DevEx / status documents bundled in the ZIP: core before the Gmail increment | Superseded |
| **1010** | Core `catalogue.json` at `f6a3161` (`dcs.catalogue/v2`) | **Current, derived mechanically** |

The site no longer contains any of these numbers as literals. The stale-count gate scans 79 files. Every count rendered on the site is computed from `connectors.json` at build time.

## 2. Core catalogue composition (1010)

| Group | Rows | Notes |
|---|---:|---|
| Factory packs F01–F12 | 1000 | Ranked 1–1000 (`engineering_rank`), identical ids, names and ranks to the website ZIP |
| GOLDEN-FIVE (Manifest 1.3) | 5 | github, gmail, notion, slack, stripe. Unranked. |
| REFERENCE | 1 | linear. Unranked. |
| Blocked, unranked | 4 | cirrus-ci → nuclino, tenor → muck-rack, gel-cloud → upsun-platformsh, delighted → elastic-path (`blocked-and-replaced.csv`) |

Website ↔ core diff (ZIP baseline `f0ba35b` vs core):

- **In core, not in the website ZIP (10):** github, gmail, linear, notion, slack, stripe, cirrus-ci, tenor, gel-cloud, delighted.
- **In the website ZIP, not in core:** none.
- **Name drift:** none. **Rank drift:** none.
- **Promoted from the legacy list to canonical (5):** github, linear, notion, slack, stripe. Core lists them, so their legacy rows were retired. Their existing editorial copy now feeds the canonical rows. Legacy: 547 → **542**.
- **No editorial record (5):** gmail and the four blocked rows. Each gets a minimal record built from core facts. The description is marked `auto-pending`. Auth and read/write show "See documentation" and "Not yet documented". No capabilities were invented.
- **Aliases:** core `alias_research_key` marks 63 rows. These match the website's 63 `alias_of` rows exactly.

## 3. Publication policy (HOLD)

A canonical row is held (not rendered publicly, no direct URL, excluded from search, featured lists and the sitemap) when **any** of these is true:

1. core `founder_holds` is non-empty (179 rows),
2. core disposition is `BLOCKED` (9 rows),
3. the website Lane 6 editorial review held it (132 rows in the ZIP).

Result: **PUBLIC 809 / HOLD 201**.

| Change against the ZIP | Rows |
|---|---:|
| Held on the site and held in core | 114 |
| Held in core but **published** on the site → now hidden | 65 |
| New blocked rows (hidden) | 4 |
| Held on the site, no core founder hold. Kept held. (15 editorial only, 3 also core BLOCKED) | 18 |
| Released from a hold | 0 |

Core also has a legacy `website_public_status` field (20 rows say "Available"). It conflicts with core's own dispatch eligibility (0 dispatchable), so it is **not used**. It is preserved in each row's `core` object for traceability.

## 4. Availability, dispatch and verification

Core `dispatch-eligibility.json` (`dcs.dispatch-eligibility/v1`):

- dispatchable in staging **0**, in production **0**, grants **0**
- reasons (a row can have several): `no_explicit_grant` 1010, `disposition` 232, `founder_hold` 196, `open_finding` 40

Core `staging-verified.json` (`dcs.staging-verified/v1`): `verified: []`.

So: AVAILABLE_TO_CONNECT **0**, DISPATCH_ELIGIBLE **0**, STAGING_VERIFIED **0**, RUNTIME_VERIFIED **0**. Every public card, detail page and console row says "Not available to connect yet", followed by core's reasons in plain words. The status chips map core facts like this:

| Core fact | Site label |
|---|---|
| disposition BLOCKED | Blocked (always held) |
| any hold | HOLD (never public) |
| dispatchable in production | Available |
| dispatchable in staging | Preview |
| disposition ACCESS_GATED | Provider Approval Required |
| anything else | Coming Soon |

`validate-catalogue.py` fails the build if any row claims Available or Preview without core dispatch eligibility.

## 5. Major providers

| Provider | Canonical in core | Alias | Legacy reference | Available to connect | Public website | Console catalogue | Evidence |
|---|---|---|---|---|---|---|---|
| **OpenAI** | NO | NO | YES (`/connectors/openai`, preserved reference surface) | NO | Legacy reference page only, labelled as such | NO | No `connector_id`, name or `alias_research_key` in core `catalogue.json` or `identity-list.csv`. The only text match is Statsig's parent company, "Statsig (OpenAI)", rank 45. |
| **Anthropic** | NO | NO | YES (`/connectors/anthropic`) | NO | Legacy reference page only | NO | No match anywhere in the core registry files |
| **Azure OpenAI** | NO | NO | YES (`/connectors/azure-openai`) | NO | Legacy reference page only | NO | No match anywhere in the core registry files |
| Google Gemini | NO | NO | YES (`/connectors/google-gemini`) | NO | Legacy reference page only | NO | No match anywhere in the core registry files |
| GitHub | YES (GOLDEN-FIVE) | NO | retired (promoted) | NO | YES | YES | `catalogue.json` `stage/l3-golden-five` |
| Gmail | YES (GOLDEN-FIVE) | NO | — | NO | YES | YES | same |
| Slack | YES (GOLDEN-FIVE) | NO | retired (promoted) | NO | YES | YES | same |
| Notion | YES (GOLDEN-FIVE) | NO | retired (promoted) | NO | YES | YES | same |
| Stripe | YES (GOLDEN-FIVE) | NO | retired (promoted) | NO | YES | YES | same |
| Linear | YES (REFERENCE) | NO | retired (promoted) | NO | YES | YES | `catalogue.json` `integrate/v1-base` |

OpenAI, Anthropic, Azure OpenAI and Gemini were **not** added to the canonical catalogue: core does not list them, and the brief forbids appending providers. Search for "openai" or "anthropic" finds the legacy reference card (under "Legacy reference surfaces — reference only, not part of the canonical catalogue or any count above"; its page is headed "REFERENCE / LEGACY CATALOGUE SURFACE") and no canonical row of that id (e2e `public.spec.ts`). The legacy-route gate requires each of the ten providers to resolve as exactly one of "published canonical" or "preserved legacy reference".

## 6. API contract

The pack's SDK `openapi.ts` is contract **1.0.0** with the same 39 paths as the site's `src/lib/api/schema.gen.ts`, so there is no contract drift. The console's typed client needs no change.

Core's reference server (`devex/api-server`) cannot run from the pack: `packages/contracts`, `packages/auth`, `packages/webhooks` and the OpenAPI YAML are not included. `add_repo` for `DCS-LabsAI/dcs-platform-read-api` was refused (no access). `scripts/mock-api.mjs` therefore mirrors core as closely as the pack allows:

- **Catalogue:** built from `core-snapshot/`, projected exactly like core's `registry-catalog.mjs` `project()`. That includes availability, the dispatch block, `no_eligibility_record` and `founder_holds`.
- **Identities:** core's hermetic principals and capabilities. Operator: configure, approve, execute, kill, restore, view. Approver: approve, view, execute. Viewer: view. Read-only API key: read scopes.
- **Shipping:** those tokens appear only in `.env.mock`. Gate C9 fails if `coso_hermetic_` or `cosk_hermetic_` appears in the production bundle.

## 7. Refreshing from a newer core

```bash
unzip CONNECTOR_OS_CORE_INTERFACE_PACK_<stamp>.zip -d /tmp/pack
python3 scripts/sync-catalogue.py --core /tmp/pack/<root>   # copies + checksums + regenerates
python3 scripts/build-inventory.py
npm run verify
```

If core adds a row with no website editorial record, the generator gives it a minimal record and marks it `auto-pending`. It is never fabricated. If core removes a row, the validator reports it. If a row becomes dispatchable or staging-verified, the site picks that up automatically, with no copy changes.
