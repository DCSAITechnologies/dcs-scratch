import { SectionHeader } from '../components/primitives'
import { Reveal } from '../hooks/Reveal'
import { AreaLinks } from '../components/AreaLinks'

const SECTIONS: { t: string; d: string; to: string }[] = [
  { t: 'Credential model', d: 'Agents never hold raw provider credentials. Credentials are stored scoped per connection and tenant, resolved only inside the execution runtime, and revocable by the tenant — revocation takes effect at the next dispatch check.', to: '/security/credential-isolation' },
  { t: 'Tenant isolation', d: 'Tenant isolation controls across organizations and connections. No cross-tenant data path in the execution layer.', to: '/security/tenant-boundaries' },
  { t: 'Routing / egress', d: 'Provider traffic exits through controlled egress only, bound to expected hosts and regions. Agents have no direct network path to providers.', to: '/security/routing-egress' },
  { t: 'Approval-gated execution', d: 'Destructive, admin and money-moving actions stop for human sign-off — exact-step bound, single-use, expiring.', to: '/security/approval-gated-actions' },
  { t: 'Blast-radius controls', d: 'Scoped permissions and fine-grained access keep the effective permission of any step at the intersection of scope, policy and approval.', to: '/security/blast-radius' },
  { t: 'Retry / reconciliation safety', d: 'Ambiguous writes are reconciled against provider state before any retry — duplicate effects are prevented by design.', to: '/security/retry-reconciliation' },
  { t: 'Kill / revoke controls', d: 'Emergency kill controls take precedence over approvals, retries and schedules. Suspend or revoke access at connection, agent or tenant level.', to: '/security/kill-controls' },
  { t: 'Webhook security', d: 'Signed provider webhooks are verified before acceptance, with replay protection and deduplication. Unsigned events are labelled honestly.', to: '/security/webhook-security' },
  { t: 'Secret & sensitive-data redaction', d: 'Secrets and sensitive values are redacted from logs, execution facts and receipts. Evidence records that a credential was used — never the credential.', to: '/security/redaction' },
  { t: 'Receipts / verification', d: 'Evidence flows from execution facts through an independent path to verifiable receipts — not from agent narration.', to: '/security/receipts-verification' },
  { t: 'Audit history', d: 'Tamper-evident audit history across plans, decisions, approvals, executions, recovery and administrative actions.', to: '/security/audit-history' },
  { t: 'Failure behavior', d: 'When in doubt, access is denied. Fail-closed evaluation, typed errors, and outcome_unknown as an explicit state — never silent retries.', to: '/security/failure-behavior' },
]

export function Security() {
  return (
    <div className="pt-24 pb-14">
      <div className="mx-auto max-w-[1400px] px-8">
        <SectionHeader
          titleAs="h1"          align="left"
          eyebrow="Security"
          title={<>Security by design.<br />Agent power <span className="text-gradient">with hard boundaries.</span></>}
          sub="How Connector OS keeps credentials, tenants, execution and evidence separated — twelve areas of the security model, each documented in depth."
        />

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SECTIONS.map((s, i) => (
            <Reveal key={s.t} delay={i * 40}>
              <a href={`${s.to}`} className="glass-card glass-card-hover p-6 h-full flex flex-col group">
                <div className="text-[9.5px] font-bold text-[#00C2FF] mb-2">{String(i + 1).padStart(2, '0')}</div>
                <h3 className="text-[15px] font-semibold text-white mb-1.5 group-hover:text-white">{s.t}</h3>
                <p className="text-[12.5px] leading-relaxed text-[#A9B6D3] flex-1">{s.d}</p>
                <span className="mt-3 text-[12px] font-semibold text-[#5A7BFF]">Read more →</span>
              </a>
            </Reveal>
          ))}
        </div>

        <div className="mt-14 glass-panel p-7 max-w-3xl">
          <div className="text-[15px] font-semibold text-white mb-2">A note on claims</div>
          <p className="text-[13px] leading-relaxed text-[#A9B6D3]">
            This page describes the security model as designed and implemented — not certifications. Connector OS does not claim SOC 2, ISO, HIPAA or any other certification unless and until there is evidence-backed, approved documentation for it. Where wording matters, we choose conservative phrasing: tenant isolation controls, tamper-evident audit history, emergency kill controls.
          </p>
        </div>

        <AreaLinks area="Security" title="Security, in depth" />

        <Reveal className="mt-14 text-center">
          <a href="/signin" className="cta-primary">Start building securely <span>→</span></a>
        </Reveal>
      </div>
    </div>
  )
}
