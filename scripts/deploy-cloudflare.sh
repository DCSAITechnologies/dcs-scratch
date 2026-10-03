#!/usr/bin/env bash
# Deploy the static website to Cloudflare Pages.
#
#   CLOUDFLARE_API_TOKEN=…  CLOUDFLARE_ACCOUNT_ID=…  CF_PAGES_PROJECT=<pages project> \
#   npm run deploy:cloudflare                 # → a PREVIEW deployment (branch "preview")
#
# Production is never the default: deploying the production branch requires
#   CF_BRANCH=<production branch> CONFIRM_PRODUCTION=yes
# The token should be a Pages-only token (Account → Cloudflare Pages → Edit) for this one project.
set -euo pipefail
: "${CLOUDFLARE_API_TOKEN:?set CLOUDFLARE_API_TOKEN (Pages-scoped token)}"
: "${CLOUDFLARE_ACCOUNT_ID:?set CLOUDFLARE_ACCOUNT_ID}"
: "${CF_PAGES_PROJECT:?set CF_PAGES_PROJECT (the Pages project name)}"
BRANCH="${CF_BRANCH:-preview}"
if [[ "$BRANCH" =~ ^(main|master|production)$ && "${CONFIRM_PRODUCTION:-}" != "yes" ]]; then
  echo "Refusing to deploy branch '$BRANCH' (production) without CONFIRM_PRODUCTION=yes" >&2
  exit 1
fi
npm run build:cloudflare
npm run gates
npx --yes wrangler@3 pages deploy dist --project-name "$CF_PAGES_PROJECT" --branch "$BRANCH" --commit-dirty=true
