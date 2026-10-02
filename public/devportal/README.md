# Connector OS — Developer Portal handoff

Content package for the developer portal. **Kimi owns rendering**; this package is source content only.

- Status vocabulary on every feature: WIRED · HERMETIC · BLOCKED_BY_LANE3 · PLANNED · EXTERNAL_DEPENDENCY
  (see 07_status/FINAL_DEVEX_MATURITY_MATRIX.csv, one row per operation and component).
- **Nothing here is published or deployed.** Packages are PRE-LAUNCH; there are no public endpoint URLs.
  Do not render "Available", install commands for public registries, or live endpoint URLs.
- Every example in 06_examples is executed by the Lane 5 test suite against the hermetic reference server.
- Package names: @dcs-ai/connector-os (TypeScript), dcs-connector-os (Python), dcs (CLI),
  @dcs-ai/connector-os-mcp (MCP), @dcs-ai/connector-dev-kit (connector kit). These supersede the
  inconsistent names on the current site (@dcs/connect-os, @dcslabs/connector-os, cos).
- Outbound webhooks and their signing scheme are PLANNED (founder decision FD-L5-1).

| Folder | Content |
|---|---|
| 01_openapi | the frozen OpenAPI 3.1 contract |
| 02_api | route map, overview, authentication, error model, versioning, surface summary |
| 03_guides | quickstart, webhooks, receipts |
| 04_sdks | TypeScript and Python SDK guides |
| 05_tools | CLI, MCP server, connector kit |
| 06_examples | verified examples (TypeScript, Python, CLI, MCP, webhooks) |
| 07_status | maturity matrix and API surface inventory |

Source: branch lane/l5-devex-platform. File list with byte sizes: FILES.txt.
