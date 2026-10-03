# Core runtime dependency gap — reference server cannot start

**Date:** 03 Oct 2026 · **Core:** `f6a3161e04e2f37da266e74adc54e8ecd974686a` (`coord/step2b-r4`)
**Inputs:** `CONNECTOR_OS_CORE_INTERFACE_PACK_20261003_182824.zip` + `CONNECTOR_OS_CORE_RUNTIME_SUPPLEMENT_20261003_191954.zip`. Both checksum lists verify and both report the same HEAD. The packs share no files, so nothing conflicts.

**Status: STOPPED.** As instructed, no mock was substituted for the missing modules. The console's API mode has not been re-pointed at core.

## Method

1. Merged both packs' `core/` into one tree. Supplement files were added only and never overwrote Interface Pack files; the packs have 0 overlapping paths.
2. Ran `npm ci` in `devex/`. This uses the core's own lockfile and fetches the third-party packages `ajv`, `ajv-formats` and `yaml` from the public npm registry. 0 vulnerabilities.
3. Ran `node devex/api-server/bin/serve.mjs`, core's hermetic `/v1` reference server.
4. Ran `node scripts/core-import-closure.mjs <tree> <entries>`, which walks every static and dynamic import.

## Result

`serve.mjs` fails at load:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '<tree>/packages/inbound-firewall/src/index.mjs'
imported from <tree>/packages/webhooks/src/inbound-trust.mjs
```

### Missing for the `/v1` reference server (blocking)

| Missing path | Imported by |
|---|---|
| `packages/inbound-firewall/src/index.mjs` | `packages/webhooks/src/inbound-trust.mjs:11`, `packages/execution/src/engine.mjs:24` |

The whole `packages/inbound-firewall/` workspace is absent. Its `package.json` and any sibling modules are missing too; `engine.mjs` refers to `inbound-firewall/src/vault.mjs` in a comment. Nothing else in the server's import closure (40 files) is missing.

### Missing for the other supplied packages (not on the reference-server path)

| Missing path | Imported by |
|---|---|
| `packages/proxy/src/index.mjs` | `packages/execution/src/engine.mjs` |
| `packages/persistence/src/session.mjs` | `packages/identity/src/audit.mjs` |
| `packages/blast-radius/src/index.mjs` | `packages/product/src/deps.mjs` |
| `packages/oal-runtime/src/index.mjs` | `packages/runtime/bin/console-fixtures.mjs` |
| `packages/oal-runtime/guards/oal-boundary.mjs` | `packages/ops-broker/guards/write-path.mjs` |
| `packages/runtime/simulators/connection-service.mjs` | `packages/runtime/simulators/harness-prep.mjs` |
| `tools/testing/rseries-boundary-double.mjs` | `packages/runtime/bin/console-fixtures.mjs` |

Workspaces listed in core `package-lock.json` but absent from both packs: `blast-radius`, `cli`, `conformance`, `connector-kit`, `eventbus`, `inbound-firewall`, `metering`, `oal-runtime`, `persistence`, `privacy-ops`, `proxy`, `scheduler`, `sdk`, `signer`, `tenancy`, `vault`.

`apps/staging-server/` contains only `README.md`, so the real staging service cannot be run from the packs.

## Minimum needed to proceed

- **To start the reference server and wire the console against core:** the full `packages/inbound-firewall/` directory at `f6a3161` (its `package.json`, `src/` and any `guards/`).
- **To also run the execution, identity and product paths end to end:** `packages/proxy/`, `packages/persistence/`, `packages/blast-radius/`, `packages/oal-runtime/`, `packages/runtime/simulators/connection-service.mjs` and `tools/testing/rseries-boundary-double.mjs`.

Once supplied: unzip the new pack over the merged tree, re-run the closure check (it should report `MISSING 0` for `devex/api-server/bin/serve.mjs`), then start the server and run the api-mode suite against it.
