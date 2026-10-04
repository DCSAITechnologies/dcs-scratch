#!/usr/bin/env python3
"""Small research batches for people or chat assistants (ChatGPT, DeepSeek, ...).

  python3 scripts/make-batches.py [--size 20]

Reads the synced catalogue, takes every published connector that still misses a fact,
puts the visitor-facing gaps (logo, site, portal, API reference, auth) first, and writes
data-sourcing/batches/batch-NNN.csv plus data-sourcing/batches/BATCHES.md (the index).
Returns go to data-sourcing/batches/returns/batch-NNN.jsonl; see BATCH_PROMPT.md.
"""
import csv, importlib.util, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'data-sourcing', 'batches')
spec = importlib.util.spec_from_file_location('rg', os.path.join(ROOT, 'scripts', 'remaining-gaps.py'))
rg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rg)
P1 = {'logo', 'site', 'portal', 'api', 'auth'}


def main():
    size = int(sys.argv[sys.argv.index('--size') + 1]) if '--size' in sys.argv else 20
    rows = [c for c in json.load(open(os.path.join(ROOT, 'src', 'lib', 'connectors.json'))) if not c['unpublished'] and c['id'] != 'egnyte']
    todo = [(c, rg.needs(c)) for c in rows]
    todo = [(c, n) for c, n in todo if n]
    # P1 gaps first, then most gaps; providers kept together inside each priority
    todo.sort(key=lambda x: (not (set(x[1]) & P1), (x[0].get('p') or '').lower(), x[0]['id']))
    os.makedirs(os.path.join(OUT, 'returns', 'logos'), exist_ok=True)
    for f in os.listdir(OUT):
        if f.startswith('batch-') and f.endswith('.csv'):
            os.remove(os.path.join(OUT, f))
    index = []
    for b in range(0, len(todo), size):
        chunk = todo[b:b + size]
        name = f'batch-{b // size + 1:03d}'
        with open(os.path.join(OUT, name + '.csv'), 'w', newline='') as f:
            w = csv.writer(f)
            w.writerow(['id', 'name', 'provider', 'category', 'known_site', 'known_portal', 'known_api', 'needs'])
            for c, n in chunk:
                w.writerow([c['id'], c['n'], c.get('p') or '', c['cat'], c.get('site') or '', c.get('portal') or '', c.get('api') or '', ';'.join(n)])
        p1 = sum(1 for _, n in chunk if set(n) & P1)
        index.append((name, len(chunk), p1, ', '.join(c['n'] for c, _ in chunk[:4]) + (' …' if len(chunk) > 4 else '')))
    L = ['# Research batches', '',
         f'{len(todo)} published connectors still miss at least one fact, in {len(index)} batches of up to {size}.',
         'Batches at the top hold the visitor-facing gaps (logo, website, developer portal, API reference, auth method).', '',
         'How to run one: give a person or a chat assistant **BATCH_PROMPT.md** plus one `batch-NNN.csv`. Save the answer as',
         '`returns/batch-NNN.jsonl` (logos in `returns/logos/`). Then follow "After the batches" in BATCH_PROMPT.md.', '',
         '| Batch | Connectors | With a top-priority gap | First few | Assigned to | Done |', '|---|---:|---:|---|---|---|']
    L += [f'| {n} | {k} | {p} | {first} |  |  |' for n, k, p, first in index]
    open(os.path.join(OUT, 'BATCHES.md'), 'w').write('\n'.join(L) + '\n')
    print(f'{len(index)} batches, {len(todo)} connectors; {sum(i[2] for i in index)} with a top-priority gap')


if __name__ == '__main__':
    main()
