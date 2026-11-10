#!/usr/bin/env python3
"""Builds the static website into dist/ from products.json. Netlify runs this on every deploy."""
import json, os, shutil, html, datetime
os.chdir(os.path.dirname(os.path.abspath(__file__)))
CFG = json.load(open('config.json', encoding='utf-8')); CFG['site'] = os.environ.get('SITE_URL') or CFG['site']
CFG['owner_email'] = os.environ.get('OWNER_EMAIL') or CFG['owner_email']
if 'sharpalign.com' in CFG['site'] or not CFG['site']: CFG['site'] = 'https://sharpalign.shop'  # the placeholder is not a real domain
if CFG['owner_email'].endswith('@sharpalign.com'): print('WARNING: owner_email is still the placeholder. Set OWNER_EMAIL in Netlify or owner_email in config.json.')
SITE = CFG['site'].rstrip('/')
E = lambda s: html.escape(str(s), quote=True)
INR = lambda n: '₹{:,}'.format(int(n))
load = lambda f, d: json.load(open(f, encoding='utf-8')) if os.path.isfile(f) else d
CAMP = load('campaign.json', {'enabled': False})
BUNDLE = load('bundle.json', {'enabled': False, 'tiers': [], 'max_items': 10})
BUNDLE['tiers'] = sorted(BUNDLE.get('tiers', []), key=lambda t: t['items'])
BUNDLE['enabled'] = bool(BUNDLE.get('multi_discount'))  # percent-off tiers stay OFF unless bundle.json says "multi_discount": true
import re as _re
ADMIN_PATH = str(load('admin.json', {'path': 'admin'}).get('path', 'admin')).strip('/ ')
if not _re.fullmatch(r'[a-z0-9-]{4,40}', ADMIN_PATH): raise SystemExit('admin.json: "path" must be 4-40 lowercase letters, numbers or dashes')
FAV = '<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="apple-touch-icon" href="/apple-touch-icon.png">'
VERIFY = '<meta name="google-site-verification" content="4OWIA6uXwCPAwnlCH-6DOGCC58_7IFrwTYMBWW9ciGA">'
IST = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
_ms = lambda x: int(datetime.datetime.fromisoformat(x).timestamp() * 1000)
_dd = lambda ms: datetime.datetime.fromtimestamp(ms / 1000, tz=IST).strftime('%d %b %Y').lstrip('0')
CP = {'enabled': False}
if CAMP.get('enabled'):
    _t0 = _ms(CAMP['start']); _D = 86400000; _ph = {}
    for _c, _f in CAMP['phases'].items():
        _ph[_c] = dict({'open': _t0 + int(_f['open_day']) * _D, 'end': _t0 + (int(_f['open_day']) + int(_f['days'])) * _D}, **{k: _f[k] for k in ('launch_price', 'discount_pct', 'reward_price', 'reward_pct', 'reward_days', 'waitlist_required') if k in _f})
    _pk = CAMP.get('perks', {})
    CP = {'enabled': True, 'start': _t0, 'unlock_referrals': CAMP['unlock_referrals'], 'phases': _ph, 'perks': _pk, 'min_pay_pct': CAMP.get('min_pay_pct', 30), 'rank_end': _t0 + int(_pk.get('ranking_days', 45)) * _D, 'prizes': CAMP.get('prizes', [])}
