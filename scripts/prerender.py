#!/usr/bin/env python3
"""Static pre-render for DCS Connector OS (gate G13).
Run AFTER `vite build`. Reads dist/index.html as the shell template and emits:
  - dist/<route>/index.html for every route, with per-page <title>, meta
    description, canonical and Open Graph tags
  - dist/404.html, dist/sitemap.xml, dist/robots.txt
All routes are data-driven, so a shell-per-route pre-render is sufficient.
"""
import json, os, re, shutil, sys
from html import escape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
SRC = os.path.join(ROOT, 'src')
SITE = 'https://connectos.dcslabs.dev'  # public origin; canonical/OG base

def esc(t): return escape(t, quote=True)

def page_meta(title, desc):
    return (
        f'<title>{esc(title)}</title>\n'
        f'    <meta name="description" content="{esc(desc)}" />\n'
        f'    <link rel="canonical" href="{SITE}{{PATH}}" />\n'
        f'    <meta property="og:title" content="{esc(title)}" />\n'
        f'    <meta property="og:description" content="{esc(desc)}" />\n'
        f'    <meta property="og:type" content="website" />\n'
        f'    <meta property="og:url" content="{SITE}{{PATH}}" />'
    )

def render(shell, path, title, desc, noindex=False):
    head = page_meta(title, desc).replace('{PATH}', path)
    if noindex:
        head += '\n    <meta name="robots" content="noindex, nofollow" />'
    # idempotent: drop tags injected by a previous run (dist/index.html is both
    # the shell and the '/' output, so re-running without a rebuild used to stack them)
    shell = re.sub(r'\s*<meta (?:name="(?:description|robots)"|property="og:[a-z]+") content="[^"]*" />', '', shell)
    shell = re.sub(r'\s*<link rel="canonical" href="[^"]*" />', '', shell)
    out = re.sub(r'<title>.*?</title>', head, shell, count=1, flags=re.S)
    # the console keeps its dark theme: its shells paint dark from the first byte
    theme = 'dark' if path.startswith('/app') else 'light'
    out = re.sub(r'data-theme="[a-z]+"', f'data-theme="{theme}"', out, count=1)
    return out

def write_route(path, html):
    d = os.path.join(DIST, path.strip('/'))
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, 'index.html'), 'w') as f:
        f.write(html)

def extract_subpage_routes():
    """Pull (route, title, tagline) from the subpage TS files with regex.
    Taglines may be '...' or `...` template literals; ${STATUS_AS_OF} is the only
    interpolation used and is filled from platform-status.json. Every route key in
    the files must be extracted — a silent miss (as happened to
    /developers/status) leaves a route with no static shell."""
    as_of = json.load(open(os.path.join(SRC, 'lib', 'platform-status.json')))['as_of']
    routes = []
    files = ['subpages.ts', 'subpages-agents.ts', 'subpages-security.ts',
             'subpages-enterprise.ts', 'subpages-developers.ts', 'subpages-company.ts']
    for fn in files:
        s = open(os.path.join(SRC, 'lib', fn)).read()
        keys = set(re.findall(r"^  '(/[\w/-]+)':\s*\{", s, re.M))
        found = set()
        for m in re.finditer(r"'(/[\w/-]+)':\s*\{[^}]*?title:\s*'((?:[^'\\]|\\.)*)'[^}]*?tagline:\s*(?:'((?:[^'\\]|\\.)*)'|`([^`]*)`)", s):
            route, title = m.group(1), m.group(2)
            tag = m.group(3) if m.group(3) is not None else m.group(4).replace('${STATUS_AS_OF}', as_of)
            title = title.replace("\\'", "'").replace('\\\\', '\\')
            tag = tag.replace("\\'", "'").replace('\\\\', '\\')
            routes.append((route, title, tag))
            found.add(route)
        if keys - found:
            sys.exit(f'prerender: could not extract title/tagline for {sorted(keys - found)} in {fn}')
    return routes

