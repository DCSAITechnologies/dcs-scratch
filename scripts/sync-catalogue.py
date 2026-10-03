#!/usr/bin/env python3
"""Generate the website catalogue from Connector OS core truth.

Source of truth (copied verbatim into core-snapshot/ with SHA-256 and CORE_HEAD):
  packages/registry/data/catalogue.json            membership, names, ranks, dispositions, holds, packs
  packages/registry/data/dispatch-eligibility.json staging/production dispatch + reasons
  packages/registry/data/staging-verified.json     staging verification records
  packages/registry/data/inputs/identity-list.csv  research identity (alias keys, parent company)
  packages/registry/data/inputs/blocked-and-replaced.csv

Editorial (presentation only — never membership or status):
  src/lib/connectors.json         existing website rows (descriptions, capabilities, logos, links)
  src/lib/connectors-legacy.json  legacy 750-catalogue records; used as the editorial source for a
                                  core row the website did not have yet, and removed from the legacy
                                  set once core makes that id canonical

Usage:
  python3 scripts/sync-catalogue.py --core <interface-pack-or-core-root>   # refresh snapshot + regenerate
  python3 scripts/sync-catalogue.py                                         # regenerate from core-snapshot/
  python3 scripts/sync-catalogue.py --check                                 # fail if the JSON is not what the snapshot generates

Rules (all mechanical, nothing invented):
  canonical          = every core catalogue row (count derived, never typed)
  rank               = core engineering_rank (null → unranked: Golden Five, reference, blocked-unranked)
  engineering status = core disposition
  dispatch           = core dispatch-eligibility (staging / production / reasons)
  staging verified   = id present in core staging-verified.json
  runtime status     = staging_verified iff staging verified, else not_verified
  catalogue status   = BLOCKED → "Blocked"; any hold → "HOLD"; ACCESS_GATED → "Provider Approval Required";
                       dispatchable in production/staging → "Available" / "Preview"; otherwise "Coming Soon"
  HOLD (unpublished) = core founder_holds non-empty OR core disposition BLOCKED OR website editorial hold
                       (the website's Lane 6 editorial hold is kept: never publish what either side holds)
  available to connect = dispatchable in staging or production (core); 0 rows today unless core grants
"""
import csv, hashlib, json, os, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SNAP = os.path.join(ROOT, 'core-snapshot')
LIB = os.path.join(ROOT, 'src', 'lib')
FILES = {
    'catalogue.json': 'packages/registry/data/catalogue.json',
    'dispatch-eligibility.json': 'packages/registry/data/dispatch-eligibility.json',
    'staging-verified.json': 'packages/registry/data/staging-verified.json',
    'identity-list.csv': 'packages/registry/data/inputs/identity-list.csv',
    'blocked-and-replaced.csv': 'packages/registry/data/inputs/blocked-and-replaced.csv',
}
META = ['CORE_HEAD.txt', 'CORE_BRANCH.txt', 'CORE_STATUS.txt']

# legacy (750-catalogue) category names → the website's canonical category names
LEGACY_CATEGORY = {
    'CI/CD & Testing': 'Developer Tools', 'Commerce & Marketplaces': 'Commerce / Marketplaces',
    'Communications': 'Communications / Voice / Video', 'Documents & eSignature': 'Documents / E-sign / Forms',
    'Finance & Accounting': 'Finance / Accounting / Tax', 'Government & Public Data': 'Government / Public Data',
    'HR & Payroll': 'HR / Recruiting / Payroll', 'Healthcare & Life Sciences': 'Healthcare',
    'Legal & Compliance': 'Legal / Compliance', 'Logistics & Inventory': 'Logistics / Shipping / Inventory',
    'Manufacturing & ERP': 'Manufacturing / ERP / Supply Chain', 'Marketing & Advertising': 'Marketing / Advertising',
    'Payments & Fintech': 'Payments / Banking / Fintech', 'Real Estate & Construction': 'Real Estate / Construction',
    'Social & Publishing': 'Social / Creator / Publishing', 'Support & Customer Success': 'Support & Success',
    'Travel & Hospitality': 'Travel / Hospitality / Events',
}
# rows with no editorial record anywhere get a category from this table (recorded as an assignment, not a fact)
ASSIGNED_CATEGORY = {'gmail': 'Communications / Voice / Video', 'cirrus-ci': 'Developer Tools', 'tenor': 'Social / Creator / Publishing',
                     'gel-cloud': 'Databases & Search', 'delighted': 'Support & Success'}

sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()


