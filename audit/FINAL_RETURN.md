# Final return — website + dashboard audit and completion pass

**Date:** 02 Oct 2026 · **Branch:** `claude/new-session-e3y98d` · **Baseline:** `f0ba35b` (the ZIP, unmodified, minus `dist/` and `node_modules/`)
**No production action taken. No deployment. No change outside this repo. Core rc.1 work untouched.**

## 1. Headline numbers

| Question | Answer |
|---|---|
| Canonical connector total (website snapshot) | **1000** |
| Current core authoritative total | **not measured.** Core repo not reachable from this session; brief expects ~1010. Run `npm run reconcile -- --core <path>`. |
| Published total (public grid) | **868** |
| HOLD / unpublished | **132** (shown in console with Publication = on hold; never rendered publicly) |
| Legacy total | **547** (436 preserved reference + 43 redirect = 479 routable; 45 gone, 17 retired, 6 unlisted) |
| Alias rows | 63 (53 published). All targets missing from both datasets; rows now render under their own id. |
| Runtime-verified | **0** |
| Dashboard connector total | **1000** (all canonical rows, paginated 50/page; was the first 60) |
| OpenAI present where? | **Legacy reference only:** `/connectors/openai` (REFERENCE banner, uncounted), the "Legacy reference surfaces" section of `/connectors` search, and the console search hint. Not canonical. (Canonical "openai" search hit: Statsig, whose provider field is OpenAI.) |
| Anthropic present where? | **Legacy reference only**, same surfaces as OpenAI. Not canonical; zero canonical search hits. |

## 2. Build, tests, gates (final run, `npm run verify`, exit 0)

| Step | Result |
|---|---|
| `npm ci` | green (after the lockfile host fix; baseline **failed**) |
| `npm run lint` | green |
| `npm run build` (`tsc -b && vite build`) | green; Vite warns about a 3 MB chunk (P3) |
| `npm run prerender` | 1482 routes + 404 + sitemap (1367 URLs); 479 legacy surfaces |
| `validate-catalogue.py` | green: TOTAL=1000 PUBLISHED=868 UNIQUE_IDS=1000 RANKS=1-1000 GAPS=0 DUPES=0 RUNTIME_VERIFIED=0 |
| `check-stale-counts.py` (**new**) | green, 58 files (baseline: **red**, 2 × "750 catalogued") |
| `dashboard-snapshot.py` (C1–C7; C6/C7 **new**) | green: 25 route patterns (18 static + 7 detail) all shelled, no liveness copy, no dead WIRED actions (baseline: **red**, 6 failures) |
| `status-snapshot.py` | green: 30 items, ceiling intact, 64 routes resolve |
| `test-legacy-routes.py` | green: openai, anthropic, github, slack, notion, google-gemini OK |
| `route-smoke.py` | green: canonical + 479 legacy routes 200 |
| Playwright e2e (**new**, 34 tests) | **34 / 34 passed** |

### Before/after e2e evidence

The 32 tests that existed at the time were run against a baseline build in a worktree: **10 passed, 22 failed.** Some baseline failures are only because tests use hooks this branch added (`data-testid`, `aria-label="Search the console"`), so 22 is not a defect count.

The defects that reproduce on the baseline independent of hooks:
- alias rows render "Connector not found"
- HOLD content renders on a direct URL
- `/connectors` headline count
- mobile overflow on `/`
- `/contact` and `/enterprise/contact` duplicate titles
- console indexable
- liveness copy
- dead "Request access" button
- console catalogue capped at 60 rows
- internal-link crawl fails on alias links

Two prerender defects were found after that run and covered by two further tests: the missing `/developers/status` shell and duplicate meta on re-run.

### Required tests from the brief → where they live

