# Free Scripture

The Bible, one scene at a time. Scene by Scene stories explained in plain words,
with the Bible verse beside every paragraph, plus the full Bible in four
public-domain translations: Berean Standard Bible (default, and the base text
for the stories), World English Bible, King James Version (with Apocrypha),
and Bible in Basic English.

## The four places (same on phone and desktop)

- Home: your next step, a place to start, and everything on the site.
- Stories (/stories/): stories, parables, and verses for how you feel, in one
  list with filters (feeling, kind, length). A preview shows what's inside first.
- Full Bible (/bsb/): the text itself, word for word.
- Memorize (/memorize/): lines saved on the reader's own device.

## Adding a story

See the notes at the top of lib/stories.ts. Write the story in the Scene by
Scene Style Guide format, save it in data/stories/, end each retelling
paragraph with its verses like {v: 5:3}, and add a `memorize` line.
Hard words for Word help live in lib/words.ts.

The Bible timeline (/timeline/) lives in lib/timeline.ts: 4 parts and 11 eras, with
key events, people, places, and every book. It is the one system the site uses to say
where something fits: the timeline page, the Big Story on the Stories page, and the strip
on every story page. A story finds its part from its passage automatically
(eraOfPassage), so a new story needs no extra setting. The page works without
JavaScript. timeline.js (lib/static-assets/static/js/) makes it one part at a time.

Reading paths live in lib/paths.ts. Each path is a short list of story slugs, each with
one line saying what that story shows. The path page is /paths/<slug>/. A story counts
as done when the reader reaches its Memorize step. Progress is saved on the device only.

How a story page is arranged (from the student and pastor reviews, Sept 2026):

- **Story** opens at Scene 1. The Scene Card, Before the Story, and Map boxes sit in a
  closed "Who's who and what came before" drawer.
- Stories with a Story step of 7+ minutes get a "Halfway there" break.
- **For you** shows `## 🙋 Your Turn` first. Write it as a bold question, then a list of
  choices, each as `- Choice :: What we say back`. Keep choices under 5 words.
- "From Luther" and "In Church" go in a closed "For leaders and parents" drawer, with a
  link to the note on Luther and the Jewish people (About page).
- Reading times are counted from what is visible, at 150 words a minute.
- Use "Scene" for every story, including teachings. Never write "Notice," "Remember,"
  or "Picture it" at the start of a line. Cite sources for any Luther quote or number.

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