CATS = {
 'kids': dict(name='Kid Sharpalign', short='Kids', title='Kids Story Books & ABC Rhymes (PDF) | Kid Sharpalign', meta='Kids story books, ABC rhymes and picture books as instant PDF downloads. Pay with UPI or card and read today.', h1='Story time starts here!', intro='Bedtime stories, ABC rhymes and picture books for little ones. Download the PDF and read together tonight.', emo='', sub='Story books and ABC rhymes', ic='🦊'),
 'cooking': dict(name='Cooking Sharpalign', short='Cooking', title='Easy Cookbooks & Recipe PDFs | Cooking Sharpalign', meta='Easy Indian dinners, tiffin ideas and eggless baking cookbooks as instant PDF downloads.', h1='Today’s menu: easy recipes to download', intro='Quick dinners, tiffin ideas and baking, with shopping lists you can print.', emo='🍳 🥘 🧁 🥗', sub='Easy recipes and meal planners', ic='🍛'),
 'journals': dict(name='Journal Sharpalign', short='Journals', title='Guided Journals & Planners (PDF) | Journal Sharpalign', meta='Manifestation, gratitude and daily planner journals as printable PDF downloads.', h1='Write it down. Make it happen.', intro='Guided journals for gratitude, manifestation and daily reset. Print them or type right in the PDF.', emo='✨ 🌿 ☕ 📓', sub='Gratitude and manifestation', ic='✨'),
 'novels': dict(name='Sharpalign Novels', short='Novels', title='Novels to Read as PDF | Sharpalign Novels', meta='Read our novels as instant PDF downloads on any phone, tablet or computer.', h1='Stories for your next quiet evening', intro='Download a novel as a PDF and read it on any device.', emo='', sub='Novels to read anywhere', ic='📖'),
 'trading': dict(name='Trading Sharpalign', short='Trading', title='Trading Guides & Strategy PDFs for Beginners | Trading Sharpalign', meta='Trading guides as instant PDF downloads: chart reading, risk management and trading journals. Educational content for learners.', h1='Learn to read the market', intro='Clear, practical trading guides on charts, risk and discipline. Download the PDF and study at your own pace.', emo='', sub='Chart reading and risk management', ic='📈'),
}
products = load('products.json', []); reviews = load('reviews.json', [])
EX = {}
try:  # pull products, covers, PDFs list and approved reviews saved in the admin page
    import urllib.request
    if os.environ.get('EXPORT_KEY'):
        base = (os.environ.get('URL') or SITE).rstrip('/')
        EX = json.load(urllib.request.urlopen(urllib.request.Request(base + '/api/export', headers={'x-export-key': os.environ['EXPORT_KEY'], 'User-Agent': 'sharpalign-build'}), timeout=25))
        print('Loaded admin data: %d products, %d reviews' % (len(EX.get('products', [])), len(EX.get('reviews', []))))
except Exception as e:
    print('Admin data not loaded, using files only:', e)
rem = set(EX.get('removed', []))
products = [p for p in products if p['slug'] not in rem]
adm = {p['slug']: p for p in EX.get('products', [])}
products = [adm.pop(p['slug'], p) for p in products] + list(adm.values())
reviews = reviews + EX.get('reviews', [])
pdfs = set(EX.get('pdfs', [])); covs = EX.get('covers', {})
shutil.rmtree('dist', ignore_errors=True); os.makedirs('dist'); shutil.copytree('static', 'dist/assets')
if os.path.isdir('covers'): shutil.copytree('covers', 'dist/covers', ignore=shutil.ignore_patterns('README*'))
os.makedirs('dist/covers', exist_ok=True)
import base64
for sl, data in covs.items(): open('dist/covers/%s.jpg' % sl, 'wb').write(base64.b64decode(data))
for p in products:
    p['pdf'] = os.path.isfile('private-pdfs/%s.pdf' % p['slug']) or p['slug'] in pdfs
    p['img'] = next(('%s.%s' % (p['slug'], x) for x in ('jpg', 'jpeg', 'png', 'webp') if os.path.isfile('dist/covers/%s.%s' % (p['slug'], x))), '')
    p['gallery'] = (EX.get('gallery') or {}).get(p['slug'], [])
    p['sample'] = p['slug'] in set(EX.get('samples', []))
def write(path, s):
    path = os.path.join('dist', path.lstrip('/')); os.makedirs(os.path.dirname(path), exist_ok=True); open(path, 'w', encoding='utf-8').write(s)
# data for the serverless functions
os.makedirs('netlify/functions', exist_ok=True)
open('netlify/functions/_config.mjs', 'w', encoding='utf-8').write('export default ' + json.dumps({'campaign': CP, 'bundle': BUNDLE, 'admin_path': ADMIN_PATH, **{k: CFG[k] for k in ('owner_email', 'from_name', 'ref_commission_pct', 'friend_discount_pct', 'credit_max_pct', 'hold_days', 'link_days', 'max_downloads')}}) + ';\n')
open('netlify/functions/_products.mjs', 'w', encoding='utf-8').write('export default ' + json.dumps({p['slug']: {'title': p['title'], 'price': int(p['price']), 'pdf': p['pdf'], 'cat': p['cat'], 'prices': p.get('prices', {}), 'short': p.get('short', ''), 'emoji': p.get('emoji', '📘'), 'color': p.get('color', '#3b82f6'), 'added': p.get('added', ''), 'img': p['img']} for p in products}, ensure_ascii=False) + ';\n')

