# DCS Connector OS — website and console

Public website (governed execution for AI agents, connector catalogue, developer docs) and the
operator console (`/app`). React 19 + TypeScript + Vite 7 + Tailwind 3; static prerendered shells.

**Start here:** [`audit/HANDOFF.md`](audit/HANDOFF.md) — architecture, data modes, env vars,
what is done, what is blocked and on whom.

```bash
npm ci
npm run dev          # site + console (DEMO mode: fixture data under a DEMO / NON-PRODUCTION banner)
npm run verify       # lint, unit tests, build, prerender, gates, route smoke, Playwright
```

Console against a local API:

```bash
npm run mock:api     # terminal 1 — in-memory stand-in for the /v1 contract on :4010
npm run dev:mock     # terminal 2 — console in API mode; sign in with a mock identity
```

Configuration is public build-time env (`.env.example`). Never put secrets in `VITE_*` variables.
