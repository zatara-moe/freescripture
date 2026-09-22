# Free Scripture

A free static Bible reader in three public-domain translations: World English Bible
(default), King James Version (with Apocrypha), and Bible in Basic English.

Built with Next.js 15, App Router, static export. Every page is prerendered to plain
HTML. No server, no database.

## How it works

- Verse data lives in `data/bible/<translation>.json` (one file per translation, keyed by
  book slug), with `data/manifest.json` listing every book and its chapters. One file per
  translation keeps the whole repo under GitHub's 100-file web upload limit.
- One dynamic route, `app/[translation]/[book]/[chapter]/page.tsx`, generates every
  chapter page via `generateStaticParams`.
- `next.config.js` sets `output: 'export'` and `trailingSlash: true`. The build writes
  a fully static site to `out/`.

## Deploy (Vercel + GitHub)

Push to GitHub. Vercel auto-detects Next.js and builds. Nothing to configure.

- Framework preset: Next.js (auto-detected)
- No output directory override needed (Vercel reads `output: 'export'`)
- No build command override needed

That's the whole deploy. Vercel builds fresh from source every push, so there are no
stale files to manage and no folder to delete-and-replace.

## Local

    npm install
    npm run dev      # http://localhost:3000
    npm run build    # writes static site to out/

## Add or update a translation

Add the translation's books to `data/bible/<slug>.json`, add the books to
`data/manifest.json`, and add the translation to `lib/meta.json`. Rebuild.

## Data shape

`data/bible/web.json` holds every book, keyed by slug:

    { "genesis": { "name": "Genesis", "slug": "genesis", "translation": "web",
      "chapters": [ { "num": 1, "verses": [ { "v": 1, "t": "In the beginning..." } ] } ] }, ... }

## Updating the site from the GitHub website

The whole repo is under 100 files, so it always fits in one upload.
Drag new files or folders onto the repo; GitHub replaces files with the
same name and leaves everything else alone. Don't delete folders first.

## Static files live in lib/static-assets/

There is no public/ folder. The stylesheet, scripts, icons, search
indexes, service worker, and manifest are stored in lib/static-assets/
and published at their usual addresses (/static/css/site.css, /sw.js,
and so on) by small route files in app/. This keeps every file inside
folders that GitHub accepts.
