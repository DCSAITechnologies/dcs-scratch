import { CATALOGUE_RUNTIME } from './fixtures'

// ⌘K routing: typed id prefixes open the record (detail pages render their own
// not-found state); an exact canonical connector id opens that connector; anything
// else becomes a catalogue query, preserved in the URL.
const ID_ROUTES: [RegExp, string][] = [
  [/^rc_/, '/app/receipts/'], [/^ex_/, '/app/executions/'], [/^run_/, '/app/agents/runs/'],
  [/^ap_/, '/app/approvals/'], [/^cn_/, '/app/connections/'], [/^pol_/, '/app/policies/'],
]
export function searchTarget(raw: string): string {
  const v = raw.trim()
  for (const [re, base] of ID_ROUTES) if (re.test(v)) return base + encodeURIComponent(v)
  if (CATALOGUE_RUNTIME.some((c) => c.id === v.toLowerCase())) return `/app/connectors/${v.toLowerCase()}`
  return `/app/connectors?q=${encodeURIComponent(v)}`
}
