import { useEffect, useState } from 'react'
import { TOTAL_CATALOGUED, resolvePublic, LEGACY_REFERENCE_MAP, rwLabel, dispatchReasonLabel, isAvailableToConnect, statusColor, ctaLabel, runtimeStatusLabel, isTemplated, type Conn } from '../lib/data'
import { ConnectorLogo } from '../components/ConnectorLogo'
import { navigate } from '../hooks/usePathRoute'

const TABS = ['Overview', 'Tools', 'Authentication', 'Permissions', 'Webhooks', 'Documentation'] as const

function Row({ k, v, mono }: { k: string; v: string | null; mono?: boolean }) {
  if (!v) return null
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-[#E3E7EE] last:border-0">
      <span className="text-[12px] text-[#566074] shrink-0">{k}</span>
      <span className="text-[12.5px] text-[#1E2638] text-right" style={mono ? { fontFamily: 'JetBrains Mono', fontSize: 11.5 } : undefined}>{v}</span>
    </div>
  )
}

function RedirectSurface({ from, to }: { from: string; to: string }) {
  // client-side 301-equivalent: an alias or legacy id lands on the record it now resolves to
  // (a canonical row, or — for 8 legacy redirects — another legacy reference surface)
  useEffect(() => { const t = setTimeout(() => navigate(to), 1200); return () => clearTimeout(t) }, [to])
  return (
    <div className="pt-32 pb-24 text-center mx-auto max-w-xl px-6">
      <div className="eyebrow mb-3">301 — Moved</div>
      <h1 className="text-2xl text-[#0B1220] font-semibold">This connector moved</h1>
      <p className="mt-3 text-[13.5px] text-[#3A4357] leading-relaxed">
        The identifier <span className="font-mono text-[12px]">{from}</span> now resolves to <span className="font-mono text-[12px]">{to}</span>.
      </p>
      <a href={to} className="cta-primary inline-block mt-6">Open record →</a>
    </div>
  )
}

export function ConnectorDetail({ id }: { id: string }) {
  const res = resolvePublic(id)
  if (res?.kind === 'redirect') return <RedirectSurface from={id} to={res.to} />
  if (res?.kind === 'unpublished') {
    // HOLD rows stay in the data (audit trail) but their content never renders publicly
    return (
      <div className="pt-32 pb-24 text-center mx-auto max-w-xl px-6">
        <div className="eyebrow mb-3">Not listed</div>
        <h1 className="text-2xl text-[#0B1220] font-semibold">This connector is not publicly listed</h1>
        <p className="mt-3 text-[13.5px] text-[#3A4357] leading-relaxed">
          The record is held for review and is not published in the catalogue. No details are shown until the hold is resolved.
        </p>
        <a href="/connectors" className="cta-secondary inline-block mt-6">Browse the catalogue</a>
      </div>
    )
  }
  const resolved = res?.kind === 'record' ? res.c : null
  const legacy = LEGACY_REFERENCE_MAP.get(id)
  // Lane 6 route behaviors for legacy ids
  const legacyBehavior = legacy?.lane6_behavior
  if (!resolved && legacy && (legacyBehavior === 'GONE' || legacyBehavior === 'GONE_RETIRED_NOTICE')) {
    return (
      <div className="pt-32 pb-24 text-center mx-auto max-w-xl px-6">
        <div className="eyebrow mb-3">410 — Gone</div>
        <h1 className="text-2xl text-[#0B1220] font-semibold">This legacy catalogue entry has been removed</h1>
        <p className="mt-3 text-[13.5px] text-[#3A4357] leading-relaxed">
          Lane 6 reconciliation classified this legacy record as {legacyBehavior === 'GONE_RETIRED_NOTICE' ? 'RETIRED' : 'INVALID / UNSUPPORTED'}.
          It is not part of the canonical engineering catalogue and carries no runtime meaning.
        </p>
        <a href="/connectors" className="cta-secondary inline-block mt-6">Browse the canonical catalogue</a>
      </div>
    )
  }
  if (!resolved && legacy && legacyBehavior === 'REDIRECT' && legacy.lane6_redirect_to) {
    return <RedirectSurface from={id} to={legacy.lane6_redirect_to} />
  }
  if (!resolved && legacy && legacyBehavior === 'UNLIST_NO_REDIRECT') {
    return (
      <div className="pt-32 pb-24 text-center">
        <h1 className="text-2xl text-[#0B1220] font-semibold">Connector not found</h1>
        <a href="/connectors" className="cta-secondary inline-block mt-6">Back to catalogue</a>
      </div>
    )
  }
  const c = resolved ?? legacy
  if (!c) {
    return (
      <div className="pt-32 pb-24 text-center">
        <div className="text-2xl text-[#0B1220] font-semibold">Connector not found</div>
        <a href="/connectors" className="cta-secondary inline-block mt-6">Back to catalogue</a>
      </div>
    )
  }
  return <ConnectorDetailView c={c} legacy={legacy} resolved={resolved} />
}

