// List connectors and show REAL dispatch eligibility. Today no connector is dispatchable.
import { responseMeta } from '@dcs-ai/connector-os';
import { client } from './_env.ts';

const dcs = client();
const page = await dcs.connectors.list({ limit: 5, q: 'git' });
for (const c of page.data) console.log(`${c.connector_id.padEnd(20)} ${c.disposition.padEnd(22)} ${c.availability}`);
console.log(`request ${responseMeta(page)?.requestId} (adapter: ${responseMeta(page)?.adapter})`);

let total = 0;
let dispatchable = 0;
for await (const c of dcs.connectors.listAll({ limit: 200 })) { total++; if (c.availability !== 'not_dispatchable') dispatchable++; }
console.log(`${total} catalogued, ${dispatchable} dispatchable`);
