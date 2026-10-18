#!/usr/bin/env python3
"""
Nelly Creative Studios - one-shot SEO clean-up.  Run from the site's root folder:

    python3 seo-fix.py --dry     # preview only, changes nothing
    python3 seo-fix.py           # apply

Safe to run more than once (a second run changes nothing).  Everything it does is
an ordinary file edit, so `git diff` shows it all and `git checkout .` undoes it.

What it does
  1. Canonical / og:url / structured-data / sitemap URLs: removes ".html" so they match the
     pretty URLs Cloudflare actually serves (and "/index.html" -> "/").
  2. Images: re-compresses very heavy JPGs (same file name, so nothing else changes) and adds
     missing alt text.
  3. Titles over 65 characters and descriptions over 160 are shortened (every change is listed
     in seo-report.csv so you can review or tweak the wording).
  4. Product structured data: adds itemCondition (New) to offers that lack it, and lists any
     product still missing price / image so you can decide.  No prices are invented.
  5. About and Bespoke pages get a real <h1> (same look as before).
  6. Removed products: 301 redirects for pages deleted earlier (from git history), sitemap
     cleaned of pages that no longer exist / are noindex / point their canonical elsewhere,
     and any live page missing from the sitemap is added.
"""
import csv, datetime, glob, json, os, re, subprocess, sys

DRY = '--dry' in sys.argv
ROOT = os.getcwd()
DOMAIN = 'https://nellycreativestudios.com'
SKIP_DIRS = ('nelly-site/', 'netlify/', 'node_modules/', 'functions/', '.git/')
SKIP_PAGES = {'pages/event-uploads.html'}
TODAY = datetime.date.today().isoformat()

report_rows = []          # (area, file, before, after)
summary = {}


def bump(key, n=1):
    summary[key] = summary.get(key, 0) + n


def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()


def write(p, s):
    if not DRY:
        with open(p, 'w', encoding='utf-8', newline='') as f:
            f.write(s)


def pages():
    out = []
    for f in sorted(glob.glob('**/*.html', recursive=True)):
        f = f.replace(os.sep, '/')
        if f.startswith(SKIP_DIRS) or f in SKIP_PAGES:
            continue
        out.append(f)
    return out


PAGES = pages()
SRC = {f: read(f) for f in PAGES}
ORIG = dict(SRC)


def pretty(url_path):
    """/pages/x.html -> /pages/x ; /index.html -> / ; /pages/y/index.html -> /pages/y/"""
    if url_path.endswith('/index.html'):
        return url_path[:-len('index.html')]
    if url_path.endswith('.html'):
        return url_path[:-5]
    return url_path


# --------------------------------------------------------------------------- 1. URLs
LOC_RE = re.compile(re.escape(DOMAIN) + r'(/[^\s"\'<>#?]*?\.html)(?=["\'<\s,#?])')


def fix_urls_in(text):
    return LOC_RE.sub(lambda m: DOMAIN + pretty(m.group(1)), text)


TAG_RE = re.compile(r'<link\b[^>]*rel=["\']canonical["\'][^>]*>|<meta\b[^>]*property=["\']og:url["\'][^>]*>|<link\b[^>]*hreflang[^>]*>', re.I)
LD_RE = re.compile(r'(<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>)(.*?)(</script>)', re.S | re.I)

for f in PAGES:
    s = SRC[f]
    s = TAG_RE.sub(lambda m: fix_urls_in(m.group(0)), s)
    s = LD_RE.sub(lambda m: m.group(1) + fix_urls_in(m.group(2)) + m.group(3), s)
    if s != SRC[f]:
        bump('1. pages with .html removed from canonical / og:url / structured data')
        SRC[f] = s

# --------------------------------------------------------------------------- 3. titles / descriptions
BRAND = 'Nelly Creative Studios'
TITLE_RE = re.compile(r'<title>(.*?)</title>', re.S)
DESC_RE = re.compile(r'(<meta\s+name=["\']description["\']\s+content=")(.*?)(")', re.S)


