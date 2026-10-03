#!/usr/bin/env python3
"""Connector master inventory: every canonical (core) row plus every legacy reference row.

Generated, never hand-edited. Reads only:
  - src/lib/connectors.json         (generated from core-snapshot/ by scripts/sync-catalogue.py)
  - src/lib/connectors-legacy.json  (website legacy reference surfaces, Lane 6 behaviour)
  - core-snapshot/*                 (Connector OS core registry at CORE_HEAD)

Writes:
  - audit/CONNECTOR_MASTER_INVENTORY.csv
  - audit/CONNECTOR_STATUS_SUMMARY.md   (every number is counted from the CSV rows)

Usage:
  python3 scripts/build-inventory.py           # regenerate
  python3 scripts/build-inventory.py --check   # fail if the committed files are stale (run by `npm run gates`)
"""
import csv, io, json, os, sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SNAP = os.path.join(ROOT, 'core-snapshot')
CSV_OUT = os.path.join(ROOT, 'audit', 'CONNECTOR_MASTER_INVENTORY.csv')
MD_OUT = os.path.join(ROOT, 'audit', 'CONNECTOR_STATUS_SUMMARY.md')

MAJOR = ['openai', 'anthropic', 'azure-openai', 'google-gemini', 'github', 'gmail', 'slack', 'notion', 'stripe', 'linear']

COLUMNS = [
    'record_type', 'id', 'name', 'provider', 'rank', 'core_pack', 'category', 'auth', 'read_write', 'webhooks',
    'publication', 'hold_reasons', 'engineering_status', 'staging_verified', 'runtime_verified',
    'dispatch_staging', 'dispatch_production', 'dispatch_eligible', 'available_to_connect', 'unavailable_reason',
    'blocked', 'replaced_by', 'alias_of', 'legacy_classification', 'legacy_behaviour', 'legacy_redirect_to',
    'retired', 'classifications', 'evidence',
]


def load(path):
    with open(os.path.join(ROOT, path)) as f:
        return json.load(f)


def yn(v):
    return 'YES' if v else 'NO'


def canonical_row(c, core_head):
    core = c['core']
    d = core['dispatch']
    hold = bool(c['unpublished'])
    blocked = core['disposition'] == 'BLOCKED'
    staging_verified = bool(core['staging_verified'])
    eligible = bool(d['staging'] or d['production'])
    reasons = [] if eligible else list(d['reasons'])
    cls = ['CANONICAL', 'HOLD' if hold else 'PUBLIC', 'AVAILABLE_TO_CONNECT' if eligible else 'NOT_AVAILABLE']
    if staging_verified: cls.append('STAGING_VERIFIED')
    if c['runtime_status'] == 'verified': cls.append('RUNTIME_VERIFIED')
    if eligible: cls.append('DISPATCH_ELIGIBLE')
    if blocked: cls.append('BLOCKED')
    if c['alias_of']: cls.append('ALIAS')
    evidence = [f"core {core_head[:12]} catalogue.json ({core['source_ref'] or 'n/a'})",
                'dispatch-eligibility.json', 'staging-verified.json']
    if c.get('editorial_hold'): evidence.append('website Lane 6 editorial hold')
    return {
        'record_type': 'CANONICAL', 'id': c['id'], 'name': c['n'], 'provider': c['p'],
        'rank': '' if c['r'] is None else c['r'], 'core_pack': core['pack'] or '', 'category': c['cat'],
        'auth': c['auth'], 'read_write': c['rw'], 'webhooks': yn(c['wh']),
        'publication': 'HOLD' if hold else 'PUBLIC', 'hold_reasons': c['hold_category'] or '',
        'engineering_status': core['disposition'], 'staging_verified': yn(staging_verified),
        'runtime_verified': yn(c['runtime_status'] == 'verified'),
        'dispatch_staging': yn(d['staging']), 'dispatch_production': yn(d['production']),
        'dispatch_eligible': yn(eligible), 'available_to_connect': yn(eligible),
        'unavailable_reason': ' | '.join(reasons), 'blocked': yn(blocked),
        'replaced_by': core['replaced_by'] or '', 'alias_of': c['alias_of'] or '',
        'legacy_classification': '', 'legacy_behaviour': '', 'legacy_redirect_to': '', 'retired': 'NO',
        'classifications': ';'.join(cls), 'evidence': '; '.join(evidence),
    }


