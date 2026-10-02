#!/usr/bin/env python3
"""Gate G9b — no hard-coded connector counts in shipped copy.

Counts must be derived from connectors.json (TOTAL_CATALOGUED, PUBLISHED_COUNT,
UNPUBLISHED_COUNT in src/lib/data.ts; CAT_TOTAL / CAT_PUBLISHED in prerender).
This gate fails on a number of 3+ digits sitting next to connector-count wording
in source, prerender meta or index.html — the way '750 catalogued connectors'
survived in prerender.py after the catalogue moved to 1000.
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = []
for base, _, names in os.walk(os.path.join(ROOT, 'src')):
    FILES += [os.path.join(base, n) for n in names if n.endswith(('.ts', '.tsx'))]
FILES += [os.path.join(ROOT, 'scripts', 'prerender.py'), os.path.join(ROOT, 'index.html')]

COUNT = re.compile(r'\b\d{3,4}\b\s*(?:[-–]?\s*row\s+)?(?:catalogued|published|canonical|documented|connectors\b|connector records|records in the)', re.I)
# historical references that describe the legacy dataset, not the live count
ALLOW = re.compile(r'legacy|750-row|previous catalogue', re.I)

fails = []
for fn in FILES:
    for i, line in enumerate(open(fn, encoding='utf-8'), 1):
        stripped = line.strip()
        if stripped.startswith(('//', '#', '*', '/*')):
            continue  # comments are not shipped copy
        for m in COUNT.finditer(line):
            if ALLOW.search(line):
                continue
            fails.append(f'{os.path.relpath(fn, ROOT)}:{i}: {m.group(0)!r}')

if fails:
    print('STALE COUNT GATE: RED — hard-coded connector counts:')
    for f in fails:
        print(' -', f)
    sys.exit(1)
print(f'STALE COUNT GATE: green — {len(FILES)} files, no hard-coded connector counts')
