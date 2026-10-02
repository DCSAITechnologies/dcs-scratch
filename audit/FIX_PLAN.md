# Fix plan — status after the completion pass

**Updated:** 02 Oct 2026

Status legend:
- ✅ done and tested
- 🔒 blocked on an owner or an external dependency (see `HANDOFF.md` §5)
- ⏳ open, but no blocker

## P0 — wrong/missing data, broken routes, security/auth, false claims

| Item | Status | Evidence / next action |
|---|---|---|
| Lockfile pinned to a private mirror | ✅ | `npm ci` from the public registry |
| 53 alias rows → "Connector not found" (9 on the homepage) | ✅ | e2e (every alias row) |
| HOLD records readable by direct URL | ✅ | e2e; featured ids build-validated; no redirect into HOLD |
| Stale "750" / 1000-vs-868 counts | ✅ | stale-count gate |
| `/signin` credential form wired to nothing; "Free to start" | ✅ | e2e |
| Console liveness claims; dead WIRED button | ✅ | gates C3/C7 |
| Homepage orchestration visual rendered no nodes (non-canonical ids) | ✅ | build-validated featured ids |
| `/developers/status` had no static shell | ✅ | e2e subpage-shell test |
| Fixture data could be mistaken for live data | ✅ | DEMO banner (e2e); API mode never imports fixtures (gate C8) |
| `/app` unauthenticated | ✅ seam / 🔒 IdP | Protected in API mode (refuses data without an identity). Demo build stays a labelled demo. Real IdP config needed. |
| Mock credentials could ship | ✅ | honoured only in dev/mock builds; gate C9 |
| **Catalogue not reconciled to core (1009)** | 🔒 core access | `npm run reconcile -- --core <path>` (registry-aware) |

## P1 — product workflows

| Item | Status | Evidence / next action |
|---|---|---|
| Typed API client (errors, retries, idempotency, correlation ids) | ✅ | 11 unit tests |
| Console reads for all 25 routes with real states | ✅ (mock) / 🔒 real server | `e2e/api-mode.spec.ts`; needs a deployed `/v1` |
| Mutations with confirmation + server result | ✅ (mock) / 🔒 real server | same |
| Connect flow (connector → configure → vault reference → save → test → activate) | ✅ (mock) / 🔒 vault, OAuth apps | browser never handles a secret |
| Auth: sign in/out, restore, expiry, 401/403, roles from `/v1/me` | ✅ (mock) / 🔒 IdP | `e2e/api-mode.spec.ts` |
| Contact / request-access | ✅ | form + published addresses; set `VITE_CONTACT_ENDPOINT` for a form service (🔒 founder choice) |
| Console pagination / search / publication state | ✅ | e2e |
| Demo labels match the contract (PLANNED where no operation exists) | ✅ | commit "relabel actions" |
| Host rules: 301 / 410 / console SPA fallback | ✅ | `dist/_redirects` (Netlify syntax; 🔒 confirm host) |
| Catalogue sync pipeline (core → `connectors.json`) | 🔒 core export format | after reconciliation |
| Re-sync devportal docs / DevEx matrix / platform-status with core | 🔒 core access | snapshots dated 2026-09-27 |

## P2 — UX / responsive / accessibility

| Item | Status | Evidence |
|---|---|---|
| axe WCAG 2.1 A/AA | ✅ 0 violations, 46 pages | `e2e/a11y.spec.ts` |
| Keyboard mega-menu, listbox filters, focus-visible, reduced motion | ✅ | `e2e/a11y.spec.ts` |
| Responsive + zoom (36 desktop viewports, 5 devices) | ✅ | `e2e/responsive.spec.ts` |
| Console sidebar offset under the top bar | ✅ | responsive spec |
| Duplicate titles / duplicate meta | ✅ | e2e |
| Console tables on phones scroll horizontally (no card layout) | ⏳ | optional |

## P3 — polish / performance / hygiene

| Item | Status | Evidence |
|---|---|---|
| Bundle: 3,057 KB entry → ~356 KB; catalogue JSON lazy | ✅ | build output |
| Template code and 45 unused dependencies removed | ✅ | commit d7f0582 |
| Project README | ✅ | `README.md` |
| CSP + security headers | ✅ | `dist/_headers`, e2e CSP test |
| `@vitest/mocker` moderate advisory (dev only) | ⏳ | upgrade to Vitest 4 |
| 160 legacy rows without logos | ⏳ | monogram fallback works |
