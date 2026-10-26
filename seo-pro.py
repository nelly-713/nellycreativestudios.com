#!/usr/bin/env python3
"""
Nelly Creative Studios - advanced SEO pass.  Run from the website root (after the earlier fix scripts):

    python3 seo-pro.py --dry     # preview
    python3 seo-pro.py           # apply (safe to re-run)

 A. Internal links point straight at the real URLs (no .html), so visitors and Google skip a redirect on every click.
 B. sitemap.xml: honest last-modified dates (from git history) + image entries for Google Images.
 C. Boutique page: replaces its broken product-list data with a valid ItemList of every piece.
 D. Robots tag allows large image previews and full snippets (Google Search, Discover, AI answers).
 E. Real 404 page (unknown addresses stop returning the homepage), and the product 'Share' links
    (/boutique/p/...) now open the actual product instead of the homepage.
 F. Faster repeat visits: long cache headers for images/CSS/JS.
 G. Product data: adds material + category to each product's structured data.
"""
import datetime, glob, html, json, os, posixpath, re, subprocess, sys
from urllib.parse import quote

DRY = '--dry' in sys.argv
DOMAIN = 'https://nellycreativestudios.com'
SKIP = ('nelly-site/', 'netlify/', 'node_modules/', 'functions/')
LD = re.compile(r'(<script\b[^>]*application/ld\+json[^>]*>)(.*?)(</script>)', re.S | re.I)
stats = {}


def bump(k, n=1):
    stats[k] = stats.get(k, 0) + n


def rd(p):
    return open(p, encoding='utf-8').read()


def wr(p, s):
    if not DRY:
        open(p, 'w', encoding='utf-8', newline='').write(s)


pages = [f.replace(os.sep, '/') for f in sorted(glob.glob('**/*.html', recursive=True)) if not f.replace(os.sep, '/').startswith(SKIP)]
pages = [f for f in pages if f != '404.html']
src = {f: rd(f) for f in pages}
orig = dict(src)

# ------------------------------------------------------------------ A. internal links without .html
HREF = re.compile(r'(<a\b[^>]*?\bhref=")([^"]+?)(\.html)((?:[?#][^"]*)?)(")', re.I)


def pretty_href(m):
    pre, path, _, tail, q = m.groups()
    if re.match(r'(?i)(https?:|mailto:|tel:|//|javascript:)', path):
        return m.group(0)
    if posixpath.basename(path) == 'index':
        path = path[:-len('index')] or './'
        if path in ('./', '../') and False:
            pass
        bump('A. index links')
        return pre + (path if path else './') + tail + q
    bump('A. internal links shortened')
    return pre + path + tail + q


for f in pages:
    if f.startswith('pages/event-uploads'):
        continue
    src[f] = HREF.sub(pretty_href, src[f])

# ------------------------------------------------------------------ D. robots meta
for f in pages:
    s = src[f]
    new = re.sub(r'(<meta name="robots" content=")index, follow(")', r'\1index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1\2', s)
    if new != s:
        src[f] = new
        bump('D. pages allowing large previews')

# robots tag on pages that have none; private pages get noindex
PRIVATE = ('pages/checkout.html', 'pages/checkout-success.html', 'pages/success.html', 'pages/event-uploads.html')
for f in pages:
    s = src[f]
    if re.search(r'<meta name="robots"', s, re.I) or f in ('pages/event-uploads.html',):
        continue
    tag = ('<meta name="robots" content="noindex, nofollow">' if f in PRIVATE else
           '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">')
    new = re.sub(r'(<meta name="viewport"[^>]*>)', lambda m: m.group(1) + '\n  ' + tag, s, 1)
    if new != s:
        src[f] = new
        bump('D. pages given a robots tag')

# logo image alt should be the brand, not a product description
LOGO = re.compile(r'(<img\b[^>]*?)\balt="[^"]*"([^>]*class="nav-logo-img[^>]*>)')
for f in pages:
    new = LOGO.sub(lambda m: m.group(1) + 'alt="Nelly Creative Studios"' + m.group(2), src[f])
    new = re.sub(r'(<img\b[^>]*class="nav-logo-img[^>]*?)\balt="[^"]*"', r'\1alt="Nelly Creative Studios"', new)
    if new != src[f]:
        src[f] = new
        bump('D. logo alt text corrected')

if os.path.exists('js/cart.js'):
    cj = rd('js/cart.js')
    cj2 = cj.replace("/pages/boutique.html", "/pages/boutique").replace("/pages/checkout.html?", "/pages/checkout?")
    if cj2 != cj:
        wr('js/cart.js', cj2); bump('A. cart links shortened')

