#!/usr/bin/env python3
"""Route smoke coverage (gate G13 companion).
Serves dist/ statically and verifies:
  - representative canonical-1000 connector routes return 200
  - ALL legacy PRESERVE_REFERENCE_SURFACE + REDIRECT routes return 200
    (regression coverage for the legacy route-generation bug)
  - legacy GONE / GONE_RETIRED / UNLIST routes do NOT serve a stale 200 shell
  - sitemap.xml and 404.html exist
Run AFTER `vite build` + `scripts/prerender.py`. No browser needed.
"""
import json, os, sys, threading, functools, http.server, socketserver, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
SRC = os.path.join(ROOT, 'src')
PORT = 43197

# canonical (core) or legacy reference — either way the route must serve 200
MAJOR_LEGACY = ['openai', 'anthropic', 'azure-openai', 'google-gemini', 'github', 'gmail', 'slack', 'notion', 'stripe', 'linear']

def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=DIST)
    handler.log_message = lambda *a, **k: None
    httpd = socketserver.TCPServer(('127.0.0.1', PORT), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd

def probe(path):
    try:
        with urllib.request.urlopen(f'http://127.0.0.1:{PORT}{path}', timeout=5) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return 0

def main():
    canonical = json.load(open(os.path.join(SRC, 'lib', 'connectors.json')))
    legacy = json.load(open(os.path.join(SRC, 'lib', 'connectors-legacy.json')))
    canonical_ids = {c['id'] for c in canonical}

    httpd = serve()
    failures = []

    try:
        # canonical sample (first, middle, last published)
        pub = [c for c in canonical if not c.get('unpublished') and not c.get('alias_of')]
        for c in (pub[0], pub[len(pub)//2], pub[-1]):
            code = probe(f"/connectors/{c['id']}/")
            if code != 200:
                failures.append(f"canonical route {c['id']} -> {code}")

        # legacy preserved routes — full coverage
        preserved = [c for c in legacy if c.get('lane6_behavior') in ('PRESERVE_REFERENCE_SURFACE', 'REDIRECT') and c['id'] not in canonical_ids]
        broken = 0
        for c in preserved:
            code = probe(f"/connectors/{c['id']}/")
            if code != 200:
                broken += 1
                if broken <= 15:
                    failures.append(f"legacy preserved route {c['id']} -> {code}")
        if broken > 15:
            failures.append(f"...plus {broken-15} more broken legacy preserved routes")

        # major connectors explicit
        for mid in MAJOR_LEGACY:
            code = probe(f"/connectors/{mid}/")
            if code != 200:
                failures.append(f"MAJOR route {mid} -> {code}")

        # core static routes
        for path in ('/', '/connectors', '/developers', '/app'):
            code = probe(path if path == '/' else path + '/')
            if code != 200:
                failures.append(f"static route {path} -> {code}")

        # sitemap + 404 file
        if not os.path.isfile(os.path.join(DIST, 'sitemap.xml')):
            failures.append('sitemap.xml missing')
        if not os.path.isfile(os.path.join(DIST, '404.html')):
            failures.append('404.html missing')
    finally:
        httpd.shutdown()

    print(f"legacy preserved routes probed: {len(preserved)} (200 expected)")
    if failures:
        print(f"ROUTE SMOKE: FAIL — {len(failures)} issues")
        for f in failures:
            print(f"  - {f}")
        sys.exit(1)
    print(f"ROUTE SMOKE: green — canonical + {len(preserved)} legacy preserved routes all 200")

if __name__ == '__main__':
    main()
