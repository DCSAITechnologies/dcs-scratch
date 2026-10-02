// Dashboard router — 25 /app route patterns (18 list/static + 7 detail), counted
// mechanically by scripts/dashboard-snapshot.py (gate C6). The earlier "24" was a miscount.
// Unknown detail ids and unknown /app paths resolve to the console 404.

import { DashShell } from '../../components/dash/DashShell'
import { AuthGate } from '../../components/dash/AuthGate'
import { DATA_MODE } from '../../lib/api/config'
import { ApiConnectors, ApiConnectorDetail, ApiConnections, ApiConnectionDetail, ApiConnectNew } from './api/Catalogue'
import { ApiRuns, ApiRunDetail, ApiApprovals, ApiApprovalDetail, ApiExecutions, ApiExecutionDetail, ApiReceipts, ApiReceiptDetail, ApiPolicies, ApiPolicyDetail, ApiEvents } from './api/Operate'
import { ApiOverview, ApiSecurity, ApiEnvironments, ApiDeveloper, ApiUsage, ApiTeam, ApiAudit, ApiSettings, ApiTools } from './api/Govern'
import { EmptyState } from '../../components/dash/ui'
import { DashOverview } from './Overview'
import { DashConnectors, DashConnectorDetail, DashConnections, DashConnectionDetail, DashConnectNew, DashTools } from './Connections'
import { DashRuns, DashRunDetail, DashPolicies, DashPolicyDetail } from './Runs'
import { DashApprovals, DashApprovalDetail } from './Approvals'
import { DashExecutions, DashExecutionDetail } from './Executions'
import { DashReceipts, DashReceiptDetail } from './Receipts'
import { DashSecurity, DashEvents, DashEnvironments } from './SecurityEvents'
import { DashDeveloper, DashUsage, DashTeam, DashAudit, DashSettings } from './Workspace'

// Data mode is fixed per build (see lib/api/config.ts): demo pages read the
// hermetic fixture stores under a DEMO banner; api pages read the Connector OS API
// and never fall back to fixtures.
const pick = (demo: React.ReactElement, live: React.ReactElement) => (DATA_MODE === 'api' ? live : demo)

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
  if (r === '/app' || r === '/app/') page = pick(<DashOverview />, <ApiOverview />)
  else if (r === '/app/connectors') page = pick(<DashConnectors key={window.location.search} />, <ApiConnectors key={window.location.search} />)
  else if ((mm = m(/^\/app\/connectors\/([^/]+)$/))) page = pick(<DashConnectorDetail id={mm[1]} />, <ApiConnectorDetail id={mm[1]} />)
  else if (r === '/app/connections') page = pick(<DashConnections />, <ApiConnections />)
  else if (r === '/app/connections/new') page = pick(<DashConnectNew />, <ApiConnectNew key={window.location.search} />)
  else if ((mm = m(/^\/app\/connections\/([^/]+)$/))) page = pick(<DashConnectionDetail id={mm[1]} />, <ApiConnectionDetail id={mm[1]} />)
  else if (r === '/app/tools') page = pick(<DashTools />, <ApiTools />)
  else if (r === '/app/agents') page = pick(<DashRuns />, <ApiRuns />)
  else if ((mm = m(/^\/app\/agents\/runs\/([^/]+)$/))) page = pick(<DashRunDetail id={mm[1]} />, <ApiRunDetail id={mm[1]} />)
  else if (r === '/app/policies') page = pick(<DashPolicies />, <ApiPolicies />)
  else if ((mm = m(/^\/app\/policies\/([^/]+)$/))) page = pick(<DashPolicyDetail id={mm[1]} />, <ApiPolicyDetail id={mm[1]} />)
  else if (r === '/app/approvals') page = pick(<DashApprovals />, <ApiApprovals />)
  else if ((mm = m(/^\/app\/approvals\/([^/]+)$/))) page = pick(<DashApprovalDetail id={mm[1]} />, <ApiApprovalDetail id={mm[1]} />)
  else if (r === '/app/executions') page = pick(<DashExecutions />, <ApiExecutions />)
  else if ((mm = m(/^\/app\/executions\/([^/]+)$/))) page = pick(<DashExecutionDetail id={mm[1]} />, <ApiExecutionDetail id={mm[1]} />)
  else if (r === '/app/receipts') page = pick(<DashReceipts />, <ApiReceipts />)
  else if ((mm = m(/^\/app\/receipts\/([^/]+)$/))) page = pick(<DashReceiptDetail id={mm[1]} />, <ApiReceiptDetail id={mm[1]} />)
  else if (r === '/app/events') page = pick(<DashEvents />, <ApiEvents />)
  else if (r === '/app/security') page = pick(<DashSecurity />, <ApiSecurity />)
  else if (r === '/app/environments') page = pick(<DashEnvironments />, <ApiEnvironments />)
  else if (r === '/app/developer') page = pick(<DashDeveloper />, <ApiDeveloper />)
  else if (r === '/app/usage') page = pick(<DashUsage />, <ApiUsage />)
  else if (r === '/app/team') page = pick(<DashTeam />, <ApiTeam />)
  else if (r === '/app/audit') page = pick(<DashAudit />, <ApiAudit />)
  else if (r === '/app/settings') page = pick(<DashSettings />, <ApiSettings />)
  else page = <DashNotFound />

  return <AuthGate path={r}><DashShell path={r}>{page}</DashShell></AuthGate>
}
