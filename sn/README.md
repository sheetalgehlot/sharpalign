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

## Admin page (your own password-protected dashboard)
Open `https://sharpalign.com/admin/` and log in with `ADMIN_PASSWORD`.
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
