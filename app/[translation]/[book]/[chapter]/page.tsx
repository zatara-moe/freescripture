import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  TRANSLATIONS,
  TRANS_ORDER,
  flatChapters,
  loadChapter,
  bookNameFromSlug,
  bookSlug,
  SITE_URL,
  BOOK_INTROS,
  BOOK_PITCHES,
  NEEDS,
  GENRE_OF,
  type TransSlug,
} from "@/lib/bible";

type Params = { translation: string; book: string; chapter: string };

// ------------------------------------------------------------
// Generate every chapter page across all three translations.
// ------------------------------------------------------------
export function generateStaticParams() {
  const params: Params[] = [];
  for (const trans of TRANS_ORDER) {
    for (const c of flatChapters(trans)) {
      params.push({ translation: trans, book: c.slug, chapter: String(c.num) });
    }
  }
  return params;
}

export const dynamicParams = false;

function refLabel(name: string, num: number): string {
  const label = name === "Psalms" ? "Psalm" : name;
  return `${label} ${num}`;
}

export async function generateMetadata(
  { params }: { params: Promise<Params> }
): Promise<Metadata> {
  const { translation, book, chapter } = await params;
  const trans = translation as TransSlug;
  const tmeta = TRANSLATIONS[trans];
  const name = bookNameFromSlug(trans, book);
  if (!tmeta || !name) return {};
  const num = Number(chapter);
  const title = `${refLabel(name, num)}, ${tmeta.label} (${tmeta.short})`;
  const description = `Read ${refLabel(name, num)} from the ${tmeta.label} online for free. Complete chapter with verse markers.`;
  const url = `${SITE_URL}/${trans}/${book}/${num}/`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article" },
  };
}