def refresh_snapshot(src):
    base = src
    for cand in (src, os.path.join(src, 'core')):
        if os.path.isfile(os.path.join(cand, FILES['catalogue.json'])):
            base = cand
            break
    else:
        sys.exit(f'no {FILES["catalogue.json"]} under {src}')
    os.makedirs(SNAP, exist_ok=True)
    for name, rel in FILES.items():
        shutil.copyfile(os.path.join(base, rel), os.path.join(SNAP, name))
    pack_root = os.path.dirname(base) if os.path.basename(base) == 'core' else base
    for m in META:
        p = os.path.join(pack_root, m)
        if os.path.isfile(p):
            shutil.copyfile(p, os.path.join(SNAP, m))
    with open(os.path.join(SNAP, 'SHA256SUMS'), 'w') as f:
        for name in FILES:
            f.write(f'{sha(os.path.join(SNAP, name))}  {name}\n')
    print(f'core snapshot refreshed from {base}')


def verify_snapshot():
    sums = dict(line.split()[::-1] for line in open(os.path.join(SNAP, 'SHA256SUMS')) if line.strip())
    for name in FILES:
        if sums.get(name) != sha(os.path.join(SNAP, name)):
            sys.exit(f'core-snapshot/{name} does not match core-snapshot/SHA256SUMS — refresh with --core, never edit by hand')


def catalogue_status(row, hold, dispatch):
    if row['disposition'] == 'BLOCKED':
        return 'Blocked'
    if hold:
        return 'HOLD'
    if dispatch.get('production'):
        return 'Available'
    if dispatch.get('staging'):
        return 'Preview'
    if row['disposition'] == 'ACCESS_GATED':
        return 'Provider Approval Required'
    return 'Coming Soon'