| Brief test | Coverage |
|---|---|
| npm ci / lint / build | `npm run verify` |
| catalogue validation | `validate-catalogue.py` |
| route smoke / legacy-route smoke | `route-smoke.py`, `test-legacy-routes.py` |
| dashboard gates | `dashboard-snapshot.py` C1–C7 |
| connector search/filter | `e2e/public.spec.ts` (counts, load more, category deep link, nav category) |
| OpenAI search / Anthropic search | public + console, 4 tests |
| canonical + legacy detail routing | canonical, all 53 alias rows, alias-id redirect, HOLD, preserve/redirect/gone/unlisted, 404 |
| dashboard connector pagination | `e2e/dashboard.spec.ts` |
| dashboard search | id prefixes, exact id, stale-query regression, legacy hint, Escape |
| all `/app` routes | all 25 patterns, no page errors; unknown route/id not-found; four-state previews |
| responsive desktop/tablet/mobile | 390 px and 820 px overflow on 9 pages; console mobile drawer (desktop is the default project) |
| 404s | site 404, connector not found, console 404 |
| keyboard navigation | Tab to catalogue search + type; ⌘K / Enter / Escape in console |
| no broken internal links | crawl of all 64 static pages + every unique internal href |
| no false maturity claims | gates C3/C7/G10; e2e truthfulness + sign-in tests |
| no hard-coded stale connector count | `check-stale-counts.py`; e2e expectations derived from JSON |

## 3. Files changed (`git diff --name-status f0ba35b`)

36 files changed, ~1,200 lines added and ~330 removed, plus these audit documents.

- **Source**
  - `src/App.tsx`
  - `src/hooks/usePathRoute.ts`
  - `src/lib/{data,fixtures,maturity,subpages-company,subpages-enterprise}.ts`
  - `src/lib/search-target.ts` (new)
  - `src/pages/{Home,Connectors,ConnectorDetail,Developers,Pricing,SignIn}.tsx`
  - `src/pages/dash/{index,Overview,Connections}.tsx`
  - `src/components/{Nav,Footer}.tsx`
  - `src/components/dash/{DashShell,controls,ui}.tsx`
- **Scripts**
  - `scripts/prerender.py`
  - `scripts/dashboard-snapshot.py`
  - `scripts/test-legacy-routes.py`
  - `scripts/check-stale-counts.py` (new)
  - `scripts/reconcile-catalogue.py` (new)
- **Tests**
  - `e2e/{catalogue.ts,public.spec.ts,dashboard.spec.ts,site.spec.ts}` (new)
  - `playwright.config.ts` (new)
- **Config**
  - `package.json` (scripts; `@playwright/test` 1.56.1)
  - `package-lock.json` (registry host)
  - `tsconfig.node.json`
  - `.gitignore`
- **Audit**
  - `audit/WEBSITE_DASHBOARD_AUDIT.md`
  - `audit/CATALOGUE_RECONCILIATION.md`
  - `audit/DASHBOARD_WIRING_MATRIX.md`
  - `audit/WEBSITE_ROUTE_MATRIX.md`
  - `audit/FIX_PLAN.md`
  - `audit/FINAL_RETURN.md`
  - `audit/catalogue-snapshot-report.md`

`connectors.json` and `connectors-legacy.json` are **unchanged**. No rows were added, removed, promoted, re-ranked or re-statused.

## 4. Commands

```bash
npm ci
npm run verify                     # lint, build, prerender, 5 gates, route smoke, 34 e2e
npm run reconcile -- --self        # snapshot report (audit/catalogue-snapshot-report.md)
npm run reconcile -- --core "/Users/NEWUSER/Desktop/Project DCSAI/connector-os-read-api" --out audit/core-reconciliation.md
```

## 5. Remaining blockers (dependent on core, founder or staging)

1. **Core catalogue reconciliation (~1010).** Run the `--core` command; decide each bucket in Lane 6; add a core→site sync. Until then the site truthfully shows the factory-1000 snapshot.
2. **OpenAI / Anthropic / GitHub / Slack / Notion / Gmail as canonical connectors** follow from (1). They are not hand-added.
3. **Console has no API client and no authentication.** Every operational page is fixture data, labelled as such. Wiring order and per-action contracts are in `DASHBOARD_WIRING_MATRIX.md`. Read-only wiring of the four contract-WIRED operations can start as soon as a core base URL is available.
4. **IdP, vault, connection store, approval store, R-Series authenticated route.** Status items 15–20 are pending in `platform-status.json`.
5. **Founder decisions:**
   - HOLD display policy
   - contact/waitlist channel (no form or address exists anywhere)
   - whether `/app` stays a public labelled demo on staging or goes behind host auth
6. **Deploy rules:** real 410/301 for legacy routes; SPA fallback for console detail ids.
7. **Accessibility:** no automated axe scan yet; `FilterSelect` needs listbox semantics.
8. **Snapshots to re-sync from core:** `platform-status.json`, `devex-matrix.json`, `/devportal/*.md` (all as of 2026-09-27).
