import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  TRANSLATIONS,
  TRANS_ORDER,
  BOOK_ORDER,
  booksForTranslation,
  BOOK_PITCHES,
  BOOK_INTROS,
  GENRE_OF,
  SITE_URL,
  type TransSlug,
} from "@/lib/bible";

type Params = { translation: string };

export function generateStaticParams() {
  return TRANS_ORDER.map((t) => ({ translation: t }));
}

export const dynamicParams = false;

export async function generateMetadata(
  { params }: { params: Promise<Params> }
): Promise<Metadata> {
  const { translation } = await params;
  const trans = translation as TransSlug;
  const tmeta = TRANSLATIONS[trans];
  if (!tmeta) return {};
  const title = `${tmeta.label} (${tmeta.short})`;
  const description = `Read the ${tmeta.label} online for free. ${tmeta.description}`;
  const url = `${SITE_URL}/${trans}/`;
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url } };
}

export default async function TranslationLanding(
  { params }: { params: Promise<Params> }
) {
  const { translation } = await params;
  const trans = translation as TransSlug;
  const tmeta = TRANSLATIONS[trans];
  if (!tmeta) notFound();

  const present = new Set(booksForTranslation(trans).map((b) => b.name));
  const slugByName = new Map(booksForTranslation(trans).map((b) => [b.name, b.slug]));

  // group books in canonical order by their section label
  const sections: { label: string; books: string[] }[] = [];
  for (const [name, , group] of BOOK_ORDER) {
    if (!present.has(name)) continue;
    let sec = sections.find((s) => s.label === group);
    if (!sec) {
      sec = { label: group, books: [] };
      sections.push(sec);
    }
    sec.books.push(name);
  }

  return (
    <div className="trans-landing">
      <header className="trans-landing__head">
        <h1 className="trans-landing__title">{tmeta.label}</h1>
        <p className="trans-landing__desc">{tmeta.description}</p>
        <div className="trans-switch" aria-label="Switch translation">
          <span className="trans-switch__label">Other versions:</span>
          {TRANS_ORDER.filter((t) => t !== trans).map((t) => (
            <Link key={t} className="trans-switch__btn" href={`/${t}/`}>
              {TRANSLATIONS[t].short}
            </Link>
          ))}
        </div>
      </header>

      {sections.map((sec) => (
        <section
          className="book-section"
          key={sec.label}
          id={sec.label.toLowerCase().replace(/\s+/g, "-")}
        >
          <h2 className="book-section__label">{sec.label}</h2>
          <div className="book-rows">
            {sec.books.map((name) => {
              const slug = slugByName.get(name)!;
              const desc = BOOK_PITCHES[name] || BOOK_INTROS[name] || "";
              const genre = GENRE_OF[name] || "";
              return (
                <Link
                  className="bookrow"
                  href={`/${trans}/${slug}/`}
                  key={name}
                  style={
                    genre
                      ? ({ ["--rowc" as any]: `var(--g-${genre})` } as React.CSSProperties)
                      : undefined
                  }
                >
                  <span className="bookrow__body">
                    <span className="bookrow__title">{name}</span>
                    {desc && <span className="bookrow__desc">{desc}</span>}
                  </span>
                  <span className="bookrow__chev" aria-hidden="true">&rsaquo;</span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
