# Authentication

> Credential issuance is **BLOCKED_BY_LANE3** (identity / IdP / RBAC seam). The reference server
> accepts fixed hermetic test credentials only.

Two credential kinds, both `Authorization: Bearer …`:

| Kind | Format | Bound to | Can | Can never |
|---|---|---|---|---|
| **API key** (machine) | `cosk_<environment>_…` | one tenant, one environment, a set of **scopes** | read; open runs; plan; request approvals; submit an approved step (with a human attestation) | grant/deny/revoke approvals; kill; restore; revoke connections; reconcile; any `/v1/operator/*` route |
| **Operator session** (human) | `coso_…` | one tenant; **capabilities** `configure, approve, execute, kill, restore, view` | everything its capabilities allow, incl. grants and operator surfaces | act outside its tenant |

Capabilities follow the shared role model (`org_admin, workspace_admin, approver, developer,
viewer`); the backend role store is part of Lane 3's identity seam.

## Scopes (API keys)

`connectors:read` · `connections:read` · `connections:write` · `runs:read` · `runs:write` ·
`approvals:read` · `approvals:request` · `executions:read` · `executions:write` · `receipts:read` ·
`receipts:verify` · `policies:read` · `events:read` · `webhooks:read` · `webhooks:write` ·
`environments:read` · `usage:read`. A missing scope is `403 permission_denied` with `detail.scope`.

## Human attestation for execution

`POST /v1/executions` also requires `DCS-Operator-Attestation: att_…` — a reference to a human
operator's attestation for that action, verified by the ops-broker to
`{kind: "human", tenant_id, principal_id, attestation_ref}`. A service or cross-tenant attestation
is refused (`403 human_required`).

## Rules

- Credentials are read from the environment; no SDK, CLI profile or config file stores one. The CLI refuses a config file that contains one.
- No response ever contains a credential; `GET /v1/me` shows only a non-secret `key_prefix`.
- Failed authentication is `401 unauthenticated`; another tenant's resource is `404`, never `403`.
- Provider credentials never cross the API: connections carry a vault **reference** (`cref_<uuid>`), and the API returns only `credential_ref_present`.
