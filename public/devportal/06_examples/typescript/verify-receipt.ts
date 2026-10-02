// Parse a receipt, show its metadata, and ask the server's R-Series verifier for a verdict.
// This SDK computes nothing cryptographic; a test-double verifier is never reported as "verified".
import { parseReceipt, describeReceipt, verifyViaApi } from '@dcs-ai/connector-os/receipts';
import { client } from './_env.ts';

const dcs = client();
const rid = process.env.DCS_RECEIPT_ID ?? (await dcs.receipts.list({ status: 'ISSUED', limit: 1 })).data[0]?.receipt_id;
if (!rid) { console.log('no issued receipts yet'); process.exit(0); }
const summary = parseReceipt(await dcs.receipts.retrieve(rid));
console.log(describeReceipt(summary).join('\n'));
const v = await verifyViaApi(dcs, rid);
console.log(`\nverification: ${v.verification} (verifier: ${v.verifier_kind}, code: ${v.code}, evidence grade: ${v.evidence_grade})`);
