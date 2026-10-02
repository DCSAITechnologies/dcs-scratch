# Versioning and deprecation

- **Path major:** `/v1`. Breaking changes ship only under a new major (`/v2`), never under `/v1`.
- **Contract version:** `DCS-API-Version` response header (currently `1.0.0`, FROZEN on 28 Sep 2026).
- **Compatible changes within v1:** new operations; new optional request fields; new response
  fields; new values in enums marked open (`x-dcs-enum-open`: approval states, event types,
  capabilities, error codes). Clients must ignore unknown fields and tolerate unknown values of open enums.
- **Closed enums** (`x-dcs-enum-closed`) mirror frozen contracts — EXEC-FACTS outcome, operation
  class, refusal/blocked/error classes, OAL run status/mode/phase, policy decision, receipt
  status, kill scope, connection lifecycle — and change only when those contracts change.
- **Deprecation:** a deprecated operation keeps working and answers with `Deprecation`
  (RFC 9745) and `Sunset` (RFC 8594) headers plus `Link: <…>; rel="deprecation"`. Minimum notice
  between the first `Deprecation` header and the `Sunset` date: **180 days**.
- **SDKs:** semver; a new API major gets a new SDK major. Types are generated from the contract
  (`devex/tools/gen-types.mjs`); `--check` fails CI on drift.
- **Maturity is not a version.** An operation can move HERMETIC → WIRED → production without a
  contract change; the route map and maturity matrix are regenerated from `x-dcs-maturity`.
