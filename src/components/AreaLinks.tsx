import { AREA_LINKS } from '../lib/subpages'

export function AreaLinks({ area, title }: { area: string; title?: string }) {
  const links = (AREA_LINKS[area] ?? []).filter(([to]) => to.split('/').length > 2)
  return (
    <div className="mt-16">
      <div className="eyebrow mb-3">{area}</div>
      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">{title ?? `Explore ${area} in depth`}</h2>
      <div className="mt-7 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map(([to, label]) => (
          <a key={to} href={`${to}`} className="glass-card glass-card-hover px-5 py-4 flex items-center justify-between group">
            <span className="text-[13.5px] font-medium text-[#D6E1FF] group-hover:text-white transition-colors">{label}</span>
            <span className="text-[#5A7BFF] group-hover:translate-x-0.5 transition-transform">→</span>
          </a>
        ))}
      </div>
    </div>
  )
}