stars = lambda n: '★' * int(round(n)) + '☆' * (5 - int(round(n)))
rv = lambda s: [r for r in reviews if r['slug'] == s]
avg = lambda r: sum(x['rating'] for x in r) / len(r) if r else 0
href = lambda p: '/%s/%s/' % (p['cat'], p['slug'])
ldjs = lambda j: '<script type="application/ld+json">' + json.dumps(j, ensure_ascii=False).replace('<', '\\u003c') + '</script>'
FONTS = 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;800&amp;family=Caveat:wght@600;700&amp;family=Caveat+Brush&amp;family=Cormorant+Garamond:wght@500;700&amp;family=Nunito:wght@400;700&amp;family=Space+Grotesk:wght@500;700&amp;display=swap'
CAMPJS = ('<script>window.SA_CAMP=%s</script>' % json.dumps(dict(CP, names={k: c['short'] for k, c in CATS.items()}, rankEndText=_dd(CP['rank_end'])))) if CP['enabled'] else ''
CAMPJS += '<script>window.SA_BUNDLE=%s</script>' % json.dumps(BUNDLE)
def head(title, desc, theme, path='', ld=(), img='', noindex=False):
    u = SITE + '/' + path.lstrip('/')
    nav = ''.join('<a href="/%s/">%s</a>' % (k, E(c['short'])) for k, c in CATS.items())
    return ('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
      + VERIFY + FAV +
      '<title>%s</title><meta name="description" content="%s"><link rel="canonical" href="%s">%s'
      '<meta property="og:title" content="%s"><meta property="og:description" content="%s"><meta property="og:type" content="website"><meta property="og:url" content="%s"><meta property="og:site_name" content="Sharpalign">%s'
      '<link rel="stylesheet" href="%s"><link rel="stylesheet" href="/assets/style.css"><script src="/assets/site.js" defer></script>%s%s</head>'
      '<body class="t-%s"><div class="top"><a class="logo" href="/">Sharpalign</a><nav aria-label="Main">%s</nav></div>') % (
      E(title), E(desc), E(u), '<meta name="robots" content="noindex">' if noindex else '', E(title), E(desc), E(u),
      '<meta property="og:image" content="%s"><meta name="twitter:card" content="summary_large_image">' % E(img) if img else '', FONTS, CAMPJS, ''.join(ldjs(j) for j in ld), theme, nav)
FOOT = '<footer class="foot"><div class="w"><nav><a href="/page/contact/">Contact</a> <a href="/page/refund/">Refund policy</a> <a href="/page/privacy/">Privacy</a> <a href="/page/terms/">Terms</a> <a href="/page/referral/">Referral terms</a> <a href="/refer/">Refer &amp; earn</a> <a href="/leaderboard/">Rewards</a> <a href="/page/rewards/">Rewards terms</a></nav><p>© %d Sharpalign</p></div></footer></body></html>' % datetime.date.today().year
def disc(k): return '<p class="disc"><b>Educational only.</b> These guides teach trading concepts. They are not investment advice or stock tips, and they do not promise profits. Trading carries a risk of loss. Please speak to a SEBI-registered adviser before investing.</p>' if k == 'trading' else ''
def deco(k):
    if k == 'trading': return '<div class="candles" aria-hidden="true">' + ''.join('<i style="height:%dpx;background:%s"></i>' % (h, '#22c55e' if g else '#ef4444') for h, g in [(60,1),(95,0),(75,1),(125,1),(100,0),(150,1),(130,0),(175,1)]) + '</div>'
    if k == 'kids': return '<div class="sun"></div><div class="cloud" style="left:6%;top:50px"></div><div class="cloud" style="left:48%;top:20px;transform:scale(.75)"></div><div class="rainbow"></div>'
    return ''
def cvparts(p):
    if p['img']: return ' img', '<img src="/covers/%s" alt="%s" loading="lazy" width="600" height="800">' % (E(p['img']), E(p.get('alt') or 'Cover of ' + p['title']))
    return '', '%s<small>%s</small>' % (E(p['emoji']), E(p['title']))
