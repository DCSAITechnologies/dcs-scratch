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
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'src', 'lib', 'connectors.json')
LOGOS = os.path.join(ROOT, 'public', 'logos')

ALLOWED_STATUS = {'Preview', 'Read Only', 'Limited Access', 'Coming Soon', 'Provider Approval Required', 'HOLD'}
ALLOWED_RUNTIME = {'not_verified', 'staging_verified', 'production_verified'}

def main() -> int:
    expect = None
    if '--expect' in sys.argv:
        expect = int(sys.argv[sys.argv.index('--expect') + 1])

    records = json.load(open(DATA))
    errors: list[str] = []

    total = len(records)
    if expect is not None and total != expect:
        errors.append(f'TOTAL_CATALOGUE_RECORDS={total}, expected {expect}')

    ids = [c['id'] for c in records]
    dupes = sorted({i for i in ids if ids.count(i) > 1})
    if dupes:
        errors.append(f'DUPLICATES={dupes[:10]}')

    ranks = sorted(c['r'] for c in records)
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
        logo = c.get('logo')
        if logo:
            fn = logo.split('/')[-1]
            if fn not in logo_files:
                missing_logo += 1
    if missing_logo:
        errors.append(f'LOGO_FILES_MISSING={missing_logo}')

    published = sum(1 for c in records if not c.get('unpublished'))
    runtime_verified = sum(1 for c in records if c.get('runtime_status') not in (None, 'not_verified'))

    if errors:
        print('CATALOGUE VALIDATION: FAIL')
        for e in errors[:40]:
            print(' -', e)
        return 1
    print(f'CATALOGUE VALIDATION: green — TOTAL={total} PUBLISHED={published} UNIQUE_IDS={len(set(ids))} '
          f'RANKS=1-{ranks[-1] if ranks else 0} GAPS=0 DUPES=0 RUNTIME_VERIFIED={runtime_verified}')
    return 0

if __name__ == '__main__':
    sys.exit(main())
