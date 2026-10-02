import { describe, it, expect } from 'vitest'
import { safeReturnTo } from './session'

describe('safeReturnTo (no open redirect after sign-in)', () => {
  it('keeps same-origin console paths', () => {
    expect(safeReturnTo('/app')).toBe('/app')
    expect(safeReturnTo('/app/approvals/apr_1')).toBe('/app/approvals/apr_1')
    expect(safeReturnTo('/app/connectors?q=git')).toBe('/app/connectors?q=git')
  })
  it('falls back to /app for anything else', () => {
    for (const bad of ['https://evil.example/app', '//evil.example/app', '/application', '/connectors', 'javascript:alert(1)', '', null, undefined]) {
      expect(safeReturnTo(bad as string)).toBe('/app')
    }
  })
})