def card(p):
    r = rv(p['slug']); cls, inner = cvparts(p)
    s = '<article class="card" data-slug="%s"><a class="cv%s" href="%s" style="background:%s"%s tabindex="-1">%s</a>' % (E(p['slug']), cls, href(p), E(p['color']), '' if p['img'] else ' aria-hidden="true"', inner)
    s += '<h3><a href="%s">%s</a></h3><p>%s</p>' % (href(p), E(p['title']), E(p['short']))
    if r: s += '<div class="rate"><span class="stars" aria-label="%.1f out of 5">%s</span> (%d)</div>' % (avg(r), stars(avg(r)), len(r))
    return s + '<div class="row"><span class="pr" data-cat="%s" data-price="%d">%s</span><a class="buy" href="%s">%s</a></div></article>' % (p['cat'], int(p['price']), INR(p['price']), href(p), 'View PDF' if p['pdf'] else 'Coming soon')

def _ph_text(c, f):
    t = []
    if f.get('launch_price'): t.append('every book %s' % INR(f['launch_price']))
    if f.get('discount_pct'): t.append('%d%% off%s' % (f['discount_pct'], ' for people on the waitlist' if f.get('waitlist_required') else ''))
    if f.get('reward_price') or f.get('reward_pct'): t.append('refer %d friends and get all books for %s for %d days' % (CP['unlock_referrals'], INR(f['reward_price']) if f.get('reward_price') else '%d%% off' % f['reward_pct'], f.get('reward_days', 7)))
    return ', '.join(t)
SCHED = ''
if CP['enabled']:
    _rows = ''.join('<div class="ph" data-cat="%s"><b>%s</b><span>Opens %s%s</span><em class="st"></em></div>' % (c, E(CATS[c]['name']), _dd(f['open']), (' · ' + _ph_text(c, f)) if f['end'] > f['open'] else '') for c, f in sorted(CP['phases'].items(), key=lambda kv: kv[1]['open']) if c in CATS)
    SCHED = '<section class="panel" id="schedule"><h2>Launch schedule</h2><div class="phs">%s</div><p class="note">Every launch offer runs once and will not return. <a href="/leaderboard/">See rewards for top referrers</a></p></section>' % _rows
# ---- home ----
ld = [{'@context': 'https://schema.org', '@type': 'Organization', 'name': 'Sharpalign', 'url': SITE}, {'@context': 'https://schema.org', '@type': 'WebSite', 'name': 'Sharpalign', 'url': SITE}]
tiles = ''.join('<a class="tile %s" href="/%s/"><b>%s</b><span>%s</span><i>%s</i></a>' % (k, k, E(c['name']), E(c['sub']), c['ic']) for k, c in CATS.items())
new = ''.join(card(p) for p in list(reversed(products))[:6])
write('index.html', head('Sharpalign: PDF Story Books, Cookbooks, Journals, Novels & Trading Guides', 'Instant PDF downloads: kids story books and ABC rhymes, easy cookbooks, guided journals, novels and trading guides. Pay with UPI or card.', 'home', '', ld)
  + '<header class="hero"><div class="w"><h1>PDF story books, cookbooks, journals, novels and trading guides</h1><p>Instant downloads for every reader. Pay with UPI or card and get your PDF link by email.</p></div></header><main class="w"><div class="tiles">%s</div>%s<h2 class="tag">New PDFs</h2><div class="grid">%s</div><h2 class="tag">How it works</h2><div class="steps"><div><b>Pick a PDF</b><span>Books, cookbooks, journals, novels and trading guides.</span></div><div><b>Pay securely</b><span>UPI, cards and net banking with Razorpay.</span></div><div><b>Download</b><span>You return to our site and your link opens right after payment.</span></div></div></main>' % (tiles, SCHED, new) + FOOT)

# ---- categories ----
for k, c in CATS.items():
    items = [p for p in products if p['cat'] == k]
    write('%s/index.html' % k, head(c['title'], c['meta'], k, k + '/', [{'@context': 'https://schema.org', '@type': 'CollectionPage', 'name': c['title'], 'description': c['meta'], 'url': '%s/%s/' % (SITE, k)}])
      + '<header class="hero">%s<div class="w"><h1>%s</h1><p>%s</p><a class="cta" href="#shop">See the PDFs</a>%s</div></header><main class="w" id="shop"><div id="soon"></div><h2 class="tag">%s</h2>%s<div class="grid">%s</div>%s</main>' % (
        deco(k), E(c['h1']), E(c['intro']), '<div class="emo" aria-hidden="true">%s</div>' % c['emo'] if c['emo'] else '', E(c['name']), disc(k), ''.join(card(p) for p in items), '' if items else '<p class="panel">New PDFs are coming soon.</p>') + FOOT)

