// Contact form model + validation (kept out of the component for reuse and tests).

export const TOPICS = [
  { value: 'enterprise', label: 'Enterprise & governance', email: 'enterprise@dcslabs.dev' },
  { value: 'developers', label: 'Developer & integration', email: 'developers@dcslabs.dev' },
] as const
export type Topic = (typeof TOPICS)[number]['value']

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export type Values = { name: string; email: string; company: string; topic: Topic | ''; message: string; website: string }
export const empty: Values = { name: '', email: '', company: '', topic: '', message: '', website: '' }

export function validate(v: Values): Partial<Record<keyof Values, string>> {
  const e: Partial<Record<keyof Values, string>> = {}
  if (!v.name.trim()) e.name = 'Enter your name.'
  if (!v.email.trim()) e.email = 'Enter your work email.'
  else if (!EMAIL.test(v.email.trim())) e.email = 'Enter a valid email address, like name@company.com.'
  if (!v.topic) e.topic = 'Choose what this is about.'
  if (v.message.trim().length < 20) e.message = 'Tell us a little more (at least 20 characters).'
  if (v.message.length > 4000) e.message = 'Please keep it under 4,000 characters.'
  return e
}
