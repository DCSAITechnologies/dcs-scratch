import { useState } from 'react'
import { Reveal } from '../hooks/Reveal'

const VALUE_POINTS = ['Free to start', 'No credit card required', 'Browse the full connector catalogue', 'Governed agent workflows, pre-launch', 'Console access opens at launch']

export function SignIn() {
  const [tab, setTab] = useState<'signin' | 'create'>('create')

  return (
    <div className="pt-24 pb-14 relative overflow-hidden min-h-[80vh]">
      <div className="absolute inset-0 hero-backdrop opacity-70" />
      <div className="absolute inset-0 grid-texture" />
      <div className="relative mx-auto max-w-[1200px] px-6 grid lg:grid-cols-2 gap-14 items-center">
        <Reveal>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white">
            Build what's <span className="text-gradient">next.</span>
          </h1>
          <p className="mt-4 text-[15px] text-[#A9B6D3]">Get started with DCS Connector OS.</p>
          <ul className="mt-8 space-y-3.5">
            {VALUE_POINTS.map((v) => (
              <li key={v} className="flex items-center gap-3 text-[14px] text-[#D6E1FF]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="rgba(33,200,122,0.16)" /><path d="m8 12.5 2.5 2.5L16 9.5" stroke="#21C87A" strokeWidth="2.2" strokeLinecap="round" /></svg>
                {v}
              </li>
            ))}
          </ul>
          <div className="hidden lg:block mt-8 glass-panel p-5 max-w-sm">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#93A0C2] mb-2">Pre-launch</div>
            <p className="text-[12.5px] leading-relaxed text-[#A9B6D3]">The developer console is in development. Accounts created here are provisioned when the console opens — no simulated access, no fake dashboard.</p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="glass-card p-8 max-w-md mx-auto w-full">
            <div className="flex gap-1 p-1 rounded-full glass-panel mb-7">
              {(['signin', 'create'] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`dcs-tab flex-1 text-center ${tab === t ? 'active' : ''}`}>
                  {t === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>
            <div className="space-y-4">
              {tab === 'create' && (
                <div>
                  <label className="block text-[12px] font-medium text-[#A9B6D3] mb-1.5">Full name</label>
                  <input className="dcs-input w-full px-4 py-2.5 text-[13.5px]" placeholder="Alex Chen" />
                </div>
              )}
              <div>
                <label className="block text-[12px] font-medium text-[#A9B6D3] mb-1.5">Work email</label>
                <input className="dcs-input w-full px-4 py-2.5 text-[13.5px]" placeholder="alex@company.com" type="email" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#A9B6D3] mb-1.5">Password</label>
                <input className="dcs-input w-full px-4 py-2.5 text-[13.5px]" type="password" placeholder="••••••••••" />
                {tab === 'create' && <div className="mt-1.5 text-right text-[11px] text-[#21C87A] font-medium">Strong</div>}
              </div>
              {tab === 'create' && (
                <label className="flex items-start gap-2.5 text-[12px] text-[#A9B6D3] cursor-pointer">
                  <input type="checkbox" className="mt-0.5 accent-[#6C63FF]" />
                  I agree to the <span className="text-[#5A7BFF]">Terms of Service</span> and <span className="text-[#5A7BFF]">Privacy Policy</span>
                </label>
              )}
              <button className="cta-primary w-full justify-center !py-3">
                {tab === 'signin' ? 'Sign in' : 'Create account'}
              </button>
              <p className="text-center text-[12px] text-[#93A0C2]">
                {tab === 'signin' ? (
                  <>Don't have an account? <button onClick={() => setTab('create')} className="text-[#5A7BFF] font-medium">Create one</button></>
                ) : (
                  <>Already have an account? <button onClick={() => setTab('signin')} className="text-[#5A7BFF] font-medium">Sign in</button></>
                )}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
