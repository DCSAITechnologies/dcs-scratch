import { defineConfig } from 'vitest/config'
import { catalogueSummary } from './scripts/catalogue-summary-plugin'

export default defineConfig({
  plugins: [catalogueSummary(__dirname)],
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
})
