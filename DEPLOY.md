# Deploy Guide — freescripture.org

This guide covers two paths to launch the site on a real domain. Either works fine; pick whichever your team is more comfortable with.

- **Path A: Cloudflare Pages** (recommended) — free tier covers the site easily, Cloudflare handles DNS and CDN in one place, and rebuilds happen automatically when you push to GitHub.
- **Path B: Netlify** — almost identical experience, also free, slightly simpler if you've used it before.

Both produce identical results. The whole deploy takes about 30 minutes the first time and zero attention thereafter.

---

## Before you begin

You need:

- A GitHub repository containing this project (`freescripture/`)
- Ownership of the domain `freescripture.org` (registered with any registrar — Namecheap, GoDaddy, Cloudflare itself, etc.)
- The two source repos cloned locally so you can build:
  ```bash
  git clone --depth 1 https://github.com/aruljohn/Bible-kjv.git source-kjv
  git clone --depth 1 -b 2024 https://github.com/scrollmapper/bible_databases_deuterocanonical.git source-deutero
  ```
- The `content/apocrypha/` folder with parsed JSON files committed to the repo (already done; this is in the tarball)

**Pre-launch checklist** — do these once before going public:

1. **Replace the Vanco donation URL.** Open `scripts/build.py`, find the `DONATE_URL` constant near the top of the file (look for the `DEPLOY-TIME TODO` comment), and swap in the real Hope for Americans Vanco endpoint. Same value Fablepixels uses.
2. **Verify the `mailto:` address on the About page** is the address you want errata sent to (currently `hello@hopeforamericans.org`).
3. **Run `python3 scripts/build.py` locally** and click around `public/` — make sure pages render cleanly before pushing.

---

## Path A: Cloudflare Pages (recommended)

### Step 1 — Push the project to GitHub

The project should be a public or private repo containing at minimum:

```
your-repo/
├── content/apocrypha/         # committed parsed JSON
├── scripts/build.py
├── scripts/parse_apocrypha.py
├── static/                    # CSS, JS, favicon, OG image
└── README.md
```

The `source-kjv/` and `source-deutero/` directories should be added to `.gitignore` — they're cloned at build time, not stored in your repo.

```bash
# .gitignore
source-kjv/
source-deutero/
public/
__pycache__/
.DS_Store
```

### Step 2 — Create a Cloudflare account and add the domain

