import { defineConfig, devices } from '@playwright/test'

// Two builds under test:
//   desktop  — the production build + prerendered shells (npm run build &&
//              npm run prerender), served by `vite preview`. Console in DEMO mode.
//   api-mode — the mock build (npm run build:mock) against the local mock API
//              (scripts/mock-api.mjs). Console in API mode with mock identities.
const PORT = 4317
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
      testIgnore: /api-mode\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, baseURL: `http://127.0.0.1:${PORT}` },
    },
    {
      name: 'api-mode',
      testMatch: /api-mode\.spec\.ts/,
      // the mock API is in-memory and shared, so these tests run in order
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, baseURL: `http://127.0.0.1:${MOCK_SITE_PORT}` },
    },
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
  ],
})
