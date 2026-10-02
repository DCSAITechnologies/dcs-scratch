// Inspect a connection. The credential itself is never returned — only whether one is bound.
import { client } from './_env.ts';

const dcs = client();
const [first] = (await dcs.connections.list({ limit: 1 })).data;
if (!first) { console.log('no connections'); process.exit(0); }
const c = await dcs.connections.retrieve(first.connection_id);
console.log({ id: c.connection_id, connector: c.connector_id, status: c.status, health: c.health, credential_state: c.credential_state, credential_bound: c.credential_ref_present });
