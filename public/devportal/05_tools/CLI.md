<!-- Generated from devex/cli/README.md by devex/tools/gen-docs.mjs. Edit the source README. -->

# dcs — Connector OS CLI

> **PRE-LAUNCH — not published.** Runs from source against the hermetic reference server today.
> Distinct from the internal authoring CLI `connector-os` (`packages/cli`, owned by A10).

```bash
cd devex && npm ci && npm run build
node api-server/bin/serve.mjs --port 4010 &          # hermetic reference server
export DCS_BASE_URL=http://127.0.0.1:4010 DCS_API_KEY=<hermetic developer key>
node cli/bin/dcs.mjs auth status
```

## Commands

| Command | What it does | Maturity |
|---|---|---|
| `dcs auth status` | principal, tenant, environment, scopes — never the credential | HERMETIC |
| `dcs env status` | environments, real dispatch-eligibility counts, MODE ceiling | WIRED (eligibility) |
| `dcs connectors list [--limit] [--disposition] [--q] [--all]` / `get <id>` | catalogue + eligibility | WIRED |
| `dcs connections list [--connector] [--status]` / `get <id>` | lifecycle, health, credential state | HERMETIC |
| `dcs runs list [--status]` / `inspect <id>` | run + plans + approvals + executions | HERMETIC |
| `dcs approvals list [--state] [--run]` / `get <id>` | approval state and per-step consumption | HERMETIC |
| `dcs executions get <id>` | outcome, attempts, reconciliation — receipt shown separately | HERMETIC |
| `dcs receipts get <id>` / `verify <file-or-id> [--strict]` | metadata; verification delegated to the server's R-Series verifier | HERMETIC |
| `dcs policies list` · `dcs events list` · `dcs usage show` | | HERMETIC |
| `dcs kill …` · `dcs restore <id> …` · `dcs revoke <connection_id> …` | privileged; see below | HERMETIC |
| `dcs connector init/validate/test/pack` | connector dev kit (local; never publishes) | HERMETIC |

Global flags: `--json` (machine output), `--profile <name>`, `--environment <hermetic|staging|production>`
(cross-checked against the credential's environment via `/v1/me`; a mismatch is refused),
`--base-url <url>`.

## Credentials and profiles

Credentials are read from environment variables only. A profile names the variables — it never
holds a secret, and the CLI refuses a config file that contains a credential-shaped string.

```json
// ~/.config/dcs/config.json  (or $DCS_CONFIG)
{ "default_profile": "local",
  "profiles": { "local": { "base_url": "http://127.0.0.1:4010", "environment": "hermetic",
                           "credential_env": "DCS_API_KEY", "operator_credential_env": "DCS_OPERATOR_SESSION" } } }
```

All output passes through a scrubber that redacts any `cosk_…`/`coso_…` string.

## Privileged commands

`kill`, `restore` and `revoke` are refused (exit 3) unless **all** hold: an operator credential is
set in `operator_credential_env`; `/v1/me` says it is a **human** session with the needed capability
(`kill` or `restore`); and `--confirm <target>` repeats the target. The server enforces the same
rules independently (an API key gets 403 on every `/v1/operator/*` route).

## `receipts verify`

With an id, or a file plus a credential, the CLI asks the server's R-Series verifier and prints
the verdict label (`verified` only from an R-Series-kind verifier). With a file and no credential
it parses and shows metadata and reports `verification_unavailable` — Connector OS never verifies
receipts locally. `--strict` exits 4 unless the verdict is `verified`.

## Exit codes

0 ok · 1 API error · 2 usage · 3 refused (privileged / environment mismatch / 403) ·
4 not verified (`--strict`) · 5 request outcome unknown (re-send with the printed idempotency key).

## Tests

`node --test test/cli.test.mjs` — 17 tests incl. `--help` and `connectors get --json` snapshots
(`test/__snapshots__/`), credential redaction, profiles, environment mismatch, every privileged
refusal path and the connector-kit passthrough.
