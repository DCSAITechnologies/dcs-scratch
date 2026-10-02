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
      <Title className="text-3xl md:text-4xl font-semibold tracking-tight text-white">{title}</Title>
      {sub && <p className={`mt-3 text-[15px] leading-relaxed text-[#A9B6D3] ${align === 'center' ? 'max-w-2xl mx-auto' : 'max-w-xl'}`}>{sub}</p>}
    </Reveal>
  )
}

export function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    Success: '#21C87A', Verified: '#21C87A', Healthy: '#21C87A',
    Failed: '#EF4444', Refused: '#EF4444', Blocked: '#EF4444',
    Unknown: '#A9B6D3', Degraded: '#F5A524', Pending: '#F5A524',
  }
  const c = map[status] ?? '#4D8DFF'
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
          style={{ background: 'rgba(108,99,255,0.14)', border: '1px solid rgba(120,140,255,0.3)', boxShadow: '0 0 18px rgba(108,99,255,0.2)' }}
        >
          {icon}
        </div>
        <div className="eyebrow mb-2">{eyebrow}</div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-[13.5px] leading-relaxed text-[#A9B6D3] mb-5">{desc}</p>
        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#5A7BFF]">
          {cta}
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </span>
      </a>
    </Reveal>
  )
}
