// Shared example setup. Credentials come from the environment only — never hard-code them.
import { ConnectorOS } from '@dcs-ai/connector-os';

export function required(name: string): string {
  const v = process.env[name];
  if (!v) { console.error(`set ${name} (see devex/examples/README.md)`); process.exit(2); }
  return v;
}

/** API-key client (machine credential). */
export const client = (): ConnectorOS => new ConnectorOS({ baseUrl: required('DCS_BASE_URL'), apiKey: required('DCS_API_KEY') });

/** Human operator session (approvals, operator surfaces). */
export const operatorClient = (): ConnectorOS => new ConnectorOS({ baseUrl: required('DCS_BASE_URL'), apiKey: required('DCS_OPERATOR_SESSION') });
