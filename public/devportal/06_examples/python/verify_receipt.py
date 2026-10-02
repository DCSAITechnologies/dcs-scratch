"""Parse a receipt, show its metadata, verify it through the server's R-Series verifier port, and
check the structural causal link to its parent. No cryptography runs in this process.

    DCS_BASE_URL=... DCS_API_KEY=... python verify_receipt.py
"""
from _env import developer
from dcs_connector_os.receipts import check_causal_link, describe_receipt, parse_receipt, verify_via_api

client = developer()
issued = client.receipts.list(status="ISSUED", limit=50).data
if not issued:
    print("no issued receipts yet — run approval_workflow.py first")
else:
    receipt = parse_receipt(client.receipts.retrieve(issued[0]["receipt_id"]))
    print("\n".join(describe_receipt(receipt)))
    verdict = verify_via_api(client, receipt.receipt_id)
    print(f"verification={verdict['verification']} verifier={verdict['verifier_kind']} grade={verdict['evidence_grade']}")
    if receipt.parent_receipt:
        parent = parse_receipt(client.receipts.retrieve(receipt.parent_receipt))
        print(f"causal link: {check_causal_link(receipt, parent)}")
    else:
        print("causal link: first receipt in its run (no parent)")