# ---- product pages ----
def desc_html(text):
    lines = [l.strip() for l in str(text or '').split('\n') if l.strip()]; out = []; buf = []
    def flush():
        if buf: out.append('<ul class="cols">%s</ul>' % ''.join('<li>%s</li>' % E(x) for x in buf)); del buf[:]
    for l in lines:
        if len(l) <= 48 and not l.endswith(('.', '!', '?')): buf.append(l)
        else: flush(); out.append('<p>%s</p>' % E(l))
    flush()
    long_ = len(lines) > 8 or len(str(text or '')) > 700
    return '<div class="desc%s" id="desc">%s</div>%s' % (' clamp' if long_ else '', ''.join(out), '<button class="more" data-more="desc" type="button">Read more</button>' if long_ else '')
def default_faq():
    return [('Is this a physical book?', 'No. It is a digital PDF that you download right after payment. Nothing is shipped.'),
            ('How do I get the PDF after paying?', 'After payment you come back to our site and your download opens right away. We also email you the same link, and you can always download the latest version from My Library on your private page.'),
            ('Which devices can I use?', 'Any phone, tablet or computer that can open a PDF. You can also print it for your own use.'),
            ('Which payment methods work?', 'UPI, cards, net banking and wallets through Razorpay.'),
            ('Can I get a refund?', 'Digital files cannot be returned once downloaded. If the file is damaged, or you were charged but did not receive it, email us within 7 days and we will fix it or refund you.')]
def gallery_html(p):
    ids = p.get('gallery') or []
    imgs = ''.join('<img src="/api/img?slug=%s&amp;n=%d" alt="%s" loading="lazy" width="600" height="800">' % (E(p['slug']), n, E('%s: inside page %d' % (p['title'], i + 1))) for i, n in enumerate(ids))
    return '<section class="panel" id="inside"%s><h2>Look inside</h2><div class="gal" id="gal">%s</div></section>' % ('' if ids else ' hidden', imgs)
def faq_html(items):
    return '<section class="panel" id="faq"><h2>Questions</h2>%s</section>' % ''.join('<details><summary>%s</summary><p>%s</p></details>' % (E(q), E(a)) for q, a in items)
