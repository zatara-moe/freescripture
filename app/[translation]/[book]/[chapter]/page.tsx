import { notFound } from "next/navigation";
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
import { storiesForChapter, compareHref, storyMinutes, isReadable, nw } from "@/lib/stories";
import { eraOfPassage, partOfEra, eraCenter } from "@/lib/timeline";
import { Bands } from "@/lib/TimelineBands";

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

  // Scene by Scene stories that retell this chapter.
  const chapterStories = storiesForChapter(book, num);
  // Where this chapter sits on the Bible timeline (null for books it doesn't place).
  const era = eraOfPassage({ book, chapter: num });
  const part = era ? partOfEra(era) : null;
  const canCompare = !!loadChapter("web", book, num);

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
      <div className="reading-column reading-column--rail">
        {/* The rail: everything for finding your way and changing how you read.
            Wide screens show it to the left of the text. Narrower screens show
            it above the text, as a compact toolbar. */}
        <aside className="rail" aria-label="Chapter tools">
          <nav className="rail__crumb" aria-label="Breadcrumb">
            <a href={`/${trans}/${book}/`}>&larr; {bk.name}</a>
          </nav>

          <div className="bigstrip rail__where">
            {era && part && (
              <>
                <Bands mini here={eraCenter(era)} />
                <span className="bigstrip__kicker"><a href={`/timeline/#${era.id}`}>Bible timeline</a></span>
                <span className="bigstrip__label">Part {part.n} of 4: {part.name} · <a href={`/timeline/#${era.id}`}>{nw(era.title, 20)}</a></span>
              </>
            )}
            <nav className="bigstrip__nav" aria-label="Chapters">
              {prev ? (
                <a className="bigstrip__link bigstrip__link--before" href={`/${trans}/${prev.slug}/${prev.num}/`} rel="prev">
                  <span className="bigstrip__dir">&lsaquo; Previous</span>
                  <span className="bigstrip__name">{refLabel(prev.name, prev.num)}</span>
                </a>
              ) : <span />}
              {next ? (
                <a className="bigstrip__link bigstrip__link--after" href={`/${trans}/${next.slug}/${next.num}/`} rel="next">
                  <span className="bigstrip__dir">Next &rsaquo;</span>
                  <span className="bigstrip__name">{refLabel(next.name, next.num)}</span>
                </a>
              ) : <span />}
            </nav>
          </div>

          {/* Translation: a full list on wide screens, a short menu on narrow ones. */}
          <div className="rail__group rail__trans" role="group" aria-label="Translation">
            <p className="rail__label">Translation</p>
            <ul className="trans-list">
              {TRANS_ORDER.map((t) => (
                <li key={t}>
                  {t === trans ? (
                    <span className="trans-list__item is-on" aria-current="page">
                      <span className="trans-list__check" aria-hidden="true">✓</span>
                      {TRANSLATIONS[t].nick} <span className="trans-list__abbr">{TRANSLATIONS[t].short}</span>
                    </span>
                  ) : (
                    <a className="trans-list__item" href={`/${t}/${book}/${num}/`} data-trans-switch={t} title={`${TRANSLATIONS[t].label}: ${TRANSLATIONS[t].plain}`}>
                      <span className="trans-list__check" aria-hidden="true"></span>
                      {TRANSLATIONS[t].nick} <span className="trans-list__abbr">{TRANSLATIONS[t].short}</span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="rail__group rail__tools">
            <details className="trans-menu">
              <summary className="rail-btn">Translation: {tmeta.nick} <span className="trans-list__abbr">{tmeta.short}</span></summary>
              <ul className="trans-menu__list">
                {TRANS_ORDER.map((t) => (
                  <li key={t}>
                    {t === trans ? (
                      <span className="trans-list__item is-on" aria-current="page"><span className="trans-list__check" aria-hidden="true">✓</span>{TRANSLATIONS[t].nick} <span className="trans-list__abbr">{TRANSLATIONS[t].short}</span></span>
                    ) : (
                      <a className="trans-list__item" href={`/${t}/${book}/${num}/`} data-trans-switch={t}><span className="trans-list__check" aria-hidden="true"></span>{TRANSLATIONS[t].nick} <span className="trans-list__abbr">{TRANSLATIONS[t].short}</span></a>
                    )}
                  </li>
                ))}
              </ul>
            </details>
            {canCompare && (
              <a className="rail-btn" href={`/compare/${book}/${num}/?a=${trans}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="7.5" height="16" rx="1.5" /><rect x="13.5" y="4" width="7.5" height="16" rx="1.5" /></svg>
                Side by side
              </a>
            )}
            <button
              type="button"
              className="rail-btn chapter-focus-btn"
              data-fs-quick="focus"
              data-val="on"
              aria-pressed="false"
              title="Focus (G): hide everything but the text"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" /></svg>
              Focus
            </button>
            {ch.verses.length > 20 && (
              <label className="rail-btn rail-jump" htmlFor="verse-jump">
                <span>Go to verse</span>
                <select id="verse-jump" data-verse-jump defaultValue="">
                  <option value="" disabled>Verse</option>
                  {ch.verses.map((v) => (
                    <option key={v.v} value={v.v}>{v.v}</option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {chapterStories.map((st) => {
            const min = isReadable(st) ? storyMinutes(st.slug) : null;
            return (
              <div className="chapter-story rail-card" key={st.slug}>
                <p className="rail-card__kicker">
                  {st.kind === "Teaching" ? "Teaching" : "Story"} · {st.ref}{min ? ` · About ${min} min` : ""}
                  {st.status === "early" && <span className="badge badge--new">New</span>}
                </p>
                <p className="rail-card__title">{st.title}</p>
                <p className="rail-card__line">{st.subtitle}. Retold in plain words, one scene at a time.</p>
                <div className="rail-card__acts">
                  <a className="btn btn--primary" href={`/stories/${st.slug}/`}>Read the story</a>
                  <a className="btn btn--line" href={compareHref(st, trans)}>Read both side by side</a>
                </div>
              </div>
            );
          })}

          {bookIntro && (
            <details className="tl-acc chapter-context">
              <summary><span className="tl-acc__icon" aria-hidden="true"></span>About {bk.name}<span className="tl-acc__act" aria-hidden="true"></span></summary>
              <div className="tl-acc__body"><p>{bookIntro}</p></div>
            </details>
          )}
        </aside>

        <article className="rail-text">
          <header>
            <div className="chapter-translation-tag">{tmeta.label}</div>
            <h1 className="chapter-title">{refLabel(bk.name, num)}</h1>
            <p className="chapter-meta">
              {ch.verses.length} verse{ch.verses.length === 1 ? "" : "s"} · About {readMinutes} min
            </p>
          </header>

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
                <a key={n.slug} className="keep-reading__link" href={`/read/${n.slug}/`}>
                  <span className="keep-reading__link-label">{n.short}</span>
                  <span className="keep-reading__link-desc">{n.card}</span>
                </a>
              ))}
              {genreSlug && (
                <a className="keep-reading__link" href={`/genre/${genreSlug}/`}>
                  <span className="keep-reading__link-label">More {genreSlug} books</span>
                  <span className="keep-reading__link-desc">
                    Other books in the Bible that read like {bk.name}
                  </span>
                </a>
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
                <a className="keep-reading__link" href="/parables/">
                  <span className="keep-reading__link-label">The parables of Jesus</span>
                  <span className="keep-reading__link-desc">
                    All 37, sorted by what they are about
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
                <a href={`/${trans}/${prev.slug}/${prev.num}/`}>
                  <span className="arrow">&larr; Previous</span>
                  <span className="label">{refLabel(prev.name, prev.num)}</span>
                </a>
              ) : (
                <span />
              )}
              {next ? (
                <a href={`/${trans}/${next.slug}/${next.num}/`} className="next">
                  <span className="arrow">Next chapter</span>
                  <span className="label">{refLabel(next.name, next.num)}</span>
                </a>
              ) : (
                <span />
              )}
            </nav>
          </footer>
        </article>
      </div>

      <script src="/static/js/chapter.js?v=9" defer></script>
      <script src="/static/js/pages.js?v=2" defer></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `try{localStorage.setItem('fs-last',JSON.stringify(${lastPayload}));}catch(e){}`,
        }}
      />
    </>
  );
}
