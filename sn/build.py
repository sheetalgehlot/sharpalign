#!/usr/bin/env python3
"""Builds the static website into dist/ from products.json. Netlify runs this on every deploy."""
import json, os, shutil, html, datetime
os.chdir(os.path.dirname(os.path.abspath(__file__)))
CFG = json.load(open('config.json', encoding='utf-8')); SITE = CFG['site'].rstrip('/')
E = lambda s: html.escape(str(s), quote=True)
INR = lambda n: '₹{:,}'.format(int(n))
load = lambda f, d: json.load(open(f, encoding='utf-8')) if os.path.isfile(f) else d
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
def write(path, s):
    path = os.path.join('dist', path.lstrip('/')); os.makedirs(os.path.dirname(path), exist_ok=True); open(path, 'w', encoding='utf-8').write(s)
# data for the serverless functions
os.makedirs('netlify/functions', exist_ok=True)
open('netlify/functions/_config.mjs', 'w', encoding='utf-8').write('export default ' + json.dumps({k: CFG[k] for k in ('owner_email', 'from_name', 'ref_commission_pct', 'friend_discount_pct', 'credit_max_pct', 'hold_days', 'link_days', 'max_downloads')}) + ';\n')
open('netlify/functions/_products.mjs', 'w', encoding='utf-8').write('export default ' + json.dumps({p['slug']: {'title': p['title'], 'price': int(p['price']), 'pdf': p['pdf']} for p in products}, ensure_ascii=False) + ';\n')

stars = lambda n: '★' * int(round(n)) + '☆' * (5 - int(round(n)))
rv = lambda s: [r for r in reviews if r['slug'] == s]
avg = lambda r: sum(x['rating'] for x in r) / len(r) if r else 0
href = lambda p: '/%s/%s/' % (p['cat'], p['slug'])
ldjs = lambda j: '<script type="application/ld+json">' + json.dumps(j, ensure_ascii=False).replace('<', '\\u003c') + '</script>'
FONTS = 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;800&amp;family=Caveat:wght@600;700&amp;family=Caveat+Brush&amp;family=Cormorant+Garamond:wght@500;700&amp;family=Nunito:wght@400;700&amp;family=Space+Grotesk:wght@500;700&amp;display=swap'
def head(title, desc, theme, path='', ld=(), img='', noindex=False):
    u = SITE + '/' + path.lstrip('/')
    nav = ''.join('<a href="/%s/">%s</a>' % (k, E(c['short'])) for k, c in CATS.items())
    return ('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
      '<title>%s</title><meta name="description" content="%s"><link rel="canonical" href="%s">%s'
      '<meta property="og:title" content="%s"><meta property="og:description" content="%s"><meta property="og:type" content="website"><meta property="og:url" content="%s"><meta property="og:site_name" content="Sharpalign">%s'
      '<link rel="stylesheet" href="%s"><link rel="stylesheet" href="/assets/style.css"><script src="/assets/site.js" defer></script>%s</head>'
      '<body class="t-%s"><div class="top"><a class="logo" href="/">Sharpalign</a><nav aria-label="Main">%s</nav></div>') % (
      E(title), E(desc), E(u), '<meta name="robots" content="noindex">' if noindex else '', E(title), E(desc), E(u),
      '<meta property="og:image" content="%s"><meta name="twitter:card" content="summary_large_image">' % E(img) if img else '', FONTS, ''.join(ldjs(j) for j in ld), theme, nav)
