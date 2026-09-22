import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  PARABLES,
  PARABLE_THEMES,
  pullRange,
  bookSlug,
  DEFAULT_TRANS,
  SITE_URL,
} from "@/lib/bible";
import { JsonLd } from "@/lib/JsonLd";

type Params = { slug: string };

export function generateStaticParams() {
  return PARABLES.map((p: any) => ({ slug: p.slug }));
}

function find(slug: string) {
  return PARABLES.find((p: any) => p.slug === slug) || null;
}

function refLabel(ref: any[]) {
  const [book, ch, s, e] = ref;
  return s === e ? `${book} ${ch}:${s}` : `${book} ${ch}:${s}-${e}`;
}

function chapterUrl(ref: any[]) {
  const [book, ch, s] = ref;
  return `/${DEFAULT_TRANS}/${bookSlug(book)}/${ch}/#v${s}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = find(slug);
  if (!p) return {};
  return {
    title: `${p.title} | The Parables of Jesus`,
    description: `${p.line} Read ${refLabel(p.ref)} in full, with parallel accounts.`,
    alternates: { canonical: `${SITE_URL}/parables/${p.slug}/` },
    openGraph: {
      title: p.title,
      description: p.line,
      url: `${SITE_URL}/parables/${p.slug}/`,
    },
  };
}

export default async function ParablePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const p = find(slug);
  if (!p) notFound();

  const theme = PARABLE_THEMES.find((t: any) => t.slug === p.theme);
  const [book, ch, sv, ev] = p.ref;
  const verses = pullRange(DEFAULT_TRANS, book, ch, sv, ev);

  const parallelBlocks = p.parallels.map((par: any[]) => ({
    ref: par,
    label: refLabel(par),
    url: chapterUrl(par),
    verses: pullRange(DEFAULT_TRANS, par[0], par[1], par[2], par[3]),
  }));

  // Other parables in the same theme, for the footer
  const siblings = PARABLES.filter(
    (x: any) => x.theme === p.theme && x.slug !== p.slug
  ).slice(0, 4);

  const jsonld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.title,
    description: p.line,
    url: `${SITE_URL}/parables/${p.slug}/`,
    isPartOf: {
      "@type": "CollectionPage",
      name: "The Parables of Jesus",
      url: `${SITE_URL}/parables/`,
    },
  };

  return (
    <div
      className="reading-column"
      style={{ ["--rowc" as any]: `var(--g-${theme?.accent || "narrative"})` } as React.CSSProperties}
    >
      <JsonLd data={jsonld} />

      <nav className="chapter-nav" aria-label="Navigation">
        <div className="chapter-nav__group">
          <Link href="/parables/">&larr; All parables</Link>
        </div>
        <div className="chapter-nav__current">{theme?.label}</div>
        <div className="chapter-nav__group" />
      </nav>

      <header className="parable-head">
        <div className="parable-head__theme">{theme?.label}</div>
        <h1 className="parable-title">{p.title}</h1>
        {p.also.length > 0 && (
          <p className="parable-also">Also called {p.also.join(", ")}</p>
        )}
        <p className="parable-line">{p.line}</p>
      </header>

      {/* The hinge — what the parable turns on. A pointer, not a sermon. */}
      {p.turn && (
        <div className="parable-turn">
          <div className="parable-turn__label">What it turns on</div>
          <p>{p.turn}</p>
        </div>
      )}

      <div className="parable-passage">
        <div className="parable-passage__ref">
          <Link href={chapterUrl(p.ref)}>{refLabel(p.ref)}</Link>
        </div>
        <div className="chapter-text" lang="en">
          {verses.map((v) => (
            <div className="verse" key={v.v} id={`v${v.v}`}>
              <span className="verse__num">{v.v}</span>
              <span className="verse__body">{v.t}</span>
            </div>
          ))}
        </div>
        <p className="parable-passage__trans">
          World English Bible, public domain.{" "}
          <Link href={chapterUrl(p.ref)}>Read the whole chapter &rarr;</Link>
        </p>
      </div>

      {parallelBlocks.length > 0 && (
        <div className="parable-parallels">
          <h2 className="parable-parallels__heading">
            Told again in {parallelBlocks.length === 1 ? "another gospel" : "other gospels"}
          </h2>
          <p className="parable-parallels__note">
            The same parable, recorded differently. The differences are worth
            reading, not smoothing over.
          </p>
          {parallelBlocks.map((pb: any) => (
            <details className="parable-parallel" key={pb.label}>
              <summary>
                <span className="parable-parallel__ref">{pb.label}</span>
                <span className="parable-parallel__open">Read it</span>
              </summary>
              <div className="chapter-text" lang="en">
                {pb.verses.map((v: any) => (
                  <div className="verse" key={v.v}>
                    <span className="verse__num">{v.v}</span>
                    <span className="verse__body">{v.t}</span>
                  </div>
                ))}
              </div>
              <p className="parable-passage__trans">
                <Link href={pb.url}>Read the whole chapter &rarr;</Link>
              </p>
            </details>
          ))}
        </div>
      )}

      {siblings.length > 0 && (
        <div className="keep-reading">
          <div className="keep-reading__heading">More on {theme?.label.toLowerCase()}</div>
          <div className="keep-reading__links">
            {siblings.map((s: any) => (
              <Link className="keep-reading__link" href={`/parables/${s.slug}/`} key={s.slug}>
                <span className="keep-reading__link-label">{s.title}</span>
                <span className="keep-reading__link-desc">{s.line}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
