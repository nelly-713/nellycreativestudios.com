#!/usr/bin/env python3
"""
Makes the site easier for AI search / assistants to read and re-find.  Run from the website root:

    python3 ai-seo.py            # (re)builds llms.txt from your pages - run again whenever you add/remove products
    python3 ai-seo.py --ping     # also tells Bing/Yandex/etc. (via IndexNow) that every page is new/changed

llms.txt = a plain-text, link-rich summary of the site that AI tools can read in one request.
IndexNow = instant notice to Bing, which feeds ChatGPT search, Copilot and others.
"""
import datetime, glob, html, json, os, re, sys, urllib.request, uuid

DOMAIN = 'https://nellycreativestudios.com'
BRAND = 'Nelly Creative Studios'
SKIP = ('nelly-site/', 'netlify/', 'node_modules/', 'functions/')
LD = re.compile(r'<script\b[^>]*application/ld\+json[^>]*>(.*?)</script>', re.S | re.I)


def rd(p):
    return open(p, encoding='utf-8').read()


def meta(s):
    t = re.search(r'<title>(.*?)</title>', s, re.S)
    d = re.search(r'<meta\s+name=["\']description["\']\s+content="(.*?)"', s, re.S)
    t = html.unescape(re.sub(r'\s+', ' ', t.group(1)).strip()) if t else ''
    t = re.sub(r'\s*[—|–-]\s*(The Jewelry Journal\s*\|\s*)?' + re.escape(BRAND) + r'$', '', t)
    t = re.sub(r'\s*[—|–-]\s*The Jewelry Journal$', '', t)
    d = html.unescape(re.sub(r'\s+', ' ', d.group(1)).strip()) if d else ''
    noindex = bool(re.search(r'name=["\']robots["\'][^>]*noindex', s, re.I))
    return t, d, noindex


def price(s):
    for m in LD.finditer(s):
        try:
            data = json.loads(m.group(1))
        except Exception:
            continue
        for it in (data if isinstance(data, list) else [data]):
            if isinstance(it, dict) and it.get('@type') == 'Product':
                offers = it.get('offers')
                for o in (offers if isinstance(offers, list) else [offers]):
                    if isinstance(o, dict) and o.get('price'):
                        try:
                            return '$%s' % format(float(o['price']), ',.0f')
                        except Exception:
                            pass
    return ''


def url(f):
    if f == 'index.html':
        return DOMAIN + '/'
    return DOMAIN + '/' + (f[:-5] if f.endswith('.html') else f)


files = [f.replace(os.sep, '/') for f in sorted(glob.glob('**/*.html', recursive=True))
         if not f.replace(os.sep, '/').startswith(SKIP) and 'event-uploads' not in f]
# only pages listed in the sitemap (so duplicates / noindex pages stay out)
sm = rd('sitemap.xml') if os.path.exists('sitemap.xml') else ''
in_sm = set(re.sub(r'\.html$', '', u) for u in re.findall(r'<loc>(.*?)</loc>', sm))
files = [f for f in files if not in_sm or url(f) in in_sm]

home_t, home_d, _ = meta(rd('index.html'))
core, products, journal = [], [], []
for f in files:
    if f == 'index.html':
        continue
    t, d, ni = meta(rd(f))
    if ni or not t:
        continue
    line = '- [%s](%s)' % (t, url(f))
    if f.startswith('pages/products/'):
        p = price(rd(f))
        products.append('%s%s%s' % (line, (' — ' + p) if p else ' — price on request', (': ' + d) if d else ''))
    elif f.startswith('pages/journal/'):
        journal.append('%s%s' % (line, (': ' + d) if d else ''))
    elif f.startswith('pages/') and f.count('/') == 1 and not re.search(r'checkout|success|confirm', f):
        core.append('%s%s' % (line, (': ' + d) if d else ''))

out = ['# %s' % BRAND, '',
       '> %s' % (home_d or 'Handcrafted fine jewelry, designed and made in New York City.'), '',
       'Fine and custom jewelry studio in New York City. Pieces are handmade in 22k and 18k gold and platinum with natural diamonds and rare gemstones; many are one of a kind, and bespoke commissions are available. Prices are in USD. Contact the studio through the contact page to commission or enquire.', '',
       '## Key pages', ''] + core + ['', '## Jewelry (boutique)', ''] + products
if journal:
    out += ['', '## Journal', ''] + journal
out += ['', '## Optional', '', '- [Sitemap](%s/sitemap.xml)' % DOMAIN, '']
open('llms.txt', 'w', encoding='utf-8', newline='\n').write('\n'.join(out))
print('llms.txt written: %d key pages, %d products, %d journal posts' % (len(core), len(products), len(journal)))

if '--ping' in sys.argv:
    keyfile = next((f for f in glob.glob('*.txt') if re.fullmatch(r'[0-9a-f]{32}\.txt', f)), None)
    if not keyfile:
        keyfile = uuid.uuid4().hex + '.txt'
        open(keyfile, 'w').write(keyfile[:-4])
        print('Created IndexNow key file', keyfile, '- it must be deployed BEFORE pinging.')
        print('Next: git add -A && git commit -m "IndexNow key" && git push, wait a minute, then run:  python3 ai-seo.py --ping')
        sys.exit(0)
    key = keyfile[:-4]
    urls = list(dict.fromkeys(re.findall(r'<loc>(.*?)</loc>', sm))) + [DOMAIN + '/llms.txt']
    body = json.dumps({'host': 'nellycreativestudios.com', 'key': key, 'keyLocation': '%s/%s' % (DOMAIN, keyfile), 'urlList': urls}).encode()
    req = urllib.request.Request('https://api.indexnow.org/indexnow', body, {'Content-Type': 'application/json; charset=utf-8'})
    try:
        r = urllib.request.urlopen(req, timeout=30)
        print('IndexNow accepted %d URLs (HTTP %s)' % (len(urls), r.status))
    except Exception as e:
        print('IndexNow ping failed:', e)
