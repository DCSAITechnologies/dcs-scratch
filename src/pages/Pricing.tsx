import { SectionHeader } from '../components/primitives'
import { Reveal } from '../hooks/Reveal'

const PLANS = [
  {
    name: 'Developer', tag: 'For individuals exploring governed agents.', cta: 'Launch status', featured: false,
    features: ['Starter connector set', '1 workspace', 'Community support'],
  },
  {
    name: 'Team', tag: 'For teams shipping agent workflows.', cta: 'Launch status', featured: true,
    features: ['Expanded connector set', 'Unlimited agents', 'Approval workflows', 'Advanced policies', 'Priority support'],
  },
  {
    name: 'Business', tag: 'For organizations with compliance needs.', cta: 'Launch status', featured: false,
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
      <div className="mx-auto px-4 sm:px-8 xl:px-12 2xl:px-16 max-w-[1760px] ">
        <SectionHeader
          titleAs="h1"          eyebrow="Pricing"
          title="Plans for every stage."
          sub="Final pricing is published when approved — no placeholders, no invented numbers. Accounts and a launch waitlist are not open yet."
        />

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
          {PLANS.map((p, i) => (
            <Reveal key={p.name} delay={i * 80} className="h-full">
              <div
                className={`glass-card glass-card-hover p-6 h-full flex flex-col relative ${p.featured ? '!border-[#B9C9F6]' : ''}`}
                style={p.featured ? { boxShadow: '0 0 44px rgba(40,80,216,0.10), inset 0 0 0 1px rgba(15,23,42,0.06), 0 12px 40px rgba(0,0,0,.32)', background: 'linear-gradient(165deg, #FFFFFF, #FFFFFF)' } : {}}
              >
                <h3 className="text-lg font-semibold text-[#0B1220]">{p.name}</h3>
                <p className="text-[12px] text-[#566074] mt-1">{p.tag}</p>
                <div className="mt-5 mb-5">
                  <span className="text-[13px] font-medium text-[#3A4357] px-2.5 py-1 rounded-lg" style={{ background: '#F5F7FB', border: '1px solid #E3E7EE' }}>
                    Pricing announced at launch
                  </span>
                </div>
                <ul className="space-y-2.5 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-[12.5px] text-[#1E2638]">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="m5 13 4 4L19 7" stroke="#047857" strokeWidth="2.6" strokeLinecap="round" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href={p.cta === 'Contact sales' ? '/enterprise/contact' : '/signin'} className={`${p.featured ? 'cta-primary' : 'cta-secondary'} mt-6 justify-center w-full`}>{p.cta}</a>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120} className="mt-10 text-center text-[12.5px] text-[#566074]">
          Plan structures are subject to change before general availability.
        </Reveal>
      </div>
    </div>
  )
}
