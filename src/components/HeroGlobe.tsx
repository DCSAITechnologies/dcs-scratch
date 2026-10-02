import { BrandIcon } from './BrandIcon'

/**
 * Approved-design hero globe (reference board 01, Home):
 * large layered sphere with rim glow, wireframe lat/long, 3 orbit rings,
 * connector anchor chips sitting on the orbits, sweeping wave arcs,
 * pulsing core, overlay card, vertical side label.
 */
export function HeroGlobe({ size = 600 }: { size?: number }) {
  // connector anchors placed on the orbit paths (percent coords of the wrapper)
  const nodes = [
    { brand: 'slack', x: 30, y: 16, d: 0.0 },
    { brand: 'gdrive', x: 47, y: 34, d: 0.6 },
    { brand: 'notion', x: 76, y: 18, d: 1.2 },
    { brand: 'salesforce', x: 84, y: 55, d: 0.3 },
    { brand: 'github', x: 30, y: 72, d: 0.9 },
    { brand: 'stripe', x: 52, y: 82, d: 1.5 },
    { brand: 'ms365', x: 12, y: 44, d: 0.4 },
    { brand: 'jira', x: 74, y: 86, d: 1.0 },
  ]

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* ambient glow */}
      <div
        className="absolute rounded-full anim-pulse-glow"
        style={{
          inset: '4%',
          background: 'radial-gradient(circle at 50% 48%, rgba(108,99,255,0.34), rgba(0,194,255,0.08) 45%, rgba(0,0,0,0) 68%)',
        }}
      />

      {/* sphere */}
      <svg viewBox="0 0 600 600" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="dcs-sphere" cx="42%" cy="38%">
            <stop offset="0%" stopColor="rgba(139,92,246,0.4)" />
            <stop offset="45%" stopColor="rgba(26,31,84,0.75)" />
            <stop offset="100%" stopColor="rgba(8,16,34,0.95)" />
          </radialGradient>
          <linearGradient id="dcs-rim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(139,92,246,0.9)" />
            <stop offset="50%" stopColor="rgba(90,123,255,0.5)" />
            <stop offset="100%" stopColor="rgba(124,77,255,0.85)" />
          </linearGradient>
          <linearGradient id="dcs-wire" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(90,123,255,0.5)" />
            <stop offset="100%" stopColor="rgba(124,77,255,0.3)" />
          </linearGradient>
        </defs>

        {/* wave lines sweeping behind/around the globe */}
        <path d="M-20 380 C 120 300, 220 460, 340 380 S 520 300, 640 390" fill="none" stroke="rgba(0,194,255,0.45)" strokeWidth="1.6" strokeDasharray="90 240" style={{ animation: 'dcs-sweep 7s linear infinite' }} />
        <path d="M-20 210 C 100 280, 230 130, 360 215 S 540 285, 640 200" fill="none" stroke="rgba(108,99,255,0.5)" strokeWidth="1.4" strokeDasharray="60 260" style={{ animation: 'dcs-sweep 9s linear infinite reverse' }} />
        <path d="M-20 300 C 140 250, 260 350, 400 300 S 560 250, 640 310" fill="none" stroke="rgba(139,92,246,0.3)" strokeWidth="1" strokeDasharray="30 150" style={{ animation: 'dcs-sweep 12s linear infinite' }} />

        {/* rotating wireframe */}
        <g className="anim-spin-slower" style={{ transformOrigin: '300px 300px' }}>
          <circle cx="300" cy="300" r="196" fill="url(#dcs-sphere)" stroke="url(#dcs-rim)" strokeWidth="1.6" />
          {[0.28, 0.5, 0.72].map((f, i) => {
            const y = 300 - 196 + 392 * f
            const rx = Math.sqrt(Math.max(196 ** 2 - (196 - 392 * f) ** 2, 0))
            return <ellipse key={i} cx="300" cy={y} rx={rx} ry={rx * 0.16} fill="none" stroke="url(#dcs-wire)" strokeWidth="0.9" opacity="0.75" />
          })}
          {[0, 30, 60, 90, 120, 150].map((a) => (
            <ellipse key={`v${a}`} cx="300" cy="300" rx={196 * Math.abs(Math.cos((a * Math.PI) / 180))} ry="196" fill="none" stroke="url(#dcs-wire)" strokeWidth="0.8" opacity="0.45" transform={`rotate(${a} 300 300)`} />
          ))}
          {/* surface light points */}
          {[[220, 210], [360, 180], [420, 300], [250, 380], [330, 420], [390, 360], [180, 300]].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="2.4" fill="#8B9BFF" opacity="0.85" className="anim-breathe" style={{ animationDelay: `${i * 0.5}s` }} />
          ))}
        </g>

        {/* orbit rings */}
        <g className="anim-spin-slow" style={{ transformOrigin: '300px 300px' }}>
          <ellipse cx="300" cy="300" rx="268" ry="96" fill="none" stroke="rgba(90,123,255,0.5)" strokeWidth="1.1" strokeDasharray="5 9" />
          <circle cx="568" cy="300" r="4" fill="#5A7BFF" style={{ filter: 'drop-shadow(0 0 6px #5A7BFF)' }} />
          <circle cx="40" cy="285" r="2.6" fill="#00C2FF" opacity="0.9" />
        </g>
        <g className="anim-spin-rev" style={{ transformOrigin: '300px 300px' }}>
          <ellipse cx="300" cy="300" rx="238" ry="158" fill="none" stroke="rgba(139,92,246,0.42)" strokeWidth="1" strokeDasharray="3 10" transform="rotate(-26 300 300)" />
          <circle cx="300" cy="142" r="3.4" fill="#8B5CF6" style={{ filter: 'drop-shadow(0 0 6px #8B5CF6)' }} />
        </g>
        <g className="anim-spin-slow" style={{ transformOrigin: '300px 300px', animationDuration: '56s' }}>
          <ellipse cx="300" cy="300" rx="290" ry="120" fill="none" stroke="rgba(0,194,255,0.22)" strokeWidth="0.8" transform="rotate(14 300 300)" />
        </g>

        {/* connective arcs from globe edge to anchor nodes */}
        {[
          'M300 104 Q 240 60 196 96',
          'M470 180 Q 510 120 556 108',
          'M496 330 Q 560 330 596 330',
          'M196 430 Q 170 470 176 500',
          'M330 496 Q 350 540 312 566',
        ].map((d, i) => (
          <path key={i} d={d} fill="none" stroke="rgba(90,123,255,0.35)" strokeWidth="1" strokeDasharray="4 6" />
        ))}
      </svg>

      {/* connector anchor chips */}
      {nodes.map((n) => (
        <div
          key={n.brand + n.x}
          className="absolute anim-float"
          style={{ left: `${n.x}%`, top: `${n.y}%`, transform: 'translate(-50%,-50%)', animationDelay: `${n.d}s`, zIndex: 2 }}
        >
          <div
            className="flex items-center justify-center w-[52px] h-[52px] rounded-2xl transition-all duration-300 hover:scale-110"
            style={{
              background: 'linear-gradient(160deg, rgba(20,30,66,0.95), rgba(13,20,48,0.95))',
              border: '1px solid rgba(120,140,255,0.4)',
              boxShadow: '0 0 26px rgba(108,99,255,0.45), inset 0 0 0 1px rgba(255,255,255,0.07), 0 8px 24px rgba(0,0,0,0.45)',
            }}
          >
            <BrandIcon brand={n.brand} size={26} />
          </div>
        </div>
      ))}

      {/* overlay card */}
      <div
        className="absolute glass-panel rounded-2xl px-4 py-3 anim-float"
        style={{ left: '56%', top: '42%', animationDelay: '1.1s', zIndex: 3, boxShadow: '0 16px 44px rgba(0,0,0,.5), 0 0 32px rgba(92,110,255,.25)' }}
      >
        <div className="flex items-center gap-2.5 whitespace-nowrap">
          <span className="relative flex w-2 h-2">
            <span className="absolute inline-flex w-full h-full rounded-full bg-[#21C87A] opacity-60 animate-ping" />
            <span className="relative inline-flex w-2 h-2 rounded-full bg-[#21C87A]" />
          </span>
          <span className="text-[13px] font-medium leading-snug text-white">AI agents<br />connected to<br />the real world.</span>
        </div>
      </div>
    </div>
  )
}
