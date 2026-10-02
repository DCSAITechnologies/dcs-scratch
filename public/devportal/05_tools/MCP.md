<!-- Generated from devex/mcp-server/README.md by devex/tools/gen-docs.mjs. Edit the source README. -->

# Connector OS MCP server

> **PRE-LAUNCH — not published.** stdio transport; runs from source. Talks only to the Connector OS
> `/v1` API through the official SDK — so it inherits every governance check the API enforces.

```bash
DCS_BASE_URL=http://127.0.0.1:4010 DCS_API_KEY=<key> node devex/mcp-server/bin/dcs-mcp.mjs            # read-only (default)
DCS_BASE_URL=… DCS_API_KEY=… node devex/mcp-server/bin/dcs-mcp.mjs --enable-governed-actions             # + 3 governed action tools
```

Sample client config: `devex/examples/mcp/claude_desktop_config.json` (read-only).
Protocol: JSON-RPC 2.0, newline-delimited; versions `2025-06-18`, `2025-03-26`, `2024-11-05`;
capabilities: `tools` only. Zero dependencies beyond the SDK and ajv (argument validation).

## Tools

| Tool | Kind | Notes |
|---|---|---|
| `list_connectors`, `get_connector` | read | real registry eligibility — no connector is dispatchable today |
| `list_connections` | read | credentials never returned, only whether a reference is bound |
| `inspect_run` | read | run + plans (per-step policy decision) + approvals + executions |
| `inspect_execution` | read | `outcome` verbatim; OUTCOME_UNKNOWN = report, never retry |
| `inspect_receipt` | read | metadata + server-side R-Series verification label |
| `list_policies`, `list_approvals` | read | |
| `request_plan` | governed action | recommendation only; opens a `mode_1` run if needed |
| `request_approval` | governed action | creates a REQUESTED approval — never grants |
| `submit_approved_action` | governed action | needs a **human** operator attestation (`att_…`) per action; the broker re-checks policy, consumes the approval once, checks the kill switch |

## What it will never do

- Grant, deny or revoke an approval; kill, restore or reconcile; call a connector or provider tool
  directly (there are no `<connector>__<tool>` tools). An agent can **ask**; only a human can **give**.
- Hold or return a provider credential. Tool output passes through a credential scrubber.
- Retry an ambiguous submission. `submit_approved_action` uses a deterministic request key
  (plan, step, approval), so an agent that re-sends the same action gets the original response
  replayed, never a second dispatch; a refused attempt is re-evaluated once the approval is granted.

## Maturity

HERMETIC: exercised end to end against the reference server. Production use is BLOCKED_BY_LANE3
(identity, persistence) and needs a deployed API (Lane 4). A per-tenant hosted MCP endpoint is PLANNED.

## Tests

`node --test test/mcp.test.mjs` — 9 tests: protocol negotiation, read-only default, tool set
(no grant/kill/raw provider tools), argument validation, the governed path end to end,
OUTCOME_UNKNOWN as data, credential scrubbing, and a real stdio child process.