def short_title(t):
    t = re.sub(r'\s+', ' ', t).strip()
    if len(t) <= 65:
        return t
    body = t
    m = re.match(r'^(.*?)\s*[—|–-]\s*' + re.escape(BRAND) + r'$', t)
    if m:
        body = m.group(1).strip()
    body = re.sub(r'\s*[—–-]\s*The Jewelry Journal$', '', body).strip()
    journal = 'The Jewelry Journal' in t
    candidate = (body + ' | ' + BRAND) if journal else (body + ' | ' + BRAND)
    if len(candidate) <= 65:
        return candidate
    if len(body) <= 65:
        return body                       # brand is still shown by Google as the site name
    # body itself is too long: cut at the last natural break that leaves a readable title
    best = None
    for sep in (' — ', ' – ', ': ', ', ', ' with ', ' and ', ' in '):
        i = body.rfind(sep, 0, 66)
        if i >= 28 and (best is None or i > best):
            best = i
    if best is not None:
        return body[:best].rstrip(' ,:—–')
    cut = body[:62].rsplit(' ', 1)[0]
    return cut.rstrip(' ,:—–')


def short_desc(d):
    d = re.sub(r'\s+', ' ', d).strip()
    if len(d) <= 160:
        return d
    # prefer ending on a full sentence
    best = -1
    for m in re.finditer(r'[.!?](?=\s|$)', d[:160]):
        best = m.end()
    if best >= 70:
        return d[:best].strip()
    cut = d[:157].rsplit(' ', 1)[0].rstrip(' ,;:—–-')
    return cut + '…'


for f in PAGES:
    s = SRC[f]
    m = TITLE_RE.search(s)
    if m:
        new = short_title(m.group(1))
        if new != re.sub(r'\s+', ' ', m.group(1)).strip():
            s = s[:m.start(1)] + new + s[m.end(1):]
            report_rows.append(('title', f, m.group(1).strip(), new))
            bump('3. titles shortened')
    m = DESC_RE.search(s)
    if m:
        new = short_desc(m.group(2))
        if new != re.sub(r'\s+', ' ', m.group(2)).strip():
            old = m.group(2)
            s = s[:m.start(2)] + new + s[m.end(2):]
            # keep og/twitter descriptions in step only if they were identical copies
            s = s.replace('content="%s"' % old, 'content="%s"' % new)
            report_rows.append(('description', f, old.strip(), new))
            bump('3. descriptions shortened')
    else:
        report_rows.append(('description MISSING', f, '', ''))
        bump('3. pages with no meta description (listed in report csv, nothing invented)')
    SRC[f] = s

# --------------------------------------------------------------------------- 4. product structured data
ld_notes = []
for f in PAGES:
    if not f.startswith('pages/products/'):
        continue
    s = SRC[f]

    def fix_block(m):
        raw = m.group(2)
        try:
            data = json.loads(raw)
        except Exception:
            ld_notes.append((f, 'could not parse a structured-data block - left alone'))
            return m.group(0)
        changed = False
        items = data if isinstance(data, list) else [data]
        for it in items:
            if not isinstance(it, dict) or it.get('@type') != 'Product':
                continue
            off = it.get('offers')
            for o in (off if isinstance(off, list) else [off]):
                if isinstance(o, dict) and 'itemCondition' not in o:
                    o['itemCondition'] = 'https://schema.org/NewCondition'
                    changed = True
            if not it.get('image'):
                ld_notes.append((f, 'Product has no image in structured data'))
            if not isinstance(off, (dict, list)):
                ld_notes.append((f, 'no offers (inquiry-only) - no price added'))
            elif not any(isinstance(o, dict) and o.get('price') for o in (off if isinstance(off, list) else [off])):
                ld_notes.append((f, 'offers has no price - inquiry-only, no price added'))
        if not changed:
            return m.group(0)
        # insert the line as plain text so the rest of the block (and the diff) stays untouched
        fixed, n = re.subn(r'("@type"\s*:\s*"Offer"\s*,)(\s*)(?!"itemCondition")',
                           lambda mm: mm.group(1) + mm.group(2) + '"itemCondition": "https://schema.org/NewCondition",' + mm.group(2), raw)
        try:
            json.loads(fixed)
        except Exception:
            ld_notes.append((f, 'itemCondition not added - block shape unusual'))
            return m.group(0)
        bump('4. product pages given itemCondition')
        return m.group(1) + fixed + m.group(3)

    SRC[f] = LD_RE.sub(fix_block, s)

