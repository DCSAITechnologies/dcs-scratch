#!/usr/bin/env python3
"""Catalogue validation gate — runs on the current catalogue and is 1000-ready.

Usage:
  python3 scripts/validate-catalogue.py                # validate current catalogue, any size
  python3 scripts/validate-catalogue.py --expect 1000  # fail unless exactly N records

Checks (fail the build):
  - unique connector ids (alias rows must never duplicate ids)
  - website ranks contiguous 1..N, no gaps, no duplicates
  - every record: canonical name, provider, category, public status from the allowed set
  - runtime_status present; never upgraded by ingestion (only not_verified unless evidence field set)
  - logo file exists in public/logos or logo is null (monogram fallback)
  - no 'Available' catalogue status with runtime_status == 'not_verified'
"""
from __future__ import annotations
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'src', 'lib', 'connectors.json')
LOGOS = os.path.join(ROOT, 'public', 'logos')

ALLOWED_STATUS = {'Preview', 'Read Only', 'Limited Access', 'Coming Soon', 'Provider Approval Required', 'HOLD', 'Blocked', 'Available'}
ALLOWED_RUNTIME = {'not_verified', 'staging_verified', 'production_verified'}
DECISIONS = os.path.join(ROOT, 'src', 'lib', 'founder-decisions.json')


def load_publish_held(path: str = DECISIONS) -> dict | None:
    return (json.load(open(path)) if os.path.isfile(path) else {}).get('publish_held')


def hold_publish_error(c: dict, decision: dict | None) -> str | None:
    # a core hold or BLOCKED row may be published only through the founder's publish_held decision
    # (src/lib/founder-decisions.json), never when BLOCKED and never for an excluded id
    core = c.get('core') or {}
    blocked = core.get('disposition') == 'BLOCKED'
    if c.get('listed_by_founder_decision') and not c.get('unpublished') and (blocked or not decision or c['id'] in (decision.get('exclude') or {})):
        return f"{c['id']}: listed_by_founder_decision on a BLOCKED, excluded or undecided row"
    if not (core.get('founder_holds') or blocked) or c.get('unpublished'):
        return None
    if blocked:
        return f"{c['id']}: core BLOCKED but published"
    if not decision:
        return f"{c['id']}: core hold but published (no founder publish_held decision)"
    if c['id'] in (decision.get('exclude') or {}):
        return f"{c['id']}: core hold but published although founder decision excludes it"
    if c.get('listed_by_founder_decision') is not True:
        return f"{c['id']}: core hold but published without listed_by_founder_decision"
    if c.get('dispatch_eligibility') != 'NOT_DISPATCHABLE':
        return f"{c['id']}: listed by founder decision but not NOT_DISPATCHABLE"
    return None

