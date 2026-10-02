import { useState } from 'react'

/** Renders the provider's original logo (favicon-resolved official domain asset) with a graceful monogram fallback. */
export function ConnectorLogo({ name, src, size = 36 }: { name: string; src: string; size?: number }) {
  const [err, setErr] = useState(!src)
  const initials = name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  return (
    <span
      className="inline-flex items-center justify-center rounded-lg overflow-hidden shrink-0"
      style={{
        width: size, height: size,
        background: 'rgba(255,255,255,0.92)',
        border: '1px solid rgba(120,140,255,0.25)',
      }}
    >
      {err ? (
        <span style={{ fontSize: size * 0.34, fontWeight: 700, color: '#1B2450' }}>{initials}</span>
      ) : (
        <img
          src={src}
          alt={`${name} logo`}
          width={size - 8}
          height={size - 8}
          loading="lazy"
          onError={() => setErr(true)}
          style={{ objectFit: 'contain' }}
        />
      )}
    </span>
  )
}
