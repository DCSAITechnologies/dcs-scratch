import { FEATURED, FEATURED_ROWS, type FeaturedRow } from 'virtual:catalogue-summary'
import { ConnectorLogo } from './ConnectorLogo'

const STEPS = ['Agent', 'Policy', 'Approve', 'Execute', 'Verify', 'Receipt']
// Previously slack/salesforce/github/… — none are canonical rows, so the visual
// rendered with no nodes. Ids now come from featured.json (build-validated).
const NODE_IDS = FEATURED.heroNodes
// percentage positions around the core
const POS = [
  { x: 8, y: 14 }, { x: 44, y: 2 }, { x: 78, y: 12 }, { x: 88, y: 46 },
  { x: 74, y: 80 }, { x: 40, y: 90 }, { x: 6, y: 74 }, { x: 0, y: 42 },
]

export function OrchestrationVisual() {
  const nodes = NODE_IDS.map((id, i) => {
    const c = FEATURED_ROWS[id]
    return c ? { c, ...POS[i] } : null
  }).filter(Boolean) as { c: FeaturedRow; x: number; y: number }[]

  return (
    <div className="relative w-[600px] h-[600px] max-w-full mx-auto select-none" aria-hidden>
      {/* rings */}
      <div className="absolute inset-[6%] rounded-full anim-spin-slower" style={{ border: '1px dashed rgba(0,194,255,0.22)' }} />
      <div className="absolute inset-[16%] rounded-full anim-spin-rev" style={{ border: '1px dashed rgba(108,99,255,0.25)' }} />
      <div className="absolute inset-[27%] rounded-full" style={{ border: '1px solid rgba(120,140,255,0.14)' }} />
      {/* connective lines */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="oc-line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6C63FF" stopOpacity="0.55" />
            <stop offset="1" stopColor="#00C2FF" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        {nodes.map((nd, i) => (
          <line key={i} x1={`${nd.x + 5}%`} y1={`${nd.y + 5}%`} x2="50%" y2="50%" stroke="url(#oc-line)" strokeWidth="1" strokeDasharray="3 5" className="anim-dashflow" />
        ))}
      </svg>
      {/* data packets travelling to/from core */}
      {nodes.map((nd, i) => (
        <span
          key={`pkt-${i}`}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            background: i % 2 ? '#00C2FF' : '#8B5CF6',
            boxShadow: `0 0 8px ${i % 2 ? '#00C2FF' : '#8B5CF6'}`,
            offsetPath: `path('M ${nd.x * 6 + 30} ${nd.y * 6 + 30} L 300 300')`,
            animation: `dcs-packet ${6 + (i % 4) * 1.5}s linear infinite`,
            animationDelay: `${i * 0.9}s`,
          } as React.CSSProperties}
        />
      ))}
      {/* core */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[42%] aspect-square rounded-3xl flex flex-col items-center justify-center text-center anim-breathe"
        style={{
          background: 'radial-gradient(circle at 35% 30%, rgba(108,99,255,0.4), rgba(16,26,56,0.95) 70%)',
          border: '1px solid rgba(108,99,255,0.6)',
          boxShadow: '0 0 60px rgba(108,99,255,0.35), inset 0 0 40px rgba(0,194,255,0.08)',
        }}
      >
        <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#00C2FF] mb-2">Connector OS</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-4">
          {STEPS.map((s) => (
            <span key={s} className="text-[10.5px] font-semibold text-[#D6E1FF] flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[#8B5CF6]" style={{ boxShadow: '0 0 6px #8B5CF6' }} />
              {s}
            </span>
          ))}
        </div>
      </div>
      {/* connector nodes */}
      {nodes.map((nd, i) => (
        <div
          key={nd.c.id}
          className="absolute flex flex-col items-center gap-1.5 anim-float"
          style={{ left: `${nd.x}%`, top: `${nd.y}%`, animationDelay: `${i * 0.7}s` }}
        >
          <span className="p-1.5 rounded-xl" style={{ background: 'rgba(13,20,48,0.9)', border: '1px solid rgba(120,140,255,0.35)', boxShadow: '0 0 18px rgba(108,99,255,0.25)' }}>
            <ConnectorLogo name={nd.c.n} src={nd.c.logo} size={30} />
          </span>
          <span className="text-[9.5px] font-medium text-[#93A0C2]">{nd.c.n}</span>
        </div>
      ))}
    </div>
  )
}