function ConnectorDetailView({ c, legacy, resolved }: { c: Conn; legacy?: Conn; resolved: Conn | null }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Overview')
  const rawDocs: [string, string | null][] = [
    ['Official website', c.site], ['Developer portal', c.portal], ['API documentation', c.api],
    ['Authentication docs', c.authDocs], ['Webhook docs', c.whDocs], ['Provider status', c.statusUrl],
  ]
  // never render the same URL twice under two labels — keep the first occurrence
  const seenUrls = new Set<string>()
  const docs = rawDocs.filter(([, url]) => {
    if (!url) return true
    if (seenUrls.has(url)) return false
    seenUrls.add(url)
    return true
  })
  const opColor: Record<string, string> = { Read: '#2850D8', Write: '#B45309', Destructive: '#B91C1C', Admin: '#1E40AF', 'Money-moving': '#B91C1C' }

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-[1400px] px-8">
        <a href="/connectors" className="text-[12.5px] text-[#566074] hover:text-[#0B1220] transition-colors">← All connectors</a>

        {/* Layout: left column = hero + tabs + content; right column = sticky facts card */}
        <div className="connector-layout mt-5 flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
          {/* Hero (left, row 1) */}
          <div className="order-1 lg:col-start-1 lg:row-start-1">
            {c.unreconciled && (
              <div className="mb-5 p-4 rounded-xl text-[12.5px] leading-relaxed" style={{ background: 'rgba(245,165,36,0.08)', border: '1px solid rgba(245,165,36,0.35)', color: '#B45309' }}>
                This catalogue record is pending reconciliation against the frozen engineering set and is shown as Coming Soon until verified. It does not represent an engineered connector.
              </div>
            )}
            {legacy && !resolved && (
              <div className="mb-5 p-4 rounded-xl text-[12.5px] leading-relaxed" style={{ background: '#F5F7FB', border: '1px solid #E3E7EE', color: '#3A4357' }}>
                <span className="font-semibold text-[#1E2638]">REFERENCE / LEGACY CATALOGUE SURFACE.</span>{' '}
                This is a preserved record from the legacy 750-row catalogue with no mapping into the canonical engineering catalogue ({TOTAL_CATALOGUED} records). It is not an engineered connector, carries no runtime status, and is excluded from all connector counts. Lane 6 is auditing it — outcomes: KEEP AS REFERENCE · MERGE/ALIAS · PROMOTE · RETIRE · DELETE.
              </div>
            )}
            <div className="flex items-start gap-5">
              <ConnectorLogo name={c.n} src={c.logo} size={72} />
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-semibold tracking-tight text-[#0B1220]">{c.n}</h1>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ color: statusColor(c.s), background: `${statusColor(c.s)}1f`, border: `1px solid ${statusColor(c.s)}55` }}>{c.s}</span>
                  <span className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ color: '#566074', background: '#F5F7FB', border: '1px solid #E3E7EE' }}>{runtimeStatusLabel(c)}</span>
                </div>
                <div className="mt-1 text-[13px] text-[#566074]">{c.p} · {c.cat}</div>
              </div>
            </div>
            <p className="mt-5 max-w-2xl text-[14.5px] leading-relaxed text-[#3A4357]">{c.d}</p>
            {c.core && !isAvailableToConnect(c) && (
              <p className="mt-3 max-w-2xl text-[12.5px] text-[#566074]" data-testid="dispatch-truth">
                Not available to connect yet — Connector OS core reports: {c.core.dispatch.reasons.map(dispatchReasonLabel).join('; ')}.
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              {c.cta === 'coming_soon'
                ? <span className="cta-secondary opacity-60 cursor-not-allowed">Coming Soon</span>
                : c.cta === 'request_access'
                  ? <a href="/enterprise/contact" className="cta-primary">Request Access</a>
                  : c.cta === 'contact'
                    ? <a href="/enterprise/contact" className="cta-primary">Contact Us</a>
                    : <a href="/signin" className="cta-primary">{ctaLabel(c)}</a>}
              {c.portal
                ? <a href={c.portal} target="_blank" rel="noreferrer" className="cta-secondary">Official documentation ↗</a>
                : <a href={c.site} target="_blank" rel="noreferrer" className="cta-secondary">Provider website ↗</a>}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="chip">{c.auth}</span>
              <span className="chip">{rwLabel(c.rw)}</span>
              {c.wh && <span className="chip">Webhooks</span>}
              {c.ops.includes('Money-moving') && <span className="chip" style={{ borderColor: '#EF444466', color: '#B91C1C' }}>Money-moving</span>}
            </div>
          </div>

          {/* Facts card (right, sticky, independent column) */}
          <aside className="order-2 mt-8 lg:mt-0 lg:col-start-2 lg:row-start-1 lg:row-span-2">
            <div className="glass-panel p-5 lg:sticky lg:top-24">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#566074] mb-2">Connection details</div>
              <Row k="Catalogue status" v={c.s} />
              <Row k="Runtime status" v={runtimeStatusLabel(c)} />
              {c.runtime_status && c.runtime_status !== 'not_verified' && c.verified && <Row k="Runtime verified on" v={c.verified} />}
              <Row k="Provider" v={c.p} />
              <Row k="Category" v={c.cat} />
              <Row k="Authentication" v={c.auth} />
              <Row k="Read/write" v={rwLabel(c.rw)} />
              <Row k="Webhooks" v={c.wh ? 'Supported' : 'Not currently supported'} />
              <Row k="Access model" v={c.cta === 'notify' ? 'Opens at launch' : c.cta === 'request_access' ? 'Approval required' : c.cta === 'contact' ? 'Enterprise onboarding' : 'Not yet available'} />
                            <Row k="Docs verified" v={c.verified} />
              <Row k="Catalogue rank" v={c.r == null ? (c.core ? `Unranked (${c.core.pack === 'GOLDEN-FIVE' ? 'Golden Five' : c.core.pack.toLowerCase()} pack)` : null) : `#${c.r} of ${TOTAL_CATALOGUED} (engineering rank)`} />
              {c.core && <Row k="Engineering status" v={c.core.disposition.replaceAll('_', ' ').toLowerCase()} />}
              {c.core && <Row k="Available to connect" v={isAvailableToConnect(c) ? 'Yes' : 'Not yet'} />}
            </div>
          </aside>

          {/* Tabs (left, row 2 — immediately after hero) */}
          <div className="order-3 lg:col-start-1 lg:row-start-2 mt-10">
            <div className="flex gap-1 border-b border-[#E3E7EE] overflow-x-auto">
              {TABS.map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`dcs-tab whitespace-nowrap ${tab === t ? 'active' : ''}`}>{t}</button>
              ))}
            </div>

            <div className="mt-8">
          {tab === 'Overview' && (
            <div className="space-y-8">
              {isTemplated(c) && (
                <div className="p-3.5 rounded-xl text-[11.5px] leading-relaxed" style={{ background: '#F5F7FB', border: '1px solid #E3E7EE', color: '#566074' }}>
                  Auto-generated summary — pending editorial and provider verification.
                </div>
              )}
              <p className="text-[14px] leading-relaxed text-[#1E2638]">{c.l}</p>
              <div>
                <h3 className="text-[13px] font-semibold text-[#0B1220] mb-3 uppercase tracking-wide">Supported resources</h3>
                <div className="flex flex-wrap gap-2">{c.res.map((r) => <span key={r} className="chip" style={{ fontFamily: 'JetBrains Mono', fontSize: 11 }}>{r}</span>)}</div>
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-[#0B1220] mb-3 uppercase tracking-wide">Popular use cases</h3>
                <ul className="space-y-2">{c.uc.map((u) => <li key={u} className="flex gap-2.5 text-[13.5px] text-[#3A4357]"><span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#2850D8] shrink-0" />{u}</li>)}</ul>
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-[#0B1220] mb-3 uppercase tracking-wide">Connection requirements</h3>
                <ul className="space-y-2">{c.reqs.map((r) => <li key={r} className="flex gap-2.5 text-[13.5px] text-[#3A4357]"><span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#0E7490] shrink-0" />{r}</li>)}</ul>
              </div>
            </div>
          )}

          {tab === 'Tools' && (
            <div className="glass-panel overflow-hidden">
              <div className="grid grid-cols-[1fr_130px_1fr] px-5 py-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#566074] border-b border-[#E3E7EE]">
                <span>Capability</span><span>Operation class</span><span>Required scope</span>
              </div>
              {c.caps.map((cap, i) => {
                const op = c.ops[Math.min(i, c.ops.length - 1)]
                return (
                  <div key={cap} className="grid grid-cols-[1fr_130px_1fr] px-5 py-3.5 items-center border-b border-[#E3E7EE] last:border-0 dcs-table-row">
                    <span className="text-[13px] text-[#1E2638]">{cap}</span>
                    <span className="text-[11px] font-semibold" style={{ color: opColor[op] ?? '#3A4357' }}>{op}</span>
                    <span className="text-[11.5px] text-[#566074]" style={{ fontFamily: 'JetBrains Mono' }}>{c.scopes[Math.min(i, c.scopes.length - 1)]}</span>
                  </div>
                )
              })}
              <div className="px-5 py-3 text-[11px] text-[#566074]">Tool-level identifiers are published per connector as they enter public availability; capabilities above are drafted from the connector manifest and provider documentation, and are not runtime-verified.</div>
            </div>
          )}

          {tab === 'Authentication' && (
            <div className="space-y-6">
              <div className="glass-panel p-6">
                <div className="text-[15px] font-semibold text-[#0B1220] mb-1">{c.auth}</div>
                <div className="text-[12.5px] text-[#3A4357]">{c.flow}</div>
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-[#0B1220] mb-3 uppercase tracking-wide">Connection steps</h3>
                <ol className="space-y-2.5">
                  {c.reqs.concat(['Authorize through the Connector OS connection flow', 'Scopes are bound to your tenant; revocation takes effect at the next dispatch check']).map((s, i) => (
                    <li key={i} className="flex gap-3 text-[13.5px] text-[#3A4357]"><span className="text-[#2850D8] font-bold shrink-0">{i + 1}.</span>{s}</li>
                  ))}
                </ol>
              </div>
              {c.authDocs && <a href={c.authDocs} target="_blank" rel="noreferrer" className="cta-secondary inline-block">Official authentication documentation ↗</a>}
            </div>
          )}

          {tab === 'Permissions' && (
            <div className="glass-panel overflow-hidden">
              <div className="grid grid-cols-[1fr_110px] px-5 py-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#566074] border-b border-[#E3E7EE]"><span>Scope</span><span>Level</span></div>
              {c.scopes.map((s) => (
                <div key={s} className="grid grid-cols-[1fr_110px] px-5 py-3.5 border-b border-[#E3E7EE] last:border-0 dcs-table-row">
                  <span className="text-[12.5px] text-[#1E2638]" style={{ fontFamily: 'JetBrains Mono' }}>{s}</span>
                  <span className="text-[11px] font-semibold text-[#047857]">Required</span>
                </div>
              ))}
              {c.optScopes.map((s) => (
                <div key={s} className="grid grid-cols-[1fr_110px] px-5 py-3.5 border-b border-[#E3E7EE] last:border-0 dcs-table-row">
                  <span className="text-[12.5px] text-[#1E2638]" style={{ fontFamily: 'JetBrains Mono' }}>{s}</span>
                  <span className="text-[11px] font-semibold text-[#B45309]">Elevated</span>
                </div>
              ))}
            </div>
          )}

          {tab === 'Webhooks' && (
            c.wh ? (
              <div className="space-y-5">
                <p className="text-[13.5px] text-[#3A4357]">{c.n} exposes provider events that Connector OS can subscribe to.</p>
                <div className="flex flex-wrap gap-2">{c.whEvents.map((e) => <span key={e} className="chip" style={{ fontFamily: 'JetBrains Mono', fontSize: 11 }}>{e}</span>)}</div>
                {c.whDocs && <a href={c.whDocs} target="_blank" rel="noreferrer" className="cta-secondary inline-block">Webhook documentation ↗</a>}
              </div>
            ) : (
              <p className="text-[14px] text-[#3A4357]">Webhooks are not currently supported for this connector.</p>
            )
          )}

          {tab === 'Documentation' && (
            <div className="space-y-3">
              {docs.filter(([, u]) => u).map(([label, url]) => (
                <a key={label} href={url!} target="_blank" rel="noreferrer" className="glass-card glass-card-hover flex items-center justify-between px-5 py-4">
                  <span className="text-[13.5px] font-medium text-[#1E2638]">{label}</span>
                  <span className="text-[11.5px] text-[#2850D8] truncate max-w-[380px]" style={{ fontFamily: 'JetBrains Mono' }}>{url!.replace('https://', '')} ↗</span>
                </a>
              ))}
              {c.verified
                ? <p className="text-[11.5px] text-[#566074]">Documentation links verified {c.verified}.</p>
                : <p className="text-[11.5px] text-[#B45309]">Developer-portal links for this connector are pending verification and are hidden until confirmed against official provider sources.</p>}
            </div>
          )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
