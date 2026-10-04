# Staging review guide: website + console

**Branch:** `claude/new-session-e3y98d`
**Core:** `f6a3161`

This guide covers what to look at in a preview deploy, what is real, and what is still open. Production is untouched.

## 1. Get a preview URL (needs your Cloudflare credentials)

```bash
export CLOUDFLARE_API_TOKEN=…  CLOUDFLARE_ACCOUNT_ID=…  CF_PAGES_PROJECT=…
npm ci && scripts/deploy-cloudflare.sh          # builds, runs the gates, deploys to the "preview" branch only
```

`main`, `master` and `production` are refused unless `CONFIRM_PRODUCTION=yes` is set, and that needs your explicit approval.

The console in the preview runs in **demo mode**: fixture data under a DEMO banner. A staging `/v1` (core) and an IdP are needed before it can run against real data (`STAGING_READINESS.md`).

## 2. What to review

| Area | Where | Look for |
|---|---|---|
| Homepage | `/` | HERO-A ↔ HERO-C every 10 s (pause button, hover pause), HERO-B "How it works", logo strip, derived counts |
| Catalogue | `/connectors` | Stat tiles, one-row categories, 4 cards per row, filters, search (try "openai": legacy reference) |
| Connector pages | `/connectors/heygen`, `/connectors/gmail`, `/connectors/ideogram` | Links panel; tabs Tools / Permissions / Documentation. Provider facts are labelled "What the … API supports" with a source link. Where there are no scope strings, the permission model is stated. A "links added from official pages" note shows where it applies. |
| Sub-pages | Header menus and footer (7 columns) | Every link resolves, light theme throughout |
| Console | `/app` (toggle **Light / Dark** in the top bar) | App shell. The activity rail is docked on Overview only (other pages: **Activity** button). One banner line. Tables scroll inside their card. |
| Console catalogue | `/app/connectors` → **Provider data** = *needs review* | The data-sourcing review queue (§3), per row, with the reason on hover and on the detail page |
| Mobile | Any page at 390 px | Drawer navigation, no horizontal scroll |

Screenshots: `audit/site/`, `audit/console/*-dark.png` / `*-light.png`, and `audit/console/connectors-review-*.png`.

## 3. Connector data: what came in

The four terminal returns were ingested by `scripts/ingest-sourced-data.py`. Its report is `data-sourcing/INGEST_REPORT.md`.

| | |
|---|---|
| Records | 808 of the 809 published connectors (Egnyte deferred, so no record). 0 duplicates. |
| Merge rule | Fill-empty only: core and curated records always win. 57 returned values were not applied because a value already existed (auth 39, site 16, api 2). |
| Logos | 774 of 809 published connectors now show a real logo; 35 still use a monogram |
| Rejected facts | 99: 84 on secondary domains awaiting ownership proof, 8 records with no verifiable provider domain, 7 reviewer decisions |
| Review queue | 54 connectors: partial, rejected whole, no facts, or no record. Visible in the console (§2) and listed in the report. |

Domain proofs still needed are in `data-sourcing/PENDING_DOMAIN_PROOFS.md`. Add a proof to `data-sourcing/domain-aliases.json` and re-run the ingest, and the held facts flow in. The facts themselves are kept in `returns/`.

## 4. Known limitations (honest labels already on the site)

- **Nothing is available to connect.** Core lists 0 dispatch grants and 0 staging verifications, so every Connect action is labelled STAGING ONLY.
- **The console preview is fixture data.** API mode is verified against core's reference `/v1` server (`e2e/core-api.spec.ts`), but no staging `/v1` exists yet.
- **Provider facts describe the provider's API, not core's connector tools.** The connector's own tools come from its Connector OS manifest.
- **201 connectors are on hold in core** and are not public.

## 5. Sign-off checklist

- [ ] Preview URL loads; `_redirects` / `_headers` behave (legacy routes 301, `/preview/*` noindex)
- [ ] Homepage hero rotation and copy approved
- [ ] Connector pages: provider-fact labelling acceptable
- [ ] Console: both themes acceptable
- [ ] Review queue triaged (domain proofs, Onfido, Egnyte)
- [ ] Decide when to promote, with explicit production approval
