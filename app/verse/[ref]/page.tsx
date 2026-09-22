import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { pullVerse, bookSlug, DEFAULT_TRANS, SITE_URL } from "@/lib/bible";
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
      ? `${primary} ${label} | Free Scripture`
      : `${label}: ${primary} and ${books.length - 1} other place${books.length > 2 ? "s" : ""} it appears | Free Scripture`;
  const description =
    books.length === 1
      ? `Read ${primary} ${label} in the World English Bible, King James Version, and Bible in Basic English.`
      : `Chapter ${chapter}, verse ${verse} appears in ${books.length} books of the Bible, including ${primary}. See every occurrence and read each one in full.`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/verse/${ref}/` },
    openGraph: { title, description, url: `${SITE_URL}/verse/${ref}/` },
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

  return (
    <div className="reading-column">
      <JsonLd data={jsonld} />

      <nav className="chapter-nav" aria-label="Navigation">
        <div className="chapter-nav__group">
          <Link href="/search/">&larr; Search</Link>
        </div>
        <div className="chapter-nav__current">Chapter {chapter}, verse {verse}</div>
        <div className="chapter-nav__group" />
      </nav>

      <header className="verse-disambig-head">
        <div className="verse-disambig-head__label">
          {chapter}:{verse}
        </div>
        {books.length > 1 && (
          <p className="verse-disambig-head__note">
            Chapter {chapter}, verse {verse} appears in {books.length} books of
            the Bible. Here is {primary}{MOST_MEANT[`${chapter}:${verse}`] === primary ? ", the one most people mean" : ", the first in Bible order"}.
            Every other place it appears is listed below.
          </p>
        )}
      </header>

      {/* Primary — the canonical-first match, shown in full */}
      <div className="verse-disambig-primary">
        <Link
          className="verse-disambig-primary__ref"
          href={`/${DEFAULT_TRANS}/${bookSlug(primary)}/${chapter}/#v${verse}`}
        >
          {primary} {chapter}:{verse}
        </Link>
        {primaryText && (
          <blockquote className="verse-disambig-primary__text">
            {primaryText}
          </blockquote>
        )}
        <Link
          className="verse-disambig-primary__more"
          href={`/${DEFAULT_TRANS}/${bookSlug(primary)}/${chapter}/#v${verse}`}
        >
          Read the whole chapter &rarr;
        </Link>
      </div>

      {/* The rest — honestly listed, not hidden, because guessing wrong
          for someone who meant John 3:22 instead of Genesis 3:22 would
          be worse than showing one extra list. */}
      {restWithText.length > 0 && (
        <div className="verse-disambig-rest">
          <h2 className="verse-disambig-rest__heading">
            Also at {chapter}:{verse}
          </h2>
          <div className="hcard-row hcard-row--col">
            {restWithText.map(({ book, text }) => (
              <Link
                className="hcard hcard--wide"
                href={`/${DEFAULT_TRANS}/${bookSlug(book)}/${chapter}/#v${verse}`}
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
                <svg className="story-row__chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