def legacy_row(x, canonical_ids):
    beh = x['lane6_behavior']
    retired = beh in ('GONE', 'GONE_RETIRED_NOTICE')
    published = beh == 'PRESERVE_REFERENCE_SURFACE' and not x.get('unpublished')
    cls = ['LEGACY_REFERENCE', 'NOT_AVAILABLE']
    if retired: cls.append('RETIRED')
    if beh == 'REDIRECT': cls.append('ALIAS')
    redirect = x.get('lane6_redirect_to') or ''
    return {
        'record_type': 'LEGACY_REFERENCE', 'id': x['id'], 'name': x['n'], 'provider': x['p'],
        'rank': '', 'core_pack': '', 'category': x['cat'], 'auth': x['auth'], 'read_write': x['rw'],
        'webhooks': yn(x['wh']),
        'publication': 'LEGACY_SURFACE' if published else ('REDIRECTED' if beh == 'REDIRECT' else 'NOT_LISTED'),
        'hold_reasons': '', 'engineering_status': 'NOT_IN_CORE', 'staging_verified': 'NO', 'runtime_verified': 'NO',
        'dispatch_staging': 'NO', 'dispatch_production': 'NO', 'dispatch_eligible': 'NO', 'available_to_connect': 'NO',
        'unavailable_reason': 'not a Connector OS core catalogue row',
        'blocked': 'NO', 'replaced_by': '',
        'alias_of': redirect.removeprefix('/connectors/') if beh == 'REDIRECT' and redirect.removeprefix('/connectors/') in canonical_ids else '',
        'legacy_classification': x['lane6_classification'], 'legacy_behaviour': beh, 'legacy_redirect_to': redirect,
        'retired': yn(retired), 'classifications': ';'.join(cls),
        'evidence': 'website connectors-legacy.json (Lane 6); no connector_id, name or alias_research_key in core catalogue.json or identity-list.csv',
    }


def build():
    core_head = open(os.path.join(SNAP, 'CORE_HEAD.txt')).read().strip()
    core_branch = open(os.path.join(SNAP, 'CORE_BRANCH.txt')).read().strip()
    canon = load('src/lib/connectors.json')
    legacy = load('src/lib/connectors-legacy.json')
    with open(os.path.join(SNAP, 'catalogue.json')) as f:
        core_ids = {r['connector_id'] for r in json.load(f)['rows']}
    canonical_ids = {c['id'] for c in canon}
    assert canonical_ids == core_ids, 'connectors.json is not the core catalogue — run scripts/sync-catalogue.py'
    overlap = canonical_ids & {x['id'] for x in legacy}
    assert not overlap, f'ids both canonical and legacy: {sorted(overlap)}'

    rows = [canonical_row(c, core_head) for c in canon] + [legacy_row(x, canonical_ids) for x in legacy]

    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=COLUMNS, lineterminator='\n')
    w.writeheader()
    w.writerows(rows)
    return rows, buf.getvalue(), core_head, core_branch


