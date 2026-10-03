# Core runtime dependency gap — reference server cannot start

**Updated:** 03 Oct 2026 · **Core:** `f6a3161e04e2f37da266e74adc54e8ecd974686a` (`coord/step2b-r4`)

**Inputs:**
1. `CONNECTOR_OS_CORE_INTERFACE_PACK_20261003_182824.zip`
2. `CONNECTOR_OS_CORE_RUNTIME_SUPPLEMENT_20261003_191954.zip`
3. `CONNECTOR_OS_CORE_RUNTIME_CLOSURE_20261003_193644.zip`

All three checksum lists verify and all three report the same HEAD. Merged, they share one file, `apps/staging-server/README.md`, and its copies are identical. No pack overwrote another.

**Status: RESOLVED (03 Oct, after the Data Files Pack).**
- A fourth pack, `CONNECTOR_OS_CORE_DATA_FILES_20261003_202936.zip`, supplied the 9 files in section 2. Its checksums verify and its HEAD matches.
- Core's `openapi/connector-os-v1.yaml` is byte-identical to the website's bundled copy.
- `scripts/assemble-core.sh` merges all four packs: add-only, conflict-checked.
- The import check reports `MISSING 0`. `devex/api-server/bin/serve.mjs` boots (contract 1.0.0, hermetic adapters, MODE 2 locked by default).
- Core's own contract tests pass 36/36.
- The console is verified against this server: `e2e/core-api.spec.ts`, 11/11. See `DASHBOARD_WIRING_MATRIX.md` and `STAGING_READINESS.md`.
- The history of the gap is kept below.

**Earlier status: STOPPED at server boot.** As instructed, no mock or substitute file was used at the time.

## 1. Code imports: closed

```
node scripts/core-import-closure.mjs <tree> devex/api-server/bin/serve.mjs
files reached 46 · EXTERNAL ajv, ajv-formats, yaml (installed by npm ci in devex/) · MISSING 0
```

The Closure Pack supplied `packages/inbound-firewall`, `proxy`, `persistence`, `blast-radius` and `oal-runtime`, plus `tools/testing`. The reference server's static import graph is now complete.

## 2. Server boot: fails on data files

`node devex/api-server/bin/serve.mjs --port 4020`:

```
Error: ENOENT: no such file or directory, open '<tree>/contracts/v1/tool-call.v1.json'
    at load (packages/contracts/src/schemas.mjs:10)
```

These files are read **at module load or at server start** by the reached modules, and are absent from all three packs:

| Missing path | Read by |
|---|---|
| `contracts/v1/tool-call.v1.json` | `packages/contracts/src/schemas.mjs:28` |
| `contracts/v1/tool-result.v1.json` | `packages/contracts/src/schemas.mjs:29` |
| `contracts/v1/manifest.v1.json` | `packages/contracts/src/schemas.mjs:30` |
| `contracts/v1/errors.v1.json` | `packages/contracts/src/schemas.mjs:31` |
| `contracts/v1.1/manifest.v1.1.json` | `packages/contracts/src/schemas.mjs:38` |
| `contracts/v1.2/manifest.v1.2.json` | `packages/contracts/src/schemas.mjs:54` |
| `contracts/v1.2/tool-result.v1.2.json` | `packages/contracts/src/schemas.mjs:55` |
| `contracts/v1.4/manifest.v1.4.json` | `packages/contracts/src/schemas.mjs:73` |
| `openapi/connector-os-v1.yaml` | `devex/tools/openapi-lib.mjs:5` (routes, scopes and schemas are compiled from it at start-up) |

Present and read: `contracts/v1.3/{manifest.v1.3,exec-facts.v1,webhook-contract.v1}.json`, `packages/registry/data/catalogue.json` and `dispatch-eligibility.json`.

The website repo has a copy of the contract at `public/devportal/01_openapi/connector-os-v1.yaml` (contract 1.0.0, the same 39 paths as the pack's SDK `openapi.ts`). It was **not** used as a stand-in. It is the website's bundled copy, and the instruction is to use only supplied core files. If core confirms the two are identical, that would close the last row.

Read only on paths the reference server does not call at boot: `config/staging/grants/index.json` (`DispatchGrants.loadCommitted`) and `packages/connectors/<id>/manifest.json` (`loadGoldenFiveManifests`).

## 3. Other packages (not on the reference-server path)

| Missing path | Imported by |
|---|---|
| `packages/runtime/simulators/connection-service.mjs` | `packages/runtime/simulators/harness-prep.mjs` |
| `packages/conformance/src/ports/reference/receipt-index.mjs` | `packages/persistence/src/receipt-index.mjs` |
| `packages/vault/src/index.mjs` | `apps/staging-server/src/composition.mjs` |
| `infra/deploy/lib/gate.mjs`, `infra/deploy/run.mjs`, `infra/validate/validate-staging.mjs` | `apps/staging-server/sandbox/deploy-gate-sandbox.mjs` |

## Next

Add the 9 files in section 2, re-run the import check, then start the server:

```bash
node scripts/core-import-closure.mjs <tree> devex/api-server/bin/serve.mjs   # MISSING 0
node <tree>/devex/api-server/bin/serve.mjs --port 4020
```

Once it is listening, point the console's API mode at it (`VITE_COS_API_URL`) and run the api-mode suite.
