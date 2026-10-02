// Right rail in API mode: only what the API says, never fixture notifications.
import { useApi } from '../../lib/api/useApi'
import { listApprovals, listExecutions } from '../../lib/api/endpoints'
import { useAuth, signOut } from '../../lib/auth/session'
import { apiHost } from '../../lib/api/config'

const box = 'rounded-xl border border-white/[0.07] bg-[#0C1330]/80 p-3.5'

export function ApiRail() {
  const auth = useAuth()
  const approvals = useApi('rail-approvals', () => listApprovals({ state: 'REQUESTED', limit: 5 }))
  const unknown = useApi('rail-unknown', () => listExecutions({ outcome: 'OUTCOME_UNKNOWN', limit: 5 }))
  const count = (r: { status: string; data: { data: unknown[]; has_more: boolean } | null }) => (r.status === 'ready' && r.data ? `${r.data.data.length}${r.data.has_more ? '+' : ''}` : r.status === 'error' ? 'unavailable' : '…')
  return (
    <div className="p-3 space-y-3">
      <section className={box}>
        <h2 className="text-[12.5px] font-semibold text-white mb-1.5">Signed in</h2>
        <p className="text-[12px] text-[#DCE4F7] break-all">{auth.displayName}</p>
        <p className="text-[11px] text-[#5B6884] mt-0.5">{auth.principal?.capabilities.join(' · ') || 'no capabilities'}</p>
        <button type="button" onClick={() => void signOut()} className="mt-2.5 text-[11.5px] font-semibold text-[#9FB8FF]">Sign out</button>
      </section>
      <section className={box}>
        <h2 className="text-[12.5px] font-semibold text-white mb-1.5">Needs attention</h2>
        <ul className="space-y-1.5 text-[12px]">
          <li><a href="/app/approvals?state=REQUESTED" className="text-[#C7D2EA] hover:text-white">Approvals waiting: <b>{count(approvals)}</b></a></li>
          <li><a href="/app/executions" className="text-[#C7D2EA] hover:text-white">Outcome unknown: <b>{count(unknown)}</b></a></li>
        </ul>
      </section>
      <section className={box}>
        <h2 className="text-[12.5px] font-semibold text-white mb-1.5">Backend</h2>
        <p className="text-[11.5px] text-[#A9B6D3] font-mono break-all">{apiHost()}</p>
        <p className="text-[11px] text-[#5B6884] mt-0.5">environment {auth.principal?.environment ?? '—'}</p>
      </section>
    </div>
  )
}
