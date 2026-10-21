#!/usr/bin/env python3
"""Finds image references that point to a missing file and fixes the ones where the same name exists
with a different extension (e.g. .png -> .jpg). Lists anything it cannot fix. Run from the site root."""
import glob, os, re
EXT = ('.png', '.jpg', '.jpeg', '.webp')
files = [f for f in glob.glob('**/*', recursive=True)
         if f.endswith(('.html', '.js', '.css', '.json')) and not f.startswith(('nelly-site/', 'netlify/', 'node_modules/', 'functions/'))]
ref = re.compile(r'((?:\.\./|\./|/|https://nellycreativestudios\.com/)*images/[A-Za-z0-9_\-./]+?)(\.png|\.jpg|\.jpeg|\.webp)(?![A-Za-z0-9])')
fixed, unfixed = {}, {}
for f in files:
    s = open(f, encoding='utf-8', errors='ignore').read()
    def sub(m):
        base, ext = m.group(1), m.group(2)
        name = re.sub(r'^(?:\.\./|\./|/|https://nellycreativestudios\.com/)*', '', base) + ext
        if os.path.exists(name):
            return m.group(0)
        for e in EXT:
            alt = name[:-len(ext)] + e
            if os.path.exists(alt):
                fixed[(name, alt)] = fixed.get((name, alt), 0) + 1
                return base + e
        unfixed[name] = f
        return m.group(0)
    n = ref.sub(sub, s)
    if n != s:
        open(f, 'w', encoding='utf-8', newline='').write(n)
for (a, b), c in fixed.items():
    print('fixed %-70s -> %s (%d refs)' % (a, os.path.basename(b), c))
for n, f in unfixed.items():
    print('STILL MISSING:', n, '(used in %s)' % f)
if not fixed and not unfixed:
    print('No broken image references found.')
