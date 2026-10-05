#!/usr/bin/env python3
"""Validate the files the four data-sourcing terminals return and merge the accepted facts.

  python3 scripts/ingest-sourced-data.py            # validate data-sourcing/returns/part-*/ and write
  python3 scripts/ingest-sourced-data.py --dry-run  # validate and report only

Writes src/lib/sourced-data.json and public/logos/sourced/*, plus data-sourcing/INGEST_REPORT.md.
scripts/sync-catalogue.py then fills ONLY empty catalogue fields from it: core and curated editorial
records always win. A fact without an evidence URL, off the provider's domain, or malformed is
rejected and listed in the report; nothing is guessed or repaired.
"""
import csv, glob, json, os, re, shutil, struct, sys
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DS = os.path.join(ROOT, 'data-sourcing')
OUT_JSON = os.path.join(ROOT, 'src', 'lib', 'sourced-data.json')
LOGO_DIR = os.path.join(ROOT, 'public', 'logos', 'sourced')
LINKS = ('site', 'portal', 'api', 'authDocs', 'whDocs', 'statusUrl')
AUTH = {'OAuth 2.0', 'OAuth 2.0 + PKCE', 'OAuth 2.0 Client Credentials', 'API Key', 'API Key (multiple headers)', 'Bearer Token',
        'HTTP Basic', 'App password session', 'Provider-signed JWT', 'None (public API)', 'Provider-specific'}
SCOPE_MODELS = {'oauth_scopes', 'api_key_permissions', 'account_roles', 'none'}
ACCESS = {'read', 'write', 'admin'}
# third-party hosts that providers commonly use for their official docs or status pages
DOC_HOSTS = ('github.com', 'githubusercontent.com', 'readme.io', 'readme.com', 'gitbook.io', 'postman.com', 'getpostman.com',
             'apiary.io', 'swaggerhub.com', 'stoplight.io', 'statuspage.io', 'status.io', 'instatus.com', 'betteruptime.com',
             'atlassian.net', 'zendesk.com', 'freshdesk.com', 'notion.site', 'mintlify.app', 'redoc.ly', 'apidog.io', 'bump.sh',
             'helpscoutdocs.com', 'intercom.help', 'document360.io', 'hund.io', 'sorryapp.com', 'statuscake.com')
# provider-owned secondary domains, approved per connector with recorded proof (data-sourcing/domain-aliases.json)
ALIASES_PATH = os.path.join(DS, 'domain-aliases.json')
DECISIONS_PATH = os.path.join(DS, 'review-decisions.json')
# a note that admits a scope string or access level is a UI label or inferred disqualifies the scopes
SCOPE_CAVEAT = re.compile(r'\binferr?ed\b|\bUI labels?\b|\bguess', re.I)
TWO_LEVEL = ('co.uk', 'com.au', 'co.in', 'com.br', 'co.jp', 'co.nz', 'co.za', 'com.mx', 'com.sg', 'org.uk', 'net.au', 'com.tr', 'co.kr')


# shared hosting: every customer gets a subdomain, so the owner is the full host, never the suffix
SHARED_HOSTS = ('github.io', 'gitlab.io', 'netlify.app', 'vercel.app', 'pages.dev', 'herokuapp.com', 'web.app', 'firebaseapp.com',
                'azurewebsites.net', 'cloudfront.net', 'amazonaws.com', 'webflow.io', 'wordpress.com', 'blogspot.com', 'readme.io',
                'gitbook.io', 'notion.site', 'mintlify.app', 'statuspage.io', 'zendesk.com', 'freshdesk.com', 'atlassian.net')


def regdom(host):
    host = (host or '').lower().split(':')[0]
    parts = host.split('.')
    if '.'.join(parts[-2:]) in SHARED_HOSTS:
        return host
    n = 3 if '.'.join(parts[-2:]) in TWO_LEVEL else 2
    return '.'.join(parts[-n:])