# Counts are derived from the catalogue at build time — never hard-coded (stale
# "750" copy shipped in this file before the 1000-row catalogue landed).
_CAT = json.load(open(os.path.join(SRC, 'lib', 'connectors.json')))
CAT_TOTAL = len(_CAT)
CAT_PUBLISHED = sum(1 for c in _CAT if not c.get('unpublished'))

STATIC_ROUTES = [
    ('/', 'DCS Connector OS — Governed execution for AI agents', f'The governed execution layer between AI agents and real systems — {CAT_PUBLISHED} published connectors ({CAT_TOTAL} catalogued), policy, human approval and receipts for every action.'),
    ('/product', 'Product — Connector OS', 'What Connector OS is: the governed path from agent intent to verified execution.'),
    ('/connectors', f'Connector catalogue — {CAT_PUBLISHED} published connectors', f'{CAT_TOTAL} catalogued, {CAT_PUBLISHED} published. Every connector documents capabilities, authentication, permissions, webhooks and official documentation, with verification status shown per connector.'),
    ('/agents', 'Agents — the Operations Agent Layer', 'More capable agents, under your control. The OAL reasons; Connector OS executes.'),
    ('/security', 'Security — twelve controls', 'The security model of Connector OS: credential isolation, tenant boundaries, approvals, kill controls and evidence.'),
    ('/enterprise', 'Enterprise — the operating model', 'Organizations, workspaces, roles, approval workflows, environments and audit — governance as an operating model.'),
    ('/developers', 'Developers — build against the governed path', 'Resource model, authentication, manifests, MCP, webhooks, receipts and build status.'),
    ('/pricing', 'Pricing — Connector OS', 'Plans without invented numbers. Final pricing is published when approved.'),
    ('/receipts', 'Receipts — what a receipt is', 'One illustrative run from the hermetic test suite: outcome vs receipt state, causal chain, verification.'),
    ('/signin', 'Sign in — Connector OS', 'Sign-in opens at launch. No accounts can be created yet; the console preview runs on hermetic fixture data.'),
    ('/docs', 'Developers — Connector OS', 'Redirects to the developer portal.'),
]

# Dashboard console routes (Track C) — pre-rendered shells with per-page meta,
# but EXCLUDED from sitemap.xml (console is not public content).
PREVIEW_ROUTES = [
    ('/preview/heroes', 'Hero concepts'),
    ('/preview/hero-a', 'HERO-A · Control plane canvas'),
    ('/preview/hero-b', 'HERO-B · Four-stage ledger'),
    ('/preview/hero-c', 'HERO-C · Catalogue field'),
]

DASH_ROUTES = [
    ('/app', 'Console — Overview', 'Action-required first, then health, then history. Preview console connected to the integrated build.'),
    ('/app/connectors', 'Console — Connectors', 'Catalogue maturity and runtime maturity side by side.'),
    ('/app/connections', 'Console — Connections', 'The connection lifecycle: create, authorize, test, active, degraded, suspended, revoked.'),
    ('/app/connections/new', 'Console — Connect a provider', 'Connector, auth scheme, authorize, test — simulator providers in the preview.'),
    ('/app/tools', 'Console — Tools', 'Cross-connection view of discovered capabilities with policy decision preview.'),
    ('/app/agents', 'Console — Agent runs', 'Runs, not agents: plans, diagnoses, recommendations — execution belongs to the broker.'),
    ('/app/policies', 'Console — Policies', 'Declarative rules with versions, evaluated per plan step.'),
    ('/app/approvals', 'Console — Approvals', 'The human gate: single-use, expiring, no widening.'),
    ('/app/executions', 'Console — Executions', 'What the broker did — outcome and receipt state as independent columns.'),
    ('/app/receipts', 'Console — Receipts', 'Evidence, not an activity log. Digests only.'),
    ('/app/events', 'Console — Events', 'Inbound provider events (verified before use) and outbound platform events.'),
    ('/app/security', 'Console — Security / Kill', 'Emergency control and its audit; leases; egress; drill evidence.'),
    ('/app/environments', 'Console — Environments', 'Development, Staging, Production as bound scopes.'),
    ('/app/developer', 'Console — Developer', 'API keys to the control plane; SDK/CLI pre-launch; MCP seam.'),
    ('/app/usage', 'Console — Usage', 'Counts, not billing.'),
    ('/app/team', 'Console — Team / Roles', 'Humans and roles; capability matrix shared with the website.'),
    ('/app/audit', 'Console — Audit', 'Everything humans and the platform did; receipts are the audit substrate.'),
    ('/app/settings', 'Console — Settings', 'Org/workspace configuration; FD-1 and FD-2 surfaces.'),
]

