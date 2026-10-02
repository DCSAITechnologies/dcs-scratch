// A scripted, read-only MCP session over stdio: initialize → tools/list → two read calls.
// Run against the hermetic server:  DCS_BASE_URL=… DCS_API_KEY=… node devex/examples/mcp/readonly-session.mjs
import { spawn } from 'node:child_process';

const server = spawn(process.execPath, [new URL('../../mcp-server/bin/dcs-mcp.mjs', import.meta.url).pathname], { stdio: ['pipe', 'pipe', 'inherit'] });
const pending = new Map();
let buf = '';
server.stdout.on('data', (d) => {
  buf += d;
  for (let i; (i = buf.indexOf('\n')) >= 0; buf = buf.slice(i + 1)) { const m = JSON.parse(buf.slice(0, i)); pending.get(m.id)?.(m); }
});
let id = 0;
const rpc = (method, params) => new Promise((resolve) => { const n = ++id; pending.set(n, resolve); server.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: n, method, params })}\n`); });

const init = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'example', version: '0' } });
server.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`);
console.log(`server: ${init.result.serverInfo.name} (protocol ${init.result.protocolVersion})`);
const tools = (await rpc('tools/list')).result.tools;
console.log(`tools: ${tools.map((t) => t.name).join(', ')}`);
const gh = (await rpc('tools/call', { name: 'get_connector', arguments: { connector_id: 'github' } })).result.structuredContent;
console.log(`github: ${gh.availability} (${gh.dispatch.reasons.join(', ')})`);
const pol = (await rpc('tools/call', { name: 'list_policies', arguments: {} })).result.structuredContent;
console.log(`policies: ${pol.data.map((p) => p.policy_id).join(', ')}`);
server.stdin.end();
