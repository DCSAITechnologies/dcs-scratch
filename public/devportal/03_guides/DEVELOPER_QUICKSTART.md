# Developer quickstart

> **Status: PRE-LAUNCH.** No public Connector OS endpoint is deployed and no package is published.
> Everything below runs against the **hermetic reference server** — in-memory, not persistence,
> not deployed. Every response says so in the `DCS-Adapter: hermetic` header.

## 1. Start the reference server

```bash
cd devex && npm ci && npm run build
node api-server/bin/serve.mjs --port 4010 --unlock-mode2   # MODE 2 unlocked for local flows only
```

## 2. Set credentials (environment only — never in code or config files)

```bash
export DCS_BASE_URL=http://127.0.0.1:4010
export DCS_API_KEY=<hermetic developer key from devex/api-server/README.md>
```

## 3. Use the CLI

```bash
node cli/bin/dcs.mjs auth status
node cli/bin/dcs.mjs connectors list --q git
node cli/bin/dcs.mjs env status        # real dispatch eligibility: 0 connectors dispatchable today
```

## 4. Use an SDK

```ts
import { ConnectorOS } from '@dcs-ai/connector-os';
const dcs = new ConnectorOS({ baseUrl: process.env.DCS_BASE_URL, apiKey: process.env.DCS_API_KEY });
console.log((await dcs.connectors.retrieve('github')).availability);   // "not_dispatchable"
```

```python
from dcs_connector_os import Client
dcs = Client()  # reads DCS_BASE_URL / DCS_API_KEY
print(dcs.connectors.retrieve("github")["availability"])
```

## 5. Walk the governed path

`devex/examples/typescript/approval-workflow.ts` (and `examples/python/approval_workflow.py`):
open a run → plan → request approval → **a human grants** → submit with a human attestation →
inspect the execution and its receipt. See [API_OVERVIEW.md](API_OVERVIEW.md).

## Where things stand

| Surface | Status |
|---|---|
| Contract (`openapi/connector-os-v1.yaml`) | FROZEN 1.0.0 |
| Connectors + eligibility | WIRED to canonical registry data |
| Everything else | HERMETIC; production BLOCKED_BY_LANE3 (identity, persistence, R-Series route) |
| Outbound webhooks, audit export | PLANNED (contract only) |
