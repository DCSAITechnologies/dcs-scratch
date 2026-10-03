#!/usr/bin/env python3
"""One-time codemod: console (/app) colour literals -> theme tokens (CSS variables defined in
src/index.css for html[data-theme='dark'|'light']). Kept as a record of the mapping."""
import re, sys

HEX = {  # literal -> token
    '#21C87A': 'ok', '#9BE7C4': 'ok',
    '#F5A524': 'warn', '#FFB224': 'warn', '#F5C56B': 'warn', '#E8C98A': 'warn', '#C7A86A': 'warn',
    '#EF4444': 'err', '#DC2626': 'err', '#FF8A8A': 'err',
    '#4D8DFF': 'info', '#5A7BFF': 'info', '#3B5BDB': 'info', '#4C6EF5': 'info', '#9FB8FF': 'link', '#7EA2FF': 'link',
    '#B07BFF': 'violet', '#8B5CF6': 'violet', '#7DD3FC': 'sky',
    '#A9B6D3': 'text-2', '#C7D2EA': 'text-2', '#DCE4F7': 'text-2', '#D6E1FF': 'text-2', '#E6ECFF': 'text', '#A9B6DA': 'text-2',
    '#8592AE': 'muted', '#93A0C2': 'muted', '#8B97B8': 'muted', '#5B6884': 'subtle',
    '#070B18': 'bg', '#060A16': 'bg', '#090F22': 'panel', '#080D1D': 'panel', '#0B1128': 'panel',
    '#0C1330': 'card', '#0d1430': 'card', '#151D3D': 'card', '#1B1403': 'on-warn',
}

def var(tok): return f'var(--c-{tok})'

def convert(s):
    # hex alpha suffix in template strings: `${c}1a` -> tint(c, 10)
    s = re.sub(r'`\$\{([^}]+)\}([0-9a-fA-F]{2})`', lambda m: f'tint({m.group(1)}, {round(int(m.group(2), 16) / 255 * 100)})', s)
    for h, t in HEX.items():
        s = re.sub(re.escape(h) + r'(?![0-9A-Fa-f])', var(t), s, flags=re.I)
    s = re.sub(r'(?<![\w:/-])((?:hover:|group-hover:)?)text-white(?![\w/-])', r'\1text-[var(--c-text)]', s)
    s = re.sub(r'(?<![\w-])bg-white/(\[[0-9.]+\]|[0-9]+)', 'bg-[var(--c-card-2)]', s)
    s = re.sub(r'(?<![\w-])((?:hover:)?)border-white/(\[[0-9.]+\]|[0-9]+)', r'\1border-[var(--c-border)]', s)
    s = re.sub(r'(?<![\w-])divide-white/(\[[0-9.]+\]|[0-9]+)', 'divide-[var(--c-border)]', s)
    s = re.sub(r'(?<![\w-])bg-white(?![\w/-])', 'bg-[var(--c-primary)]', s)
    # token + tailwind opacity -> color-mix
    def mix(m):
        prefix, tok, op = m.group(1), m.group(2), m.group(3).strip('[]')
        pct = round(float(op) * 100) if '.' in op or float(op) <= 1 else int(op)
        return f'{prefix}-[color-mix(in_srgb,var(--c-{tok})_{pct}%,transparent)]'
    s = re.sub(r'([a-z:-]*?(?:bg|border|text|from|to|ring|outline))-\[var\(--c-([a-z0-9-]+)\)\]/(\[[0-9.]+\]|[0-9]+)', mix, s)
    # rgba tints
    s = re.sub(r'rgba\(255,\s*255,\s*255,\s*0?\.0[0-9]+\)', var('card-2'), s)
    s = re.sub(r'rgba\(245,\s*165,\s*36,\s*([0-9.]+)\)', lambda m: f'color-mix(in srgb, var(--c-warn) {round(float(m.group(1)) * 100)}%, transparent)', s)
    s = re.sub(r'rgba\(20,\s*17,\s*8,\s*0?\.9[0-9]*\)', var('card'), s)
    return s

for p in sys.argv[1:]:
    src = open(p).read()
    out = convert(src)
    if 'tint(' in out and 'tint(' not in src and 'console-theme' not in out:
        depth = p.count('/') - 1  # src/... -> relative path to src/lib
        rel = '../' * (depth - 1) + 'lib/console-theme'
        out = re.sub(r"(^import [^\n]+\n)(?!import)", lambda m: m.group(1) + f"import {{ tint }} from '{rel}'\n", out, count=1, flags=re.M)
    if out != src:
        open(p, 'w').write(out)
        print('converted', p)