# ------------------------------------------------------------------ E. share links
for f in pages:
    s = src[f]
    new = re.sub(re.escape(DOMAIN) + r'/boutique/p/([a-z0-9\-]+)', DOMAIN + r'/pages/products/\1', s)
    if new != s:
        src[f] = new
        bump('E. product share links fixed')

# ------------------------------------------------------------------ G. product material / category
CAT = {'earrings': 'Earrings', 'necklace': 'Necklaces', 'bracelet': 'Bracelets', 'ring': 'Rings', 'brooch': 'Brooches & Lapel Pins'}
for f in pages:
    if not f.startswith('pages/products/'):
        continue
    s = src[f]
    mm = re.search(r'pdp-details-key">Metal</span><span class="pdp-details-val">([^<]+)<', s)
    tt = re.search(r'pdp-details-key">Type</span><span class="pdp-details-val">([^<]+)<', s)
    add = []
    if mm and '"material"' not in s:
        add.append('"material": "%s"' % html.unescape(mm.group(1)).strip().replace('"', "'"))
    if tt and '"category"' not in s:
        t = html.unescape(tt.group(1)).strip().lower().rstrip('s')
        key = next((k for k in CAT if t.startswith(k.rstrip('s'))), None)
        if key:
            add.append('"category": "Apparel & Accessories > Jewelry > %s"' % CAT[key])
    if not add:
        continue
    def put(m):
        raw = m.group(2)
        if '"@type": "Product"' not in raw and '"@type":"Product"' not in raw:
            return m.group(0)
        fixed = re.sub(r'("@type"\s*:\s*"Product"\s*,)(\s*)', lambda x: x.group(1) + x.group(2) + (',' + x.group(2)).join(add) + ',' + x.group(2), raw, count=1)
        try:
            json.loads(fixed)
        except Exception:
            return m.group(0)
        return m.group(1) + fixed + m.group(3)
    new = LD.sub(put, s)
    if new != s:
        src[f] = new
        bump('G. products given material/category')

# ------------------------------------------------------------------ C. boutique ItemList
bp = 'pages/boutique.html'
if bp in src:
    s = src[bp]
    cards = []
    for m in re.finditer(r'<div class="product-card product-item".*?<div class="product-actions">', s, re.S):
        c = m.group(0)
        link = re.search(r'href="(?:\.\./)?(?:pages/)?products/([a-z0-9\-]+)(?:\.html)?"', c)
        name = re.search(r'product-name">(.*?)</div>', c, re.S)
        img = re.search(r'<img[^>]*\bsrc="([^"]+)"', c)
        if link and name:
            cards.append((link.group(1), html.unescape(re.sub(r'<[^>]+>', '', name.group(1))).strip(), img.group(1) if img else ''))
    if cards:
        items = []
        for i, (slug, name, im) in enumerate(cards, 1):
            it = {'@type': 'ListItem', 'position': i, 'url': '%s/pages/products/%s' % (DOMAIN, slug), 'name': name}
            if im:
                it['image'] = DOMAIN + '/' + posixpath.normpath(im.replace('../', '')).lstrip('/')
            items.append(it)
        data = {'@context': 'https://schema.org', '@type': 'ItemList', 'name': 'Nelly Creative Studios Fine Jewelry Boutique',
                'url': DOMAIN + '/pages/boutique', 'numberOfItems': len(items), 'itemListElement': items}
        block = '<script type="application/ld+json">\n' + json.dumps(data, indent=2, ensure_ascii=False) + '\n</script>'
        found = False
        def swap(m):
            global found
            if '"ItemList"' in m.group(2):
                found = True
                return block
            return m.group(0)
        new = LD.sub(swap, s)
        if not found:
            new = s.replace('</head>', block + '\n</head>', 1)
        if new != s:
            src[bp] = new
            bump('C. boutique ItemList rebuilt (pieces listed)', len(items))

# ------------------------------------------------------------------ write pages
for f in pages:
    if src[f] != orig[f]:
        wr(f, src[f])

# ------------------------------------------------------------------ B. sitemap with lastmod + images
def git_date(f):
    try:
        out = subprocess.run(['git', 'log', '-1', '--format=%cs', '--', f], capture_output=True, text=True).stdout.strip()
        return out or datetime.date.today().isoformat()
    except Exception:
        return datetime.date.today().isoformat()


