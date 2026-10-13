import { notFound } from "next/navigation";
import { OG_DEFAULT } from "@/lib/og/card";
import type { Metadata } from "next";
import { pullVerse, bookSlug, testamentOf, DEFAULT_TRANS, SITE_URL } from "@/lib/bible";
import { JsonLd } from "@/lib/JsonLd";
import verseIndex from "@/lib/verse-index.json";

type Params = { ref: string };

// ref is "chapter-verse", e.g. "3-22" for chapter 3, verse 22.
function parseRef(ref: string): { chapter: number; verse: number } | null {
  const m = ref.match(/^(\d{1,3})-(\d{1,3})$/);
  if (!m) return null;
  return { chapter: parseInt(m[1], 10), verse: parseInt(m[2], 10) };
}

/* References people almost always mean when they type the bare numbers.
   These go first; everything else stays in Bible order. */
const MOST_MEANT: Record<string, string> = { "3:16": "John", "23:1": "Psalms", "29:11": "Jeremiah", "8:28": "Romans" };

function lookup(chapter: number, verse: number): string[] {
  const key = `${chapter}:${verse}`;
  const list = [...((verseIndex as Record<string, string[]>)[key] || [])];
  const want = MOST_MEANT[key];
  const i = want ? list.indexOf(want) : -1;
  if (i > 0) { list.splice(i, 1); list.unshift(want); }
  return list;
}

