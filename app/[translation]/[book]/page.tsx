import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  TRANSLATIONS,
  TRANS_ORDER,
  booksForTranslation,
  loadBook,
  bookNameFromSlug,
  BOOK_INTROS,
  BOOK_PITCHES,
  SITE_URL,
  type TransSlug,
} from "@/lib/bible";
import { JsonLd } from "@/lib/JsonLd";
import { readableStories, storyMinutes } from "@/lib/stories";
import { Dots } from "@/lib/Meta";

type Params = { translation: string; book: string };

export function generateStaticParams() {
  const params: Params[] = [];
  for (const trans of TRANS_ORDER) {
    for (const b of booksForTranslation(trans)) {
      params.push({ translation: trans, book: b.slug });
    }
  }
  return params;
}

export const dynamicParams = false;

export async function generateMetadata(
  { params }: { params: Promise<Params> }
): Promise<Metadata> {
  const { translation, book } = await params;
  const trans = translation as TransSlug;
  const tmeta = TRANSLATIONS[trans];
  const name = bookNameFromSlug(trans, book);
  if (!tmeta || !name) return {};
  const pitch = BOOK_PITCHES[name] || BOOK_INTROS[name] || "";
  const title = `${name}, ${tmeta.label} (${tmeta.short})`;
  const description =
    `Read the book of ${name} from the ${tmeta.label} online for free. All chapters.` +
    (pitch ? ` ${pitch}` : "");
  const url = `${SITE_URL}/${trans}/${book}/`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "book" },
  };
}

export default async function BookLanding(
  { params }: { params: Promise<Params> }
) {
  const { translation, book } = await params;
  const trans = translation as TransSlug;
  const tmeta = TRANSLATIONS[trans];
  if (!tmeta) notFound();
  const bk = loadBook(trans, book);
  if (!bk) notFound();

  const intro = BOOK_INTROS[bk.name] || BOOK_PITCHES[bk.name] || "";
  const pitch = BOOK_PITCHES[bk.name] || BOOK_INTROS[bk.name] || "";

  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Book",
        name: bk.name,
        url: `${SITE_URL}/${trans}/${book}/`,
        description: pitch,
        bookEdition: tmeta.label,
        numberOfPages: bk.chapters.length,
        isPartOf: {
          "@type": "Book",
          name: `${tmeta.label} Bible`,
          url: `${SITE_URL}/${trans}/`,
        },
        inLanguage: "en",
        isAccessibleForFree: true,
        publisher: { "@id": "https://freescripture.org/#org" },
        hasPart: bk.chapters.map((c) => ({
          "@type": "Chapter",
          name: `${bk.name} ${c.num}`,
          url: `${SITE_URL}/${trans}/${book}/${c.num}/`,
          position: c.num,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: tmeta.short, item: `${SITE_URL}/${trans}/` },
          { "@type": "ListItem", position: 2, name: bk.name, item: `${SITE_URL}/${trans}/${book}/` },
        ],
      },
    ],
  };

  return (
    <div className="reading-column book-landing">
      <JsonLd data={jsonld} />
      <nav className="chapter-nav" aria-label="Navigation">
        <div className="chapter-nav__group">
          <a href={`/${trans}/`}>&larr; {tmeta.label}</a>
        </div>
        <div className="chapter-nav__current">{bk.name}</div>
        <div className="chapter-nav__group" />
      </nav>

      <div className="bible-vers bible-vers--book" role="group" aria-label="Choose a translation">
        <span className="bible-vers__label">Translation:</span>
        {TRANS_ORDER.filter((t) => t === trans || bookNameFromSlug(t, book)).map((t) =>
          t === trans ? (
            <span key={t} className="bible-vers__btn is-on" aria-current="page">{TRANSLATIONS[t].nick} <abbr>{TRANSLATIONS[t].short}</abbr></span>
          ) : (
            <a key={t} className="bible-vers__btn" href={`/${t}/${book}/`} title={`${TRANSLATIONS[t].label}: ${TRANSLATIONS[t].plain}`}>{TRANSLATIONS[t].nick} <abbr>{TRANSLATIONS[t].short}</abbr></a>
          )
        )}
      </div>

      <header className="book-head">
        <h1 className="book-title">{bk.name}</h1>
        {intro && <p className="book-intro">{intro}</p>}
      </header>

      {(() => {
        const sts = readableStories().filter((st) => st.passage.book === book).sort((a, b) => a.passage.chapter - b.passage.chapter);
        if (!sts.length) return null;
        return (
          <section className="book-stories" aria-labelledby="book-stories-title">
            <h2 className="book-chapters-label" id="book-stories-title">Stories from {bk.name}, in plain words</h2>
            <ul className="book-stories__list">
              {sts.map((st) => (
                <li key={st.slug}>
                  <a className="next-row" href={`/stories/${st.slug}/`}>
                    <span className="next-row__kicker"><Dots parts={[st.ref, storyMinutes(st.slug) ? `About ${storyMinutes(st.slug)} min` : ""]} /></span>
                    <span className="next-row__title">{st.title}</span>
                    <span className="next-row__meta">{st.subtitle}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        );
      })()}

      <h2 className="book-chapters-label">Chapters</h2>
      <ul className="chapter-grid">
        {bk.chapters.map((c) => (
          <li key={c.num}>
            <a href={`/${trans}/${book}/${c.num}/`}>{c.num}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
