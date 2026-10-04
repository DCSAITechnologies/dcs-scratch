# From catalogue to working connectors: what it takes, and how to test

**Updated:** 04 Oct 2026
**Sources:**
- core `f6a3161`: `core-snapshot/dispatch-eligibility.json`, `staging-verified.json`, simulator manifests
- the synced catalogue
- `audit/STAGING_READINESS.md`

Counts are derived from the data, not typed by hand. Re-check them with `scripts/remaining-gaps.py` and the inventory.

## 1. Where every published connector stands today

| Stage | What it means | Connectors |
|---|---|---:|
| Listed | Public page with docs links (809 published; 201 more on hold in core) | 809 |
| Code written and locally tested in core (`CODED_LOCALLY_TESTED`) | Ready for a dispatch grant once staging exists | 631 |
| Spec only (`SPEC_READY`) | Core has the spec, not working code yet | 117 |
| Needs partner access (`ACCESS_GATED`) | The provider gates its API behind a partnership | 61 |
| Open audit finding in core | Must be fixed in core before a grant | 10 |
| **Dispatch grant (allowed to run)** | Reviewed permission to execute | **0** |
| **Staging-verified** | Ran end to end against the real provider in staging | **0** |

The website turns a connector to "Available to connect" by itself when core marks it staging-verified. Nothing on the site needs to change for that.

## 2. What is needed to make connectors work

| # | Item | Who | Status |
|---|---|---|---|
| 1 | Staging `/v1` that serves contract 1.0.0. Core's `createProductionAdapters()` still throws `BLOCKED_BY_LANE3` (10 missing ports). | core | ❌ the main blocker |
| 2 | Login (IdP): issuer, SPA client id, test users for admin / approver / viewer | founder / ops | ❌ |
| 3 | Credential vault in staging, with provider credentials stored there (never in the browser) | core / ops | ⚠️ exists in core staging, not on the contract surface |
| 4 | Per connector under test: a provider test account, plus an API key or a registered OAuth app (client id/secret, staging redirect URL) | ops, per provider | ❌ none yet |
| 5 | Per connector: a reviewed dispatch grant | core / founder | ❌ 0 |
| 6 | Hosting for the console next to `/v1` (same-origin proxy or CORS) | ops | ⚠️ the script is ready; it needs a token, and network access from wherever it runs |

Items 1, 2 and 5 gate everything. Items 3, 4 and 6 are per environment or per connector.

## 3. Testing: three levels

### Level 1 — hermetic (simulated providers): possible today, nothing external needed

- **What:** the full governed path (connect → policy → approval → execute → receipt → revoke → kill / restore) against core's own reference `/v1` server, using simulated providers.
- **Which connectors:** core ships simulators for **GitHub, Gmail, Notion and Slack**. Receipts are marked `unverified_test_double`, which is honest.
- **How:**

  ```bash
  npm run core:assemble -- <the 4 core pack zips>
  npm run build:core
  node .core/tree/devex/api-server/bin/serve.mjs --port 4020 --unlock-mode2 &
  npm run preview:core          # open http://127.0.0.1:4330/app and click through as a person
  npx playwright test --project=core-api   # 11 automated tests, all passing
  ```

- **Proves:** the console, the contract, policy, approvals and receipts work together.
- **Does not prove:** that any real provider call works.

### Level 2 — staging with real provider sandboxes: needs §2 items 1–5

Suggested waves:

| Wave | Connectors | Why this order |
|---|---|---|
| 1 | GitHub, Gmail, Slack, Notion, Stripe + Linear (core's reference set) | Core already built and simulated these; 5 of the 6 use OAuth, so this also proves the OAuth-app flow once |
| 2 | 20–30 API-key connectors from the 459 locally tested key/token/basic-auth ones | Least setup per provider (one test key each). Pick providers that offer a free or test tier, and check that per provider; it is not assumed here. |
| 3 | OAuth connectors (153 locally tested) | Each needs an OAuth app registered with the provider |
| Later | `SPEC_READY` (117), `ACCESS_GATED` (61), open findings (10) | Core work or partner agreements come first |

Per-connector test (each one becomes staging-verified when all pass):
1. Store the credential in the vault, and confirm the console only ever shows a reference.
2. Run a governed **read**; check the policy decision and the receipt.
3. Run a governed **write** with approval; check approve, execute and receipt.
4. Deny path: refused by policy, with a receipt.
5. Revoke the connection; the next call is refused.
6. Kill and then restore; check the audit entries.

### Level 3 — production

This needs production adapters, a security review, production grants per connector, and **explicit founder approval**. Nothing here is started, and it is out of scope until Level 2 passes.

## 4. What the team can do this week

| Can do now | Command / place |
|---|---|
| Review the website and console UI (both themes) | Preview artifact, or `npm run dev` |
| Level 1 hermetic walkthrough of the governed flow | §3 Level 1 |
| Round 2 of data (78 connectors missing a top-priority field) | `data-sourcing/REMAINING_DATA.md` (2 terminals) |
| Decide the domain proofs and review-queue items | `data-sourcing/PENDING_DOMAIN_PROOFS.md`, `INGEST_REPORT.md` |

| Needs someone else first | Unblocks |
|---|---|
| Core: staging `/v1` (Lane 3 ports) | Level 2 for everything |
| Founder/ops: IdP + test users | Sign-in on the real console |
| Ops: provider test accounts / OAuth apps for wave 1 | Wave 1 testing |
| Core/founder: dispatch grants for wave 1 | Execution in staging |
