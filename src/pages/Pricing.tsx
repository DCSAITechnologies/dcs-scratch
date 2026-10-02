import { SectionHeader } from '../components/primitives'
import { Reveal } from '../hooks/Reveal'

const PLANS = [
  {
    name: 'Developer', tag: 'For individuals exploring governed agents.', cta: 'Get started', featured: false,
    features: ['Starter connector set', '1 workspace', 'Community support'],
  },
  {
    name: 'Team', tag: 'For teams shipping agent workflows.', cta: 'Join the waitlist', featured: true,
    features: ['Expanded connector set', 'Unlimited agents', 'Approval workflows', 'Advanced policies', 'Priority support'],
  },
  {
    name: 'Business', tag: 'For organizations with compliance needs.', cta: 'Join the waitlist', featured: false,
    features: ['Full connector catalogue', 'Audit history', 'Environments', 'Governance controls'],
  },
  {
    name: 'Enterprise', tag: 'For large-scale, custom deployments.', cta: 'Contact sales', featured: false,
    features: ['Custom connector policies', 'Deployment models', 'Custom agreements', 'Dedicated support'],
  },
]

export function Pricing() {
  return (
    <div className="pt-24 pb-14">
      <div className="mx-auto max-w-[1300px] px-6">
        <SectionHeader
          titleAs="h1"          eyebrow="Pricing"
          title="Plans for every stage."
          sub="Final pricing is published when approved. Join the waitlist to be notified — no placeholders, no invented numbers."
        />

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
          {PLANS.map((p, i) => (
            <Reveal key={p.name} delay={i * 80} className="h-full">
              <div
                className={`glass-card glass-card-hover p-6 h-full flex flex-col relative ${p.featured ? '!border-[rgba(124,77,255,0.6)]' : ''}`}
                style={p.featured ? { boxShadow: '0 0 44px rgba(124,77,255,0.3), inset 0 0 0 1px rgba(255,255,255,0.06), 0 12px 40px rgba(0,0,0,.32)', background: 'linear-gradient(165deg, rgba(26,31,84,0.95), rgba(16,26,56,0.95))' } : {}}
              >
                <h3 className="text-lg font-semibold text-white">{p.name}</h3>
                <p className="text-[12px] text-[#93A0C2] mt-1">{p.tag}</p>
                <div className="mt-5 mb-5">
                  <span className="text-[13px] font-medium text-[#A9B6D3] px-2.5 py-1 rounded-lg" style={{ background: 'rgba(120,140,255,0.1)', border: '1px solid rgba(120,140,255,0.2)' }}>
                    Pricing announced at launch
                  </span>
                </div>
                <ul className="space-y-2.5 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-[12.5px] text-[#D6E1FF]">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="m5 13 4 4L19 7" stroke="#21C87A" strokeWidth="2.6" strokeLinecap="round" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="/signin" className={`${p.featured ? 'cta-primary' : 'cta-secondary'} mt-6 justify-center w-full`}>{p.cta}</a>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120} className="mt-10 text-center text-[12.5px] text-[#93A0C2]">
          Plan structures are subject to change before general availability.
        </Reveal>
      </div>
    </div>
  )
}
