import { SectionHeader } from '../components/primitives'
import { Reveal } from '../hooks/Reveal'
import { AreaLinks } from '../components/AreaLinks'
import { FEATURED, FEATURED_ROWS } from 'virtual:catalogue-summary'
import { ConnectorLogo } from '../components/ConnectorLogo'

const FEATURES = [
  { t: 'Organization & workspaces', d: 'Multi-tenant architecture with granular controls.', icon: 'M4 5h16M4 12h16M4 19h10' },
  { t: 'Team roles & permissions', d: 'Define who can connect, approve and manage.', icon: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-1a7 7 0 0 1 14 0v1' },
  { t: 'Approval workflows', d: 'Configure human-in-the-loop for sensitive actions.', icon: 'M9 12l2 2 4-4M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z' },
  { t: 'Audit history', d: 'Full visibility into agent activity, access and changes.', icon: 'M12 8v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z' },
  { t: 'Policy enforcement', d: 'Define and enforce rules for data and usage policies.', icon: 'M12 3l7 3v5c0 5-3.2 8.4-7 10-3.8-1.6-7-5-7-10V6Z' },
  { t: 'Connected environments', d: 'Manage dev, staging and production.', icon: 'M10 14a5 5 0 0 1 0-7l2-2a5 5 0 0 1 7 7l-1 1M14 10a5 5 0 0 1 0 7l-2 2a5 5 0 0 1-7-7l1-1' },
]

export function Enterprise() {
  return (
    <div className="pt-24 pb-14">
      <div className="mx-auto px-4 sm:px-8 xl:px-12 2xl:px-16 max-w-[1760px] ">
        <SectionHeader
          titleAs="h1"          eyebrow="Enterprise"
          title={<>Control, visibility and<br /><span className="text-gradient">confidence at scale.</span></>}
          sub="Everything you need to run AI agents safely across your organization."
        />
        <Reveal delay={80} className="mt-8 flex justify-center gap-4">
          <a href="/signin" className="cta-primary">Contact sales</a>
        </Reveal>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <Reveal key={f.t} delay={i * 60}>
              <div className="glass-card glass-card-hover p-6 h-full">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: '#EDF2FF', border: '1px solid #E3E7EE' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d={f.icon} stroke="#2850D8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <h3 className="text-[15px] font-semibold text-[#0B1220] mb-1.5">{f.t}</h3>
                <p className="text-[13px] leading-relaxed text-[#3A4357]">{f.d}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-16">
          <div className="text-center text-[12px] uppercase tracking-[0.2em] text-[#566074] mb-8">Connect to the tools your teams already use</div>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
            {FEATURED.enterpriseLogos.map((id) => {
              const c = FEATURED_ROWS[id]
              return (
                <a key={id} href={`/connectors/${id}`} className="flex items-center gap-2.5 opacity-80 hover:opacity-100 transition-opacity">
                  <ConnectorLogo name={c.n} src={c.logo} size={32} />
                  <span className="text-[14px] font-medium text-[#3A4357]">{c.n}</span>
                </a>
              )
            })}
          </div>
        </Reveal>

        <Reveal className="mt-16 text-center">
          <div className="glass-card inline-block p-10" style={{ background: 'linear-gradient(140deg, #EDF2FF, #EDF2FF)' }}>
            <h3 className="text-2xl font-semibold text-[#0B1220]">Ready to run agents at scale?</h3>
            <p className="mt-2 text-[14px] text-[#3A4357]">Talk to our team about enterprise controls, deployment models and custom agreements.</p>
            <a href="/signin" className="cta-primary mt-6 inline-flex">Contact sales <span>→</span></a>
          </div>
        </Reveal>
      <AreaLinks area="Enterprise" title="Enterprise, in depth" />

        </div>
    </div>
  )
}
