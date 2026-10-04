# DATA-4 (Part 4) — recovery return

Date: 2026-10-04 · Branch: `claude/new-session-e3y98d` · Nothing committed, pushed or deployed.

```
EGNYTE_STATUS=DEFERRED_SEPARATE_LANE
```

## 1. Counts (re-read from disk after the run; reconciled with `scripts/ingest-sourced-data.py --dry-run`)

| | Count |
|---|---:|
| Authoritative Part-4 target (`data-sourcing/inputs/part-4.csv`) | **203** |
| Complete before this recovery (record on disk, all facts pass ingest) | 166 |
| Partial before this recovery | 12 |
| No record before this recovery | 25 (24 + egnyte) |
| Completed during this recovery | 21 |
| Made partial during this recovery | 3 (onfido, gladly, fibery) |
| **Final COMPLETE** | **187** |
| **Final PARTIAL** | **15** |
| FAILED | 0 |
| DEFERRED | 1 (egnyte) |
| MISSING | 0 |

COMPLETE means a record exists in `records.jsonl`, every fact in it passes the repo's ingest validator, and every fact that
could not be confirmed is listed in `notFound` (README §4 rule 3). Ingest dry-run: 202 records read, 193 connectors with
accepted facts, 50 rejected facts (all from the pre-existing partials below).

## 2. PARTIAL connectors and why

Pre-existing (records from earlier Part-4 sessions; **left untouched**). In each case the facts sit on a secondary domain that
looks provider-owned, but the ingest validator rejects it:

| Connector | Rejected fields | Domain issue |
|---|---|---|
| abnormal-security | statusUrl | status.abnormalsecurity.com vs site abnormal.ai |
| bluesky | portal, authDocs, statusUrl, scopeModel, providerScopes, reqs | atproto.com / bsky.app vs bsky.social |
| percy | authDocs, scopeModel, providerScopes, providerCaps, reqs | browserstack.com vs percy.io |
| deliveroo-partner-api | authDocs, statusUrl, auth, scopeModel, providerCaps, reqs | deliveroo.com vs deliveroo.co.uk |
| instatus | statusUrl | instat.us vs instatus.com |
| invoice-ninja | authDocs, providerCaps, reqs | invoiceninja.github.io vs invoiceninja.com |
| mailtrap | statusUrl | mailtrap.info vs mailtrap.io |
| dpo-pay | authDocs, auth, scopeModel, providerCaps, reqs | dpopay.com vs dpogroup.com |
| gerrit | authDocs, scopeModel, providerScopes, providerCaps, reqs | gerrit-review.googlesource.com vs gerritcodereview.com |
| prisma-cloud | authDocs, scopeModel, providerCaps, reqs | pan.dev vs paloaltonetworks.com |
| crunchy-bridge | authDocs, statusUrl, scopeModel, providerCaps, reqs | crunchybridge.com vs crunchydata.com |
| yellow-card | portal, api, authDocs, auth, scopeModel, providerScopes, providerCaps, reqs | yellowcard.engineering vs yellowcard.io |

New in this recovery:

| Connector | Reason |
|---|---|
| onfido | blocked-by-provider: documentation.identity.entrust.com, documentation.onfido.com and onfido.com disallow automated access in robots.txt; www.entrust.com returns 403. Not bypassed. The record has only `notFound` + `notes`. |
| gladly | Only statusUrl saved. The API facts (Basic auth, "API User" permission, about 19 endpoints) are verified on developer.gladly.com, but the catalogue site is gladly.ai, so they were withheld. Draft: `.scratch/recovery/work/gladly/rec_full_offdomain.json`. |
| fibery | Complete apart from statusUrl: status.fibery.io is linked from fibery.com but is off-domain, so it was withheld. |

## 3. FAILED
None.

## 4. MISSING
None. Every non-Egnyte id in part-4.csv has exactly one record.

## 5. DEFERRED
- **egnyte**: not fetched, not retried, no record written, master list (`part-4.csv`) unchanged. Ingest lists it under
  "Assigned ids with no record", which is the intended visible marker. To be handled in a dedicated Egnyte lane.

`EGNYTE_STATUS=DEFERRED_SEPARATE_LANE`

## 6. Output / data locations for Fable / dashboard ingestion

- `data-sourcing/returns/part-4/records.jsonl`: 202 records, one per line, in part-4.csv order (egnyte excluded).
- `data-sourcing/returns/part-4/logos/`: 47 files, of which 46 are referenced. `salla.png` is an orphan from an earlier session
  that is not referenced by any record; ingest ignores it.
