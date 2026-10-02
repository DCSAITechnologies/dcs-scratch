import type React from 'react'
const paths: Record<string, React.ReactElement> = {
  gdrive: (
    <>
      <path d="M8 3 L3 12 L6.5 18 L11.5 9 Z" fill="#188038" />
      <path d="M8 3 L16 3 L21 12 L13 12 Z" fill="#FBBC04" />
      <path d="M6.5 18 L13 12 L21 12 L14.5 18 Z" fill="#34A853" />
    </>
  ),
  slack: (
    <>
      <rect x="2" y="9" width="6" height="6" rx="3" fill="#36C5F0" />
      <rect x="9" y="2" width="6" height="6" rx="3" fill="#E01E5A" />
      <rect x="16" y="9" width="6" height="6" rx="3" fill="#ECB22E" />
      <rect x="9" y="16" width="6" height="6" rx="3" fill="#2EB67D" />
    </>
  ),
  notion: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="4" fill="#fff" />
      <path d="M8 17 V7 h2.2 l4.4 6.6 V7 H17 v10 h-2.2 L10.4 10.4 V17 Z" fill="#000" />
    </>
  ),
  salesforce: (
    <>
      <path d="M9 8a4.5 4.5 0 0 1 4.4-3.6A5 5 0 0 1 18 7.2 4.2 4.2 0 0 1 19.5 15H8a4 4 0 0 1 1-7.9Z" fill="#00A1E0" />
    </>
  ),
  github: (
    <>
      <path fill="#fff" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.58 9.58 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85V21c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </>
  ),
  stripe: (
    <>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="#635BFF" />
      <path fill="#fff" d="M13.6 10.2c0-.7.6-1 1.5-1 1 0 2.2.3 3.2.9V6.9a8.4 8.4 0 0 0-3.2-.6c-2.6 0-4.3 1.3-4.3 3.6 0 3.5 4.8 2.9 4.8 4.4 0 .8-.7 1.1-1.7 1.1-1.2 0-2.7-.5-3.9-1.1v3.2c1.3.6 2.6.8 3.9.8 2.7 0 4.5-1.3 4.5-3.6 0-3.8-4.8-3.1-4.8-4.5Z" />
    </>
  ),
  ms365: (
    <>
      <rect x="2" y="2" width="9" height="9" rx="1.5" fill="#F25022" />
      <rect x="13" y="2" width="9" height="9" rx="1.5" fill="#7FBA00" />
      <rect x="2" y="13" width="9" height="9" rx="1.5" fill="#00A4EF" />
      <rect x="13" y="13" width="9" height="9" rx="1.5" fill="#FFB900" />
    </>
  ),
  jira: (
    <>
      <path fill="#2684FF" d="M22 11.5 13.2 2.7 12 1.5 3.6 9.9a1.2 1.2 0 0 0 0 1.7l5.4 5.4 3 3 8.4-8.4a1.2 1.2 0 0 0 0-1.7ZM12 15.5 8.5 12 12 8.5 15.5 12Z" />
    </>
  ),
  confluence: (
    <>
      <path fill="#2684FF" d="M3 16.5c2.5-1.6 5-2.4 7.5-1.2l4.2 2c1.6.7 3.3.3 4.8-.9l1.5-1.2-1.6-1.3c-2.4 1.6-4.9 2.4-7.4 1.2l-4.2-2c-1.6-.8-3.4-.3-4.8.8Zm18-9c-2.5 1.6-5 2.4-7.5 1.2l-4.2-2c-1.6-.7-3.3-.3-4.8.9L3 8.8l1.6 1.3c2.4-1.6 4.9-2.4 7.4-1.2l4.2 2c1.6.8 3.4.3 4.8-.8Z" />
    </>
  ),
  hubspot: (
    <>
      <circle cx="16" cy="6" r="3" fill="#FF7A59" />
      <path fill="#FF7A59" d="M11.5 8.6a4.5 4.5 0 1 0 2.6 8.1l3.4 3.4 1.4-1.4-3.4-3.4a4.48 4.48 0 0 0 .6-2.3 4.5 4.5 0 0 0-4.6-4.4Zm0 6.4a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
    </>
  ),
  mongodb: (
    <>
      <path fill="#47A248" d="M12 2c2.5 2.6 4.5 5.6 4.5 9.3 0 3.6-1.9 6.6-4 8.2l-.5 2.5-.5-2.5c-2.1-1.6-4-4.6-4-8.2C7.5 7.6 9.5 4.6 12 2Z" />
    </>
  ),
  sendgrid: (
    <>
      <rect x="2" y="2" width="9" height="9" rx="1" fill="#1A82E2" />
      <rect x="13" y="2" width="9" height="9" rx="1" fill="#1A82E2" opacity=".6" />
      <rect x="2" y="13" width="9" height="9" rx="1" fill="#1A82E2" opacity=".6" />
      <rect x="13" y="13" width="9" height="9" rx="1" fill="#00B2E3" />
    </>
  ),
  postgres: (
    <>
      <circle cx="12" cy="12" r="9" fill="none" stroke="#A9B6D3" strokeWidth="2" />
      <path fill="#A9B6D3" d="M8 12c1.5-2 6.5-2 8 0-1.5 2-6.5 2-8 0Z" />
    </>
  ),
}

export function BrandIcon({ brand, size = 24 }: { brand: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      {paths[brand] ?? <circle cx="12" cy="12" r="9" fill="#5A7BFF" />}
    </svg>
  )
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <a href="/" className="flex items-center gap-2.5 group">
      <span
        className="relative flex items-center justify-center w-8 h-8 rounded-xl"
        style={{
          background: 'linear-gradient(135deg, #5A7BFF, #7C4DFF)',
          boxShadow: '0 0 18px rgba(108,99,255,.5)',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M4 12a8 8 0 0 1 16 0" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="12" cy="14" r="3.2" fill="#fff" />
          <circle cx="12" cy="4" r="1.6" fill="#fff" opacity=".85" />
        </svg>
      </span>
      {!compact && (
        <span className="text-[15px] font-semibold tracking-tight text-white font-display">
          DCS Connector OS
        </span>
      )}
    </a>
  )
}
