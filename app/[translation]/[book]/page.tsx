import { notFound } from "next/navigation";
import Link from "next/link";
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

  return (
    <div className="reading-column book-landing">
      <nav className="chapter-nav" aria-label="Navigation">
        <div className="chapter-nav__group">
          <Link href={`/${trans}/`}>&larr; {tmeta.label}</Link>
        </div>
        <div className="chapter-nav__current">{bk.name}</div>
        <div className="chapter-nav__group" />
      </nav>

      <div className="trans-switch" aria-label="Switch translation">
        <span className="trans-switch__label">
          Reading the {tmeta.label}. Other versions:
        </span>
        {TRANS_ORDER.map((t) =>
          t === trans ? (
            <span key={t} className="trans-switch__btn trans-switch__btn--current" aria-current="page">
              {tmeta.short}
            </span>
          ) : (
            <Link key={t} className="trans-switch__btn" href={`/${t}/${book}/`}>
              {TRANSLATIONS[t].short}
            </Link>
          )
        )}
      </div>

      <header className="book-head">
        <h1 className="book-title">{bk.name}</h1>
        {intro && <p className="book-intro">{intro}</p>}
      </header>

      <h2 className="book-chapters-label">Chapters</h2>
      <ul className="chapter-grid">
        {bk.chapters.map((c) => (
          <li key={c.num}>
            <Link href={`/${trans}/${book}/${c.num}/`}>{c.num}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
