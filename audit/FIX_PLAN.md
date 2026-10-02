# Fix plan

**Date:** 02 Oct 2026

Status legend:
- ✅ done in this branch (evidence in `WEBSITE_DASHBOARD_AUDIT.md`)
- ⏳ open
- 🔒 blocked on core, founder or external

## P0 — wrong/missing data, broken routes, security/auth, false claims

| Item | Status | Owner | Next action |
|---|---|---|---|
| Lockfile pinned to an unreachable private mirror | ✅ | — | — |
| 53 alias rows → "Connector not found" (9 on homepage) | ✅ | — | confirm `alias_of` semantics with `--core` (re-key bucket) |
| HOLD records readable by direct URL | ✅ | — | — |
| Stale "750" meta; 1000-vs-868 headline | ✅ | — | stale-count gate keeps it fixed |
| `/signin` credential form wired to nothing; "Free to start" claims | ✅ | — | — |
| Console liveness claims; dead WIRED button | ✅ | — | gate C7 |
| **Catalogue not reconciled to core (~1010)** | 🔒 | core owner | Run `npm run reconcile -- --core "<path to connector-os-read-api>" --out audit/core-reconciliation.md`. Decide each bucket (promote / re-key / new / website-only) in Lane 6. Then regenerate `connectors.json` from core, never by hand. |
| **OpenAI / Anthropic / GitHub / Slack / Notion / Gmail discoverability as canonical** | 🔒 | core + Lane 6 | follows from the reconciliation; today they are honestly shown as legacy reference |
| **No auth on `/app`** | 🔒 | core (IdP, status item 19) | Until an IdP exists, either (a) keep `/app` as an explicitly labelled demo (current state: noindex, demo identity, fixture banner), or (b) gate `/app` behind host-level basic auth on staging. **Founder decision.** |
| Catalogue sync pipeline | ⏳ | site + core | `scripts/sync-catalogue.py` exporting from core's registry into the `Conn` field contract, run in CI before `npm run gates`. Needs a core export format. |

## P1 — missing product workflows

| Item | Status | Owner | Next action |
|---|---|---|---|
| Console catalogue limited to 60 rows | ✅ | — | — |
| Console search stale / silent on legacy names | ✅ | — | — |
| Publication state invisible in console | ✅ | — | — |
| `/developers/status` not prerendered | ✅ | — | — |
| Console not indexable-safe | ✅ | — | — |
| **API client seam** (`src/lib/api.ts`, `VITE_COS_API_URL`, typed errors, real loading/error/stale states replacing `?state=` demo) | ⏳ | site | build first; fixtures remain the fallback when no URL is configured, labelled as such |
| Wire contract-WIRED reads: `GET /v1/connectors`, `/{id}`, `/v1/environments`, `/v1/operator/eligibility` | ⏳ | site | after the client seam; verify paths against current core OpenAPI first |
| Wire HERMETIC reads against the staging reference server (runs, approvals, executions, receipts, events, usage, policies) | 🔒 | core (rc.1 staging) | needs a staging URL and a credential |
| Mutations (evaluate, connection test, grant/deny, reconcile, kill/revoke) with Idempotency-Key, env-naming confirmation and receipt display | 🔒 | core (IdP, stores) | per-action spec in `DASHBOARD_WIRING_MATRIX.md` |
| Real connect flow (manifest-driven auth scheme, vault, OAuth apps, test-before-ACTIVE) | 🔒 | core + external | status items 20, 21 |
| **Contact / waitlist capture** — `/contact`, `/enterprise/contact`, pricing and "Request access" all lead to pages with no form or address | 🔒 | founder | choose a channel (published address, or a form posting to an approved endpoint); do not invent one |
| Relabel actions with no contract operation from HERMETIC ONLY to PLANNED (Cancel run, Escalate, Replay, Set MODE ceiling, Change role, Rename, policy authoring) | ⏳ | site | confirm against current core contract first |
| HOLD display policy (hidden vs "under review" cards) | 🔒 | founder | one-line change once decided |
| True HTTP 410 / 301 for legacy GONE / REDIRECT; SPA fallback for console detail ids | ⏳ | deploy | host rules (`_redirects` / headers) generated from `connectors-legacy.json` |
| Re-sync devportal docs, `devex-matrix.json` and `platform-status.json` with current core | 🔒 | core | these are snapshots dated 2026-09-27 |

## P2 — UX / visual / responsive / accessibility

| Item | Status | Owner | Next action |
|---|---|---|---|
| Mobile overflow on `/` and `/connectors` | ✅ | — | — |
| Duplicate page titles; duplicate meta on re-prerender | ✅ | — | — |
| Nav categories didn't filter | ✅ | — | — |
| Overview figures inconsistent with stores | ✅ | — | — |
| Automated accessibility scan (axe) across public + console | ⏳ | site | add `@axe-core/playwright` to the e2e suite; fix criticals |
| `FilterSelect` dropdown lacks listbox semantics / arrow keys | ⏳ | site | use Radix Select (already a dependency) or add ARIA + key handling |
| Console tables scroll horizontally on mobile (by design) — no card layout | ⏳ | site | optional card view below `md` |
| Mobile overflow verified only on 9 key pages | ⏳ | site | extend the responsive test to all static routes |

## P3 — polish

| Item | Status | Owner | Next action |
|---|---|---|---|
| CTA wording (Launch status) | ✅ | — | revisit when a capture channel exists |
| 3 MB single JS bundle | ⏳ | site | lazy-load `/app` (`React.lazy`) and the legacy JSON; split the catalogue JSON |
| README is the Vite template; `info.md` is scaffolding | ⏳ | site | replace with a project README (scripts: `npm run verify`, `reconcile`) |
| `kimi-plugin-inspect-react` (third-party scaffolding plugin) in `vite.config.ts` | ⏳ | site | confirm it is needed; otherwise remove |
| Legacy logos missing for 160 rows | ⏳ | site | monogram fallback works; optional asset pass |