def generate():
    verify_snapshot()
    core = json.load(open(os.path.join(SNAP, 'catalogue.json')))
    elig = json.load(open(os.path.join(SNAP, 'dispatch-eligibility.json')))['connectors']
    sv = {(x if isinstance(x, str) else x.get('connector_id')) for x in json.load(open(os.path.join(SNAP, 'staging-verified.json'))).get('verified', [])}
    ident = {r['connector_id']: r for r in csv.DictReader(open(os.path.join(SNAP, 'identity-list.csv')))}
    blocked = {r['blocked_connector_id']: r for r in csv.DictReader(open(os.path.join(SNAP, 'blocked-and-replaced.csv')))}
    head = open(os.path.join(SNAP, 'CORE_HEAD.txt')).read().strip() if os.path.isfile(os.path.join(SNAP, 'CORE_HEAD.txt')) else None

    site_path, legacy_path = os.path.join(LIB, 'connectors.json'), os.path.join(LIB, 'connectors-legacy.json')
    site = {c['id']: c for c in json.load(open(site_path))}
    legacy = json.load(open(legacy_path))
    legacy_by = {c['id']: c for c in legacy}

    # stable editorial cache so regeneration is idempotent after promotions remove legacy rows
    cache_path = os.path.join(SNAP, 'editorial-promoted.json')
    promoted_cache = json.load(open(cache_path)) if os.path.isfile(cache_path) else {}

    rows = core['rows']
    ranked = sorted((r for r in rows if r['engineering_rank'] is not None), key=lambda r: r['engineering_rank'])
    unranked = [r for r in rows if r['engineering_rank'] is None]
    order = {'GOLDEN-FIVE': 0, 'REFERENCE': 1}
    unranked.sort(key=lambda r: (order.get(r['pack'], 2), r['connector_id']))

    out, promoted = [], {}
    for r in ranked + unranked:
        cid = r['connector_id']
        e = elig.get(cid, {'staging': False, 'production': False, 'reasons': ['no_eligibility_record'], 'production_reasons': []})
        ed = site.get(cid)
        generated_before = ed is not None and 'core' in ed
        editorial_source = ed.get('editorial_source', 'website catalogue') if generated_before else 'website catalogue'
        # the website's own (Lane 6) editorial hold: read once from the pre-sync rows, then carried in its own field
        editorial_hold = (ed.get('editorial_hold') if generated_before else (ed.get('hold_category') if ed and ed.get('unpublished') else None)) if ed else None
        if ed is None:
            leg = legacy_by.get(cid) or promoted_cache.get(cid)
            if leg is not None:
                ed = {k: v for k, v in leg.items() if not k.startswith('lane6_') and k not in ('legacy_surface', 'unreconciled')}
                ed['cat'] = LEGACY_CATEGORY.get(ed['cat'], ed['cat'])
                ed['description_source'] = 'legacy 750-catalogue editorial record, promoted because core lists this id as canonical; not checked against the core manifest'
                promoted[cid] = leg
                editorial_source = 'legacy record (promoted)'
            else:
                b = blocked.get(cid, {})
                ed = {
                    'id': cid, 'n': r['name'], 'p': (ident.get(cid) or {}).get('parent_company') or r['name'],
                    'cat': ASSIGNED_CATEGORY.get(cid, 'Developer Tools'), 'auth': 'See documentation', 'rw': 'not documented',
                    'wh': False, 'whEvents': [], 'caps': [], 'res': [], 'uc': [], 'ops': [], 'scopes': [], 'optScopes': [],
                    'flow': 'Not yet documented.', 'reqs': [], 'logo': '', 'site': '', 'portal': None, 'api': None, 'authDocs': None,
                    'whDocs': None, 'statusUrl': None, 'verified': None, 'cta': 'coming_soon',
                    'd': f"{r['name']} connector ({r['pack']} pack, Manifest {r['generation']})." + (f" Blocked: {b.get('reason') or r.get('notes')}." if r['disposition'] == 'BLOCKED' else '') + ' Editorial description pending.',
                    'l': r.get('notes') or 'Editorial description pending.',
                    'description_source': 'auto-pending',
                }
                editorial_source = 'minimal record generated from core (category assigned, editorial pending)'
        row = dict(ed)
        # undo the previous run's sourced fill so regeneration is idempotent (apply_sourced re-applies it)
        row.update((row.pop('sourced', None) or {}).get('prior', {}))
        for k in ('scopeModel', 'providerScopes', 'providerCaps'):
            row.pop(k, None)
        if cid in OVERRIDES:  # curated editorial facts for rows core delivered without website copy
            row.update(OVERRIDES[cid])
            editorial_source = 'editorial record (src/lib/editorial-overrides.json)'
        core_hold = list(r.get('founder_holds') or [])
        site_hold = bool(editorial_hold)
        hold = bool(core_hold) or r['disposition'] == 'BLOCKED' or site_hold
        reasons = []
        if r['disposition'] == 'BLOCKED':
            reasons.append(f"Blocked in core: {r.get('notes') or 'disposition BLOCKED'}" + (f" (replaced by {r['replaced_by']})" if r.get('replaced_by') else ''))
        if core_hold:
            reasons.append('Founder hold in core: ' + '; '.join(core_hold))
        if site_hold:
            reasons.append(f'Website editorial hold: {editorial_hold}')
        row.update({
            'id': cid, 'n': r['name'], 'r': r['engineering_rank'],
            'engineering_rank': r['engineering_rank'], 'research_rank': r.get('research_rank'),
            'engineering_status': r['disposition'],
            's': catalogue_status(r, hold, e),
            'runtime_status': 'staging_verified' if cid in sv else 'not_verified',
            'unpublished': hold,
            'hold_category': ' · '.join(reasons) if hold else None,
            'founder_hold': bool(core_hold), 'editorial_hold': editorial_hold, 'alias_of': (ident.get(cid) or {}).get('alias_research_key') or None,
            'dispatch_eligibility': 'DISPATCHABLE_PRODUCTION' if e.get('production') else 'DISPATCHABLE_STAGING' if e.get('staging') else 'NOT_DISPATCHABLE',
            'dispatch_reason': ', '.join(e.get('reasons', [])) or None,
            'core': {
                'pack': r['pack'], 'generation': r['generation'], 'disposition': r['disposition'], 'source_ref': r['source']['ref'],
                'founder_holds': core_hold, 'notes': r.get('notes'), 'replaced_by': r.get('replaced_by'),
                'blocked_from_rank': r.get('blocked_from_rank'), 'website_public_status': r.get('website_public_status'),
                'dispatch': {'staging': bool(e.get('staging')), 'production': bool(e.get('production')),
                             'reasons': list(e.get('reasons', [])), 'production_reasons': list(e.get('production_reasons', []))},
                'staging_verified': cid in sv, 'core_head': head,
            },
            'editorial_source': editorial_source,
        })
        if not hold and row.get('cta') == 'coming_soon' and editorial_source.startswith('legacy'):
            row['cta'] = 'notify'
        out.append(row)

    # legacy rows that core now makes canonical leave the legacy set (their routes resolve to the canonical row)
    canonical_ids = {r['id'] for r in out}
    new_legacy = [c for c in legacy if c['id'] not in canonical_ids]
    for cid, leg in promoted.items():
        promoted_cache[cid] = leg
    return out, new_legacy, promoted_cache, head


LOGO_MAP = os.path.join(LIB, 'logo-map.json')
_ov_path = os.path.join(LIB, 'editorial-overrides.json')
OVERRIDES = {k: v for k, v in (json.load(open(_ov_path)).items() if os.path.isfile(_ov_path) else []) if not k.startswith('_')}
_sd_path = os.path.join(LIB, 'sourced-data.json')
SOURCED = {k: v for k, v in (json.load(open(_sd_path)).items() if os.path.isfile(_sd_path) else []) if not k.startswith('_')}
UNKNOWN_AUTH = ('See documentation', '', None)


