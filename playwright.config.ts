import { defineConfig, devices } from '@playwright/test'
import { existsSync } from 'node:fs'

// Two builds under test:
//   desktop  — the production build + prerendered shells (npm run build &&
//              npm run prerender), served by `vite preview`. Console in DEMO mode.
//   api-mode — the mock build (npm run build:mock) against the local mock API
//              (scripts/mock-api.mjs). Console in API mode with mock identities.
//   core-api — the core build (npm run build:core) against Connector OS core's REAL
//              hermetic /v1 reference server, assembled from the core packs into
//              .core/tree (npm run core:assemble). Runs only when that tree exists.
const PORT = 4317
const CORE_TREE = process.env.COS_CORE_TREE ?? '.core/tree'
const CORE_SERVER = `${CORE_TREE}/devex/api-server/bin/serve.mjs`
const WITH_CORE = existsSync(CORE_SERVER) && existsSync('dist-core/index.html')
const MOCK_SITE_PORT = 4318
const MOCK_API_PORT = 4010

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: true,
  reporter: [['list']],
  use: { trace: 'retain-on-failure' },
  projects: [
    {
      name: 'desktop',
      testIgnore: /(api-mode|core-api)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, baseURL: `http://127.0.0.1:${PORT}` },
    },
    {
      name: 'api-mode',
      testMatch: /api-mode\.spec\.ts/,
      // the mock API is in-memory and shared, so these tests run in order
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, baseURL: `http://127.0.0.1:${MOCK_SITE_PORT}` },
    },
    ...(WITH_CORE ? [{
      name: 'core-api',
      testMatch: /core-api\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, baseURL: 'http://127.0.0.1:4330' },
    }] : []),
  ],
  workers: process.env.CI ? 2 : undefined,
  webServer: [
    {
      command: `npx vite preview --port ${PORT} --strictPort --host 127.0.0.1`,
      url: `http://127.0.0.1:${PORT}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: `npx vite preview --outDir dist-mock --port ${MOCK_SITE_PORT} --strictPort --host 127.0.0.1`,
      url: `http://127.0.0.1:${MOCK_SITE_PORT}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: `node scripts/mock-api.mjs --port ${MOCK_API_PORT}`,
      url: `http://127.0.0.1:${MOCK_API_PORT}/healthz`,
      reuseExistingServer: false,
      timeout: 30_000,
    },
    ...(WITH_CORE ? [
      // MODE 2 unlocked: core's documented local-flow switch, so an approved step can execute here
      { command: `node ${CORE_SERVER} --port 4020 --unlock-mode2`, url: 'http://127.0.0.1:4020/v1/connectors?limit=1', reuseExistingServer: false, timeout: 30_000 },
      { command: 'npm run preview:core', url: 'http://127.0.0.1:4330/', reuseExistingServer: !process.env.CI, timeout: 60_000 },
    ] : []),
  ],
})