def ok_url(u):
    if not isinstance(u, str) or not u.startswith('https://') or any(ch in u for ch in ' "<>'):
        return False
    return bool(urlparse(u).netloc)


def on_provider(u, domains):
    d = regdom(urlparse(u).netloc)
    return d in domains or any(d == h or d.endswith('.' + h) for h in DOC_HOSTS)


def png_size(path):
    with open(path, 'rb') as f:
        head = f.read(24)
    if head[:8] != b'\x89PNG\r\n\x1a\n':
        return None
    return struct.unpack('>II', head[16:24])


def check_logo(path):
    if not os.path.isfile(path):
        return 'file missing'
    size = os.path.getsize(path)
    if size == 0 or size > 200_000:
        return f'size {size} bytes (allowed 1..200000)'
    ext = os.path.splitext(path)[1].lower()
    if ext == '.svg':
        s = open(path, encoding='utf-8', errors='replace').read()
        if '<svg' not in s:
            return 'not an SVG'
        if re.search(r'<script|\son\w+\s*=|javascript:|<foreignObject|xlink:href\s*=\s*["\']https?:|href\s*=\s*["\']https?:', s, re.I):
            return 'SVG contains script, event handlers or external references'
        return None
    if ext == '.png':
        wh = png_size(path)
        if not wh:
            return 'not a PNG'
        if min(wh) < 64:
            return f'PNG too small {wh[0]}x{wh[1]} (min 64 px)'
        return None
    return f'unsupported type {ext} (svg or png only)'


def write_pending_proofs(rejected, rows):
    # connector -> host pairs rejected only because the domain is not yet proven provider-owned
    pend = {}
    for part, cid, field, why in rejected:
        m = re.search(r'(https?://\S+) is off the provider domain', why)
        if m:
            host = urlparse(m.group(1)).netloc
            e = pend.setdefault((cid, host), {'part': part, 'url': m.group(1), 'fields': set()})
            e['fields'].add(field)
    head = open(os.path.join(DS, 'PENDING_DOMAIN_PROOFS.md')).read().split('| Connector |')[0] if os.path.isfile(os.path.join(DS, 'PENDING_DOMAIN_PROOFS.md')) else '# Pending secondary-domain proofs\n\n'
    head = re.sub(r'\n\d+ pairs pending[^\n]*\n', '\n', head)  # regenerated below; never stack copies
    out = [head.rstrip() + '\n', f'{len(pend)} pairs pending (generated by scripts/ingest-sourced-data.py).', '',
           '| Connector | Part | Primary site | Domain needing proof | Fields held back | Example rejected URL |', '|---|---|---|---|---|---|']
    for (cid, host), e in sorted(pend.items()):
        out.append(f"| {cid} | {e['part']} | {(rows.get(cid) or {}).get('site') or '—'} | {host} | {', '.join(sorted(e['fields']))} | {e['url']} |")
    open(os.path.join(DS, 'PENDING_DOMAIN_PROOFS.md'), 'w').write('\n'.join(out) + '\n')