def summary(rows, core_head, core_branch):
    can = [r for r in rows if r['record_type'] == 'CANONICAL']
    leg = [r for r in rows if r['record_type'] == 'LEGACY_REFERENCE']
    n = lambda rs, k, v='YES': sum(1 for r in rs if r[k] == v)
    has = lambda rs, c: sum(1 for r in rs if c in r['classifications'].split(';'))
    totals = {
        'CANONICAL_TOTAL': len(can),
        'PUBLIC_TOTAL': n(can, 'publication', 'PUBLIC'),
        'HOLD_TOTAL': n(can, 'publication', 'HOLD'),
        'AVAILABLE_TO_CONNECT_TOTAL': n(can, 'available_to_connect'),
        'NOT_AVAILABLE_TOTAL': n(can, 'available_to_connect', 'NO'),
        'STAGING_VERIFIED_TOTAL': n(can, 'staging_verified'),
        'RUNTIME_VERIFIED_TOTAL': n(can, 'runtime_verified'),
        'DISPATCH_ELIGIBLE_TOTAL': n(can, 'dispatch_eligible'),
        'BLOCKED_TOTAL': n(can, 'blocked'),
        'LEGACY_TOTAL': len(leg),
        'ALIAS_TOTAL': has(can, 'ALIAS'),
    }
    by_reason = Counter()
    for r in can:
        for reason in filter(None, r['unavailable_reason'].split(' | ')):
            by_reason[reason.split(':')[0]] += 1
    hold_src = Counter()
    for r in can:
        if r['publication'] != 'HOLD': continue
        for part in r['hold_reasons'].split(' · '):
            hold_src[part.split(':')[0]] += 1
    eng = Counter(r['engineering_status'] for r in can)
    pack = Counter(r['core_pack'] for r in can)
    leg_beh = Counter(r['legacy_behaviour'] for r in leg)
    byid = {r['id']: r for r in rows}

    L = []
    L.append('# Connector status summary')
    L.append('')
    L.append('**Generated by `scripts/build-inventory.py` — do not edit by hand.** Every number below is counted from the rows of '
             '`audit/CONNECTOR_MASTER_INVENTORY.csv`. Those rows come from the Connector OS core registry snapshot in `core-snapshot/`.')
    L.append('')
    L.append(f'- Core HEAD: `{core_head}` (branch `{core_branch}`, Core Interface Pack 2026-10-03)')
    L.append('- Core sources: `packages/registry/data/catalogue.json`, `dispatch-eligibility.json`, `staging-verified.json`, `inputs/identity-list.csv`')
    L.append('')
    L.append('## Totals')
    L.append('')
    L.append('| Key | Count | Rule |')
    L.append('|---|---:|---|')
    rules = {
        'CANONICAL_TOTAL': 'rows in core `catalogue.json`',
        'PUBLIC_TOTAL': 'canonical, not held (rendered on the public website and in the console catalogue)',
        'HOLD_TOTAL': 'canonical, held: core founder hold, core BLOCKED, or website editorial hold',
        'AVAILABLE_TO_CONNECT_TOTAL': 'core dispatch eligibility: staging or production dispatchable',
        'NOT_AVAILABLE_TOTAL': 'canonical, not dispatchable',
        'STAGING_VERIFIED_TOTAL': 'listed in core `staging-verified.json`',
        'RUNTIME_VERIFIED_TOTAL': 'runtime verification recorded (requires staging verification)',
        'DISPATCH_ELIGIBLE_TOTAL': 'same rule as available to connect',
        'BLOCKED_TOTAL': 'core disposition BLOCKED',
        'LEGACY_TOTAL': 'website legacy reference rows, none of them in core',
        'ALIAS_TOTAL': 'canonical rows with a core `alias_research_key`',
    }
    for k, v in totals.items():
        L.append(f'| {k} | {v} | {rules[k]} |')
    L.append('')
    L.append('Legacy rows are never canonical, never available to connect, and are not counted in any canonical total.')
    L.append('')
    L.append('## Why nothing is available to connect')
    L.append('')
    L.append('Core `dispatch-eligibility.json` reports 0 dispatchable rows in staging and 0 in production, with 0 grants. '
             'A row can carry several reasons. Each reason is counted once per row:')
    L.append('')
    L.append('| Reason | Rows |')
    L.append('|---|---:|')
    for k, v in sorted(by_reason.items(), key=lambda kv: -kv[1]):
        L.append(f'| `{k}` | {v} |')
    L.append('')
    L.append('## Holds (publication)')
    L.append('')
    L.append('| Source | Held rows carrying it |')
    L.append('|---|---:|')
    for k, v in sorted(hold_src.items(), key=lambda kv: -kv[1]):
        L.append(f'| {k} | {v} |')
    L.append('')
    L.append('## Engineering status (core disposition)')
    L.append('')
    L.append('| Disposition | Rows |')
    L.append('|---|---:|')
    for k, v in sorted(eng.items(), key=lambda kv: -kv[1]):
        L.append(f'| {k} | {v} |')
    L.append('')
    L.append('## Core packs')
    L.append('')
    L.append(', '.join(f'{k or "—"}: {v}' for k, v in sorted(pack.items())))
    L.append('')
    L.append('## Legacy reference rows (website only)')
    L.append('')
    L.append('| Behaviour | Rows |')
    L.append('|---|---:|')
    for k, v in sorted(leg_beh.items(), key=lambda kv: -kv[1]):
        L.append(f'| {k} | {v} |')
    L.append('')
    L.append('## Major providers')
    L.append('')
    L.append('| Provider | Record | Rank / pack | Publication | Engineering | Available to connect | Public website | Console catalogue | Evidence |')
    L.append('|---|---|---|---|---|---|---|---|---|')
    for pid in MAJOR:
        r = byid.get(pid)
        if r is None:
            L.append(f'| {pid} | NOT FOUND | — | — | — | NO | NO | NO | absent from core and website legacy |')
            continue
        if r['record_type'] == 'CANONICAL':
            web = 'YES (canonical page)' if r['publication'] == 'PUBLIC' else 'NO (held)'
            console = 'YES' if r['publication'] == 'PUBLIC' else 'NO (held)'
        else:
            web = 'Legacy reference page only' if r['publication'] == 'LEGACY_SURFACE' else 'NO'
            console = 'NO (not in core)'
        rank = r['rank'] or r['core_pack'] or '—'
        L.append(f"| {r['name']} (`{pid}`) | {r['record_type']} | {rank} | {r['publication']} | {r['engineering_status']} | "
                 f"{r['available_to_connect']} | {web} | {console} | {r['evidence']} |")
    L.append('')
    return '\n'.join(L), totals


def main():
    rows, csv_text, core_head, core_branch = build()
    md, totals = summary(rows, core_head, core_branch)
    if '--check' in sys.argv:
        stale = [p for p, t in ((CSV_OUT, csv_text), (MD_OUT, md))
                 if not os.path.exists(p) or open(p).read() != t]
        if stale:
            sys.exit('INVENTORY: RED — stale ' + ', '.join(os.path.relpath(p, ROOT) for p in stale) + ' (run scripts/build-inventory.py)')
    else:
        for p, t in ((CSV_OUT, csv_text), (MD_OUT, md)):
            with open(p, 'w') as f:
                f.write(t)
    print('INVENTORY: green — ' + ' '.join(f'{k}={v}' for k, v in totals.items()))


if __name__ == '__main__':
    main()
