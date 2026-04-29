# freescripture.org

A free, beautifully presented online library of scripture. Phase 3a ships **three public-domain English translations** of the Christian Bible:

- **King James Version (1769)** with the complete 1611 Apocrypha — 80 books, 1,362 chapters, 36,923 verses
- **World English Bible (2000)** — modern English, 66 books, 1,189 chapters, 31,103 verses
- **Bible in Basic English (1949)** — accessible vocabulary (~1,000 common words), 66 books, 1,189 chapters, 31,102 verses

Total: **99,128 verses across 3,740 chapter pages.** Each chapter has a translation switcher at the top that preserves the verse anchor when you toggle.

A project of **Hope for Americans**, a ministry of Shepherd of the Hills Lutheran Church in Flagstaff, Arizona. Sister project to [Fablepixels](https://fablepixels.com).

---

## What is in this repository

```
freescripture/
├── source-kjv/            Public-domain KJV JSON (cloned from aruljohn/Bible-kjv)
├── source-deutero/        Public-domain Apocrypha (cloned from scrollmapper/bible_databases_deuterocanonical, 2024 branch)
├── content/
│   └── apocrypha/         Parsed Apocrypha JSON in our standard format (committed; no need to re-run)
├── scripts/
│   ├── build.py           Single Python script — generates the entire static site
│   └── parse_apocrypha.py Run once to convert source-deutero/txt/* into content/apocrypha/*.json
├── static/
│   ├── css/site.css       Master design system (parchment palette, tradition accents)
│   └── js/
│       ├── chapter.js     TTS, copy-link, verse anchor highlighting
│       └── search.js      Verse-reference parser (KJV+Apocrypha aware) + KJV-aware phrase search
├── public/                Generated output — deploy this folder
└── README.md              You are here
```

The project has **no build tooling, no npm, no framework, no compile step beyond running one Python script**. This is intentional. It can be hosted on any static host (Cloudflare Pages, Netlify, Vercel, GitHub Pages, S3) with no configuration.

---

## How to build

```bash
# Get the source data once
git clone --depth 1 https://github.com/aruljohn/Bible-kjv.git source-kjv
git clone --depth 1 -b 2024 https://github.com/scrollmapper/bible_databases_deuterocanonical.git source-deutero

# One-time: parse the Apocrypha source into our JSON format
python3 scripts/parse_apocrypha.py

# Build the site (run anytime)
python3 scripts/build.py

# Preview locally
cd public && python3 -m http.server 8000
# then open http://localhost:8000
```

The build takes ~12 seconds and produces:
- 1 homepage
- 1 Christian-tradition landing
- 1 KJV translation landing  
- **80 book landing pages** (66 canonical + 14 Apocrypha)
- **1,362 chapter pages** (each at both `/kjv/<book>/<n>` and `/kjv/<book>/<n>.html`)
- 1 search page + a 6 MB search index (~1.8 MB gzipped on the wire)
- 1 about page, 1 support page
- `robots.txt`, `llms.txt`, `sitemap.xml`, `_redirects`

Total output size: ~44 MB. Single chapter page weight: **35.4 KB** (well under the 200 KB target).

---

## What's in the library

### Old Testament (66 → 39 books in Christian numbering)

Genesis through Malachi, organized in five sections: Law, History, Wisdom & Poetry, Major Prophets, Minor Prophets.

### Apocrypha (14 books — the 1611 KJV / Lutheran arrangement)

Placed between OT and NT exactly as in the original 1611 King James Bible:

- **Historical**: 1 Esdras, 2 Esdras, Tobit, Judith, Esther (Greek), 1 Maccabees, 2 Maccabees
- **Wisdom**: Wisdom of Solomon, Sirach
- **Prophetic**: Baruch (all 6 chapters, including the Letter of Jeremiah as ch. 6, in the 1611 KJV arrangement)
- **Additions to Daniel**: The Song of the Three Holy Children, Susanna, Bel and the Dragon
- **Prayer**: Prayer of Manasseh

The Apocrypha text is in the **1611 KJV translation** (sourced from the Scrollmapper Deuterocanonical Project). The translation tag on each chapter reads "King James Version · Apocrypha" so readers know what they're looking at.

### New Testament (27 books)

Matthew through Revelation, organized: Gospels, Early Church (Acts), Pauline Epistles, General Epistles, Apocalyptic.

---

## Design system

Inherited from Fablepixels:

| Token | Value |
|-------|-------|
| Paper | `#f4ecd8` |
| Ink | `#2a1f15` |
| Rule | `#c9b88a` |
| Display font | Cormorant Garamond italic |
| Body font | Crimson Pro |
| UI font | DM Mono |

Tradition accents (used sparingly, only for the top stripe on chapter pages and tradition-card borders):

| Tradition | Accent |
|-----------|--------|
| Christian | `#8B6914` (warm gold) |
| Islamic | `#0F6E56` (deep teal) |
| LDS | `#185FA5` (deep blue) |
| Jewish | `#3C3489` (indigo) |
| Buddhist | `#BA7517` (saffron) |
| Hindu | `#993C1D` (warm coral) |
| Sikh | `#854F0B` (amber) |

---

## URL structure

```
/                              homepage
/christian/                    Christian library landing (KJV + WEB-coming + Apocrypha)
/kjv/                          KJV book index (OT / Apocrypha / NT, anchored)
/kjv/genesis/                  Genesis (chapter list)
/kjv/genesis/1                 Genesis 1 (full chapter)
/kjv/john/3#v16                John 3:16 (anchored, highlighted)
/kjv/tobit/                    Tobit (book landing)
/kjv/tobit/1                   Tobit chapter 1
/kjv/wisdom-of-solomon/7#v25   Wisdom of Solomon 7:25
/kjv/prayer-of-manasseh/1      Prayer of Manasseh (single chapter)
/kjv/esther-greek/             Esther (Greek) — chapters 10–16, per 1611 KJV
/kjv/1-maccabees/4#v36         1 Maccabees 4:36 (Hanukkah verse)
/search/                       universal search
/about/                        mission and source notes
/support/                      donation page
```

Every chapter is accessible at both `/kjv/<book>/<n>` and `/kjv/<book>/<n>.html` for maximum host compatibility. The `_redirects` file additionally maps extensionless URLs to the `.html` version for Netlify/Cloudflare Pages.

---

## Search

Client-side, no backend. The build script generates **one search index per translation** — `/static/search-index-kjv.json`, `search-index-web.json`, `search-index-bbe.json` — each containing one entry per verse in that translation. The search page loads only the index for the currently-selected translation, then caches it in memory for instant subsequent searches.

Real-world download sizes (gzipped, what browsers actually transfer):

| Translation | Entries | Raw | Gzipped |
|---|---|---|---|
| KJV (with Apocrypha) | 36,923 | 5.94 MB | 1.57 MB |
| WEB | 31,103 | 4.89 MB | 1.29 MB |
| BBE | 31,102 | 5.03 MB | 1.27 MB |

Per-translation indexes were chosen over a single combined index (which would have been ~17 MB raw / ~4.3 MB gzipped) specifically to make search usable on slow connections — a slow-3G phone now downloads ~1.3 MB to search BBE rather than 4.3 MB combined. On a static host this works without configuration: each file is independently cached by the CDN edge, by Cloudflare, by the user's browser.

The search supports two modes:

1. **Verse references** — `John 3:16`, `1 Cor 13:4`, `Psalms 23`, `jn 3:16`, `Tobit 1:1`, `1 Maccabees 4:36`, `Sirach 24:1`, `Wisdom 7:25`, etc., redirect directly to the chapter and verse anchor. Both canonical and Apocrypha books are recognized, with their common abbreviations.
2. **Phrase search** — full-text search across all 36,923 verses (across canonical + Apocrypha) with KJV-aware substitution: typing "love your neighbour" also matches "love thy neighbour" because the search knows the KJV uses archaic English (thou/thee/thy/thine, hast/hath, doth, etc.).

---

## Accessibility commitments

- `prefers-reduced-motion` respected throughout
- Skip-to-content link
- Semantic landmarks (`<nav>`, `<main>`, `<footer>`, `<article>`)
- 44px minimum touch targets on every button
- Focus-visible outlines
- Verses are independently anchorable (`#v16` jumps to and highlights verse 16)
- Print stylesheet for those who still print scripture

---

## Source attribution

The KJV canonical text comes from [`aruljohn/Bible-kjv`](https://github.com/aruljohn/Bible-kjv) on GitHub, which is in the public domain. The KJV is in the public domain in the United States and most of the world. (Crown copyright applies in the United Kingdom only.)

The 1611 Apocrypha text comes from two public-domain GitHub sources combined:

1. Books 1 Esdras through 2 Maccabees (excluding Baruch ch. 6) come from the [Scrollmapper Deuterocanonical Project](https://github.com/scrollmapper/bible_databases_deuterocanonical) (2024 branch).
2. The Letter of Jeremiah (Baruch chapter 6) comes from the [Scrollmapper Bible Databases KJVA dataset](https://github.com/scrollmapper/bible_databases) (2025 branch). It is stored at `content/apocrypha/baruch-6-supplement.json` and merged into Baruch at build time by `load_book()` in build.py.

Both sources preserve the 1611 King James translation. The build script (`load_book`) automatically merges any `*-supplement.json` file in `content/apocrypha/` into its target book — so future supplements (additional translations, missing chapters, etc.) can be added by writing a new supplement file without changing the parser.

---

## Reading preferences (Phase 3a addendum)

Every chapter page has a small floating "Reading" button (bottom-right) that opens a panel with five toggles:

| Toggle | Options | Default |
|---|---|---|
| **Font** | Default (serif) / Sans (Lexend) / OpenDyslexic | Default |
| **Text size** | Smaller / Default / Larger / Largest | Default |
| **Line spacing** | Default / Generous (1.9) / Roomy (2.3) | Default |
| **Layout** | Flowing paragraphs / One verse per line | Flowing |
| **Italics for translator additions** | On / Off | On |

These are **opt-in reading affordances** — not labeled "accessibility mode" or "for autistic readers." The intent is the same as a font-size slider on an ereader: any reader who finds them useful can use them. They serve neurodivergent readers, dyslexic readers, ESL readers, older readers, and anyone reading on a phone in low light, without singling out any group.

Preferences persist across the site via `localStorage` (key: `fs-prefs`). They apply to all translations. They reset with one click.

Implementation:
- `static/js/reading-prefs.js` — the panel UI, toggle handlers, and localStorage persistence
- `static/css/site.css` — applies CSS rules based on `data-fs-*` attributes set on `<html>`
- An inline script in the `<head>` of every page applies saved preferences before render to avoid a flash of unstyled content
- OpenDyslexic is fetched from jsDelivr CDN only when selected — zero cost for readers who don't use it
- Lexend is loaded via Google Fonts as part of the standard font bundle

The design is evidence-based where possible. The 2024 PMC research on OpenDyslexic shows mixed measurable benefit, but many dyslexic readers report it *feels* easier to read; we offer it as a secondary option behind a regular sans-serif default (Lexend) which has stronger research support. Per-verse layout is offered as opt-in only — not default — because visual fragmentation of paragraphs can reinforce literal-only readings of passages that were written as flowing rhetoric.

---

## What's coming

Phase 2 candidates (in rough priority order):

1. The World English Bible (WEB) — modern English, public domain — as a translation switcher option for the same chapters.
2. The Quran — Pickthall English (public domain) plus Arabic (Tanzil.net Uthmani text).
3. The Tanakh — JPS 1917 English plus Hebrew.
4. The Bhagavad Gita and the Dhammapada (public domain English translations).

---

## Trust commitments

These appear in the footer of every page and are the operating principles of the project:

- **Free forever** — no paywall, ever
- **No account needed** — no signup, no email capture, no profile
- **No ads** — never
- **No data sold** — no tracking, no analytics, no third-party scripts

If you find this project useful, you can support it at [/support/](https://freescripture.org/support/), but you owe nothing for its use.

Made with ♥ in Flagstaff, Arizona at 7,000 feet.
