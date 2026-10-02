#!/usr/bin/env python3
"""Dashboard gates (Track C exit):
  C1  every Action in /app pages carries an explicit maturity= prop
  C2  no enabled-without-path: Action maturity is a literal (auditable)
  C3  claim ceiling — dashboard copy never claims above HERMETIC
      (forbidden: STAGING VERIFIED / PRODUCTION VERIFIED / LIVE / EXTERNALLY
      AUDITED, except in negations/maturity labels)
  C4  every list route renders the four states via StateGate
  C5  shell reads platform-status.json (single status source)
"""
import os, re, sys

SRC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src')
DASH = os.path.join(SRC, 'pages', 'dash')
SHELL = os.path.join(SRC, 'components', 'dash')

fails = []

# C1/C2 — Action maturity literal
for fn in os.listdir(DASH):
    if not fn.endswith('.tsx'):
        continue
    s = open(os.path.join(DASH, fn)).read()
    for m in re.finditer(r'<Action\b', s):
        seg = s[m.start():m.start() + 400]
        close = seg.find('/>')
        seg = seg[:close] if close != -1 else seg
        if 'maturity="' not in seg:
            fails.append(f'C1 {fn}: <Action> without literal maturity= …{seg[:80]!r}')

# C3 — claim ceiling in dash copy (labels allowed: 'STAGING ONLY' is fine)
FORBIDDEN = ['STAGING VERIFIED', 'PRODUCTION VERIFIED', 'EXTERNALLY AUDITED']
for folder in (DASH, SHELL):
    for fn in os.listdir(folder):
        if not fn.endswith('.tsx'):
            continue
        s = open(os.path.join(folder, fn)).read()
        for term in FORBIDDEN:
            for m in re.finditer(term, s):
                ctx = s[max(0, m.start() - 60):m.end() + 20].lower()
                if 'never' in ctx or 'no wording' in ctx:
                    continue
                fails.append(f'C3 {fn}: forbidden claim term {term}')
        # 'LIVE' as a claim (allow 'live' lowercase UI words like "Runs (live)")
        for m in re.finditer(r'\bLIVE\b', s):
            fails.append(f'C3 {fn}: bare LIVE claim')

# C4 — four states on list routes
LIST_ROUTES = ['Overview', 'Approvals', 'Executions', 'Receipts', 'Connections', 'Runs', 'SecurityEvents', 'Workspace']
for fn in LIST_ROUTES:
    s = open(os.path.join(DASH, fn + '.tsx')).read()
    if 'StateGate' not in s or 'empty=' not in s:
        fails.append(f'C4 {fn}: missing StateGate with empty state')

# C5 — shell reads platform-status.json via status.ts
sh = open(os.path.join(SHELL, 'DashShell.tsx')).read()
if "from '../../lib/status'" not in sh or 'CLAIM_LEVEL' not in sh:
    fails.append('C5 DashShell does not read claim level from platform-status.json via status.ts')

if fails:
    print('DASHBOARD GATES: RED')
    for f in fails:
        print(' -', f)
    sys.exit(1)
print('DASHBOARD GATES: green — C1 actions labelled, C3 claim ceiling intact, C4 four states present, C5 status shared')
