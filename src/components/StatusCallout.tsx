import { statusFor, labelColor, STATUS_AS_OF } from '../lib/status'

export function StatusCallout({ route }: { route: string }) {
  const items = statusFor(route)
  if (!items.length) return null
  return (
    <div className="mt-12 max-w-3xl glass-panel p-5">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#93A0C2] mb-3">Status of this capability</div>
      <div className="space-y-3">
        {items.map((i) => (
          <div key={i.id} className="flex gap-3 items-start">
            <span className="shrink-0 mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ color: labelColor(i.label), background: `${labelColor(i.label)}1f`, border: `1px solid ${labelColor(i.label)}55` }}>{i.label}</span>
            <span className="text-[12px] leading-relaxed text-[#A9B6D3]"><span className="text-[#D6E1FF] font-medium">{i.name}.</span> {i.note}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 text-[10.5px] text-[#93A0C2]">as of {STATUS_AS_OF} · full table on <a href="/developers/status" className="text-[#7EA2FF] underline underline-offset-2 hover:text-white transition-colors">Build status</a></div>
    </div>
  )
}
