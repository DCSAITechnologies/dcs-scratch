# Final return: Connector OS website + dashboard completion

> **Website final (03 Oct, latest):**
> - The public website is complete in the light design: homepage (A ↔ C hero, B "How it works"), reorganised catalogue, compact connector pages (clickable provider links, similar connectors, Gmail editorial record), sub-page dedupe, and a full footer mirroring the header.
> - Verified: 101/101 e2e (desktop, api-mode, core-api), axe 0 violations, all gates green.
> - Launch inputs still needed: 241 logos (or network access), hosting target + deploy token, IdP, and a staging `/v1` (core).
>
> **Addendum, 03 Oct (later):**
> - The whole public site is now the light theme, and the homepage uses the founder-selected HERO-A ↔ HERO-C rotation with HERO-B as "How it works".
> - Connector logos are real brand marks in colour and rendered larger: 160 vector marks; 241 published connectors still on a monogram, listed in `audit/LOGO_SOURCES.md`.
> - 99/99 e2e (desktop, api-mode, core-api) and axe 0 violations.
> - The console stays dark for the dashboard phase.
> - The keys below are unchanged except `SITE_HEAD`: see the latest commit on the branch.

**Date:** 03 Oct 2026
**Repo:** DCSAITechnologies/dcs-scratch · `claude/new-session-e3y98d` (pushed)
**Production:** not touched. Nothing was deployed. Core was not modified. No repository was created.
**Continue from:** `audit/HANDOFF.md`

```
CORE_HEAD=f6a3161e04e2f37da266e74adc54e8ecd974686a
SITE_HEAD=aa1cac140d87eab21670c956226fc1732eea3271
CANONICAL_TOTAL=1010
PUBLIC_TOTAL=809
HOLD_TOTAL=201
AVAILABLE_TO_CONNECT_TOTAL=0
NOT_AVAILABLE_TOTAL=1010
STAGING_VERIFIED_TOTAL=0
RUNTIME_VERIFIED_TOTAL=0
DISPATCH_ELIGIBLE_TOTAL=0
BLOCKED_TOTAL=9
LEGACY_TOTAL=542
OPENAI_STATUS=NOT_IN_CORE — not canonical, not an alias; legacy reference page only; not available to connect; absent from the console catalogue
ANTHROPIC_STATUS=NOT_IN_CORE — not canonical, not an alias; legacy reference page only; not available to connect; absent from the console catalogue
AZURE_OPENAI_STATUS=NOT_IN_CORE — not canonical, not an alias; legacy reference page only; not available to connect; absent from the console catalogue
REAL_API_ROUTES_WIRED=21/25 route patterns, verified against core's real /v1 reference server (4 PLANNED: tools, team, settings + not-in-contract parts of developer/audit)
FIXTURE_ONLY_ROUTES_REMAINING=0 in API mode (the demo build renders labelled fixtures by design)
AUTH_STATUS=SEAM_READY — sign-in/restore/expiry/deep-link/sign-out/RBAC from /v1/me verified with core hermetic identities; OIDC (code+PKCE) ready; no IdP configured
BUILD=PASS
ROUTE_SMOKE=PASS (canonical + 474 legacy preserved routes 200)
ACCESSIBILITY=PASS (axe WCAG 2.1 A/AA: 0 violations — 46 site/console pages + 5 preview pages)
RESPONSIVE=PASS (6 desktop sizes × 6 zoom levels, 5 devices; previews at 390/768/1024/1440)
SECURITY_SCAN=PASS (0 secrets; 0 production npm vulnerabilities; 7 dev-only advisories; CSP 0 violations; no test identities in dist/)
HERO_A_READY=YES
HERO_B_READY=YES
HERO_C_READY=YES
STAGING_READY=NO
BLOCKERS=(1) core's staging server does not serve contract 1.0.0 — its production adapters are BLOCKED_BY_LANE3, so there is no staging /v1 URL; (2) no IdP; (3) no hosting target or deploy token; (4) 0 dispatch grants / staging verifications in core
RESULT=BLOCKED
```

`RESULT=BLOCKED` means every item inside this repository is complete and verified, and what remains is external to it (listed under BLOCKERS). Nothing failed.

## Verification (clean `npm ci` at SITE_HEAD)

| Check | Result |
|---|---|
| ESLint, `tsc -b` | clean |
| Unit (Vitest) | 17/17 |
| Build: production, mock, core | green |
| Prerender | 1419 shells + 404 + sitemap (1303 URLs) + `_redirects` + `_headers` |
| Gates | catalogue sync = core · inventory fresh · catalogue validation (membership + ranks = core; logos absolute) · stale counts (83 files) · dashboard C1–C9 · status G10 · legacy routes (10 major providers) |
| Route smoke | green |
| Playwright `desktop` (production build, demo console) | 72/72: catalogue (search incl. OpenAI/Anthropic, filters, sort, paging), routing, 404, console, a11y, keyboard, responsive/zoom, nav, contact, host rules, CSP, hero previews + homepage demo |
| Playwright `api-mode` (mock API) | 16/16 |
| Playwright `core-api` (core's **real** `/v1` reference server) | 11/11 |
| Core's own contract tests on the assembled tree | 36/36 |
| npm audit | production 0; dev-only 7 (`braces` via tailwind/chokidar, `@vitest/mocker`). The fix needs breaking `--force` upgrades. |

## Deliverables

| File | What |
|---|---|
| `audit/CORE_RECONCILIATION_FINAL.md` | 1000 / 868 / 1009 / 1010 explained; core diff; hold policy; dispatch truth; major providers |
| `audit/CONNECTOR_MASTER_INVENTORY.csv` | 1552 rows (1010 canonical + 542 legacy), every status column with evidence. Generated; gate-checked. |
| `audit/CONNECTOR_STATUS_SUMMARY.md` | Totals, reasons, holds, dispositions, packs, major providers. Generated. |
| `audit/DASHBOARD_WIRING_MATRIX.md` | Per page and action, verified against core |
| `audit/WEBSITE_ROUTE_MATRIX.md` | Routes, SEO, sitemap and host rules (03 Oct update) |
| `audit/STAGING_READINESS.md` | Verdict, checklist, why the staging server is not a `/v1` server yet |
| `audit/HERO_CONCEPTS.md` + `audit/hero/*.png` | A, B and C; the founder chose A + C; `/preview/home` demo |
| `audit/CORE_RUNTIME_DEPENDENCY_GAP.md` | The 4-pack dependency history: now resolved |
| `audit/HANDOFF.md` | Start here |

## Commits in this phase

```
aa1cac1 Console verified against Connector OS core's real /v1 reference server
30c9db5 Light homepage demo (/preview/home): HERO-A/C rotate every 10 s, HERO-B as How it works
16a414e HERO-A/B/C concepts on noindex preview routes for founder review
96c5f49 Fix relative logo paths (387 rows) that broke logos on nested routes
6ec81cf Core runtime gap after the Closure Pack: imports closed, boot blocked on 9 data files
24bedc2 Catalogue summary: per-category published/held counts (derived) for hero concepts
3cb75c7 Record core runtime dependency gap: reference server needs packages/inbound-firewall
d521991 Master connector inventory and core reconciliation report
7f21418 Derive the catalogue from Connector OS core (f6a3161)
```