def apply_sourced(rows):
    # facts from official provider pages (data-sourcing/README.md, validated by scripts/ingest-sourced-data.py);
    # they fill only empty fields, so core and curated editorial records always win
    for r in rows:
        sd = SOURCED.get(r['id'])
        if not sd or r.get('unpublished'):
            continue
        used, prior = {}, {}

        def fill(k, v):
            prior.setdefault(k, r.get(k))
            r[k] = used[k] = v
        for k in ('site', 'portal', 'api', 'authDocs', 'whDocs', 'statusUrl'):
            if sd.get(k) and not r.get(k):
                fill(k, sd[k])
        if sd.get('auth') and r.get('auth') in UNKNOWN_AUTH:
            if r.get('flow') in ('Not yet documented.', 'See documentation', '', None):
                fill('flow', sd['auth'])
            fill('auth', sd['auth'])
        if sd.get('reqs') and not r.get('reqs'):
            fill('reqs', sd['reqs'])
        for k in ('scopeModel', 'providerScopes', 'providerCaps'):
            if sd.get(k):
                r[k] = used[k] = sd[k]
        if any(k in used for k in ('site', 'portal', 'api', 'authDocs')) and not r.get('verified') and sd.get('_checked'):
            fill('verified', sd['_checked'])
        if used or sd.get('logo'):
            r['sourced'] = {'part': sd.get('_part'), 'checked': sd.get('_checked'), 'prior': prior,
                            'fields': sorted(set(used) | ({'logo'} if sd.get('logo') else set())),
                            'evidence': {k: v for k, v in sd.get('_src', {}).items() if k in used or k == 'logo'}}
    return rows


def apply_logos(rows):
    # brand marks chosen by scripts/build-logos.mjs (audit/LOGO_SOURCES.md); the website's own
    # logo is kept in logo_editorial so regeneration stays idempotent and the fallback survives
    brand = json.load(open(LOGO_MAP)) if os.path.isfile(LOGO_MAP) else {}
    for r in rows:
        editorial = r.get('logo_editorial', r.get('logo')) or ''
        r['logo_editorial'] = editorial
        hit = brand.get(r['id'])
        sourced = (SOURCED.get(r['id']) or {}).get('logo')
        editorial_ok = editorial and os.path.isfile(os.path.join(ROOT, 'public', editorial.lstrip('/')))
        r['logo'] = hit['src'] if hit else editorial if editorial_ok or not sourced else sourced
        r['logo_source'] = hit['source'] if hit else ('website (official domain)' if editorial_ok or (editorial and not sourced) else 'data-sourcing (official provider page)' if sourced else None)
    return rows


def root_logo(rows):
    # logo paths must be site-absolute: a relative 'logos/x.png' resolves under nested routes
    # (/connectors/x/logos/x.png) and silently falls back to the monogram
    for r in rows:
        for k in ('logo', 'logo_editorial'):
            logo = r.get(k)
            if logo and not logo.startswith(('/', 'http://', 'https://', 'data:')):
                r[k] = '/' + logo
    return rows


def dump(obj):
    return json.dumps(obj, ensure_ascii=False, indent=None, separators=(',', ':')) + '\n'


def main():
    if '--core' in sys.argv:
        refresh_snapshot(sys.argv[sys.argv.index('--core') + 1])
    out, legacy, cache, head = generate()
    apply_logos(root_logo(out))
    apply_sourced(out)
    apply_logos(root_logo(legacy))
    targets = {os.path.join(LIB, 'connectors.json'): dump(out), os.path.join(LIB, 'connectors-legacy.json'): dump(legacy),
               os.path.join(SNAP, 'editorial-promoted.json'): json.dumps(cache, ensure_ascii=False, indent=1) + '\n'}
    if '--check' in sys.argv:
        stale = [os.path.relpath(p, ROOT) for p, s in targets.items() if not os.path.isfile(p) or open(p).read() != s]
        if stale:
            sys.exit(f'CATALOGUE SYNC: RED — {", ".join(stale)} not generated from core-snapshot (run scripts/sync-catalogue.py)')
        print(f'CATALOGUE SYNC: green — {len(out)} canonical rows generated from core {head or "(no CORE_HEAD)"}; {len(legacy)} legacy rows')
        return
    for p, s in targets.items():
        open(p, 'w').write(s)
    pub = sum(1 for r in out if not r['unpublished'])
    print(f'generated {len(out)} canonical rows ({pub} public, {len(out) - pub} hold) and {len(legacy)} legacy rows from core {head}')


if __name__ == '__main__':
    main()
