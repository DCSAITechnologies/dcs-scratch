#!/usr/bin/env python3
"""Negative tests for the hold/publish rule in scripts/validate-catalogue.py.

The founder's publish_held decision (src/lib/founder-decisions.json) may list a held row as
Coming Soon, but a BLOCKED row or an excluded id must still fail the gate.
"""
import importlib.util, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('validate_catalogue', os.path.join(HERE, 'validate-catalogue.py'))
v = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v)

DECISION = {'decided': '2026-10-05', 'exclude': {'excluded-id': 'test'}}


def row(cid='x', disposition='CODED_LOCALLY_TESTED', holds=('gate:G-3 PHI',), listed=True, unpublished=False, dispatch='NOT_DISPATCHABLE'):
    r = {'id': cid, 'unpublished': unpublished, 'dispatch_eligibility': dispatch,
         'core': {'disposition': disposition, 'founder_holds': list(holds)}}
    if listed:
        r['listed_by_founder_decision'] = True
    return r


CASES = [
    ('listed core-held row passes', row(), DECISION, False),
    ('held and unpublished passes', row(listed=False, unpublished=True), DECISION, False),
    ('BLOCKED published fails, even when listed', row(disposition='BLOCKED'), DECISION, True),
    ('BLOCKED published fails without hold', row(disposition='BLOCKED', holds=()), DECISION, True),
    ('BLOCKED published fails without decision', row(disposition='BLOCKED', listed=False), None, True),
    ('excluded id published fails', row(cid='excluded-id'), DECISION, True),
    ('excluded editorial-only id published fails', row(cid='excluded-id', holds=()), DECISION, True),
    ('core-held published without flag fails', row(listed=False), DECISION, True),
    ('core-held published without decision fails', row(), None, True),
    ('listed row that is dispatchable fails', row(dispatch='DISPATCHABLE_STAGING'), DECISION, True),
]


def main() -> int:
    bad = []
    for name, r, decision, should_fail in CASES:
        failed = v.hold_publish_error(r, decision) is not None
        if failed != should_fail:
            bad.append(f'{name}: expected {"failure" if should_fail else "pass"}')
    # the committed decision must carry its exclude map
    real = v.load_publish_held()
    if real is not None and not real.get('exclude'):
        bad.append('founder-decisions.json publish_held has no exclude map')
    if bad:
        print('VALIDATE-CATALOGUE NEGATIVE TESTS: FAIL')
        for b in bad:
            print(' -', b)
        return 1
    print(f'VALIDATE-CATALOGUE NEGATIVE TESTS: green — {len(CASES)} cases (BLOCKED and excluded rows still fail)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