RVFORM = '<h3>Write a review</h3><form id="rvf" data-slug="%s"><label for="rvr">Your rating</label><select id="rvr"><option value="5">★★★★★ 5 – Loved it</option><option value="4">★★★★☆ 4</option><option value="3">★★★☆☆ 3</option><option value="2">★★☆☆☆ 2</option><option value="1">★☆☆☆☆ 1</option></select><label for="rvn">Your name</label><input id="rvn" maxlength="40" autocomplete="name"><label for="rvt">Your review</label><textarea id="rvt" rows="4" maxlength="600" required></textarea><input id="rvw" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px"><button class="cta" type="submit">Submit review</button><p id="rvm" class="note" role="status">Reviews are checked before they appear. Readers who bought this PDF here get a “Verified buyer” label.</p></form>'
for p in products:
    c = CATS[p['cat']]; r = rv(p['slug']); a = avg(r); path = href(p)
    img = '%s/covers/%s' % (SITE, p['img']) if p['img'] else ''
    pj = {'@context': 'https://schema.org', '@type': 'Product', 'name': p['title'], 'description': p['short'], 'brand': {'@type': 'Brand', 'name': c['name']},
          'offers': {'@type': 'Offer', 'price': p['price'], 'priceCurrency': 'INR', 'availability': 'https://schema.org/InStock' if p['pdf'] else 'https://schema.org/OutOfStock', 'url': SITE + path}}
    ALT = p.get('alt') or 'Cover of ' + p['title']
    if img: pj['image'] = {'@type': 'ImageObject', 'url': img, 'caption': ALT, 'description': ALT, 'name': p['title']}
    FAQS = [(x['q'], x['a']) for x in (p.get('faq') or []) if x.get('q') and x.get('a')] + default_faq()
    fq = {'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in FAQS]}
    FAQH = gallery_html(p) + faq_html(FAQS)
    if p.get('gallery'):
        _il = [pj['image']] if 'image' in pj else []
        pj['image'] = _il + [{'@type': 'ImageObject', 'url': '%s/api/img?slug=%s&n=%d' % (SITE, p['slug'], n), 'caption': '%s: inside page %d' % (p['title'], i + 1), 'name': p['title']} for i, n in enumerate(p['gallery'])]
    if r:
        pj['aggregateRating'] = {'@type': 'AggregateRating', 'ratingValue': round(a, 1), 'reviewCount': len(r)}
        pj['review'] = [{'@type': 'Review', 'author': {'@type': 'Person', 'name': x['name']}, 'reviewRating': {'@type': 'Rating', 'ratingValue': x['rating']}, 'reviewBody': x['text']} for x in r]
    bc = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [{'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE + '/'}, {'@type': 'ListItem', 'position': 2, 'name': c['short'], 'item': '%s/%s/' % (SITE, p['cat'])}, {'@type': 'ListItem', 'position': 3, 'name': p['title']}]}
    cls, inner = cvparts(p)
    rate = '<p class="rate"><span class="stars" aria-label="%.1f out of 5">%s</span> %.1f (%d review%s) · <a href="#reviews">Write a review</a></p>' % (a, stars(a), a, len(r), 's' if len(r) > 1 else '') if r else '<p class="rate note">No reviews yet. <a href="#reviews">Be the first to review</a></p>'
    buy = ('<div id="buybox" hidden><label for="buyer">Your email (we send the PDF link here)</label><input id="buyer" type="email" autocomplete="email" placeholder="you@example.com"><button class="cta" data-buy="%s">Buy now · %s</button><p id="msg" class="note" role="status"></p><p class="note">Secure payment by Razorpay: UPI, cards, net banking and wallets. After paying you return to our site and your download opens right away.</p><script src="https://checkout.razorpay.com/v1/checkout.js"></script></div>' % (E(p['slug']), INR(p['price'])))
    buy = '<p><a id="sample" class="cta ghost" href="/api/sample?slug=%s" target="_blank" rel="noopener"%s>&#128196; Free sample PDF</a></p>' % (E(p['slug']), '' if p['sample'] else ' hidden') + buy + '<div id="bundle" hidden></div>'
    revs = ''.join('<div class="rev"><span class="stars">%s</span> <b>%s</b>%s<p>%s</p></div>' % (stars(x['rating']), E(x['name']), ' <small>Verified buyer</small>' if x.get('verified') else '', E(x['text'])) for x in r) or '<p>No reviews yet.</p>'
    revs = '<div id="revlist" data-slug="%s">%s</div>' % (E(p['slug']), revs)
    rel = [x for x in products if x['cat'] == p['cat'] and x['slug'] != p['slug']][:3]
    write(path + 'index.html', head('%s (PDF) | %s' % (p['title'], c['name']), p['short'], p['cat'], path, [pj, bc, fq], img)
      + '<main class="w"><p class="crumbs"><a href="/">Home</a> / <a href="/%s/">%s</a> / %s</p><div class="prod"><div class="cv big%s" style="background:%s"%s>%s</div><div class="panel"><h1>%s</h1>%s<p class="pr big" id="price">%s</p><div id="offers"></div><div id="soon"></div><p>%s</p>%s</div></div>' % (
        p['cat'], E(c['short']), E(p['title']), cls, E(p['color']), '' if p['img'] else ' role="img" aria-label="%s"' % E(p.get('alt') or 'Cover of ' + p['title']), inner, E(p['title']), rate, INR(p['price']), E(p['short']), buy)
      + '<section class="panel"><h2>About this PDF</h2>%s<ul><li>%d pages, PDF format</li><li>Opens on phone, tablet and computer</li><li>Link sent by email after payment</li></ul></section>%s%s<section class="panel" id="reviews"><h2>Reviews</h2>%s%s</section>' % (desc_html(p['desc']), int(p.get('pages', 0)), disc(p['cat']), FAQH, revs, RVFORM % E(p['slug']))
      + ('<h2 class="tag">More from %s</h2><div class="grid">%s</div>' % (E(c['name']), ''.join(card(x) for x in rel)) if rel else '') + '</main>' + FOOT)

# ---- policy pages ----
m = CFG['owner_email']
PG = {'contact': ('Contact us', 'Email us at %s. We reply within 2 working days. Please include the email you used to buy.' % m),
 'refund': ('Refund and cancellation policy', 'Our PDFs are digital products delivered instantly, so we cannot cancel or refund an order after the file is downloaded. If the file is damaged, if you were charged but did not receive your link, or if you were charged twice, email %s within 7 days and we will fix it or refund you. Approved refunds go back to the original payment method.' % m),
 'privacy': ('Privacy policy', 'We collect your email address to send your PDF link and to help with support. Payments are handled by Razorpay, and we never see or store your card or UPI details. We keep a small note in your browser to remember referral links and store credit. We do not sell your data. To have your data removed, email %s.' % m),
 'terms': ('Terms of use', 'By buying a PDF you receive a personal licence to read and print it for your own use. You may not copy, resell or share the file. Download links expire after a limited time or number of downloads. All prices are in Indian rupees. Trading guides are for education only. They are not investment advice and do not promise profits; trading involves risk of loss.'),
 'referral': ('Referral program terms', 'When a friend buys a PDF for the first time through your share link, they get %d%% off and you earn %d%% of the amount they pay as store credit. Credit becomes usable %d days after the purchase, can cover up to %d%% of the price of a PDF, has no cash value and cannot be transferred or sold. Buying through your own link, or with a second email of your own, is not allowed and may cancel the credit. If an order is refunded, the credit earned from it is removed. We may change or end the programme at any time.' % (CFG['friend_discount_pct'], CFG['ref_commission_pct'], CFG['hold_days'], CFG['credit_max_pct']))}
if CP['enabled']:
    _lines = ' '.join('%s: opens %s, offer runs until %s (%s).' % (CATS[c]['name'], _dd(f['open']), _dd(f['end'] - 1000), _ph_text(c, f)) for c, f in sorted(CP['phases'].items(), key=lambda kv: kv[1]['open']) if c in CATS and f['end'] > f['open'])
    PG['launch-offer'] = ('Launch offer terms', 'Each launch offer runs once, on the dates below, and will not be repeated or extended. ' + _lines + ' A section is not on sale before its opening date, except for VIP members who get early access. Waitlist-only offers go only to people whose email joined the waitlist before that section opened. A referral counts only when the friend is a first-time buyer, pays successfully, is not you, and the order is not refunded. The referral reward can be unlocked once per person. Buying through your own link, fake orders or other misuse cancel offers and rewards, and we may end an offer early if there is misuse.')
    _pk = CP['perks']
    PG['rewards'] = ('Rewards and VIP terms', ('Founding customers: the first %d people to complete a paid order after the launch starts become Founding Customers. Top referrers: until %s we count the first-time customers who paid through your link (refunded orders are removed). After the ranking closes and the refund period ends, the top %d referrers with at least %d referrals become VIP, and the top %d get extra benefits. Founding and VIP members get: %d%% off any PDF (the best single offer applies, it is never stacked on top of other discounts, and a minimum price of %d%% of the regular price still applies), early access of %d hours to new launches, and free updates to every PDF they bought through My Library. The top %d referrers also get free access to new launches. All perks last as long as Sharpalign runs the programme, are personal, cannot be sold or transferred, and may be changed or ended with notice if abused or if the programme closes. Prizes for top ranks are shown on the Rewards page. A prize only goes ahead when the number of members shown for it is reached, and we may replace a prize with one of similar value. Winners must give a delivery address in India, and any taxes on prizes are the winner\'s responsibility. Fake or self-made referrals disqualify you. Our decision on rankings is final.') % (_pk['founders'], _dd(CP['rank_end']), _pk['top_vip'], _pk['min_referrals'], _pk['top_free'], _pk['discount_pct'], CAMP.get('min_pay_pct', 30), _pk['early_hours'], _pk['top_free']))
for k, (t, body) in PG.items():
    write('page/%s/index.html' % k, head(t + ' | Sharpalign', t, 'home', 'page/%s/' % k) + '<main class="w"><div class="panel"><h1>%s</h1><p>%s</p></div></main>' % (E(t), E(body)) + FOOT)

_offer = ''
if CP['enabled']:
    _offer = '<div class="offer"><b>🎉 Launch schedule</b><br>' + '<br>'.join('%s opens %s: %s' % (CATS[c]['name'], _dd(f['open']), _ph_text(c, f) or 'regular prices') for c, f in sorted(CP['phases'].items(), key=lambda kv: kv[1]['open']) if c in CATS and f['end'] > f['open']) + '<br><a href="/page/launch-offer/">Offer terms</a> · <a href="/leaderboard/">Rewards and leaderboard</a></div>'
write('refer/index.html', head('Refer friends and earn | Sharpalign', 'Share Sharpalign with friends. They get a discount and you earn store credit, launch rewards and VIP perks.', 'home', 'refer/')
  + '<main class="w"><div class="panel"><h1>Refer friends and earn</h1>' + _offer + '<p>Friends get %d%% off their first PDF. You earn %d%% of what they pay as store credit. The more friends buy through your link, the higher you climb the <a href="/leaderboard/">leaderboard</a>.</p><ol><li>Enter your email below. You do not need to buy anything first.</li><li>We email you your personal link (check spam too).</li><li>Share it on WhatsApp, Telegram or Instagram and watch your progress on your private page.</li></ol><form id="jf"><label for="je">Your email</label><input id="je" type="email" required autocomplete="email" placeholder="you@example.com"><input id="jw" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px"><button class="cta" type="submit">Get my link</button><p id="jm" class="note" role="status"></p></form></div></main>' % (CFG['friend_discount_pct'], CFG['ref_commission_pct']) + FOOT)
if CP['enabled']:
    write('leaderboard/index.html', head('Rewards and leaderboard | Sharpalign', 'Top referrers and founding customers get VIP perks and prizes at Sharpalign.', 'home', 'leaderboard/')
      + '<main class="w"><div class="panel"><h1>Rewards and leaderboard</h1><p>Ranking closes on <b>%s</b> (in <b class="sa-t" data-to="%d"></b>). Final ranks are confirmed after the refund period. <a href="/page/rewards/">Rewards terms</a></p><div class="offer"><b>VIP perks</b> for the first %d customers and the top %d referrers: %d%% off any PDF, early access to new launches, and free updates to every PDF you bought. The top %d also get free access to new launches.</div><p id="lbm" class="note"></p></div><div class="panel"><h2>Prizes</h2><div id="pz"></div></div><div class="panel"><h2>Top referrers</h2><div id="lb">Loading…</div><p class="note">Names are hidden for privacy. <a href="/refer/">Join and get your link</a>, then open your private page to see your rank.</p></div></main><script src="/assets/lb.js" defer></script>' % (_dd(CP['rank_end']), CP['rank_end'], CP['perks']['founders'], CP['perks']['top_vip'], CP['perks']['discount_pct'], CP['perks']['top_free']) + FOOT)
# ---- return pages, 404, sitemap, robots ----
def app(title, js, path): return head(title, title, 'home', path, noindex=True) + '<main class="w" id="app"><div class="panel"><p>Loading…</p></div></main><script src="/assets/%s" defer></script>' % js + FOOT
write('thank-you/index.html', app('Your PDF is ready', 'thanks.js', 'thank-you/'))
write('credit/index.html', app('My referral credit', 'credit.js', 'credit/'))
write('cart/index.html', head('Your bundle | Sharpalign', 'Your bundle', 'home', 'cart/', noindex=True) + '<main class="w" id="app"><div class="panel"><p>Loading…</p></div></main><script src="https://checkout.razorpay.com/v1/checkout.js"></script><script src="/assets/cart.js" defer></script>' + FOOT)
write('404.html', head('Page not found', 'Page not found', 'home', noindex=True) + '<main class="w"><div class="panel"><h1>Page not found</h1><p><a href="/">Back to the shop</a></p></div></main>' + FOOT)
today = datetime.date.today().isoformat()
urls = [('', today), ('refer/', today), ('leaderboard/', today)] + [(k + '/', today) for k in CATS] + [(href(p).lstrip('/'), p.get('added', today)) for p in products if p['pdf']]
write('robots.txt', 'User-agent: *\nDisallow: /thank-you/\nDisallow: /credit/\nDisallow: /api/\nSitemap: %s/sitemap.xml\n' % SITE)
os.makedirs('dist/' + ADMIN_PATH, exist_ok=True); shutil.move('dist/assets/admin.html', 'dist/%s/index.html' % ADMIN_PATH)
for _f in ('favicon.svg', 'favicon.ico', 'apple-touch-icon.png'): shutil.copy('static/' + _f, 'dist/' + _f)
open('netlify/functions/_shell.mjs', 'w', encoding='utf-8').write('export default ' + json.dumps({'site': SITE, 'fonts': FONTS, 'campjs': CAMPJS, 'nav': ''.join('<a href="/%s/">%s</a>' % (k, E(c['short'])) for k, c in CATS.items()), 'foot': FOOT, 'fav': FAV, 'verify': VERIFY, 'cats': {k: {'name': c['name'], 'short': c['short']} for k, c in CATS.items()}, 'disc': disc('trading'), 'leaderboard': bool(CP['enabled']), 'faqd': default_faq()}, ensure_ascii=False) + ';\n')
print('Built %d products, %d pages' % (len(products), 1 + len(CATS) + len(products) + len(PG) + 3))