export default async function ChapterPage(
  { params }: { params: Promise<Params> }
) {
  const { translation, book, chapter } = await params;
  const trans = translation as TransSlug;
  const tmeta = TRANSLATIONS[trans];
  if (!tmeta) notFound();

  const num = Number(chapter);
  if (!Number.isInteger(num)) notFound();

  const loaded = loadChapter(trans, book, num);
  if (!loaded) notFound();
  const { book: bk, chapter: ch } = loaded;

  // Rough reading-time estimate so readers know what they're starting
  // before they start — helpful when a chapter is Psalm 119, not Psalm 117.
  const wordCount = ch.verses.reduce(
    (sum, v) => sum + v.t.trim().split(/\s+/).filter(Boolean).length,
    0
  );
  const readMinutes = Math.max(1, Math.round(wordCount / 200));

  // prev/next across the flat, canonical sequence for this translation
  const flat = flatChapters(trans);
  const idx = flat.findIndex((c) => c.slug === book && c.num === num);
  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null;

  // within-book prev (for the top nav "Ch n-1" control)
  const withinPrev = ch.num > bk.chapters[0].num ? ch.num - 1 : null;
  const withinNext =
    ch.num < bk.chapters[bk.chapters.length - 1].num ? ch.num + 1 : null;

  // --- Contextual content: what makes this chapter page a destination,
  // not just a document. All of this data already exists in meta.json;
  // it just hasn't been surfaced on the reading page until now.

  // Book intro — the "what am I about to read" framing.
  const bookIntro = BOOK_INTROS[bk.name] || null;

  // Genre link — connects the chapter to its genre landing page.
  const genreSlug = GENRE_OF[bk.name] || null;

  // Need-page cross-references: which Need pages quote a verse from
  // THIS chapter? Turns the dead-end footer into a crossroads.
  const needLinks = NEEDS
    .filter((n: any) =>
      n.passages.some((p: any) => p[0] === bk.name && p[1] === num)
    )
    .map((n: any) => ({
      slug: n.slug,
      short: n.short,
      card: n.card,
    }));

  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Chapter",
        name: `${bk.name} ${num}`,
        description: `${refLabel(bk.name, num)} in the ${tmeta.label} (${tmeta.short}), with all ${ch.verses.length} verses. Free to read online.`,
        url: `${SITE_URL}/${trans}/${book}/${num}/`,
        position: num,
        isPartOf: {
          "@type": "Book",
          name: bk.name,
          url: `${SITE_URL}/${trans}/${book}/`,
          bookEdition: tmeta.label,
          isPartOf: {
            "@type": "Book",
            name: `${tmeta.label} Bible`,
            url: `${SITE_URL}/${trans}/`,
          },
        },
        inLanguage: "en",
        isAccessibleForFree: true,
        publisher: { "@id": "https://freescripture.org/#org" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: tmeta.short, item: `${SITE_URL}/${trans}/` },
          { "@type": "ListItem", position: 2, name: bk.name, item: `${SITE_URL}/${trans}/${book}/` },
          { "@type": "ListItem", position: 3, name: refLabel(bk.name, num), item: `${SITE_URL}/${trans}/${book}/${num}/` },
        ],
      },
    ],
  };

  const lastPayload = JSON.stringify({
    url: `/${trans}/${book}/${num}/`,
    label: refLabel(bk.name, num),
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }}
      />
      <div className="reading-progress" aria-hidden="true">
        <div className="reading-progress__bar"></div>
      </div>
      <div className="tradition-stripe"></div>
      <div className="reading-column">
        <nav className="chapter-nav" aria-label="Chapter navigation">
          <div className="chapter-nav__group">
            <Link href={`/${trans}/${book}/`}>&larr; {bk.name}</Link>
          </div>
          <div className="chapter-nav__current">{refLabel(bk.name, num)}</div>
          <div className="chapter-nav__group">
            {withinPrev !== null && (
              <Link href={`/${trans}/${book}/${withinPrev}/`} rel="prev">
                &larr; Ch {withinPrev}
              </Link>
            )}
            {withinNext !== null && (
              <Link href={`/${trans}/${book}/${withinNext}/`} rel="next">
                Ch {withinNext} &rarr;
              </Link>
            )}
          </div>
        </nav>

        <div className="trans-switch" aria-label="Switch translation">
          <span className="trans-switch__label">Version:</span>
          {TRANS_ORDER.map((t) =>
            t === trans ? (
              <span
                key={t}
                className="trans-switch__btn trans-switch__btn--current"
                aria-current="page"
                title={`${tmeta.label}: ${tmeta.plain}`}
              >
                {tmeta.short}
              </span>
            ) : (
              <Link
                key={t}
                className="trans-switch__btn"
                href={`/${t}/${book}/${num}/`}
                data-trans-switch={t}
                title={`${TRANSLATIONS[t].label}: ${TRANSLATIONS[t].plain}`}
              >
                {TRANSLATIONS[t].short}
              </Link>
            )
          )}
        </div>

        <article>
          <header>
            <div className="chapter-translation-tag">{tmeta.label}</div>
            <div className="chapter-title-row">
              <h1 className="chapter-title">{refLabel(bk.name, num)}</h1>
              <button className="reading-settings-btn" type="button" data-prefs-open aria-label="Reading settings: text size, spacing, and font">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 7h11" /><path d="M4 12h16" /><path d="M4 17h7" /><circle cx="18" cy="7" r="2" /><circle cx="13" cy="17" r="2" />
                </svg>
                <span>Display</span>
              </button>
            </div>
          </header>

          {bookIntro && (
            <div className="chapter-context">
              <div className="chapter-context__label">About {bk.name}</div>
              <p>{bookIntro}</p>
            </div>
          )}

          <div className="chapter-meta-row">
            <p className="chapter-meta">
              {ch.verses.length} verse{ch.verses.length === 1 ? "" : "s"} · ~{readMinutes} min read
            </p>
            {ch.verses.length > 20 && (
              <div className="chapter-jump">
                <label htmlFor="verse-jump">Jump to verse</label>
                <select id="verse-jump" data-verse-jump aria-label="Jump to verse" defaultValue="">
                  <option value="" disabled>
                    Verse…
                  </option>
                  {ch.verses.map((v) => (
                    <option key={v.v} value={v.v}>
                      {v.v}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="chapter-toggles">
            <div className="layout-toggle" role="group" aria-label="Verse layout">
              <button
                type="button"
                className="layout-toggle__btn"
                data-fs-quick="layout"
                data-val="verses"
                aria-pressed="true"
              >
                Lines
              </button>
              <button
                type="button"
                className="layout-toggle__btn"
                data-fs-quick="layout"
                data-val="flowing"
                aria-pressed="false"
              >
                Flowing
              </button>
            </div>
            <div className="layout-toggle" role="group" aria-label="Focus mode: hide navigation while reading">
              <button
                type="button"
                className="layout-toggle__btn"
                data-fs-quick="focus"
                data-val="off"
                aria-pressed="true"
              >
                Normal
              </button>
              <button
                type="button"
                className="layout-toggle__btn"
                data-fs-quick="focus"
                data-val="on"
                aria-pressed="false"
              >
                Focus
              </button>
            </div>
          </div>

          <button
            type="button"
            className="focus-exit"
            data-fs-quick="focus"
            data-val="off"
            aria-label="Exit focus mode"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18" /><path d="M6 6l12 12" />
            </svg>
            Exit Focus
          </button>

          <div className="chapter-text" lang="en">
            {ch.verses.map((v) => (
              <p className="verse" id={`v${v.v}`} key={v.v}>
                <a href={`#v${v.v}`} className="verse__num" aria-label={`Verse ${v.v}`}>
                  {v.v}
                </a>
                <span className="verse__body">{v.t}</span>
              </p>
            ))}
          </div>

          <p className="chapter-complete">You&rsquo;ve read {refLabel(bk.name, num)}.</p>

          <div className="chapter-actions" role="group" aria-label="Chapter actions">
            <button className="action-btn" data-action="tts" aria-pressed="false">
              <svg className="action-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5 6 9H2v6h4l5 4z" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
              <span className="action-btn__text">Listen</span>
            </button>
            <button className="action-btn" data-action="share">
              <svg className="action-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
              <span className="action-btn__text">Share</span>
            </button>
            <button className="action-btn" data-action="copy-link">
              <svg className="action-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
              <span className="action-btn__text">Copy link</span>
            </button>
          </div>

          <div className="keep-reading">
            <div className="keep-reading__heading">Keep reading</div>
            <div className="keep-reading__links">
              {needLinks.map((n) => (
                <Link key={n.slug} className="keep-reading__link" href={`/read/${n.slug}/`}>
                  <span className="keep-reading__link-label">{n.short}</span>
                  <span className="keep-reading__link-desc">{n.card}</span>
                </Link>
              ))}
              {genreSlug && (
                <Link className="keep-reading__link" href={`/genre/${genreSlug}/`}>
                  <span className="keep-reading__link-label">More {genreSlug} books</span>
                  <span className="keep-reading__link-desc">
                    Other books in the Bible that read like {bk.name}
                  </span>
                </Link>
              )}
              {/* DLC cross-links: contextual, not generic. Psalms → pray,
                  Gospels → this Sunday's readings, pastoral books → what do you need. */}
              {bk.name === "Psalms" && (
                <a className="keep-reading__link" href="https://www.digitallutheranchurch.com/pray/" rel="noopener">
                  <span className="keep-reading__link-label">Pray with the psalms</span>
                  <span className="keep-reading__link-desc">
                    Daily prayer offices at Digital Lutheran Church
                  </span>
                </a>
              )}
              {["Matthew", "Mark", "Luke", "John"].includes(bk.name) && (
                <a className="keep-reading__link" href="https://www.digitallutheranchurch.com/word/propers" rel="noopener">
                  <span className="keep-reading__link-label">This Sunday&apos;s readings</span>
                  <span className="keep-reading__link-desc">
                    The lectionary at Digital Lutheran Church
                  </span>
                </a>
              )}
            </div>
          </div>

          <footer className="chapter-foot">
            <nav className="chapter-foot__nav" aria-label="Adjacent chapters">
              {prev ? (
                <Link href={`/${trans}/${prev.slug}/${prev.num}/`}>
                  <span className="arrow">&larr; Previous</span>
                  <span className="label">{refLabel(prev.name, prev.num)}</span>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link href={`/${trans}/${next.slug}/${next.num}/`} className="next">
                  <span className="arrow">Next &rarr;</span>
                  <span className="label">{refLabel(next.name, next.num)}</span>
                </Link>
              ) : (
                <span />
              )}
            </nav>
          </footer>
        </article>
      </div>

      <script src="/static/js/chapter.js?v=8" defer></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `try{localStorage.setItem('fs-last',JSON.stringify(${lastPayload}));}catch(e){}`,
        }}
      />
    </>
  );
}