def main():
    dry = '--dry-run' in sys.argv
    aliases = {k: v for k, v in (json.load(open(ALIASES_PATH)).items() if os.path.isfile(ALIASES_PATH) else []) if not k.startswith('_')}
    decisions = {k: v for k, v in (json.load(open(DECISIONS_PATH)).items() if os.path.isfile(DECISIONS_PATH) else []) if not k.startswith('_')}
    rows = {c['id']: c for c in json.load(open(os.path.join(ROOT, 'src', 'lib', 'connectors.json')))}
    assigned = {}
    for p in sorted(glob.glob(os.path.join(DS, 'inputs', 'part-*.csv'))):
        part = os.path.basename(p)[:-4]
        for r in csv.DictReader(open(p)):
            assigned.setdefault(r['id'], part)  # a round-2 work list never relabels the original assignment
    accepted, rejected, logos, seen, missing_ids, flagged, records_by_id = {}, [], {}, set(), {}, [], {}
    for part_dir in sorted(glob.glob(os.path.join(DS, 'returns', 'part-*')), key=lambda d: int(re.sub(r'\D', '', os.path.basename(d)) or 0)):
        part = os.path.basename(part_dir)
        path = os.path.join(part_dir, 'records.jsonl')
        seen_here = set()
        if not os.path.isfile(path):
            rejected.append((part, '-', 'records.jsonl', 'file missing'))
            continue
        for ln, line in enumerate(open(path, encoding='utf-8'), 1):
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
            except json.JSONDecodeError as e:
                rejected.append((part, f'line {ln}', 'json', str(e)))
                continue
            cid = rec.get('id')
            c = rows.get(cid)
            if not c or c['unpublished']:
                rejected.append((part, cid, 'id', 'not a published canonical connector'))
                continue
            if cid in seen_here:
                rejected.append((part, cid, 'id', 'duplicate record in the same part'))
                continue
            seen_here.add(cid)
            # a later part (a targeted gap round) is validated on its own; a fact it adds wins only
            # when it passes, so an earlier accepted fact is never lost to a rejected replacement
            prev_sites = [records_by_id[cid].get('site')] if cid in seen else []
            seen.add(cid)
            records_by_id[cid] = {**records_by_id.get(cid, {}), **rec}
            dec = decisions.get(cid, {})
            if '*' in dec:
                rejected.append((part, cid, '*', 'reviewer: ' + dec['*']))
                continue
            if dec.get('review'):
                flagged.append((part, cid, 'review', dec['review']))
            for f, why in dec.items():
                if f != 'review' and f in rec:
                    rec.pop(f)
                    rejected.append((part, cid, f, 'reviewer: ' + why))
            if rec.get('providerScopes') and SCOPE_CAVEAT.search(rec.get('notes') or ''):
                rec.pop('providerScopes')
                rejected.append((part, cid, 'providerScopes', 'notes say the scopes are UI labels, inferred or guessed'))
            ev = rec.get('evidence') or {}
            out, src = {}, {}
            domains = {regdom(urlparse(u).netloc) for u in (c.get('site'), rec.get('site'), *prev_sites) if ok_url(u)}
            if not domains:
                # no site anywhere: fall back to the catalogue's own docs links (never ones a previous sourcing run filled),
                # so an empty site can no longer switch the domain check off
                filled = set((c.get('sourced') or {}).get('fields', []))
                domains = {regdom(urlparse(c[k]).netloc) for k in LINKS if k not in filled and ok_url(c.get(k))}
            if not domains:
                rejected.append((part, cid, '*', 'no verified provider domain (no site in the catalogue or the record, and no catalogue docs link) to check evidence against'))
                continue
            domains |= {regdom(a['domain']) for a in aliases.get(cid, []) if a.get('approved')}

            def take(field, value, evidence, check):
                why = check(value)
                if why:
                    rejected.append((part, cid, field, why))
                elif not ok_url(evidence):
                    rejected.append((part, cid, field, 'no https evidence URL'))
                elif domains and not on_provider(evidence, domains):
                    rejected.append((part, cid, field, f'evidence {evidence} is off the provider domain {sorted(domains)}'))
                else:
                    out[field], src[field] = value, evidence

            for k in LINKS:
                v = rec.get(k)
                if v in (None, ''):
                    continue
                if not ok_url(v):
                    rejected.append((part, cid, k, f'not an https URL: {v!r}'))
                elif k != 'site' and domains and not on_provider(v, domains):
                    rejected.append((part, cid, k, f'{v} is off the provider domain {sorted(domains)}'))
                else:
                    out[k], src[k] = v, v
            if 'auth' in rec and rec['auth'] not in (None, ''):
                take('auth', rec['auth'], ev.get('auth'), lambda v: None if v in AUTH else f'auth {v!r} not in {sorted(AUTH)}')
            if rec.get('scopeModel'):
                take('scopeModel', rec['scopeModel'], ev.get('scopes'), lambda v: None if v in SCOPE_MODELS else f'scopeModel {v!r} not in {sorted(SCOPE_MODELS)}')
            if rec.get('providerScopes'):
                def chk_scopes(v):
                    if not isinstance(v, list) or len(v) > 80:
                        return 'providerScopes must be a list of at most 80 items'
                    for s in v:
                        if not isinstance(s, dict) or not str(s.get('scope', '')).strip() or s.get('access') not in ACCESS:
                            return f'bad scope item {s!r} (need scope + access read|write|admin)'
                    return None
                take('providerScopes', [{'scope': s['scope'].strip(), 'access': s['access'], 'purpose': str(s.get('purpose') or '').strip()[:160]} for s in rec['providerScopes'] if isinstance(s, dict) and s.get('scope')]
                     if chk_scopes(rec['providerScopes']) is None else rec['providerScopes'], ev.get('scopes'), chk_scopes)
            if rec.get('providerCaps'):
                def chk_caps(v):
                    if not isinstance(v, list) or len(v) > 60:
                        return 'providerCaps must be a list of at most 60 items'
                    for s in v:
                        if not isinstance(s, dict) or not str(s.get('name', '')).strip() or s.get('access') not in ('read', 'write'):
                            return f'bad capability item {s!r} (need name + access read|write)'
                    return None
                take('providerCaps', [{'name': s['name'].strip()[:80], 'access': s['access'], 'endpoint': str(s.get('endpoint') or '').strip()[:120]} for s in rec['providerCaps'] if isinstance(s, dict) and s.get('name')]
                     if chk_caps(rec['providerCaps']) is None else rec['providerCaps'], ev.get('caps'), chk_caps)
            if rec.get('reqs'):
                take('reqs', [str(x).strip()[:160] for x in rec['reqs']][:8], ev.get('reqs') or ev.get('auth'),
                     lambda v: None if all(v) else 'empty requirement')
            lg = rec.get('logo')
            if lg:
                f = os.path.join(part_dir, lg.get('file', '')) if isinstance(lg, dict) else ''
                why = check_logo(f) if f else 'logo must be {file, source}'
                if why:
                    rejected.append((part, cid, 'logo', why))
                elif not ok_url(lg.get('source')):
                    rejected.append((part, cid, 'logo', 'no https source URL'))
                elif domains and not on_provider(lg['source'], domains) and 'wikimedia.org' not in lg['source']:
                    rejected.append((part, cid, 'logo', f"source {lg['source']} is off the provider domain {sorted(domains)}"))
                else:
                    ext = os.path.splitext(f)[1].lower()
                    logos[cid] = f
                    out['logo'], src['logo'] = f'/logos/sourced/{cid}{ext}', lg['source']
            if out:
                out['_src'] = src
                out['_checked'] = str(rec.get('checked') or '')[:10]
                out['_part'] = part
                if rec.get('notes'):
                    out['_notes'] = str(rec['notes'])[:600]  # kept: says where automated access was blocked
                prev = accepted.get(cid)
                if prev:
                    out = {**prev, **out, '_src': {**prev.get('_src', {}), **src}}
                    # earlier rejections of a field that is now accepted are superseded
                    rejected[:] = [x for x in rejected if not (x[1] == cid and x[0] != part and x[2] in out)]
                accepted[cid] = out
    for cid, part in assigned.items():
        if cid not in seen and os.path.isdir(os.path.join(DS, 'returns', part)):
            missing_ids.setdefault(part, []).append(cid)

    fields = ['logo', *LINKS, 'auth', 'scopeModel', 'providerScopes', 'providerCaps', 'reqs']
    lines = ['# Data-sourcing ingest report', '', 'Generated by `scripts/ingest-sourced-data.py`.' + (' **Dry run: nothing written.**' if dry else ''), '',
             f'Records read: {len(seen)} · connectors with accepted facts: {len(accepted)} · rejected facts: {len(rejected)}', '',
             '| Field | Accepted |', '|---|---:|']
    lines += [f'| {k} | {sum(1 for v in accepted.values() if k in v)} |' for k in fields]
    if missing_ids:
        lines += ['', '## Assigned ids with no record', '']
        lines += [f'- {p}: {len(v)} — {", ".join(sorted(v)[:40])}{" …" if len(v) > 40 else ""}' for p, v in sorted(missing_ids.items())]
    lines += ['', '## Rejected', '', '| Part | Connector | Field | Reason |', '|---|---|---|---|']
    lines += [f'| {a} | {b} | {c} | {d.replace("|", "/")} |' for a, b, c, d in rejected] or ['| — | — | — | none |']
    by_cid = {}
    for a, b, c, d in rejected + flagged:
        by_cid.setdefault(b.strip(), []).append((c, d))
    nf = {}
    for part_dir in sorted(glob.glob(os.path.join(DS, 'returns', 'part-*'))):
        p = os.path.join(part_dir, 'records.jsonl')
        for line in (open(p, encoding='utf-8') if os.path.isfile(p) else []):
            try:
                r = json.loads(line)
            except json.JSONDecodeError:
                continue
            if r.get('notFound'):
                nf[r.get('id')] = r['notFound']
    review = sorted(set(by_cid) | {c for v in missing_ids.values() for c in v})
    lines += ['', '## Review queue', '', f'{len(review)} connectors need a person: a rejected fact, a whole record rejected, a reviewer flag, or no record.', '',
              '| Connector | Part | State | Detail |', '|---|---|---|---|']
    for cid in review:
        if any(cid in v for v in missing_ids.values()):
            lines.append(f'| {cid} | {assigned.get(cid, "?")} | no record | deferred or not returned |')
            continue
        items = by_cid.get(cid, [])
        state = 'rejected' if any(f == '*' for f, _ in items) else 'no facts' if cid not in accepted else 'partial'
        lines.append(f'| {cid} | {assigned.get(cid, "?")} | {state} | ' + '; '.join(f'{f}: {d[:90]}'.replace('|', '/') for f, d in items) + ' |')
    queue = {cid: ('no record' if any(cid in v for v in missing_ids.values()) else
                   'rejected' if any(f == '*' for f, _ in by_cid.get(cid, [])) else
                   'no facts' if cid not in accepted else 'partial') for cid in review}
    lines += ['', f'Records that list facts they looked for and could not confirm (`notFound`): {len(nf)}.']
    report = '\n'.join(lines) + '\n'
    if dry:
        open(os.path.join(DS, 'INGEST_REPORT.dry-run.md'), 'w').write(report)
    if not dry:
        os.makedirs(LOGO_DIR, exist_ok=True)
        for cid, f in logos.items():
            shutil.copyfile(f, os.path.join(LOGO_DIR, cid + os.path.splitext(f)[1].lower()))
        for cid, v in accepted.items():
            if cid in by_cid:
                v['_review'] = sorted({f for f, _ in by_cid[cid] if f != 'review'}) or ['review']
            if nf.get(cid):
                v['_notFound'] = nf[cid]
        json.dump({'_comment': 'Facts sourced from official provider pages (data-sourcing/README.md), validated by scripts/ingest-sourced-data.py. Fills only empty catalogue fields; core and editorial records win.', '_queue': dict(sorted(queue.items())), **dict(sorted(accepted.items()))},
                  open(OUT_JSON, 'w'), ensure_ascii=False, indent=1)
        open(OUT_JSON, 'a').write('\n')
        open(os.path.join(DS, 'INGEST_REPORT.md'), 'w').write(report)
        write_pending_proofs(rejected, rows)
    print(report if len(report) < 4000 else report[:4000] + '\n… (full report: data-sourcing/INGEST_REPORT' + ('.dry-run' if dry else '') + '.md)')


if __name__ == '__main__':
    main()