# --------------------------------------------------------------------------- 5. h1 on About / Bespoke
for f, cls, text in (('pages/about.html', 'about-editorial', 'About'), ('pages/bespoke.html', 'bespoke-editorial', 'Bespoke Jewelry')):
    if f not in SRC:
        continue
    s = SRC[f]
    if '<h1' not in s:
        s2 = s.replace('<h3>%s</h3>' % text, '<h1>%s</h1>' % text, 1)
        s2 = s2.replace('.%s h3 {' % cls, '.%s h1,\n    .%s h3 {' % (cls, cls), 1)
        if s2 != s:
            SRC[f] = s2
            bump('5. pages given an h1')

# --------------------------------------------------------------------------- 2. alt text
IMG_RE = re.compile(r'<img\b[^>]*>', re.I)


def page_name(f, s):
    m = re.search(r'<h1[^>]*>(.*?)</h1>', s, re.S)
    t = TITLE_RE.search(s)
    name = re.sub(r'<[^>]+>', '', m.group(1)) if m else (t.group(1) if t else os.path.basename(f))
    name = re.sub(r'\s*[—|–-]\s*(The Jewelry Journal\s*\|\s*)?' + re.escape(BRAND) + r'$', '', name)
    return re.sub(r'\s+', ' ', name).strip()


for f in PAGES:
    s = SRC[f]
    name = page_name(f, s)
    counter = [0]

    def add_alt(m):
        tag = m.group(0)
        am = re.search(r'\balt=("|\')(.*?)\1', tag, re.S)
        if am:
            return tag   # alt="" is valid for decorative images; only add when missing entirely
        src = (re.search(r'\bsrc=["\']([^"\']*)', tag) or [None, ''])[1]
        if 'logo' in src.lower():
            alt = BRAND
        else:
            counter[0] += 1
            alt = name if counter[0] == 1 else '%s - view %d' % (name, counter[0])
        alt = alt.replace('"', '&quot;')
        bump('2. images given alt text')
        if am:
            return tag.replace(am.group(0), 'alt="%s"' % alt, 1)
        return re.sub(r'\s*/?>$', lambda e: ' alt="%s"%s' % (alt, e.group(0).strip()[:0] + (' />' if e.group(0).strip().startswith('/') else '>')), tag, 1)

    SRC[f] = IMG_RE.sub(add_alt, s)

# images: recompress heavy JPGs in place
try:
    from PIL import Image, ImageOps
except ImportError:
    Image = None
    print('NOTE: Pillow not installed - skipping image compression.  Run:  pip3 install pillow   then run this again.')

if Image:
    before = after = 0
    for p in sorted(glob.glob('images/**/*.jp*g', recursive=True)):
        size = os.path.getsize(p)
        if size < 400 * 1024:
            continue
        try:
            im = Image.open(p)
            icc = im.info.get('icc_profile')
            im = ImageOps.exif_transpose(im)
            if im.mode not in ('RGB', 'L'):
                im = im.convert('RGB')
            im.thumbnail((1800, 1800), Image.LANCZOS)
            tmp = p + '.tmp'
            kw = dict(format='JPEG', quality=82, optimize=True, progressive=True)
            if icc:
                kw['icc_profile'] = icc
            im.save(tmp, **kw)
            new = os.path.getsize(tmp)
            if new <= size * 0.85:
                before += size
                after += new
                bump('2. heavy images recompressed')
                if not DRY:
                    os.replace(tmp, p)
                else:
                    os.remove(tmp)
            else:
                os.remove(tmp)
        except Exception as e:
            print('skip image', p, e)
            if os.path.exists(p + '.tmp'):
                os.remove(p + '.tmp')
    if before:
        summary['2. image bytes saved (MB)'] = round((before - after) / 1048576, 1)

# --------------------------------------------------------------------------- write pages
for f in PAGES:
    if SRC[f] != ORIG[f]:
        write(f, SRC[f])

# --------------------------------------------------------------------------- 6. redirects + sitemap
live = {f for f in PAGES}


def git(*a):
    try:
        return subprocess.run(['git'] + list(a), capture_output=True, text=True, check=True).stdout
    except Exception:
        return ''


deleted = set()
for line in git('log', '--diff-filter=D', '--name-only', '--pretty=format:').splitlines():
    line = line.strip()
    if line.startswith('pages/products/') and line.endswith('.html') and line not in live and not os.path.exists(line):
        deleted.add(line)

