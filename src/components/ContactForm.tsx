// Contact / request-access form.
//
// Delivery, decided by build config:
//   VITE_CONTACT_ENDPOINT set → POST JSON to it (form backend / CRM webhook).
//                               Optional Cloudflare Turnstile when
//                               VITE_TURNSTILE_SITE_KEY is set; honeypot always.
//   not set                   → the published team addresses (enterprise@ /
//                               developers@dcslabs.dev, from the enterprise
//                               contact page) via a pre-filled email. Nothing is
//                               sent or stored by this site in that mode.

import { useEffect, useId, useRef, useState } from 'react'
import { CONTACT_ENDPOINT, TURNSTILE_SITE_KEY } from '../lib/api/config'
import { validate, empty, TOPICS, type Values, type Topic } from '../lib/contact'

declare global { interface Window { turnstile?: { render: (el: HTMLElement, o: { sitekey: string; callback: (t: string) => void; 'expired-callback': () => void }) => void } } }

function useTurnstile(ref: React.RefObject<HTMLDivElement | null>, onToken: (t: string | null) => void) {
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !CONTACT_ENDPOINT || !ref.current) return
    const el = ref.current
    const render = () => window.turnstile?.render(el, { sitekey: TURNSTILE_SITE_KEY!, callback: onToken, 'expired-callback': () => onToken(null) })
    if (window.turnstile) { render(); return }
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    s.async = true
    s.onload = render
    document.head.appendChild(s)
  }, [ref, onToken])
}

export function ContactForm({ defaultTopic }: { defaultTopic?: Topic }) {
  const id = useId()
  const [v, setV] = useState<Values>({ ...empty, topic: defaultTopic ?? '' })
  const [touched, setTouched] = useState(false)
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'emailed' | 'error'>('idle')
  const [serverError, setServerError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const captcha = useRef<HTMLDivElement>(null)
  useTurnstile(captcha, setToken)
  const errors = validate(v)
  const show = (k: keyof Values) => (touched ? errors[k] : undefined)
  const topic = TOPICS.find((t) => t.value === v.topic)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (Object.keys(errors).length) {
      document.getElementById(`${id}-${Object.keys(errors)[0]}`)?.focus()
      return
    }
    if (v.website) { setState('sent'); return } // honeypot: bots fill hidden fields; pretend success, send nothing
    if (!CONTACT_ENDPOINT) {
      const subject = `[Connector OS] ${topic!.label} — ${v.company || v.name}`
      const body = `${v.message}\n\n— ${v.name}${v.company ? `, ${v.company}` : ''}\n${v.email}`
      window.location.href = `mailto:${topic!.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      setState('emailed')
      return
    }
    if (TURNSTILE_SITE_KEY && !token) { setServerError('Please complete the verification check.'); setState('error'); return }
    setState('sending'); setServerError(null)
    try {
      const res = await fetch(CONTACT_ENDPOINT, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, credentials: 'omit',
        body: JSON.stringify({ name: v.name.trim(), email: v.email.trim(), company: v.company.trim() || null, topic: v.topic, message: v.message.trim(), page: window.location.pathname, turnstile_token: token }),
      })
      if (!res.ok) throw new Error(res.status === 429 ? 'Too many submissions — please try again in a few minutes.' : `The form service answered ${res.status}.`)
      setState('sent')
    } catch (err) {
      setServerError(err instanceof Error && err.message !== 'Failed to fetch' ? err.message : 'Could not reach the form service.')
      setState('error')
    }
  }

  if (state === 'sent') {
    return <div role="status" className="glass-panel p-6" data-testid="contact-sent"><p className="text-[14px] text-[#0B1220] font-semibold">Thanks — your message was sent.</p><p className="mt-1.5 text-[13px] text-[#3A4357]">The team replies by email. We do not publish response-time commitments.</p></div>
  }

  const field = 'dcs-input w-full px-4 py-2.5 text-[13.5px]'
  const label = 'block text-[12px] font-medium text-[#3A4357] mb-1.5'
  const err = (k: keyof Values) => show(k) && <p id={`${id}-${k}-err`} className="mt-1 text-[12px] text-[#B91C1C]">{show(k)}</p>
  const aria = (k: keyof Values) => ({ id: `${id}-${k}`, 'aria-invalid': Boolean(show(k)), 'aria-describedby': show(k) ? `${id}-${k}-err` : undefined })

  return (
    <form noValidate onSubmit={submit} className="glass-panel p-6 space-y-4 max-w-2xl" data-testid="contact-form" aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`} className="text-[15px] font-semibold text-[#0B1220]">Send the team a message</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        <div><label htmlFor={`${id}-name`} className={label}>Name *</label><input {...aria('name')} className={field} autoComplete="name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />{err('name')}</div>
        <div><label htmlFor={`${id}-email`} className={label}>Work email *</label><input {...aria('email')} type="email" className={field} autoComplete="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />{err('email')}</div>
        <div><label htmlFor={`${id}-company`} className={label}>Company</label><input id={`${id}-company`} className={field} autoComplete="organization" value={v.company} onChange={(e) => setV({ ...v, company: e.target.value })} /></div>
        <div><label htmlFor={`${id}-topic`} className={label}>Topic *</label>
          <select {...aria('topic')} className={field} value={v.topic} onChange={(e) => setV({ ...v, topic: e.target.value as Topic })}>
            <option value="">Choose…</option>{TOPICS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>{err('topic')}</div>
      </div>
      <div><label htmlFor={`${id}-message`} className={label}>What are you trying to do? *</label>
        <textarea {...aria('message')} rows={5} className={field} value={v.message} onChange={(e) => setV({ ...v, message: e.target.value })} placeholder="Which systems your agents need to touch, which actions worry you, who should approve." />{err('message')}</div>
      {/* honeypot — hidden from people and assistive tech */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
        <label>Website<input tabIndex={-1} autoComplete="off" value={v.website} onChange={(e) => setV({ ...v, website: e.target.value })} name="website" /></label>
      </div>
      {CONTACT_ENDPOINT && TURNSTILE_SITE_KEY && <div ref={captcha} />}
      {state === 'error' && serverError && <p role="alert" className="text-[13px] text-[#B91C1C]" data-testid="contact-error">{serverError} Your message was not sent — you can retry, or email {topic?.email ?? 'enterprise@dcslabs.dev'}.</p>}
      {state === 'emailed' && <p role="status" className="text-[13px] text-[#065F46]" data-testid="contact-emailed">Your email app should open with the message filled in. If it did not, write to <a className="underline" href={`mailto:${topic?.email}`}>{topic?.email}</a>.</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={state === 'sending'} className="cta-primary !py-2.5 disabled:opacity-60">{state === 'sending' ? 'Sending…' : CONTACT_ENDPOINT ? 'Send message' : 'Compose email'}</button>
        <span className="text-[11.5px] text-[#566074]">{CONTACT_ENDPOINT ? 'Sent to the team’s form service.' : 'Opens your email app — nothing is stored by this site.'}</span>
      </div>
      <p className="text-[11.5px] text-[#566074]">Or write directly: {TOPICS.map((t, i) => <span key={t.value}>{i > 0 && ' · '}<a className="text-[#2850D8] underline-offset-2 hover:underline" href={`mailto:${t.email}`}>{t.email}</a></span>)}</p>
    </form>
  )
}
