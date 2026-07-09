import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  GENRES,
  GENRE_OF,
  BOOK_ORDER,
  DEFAULT_TRANS,
  bookSlug,
  BOOK_PITCHES,
  BOOK_INTROS,
  SITE_URL,
} from "@/lib/bible";

type Params = { genre: string };

export function generateStaticParams() {
  return GENRES.map((g: any) => ({ genre: g.slug }));
}

export const dynamicParams = false;

export async function generateMetadata(
  { params }: { params: Promise<Params> }
): Promise<Metadata> {
  const { genre } = await params;
  const g = GENRES.find((x: any) => x.slug === genre);
  if (!g) return {};
  return {
    title: g.meta_title || g.h1,
    description: g.meta_desc || g.intro,
    alternates: { canonical: `${SITE_URL}/genre/${genre}/` },
  };
}

export default async function GenrePage(
  { params }: { params: Promise<Params> }
) {
  const { genre } = await params;
  const g = GENRES.find((x: any) => x.slug === genre);
  if (!g) notFound();

  // canonical-ordered books whose genre matches (canonical 66 only)
  const books = BOOK_ORDER.filter(
    ([name]) => GENRE_OF[name] === genre
  ).map(([name]) => name);

  return (
    <div className="reading-column genre-page">
      <nav className="chapter-nav" aria-label="Navigation">
        <div className="chapter-nav__group">
          <Link href="/genre/">&larr; All kinds</Link>
        </div>
        <div className="chapter-nav__current">{g.kicker}</div>
        <div className="chapter-nav__group" />
      </nav>

      <header className="page-head">
        <h1 className="page-title">{g.h1}</h1>
        <p className="page-lede">{g.intro}</p>
      </header>

      <div className="book-grid">
        {books.map((name) => {
          const slug = bookSlug(name);
          const desc = BOOK_PITCHES[name] || BOOK_INTROS[name] || "";
          return (
            <Link
              className="bookrow"
              href={`/${DEFAULT_TRANS}/${slug}/`}
              key={name}
              style={{ ["--rowc" as any]: `var(--g-${genre})` } as React.CSSProperties}
            >
              <span className="bookrow__main">
                <span className="bookrow__t">{name}</span>
                {desc && <span className="bookrow__d">{desc}</span>}
              </span>
              <svg className="bookrow__chev" width="9" height="15" viewBox="0 0 9 15" fill="none" aria-hidden="true"><path d="M1.5 1.5L7 7.5L1.5 13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
