# Sharpalign on Netlify – setup guide

**Website:** HTML, CSS and JavaScript (built by `build.py`, runs in the visitor's browser).
**Payment and download:** JavaScript functions on Netlify (Node.js), in `netlify/functions`.
**Books and covers:** made by you (Python), kept in `private-pdfs/` and `covers/`.

## Payment flow
Buy now > Razorpay window > payment > Razorpay returns the buyer to `/api/payment-callback`, which checks the payment signature with Razorpay > buyer lands on `/thank-you/` with a Download button > email with the same link is sent. A webhook (`/api/webhook`) is the backup if the buyer closes the page.

## Go live (do in this order)
1. **GitHub:** create a free account, then a new **Private** repository named `sharpalign`. Click "uploading an existing file" and drag in everything from this folder (keep the folders). Commit.
2. **Netlify:** sign up free (use "Sign up with GitHub"), Add new site > Import an existing project > GitHub > choose `sharpalign`. The build settings come from `netlify.toml`. Deploy.
3. **Brevo (email):** create a free account, add and verify your sender email (Senders), then create an API key (SMTP & API > API keys).
4. **Razorpay:** Test Mode > Settings > API Keys > Generate. Then Webhooks > Add: URL `https://YOUR-SITE.netlify.app/api/webhook`, events `payment.captured` and `order.paid`, and a secret you make up.
5. **Netlify secrets:** Site configuration > Environment variables > add (keep "Functions" ticked):
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
   - `TOKEN_SECRET` (30+ random letters and numbers, never change it later)
   - `BREVO_API_KEY`, `FROM_EMAIL` (the verified sender)
   - `ADMIN_PASSWORD` (12+ characters, for your admin page)
   - `EXPORT_KEY` (30+ random characters; tick **Builds** and **Functions** for this one)
   - `BUILD_HOOK_URL`: in Netlify go to Site configuration > Build & deploy > Build hooks > Add build hook, then paste its URL here
   Then Deploys > Trigger deploy > Deploy site.
6. **Your products:** edit `config.json` (your domain and email) and `products.json`. Put each PDF in `private-pdfs/` and each cover in `covers/`, named like the product slug. Commit on GitHub. Netlify rebuilds in about a minute.
7. **Test:** buy with the Razorpay test card 4111 1111 1111 1111. You should land on the download page, get the email, and the PDF should download.
8. **Domain:** Netlify > Domain management > Add `sharpalign.com`, then follow its DNS instructions at your registrar. Free HTTPS is automatic. Update the webhook URL to your domain.
9. **Google:** add the site in Search Console and submit `https://sharpalign.com/sitemap.xml`.
10. **Live:** finish Razorpay KYC, switch to Live keys, update the Netlify variables and the webhook, redeploy, and make one small real purchase.

## Products go live instantly (no deploy, no credits)
Products, prices, descriptions, covers and PDFs you save in the admin page are live at once: the product page, checkout, My Library, the sitemap and the shop lists all read them live. You never need to press Publish or deploy to sell a new PDF. A deploy (15 Netlify credits) is only needed when you change code files, `config.json`, `campaign.json`, `admin.json` or `products.json`. Any later deploy also bakes the admin products into the built pages.

## Admin page (your own password-protected dashboard)
Open your private admin address (the `path` in `admin.json`, for example `https://sharpalign.shop/studio-xxxxxxxx/`; change it any time by editing that file and deploying). It is not linked anywhere on the site and is hidden from Google. The first time (or if you forget it), use the box **Set or reset password**: type your `TOKEN_SECRET` value as the setup key and choose a password of 6 or more characters. It is saved by the site itself, so no Netlify setting or redeploy is needed. Use **Change password** inside the admin page any time. After 10 wrong tries a visitor is paused for an hour.
- **Orders:** every sale. Resend a buyer's download email, or reset their download count.
- **Products:** add a product, upload its PDF (up to about 24 MB) and a cover image (it is cropped to 600 x 800 for you), edit or remove products.
- **Reviews:** approve or reject buyer reviews. Only approved reviews appear on the site.
- **Credit:** see every referral balance and adjust one (use a minus after a refund).
After products or reviews change, a yellow bar says "not live yet". Press **Publish now** and the site rebuilds in about a minute (this uses one Netlify build). Without the build hook, press Trigger deploy in Netlify instead.

## Adding a new PDF
Option 0 (easiest): use the admin page, Products.
Option A (easy, no tools): upload the PDF to `private-pdfs/`, the cover to `covers/` (same slug name) and add an entry to `products.json` on GitHub.
Option B (Python on your computer): `python add_product.py --title "..." --cat kids --price 149 --pdf book.pdf --cover cover.jpg --pages 24 --short "..." --desc "..."`, then upload the changed files.
The page, sitemap and Google product data are created automatically on each build. A product shows "Coming soon" until its PDF exists.

## Section bundles (you set the price and the timer)
In the admin page open **Bundles**. Choose a section (Cooking, Kids, Journals, Novels or Trading), type one price in rupees (and optionally dollars, euros, pounds), and set when it is available: leave "from" empty to start at once, then set "until" or press 24 hours / 3 days / 7 days / 30 days. While a bundle is live, a popup offers it on every page of the site with a countdown, an email box and a Pay button. After the visitor closes it, a small "bundle" button stays at the bottom of the screen for 8 hours. Buyers get every PDF in that section that has a file at the moment they buy, they pay the same price even if they already own some of them, and a friend's link still earns the referrer their reward. When the end time passes, the popup disappears and the bundle can no longer be bought. Pause or delete a bundle any time.

Site address and your email: the build uses `https://sharpalign.shop` if `config.json` still has the placeholder address. You can also set `SITE_URL` and `OWNER_EMAIL` in Netlify's environment variables. `OWNER_EMAIL` is where sale and review alerts are sent and the email shown on the contact and policy pages. The sitemap is built from the live product list at `/sitemap.xml`.

## Pick-your-own percent-off bundles (OFF by default)
The older percent-off tiers in `bundle.json` (2 PDFs 20% off, and so on) are switched off. To use them add `"multi_discount": true` to `bundle.json`.

## Bundles, free samples, inside pictures
- **Bundles (buy more, pay less):** `bundle.json` sets the tiers. By default 1 PDF = full price, 2 PDFs = each at 80%, 3 PDFs = each at 70%, 5 or more = each at 60%. Product pages show a "Bundle & save" box with an Add to bundle button, a floating bar shows the bundle, and `/cart/` shows the prices, the tiers, the savings and one payment for everything. After paying, the thank-you page lists a Download button for every PDF. A launch offer or VIP price and the bundle price never stack: each PDF gets whichever is lowest. Bundles work in every currency (if one PDF has no price in a currency, the bundle falls back to dollars, then rupees). Store credit works on rupee bundles. Change `tiers` in `bundle.json` (`"enabled": false` switches bundles off).
- **Free sample PDF:** in admin Products press "Upload sample PDF" on a product (max about 18 MB). A "Free sample PDF" button then appears on its page at once. "Open sample" lets you check it.
- **Inside pictures:** press "Add inside pictures" on a product and select up to 12 pictures (screenshots of pages). They are shrunk automatically and shown on the product page as a scrolling "Look inside" gallery (tap to enlarge) and added to the page's Google data. "Clear pictures" removes them all.

## Updating the site in one commit
Unzip the update zip, open your repository's main page on GitHub, click Add file > Upload files, drag in everything that is inside the unzipped folder (files and folders together), and click Commit changes once. The update zips never contain your own settings files (`config.json`, `products.json`, `reviews.json`, `campaign.json`, `admin.json`, `bundle.json` after you have edited it), your `private-pdfs` and `covers`, so nothing of yours is overwritten.

## Product pages, questions, bulk upload
- **Whole cards are clickable** on every shop list. Long descriptions are shown compactly (short lines become columns, with a Read more button) and the full text stays on the page for Google.
- **Questions:** in the admin product form, write one question per line as `Question | Answer`. They appear on the product page (with five standard questions about downloads, devices, payment and refunds) and are added to the page's Google data (FAQPage). Google shows FAQ boxes in results only for some sites, but the text still helps the page get found.
- **Picture text:** the field "Cover image description" is used as the picture's alt text and as the caption in Google's image data.
- **Check a PDF:** in the admin Products list, "Open PDF" opens the uploaded file in your browser and shows its size; "View page" opens the public page.
- **Bulk add:** in admin Products, "Add many PDFs at once". Choose the section and a price, select all the PDFs (and optional cover pictures with the same file names), press Upload all. Each file becomes a product named from its file name (max about 18 MB each). Edit descriptions afterwards.
- **Percentage launch offers:** in `campaign.json` a phase can use `"discount_pct"` for the launch discount and `"reward_pct"` for the referral reward instead of fixed prices, for example `"cooking": {"open_day": 0, "days": 7, "discount_pct": 30, "reward_pct": 50, "reward_days": 7}`. A launch price is only advertised when it really lowers a price.

## Prices in other currencies
Each product has a rupee price and optional prices in US dollars, euros and pounds (set them in the admin product form, or add `"prices": {"USD": 9.99, "EUR": 8.99, "GBP": 7.99}` to a product in `products.json`). Visitors see: India = rupees (cannot be changed), UK = pounds, euro countries = euros, everyone else = dollars. Outside India a small Currency box in the footer lets a visitor switch between USD, EUR and GBP. If a price is missing: pounds fall back to dollars, euros fall back to dollars, and if there is no dollar price either, the rupee price is charged. Launch offers give the same percentage off in every currency. Store credit works only for rupee orders. A friend's purchase in any currency earns the referrer the same rupee amount, based on the rupee value of the sale.
You must turn on **International payments** in your Razorpay dashboard (it may need approval). Foreign cards usually cost more in fees, and Razorpay pays you out in rupees. VAT or sales tax on sales to the UK, EU and US is not handled by the site: ask an accountant.

## Launch plan, timers, perks and rewards (campaign.json)
`campaign.json` runs the whole launch. Day 0 is the `start` date (change it to your real launch date, in India time).
- **Cooking** opens on day 0. Launch price 399 for 7 days. A person who gets 5 different first-time customers to buy through their link in that week unlocks 299 on all cooking books for 7 days (one time only).
- **Kids** opens on day 7 with 40% off for 7 days. **Journals** open on day 15 with 40% off for 7 days. **Trading** opens on day 30 with 50% off for 7 days, **only for people who joined the waitlist before it opened**. Change `open_day`, `days`, `discount_pct`, `launch_price` for each.
- Before a section opens, its pages show a countdown and an email box ("Get notified" or "Join the waitlist"). Nobody can buy until it opens (except VIP early access below).
- **Founding customers**: the first 100 customers get 50% off any PDF, early access (48 hours before each launch) and free updates through My Library.
- **Top referrers**: the ranking runs for `ranking_days` (45). Afterwards open Admin > Ranking > Finalize (do this after your refund window). The top 100 become VIP (same perks). The top 10 also get free access to every new launch.
- **My Library** (on each person's private page) always offers the latest version of every PDF they bought. When you upload a new version of a PDF in the admin page, buyers get it automatically.
- **Prizes** are listed in `prizes`. A prize shows as a locked mystery prize until that many members have joined, then it is revealed. Edit titles and member targets to match what you can afford. A prize only goes ahead when its target is reached (the rewards terms say so).
- **Safety rules built in**: the best single offer applies (discounts are not stacked on top of the 50% perk), and no order can go below `min_pay_pct` (30%) of the regular price, even with store credit.

### Admin tabs
- **Ranking**: live leaderboard with emails, Finalize button, founder badges.
- **Waitlist**: how many emails per section, CSV download, and "Send a launch email" (80 per press, within Brevo's free daily limit). Each email carries an unsubscribe line. Only email people who asked to be notified.
- **Credit**: grant or revoke the cooking reward, adjust balances.

### Prize ideas (pick what fits your budget)
Gold or silver coin for the top 1 to 3, gift vouchers for ranks 4 to 10, a "Wall of Fame" page, your name printed inside the next PDF, a custom PDF written for the winner, or a signed print copy. Keep costs below what the extra sales bring in, ask an accountant about tax on prizes, and get a delivery address and ID details only from winners.

## Reviews
Buyers rate on the download page and you get an email. Approve or reject it in the admin page. You can still add reviews by hand in `reviews.json`. Only show real reviews.

## Referrals
Same rules as before (friend 5% off, buyer earns 10% as store credit, usable after 7 days, up to 50% of one PDF). Change numbers in `config.json`.

## Limits to know
- PDFs uploaded in the admin page are stored in Netlify Blobs (up to about 24 MB each). PDFs in `private-pdfs/` are bundled with the download function: keep the total under about 200 MB and each under 20 MB.
- Referral balances live in Netlify Blobs. If two sales credit the same person in the same second, one credit could be lost (rare).
- Netlify's free plan has monthly usage limits. Check Netlify's current pricing page.
- If someone is refunded, deduct their referral credit in the admin page, Credit.
- The admin page has one password and no lock-out after wrong tries (each wrong try just waits 1.5 seconds). Use a long password.