red_path = '_redirects'
red = read(red_path) if os.path.exists(red_path) else ''
have_src = {ln.split()[0] for ln in red.splitlines() if ln.strip() and not ln.strip().startswith('#')}
new_lines = []
for d in sorted(deleted):
    target = '/pages/boutique'
    for ln in red.splitlines():
        parts = ln.split()
        if len(parts) >= 2 and parts[0] == '/' + d:
            target = pretty(parts[1])
    for src in ('/' + d, '/' + d[:-5]):
        if src not in have_src:
            new_lines.append('%s %s 301' % (src, target))
if new_lines:
    bump('6. redirects added for removed products', len(new_lines) // 2)
    if not red.endswith('\n') and red:
        red += '\n'
    red += '\n# Removed products -> boutique (added by seo-fix.py)\n' + '\n'.join(new_lines) + '\n'
    write(red_path, red)

# sitemap
sm_path = 'sitemap.xml'
sm = read(sm_path)
entry_re = re.compile(r'[ \t]*<url>\s*<loc>(.*?)</loc>.*?</url>[ \t]*\n?', re.S)


def url_to_file(u):
    p = u[len(DOMAIN):] if u.startswith(DOMAIN) else u
    if p.endswith('/'):
        p += 'index.html'
    elif not p.endswith('.html'):
        p += '.html'
    return p.lstrip('/')


def indexable(f):
    s = SRC.get(f, '')
    if re.search(r'<meta[^>]+name=["\']robots["\'][^>]*noindex', s, re.I):
        return False
    c = re.search(r'<link[^>]+rel=["\']canonical["\'][^>]*href=["\']([^"\']+)', s, re.I)
    if c:
        want = DOMAIN + '/' + f
        if pretty(c.group(1)) != pretty(want) and pretty(c.group(1)) != DOMAIN + '/' + pretty(f).lstrip('/') and not (f == 'index.html' and c.group(1).rstrip('/') == DOMAIN):
            return False
    return True


kept = set()
removed = []


def fix_entry(m):
    u = m.group(1).strip()
    f = url_to_file(u)
    new_u = DOMAIN + pretty('/' + f) if f != 'index.html' else DOMAIN + '/'
    if f not in live or not indexable(f):
        removed.append(u)
        return ''
    kept.add(f)
    return m.group(0).replace('<loc>%s</loc>' % m.group(1), '<loc>%s</loc>' % new_u)


sm2 = entry_re.sub(fix_entry, sm)
added = []
for f in PAGES:
    if f in kept or not indexable(f):
        continue
    u = DOMAIN + '/' if f == 'index.html' else DOMAIN + pretty('/' + f)
    pr = '0.8' if f.startswith('pages/products/') else '0.6'
    added.append('  <url><loc>%s</loc><lastmod>%s</lastmod><priority>%s</priority><changefreq>monthly</changefreq></url>\n' % (u, TODAY, pr))
if added:
    sm2 = sm2.replace('</urlset>', ''.join(added) + '</urlset>')
if removed:
    bump('6. sitemap entries removed (page gone, noindex or duplicate)', len(removed))
if added:
    bump('6. sitemap entries added (live pages that were missing)', len(added))
if sm2 != sm:
    if not removed and not added:
        bump('1. sitemap rewritten with pretty URLs')
    else:
        bump('1. sitemap rewritten with pretty URLs')
    write(sm_path, sm2)

# --------------------------------------------------------------------------- h1 audit (report only)
for f in PAGES:
    n = len(re.findall(r'<h1\b', SRC[f]))
    if n != 1:
        report_rows.append(('h1 count = %d' % n, f, '', ''))

# --------------------------------------------------------------------------- report
if not DRY:
    report_name = 'seo-report-%s.csv' % datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    with open(report_name, 'w', newline='', encoding='utf-8') as fh:
        w = csv.writer(fh)
        w.writerow(['area', 'file', 'before', 'after'])
        w.writerows(report_rows)
        for f, note in ld_notes:
            w.writerow(['structured data', f, note, ''])
        for u in removed:
            w.writerow(['sitemap removed', u, '', ''])

print('\n=== %s ===' % ('DRY RUN - nothing written' if DRY else 'DONE'))
if not summary:
    print('Nothing to change - already up to date.')
for k in sorted(summary):
    print('  %-75s %s' % (k, summary[k]))
print('  Product pages with structured-data notes (see the report csv): %d' % len({f for f, _ in ld_notes}))
if not DRY:
    print('\nReview list written to ' + report_name)
print('Next: git diff --stat | tail -3')
