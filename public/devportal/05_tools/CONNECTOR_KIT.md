<!-- Generated from devex/connector-dev-kit/README.md by devex/tools/gen-docs.mjs. Edit the source README. -->

# @dcs-ai/connector-dev-kit

The Connector Developer Kit is for connector authors. It scaffolds a **Manifest 1.3** connector,
validates it with the repository's own validators, runs **hermetic** conformance against a
local provider simulator, and packs a deterministic review bundle.

It is private, pre-launch and not published. It never publishes anything.

```
dcs connector init <connector_id> [--dir <parent>] [--name "<Display Name>"] [--webhooks]
dcs connector validate [dir] [--generation 1.3|v1|v1-effective]
dcs connector test [dir]
dcs connector pack [dir] [--out <dir>]          # default --out ./out
```

Every command accepts `--json`. Exit codes: `0` success, `1` the connector failed a check,
`2` usage error. The standalone entry point is `bin/dcs-connector.mjs`.

## What each command checks

| Command | Checks | Source of truth |
|---|---|---|
| `init` | Scaffolds `manifest.json`, `adapter.mjs`, `conformance.json`, `test/adapter.test.mjs`, `README.md` and `EVIDENCE.md`. With `--webhooks` it also adds a signed `webhook_profile`, a `signing_key` slot and fixtures. The scaffold is strict-valid and fail-closed (`pii_class: special_category`, `reconcile_first` on the non-idempotent write, `never` on the secret-returning admin tool). It carries no secret. It refuses to overwrite a directory. | `templates/connector/` |
| `validate` | **1.** The real repository linter, `lintManifest` from `packages/registry`. It uses the catalogued generation, or `--generation`, or defaults to 1.3. For 1.3 this is the frozen schema, MF-001…MF-018 and strict MF-020…MF-025. **2.** Kit checks: `K-SECRET-1` (no literal secret anywhere), `K-AUTH-0…5` (auth profile present, every slot has `provided_by`, no slot value, placement location valid, templates reference declared slots, non-header placements are `provider_documented`), `K-REDACT-1` (`secret_returning` requires `secret_fields`), `K-RETRY-1…3` (every write/admin tool has explicit `retry_safety`, `safe*` only with a duplicate-absorbing mechanism, a reconciliation probe otherwise), `K-WEBHOOK-1…3` (replay window bounded to 1–3600 s, dedupe identity declared, signed timestamp). Kit checks are **errors** for a 1.3 manifest and **advisory** for a catalogued v1 manifest, which reaches dispatch only through the registry lift + overlay. | `packages/registry/src/lint.mjs`, `packages/contracts`, `src/validate.mjs` |
| `test` | `validate` + the connector's own `node --test` suite (child process) + the kit conformance suites. The suites run through the **real** lane runtime, `packages/connector-kit/src/v13` `execute`, against `src/simulator.mjs`. `K-CONF-IDENTITY`: the adapter is bound to the manifest on disk. `K-CONF-CALL`: every tool round-trips. `K-CONF-AUTH`: credentials appear only at declared placements, located by sentinel and never recorded. `K-CONF-REDACT`: echoed credentials and `secret_fields` never reach the output. `K-CONF-RETRY`: the core `decideRetry` makes an ambiguous write `OUTCOME_UNKNOWN`, a lost response yields `outcome_unknown` with exactly **one** provider hit, a 503 on an unkeyed write is not retriable, and the idempotency key travels in its declared header. `K-CONF-WEBHOOK`: fixtures meet their declared intake expectation, and the intake never claims a verified signature. | core `execute`, `decideRetry`, `webhookIntake` |
| `pack` | Refuses unless `validate` passes and `manifest.json`, `adapter.mjs`, `README.md` and `EVIDENCE.md` exist. Writes `<id>-<version>.dcs-connector/`: a sorted byte-for-byte copy plus `MANIFEST.txt` (`<bytes>\t<path>`, no timestamps). It computes **no hash or digest**, because hashing belongs to R-Series. Prints *not published — marketplace publication is manual and out of scope*. | `src/pack.mjs` |

Author code is never imported by the kit process. `test` runs the unit suite, and a generated
conformance runner with plain literal import specifiers, in child processes. The repository's
no-crypto guard refuses computed `import()` specifiers, and the kit respects that.

## Maturity: what is HERMETIC and what needs staging

| Claim | Maturity |
|---|---|
| Manifest is strict 1.3 valid, with the kit checks clean | HERMETIC (static) |
| Adapter builds correct requests; placement, redaction, retry safety and webhook intake behave per the core runtime | HERMETIC (local simulator, scripted responses) |
| The provider actually behaves as the manifest declares (idempotency header honoured, verification read-back works, rate limits) | **Needs staging.** A person records it in `EVIDENCE.md`; the Integrator writes the `dcs.staging-verified/v1` entry (CR-39). The kit fills in neither. |
| Webhook **signature** verification | Core only: `packages/webhooks/src/verify.mjs` (decision D2). The kit never computes or checks a signature; see `fixtures/webhooks/SIGNED_CASE.md`. |
| Dispatch eligibility | Registry only (`dispatch-eligibility.json`, default-deny). A green `test` does not make a connector dispatchable. |

## Relationship to existing packages

- **`connector-os` CLI (`packages/cli`, owner A10).** It has `init`/`validate`/`test`/`certify`,
  and its `validate` lints **Manifest v1**. This kit targets **strict Manifest 1.3**, delegates
  generation handling to the registry linter, and adds hermetic runtime conformance. It
  consumes the core and does not replace or modify the A10 CLI. `certify`, `types` and
  `kill`/`restore` stay there.
- **`packages/connector-kit` (Lane 2).** This kit **consumes** the 1.3 lane runtime
  (`execute`, `webhookIntake`, `segment`, `TransportTimeout`) and never re-implements
  placement, scrubbing, withholding or retry permission. Scaffolded adapters import its helpers.
- **`packages/contracts`, `packages/registry`.** These are read-only dependencies for
  validation, retry decisions and the catalogue generation.

## Real connectors in this tree

`packages/connectors/github` (and the other golden connector directories on this base) ships
`manifest.json` and `README.md` but **no adapter**, so only `validate` applies to it. It
validates as its catalogued generation (v1) with advisory kit findings. Forcing
`--generation 1.3` fails MF-020, MF-021 and MF-022, the same result the core's strict-v13
regression test records.

## Library API

```js
import {
  runConnectorCommand,   // (argv: string[], io: {stdout, stderr, cwd}) => Promise<number>
  validateConnectorDir,  // (dir, {generation?}) => report
  kitChecks,             // (manifest) => [{rule, path, message}]
  runConformance,        // ({adapter, manifest, config?, webhookFixtures?}) => {passed, suites}
  startSimulator, Fault, // local provider simulator (tests only)
  simulatorTransport,    // lane-runtime transport bound to the simulator (127.0.0.1 only)
  scaffoldConnector, testConnectorDir, packConnector, NOT_PUBLISHED,
} from '@dcs-ai/connector-dev-kit';
```