export function generateStaticParams() {
  const keys = Object.keys(verseIndex as Record<string, string[]>);
  return keys.map((k) => {
    const [chapter, verse] = k.split(":");
    return { ref: `${chapter}-${verse}` };
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { ref } = await params;
  const parsed = parseRef(ref);
  if (!parsed) return {};
  const { chapter, verse } = parsed;
  const books = lookup(chapter, verse);
  if (books.length === 0) return {};

  const primary = books[0];
  const label = `${chapter}:${verse}`;
  const title =
    books.length === 1
      ? `${primary} ${label}`
      : `${label}: ${primary} and ${books.length - 1} other place${books.length > 2 ? "s" : ""} it appears`;
  const description =
    books.length === 1
      ? `Read ${primary} ${label} in the Berean Standard Bible, World English Bible, King James Version, and Bible in Basic English.`
      : `Chapter ${chapter}, verse ${verse} appears in ${books.length} books of the Bible, including ${primary}. See every occurrence and read each one in full.`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/verse/${ref}/` },
    openGraph: { siteName: "Free Scripture", images: [OG_DEFAULT], title, description, url: `${SITE_URL}/verse/${ref}/` },
  };
}

export default async function VersePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { ref } = await params;
  const parsed = parseRef(ref);
  if (!parsed) notFound();
  const { chapter, verse } = parsed;
  const books = lookup(chapter, verse);
  if (books.length === 0) notFound();

  const primary = books[0];
  const rest = books.slice(1);
  const primaryText = pullVerse(DEFAULT_TRANS, primary, chapter, verse);
  const restWithText = rest.map((book) => ({
    book,
    text: pullVerse(DEFAULT_TRANS, book, chapter, verse),
  }));

  const jsonld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${chapter}:${verse} in the Bible`,
    url: `${SITE_URL}/verse/${ref}/`,
    description: `Every book of the Bible with a chapter ${chapter}, verse ${verse}.`,
    hasPart: books.map((book) => ({
      "@type": "CreativeWork",
      name: `${book} ${chapter}:${verse}`,
      url: `${SITE_URL}/${DEFAULT_TRANS}/${bookSlug(book)}/${chapter}/#v${verse}`,
    })),
  };

  // Group the other places by Testament, so the list is easier to scan.
  const groups = [
    { id: "ot", label: "Old Testament", items: restWithText.filter((r) => testamentOf(r.book) !== "nt") },
    { id: "nt", label: "New Testament", items: restWithText.filter((r) => testamentOf(r.book) === "nt") },
  ].filter((g) => g.items.length > 0);
  const anchor = (book: string) => `at-${bookSlug(book)}`;
  const card = ({ book, text }: { book: string; text: string | null }) => (
    <a
      className="hcard hcard--wide"
      href={`/${DEFAULT_TRANS}/${bookSlug(book)}/${chapter}/#v${verse}`}
      id={anchor(book)}
      key={book}
    >
      <span className="hcard__body">
        <span className="hcard__label">
          {book} {chapter}:{verse}
        </span>
        {text && (
          <span className="hcard__sub hcard__sub--italic">{text}</span>
        )}
      </span>
      {/* Drawn by CSS, not an inline SVG: this list repeats it up to 65 times. */}
      <span className="story-row__chev chev-css" aria-hidden="true" />
    </a>
  );

  return (
    <div className="reading-column lookup-page">
      <JsonLd data={jsonld} />

      {/* The left column on wide screens: look up another verse, and jump
          to any book on this page. On phones only the lookup box shows. */}
      <aside className="rail lookup-rail" aria-label="Verse lookup tools">
        <p className="rail__crumb"><a href="/search/">&larr; Search</a></p>

        <form className="lookup-form" action="/search/" method="get" data-verse-lookup>
          <label className="rail__label" htmlFor="lookup-input">Look up another verse</label>
          <div className="lookup-form__row">
            <input
              id="lookup-input"
              className="lookup-form__input"
              name="q"
              type="text"
              inputMode="text"
              placeholder="Like 11:55"
              autoComplete="off"
            />
            <input type="hidden" name="go" value="1" />
            <button className="rail-btn lookup-form__go" type="submit">Go</button>
          </div>
        </form>

        {groups.length > 0 && (
          <nav className="lookup-jump" aria-label={`Books with a ${chapter}:${verse}`}>
            <p className="rail__label">Jump to a book</p>
            <ul className="need-others__list">
              <li><a className="need-others__link" href="#lookup-top">{primary}</a></li>
            </ul>
            {groups.map((g) => (
              <div key={g.id}>
                <p className="rail__label need-others__sub">{g.label}</p>
                <ul className="need-others__list">
                  {g.items.map(({ book }) => (
                    <li key={book}><a className="need-others__link" href={`#${anchor(book)}`}>{book}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        )}
      </aside>

      <header className="verse-disambig-head" id="lookup-top">
        <p className="ph-eyebrow">Verse lookup</p>
        <h1 className="verse-disambig-head__label ph-title">
          {chapter}:{verse} in the Bible
        </h1>
        {books.length > 1 && (
          <p className="verse-disambig-head__note ph-lede">
            Chapter {chapter}, verse {verse} appears in {books.length} books of
            the Bible. Here is {primary}{MOST_MEANT[`${chapter}:${verse}`] === primary ? ", the one most people mean" : ", the first in Bible order"}.
            Every other place it appears is listed below.
          </p>
        )}
      </header>

      {/* Primary — the canonical-first match, shown in full */}
      <div className="verse-disambig-primary">
        <a
          className="verse-disambig-primary__ref"
          href={`/${DEFAULT_TRANS}/${bookSlug(primary)}/${chapter}/#v${verse}`}
        >
          {primary} {chapter}:{verse}
        </a>
        {primaryText && (
          <blockquote className="verse-disambig-primary__text">
            {primaryText}
          </blockquote>
        )}
        <a
          className="verse-disambig-primary__more"
          href={`/${DEFAULT_TRANS}/${bookSlug(primary)}/${chapter}/#v${verse}`}
        >
          Read the whole chapter
        </a>
      </div>

      {/* The rest — honestly listed, not hidden, because guessing wrong
          for someone who meant John 3:22 instead of Genesis 3:22 would
          be worse than showing one extra list. */}
      {groups.length > 0 && (
        <div className="verse-disambig-rest">
          <h2 className="verse-disambig-rest__heading">
            Also at {chapter}:{verse}
          </h2>
          {groups.map((g) => (
            <section className="lookup-group" key={g.id} aria-label={g.label}>
              <h3 className="lookup-group__label">{g.label}</h3>
              <div className="hcard-row hcard-row--col lookup-grid">
                {g.items.map(card)}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
