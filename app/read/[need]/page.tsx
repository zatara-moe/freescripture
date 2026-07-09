import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  NEEDS,
  DEFAULT_TRANS,
  bookSlug,
  pullVerse,
  SITE_URL,
} from "@/lib/bible";

type Params = { need: string };

export function generateStaticParams() {
  return NEEDS.map((n: any) => ({ need: n.slug }));
}

export const dynamicParams = false;

export async function generateMetadata(
  { params }: { params: Promise<Params> }
): Promise<Metadata> {
  const { need } = await params;
  const n = NEEDS.find((x: any) => x.slug === need);
  if (!n) return {};
  return {
    title: n.meta_title || n.h1,
    description: n.meta_desc || n.lede,
    alternates: { canonical: `${SITE_URL}/read/${need}/` },
  };
}

function refLabel(book: string, chapter: number) {
  const label = book === "Psalms" ? "Psalm" : book;
  return `${label} ${chapter}`;
}

export default async function NeedPage(
  { params }: { params: Promise<Params> }
) {
  const { need } = await params;
  const n = NEEDS.find((x: any) => x.slug === need);
  if (!n) notFound();

  return (
    <div className="reading-column need-page">
      <nav className="chapter-nav" aria-label="Navigation">
        <div className="chapter-nav__group">
          <Link href="/read/">&larr; All verses</Link>
        </div>
        <div className="chapter-nav__current">{n.short}</div>
        <div className="chapter-nav__group" />
      </nav>

      <header className="page-head">
        <h1 className="page-title">{n.h1}</h1>
        <p className="page-lede">{n.lede}</p>
      </header>

      <div className="passage-list">
        {n.passages.map((p: any, i: number) => {
          const [book, chapter, verse, accent, frame] = p;
          const text = pullVerse(DEFAULT_TRANS, book, chapter, verse);
          const slug = bookSlug(book);
          const url = `/${DEFAULT_TRANS}/${slug}/${chapter}/#v${verse}`;
          return (
            <article
              className="passage"
              key={i}
              style={{ ["--rowc" as any]: `var(--g-${accent})` } as React.CSSProperties}
            >
              <div className="passage__ref">
                {refLabel(book, chapter)}:{verse}
              </div>
              {frame && <div className="passage__frame">{frame}</div>}
              {text && <blockquote className="passage__verse">{text}</blockquote>}
              <div className="passage__acts">
                <Link className="rbtn rbtn--read" href={url}>Read the chapter &rarr;</Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
