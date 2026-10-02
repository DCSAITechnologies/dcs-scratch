// Dashboard router — 25 /app route patterns (18 list/static + 7 detail), counted
// mechanically by scripts/dashboard-snapshot.py (gate C6). The earlier "24" was a miscount.
// Unknown detail ids and unknown /app paths resolve to the console 404.

import { DashShell } from '../../components/dash/DashShell'
import { EmptyState } from '../../components/dash/ui'
import { DashOverview } from './Overview'
import { DashConnectors, DashConnectorDetail, DashConnections, DashConnectionDetail, DashConnectNew, DashTools } from './Connections'
import { DashRuns, DashRunDetail, DashPolicies, DashPolicyDetail } from './Runs'
import { DashApprovals, DashApprovalDetail } from './Approvals'
import { DashExecutions, DashExecutionDetail } from './Executions'
import { DashReceipts, DashReceiptDetail } from './Receipts'
import { DashSecurity, DashEvents, DashEnvironments } from './SecurityEvents'
import { DashDeveloper, DashUsage, DashTeam, DashAudit, DashSettings } from './Workspace'

function DashNotFound() {
  return (
    <EmptyState text="This console route does not exist." cta="Back to overview" href="/app" />
  )
}

export function DashApp({ path }: { path: string }) {
  const strip = (p: string) => p.split('?')[0]
  const r = strip(path)
  let page: React.ReactElement

  const m = (re: RegExp) => r.match(re)
  let mm
  if (r === '/app' || r === '/app/') page = <DashOverview />
  else if (r === '/app/connectors') page = <DashConnectors key={window.location.search} />
  else if ((mm = m(/^\/app\/connectors\/([^/]+)$/))) page = <DashConnectorDetail id={mm[1]} />
  else if (r === '/app/connections') page = <DashConnections />
  else if (r === '/app/connections/new') page = <DashConnectNew />
  else if ((mm = m(/^\/app\/connections\/([^/]+)$/))) page = <DashConnectionDetail id={mm[1]} />
  else if (r === '/app/tools') page = <DashTools />
  else if (r === '/app/agents') page = <DashRuns />
  else if ((mm = m(/^\/app\/agents\/runs\/([^/]+)$/))) page = <DashRunDetail id={mm[1]} />
  else if (r === '/app/policies') page = <DashPolicies />
  else if ((mm = m(/^\/app\/policies\/([^/]+)$/))) page = <DashPolicyDetail id={mm[1]} />
  else if (r === '/app/approvals') page = <DashApprovals />
  else if ((mm = m(/^\/app\/approvals\/([^/]+)$/))) page = <DashApprovalDetail id={mm[1]} />
  else if (r === '/app/executions') page = <DashExecutions />
  else if ((mm = m(/^\/app\/executions\/([^/]+)$/))) page = <DashExecutionDetail id={mm[1]} />
  else if (r === '/app/receipts') page = <DashReceipts />
  else if ((mm = m(/^\/app\/receipts\/([^/]+)$/))) page = <DashReceiptDetail id={mm[1]} />
  else if (r === '/app/events') page = <DashEvents />
  else if (r === '/app/security') page = <DashSecurity />
  else if (r === '/app/environments') page = <DashEnvironments />
  else if (r === '/app/developer') page = <DashDeveloper />
  else if (r === '/app/usage') page = <DashUsage />
  else if (r === '/app/team') page = <DashTeam />
  else if (r === '/app/audit') page = <DashAudit />
  else if (r === '/app/settings') page = <DashSettings />
  else page = <DashNotFound />

  return <DashShell path={r}>{page}</DashShell>
}