FOOT = '<footer class="foot"><div class="w"><nav><a href="/page/contact/">Contact</a> <a href="/page/refund/">Refund policy</a> <a href="/page/privacy/">Privacy</a> <a href="/page/terms/">Terms</a> <a href="/page/referral/">Referral terms</a></nav><p>© %d Sharpalign</p></div></footer></body></html>' % datetime.date.today().year
def disc(k): return '<p class="disc"><b>Educational only.</b> These guides teach trading concepts. They are not investment advice or stock tips, and they do not promise profits. Trading carries a risk of loss. Please speak to a SEBI-registered adviser before investing.</p>' if k == 'trading' else ''
def deco(k):
    if k == 'trading': return '<div class="candles" aria-hidden="true">' + ''.join('<i style="height:%dpx;background:%s"></i>' % (h, '#22c55e' if g else '#ef4444') for h, g in [(60,1),(95,0),(75,1),(125,1),(100,0),(150,1),(130,0),(175,1)]) + '</div>'
    if k == 'kids': return '<div class="sun"></div><div class="cloud" style="left:6%;top:50px"></div><div class="cloud" style="left:48%;top:20px;transform:scale(.75)"></div><div class="rainbow"></div>'
    return ''
def cvparts(p):
    if p['img']: return ' img', '<img src="/covers/%s" alt="Cover of %s" loading="lazy" width="600" height="800">' % (E(p['img']), E(p['title']))
    return '', '%s<small>%s</small>' % (E(p['emoji']), E(p['title']))
def card(p):
    r = rv(p['slug']); cls, inner = cvparts(p)
    s = '<article class="card"><a class="cv%s" href="%s" style="background:%s"%s tabindex="-1">%s</a>' % (cls, href(p), E(p['color']), '' if p['img'] else ' aria-hidden="true"', inner)
    s += '<h3><a href="%s">%s</a></h3><p>%s</p>' % (href(p), E(p['title']), E(p['short']))
    if r: s += '<div class="rate"><span class="stars" aria-label="%.1f out of 5">%s</span> (%d)</div>' % (avg(r), stars(avg(r)), len(r))
    return s + '<div class="row"><span class="pr">%s</span><a class="buy" href="%s">%s</a></div></article>' % (INR(p['price']), href(p), 'View PDF' if p['pdf'] else 'Coming soon')

# ---- home ----
ld = [{'@context': 'https://schema.org', '@type': 'Organization', 'name': 'Sharpalign', 'url': SITE}, {'@context': 'https://schema.org', '@type': 'WebSite', 'name': 'Sharpalign', 'url': SITE}]
tiles = ''.join('<a class="tile %s" href="/%s/"><b>%s</b><span>%s</span><i>%s</i></a>' % (k, k, E(c['name']), E(c['sub']), c['ic']) for k, c in CATS.items())
new = ''.join(card(p) for p in list(reversed(products))[:6])
write('index.html', head('Sharpalign: PDF Story Books, Cookbooks, Journals, Novels & Trading Guides', 'Instant PDF downloads: kids story books and ABC rhymes, easy cookbooks, guided journals, novels and trading guides. Pay with UPI or card.', 'home', '', ld)
  + '<header class="hero"><div class="w"><h1>PDF story books, cookbooks, journals, novels and trading guides</h1><p>Instant downloads for every reader. Pay with UPI or card and get your PDF link by email.</p></div></header><main class="w"><div class="tiles">%s</div><h2 class="tag">New PDFs</h2><div class="grid">%s</div><h2 class="tag">How it works</h2><div class="steps"><div><b>Pick a PDF</b><span>Books, cookbooks, journals, novels and trading guides.</span></div><div><b>Pay securely</b><span>UPI, cards and net banking with Razorpay.</span></div><div><b>Download</b><span>You return to our site and your link opens right after payment.</span></div></div></main>' % (tiles, new) + FOOT)

# ---- categories ----
for k, c in CATS.items():
    items = [p for p in products if p['cat'] == k]
    write('%s/index.html' % k, head(c['title'], c['meta'], k, k + '/', [{'@context': 'https://schema.org', '@type': 'CollectionPage', 'name': c['title'], 'description': c['meta'], 'url': '%s/%s/' % (SITE, k)}])
      + '<header class="hero">%s<div class="w"><h1>%s</h1><p>%s</p><a class="cta" href="#shop">See the PDFs</a>%s</div></header><main class="w" id="shop"><h2 class="tag">%s</h2>%s<div class="grid">%s</div>%s</main>' % (
        deco(k), E(c['h1']), E(c['intro']), '<div class="emo" aria-hidden="true">%s</div>' % c['emo'] if c['emo'] else '', E(c['name']), disc(k), ''.join(card(p) for p in items), '' if items else '<p class="panel">New PDFs are coming soon.</p>') + FOOT)