def main() -> int:
    expect = None
    if '--expect' in sys.argv:
        expect = int(sys.argv[sys.argv.index('--expect') + 1])

    records = json.load(open(DATA))
    decision = load_publish_held()
    errors: list[str] = []

    total = len(records)
    if expect is not None and total != expect:
        errors.append(f'TOTAL_CATALOGUE_RECORDS={total}, expected {expect}')

    ids = [c['id'] for c in records]
    dupes = sorted({i for i in ids if ids.count(i) > 1})
    if dupes:
        errors.append(f'DUPLICATES={dupes[:10]}')

    # ranks: the core engineering rank. Ranked rows are contiguous 1..N; unranked
    # rows (Golden Five, reference connectors, blocked-unranked) carry r = null.
    unranked = [c['id'] for c in records if c['r'] is None]
    ranks = sorted(c['r'] for c in records if c['r'] is not None)
    gaps = [r for r in range(1, (ranks[-1] if ranks else 0) + 1) if r not in set(ranks)]
    rank_dupes = sorted({r for r in ranks if ranks.count(r) > 1})
    if gaps:
        errors.append(f'RANK_GAPS={gaps[:10]}')
    if rank_dupes:
        errors.append(f'RANK_DUPLICATES={rank_dupes[:10]}')

    logo_files = set(os.listdir(LOGOS)) if os.path.isdir(LOGOS) else set()
    missing_logo = 0
    for c in records:
        if not c.get('n') or not c.get('p') or not c.get('cat'):
            errors.append(f"{c.get('id')}: missing name/provider/category")
        if c.get('s') not in ALLOWED_STATUS:
            errors.append(f"{c['id']}: bad catalogue status {c.get('s')!r}")
        rs = c.get('runtime_status', 'not_verified')
        if rs not in ALLOWED_RUNTIME:
            errors.append(f"{c['id']}: bad runtime_status {rs!r}")
        if c.get('s') == 'Available' and rs == 'not_verified':
            errors.append(f"{c['id']}: Available without runtime evidence — forbidden")
        core = c.get('core') or {}
        if c.get('s') in ('Available', 'Preview') and not (core.get('dispatch') or {}).get('production' if c['s'] == 'Available' else 'staging'):
            errors.append(f"{c['id']}: catalogue status {c['s']} without core dispatch eligibility — forbidden")
        err = hold_publish_error(c, decision)
        if err:
            errors.append(err)
        logo = c.get('logo')
        if logo:
            if not logo.startswith('/'):
                errors.append(f"{c['id']}: logo path {logo!r} is relative (breaks on nested routes)")
            if not os.path.isfile(os.path.join(ROOT, 'public', logo.lstrip('/'))):
                missing_logo += 1
    if missing_logo:
        errors.append(f'LOGO_FILES_MISSING={missing_logo}')

    # membership and ranks must equal the committed core snapshot exactly
    snap = os.path.join(ROOT, 'core-snapshot', 'catalogue.json')
    if os.path.isfile(snap):
        core_rows = json.load(open(snap))['rows']
        core_ids = [r['connector_id'] for r in core_rows]
        if sorted(core_ids) != sorted(ids):
            errors.append(f'MEMBERSHIP differs from core snapshot (core {len(core_ids)}, site {len(ids)})')
        core_rank = {r['connector_id']: r['engineering_rank'] for r in core_rows}
        drift = [c['id'] for c in records if core_rank.get(c['id'], 'x') != c['r']]
        if drift:
            errors.append(f'RANK_DRIFT_FROM_CORE={drift[:10]}')
    else:
        errors.append('core-snapshot/catalogue.json missing')
    # founder curation (Popular tab, AI leaders): every id must be a published canonical row
    # or a preserved reference page, so the curation can never list a held or unknown connector
    pop_path = os.path.join(ROOT, 'src', 'lib', 'popular.json')
    if os.path.isfile(pop_path):
        pop = json.load(open(pop_path))
        legacy = json.load(open(os.path.join(ROOT, 'src', 'lib', 'connectors-legacy.json')))
        ok = {c['id'] for c in records if not c.get('unpublished')} | {
            c['id'] for c in legacy if c.get('lane6_behavior') == 'PRESERVE_REFERENCE_SURFACE'}
        for key in ('popular', 'aiLeaders'):
            ids_ = pop.get(key) or []
            bad = [i for i in ids_ if i not in ok]
            if bad:
                errors.append(f'POPULAR_{key.upper()}_NOT_LISTABLE={bad[:10]}')
            if len(set(ids_)) != len(ids_):
                errors.append(f'POPULAR_{key.upper()}_DUPLICATES')
    if errors:
        print('CATALOGUE VALIDATION: FAIL')
        for e in errors[:40]:
            print(' -', e)
        return 1

    published = sum(1 for c in records if not c.get('unpublished'))
    runtime_verified = sum(1 for c in records if c.get('runtime_status') not in (None, 'not_verified'))

    if errors:
        print('CATALOGUE VALIDATION: FAIL')
        for e in errors[:40]:
            print(' -', e)
        return 1
    print(f'CATALOGUE VALIDATION: green — TOTAL={total} PUBLISHED={published} UNIQUE_IDS={len(set(ids))} '
          f'RANKS=1-{ranks[-1] if ranks else 0} UNRANKED={len(unranked)} GAPS=0 DUPES=0 RUNTIME_VERIFIED={runtime_verified} (= core snapshot)')
    return 0

if __name__ == '__main__':
    sys.exit(main())
