#!/usr/bin/env python3
"""G10 snapshot test — render the status system under all three claim levels.

Verifies:
  1. VOCAB renders for every key under HERMETIC / STAGING / PRODUCTION
  2. No vocabulary string ever crosses the claim ceiling (forbidden terms)
  3. Every status page reference resolves to a real route
  4. Item count and label vocabulary match the spec (30 items, 7 labels)
  5. Notes contain no hard-coded connector counts (G9)
Exit 0 = green.
"""
import json, re, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
status = json.load(open(os.path.join(ROOT, 'src/lib/platform-status.json')))
status_ts = open(os.path.join(ROOT, 'src/lib/status.ts')).read()
connectors = json.load(open(os.path.join(ROOT, 'src/lib/connectors.json')))
count = len(connectors)

errors = []

# 1+2: VOCAB block from status.ts — evaluate the three levels per key
vocab_block = re.search(r'export const VOCAB = \{(.*?)\n\} as const', status_ts, re.S).group(1)
FORBIDDEN = ['staging verified', 'production verified', 'externally audited', 'live in production', 'certified']
keys = re.findall(r"(\w+): \{(.*?)\},\n", vocab_block, re.S)
for key, body in keys:
    for level in ('HERMETIC', 'STAGING', 'PRODUCTION'):
        m = re.search(level + r":\s*(`[^`]*`|'(?:[^'\\]|\\.)*')", body)
        if not m:
            errors.append(f'VOCAB.{key}.{level} missing')
            continue
        text = m.group(1).strip('`\'').replace('${CONNECTOR_COUNT}', str(count))
        low = text.lower()
        for f in FORBIDDEN:
            # allowed only in explicit negations
            if f in low and not re.search(r'(no|not yet|never|without)[^.;]*' + re.escape(f), low):
                errors.append(f'VOCAB.{key}.{level} crosses ceiling: "{f}"')

# 3: every page route in items resolves to a known route pattern
routes = set()
for fn in ['subpages.ts', 'subpages-agents.ts', 'subpages-security.ts',
           'subpages-enterprise.ts', 'subpages-developers.ts', 'subpages-company.ts']:
    routes |= set(re.findall(r"'(/[\w/-]+)':\s*\{", open(os.path.join(ROOT, 'src/lib', fn)).read()))
TOP = {'/', '/product', '/connectors', '/agents', '/security', '/enterprise', '/developers', '/pricing', '/receipts', '/signin'}
routes |= TOP
routes.add('/connectors/:id')
for item in status['items']:
    for p in item['pages']:
        if p not in routes:
            errors.append(f"item {item['id']} references unknown page {p}")

# 4: spec shape
if len(status['items']) != 30:
    errors.append(f"items = {len(status['items'])}, expected 30")
LABELS = {'Complete', 'Complete (integrated)', 'Complete (hermetically proven)', 'In progress', 'Pending', 'Pending (release gate)', 'External dependency'}
for item in status['items']:
    if item['label'] not in LABELS:
        errors.append(f"item {item['id']} bad label {item['label']}")

# 5: G9 — no hard-coded counts in notes
for item in status['items']:
    if re.search(r'\b\d{3,}\b', re.sub(r'\d+\.\d+\.\d+|Ranks \d+–\d+', '', item['note'])) and '{COUNT}' not in item['note']:
        errors.append(f"item {item['id']} hard-codes a number: {item['note'][:60]}")

# claim level valid
if status['claim_level'] not in ('HERMETIC', 'STAGING', 'PRODUCTION'):
    errors.append(f"bad claim_level {status['claim_level']}")

if errors:
    print('G10 SNAPSHOT: FAIL')
    for e in errors:
        print(' -', e)
    sys.exit(1)
print(f'G10 SNAPSHOT: green — 30 items, 3 claim levels, {len(keys)} vocab keys, ceiling intact, {len(routes)} routes resolve')
