// Shared diagram components (spec §11). Consistent node-flow language, no decorative visuals.

function Node({ label, accent = '#5A7BFF', small }: { label: string; accent?: string; small?: boolean }) {
  return (
    <div className={`px-3.5 ${small ? 'py-2 text-[11.5px]' : 'py-2.5 text-[12.5px]'} rounded-xl font-medium text-[#D6E1FF] text-center`} style={{ background: 'rgba(13,20,48,0.85)', border: `1px solid ${accent}44` }}>{label}</div>
  )
}

function VArrow({ accent = '#5A7BFF' }: { accent?: string }) {
  return <div className="text-center text-[13px] py-0.5" style={{ color: accent }}>↓</div>
}

export function FlowColumn({ title, items, accent = '#5A7BFF' }: { title?: string; items: string[]; accent?: string }) {
  return (
    <div>
      {title && <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] mb-3" style={{ color: accent }}>{title}</div>}
      {items.map((m, i) => (
        <div key={m}>
          <Node label={m} accent={accent} />
          {i < items.length - 1 && <VArrow accent={accent} />}
        </div>
      ))}
    </div>
  )
}

export function FlowRow({ items, accent = '#5A7BFF', note }: { items: string[]; accent?: string; note?: (i: number) => string | undefined }) {
  return (
    <div className="flex flex-wrap items-center gap-y-3">
      {items.map((s, i) => (
        <span key={s} className="flex items-center">
          <span className="px-3 py-2 rounded-lg text-[12px] font-medium text-[#D6E1FF] whitespace-nowrap" style={{ background: 'rgba(90,123,255,0.1)', border: `1px solid ${accent}44`, ...(note?.(i) ? { borderColor: note(i)!.includes('amber') ? '#F5A52466' : '#21C87A66' } : {}) }}>{s}</span>
          {i < items.length - 1 && <span className="mx-2" style={{ color: accent }}>→</span>}
        </span>
      ))}
    </div>
  )
}

export function ArchDiagram() {
  return (
    <div className="glass-panel p-6 grid sm:grid-cols-2 gap-8">
      <FlowColumn title="Execution path" accent="#5A7BFF" items={['Agent / Application', 'Runtime E', 'OAL / Policy / Approval', 'Ops Broker', 'Execution Engine', 'Connector / Provider']} />
      <FlowColumn title="Parallel evidence path" accent="#00C2FF" items={['Execution Facts', 'Evidence Client', 'R-Series', 'Receipt / Verify / Audit']} />
    </div>
  )
}

export function LifecycleDiagram({ stages, modeBoundary }: { stages: string[]; modeBoundary?: { mode: string; range: [number, number] }[] }) {
  return (
    <div className="glass-panel p-6">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#A78BFA] mb-4">OAL lifecycle — canonical</div>
      <div className="flex flex-wrap items-center gap-y-3">
        {stages.map((s, i) => (
          <span key={s} className="flex items-center">
            <span className="px-3 py-2 rounded-lg text-[12px] font-medium text-[#D6E1FF] whitespace-nowrap" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.35)' }}>
              <span className="text-[#A78BFA] font-bold mr-1.5">{i + 1}</span>{s}
            </span>
            {i < stages.length - 1 && <span className="mx-1.5 text-[#A78BFA]">→</span>}
          </span>
        ))}
      </div>
      {modeBoundary && (
        <div className="mt-4 flex flex-wrap gap-2.5">
          {modeBoundary.map((m) => (
            <span key={m.mode} className="text-[10.5px] px-2.5 py-1 rounded-full text-[#A9B6D3]" style={{ background: 'rgba(120,140,255,0.08)', border: '1px solid rgba(120,140,255,0.22)' }}>
              {m.mode}: stages {m.range[0]}–{m.range[1]}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function StateMachine({ title, start, states, accent = '#5A7BFF' }: { title: string; start: string; states: { name: string; color?: string; note?: string }[]; accent?: string }) {
  return (
    <div className="glass-panel p-6">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] mb-4" style={{ color: accent }}>{title}</div>
      <div className="flex items-center gap-2 mb-4">
        <Node label={start} accent={accent} small />
        <span style={{ color: accent }}>→</span>
        <span className="text-[11px] text-[#93A0C2]">transitions to one of</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {states.map((s) => (
          <div key={s.name} className="px-3 py-2.5 rounded-lg text-center" style={{ background: 'rgba(6,10,22,0.6)', border: `1px solid ${s.color ?? accent}44` }}>
            <div className="text-[11.5px] font-semibold" style={{ fontFamily: 'JetBrains Mono', color: s.color ?? '#D6E1FF' }}>{s.name}</div>
            {s.note && <div className="text-[10px] text-[#93A0C2] mt-1 leading-snug">{s.note}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

export function TwoColDiagram({ leftTitle, left, rightTitle, right, leftAccent = '#5A7BFF', rightAccent = '#00C2FF' }: { leftTitle: string; left: string[]; rightTitle: string; right: string[]; leftAccent?: string; rightAccent?: string }) {
  return (
    <div className="glass-panel p-6 grid sm:grid-cols-2 gap-8">
      <FlowColumn title={leftTitle} items={left} accent={leftAccent} />
      <FlowColumn title={rightTitle} items={right} accent={rightAccent} />
    </div>
  )
}


// R-Series evidence flow (Completion Spec §6) — the only flow diagram receipts pages use.
export function RSeriesFlow() {
  const steps = ['ExecutionEngine', 'EXEC-FACTS', 'EvidenceClient', 'R-Series', 'Receipt', 'Verify', 'Audit']
  return <FlowRow items={steps} accent="#00C2FF" note={(i) => i === 3 ? 'creates · signs · chains' : i === 0 ? 'emits facts only' : undefined} />
}

export function TenantBoundaryDiagram() {
  return (
    <TwoColDiagram
      leftTitle="Tenant A"
      left={['connections (vault refs)', 'policies + policy floor', 'agents + plans', 'evidence chain A']}
      rightTitle="Tenant B"
      right={['connections (vault refs)', 'policies + policy floor', 'agents + plans', 'evidence chain B']}
      leftAccent="#5A7BFF"
      rightAccent="#8B5CF6"
    />
  )
}

export function CredentialFlowDiagram() {
  return (
    <FlowColumn
      title="Credential material — one path, one moment"
      items={[
        'Operator adds credential → vault write (reference returned)',
        'Everything else holds the reference only — plans, facts, receipts',
        'Dispatch: engine resolves reference inside its own process',
        'Provider call made; material dropped from memory',
        'Nothing outside the engine ever sees the secret',
      ]}
      accent="#21C87A"
    />
  )
}

export function WebhookPipelineDiagram() {
  return (
    <FlowColumn
      title="Inbound webhook pipeline"
      items={[
        'Provider POST arrives at the declared inbound surface',
        'Signature check against the manifest-declared scheme',
        'Labelled: verified / unsigned / rejected',
        'verified → normal lifecycle entry',
        'unsigned → MODE 0/1 only — never a write',
        'rejected → dropped, with an event on the record',
      ]}
      accent="#F5A524"
    />
  )
}
