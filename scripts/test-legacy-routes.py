#!/usr/bin/env python3
"""Legacy route-generation regression test (gate for Lane 6 preserved surfaces).
Run AFTER `vite build` + `scripts/prerender.py`.

Checks:
  1. Every legacy row with lane6_behavior PRESERVE_REFERENCE_SURFACE or REDIRECT
     has a prerendered shell at dist/connectors/<id>/index.html.
  2. Legacy rows with GONE / GONE_RETIRED_NOTICE / UNLIST_NO_REDIRECT dispositions
     intentionally have NO prerendered shell (SPA serves 410/404 at runtime).
  3. Major preserved legacy connectors are present and non-empty:
     OpenAI, Anthropic, GitHub, Slack, Notion, Google Gemini.
  4. Sitemap includes every preserved legacy route and excludes removed ones.
  5. Canonical-1000 ids never collide with legacy shells (canonical wins).
Exit non-zero on any failure.
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
SRC = os.path.join(ROOT, 'src')

PRESERVE_BEHAVIORS = {'PRESERVE_REFERENCE_SURFACE', 'REDIRECT'}
REMOVED_BEHAVIORS = {'GONE', 'GONE_RETIRED_NOTICE', 'UNLIST_NO_REDIRECT'}
MAJOR = ['openai', 'anthropic', 'azure-openai', 'google-gemini', 'github', 'gmail', 'slack', 'notion', 'stripe', 'linear']

def main():
    legacy = json.load(open(os.path.join(SRC, 'lib', 'connectors-legacy.json')))
    canonical = json.load(open(os.path.join(SRC, 'lib', 'connectors.json')))
    canonical_ids = {c['id'] for c in canonical}
    sitemap = open(os.path.join(DIST, 'sitemap.xml')).read()

    failures = []

    preserved = [c for c in legacy if c.get('lane6_behavior') in PRESERVE_BEHAVIORS]
    removed = [c for c in legacy if c.get('lane6_behavior') in REMOVED_BEHAVIORS]

    # 1. shells exist for preserved legacy rows
    for c in preserved:
        if c['id'] in canonical_ids:
            continue
        p = os.path.join(DIST, 'connectors', c['id'], 'index.html')
        if not os.path.isfile(p) or os.path.getsize(p) < 500:
            failures.append(f"missing/empty shell for preserved legacy: {c['id']}")

    # 2. NO shells for removed legacy rows
    for c in removed:
        p = os.path.join(DIST, 'connectors', c['id'], 'index.html')
        if os.path.isfile(p):
            failures.append(f"shell must NOT exist for removed legacy ({c.get('lane6_behavior')}): {c['id']}")

    # 3. major connectors trace — each must resolve either as a published canonical
    # row (core lists it) or as a preserved legacy reference surface; never both, never neither
    major = {}
    canonical_rows = {c['id']: c for c in canonical}
    for mid in MAJOR:
        row = next((c for c in legacy if c['id'] == mid), None)
        crow = canonical_rows.get(mid)
        p = os.path.join(DIST, 'connectors', mid, 'index.html')
        if crow is not None and row is not None:
            failures.append(f"MAJOR {mid} is both canonical and legacy"); major[mid] = 'CONFLICT'; continue
        if crow is not None:
            ok = not crow.get('unpublished') and os.path.isfile(p)
            major[mid] = 'canonical' if ok else 'canonical-NO-SHELL'
        else:
            ok = row is not None and row.get('lane6_behavior') in PRESERVE_BEHAVIORS and os.path.isfile(p)
            major[mid] = 'legacy-reference' if ok else 'MISSING'
        if not ok:
            failures.append(f"MAJOR connector route missing: {mid} ({major[mid]})")

    # 4. sitemap coverage — reference surfaces are listed; REDIRECT shells are
    # not (a sitemap lists final 200 URLs, never URLs that redirect elsewhere)
    for c in preserved:
        if c['id'] in canonical_ids:
            continue
        listed = f"/connectors/{c['id']}<" in sitemap
        if c.get('lane6_behavior') == 'REDIRECT':
            if listed:
                failures.append(f"sitemap must NOT include redirecting legacy: {c['id']}")
        elif not listed:
            failures.append(f"sitemap missing preserved legacy: {c['id']}")
    for c in removed:
        if f"/connectors/{c['id']}<" in sitemap:
            failures.append(f"sitemap must NOT include removed legacy: {c['id']}")

    # 5. canonical/legacy id collision check
    legacy_ids = {c['id'] for c in legacy}
    collision = canonical_ids & legacy_ids
    for cid in collision:
        # canonical wins — shell must still exist exactly once (from canonical pass)
        p = os.path.join(DIST, 'connectors', cid, 'index.html')
        if not os.path.isfile(p):
            failures.append(f"canonical id collides with legacy and has no shell: {cid}")

    total = len(preserved) + len(removed)
    print(f"legacy rows checked: {total} (preserved={len(preserved)} removed={len(removed)})")
    print("major connectors: " + ", ".join(f"{k}={v}" for k, v in major.items()))
    if failures:
        print(f"LEGACY ROUTE REGRESSION: FAIL — {len(failures)} issues")
        for f in failures[:25]:
            print(f"  - {f}")
        sys.exit(1)
    print("LEGACY ROUTE REGRESSION: green")

if __name__ == '__main__':
    main()
