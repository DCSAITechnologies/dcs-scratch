import { describe, it, expect } from 'vitest'
import { validate, empty } from './contact'

const ok = { ...empty, name: 'Asha', email: 'asha@acme.io', topic: 'enterprise' as const, message: 'We need governed writes to our CRM.' }

describe('contact form validation', () => {
  it('requires name, email, topic and a real message', () => {
    expect(Object.keys(validate(empty)).sort()).toEqual(['email', 'message', 'name', 'topic'])
  })
  it('rejects malformed emails', () => {
    for (const email of ['asha', 'asha@', 'asha@acme', 'a sha@acme.io', '@acme.io']) expect(validate({ ...ok, email }).email).toMatch(/valid email/)
  })
  it('accepts a complete message', () => {
    expect(validate(ok)).toEqual({})
  })
  it('bounds message length', () => {
    expect(validate({ ...ok, message: 'too short' }).message).toMatch(/at least 20/)
    expect(validate({ ...ok, message: 'x'.repeat(4001) }).message).toMatch(/4,000/)
  })
})
