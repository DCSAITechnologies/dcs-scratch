import type { ReactNode } from 'react'
import { Reveal } from '../hooks/Reveal'

export function SectionHeader({
  eyebrow,
  title,
  sub,
  align = 'center',
  titleAs = 'h2',
}: {
  eyebrow: string
  title: ReactNode
  sub?: string
  align?: 'center' | 'left'
  titleAs?: 'h1' | 'h2'
}) {
  const Title = titleAs
  return (
    <Reveal className={align === 'center' ? 'text-center' : 'text-left'}>
      <div className="eyebrow mb-3">{eyebrow}</div>
      <Title className="text-3xl md:text-4xl font-semibold tracking-tight text-[#0B1220]">{title}</Title>
      {sub && <p className={`mt-3 text-[15px] leading-relaxed text-[#3A4357] ${align === 'center' ? 'max-w-2xl mx-auto' : 'max-w-xl'}`}>{sub}</p>}
    </Reveal>
  )
}

export function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    Success: '#047857', Verified: '#047857', Healthy: '#047857',
    Failed: '#B91C1C', Refused: '#B91C1C', Blocked: '#B91C1C',
    Unknown: '#3A4357', Degraded: '#B45309', Pending: '#B45309',
  }
  const c = map[status] ?? '#2850D8'
  return (
    <span className="status-pill" style={{ background: `${c}1f`, color: c, border: `1px solid ${c}55` }}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'Success' || status === 'Healthy' ? 'anim-breathe' : ''}`} style={{ background: c }} />
      {status}
    </span>
  )
}

export function TeaserCard({
  eyebrow,
  title,
  desc,
  cta,
  href,
  icon,
  delay = 0,
}: {
  eyebrow: string
  title: string
  desc: string
  cta: string
  href: string
  icon: ReactNode
  delay?: number
}) {
  return (
    <Reveal delay={delay}>
      <a href={`${href}`} className="glass-card glass-card-hover block p-7 h-full group">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
          style={{ background: '#EDF2FF', border: '1px solid #E3E7EE', boxShadow: '0 0 18px rgba(40,80,216,0.10)' }}
        >
          {icon}
        </div>
        <div className="eyebrow mb-2">{eyebrow}</div>
        <h3 className="text-xl font-semibold text-[#0B1220] mb-2">{title}</h3>
        <p className="text-[13.5px] leading-relaxed text-[#3A4357] mb-5">{desc}</p>
        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2850D8]">
          {cta}
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </span>
      </a>
    </Reveal>
  )
}
