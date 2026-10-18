#!/usr/bin/env python3
"""
Take a sold / discontinued product off the site cleanly.  Run from the site's root folder:

    python3 retire-product.py <product-slug> [--to <other-product-slug>] [--dry]

Does: deletes pages/products/<slug>.html, removes its card from pages/boutique.html, removes it from
sitemap.xml, adds a 301 redirect (to the boutique, or to --to), and lists any other pages that still link to it.
Example:  python3 retire-product.py gold-angel-necklace-granulation --to gold-angel-necklace-granulation-new
"""
import os, re, sys, glob

args = [a for a in sys.argv[1:] if not a.startswith('--')]
DRY = '--dry' in sys.argv
if not args:
    sys.exit(__doc__)
slug = args[0].replace('.html', '').split('/')[-1]
to = None
if '--to' in sys.argv:
    to = sys.argv[sys.argv.index('--to') + 1].replace('.html', '').split('/')[-1]
page = 'pages/products/%s.html' % slug
if not os.path.exists(page):
    sys.exit('No such product page: ' + page)
if to and not os.path.exists('pages/products/%s.html' % to):
    sys.exit('Redirect target page not found: pages/products/%s.html' % to)


def rd(p):
    return open(p, encoding='utf-8').read()


def wr(p, s):
    if not DRY:
        open(p, 'w', encoding='utf-8', newline='').write(s)


# 1. boutique card (balanced <div> removal)
bp = 'pages/boutique.html'
b = rd(bp)
removed_card = False
m = re.search(r'href="products/%s\.html"' % re.escape(slug), b)
while m:
    start = b.rfind('<div class="product-card', 0, m.start())
    if start < 0:
        break
    depth, i = 0, start
    for t in re.finditer(r'<div\b|</div>', b[start:]):
        depth += 1 if t.group(0) == '<div' else -1
        if depth == 0:
            i = start + t.end()
            break
    while i < len(b) and b[i] in ' \t':
        i += 1
    if i < len(b) and b[i] == '\n':
        i += 1
    ls = b.rfind('\n', 0, start) + 1
    if b[ls:start].strip() == '':
        start = ls
    b = b[:start] + b[i:]
    removed_card = True
    m = re.search(r'href="products/%s\.html"' % re.escape(slug), b)
if removed_card:
    wr(bp, b)

# 2. sitemap
sm = rd('sitemap.xml')
sm2 = re.sub(r'[ \t]*<url>\s*<loc>[^<]*/%s(?:\.html)?</loc>.*?</url>[ \t]*\n?' % re.escape(slug), '', sm, flags=re.S)
if sm2 != sm:
    wr('sitemap.xml', sm2)

# 3. redirect
target = '/pages/products/%s' % to if to else '/pages/boutique'
red = rd('_redirects') if os.path.exists('_redirects') else ''
have = {l.split()[0] for l in red.splitlines() if l.strip() and not l.startswith('#')}
add = ['%s %s 301' % (s, target) for s in ('/pages/products/%s.html' % slug, '/pages/products/%s' % slug) if s not in have]
if add:
    wr('_redirects', red + ('' if red.endswith('\n') or not red else '\n') + '\n'.join(add) + '\n')

# 4. delete page
if not DRY:
    os.remove(page)

# 5. leftovers
left = []
for f in glob.glob('**/*.html', recursive=True):
    if f.startswith(('nelly-site/', 'netlify/', 'node_modules/')) or f == page:
        continue
    if re.search(r'products/%s(\.html)?[\"\'#?]' % re.escape(slug), rd(f)):
        left.append(f)
print(('[dry run] ' if DRY else '') + 'Retired %s -> %s' % (slug, target))
print('  boutique card removed:', removed_card, '| sitemap entry removed:', sm2 != sm, '| redirects added:', len(add))
if left:
    print('  Still linked from (edit by hand):')
    for f in left:
        print('   ', f)
print('Product photos in /images were left alone.')
