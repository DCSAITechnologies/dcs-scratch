# Connector OS website + console — engineering handoff

**Updated:** 02 Oct 2026 · **Branch:** `claude/new-session-e3y98d` (DCSAITechnologies/dcs-scratch)
**Read this first.** It is written so you can continue without the chat history. Detailed matrices are in the other `audit/*.md` files; where they differ, this file is newer.

---

## 1. What this repo is

| Surface | Path | What it does |
|---|---|---|
| Public website | `src/pages`, `src/components`, `src/lib/subpages*.ts` | Marketing, catalogue (`/connectors`), developer docs, contact. Static: data is bundled. |
| Console | `/app/*`, `src/pages/dash`, `src/components/dash` | Operator/developer console. **Two data modes**, fixed per build (§3). |
| Catalogue data | `src/lib/connectors.json` (canonical snapshot, 1000), `src/lib/connectors-legacy.json` (547 legacy) | Snapshot of the factory 1000; core has 1009 (§6). |
| API client | `src/lib/api/*` | Typed client for the frozen OpenAPI 1.0.0 contract (`public/devportal/01_openapi/connector-os-v1.yaml`). |
| Identity | `src/lib/auth/session.ts`, `src/components/dash/AuthGate.tsx` | Provider-agnostic OIDC (code + PKCE), mock identities in dev/mock builds only. |
| Mock API | `scripts/mock-api.mjs` | In-memory contract stand-in for dev and e2e. **Not evidence.** |
| Gates | `scripts/*.py` | Catalogue validation, stale counts, dashboard truthfulness (C1–C9), status vocabulary, legacy routes, route smoke. |

## 2. Commands

```bash
npm ci
npm run verify          # lint → unit → build → prerender → 5 gates → route smoke → mock build → Playwright (both projects)
npm run dev             # site + console in DEMO mode
npm run mock:api        # mock API on :4010   (terminal 1)
npm run dev:mock        # console in API mode against it (terminal 2); sign in as operator/approver/viewer (mock)
npm run api:types       # regenerate src/lib/api/schema.gen.ts from the OpenAPI file
npm run reconcile -- --core "/path/to/connector-os-read-api" --out audit/core-reconciliation.md
```

`npm run build` = production build (demo console unless `VITE_COS_API_URL` is set at build time). `npm run prerender` must run after every build; it writes route shells, sitemap, robots, `_redirects` and `_headers` into `dist/`.

## 3. Console data modes (the most important design rule)

| Mode | When | Behaviour |
|---|---|---|
| **demo** | `VITE_COS_API_URL` unset | Fixture pages (`src/lib/fixtures.ts`) under an amber **DEMO / NON-PRODUCTION** banner. No backend calls. Demo identity, labelled. Actions disabled with truthful maturity labels. |
| **api** | `VITE_COS_API_URL` set | Every page reads/writes the API (`src/pages/dash/api/*`). Failures render error states. **Fixtures are never imported on this path** (gate C8). Requires an identity: OIDC if configured; mock identities only in `development`/`mock` builds; otherwise the console refuses to load data ("Sign-in is not configured"). |

### Environment variables (all public — compiled into the bundle; never put secrets here)

| Var | Purpose |
|---|---|
| `VITE_COS_API_URL` | API origin (contract paths include `/v1`). Switches the console to API mode. |
| `VITE_OIDC_ISSUER`, `VITE_OIDC_CLIENT_ID`, `VITE_OIDC_SCOPE`, `VITE_OIDC_AUDIENCE` | Identity provider. Redirect URI: `<origin>/app/auth/callback`; post-logout: `<origin>/app`. |
| `VITE_CONTACT_ENDPOINT`, `VITE_TURNSTILE_SITE_KEY` | Contact form delivery. Unset → form hands off to the published addresses by email. |
| `VITE_COS_DEV_TOKENS` | Mock identities (`role=token,…`). **Honoured only in development/mock builds.** Never set it for production builds (gate C9 fails if a mock token reaches `dist/`). |

See `.env.example`, `.env.mock`. **Set the same env vars when running `npm run prerender`** so the generated CSP `connect-src`/`frame-src` include the API, IdP and form origins.

## 4. What is done (with evidence)

