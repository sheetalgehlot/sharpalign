#!/usr/bin/env python3
"""Add a product from your computer (run from the project folder). Example:
python add_product.py --title "Night Sky Stories" --cat kids --price 149 --pdf book.pdf --cover cover.jpg --pages 24 \
  --short "A calm bedtime story for ages 3 to 6." --desc "Longer description here."
Then upload the changed files (products.json, private-pdfs, covers) to GitHub. Netlify rebuilds by itself."""
import argparse, json, re, shutil, os, datetime
a = argparse.ArgumentParser()
for k in ('title', 'cat', 'price', 'pdf', 'short', 'desc'): a.add_argument('--' + k, required=True)
a.add_argument('--cover'); a.add_argument('--pages', type=int, default=0); a.add_argument('--emoji', default='📘'); a.add_argument('--color', default='#3b82f6')
x = a.parse_args()
assert x.cat in ('kids', 'cooking', 'journals', 'novels', 'trading'), 'cat must be kids, cooking, journals, novels or trading'
slug = re.sub(r'[^a-z0-9]+', '-', x.title.lower()).strip('-')
P = json.load(open('products.json', encoding='utf-8'))
assert not any(p['slug'] == slug for p in P), 'A product with this title already exists'
os.makedirs('private-pdfs', exist_ok=True); shutil.copy(x.pdf, 'private-pdfs/%s.pdf' % slug)
if x.cover:
    ext = os.path.splitext(x.cover)[1].lower(); assert ext in ('.jpg', '.jpeg', '.png', '.webp'), 'cover must be jpg, png or webp'
    os.makedirs('covers', exist_ok=True); shutil.copy(x.cover, 'covers/%s%s' % (slug, ext))
P.append(dict(slug=slug, cat=x.cat, title=x.title, price=int(x.price), pages=x.pages, emoji=x.emoji, color=x.color, short=x.short, desc=x.desc, added=datetime.date.today().isoformat()))
json.dump(P, open('products.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('Added', slug, '. Now upload products.json, private-pdfs/%s.pdf and the cover to GitHub.' % slug)
