import { notFound } from "next/navigation";
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
import { JsonLd } from "@/lib/JsonLd";
import { readableStories } from "@/lib/stories";

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

  const list = booksForTranslation(trans);
  const bySlug = new Map(list.map((b) => [b.name, b]));

  /* Old Testament, New Testament, then the Apocrypha (King James only).
     Inside each, books keep their usual groups in Bible order. */
  const TESTAMENTS: { id: string; label: string; note?: string }[] = [
    { id: "ot", label: "Old Testament" },
    { id: "nt", label: "New Testament" },
    { id: "ap", label: "Apocrypha", note: "Books from between the Old and New Testaments. Lutherans read them as useful and good, but not equal to Scripture." },
  ];
  const parts = TESTAMENTS.map((t) => {
    const groups: { label: string; books: string[] }[] = [];
    for (const [name, test, group] of BOOK_ORDER) {
      if (test !== t.id || !bySlug.has(name)) continue;
      let g = groups.find((x) => x.label === group);
      if (!g) { g = { label: group, books: [] }; groups.push(g); }
      g.books.push(name);
    }
    return { ...t, groups, count: groups.reduce((n, g) => n + g.books.length, 0) };
  }).filter((t) => t.count > 0);

  /* How many Scene by Scene stories come from each book. */
  const storyCount = new Map<string, number>();
  for (const st of readableStories()) storyCount.set(st.passage.book, (storyCount.get(st.passage.book) || 0) + 1);
  const idOf = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Book", "CollectionPage"],
        name: `${tmeta.label} (${tmeta.short})`,
        alternateName: tmeta.label,
        url: `${SITE_URL}/${trans}/`,
        description: tmeta.description,
        bookEdition: tmeta.label,
        datePublished: tmeta.year,
        inLanguage: "en",
        isAccessibleForFree: true,
        publisher: { "@id": "https://freescripture.org/#org" },
        isPartOf: { "@id": "https://freescripture.org/#website" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: tmeta.short, item: `${SITE_URL}/${trans}/` },
        ],
      },
    ],
  };

  return (
    <div className="bible-home">
      <JsonLd data={jsonld} />
      <header className="bible-home__head">
        <p className="bible-home__kicker ph-eyebrow">Full Bible</p>
        <h1 className="bible-home__title ph-title">{tmeta.label}</h1>
        <p className="bible-home__desc ph-lede">{tmeta.description}</p>
        <div className="bible-vers" role="group" aria-label="Choose a translation">
          <span className="bible-vers__label">Translation:</span>
          {TRANS_ORDER.map((t) =>
            t === trans ? (
              <span key={t} className="bible-vers__btn is-on" aria-current="page">{TRANSLATIONS[t].nick} <abbr>{TRANSLATIONS[t].short}</abbr></span>
            ) : (
              <a key={t} className="bible-vers__btn" href={`/${t}/`} title={`${TRANSLATIONS[t].label}: ${TRANSLATIONS[t].plain}`}>{TRANSLATIONS[t].nick} <abbr>{TRANSLATIONS[t].short}</abbr></a>
            )
          )}
        </div>
      </header>

      <nav className="bible-jump" aria-label="Jump to a part of the Bible">
        {parts.map((t) => (
          <div className="bible-jump__row" key={t.id}>
            <a className="bible-jump__test" href={`#${t.id}`}>{t.label}</a>
            {t.groups.map((g) => (
              <a key={g.label} href={`#${idOf(g.label)}`}>{g.label}</a>
            ))}
          </div>
        ))}
      </nav>

      {parts.map((t) => (
        <section className="bible-test" id={t.id} key={t.id} aria-labelledby={`${t.id}-title`}>
          <h2 className="bible-test__title" id={`${t.id}-title`}>{t.label} <span>{t.count} books</span></h2>
          {t.note && <p className="bible-test__note">{t.note}</p>}
          {t.groups.map((g) => (
            <section className="book-section" id={idOf(g.label)} key={g.label}>
              <h3 className="bible-group">{g.label}</h3>
              <ul className="bible-books">
                {g.books.map((name) => {
                  const b = bySlug.get(name)!;
                  const full = BOOK_PITCHES[name] || BOOK_INTROS[name] || "";
                  const m = full.match(/^.+?[.!?](?=\s|$)/);
                  const desc = m ? m[0] : full;
                  const genre = GENRE_OF[name] || "";
                  const n = storyCount.get(b.slug) || 0;
                  const ch = b.chapters.length;
                  return (
                    <li key={name}>
                      <a className="bible-book" href={`/${trans}/${b.slug}/`} style={genre ? ({ ["--rowc" as any]: `var(--g-${genre})` } as React.CSSProperties) : undefined}>
                        <span className="bible-book__name">{name}</span>
                        {desc && <span className="bible-book__desc">{desc}</span>}
                        <span className="bible-book__meta">
                          {ch} {ch === 1 ? "chapter" : "chapters"}
                          {n > 0 && <span className="bible-book__stories">{n} {n === 1 ? "story" : "stories"}</span>}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </section>
      ))}
    </div>
  );
}