| Area | State | Evidence |
|---|---|---|
| Catalogue routing (aliases, HOLD privacy, counts, legacy behaviours) | done | `e2e/public.spec.ts`, legacy-route gate, route smoke |
| HOLD connectors never public (grid, direct URL, featured lists, redirects) | done | e2e HOLD test; build fails if a HOLD id is featured; redirect test |
| Typed API client + retries/idempotency/errors | done | `src/lib/api/client.test.ts` (11 tests) |
| Auth seam (OIDC + mock), protected routes, expiry, sign-out, roles via `/v1/me` | done; **no real IdP configured** | `e2e/api-mode.spec.ts` |
| API-backed console (all 25 routes), loading/empty/error/401/403/404/501 states | done against mock | `e2e/api-mode.spec.ts` |
| Mutations (connection create/test/activate/revoke, approval grant/deny/revoke, reconcile, receipt verify, policy evaluate, kill/restore) | done against mock | `e2e/api-mode.spec.ts` |
| Demo-mode truthfulness (labels, DEMO banner, no liveness claims) | done | gates C3/C7, e2e |
| Contact / request-access form | done | `e2e/site.spec.ts`, `e2e/api-mode.spec.ts`, `src/lib/contact.test.ts` |
| Accessibility | 0 axe WCAG 2.1 A/AA violations on 46 pages; keyboard mega-menu, listboxes, focus, reduced motion | `e2e/a11y.spec.ts` |
| Responsive / zoom | 36 desktop viewports (6 sizes × 6 zoom levels) + 5 device sizes, 10 pages each | `e2e/responsive.spec.ts` |
| Bundle | entry 3,057 KB → ~356 KB (372 → ~106 KB gzip); catalogue JSON only on catalogue/console routes | build output; FINAL_RETURN |
| Host rules | 301/410/SPA fallback, CSP + security headers | `dist/_redirects`, `dist/_headers`, e2e CSP test |
| Security sweep | no secrets, no unsafe HTML, rel on external links, no mock tokens in prod, open-redirect guard, 0 prod npm vulns | gate C9, `session.test.ts`, npm audit |

## 5. What is NOT done and why (owner action needed)

| # | Item | Blocked on | What to do when unblocked |
|---|---|---|---|
| 1 | **Real catalogue reconciliation to core (1009)** | `connector-os-read-api` not accessible to this session | `npm run reconcile -- --core <path>`; decide each bucket (promote/re-key/new/website-only) in Lane 6; then regenerate `connectors.json`. Never hand-append rows. |
| 2 | **Real API wiring** | No deployed `/v1` server. Core's only HTTP server today (`packages/read-api`) is GET-only, founder-token-gated, no `/v1` prefix — a browser must never hold that token. The `/v1` reference server (`devex/api-server`, :4010) is hermetic. | Point `VITE_COS_API_URL` at a deployed `/v1` (staging). For local proof, run core's `devex/api-server` and build with `--mode mock` but with its URL and test tokens. Re-run `e2e/api-mode.spec.ts` against it (expect fixture ids to differ — adjust seeds, not assertions). |
| 3 | **Identity provider** | No IdP chosen (Lane 3) | Set `VITE_OIDC_*`; register redirect `<origin>/app/auth/callback`. Map IdP users → API principals (the API, via `/v1/me`, is the authority for capabilities). Consider a backend-for-frontend with httpOnly cookies for production instead of tokens in `sessionStorage`. |
| 4 | **Vault / OAuth apps** | External (status items 20/21) | Connect flow already sends only `cref_…` references. When a credential broker exists, add a "Authorize with provider" step that returns a `cref` to the flow (`ApiConnectNew`). Rotation has no contract operation yet. |
| 5 | **Contact endpoint / CRM** | Founder choice | Set `VITE_CONTACT_ENDPOINT` (+ Turnstile key). Until then the form opens an email to enterprise@/developers@dcslabs.dev. |
| 6 | **Hosting** | Unknown host for connectos.dcslabs.dev | `_redirects`/`_headers` are Netlify syntax (Cloudflare Pages reads both but does not support `410` or the `!` force flag — there, GONE ids fall back to the SPA 404 notice). For Vercel, translate to `vercel.json`. |
| 7 | **Operations with no contract endpoint** | Contract 1.0.0 | Team/roles, settings, tool registry, API keys, policy authoring, run cancel/escalate, retry, replay, MODE ceiling, audit export (501). UI says "Not yet available"; demo labels are PLANNED. |
| 8 | Dev-only advisory | `@vitest/mocker` (moderate, test-time only) | Upgrade to Vitest 4 when convenient. |

## 6. Catalogue facts you need

- Website canonical **1000** (factory batch `factory/a-f01@28bfc79`), published **868**, HOLD **132**, legacy **547**, aliases **63** (targets missing everywhere; rows render under their own id).
- Core registry per core's own L5 inventory (`public/devportal/07_status/FINAL_L5_API_SURFACE_INVENTORY.md`): `packages/registry/data/catalogue.json`, **1009 rows**, `dispatchable_staging = 0`, `dispatchable_production = 0`, staging-verified `[]`.
- Core contains `github` as a canonical connector (contract examples; `packages/connectors/github` is a golden connector). On the website GitHub is legacy reference only → it will appear in the **promote** bucket.
- OpenAI / Anthropic: legacy reference on the website; presence in core unknown until `--core` runs.

## 7. Conventions and guard rails

- Counts are always derived (stale-count gate). Featured connector ids live in `src/lib/featured.json` and are validated at build time.
- A new console page needs both a demo and an API version in `src/pages/dash/index.tsx` (`pick(demo, api)`); the API one must not import fixtures (C8). Every mutation goes through `MutationButton` (capability gate, confirmation, one Idempotency-Key per dialog, server result, re-read).
- Truthful labels: WIRED (navigation or real API), HERMETIC ONLY (contract op exists, not deployed), PLANNED (no contract op), EXTERNAL DEPENDENCY, STAGING ONLY, SNAPSHOT (bundled data).
- No production deploys, secret changes or data changes were made by this work.
