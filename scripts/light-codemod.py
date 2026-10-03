#!/usr/bin/env python3
"""One-time codemod: dark-theme colour literals -> light-theme equivalents in public-site files.
Kept in the repo as a record of the mapping. The console (src/pages/dash, src/components/dash) is untouched."""
import re, sys

TEXT = {
    'text-white': 'text-[#0B1220]', 'hover:text-white': 'hover:text-[#0B1220]', 'group-hover:text-white': 'group-hover:text-[#0B1220]',
    'text-[#93A0C2]': 'text-[#566074]', 'text-[#7E8AA8]': 'text-[#5E6779]',
    'text-[#A9B6D3]': 'text-[#3A4357]', 'text-[#A9B6DA]': 'text-[#3A4357]', 'hover:text-[#A9B6D3]': 'hover:text-[#3A4357]',
    'text-[#D6E1FF]': 'text-[#1E2638]', 'text-[#C6D2EE]': 'text-[#2B3446]', 'text-[#E6ECFF]': 'text-[#1E2638]',
    'text-[#5A7BFF]': 'text-[#2850D8]', 'text-[#7EA2FF]': 'text-[#2850D8]', 'text-[#8B9BFF]': 'text-[#2850D8]', 'text-[#6C63FF]': 'text-[#2850D8]', 'text-[#9FB8FF]': 'text-[#2850D8]',
    'text-[#00C2FF]': 'text-[#0E7490]', 'text-[#9FD3FF]': 'text-[#0369A1]',
    'text-[#A78BFA]': 'text-[#6D28D9]', 'text-[#8B5CF6]': 'text-[#6D28D9]',
    'text-[#21C87A]': 'text-[#047857]', 'text-[#34D399]': 'text-[#047857]',
    'text-[#F5A524]': 'text-[#B45309]', 'text-[#FCD34D]': 'text-[#B45309]', 'text-[#E8C98A]': 'text-[#92400E]', 'text-[#FBBF24]': 'text-[#B45309]',
    'text-[#EF4444]': 'text-[#B91C1C]', 'text-[#FF8A8A]': 'text-[#B91C1C]', 'text-[#F87171]': 'text-[#B91C1C]',
    'bg-[#5A7BFF]': 'bg-[#2850D8]', 'bg-[#00C2FF]': 'bg-[#0E7490]', 'bg-[#8B5CF6]': 'bg-[#6D28D9]',
    'placeholder:text-[#7E8AA8]': 'placeholder:text-[#6B7385]',
}
HEX = {  # bare hex in inline styles / data (status dots, text colours)
    '#21C87A': '#047857', '#F5A524': '#B45309', '#EF4444': '#B91C1C', '#00C2FF': '#0E7490',
    '#5A7BFF': '#2850D8', '#4D8DFF': '#2850D8', '#6C63FF': '#2850D8', '#7C4DFF': '#2850D8', '#8B9BFF': '#2850D8', '#7EA2FF': '#2850D8',
    '#8B5CF6': '#6D28D9', '#A78BFA': '#6D28D9', '#FCD34D': '#B45309',
    '#A9B6D3': '#3A4357', '#93A0C2': '#566074', '#D6E1FF': '#1E2638', '#C6D2EE': '#2B3446', '#7E8AA8': '#5E6779',
}
LIGHT_BORDER, LIGHT_TINT, LIGHT_BLUE_TINT, LIGHT_BLUE_LINE = '#E3E7EE', '#F5F7FB', '#EDF2FF', '#B9C9F6'

def rgba(m):
    r, g, b, a = (float(x) for x in m.group(1, 2, 3, 4))
    ctx = m.string[max(0, m.start() - 40):m.start()].lower()
    is_border = 'border' in ctx or 'outline' in ctx or 'stroke' in ctx
    is_shadow = 'shadow' in ctx
    if (r, g, b) in {(6, 10, 22), (16, 26, 56), (13, 20, 48), (11, 18, 40), (10, 16, 34), (26, 31, 84), (8, 16, 34), (4, 7, 15)}:
        return LIGHT_BORDER if is_border else '#FFFFFF'
    if (r, g, b) == (120, 140, 255):
        return LIGHT_BORDER if (is_border or a >= 0.12) and not ('background' in ctx and a < 0.12) else LIGHT_TINT
    if (r, g, b) in {(90, 123, 255), (124, 77, 255), (108, 99, 255), (139, 92, 246), (92, 110, 255)}:
        if is_shadow:
            return 'rgba(40,80,216,0.10)'
        return LIGHT_BLUE_LINE if (is_border or a >= 0.3) else LIGHT_BLUE_TINT
    if (r, g, b) == (0, 0, 0) and is_shadow:
        return 'rgba(16,24,40,0.10)'
    if (r, g, b) == (255, 255, 255) and a <= 0.12:  # faint white overlays on dark → faint ink on light
        return f'rgba(15,23,42,{min(a, 0.06):.2f})'
    return m.group(0)

def convert(src):
    for k in sorted(TEXT, key=len, reverse=True):
        src = re.sub(r'(?<![\w:/-])' + re.escape(k) + r'(?![\w\[/-])', TEXT[k], src)
    src = re.sub(r'(?<![\w:-])(?:bg|border)-white/(\[[0-9.]+\]|[0-9]+)', lambda m: ('bg-[#F5F7FB]' if m.group(0).startswith('bg') else 'border-[#E3E7EE]'), src)
    src = re.sub(r'text-white/(\[[0-9.]+\]|[0-9]+)', 'text-[#1E2638]', src)
    src = re.sub(r'rgba\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9.]+)\s*\)', rgba, src)
    for k, v in HEX.items():
        src = re.sub(re.escape(k) + r'(?![0-9A-Fa-f])', v, src, flags=re.I)
    return src

for path in sys.argv[1:]:
    s = open(path).read()
    t = convert(s)
    if t != s:
        open(path, 'w').write(t)
        print('converted', path)
