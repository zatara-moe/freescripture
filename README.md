# Free Scripture

A free static Bible reader in three public-domain translations: World English Bible
(default), King James Version (with Apocrypha), and Bible in Basic English.

Built with Next.js 15, App Router, static export. Every page is prerendered to plain
HTML. No server, no database.

## How it works

- Verse data lives in `data/books/<translation>/<book>.json`, with `data/manifest.json`
  listing every book and its chapters. This is the single source of truth.
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

Drop a per-book JSON file into `data/books/<slug>/`, add the books to
`data/manifest.json`, and add the translation to `lib/meta.json`. Rebuild.

## Data shape

`data/books/web/genesis.json`:

    { "name": "Genesis", "slug": "genesis", "translation": "web",
      "chapters": [ { "num": 1, "verses": [ { "v": 1, "t": "In the beginning..." } ] } ] }