- Next step (owner runs it, per README §6): `python3 scripts/ingest-sourced-data.py` → `src/lib/sourced-data.json`,
  `public/logos/sourced/*`, `data-sourcing/INGEST_REPORT.md`; then `npm run sync:catalogue` (fill-empty only) and `npm run verify`.
  Neither was run in this recovery; only `--dry-run` was used.
- Per-connector source records (recoverable if records.jsonl is lost):
  `.scratch/data4-a/out_aa.jsonl`, `out_ab.jsonl`; `.scratch/part-4/{ac,ad,ae,af}/rec_<id>.json`; `.scratch/data4/recs_ag.jsonl`, `recs_ah.jsonl`.
  Rebuild with `python3 .scratch/recovery/assemble.py`, reconcile with `python3 .scratch/recovery/reconcile.py`.

## 7. Validator / domain allow-list decisions

- **No change** to `scripts/ingest-sourced-data.py`, its DOC_HOSTS list or any validation rule.
- No secondary domain was added to any allow-list. The 12 pre-existing off-domain partials and gladly/fibery go to human review.
- A record's `site` is never set without a verified HTTP 200 (README rule 2):
  - **gusto**: a lane set `site=https://gusto.com/`, but the homepage is disallowed by robots.txt. I removed it. Draft with the site:
    `.scratch/recovery/work/gusto/rec_full_with_unverified_site.json`.
  - **elastic-path**: www.elasticpath.com is disallowed by robots.txt. The full record (all URLs verified 200, on developer.elasticpath.com
    and status.elasticpath.com) was restored **without** `site`. The fact-less version is backed up at `.scratch/recovery/work/elastic-path/rec_saved_factless_backup.json`.
  - **gandi**: www.gandi.net timed out on every attempt (lane retries plus one final time-boxed recheck), so no site was set.
  - Validator behaviour to note: when neither the catalogue nor the record has a site, ingest skips the domain check. This
    is why gusto, gandi and elastic-path pass. Their facts are on provider subdomains (docs.gusto.com, api.gandi.net,
    developer.elasticpath.com).
- Scratch `validate.py` (used by the lanes) is stricter than ingest on empty-site records; ingest is authoritative.

## 8. Human-review items

1. Decide whether to accept the secondary domains in §2 (for example by setting the record `site`, or adding a per-connector domain).
   Accepting them would turn up to 14 partials complete without new fetches.
2. gusto / elastic-path / gandi: confirm the homepage manually in a browser and add `site` if it should be shown.
3. onfido: needs manual sourcing (robots.txt and 403 blocks).
4. Logos that are wide wordmarks rather than square marks: freee, elastic-path (plus earlier ones noted in records: medallia, pingone, siliconflow, youverify, oracle-eloqua, maxmind-geoip2).
5. Status pages not found: expedia-rapid, gravity-forms, hackerone, frenet, eurostat (only a maintenance page exists).
6. TLS: the system `python3` (LibreSSL 2.8.3) fails TLS to some hosts (Entrust/Onfido); the lanes used `/opt/homebrew/bin/python3` with the same scripts.
7. `salla.png` orphan logo in returns: delete or reference it after review.

## 9. Recovery lane fields (24 connectors attempted)

Facts saved across the 24: authDocs 21 · providerCaps 22 · reqs 22 · scopeModel 19 · statusUrl 16 · api 8 · providerScopes 8 · logo 6 · auth 5 · portal 4 · whDocs 2.

## 10. Confirmations

- The 178 pre-existing records were **not rebuilt or edited**. They were copied verbatim into records.jsonl. Only records created in this
  recovery were touched (gusto `site` removal, elastic-path restore).
- No production system was touched. Nothing was deployed. Nothing was committed or pushed. The only repo writes are under
  `data-sourcing/returns/part-4/` and `.scratch/` (gitignored). The `.gitignore` change (`.scratch/`) predates this run.
- All fetches: UA `DCS-ConnectorFactory/1.0 (+info@dcsai.ai)`, robots.txt respected, 20 s timeout, at most 2 retries. No anti-bot,
  CAPTCHA or login-wall bypass, and no authenticated docs.
- No helper scripts under /tmp. All recovery scratch is in `.scratch/recovery/`.
- Each connector was saved to disk immediately after it was processed (`.scratch/data4b/save.py`).
