# Receipts

A **receipt** is R-Series' signed record of one execution fact (profile `cos-ops-v1`, facts basis
EXEC-FACTS v1). Connector OS never creates, signs, hashes or verifies receipts itself — **R-Series
is the sole trust boundary**. Connector OS stores and relays receipt references and asks R-Series to verify.

## Receipt status vs execution outcome

| Field | Values | Meaning |
|---|---|---|
| `Execution.outcome` | EXEC-FACTS enum | what happened at the provider (or why nothing did) |
| `Execution.receipt.status` | `not_requested`, `PENDING`, `ISSUED`, `FAILED` | whether R-Series has issued evidence for it |
| `…receipt.verification` | `not_verified`, `verified`, `verification_failed`, `verification_unavailable`, `unverified_test_double` | last verification verdict |
| `…receipt.evidence_grade` | `rseries_verified`, `rseries_issued_unverified`, `test_double_not_evidence`, `none` | how much the record is worth as evidence |

A `SUCCEEDED` execution can have a `PENDING` receipt, and an `OUTCOME_UNKNOWN` execution can have
an `ISSUED` one. Never infer one from the other.

## Verification rule (identical in API, SDKs, CLI and MCP)

`verified` only when **all** hold: verifier kind is `rseries`; `valid === true`; `code === "OK"`;
the verified execution outcome equals the recorded one; `profile_status === "frozen"`. A
test-double verifier always yields `unverified_test_double`. No verdict → `verification_unavailable`.

## Tools

| Tool | What it does | Maturity |
|---|---|---|
| `POST /v1/receipts/{id}/verify` | server asks the R-Series verifier port | HERMETIC (test-double verifier) — R-Series service EXTERNAL_DEPENDENCY |
| SDK `parseReceipt` / `parse_receipt` | API object or raw R-Series document → summary (no signature interpretation) | HERMETIC |
| SDK `verifyReceipt(summary, port)` | applies the rule above to any `ReceiptVerifierPort` | HERMETIC |
| SDK `verifyViaApi` / `verify_via_api` | uses the server's verifier | HERMETIC |
| SDK `checkCausalLink(child, parent)` | **structural** consistency: parent pointer, run, sequence (+1). Not authenticity — chain authenticity is R-Series `verify-run` | HERMETIC |
| `dcs receipts verify <file-or-id> [--strict]` | metadata + delegated verdict; offline file → `verification_unavailable` | HERMETIC |
| MCP `inspect_receipt` | metadata + delegated verdict | HERMETIC |

## Today

The reference server mints **test-double** receipts (`issuer_kind: "test_double"`, `sig: null`,
an explicit notice in the document). They are not evidence and never verify as `verified`. Real
receipts need the authenticated R-Series route (Lane 3) and the R-Series service.