def main():
    shell_path = os.path.join(DIST, 'index.html')
    shell = open(shell_path).read()

    count = 0
    # static + subpage routes
    for path, title, desc in STATIC_ROUTES + extract_subpage_routes():
        write_route(path, render(shell, path, f'{title} — DCS Connector OS' if 'Connector OS' not in title else title, desc))
        count += 1

    # connector detail routes (published only). Alias rows are published under
    # their own id, so they get a shell too (previously skipped, and the client
    # rendered "Connector not found" for all of them).
    data = _CAT
    canonical_ids = {c['id'] for c in data}
    urls = [r[0] for r in STATIC_ROUTES if r[0] != '/docs'] + [r[0] for r in extract_subpage_routes()]
    for c in data:
        if c.get('unpublished'):
            continue
        if c.get('alias_of') and c['alias_of'] not in canonical_ids:
            # the alias identifier redirects client-side to this row; give it a shell
            write_route(f"/connectors/{c['alias_of']}", render(shell, f"/connectors/{c['alias_of']}", f"{c['n']} connector — DCS Connector OS", c['d'][:300], noindex=True))
            count += 1
        elif c.get('alias_of'):
            continue
        path = f"/connectors/{c['id']}"
        title = f"{c['n']} connector — DCS Connector OS"
        desc = c['d'][:300]
        write_route(path, render(shell, path, title, desc))
        urls.append(path)
        count += 1

    # Lane 6 legacy reference surfaces: rows whose disposition keeps them publicly
    # addressable (PRESERVE_REFERENCE_SURFACE → 200 + REFERENCE banner, REDIRECT →
    # client redirect notice). GONE / GONE_RETIRED / UNLIST rows intentionally get
    # NO shell — the SPA serves 410/404 for those at runtime.
    legacy = json.load(open(os.path.join(SRC, 'lib', 'connectors-legacy.json')))
    legacy_count = 0
    for c in legacy:
        behavior = c.get('lane6_behavior')
        if behavior not in ('PRESERVE_REFERENCE_SURFACE', 'REDIRECT'):
            continue
        if c['id'] in canonical_ids:
            continue  # canonical record wins
        path = f"/connectors/{c['id']}"
        title = f"{c['n']} — legacy catalogue reference — DCS Connector OS"
        desc = (c.get('d') or f"Legacy catalogue reference surface for {c['n']}.")[:300]
        write_route(path, render(shell, path, title, desc, noindex=behavior == 'REDIRECT'))
        if behavior != 'REDIRECT':
            urls.append(path)  # redirect shells are not sitemap content
        count += 1
        legacy_count += 1

    # 404
    with open(os.path.join(DIST, '404.html'), 'w') as f:
        f.write(render(shell, '/404', 'Page not found — DCS Connector OS', 'The route you asked for does not exist.'))

    # dashboard console routes (not in sitemap)
    for path, title, desc in DASH_ROUTES:
        write_route(path, render(shell, path, f'{title} — DCS Connector OS', desc, noindex=True))
        count += 1

    # founder-review hero concepts (noindex, not in sitemap, disallowed)
    for path, title in PREVIEW_ROUTES:
        write_route(path, render(shell, path, f'{title} — DCS Connector OS', 'Homepage hero concept for founder review. Not the live homepage.', noindex=True))
        count += 1

    # sitemap + robots
    sm = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in urls:
        sm.append(f'  <url><loc>{SITE}{u}</loc></url>')
    sm.append('</urlset>')
    open(os.path.join(DIST, 'sitemap.xml'), 'w').write('\n'.join(sm))
    open(os.path.join(DIST, 'robots.txt'), 'w').write('User-agent: *\nAllow: /\nDisallow: /app\nDisallow: /preview\nSitemap: %s/sitemap.xml\n' % SITE)

    write_host_rules(data, legacy)
    print(f'prerendered {count} routes + 404 + sitemap ({len(urls)} urls)')
    print(f'legacy reference surfaces prerendered: {legacy_count}')

