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
import { JsonLd } from "@/lib/JsonLd";

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

  // Build the passages once so schema and render agree.
  const passages = n.passages.map((p: any) => {
    const [book, chapter, verse, accent, frame] = p;
    return {
      book, chapter, verse, accent, frame,
      text: pullVerse(DEFAULT_TRANS, book, chapter, verse),
      slug: bookSlug(book),
    };
  });

  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/read/${need}/#faq`,
        name: n.h1,
        description: n.meta_desc || n.lede,
        url: `${SITE_URL}/read/${need}/`,
        isPartOf: { "@id": "https://freescripture.org/#website" },
        mainEntity: passages
          .filter((p: any) => p.text)
          .map((p: any) => ({
            "@type": "Question",
            name: `What does ${refLabel(p.book, p.chapter)}:${p.verse} say?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `${p.text} (${refLabel(p.book, p.chapter)}:${p.verse}, World English Bible)`,
              url: `${SITE_URL}/${DEFAULT_TRANS}/${p.slug}/${p.chapter}/#v${p.verse}`,
            },
          })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Verses", item: `${SITE_URL}/read/` },
          { "@type": "ListItem", position: 2, name: n.short, item: `${SITE_URL}/read/${need}/` },
        ],
      },
    ],
  };

  return (
    <div className="reading-column need-page">
      <JsonLd data={jsonld} />
      <nav className="chapter-nav" aria-label="Navigation">
        <div className="chapter-nav__group">
          <Link href="/read/">&larr; All verses</Link>
        </div>
        <div className="chapter-nav__current">{n.short}</div>
        <div className="chapter-nav__group" />
      </nav>

      <div className="page-head">
        <h1 className="page-title">{n.h1}</h1>
        <p className="page-lede">{n.lede}</p>
      </div>

      <div className="passage-list">
        {passages.map((p: any, i: number) => {
          const url = `/${DEFAULT_TRANS}/${p.slug}/${p.chapter}/#v${p.verse}`;
          return (
            <article className="passage" key={i}>
              <div className="passage__ref">
                {refLabel(p.book, p.chapter)}:{p.verse}
              </div>
              {p.frame && <div className="passage__frame">{p.frame}</div>}
              {p.text && <blockquote className="passage__verse">{p.text}</blockquote>}
              <div className="passage__acts">
                <Link className="rbtn" href={url}>Read the chapter &rarr;</Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
