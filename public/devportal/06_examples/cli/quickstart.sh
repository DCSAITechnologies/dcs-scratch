#!/usr/bin/env bash
# dcs quickstart against the HERMETIC reference server (in-memory; nothing is deployed).
#   terminal 1:  node devex/api-server/bin/serve.mjs --port 4010
#   terminal 2:  DCS_API_KEY=<hermetic developer key from devex/api-server/README.md> bash devex/examples/cli/quickstart.sh
set -euo pipefail
: "${DCS_API_KEY:?set DCS_API_KEY (credentials come from the environment only)}"
export DCS_BASE_URL="${DCS_BASE_URL:-http://127.0.0.1:4010}"
DCS="node $(dirname "$0")/../../cli/bin/dcs.mjs"

$DCS auth status                       # who am I (never prints the key)
$DCS env status                        # eligibility: 0 dispatchable today, MODE ceiling
$DCS connectors list --q git --limit 5
$DCS connectors get github
$DCS connections list
$DCS policies list
$DCS runs list
$DCS approvals list --state REQUESTED
$DCS events list --limit 5
$DCS usage show --window 24h
$DCS connectors get github --json | head -5   # every command supports --json