1. Sign up at [cloudflare.com](https://cloudflare.com) if you don't already have an account.
2. Go to **Websites → Add a site**, enter `freescripture.org`, choose the Free plan.
3. Cloudflare will scan existing DNS records (if any) and give you two **nameservers** like `xyz.ns.cloudflare.com` and `abc.ns.cloudflare.com`.
4. Go to your domain registrar and replace the existing nameservers with Cloudflare's. DNS propagation usually takes 5-60 minutes.
5. Wait for Cloudflare to confirm the domain is active (you'll get an email).

### Step 3 — Create a Cloudflare Pages project

1. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Connect to Git**.
2. Authorize Cloudflare to access your GitHub repos and select the `freescripture` repo.
3. On the build configuration page, enter:

   | Field | Value |
   |---|---|
   | **Production branch** | `main` |
   | **Framework preset** | None |
   | **Build command** | `git clone --depth 1 https://github.com/aruljohn/Bible-kjv.git source-kjv && git clone --depth 1 -b 2024 https://github.com/scrollmapper/bible_databases_deuterocanonical.git source-deutero && python3 scripts/build.py` |
   | **Build output directory** | `public` |
   | **Root directory** | (leave blank) |
   | **Environment variables** | none |

4. Click **Save and Deploy**. The first build takes about 90 seconds (most of that is the source-data clones). You'll get a `*.pages.dev` URL like `freescripture-abc.pages.dev` you can preview at.

### Step 4 — Connect the custom domain

1. In your Pages project, go to **Custom domains → Set up a custom domain**.
2. Enter `freescripture.org` and click **Continue → Activate domain**. Cloudflare creates the necessary CNAME automatically since DNS is also on Cloudflare.
3. Add `www.freescripture.org` as a second custom domain — Cloudflare will set up the redirect to apex automatically.
4. Wait 1-3 minutes for the SSL certificate to provision. The site is now live at `https://freescripture.org` with HTTPS.

### Step 5 — Verify the `_redirects` file is honored

The build produces `public/_redirects` with rules like `/kjv/john/3 /kjv/john/3.html 200`. Cloudflare Pages reads this file automatically — no extra configuration needed. Test by visiting `https://freescripture.org/kjv/john/3` (without `.html`); it should serve the chapter page.

### Step 6 — Configure the 404 page

Cloudflare Pages serves `public/404.html` automatically when a path doesn't match any other file. The build already places it correctly. Test by visiting `https://freescripture.org/this-page-does-not-exist`.

### Step 7 — Set up automatic rebuilds

Already done: every push to `main` triggers a fresh build. Pull requests get preview deploys at unique URLs. No further configuration needed.

### Step 8 — Submit the sitemap to search engines

1. Go to [Google Search Console](https://search.google.com/search-console), add `freescripture.org` as a property, and verify ownership using the Cloudflare DNS TXT method (one-click since Cloudflare is the DNS host).
2. Submit `https://freescripture.org/sitemap.xml` in **Sitemaps**.
3. Repeat for [Bing Webmaster Tools](https://www.bing.com/webmasters).
4. The `robots.txt` already welcomes AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.) — no extra action needed for AI discoverability.

---

## Path B: Netlify

### Step 1 — Push to GitHub (same as Path A, Step 1)

### Step 2 — Create a Netlify site

1. Sign up at [netlify.com](https://netlify.com).
2. Go to **Add new site → Import an existing project → GitHub**, authorize Netlify, and select the `freescripture` repo.
3. Build settings:

   | Field | Value |
   |---|---|
   | **Branch to deploy** | `main` |
   | **Build command** | `git clone --depth 1 https://github.com/aruljohn/Bible-kjv.git source-kjv && git clone --depth 1 -b 2024 https://github.com/scrollmapper/bible_databases_deuterocanonical.git source-deutero && python3 scripts/build.py` |
   | **Publish directory** | `public` |

4. Click **Deploy site**. First build takes about 90 seconds. You get a `*.netlify.app` preview URL.

### Step 3 — Configure the custom domain

1. In your Netlify site, go to **Domain management → Add custom domain → freescripture.org**.
2. Netlify gives you a CNAME or ALIAS target like `your-site.netlify.app`. Two options for DNS:
   - **Option A:** point your registrar's nameservers at Netlify DNS (`dns1.p01.nsone.net`, etc.) — Netlify handles everything.
   - **Option B:** keep your existing DNS and add an `ALIAS` or `CNAME` record at the apex pointing to Netlify's target. Most registrars support `ALIAS`/`ANAME` records for this.
3. Add a redirect from `www.freescripture.org` to the apex via Netlify's domain settings.
4. Wait 1-5 minutes for SSL provisioning via Let's Encrypt.

### Step 4 — `_redirects` and 404

Netlify reads `public/_redirects` and `public/404.html` automatically. Same as Cloudflare — no extra configuration.

### Step 5 — Submit sitemap (same as Path A, Step 8)

---

## Performance and cost expectations

| Metric | Expected value |
|---|---|
| First build time (cold) | ~90 seconds |
| Subsequent build time | ~75 seconds (the source-data clones dominate) |
| Total deployed size | ~44 MB |
| Page weight per chapter | 35.4 KB (HTML + CSS + JS, fonts via Google CDN) |
| Search index payload | ~1.8 MB gzipped (loaded only on `/search/` page) |
| Free-tier requests/month | Cloudflare Pages: unlimited. Netlify: 100 GB/month bandwidth. |
| Expected cost at any reasonable traffic | $0/month |

This site should comfortably handle 100,000+ monthly visitors on either free tier with no special configuration.

---

## Things to do after launch

These are not blockers, but they're worth doing in the first week:

1. **Test verse-link sharing.** Open `https://freescripture.org/kjv/john/3#v16` and share it on a couple of platforms (iMessage, WhatsApp, Discord, X). The OG image and description should preview correctly.
2. **Test the search bar with common queries.** "John 3:16", "love thy neighbour", "scarecrow in a garden of cucumbers" (the Letter of Jeremiah test), "Tobit 1:1", "ecclesiasticus 24:1" (the Sirach alias).
3. **Tell three people.** Particularly Lutheran folks who know the Apocrypha is missing from most free Bible sites. Word of mouth from people who care about scripture beats SEO for the first hundred users.
4. **Set up email forwarding** for `hello@hopeforamericans.org` so errata reports go somewhere a human reads.
5. **Add an analytics-free visit counter** if curiosity strikes. Cloudflare Pages has a built-in analytics view that doesn't require third-party scripts (no tracking cookies, no third-party JS, no data sold). It just tells you how many people are visiting.

---

## Troubleshooting

**Build fails on Cloudflare Pages with "python3: command not found"**

Cloudflare Pages uses Python 3.12 by default but you may need to set the build environment. In **Settings → Environment variables**, add `PYTHON_VERSION=3.12`. No other dependencies are required.

**Verse anchors don't highlight on first load**

The highlight script runs on `DOMContentLoaded` and on `hashchange`. If a user opens a verse-anchor link in a brand-new tab, both events should fire. If you see a case where they don't, check the browser console for JavaScript errors.

**Search returns no results**

Verify `https://freescripture.org/static/search-index-kjv.json` returns a valid JSON file (not a 404). The build generates one per translation: `search-index-kjv.json`, `search-index-web.json`, `search-index-bbe.json`. If any are missing, the build output directory is wrong.

**Apocrypha pages 404**

Verify `content/apocrypha/` was committed to the repo. The build expects to find parsed JSON files there. If you see only `baruch-6-supplement.json` and no others, the parse step was skipped — re-run `python3 scripts/parse_apocrypha.py` locally and commit the results.

**Want to update a verse?**

The text is sourced from upstream public-domain repositories. To correct an error:

1. Submit the fix upstream to either `aruljohn/Bible-kjv` (canonical) or `scrollmapper/bible_databases_deuterocanonical` (Apocrypha).
2. Wait for the upstream to merge.
3. The next build will pull in the fix automatically.

For typos in our own copy (book intros, About page, footer text), edit `scripts/build.py` directly and push.

---

## Future-proofing

If Cloudflare or Netlify ever raise prices or change terms, the project ports trivially. The whole site is plain static HTML/CSS/JS in the `public/` folder. To migrate to any other static host:

1. Run `python3 scripts/build.py` to produce `public/`.
2. Upload the contents of `public/` to whichever host you prefer (S3, Vercel, GitHub Pages, your own nginx server, etc.).
3. Make sure the new host either reads `_redirects` or has equivalent rewrite rules for `/kjv/<book>/<n>` → `/kjv/<book>/<n>.html`. (Note: the build also writes `<n>/index.html` for each chapter, so most static hosts work without any rewrite configuration at all.)
4. Make sure `404.html` is served on missing paths.

That's it. The project has no lock-in to either Cloudflare or Netlify; both are conveniences, not dependencies.

---

Made with ♥ in Flagstaff, Arizona at 7,000 feet.
