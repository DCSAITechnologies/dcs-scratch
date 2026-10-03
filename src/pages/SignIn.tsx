import { Reveal } from '../hooks/Reveal'

// Pre-launch sign-in. There is no identity provider, account store or session
// backend yet (IdP is an external dependency — see /developers/status), so this
// page collects nothing. It previously rendered an email/password form whose
// submit button did nothing, plus "Free to start / No credit card required"
// claims that no approved pricing supports.

const FACTS = [
  'Accounts and sign-in open at launch — no account can be created yet',
  'The console preview runs on hermetic fixture data, not your systems',
  'The connector catalogue is public and needs no account',
]

export function SignIn() {
  return (
    <div className="pt-24 pb-14 relative overflow-hidden min-h-[80vh]">
      <div className="absolute inset-0 hero-backdrop opacity-70" />
      <div className="absolute inset-0 grid-texture" />
      <div className="relative mx-auto max-w-[1200px] px-6 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
        <Reveal>
          <div className="eyebrow mb-4">Pre-launch</div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#0B1220]">
            Sign-in opens <span className="text-gradient">at launch.</span>
          </h1>
          <p className="mt-4 text-[15px] text-[#3A4357] max-w-lg">
            DCS Connector OS is pre-launch. There is no account system yet, so this page does not ask for credentials.
          </p>
          <ul className="mt-8 space-y-3.5">
            {FACTS.map((v) => (
              <li key={v} className="flex items-center gap-3 text-[14px] text-[#1E2638]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2850D8] shrink-0" />
                {v}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={120}>
          <div className="glass-card p-8 max-w-md mx-auto w-full space-y-4">
            <a href="/app" className="cta-primary w-full justify-center !py-3 block text-center">Open the console preview</a>
            <p className="text-[12px] text-[#566074] leading-relaxed">
              The preview uses a demo identity and fixture data from the hermetic build. Actions that need a live backend are shown disabled with their maturity.
            </p>
            <a href="/connectors" className="cta-secondary w-full justify-center block text-center">Browse the connector catalogue</a>
            <a href="/enterprise/contact" className="cta-secondary w-full justify-center block text-center">Talk to the team</a>
            <a href="/developers/status" className="block text-center text-[12px] text-[#2850D8]">Build status →</a>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