def images_of(f):
    s = src.get(f, '')
    urls = []
    for m in LD.finditer(s):
        try:
            d = json.loads(m.group(2))
        except Exception:
            continue
        for it in (d if isinstance(d, list) else [d]):
            if isinstance(it, dict) and it.get('@type') in ('Product', 'BlogPosting', 'Article'):
                im = it.get('image')
                for u in (im if isinstance(im, list) else [im]):
                    if isinstance(u, str) and u.startswith('http'):
                        urls.append(u)
                    elif isinstance(u, dict) and str(u.get('url', '')).startswith('http'):
                        urls.append(u['url'])
    og = re.search(r'property="og:image"\s+content="([^"]+)"', s)
    if og:
        urls.append(og.group(1))
    out = []
    for u in urls:
        if u.startswith(DOMAIN + '/images/') and os.path.isfile(u[len(DOMAIN) + 1:]) and u not in out:
            out.append(u)
    return out[:8]


def file_for(u):
    p = u[len(DOMAIN):] if u.startswith(DOMAIN) else u
    p = p.lstrip('/')
    if p == '':
        return 'index.html'
    return p if p.endswith('.html') else p + '.html'


sm = rd('sitemap.xml')
alt_name = {}
entries = re.findall(r'<url>.*?</url>', sm, re.S)
new_entries = []
for e in entries:
    loc = re.search(r'<loc>(.*?)</loc>', e).group(1)
    f = file_for(loc)
    if f not in src:
        new_entries.append(e); continue
    pr = re.search(r'<priority>(.*?)</priority>', e); cf = re.search(r'<changefreq>(.*?)</changefreq>', e)
    imgs = images_of(f)
    x = '  <url>\n    <loc>%s</loc>\n    <lastmod>%s</lastmod>\n' % (loc, git_date(f))
    if cf: x += '    <changefreq>%s</changefreq>\n' % cf.group(1)
    if pr: x += '    <priority>%s</priority>\n' % pr.group(1)
    for u in imgs:
        x += '    <image:image><image:loc>%s</image:loc></image:image>\n' % html.escape(u)
    x += '  </url>'
    new_entries.append(x)
    if imgs: bump('B. sitemap image entries', len(imgs))
sm2 = ('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
       'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' + '\n'.join(new_entries) + '\n</urlset>\n')
if sm2 != sm:
    wr('sitemap.xml', sm2); bump('B. sitemap rewritten (lastmod + images)')

# ------------------------------------------------------------------ E. 404 page + redirect for old share links
page404 = '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page not found | Nelly Creative Studios</title>
  <meta name="robots" content="noindex, follow">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,400;1,400&family=Jost:wght@300;400&display=swap" rel="stylesheet">
  <style>
    body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#FAFAF8;color:#1B2A4A;font-family:'Jost',sans-serif;text-align:center;padding:2rem}
    .box{max-width:560px}
    h1{font-family:'Bodoni Moda',serif;font-style:italic;font-weight:400;font-size:clamp(2rem,5vw,3rem);color:#B8962E;margin:0 0 1rem}
    p{line-height:1.8;margin:0 0 2rem}
    a.btn{display:inline-block;margin:.4rem;padding:.9rem 1.8rem;border:1px solid #1B2A4A;color:#1B2A4A;text-decoration:none;font-size:.7rem;letter-spacing:.24em;text-transform:uppercase}
    a.btn:hover{background:#1B2A4A;color:#fff}
  </style>
</head>
<body>
  <div class="box">
    <h1>This page has moved on.</h1>
    <p>The piece or page you were looking for is no longer here. It may have found its new owner.</p>
    <a class="btn" href="/pages/boutique">The Boutique</a>
    <a class="btn" href="/pages/bespoke">Bespoke</a>
    <a class="btn" href="/">Home</a>
  </div>
</body>
</html>
'''
if not os.path.exists('404.html'):
    wr('404.html', page404); bump('E. 404.html created')

red = rd('_redirects') if os.path.exists('_redirects') else ''
rule = '/boutique/p/:slug /pages/products/:slug 301'
if rule not in red:
    wr('_redirects', red + ('' if red.endswith('\n') or not red else '\n') + '# Old share links\n' + rule + '\n'); bump('E. share-link redirect added')

# ------------------------------------------------------------------ F. cache headers
hd = rd('_headers') if os.path.exists('_headers') else ''
if '# CACHE (seo-pro)' not in hd:
    add = '''
# CACHE (seo-pro): repeat visits load from the browser cache
/images/*
  Cache-Control: public, max-age=2592000, stale-while-revalidate=86400

/css/*
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800

/js/*
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800
'''
    wr('_headers', hd.rstrip('\n') + '\n' + add); bump('F. cache headers added')

print('\n=== %s ===' % ('DRY RUN - nothing written' if DRY else 'DONE'))
if not stats: print('Nothing to change.')
for k in sorted(stats): print('  %-60s %s' % (k, stats[k]))
