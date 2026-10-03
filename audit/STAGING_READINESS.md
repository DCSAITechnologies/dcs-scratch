# Staging readiness

**Date:** 03 Oct 2026 · **Core:** `f6a3161` (`coord/step2b-r4`) · **Site branch:** `claude/new-session-e3y98d`
**Nothing was deployed.** No hosting, staging URL, IdP or vault access was provided, and production was not touched.

## Verdict

| Surface | Staging-ready? | Why |
|---|---|---|
| Public website (static build) | **YES, pending a hosting target** | Builds and prerenders: 1419 shells, sitemap and host rules. Every gate and e2e test passes. Counts are derived from core. Needs: the host (to confirm `_redirects` / `_headers` syntax) and a preview-scoped deploy token. |
| `/app` console, demo mode | YES | Fixtures under a DEMO / NON-PRODUCTION banner; makes no requests |
| `/app` console against **core's real `/v1` API** | **Verified locally; not deployable to staging yet** | All 21 API pages and every console mutation pass against core's real reference server (`core-api`, 11/11). That server is hermetic and in-memory: core labels it "NOT persistence, NOT deployed". |
| `/app` console against **core's staging server** (`apps/staging-server`, cos-runtime) | **NO** | The staging server does not serve contract 1.0.0 (see below) |

**STAGING_READY = NO** for the console as a real staging product. The website alone can go to a staging host as soon as one is named.

## Why the console cannot point at core's staging server today

Core's own source (`apps/staging-server/src/api.mjs`) defines the staging HTTP surface as:

| Group | Routes |
|---|---|
| Public | `/health`, `/ready` |
| Public | `/v1/oauth/callback/<provider>` |
| Public | `/v1/webhooks/<connector>` |
| Public | `/v1/ops/kill`, `/v1/ops/restore` |
| Tenant-bound (`/v1/tenants/<t>/…`) | `attestations` |
| Tenant-bound | `connections`, `connections/<c>` |
| Tenant-bound | `connections/<c>/oauth/begin`, `connections/<c>/credential`, `connections/<c>/activate` |
| Tenant-bound | `webhook-routes` |
| Tenant-bound | `runs`, `runs/<run>`, `runs/<run>/recommendations` |
| Tenant-bound | `runs/<run>/plans/<plan>/approvals` |
| Tenant-bound | `governed-calls` |

Every tenant-bound call needs an IdP access token for that tenant. Each action also needs a **single-use attestation** for that action.

Contract 1.0.0, which the console implements (46 operations), is served only by `devex/api-server`. That server's `createProductionAdapters()` throws `BLOCKED_BY_LANE3`, listing 10 missing ports.

So against the staging server, the console would lose all of these, because staging has no equivalents:
- the catalogue
- every list view (connections, approvals, executions, receipts, events, policies)
- `/v1/me`, usage and environments

**What closes it (core-side; not website work):**
1. **Option A (recommended):** compose contract 1.0.0 over Lane 3 by implementing the ports for `createProductionAdapters()`, and serve `/v1` from cos-runtime or beside it. The console then works unchanged; only `VITE_COS_API_URL` changes.
2. **Option B:** add a console adapter for the tenant-path surface. This only covers what staging exposes (connection lifecycle, runs, approval issue, governed calls, ops kill/restore). It also needs the per-action attestation step in the UI, and lists would still be missing. Not recommended.

## Checklist

| # | Item | Status | Owner |
|---|---|---|---|
| 1 | Catalogue derived from core (1010 canonical; 809 public / 201 hold; 0 dispatchable) | ✅ gates: `sync --check`, `inventory --check`, `validate-catalogue` | site |
| 2 | Console wired to contract 1.0.0; verified against core's real reference server | ✅ `core-api` 11/11; core's own contract tests 36/36 on the assembled tree | site |
| 3 | Console demo/API separation; no fixtures in API mode; no test identities in `dist/` | ✅ gates C8, C9 | site |
| 4 | Contract 1.0.0 served by a deployed staging service | ❌ `BLOCKED_BY_LANE3` in core | **core** |
| 5 | Staging `/v1` base URL | ❌ none exists | core / ops |
| 6 | IdP: issuer + SPA client id + test users (admin / approver / viewer) | ❌ not provided. The seam is ready (`VITE_OIDC_*`, code + PKCE). | founder / ops |
| 7 | CORS or same-origin `/v1` | ⚠️ core's reference server sends no CORS headers, so the console was served same-origin with a `/v1` reverse proxy (`preview:core`). Staging needs either the same proxy at the host, or `Access-Control-Allow-Origin` for the console origin. | ops |
| 8 | Vault / credential broker + provider OAuth apps | ⚠️ exists in core staging (Infisical; OAuth begin/callback), but only on the tenant-path surface | core |
| 9 | Dispatch grants | ❌ `dispatch-eligibility.json`: 0 dispatchable, 0 grants. `staging-verified.json`: empty. Nothing can be connected for real until reviewed grants land. | core / founder |
| 10 | Hosting target + preview deploy token | ❌ not provided | founder |
| 11 | Contact endpoint (+ Turnstile) | optional. The form falls back to the published addresses. | founder |
| 12 | Kill-switch "dual-control restore" copy | ⚠️ marketing pages describe restore as needing a second identity. Contract 1.0.0 and core's reference server only **record** a reviewer; they do not enforce one. The console now says so. Confirm cos-runtime's `/v1/ops/restore` semantics before launch, then align the copy or core. | founder / core |
| 13 | Security headers / CSP / HSTS | ✅ generated `_headers`; 0 CSP violations in e2e | site |
| 14 | Accessibility / responsive | ✅ axe 0 violations (46 pages + previews); 36 desktop viewport/zoom combinations, 5 devices | site |
| 15 | Hero selection | ⏳ HERO-A/C rotation demo at `/preview/home`, awaiting founder sign-off | founder |

## Running the console against core locally (reproducible)

```bash
npm run core:assemble -- <interface>.zip <runtime-supplement>.zip <runtime-closure>.zip <data-files>.zip   # → .core/tree, MISSING 0
npm run build:core
node .core/tree/devex/api-server/bin/serve.mjs --port 4020 --unlock-mode2 &   # MODE 2 unlock = core's local-flow switch
npm run preview:core                                                        # http://127.0.0.1:4330/app (sign in as a core hermetic identity)
npx playwright test --project=core-api                                      # 11 tests
```

`.core/` and `dist-core/` are git-ignored. The core packs are inputs and are not committed.