def origin(url):
    m = re.match(r'^(https?://[^/]+)', url or '')
    return m.group(1) if m else None


def write_host_rules(canonical, legacy):
    """Host rules for static hosting (Netlify `_redirects`/`_headers` syntax, also
    read by Cloudflare Pages for redirects and headers; Cloudflare Pages ignores
    410 — see audit/HANDOFF.md). Real HTTP semantics instead of the client-side
    notices the SPA shows: 301 for moved ids, 410 for removed legacy ids, and a
    200 console fallback so /app deep links (detail ids) load the console shell.
    """
    canonical_ids = {c['id'] for c in canonical}
    lines = ['# generated by scripts/prerender.py — do not edit', '/docs  /developers  301!', '/preview/home  /  301!']
    for c in canonical:
        if c.get('alias_of') and c['alias_of'] not in canonical_ids and not c.get('unpublished'):
            lines.append(f"/connectors/{c['alias_of']}  /connectors/{c['id']}  301!")  # ! = apply over the fallback shell
    for c in legacy:
        b = c.get('lane6_behavior')
        if c['id'] in canonical_ids:
            continue
        if b == 'REDIRECT' and c.get('lane6_redirect_to'):
            lines.append(f"/connectors/{c['id']}  {c['lane6_redirect_to']}  301!")
        elif b in ('GONE', 'GONE_RETIRED_NOTICE'):
            lines.append(f"/connectors/{c['id']}  /404.html  410")
    lines.append('/app/*  /app/index.html  200')
    open(os.path.join(DIST, '_redirects'), 'w').write('\n'.join(lines) + '\n')

    # CSP: only the origins this build is configured to talk to (same env vars Vite reads).
    env = os.environ
    connect = ["'self'"] + [o for o in (origin(env.get('VITE_COS_API_URL')), origin(env.get('VITE_OIDC_ISSUER')), origin(env.get('VITE_CONTACT_ENDPOINT'))) if o]
    script, frame = ["'self'"], ["'none'"]
    if env.get('VITE_TURNSTILE_SITE_KEY'):
        script.append('https://challenges.cloudflare.com'); frame = ['https://challenges.cloudflare.com']
    if env.get('VITE_OIDC_ISSUER'):
        frame = [f for f in frame if f != "'none'"] + [origin(env['VITE_OIDC_ISSUER'])]  # silent renew iframe
    csp = '; '.join([
        "default-src 'self'", f"script-src {' '.join(script)}", "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com", "img-src 'self' data:", f"connect-src {' '.join(dict.fromkeys(connect))}",
        f"frame-src {' '.join(frame)}", "frame-ancestors 'none'", "object-src 'none'", "base-uri 'self'", "form-action 'self'",
    ])
    headers = [
        '# generated by scripts/prerender.py — do not edit',
        '/*',
        f'  Content-Security-Policy: {csp}',
        '  Strict-Transport-Security: max-age=31536000; includeSubDomains',
        '  X-Content-Type-Options: nosniff',
        '  Referrer-Policy: strict-origin-when-cross-origin',
        '  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()',
        '  X-Frame-Options: DENY',
        '/app/*',
        '  X-Robots-Tag: noindex, nofollow',
        '  Cache-Control: no-store',
        '/preview/*',
        '  X-Robots-Tag: noindex, nofollow',
        '/assets/*',
        '  Cache-Control: public, max-age=31536000, immutable',
    ]
    open(os.path.join(DIST, '_headers'), 'w').write('\n'.join(headers) + '\n')
    print(f"host rules: {len(lines) - 1} redirect/status rules, CSP connect-src {' '.join(dict.fromkeys(connect))}")


if __name__ == '__main__':
    main()