# ---- product pages ----
for p in products:
    c = CATS[p['cat']]; r = rv(p['slug']); a = avg(r); path = href(p)
    img = '%s/covers/%s' % (SITE, p['img']) if p['img'] else ''
    pj = {'@context': 'https://schema.org', '@type': 'Product', 'name': p['title'], 'description': p['short'], 'brand': {'@type': 'Brand', 'name': c['name']},
          'offers': {'@type': 'Offer', 'price': p['price'], 'priceCurrency': 'INR', 'availability': 'https://schema.org/InStock' if p['pdf'] else 'https://schema.org/OutOfStock', 'url': SITE + path}}
    if img: pj['image'] = img
    if r:
        pj['aggregateRating'] = {'@type': 'AggregateRating', 'ratingValue': round(a, 1), 'reviewCount': len(r)}
        pj['review'] = [{'@type': 'Review', 'author': {'@type': 'Person', 'name': x['name']}, 'reviewRating': {'@type': 'Rating', 'ratingValue': x['rating']}, 'reviewBody': x['text']} for x in r]
    bc = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [{'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE + '/'}, {'@type': 'ListItem', 'position': 2, 'name': c['short'], 'item': '%s/%s/' % (SITE, p['cat'])}, {'@type': 'ListItem', 'position': 3, 'name': p['title']}]}
    cls, inner = cvparts(p)
    rate = '<p class="rate"><span class="stars" aria-label="%.1f out of 5">%s</span> %.1f (%d review%s)</p>' % (a, stars(a), a, len(r), 's' if len(r) > 1 else '') if r else '<p class="rate note">No reviews yet. Buyers can review after purchase.</p>'
    buy = ('<label for="buyer">Your email (we send the PDF link here)</label><input id="buyer" type="email" autocomplete="email" placeholder="you@example.com"><button class="cta" data-buy="%s">Buy now · %s</button><p id="msg" class="note" role="status"></p><p class="note">Secure payment by Razorpay: UPI, cards, net banking and wallets. After paying you return to our site and your download opens right away.</p><script src="https://checkout.razorpay.com/v1/checkout.js"></script>' % (E(p['slug']), INR(p['price']))) if p['pdf'] else '<p class="note">This PDF is coming soon.</p>'
    revs = ''.join('<div class="rev"><span class="stars">%s</span> <b>%s</b>%s<p>%s</p></div>' % (stars(x['rating']), E(x['name']), ' <small>Verified buyer</small>' if x.get('verified') else '', E(x['text'])) for x in r) or '<p>No reviews yet.</p>'
    rel = [x for x in products if x['cat'] == p['cat'] and x['slug'] != p['slug']][:3]
    write(path + 'index.html', head('%s (PDF) | %s' % (p['title'], c['name']), p['short'], p['cat'], path, [pj, bc], img)
      + '<main class="w"><p class="crumbs"><a href="/">Home</a> / <a href="/%s/">%s</a> / %s</p><div class="prod"><div class="cv big%s" style="background:%s"%s>%s</div><div class="panel"><h1>%s</h1>%s<p class="pr big" id="price">%s</p><div id="offers"></div><p>%s</p>%s</div></div>' % (
        p['cat'], E(c['short']), E(p['title']), cls, E(p['color']), '' if p['img'] else ' role="img" aria-label="Cover of %s"' % E(p['title']), inner, E(p['title']), rate, INR(p['price']), E(p['short']), buy)
      + '<section class="panel"><h2>About this PDF</h2>%s<ul><li>%d pages, PDF format</li><li>Opens on phone, tablet and computer</li><li>Link sent by email after payment</li></ul></section>%s<section class="panel"><h2>Reviews</h2>%s</section>' % (''.join('<p>%s</p>' % E(l) for l in p['desc'].split('\n') if l.strip()), int(p.get('pages', 0)), disc(p['cat']), revs)
      + ('<h2 class="tag">More from %s</h2><div class="grid">%s</div>' % (E(c['name']), ''.join(card(x) for x in rel)) if rel else '') + '</main>' + FOOT)

# ---- policy pages ----
m = CFG['owner_email']
PG = {'contact': ('Contact us', 'Email us at %s. We reply within 2 working days. Please include the email you used to buy.' % m),
 'refund': ('Refund and cancellation policy', 'Our PDFs are digital products delivered instantly, so we cannot cancel or refund an order after the file is downloaded. If the file is damaged, if you were charged but did not receive your link, or if you were charged twice, email %s within 7 days and we will fix it or refund you. Approved refunds go back to the original payment method.' % m),
 'privacy': ('Privacy policy', 'We collect your email address to send your PDF link and to help with support. Payments are handled by Razorpay, and we never see or store your card or UPI details. We keep a small note in your browser to remember referral links and store credit. We do not sell your data. To have your data removed, email %s.' % m),
 'terms': ('Terms of use', 'By buying a PDF you receive a personal licence to read and print it for your own use. You may not copy, resell or share the file. Download links expire after a limited time or number of downloads. All prices are in Indian rupees. Trading guides are for education only. They are not investment advice and do not promise profits; trading involves risk of loss.'),
 'referral': ('Referral program terms', 'When a friend buys a PDF for the first time through your share link, they get %d%% off and you earn %d%% of the amount they pay as store credit. Credit becomes usable %d days after the purchase, can cover up to %d%% of the price of a PDF, has no cash value and cannot be transferred or sold. Buying through your own link, or with a second email of your own, is not allowed and may cancel the credit. If an order is refunded, the credit earned from it is removed. We may change or end the programme at any time.' % (CFG['friend_discount_pct'], CFG['ref_commission_pct'], CFG['hold_days'], CFG['credit_max_pct']))}
for k, (t, body) in PG.items():
    write('page/%s/index.html' % k, head(t + ' | Sharpalign', t, 'home', 'page/%s/' % k) + '<main class="w"><div class="panel"><h1>%s</h1><p>%s</p></div></main>' % (E(t), E(body)) + FOOT)

# ---- return pages, 404, sitemap, robots ----
def app(title, js, path): return head(title, title, 'home', path, noindex=True) + '<main class="w" id="app"><div class="panel"><p>Loading…</p></div></main><script src="/assets/%s" defer></script>' % js + FOOT
write('thank-you/index.html', app('Your PDF is ready', 'thanks.js', 'thank-you/'))
write('credit/index.html', app('My referral credit', 'credit.js', 'credit/'))
write('404.html', head('Page not found', 'Page not found', 'home', noindex=True) + '<main class="w"><div class="panel"><h1>Page not found</h1><p><a href="/">Back to the shop</a></p></div></main>' + FOOT)
today = datetime.date.today().isoformat()
urls = [('', today)] + [(k + '/', today) for k in CATS] + [(href(p).lstrip('/'), p.get('added', today)) for p in products if p['pdf']]
write('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ''.join('<url><loc>%s/%s</loc><lastmod>%s</lastmod></url>' % (SITE, u, d) for u, d in urls) + '</urlset>')
write('robots.txt', 'User-agent: *\nDisallow: /thank-you/\nDisallow: /credit/\nDisallow: /api/\nDisallow: /admin/\nSitemap: %s/sitemap.xml\n' % SITE)
os.makedirs('dist/admin', exist_ok=True); shutil.move('dist/assets/admin.html', 'dist/admin/index.html')
print('Built %d products, %d pages' % (len(products), 1 + len(CATS) + len(products) + len(PG) + 3))
