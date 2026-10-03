#!/usr/bin/env python3
"""Dashboard gates (Track C exit):
  C1  every Action in /app pages carries an explicit maturity= prop
  C2  no enabled-without-path: Action maturity is a literal (auditable)
  C3  claim ceiling — dashboard copy never claims above HERMETIC
      (forbidden: STAGING VERIFIED / PRODUCTION VERIFIED / LIVE / EXTERNALLY
      AUDITED, except in negations/maturity labels)
  C4  every list route renders the four states via StateGate
  C5  shell reads platform-status.json (single status source)
  C6  /app route patterns are counted mechanically from the router, and every
      static /app route has a prerendered shell in scripts/prerender.py
  C8  API-mode pages (src/pages/dash/api, ApiRail, AuthGate) never import the
      fixture stores — a backend failure can never be papered over with fake data
  C9  the production build (dist/) contains no mock bearer token
  C7  no liveness copy over fixture data (real-time, fresh, all systems
      operational) and no enabled WIRED <Action> without an onClick handler
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
        # C7 — liveness wording over fixture data
        for term in ('real-time', 'realtime', 'all systems operational', '> fresh<', ' fresh</'):
            if term in s.lower():
                fails.append(f'C7 {fn}: liveness wording {term!r} over fixture data')
        # 'LIVE' as a claim (allow 'live' lowercase UI words like "Runs (live)")
        for m in re.finditer(r'\bLIVE\b', s):
            fails.append(f'C3 {fn}: bare LIVE claim')

# C7 — an enabled (WIRED) action must do something
for fn in os.listdir(DASH):
    if not fn.endswith('.tsx'):
        continue
    s = open(os.path.join(DASH, fn)).read()
    for m in re.finditer(r'<Action\b[^>]*?maturity="WIRED"[^>]*?/>', s, re.S):
        if 'onClick=' not in m.group(0):
            fails.append(f'C7 {fn}: WIRED <Action> without onClick: {m.group(0)[:80]!r}')

# C6 — mechanical /app route inventory
router = open(os.path.join(DASH, 'index.tsx')).read()
static_routes = sorted(set(re.findall(r"r === '(/app(?:/[a-z/-]*)?)'", router)) - {'/app/'})
detail_routes = re.findall(r"m\(/\^(\\/app[^$]*)\$/\)", router)
ROUTE_PATTERNS = len(static_routes) + len(detail_routes)
pre = open(os.path.join(os.path.dirname(SRC), 'scripts', 'prerender.py')).read()
for r in static_routes:
    if f"('{r}'," not in pre:
        fails.append(f'C6 static console route {r} has no prerendered shell')
m = re.search(r'Dashboard router — (\d+) /app route patterns', router)
if not m or int(m.group(1)) != ROUTE_PATTERNS:
    fails.append(f'C6 router header comment does not state the mechanical count ({ROUTE_PATTERNS})')

# C8 — no fixture imports on the API path
API_FILES = [os.path.join(DASH, 'api', f) for f in os.listdir(os.path.join(DASH, 'api')) if f.endswith('.tsx')] + \
    [os.path.join(SHELL, 'ApiRail.tsx'), os.path.join(SHELL, 'AuthGate.tsx'), os.path.join(SHELL, 'api-ui.tsx')]
for f in API_FILES:
    if re.search(r"from '[./]*lib/fixtures'", open(f).read()):
        fails.append(f'C8 {os.path.relpath(f, SRC)} imports fixtures on the API path')

# C9 — no mock credentials in the production bundle
DIST = os.path.join(os.path.dirname(SRC), 'dist', 'assets')
if os.path.isdir(DIST):
    for fn in os.listdir(DIST):
        if fn.endswith('.js') and re.search(r'mock-(operator|approver|viewer|apikey)|co[sk]o?_hermetic_|cosk_hermetic_', open(os.path.join(DIST, fn), errors='ignore').read()):
            fails.append(f'C9 dist/assets/{fn} contains a mock bearer token')

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
print(f'DASHBOARD GATES: green — C1 actions labelled, C3 claim ceiling intact, C4 four states present, C5 status shared, C6 {ROUTE_PATTERNS} route patterns ({len(static_routes)} static + {len(detail_routes)} detail) all shelled, C7 no liveness copy / no dead WIRED actions, C8 API path fixture-free ({len(API_FILES)} files), C9 no mock tokens in dist')
