import { useState } from 'react'

// Stable hue per name, so a connector's monogram looks the same everywhere.
function hue(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return h % 360
}

/**
 * The provider's real logo: a vector brand mark (scripts/build-logos.mjs) or the asset
 * fetched from the provider's official domain. Rendered large inside a light tile.
 * With no logo (or if it fails to load), a tinted monogram.
 */
export function ConnectorLogo({ name, src, size = 36, bare = false }: { name: string; src: string; size?: number; bare?: boolean }) {
  const [err, setErr] = useState(!src)
  const initials = name.replace(/\(.*?\)/g, '').split(/[\s./-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'
  const h = hue(name)
  const radius = Math.round(size * 0.24)
  if (err) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center font-semibold"
        style={{ width: size, height: size, borderRadius: radius, background: `hsl(${h} 70% 95%)`, border: `1px solid hsl(${h} 45% 86%)`, color: `hsl(${h} 50% 30%)`, fontSize: Math.max(10, size * 0.36), letterSpacing: '-0.02em' }}
        aria-hidden="true"
      >
        {initials}
      </span>
    )
  }
  // bare: the caller already draws the tile (hero canvases) — the mark fills it
  const inner = Math.round(size * (bare ? 0.86 : 0.72))
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden"
      style={bare ? { width: size, height: size } : { width: size, height: size, borderRadius: radius, background: '#FFFFFF', border: '1px solid #E3E7EE' }}
    >
      <img
        src={src}
        alt={`${name} logo`}
        width={inner}
        height={inner}
        loading="lazy"
        decoding="async"
        onError={() => setErr(true)}
        style={{ width: inner, height: inner, objectFit: 'contain' }}
      />
    </span>
  )
}
