import Link from "next/link";
import type { Metadata } from "next";
import { PARABLES, SITE_URL } from "@/lib/bible";
import { STORIES } from "@/lib/stories";

export const metadata: Metadata = {
  title: "Stories",
  description:
    "Bible stories retold scene by scene in plain language, plus every parable Jesus told. Free, no account, no ads.",
  alternates: { canonical: `${SITE_URL}/stories/` },
  openGraph: {
    title: "Stories | Free Scripture",
    description: "Bible stories retold scene by scene in plain language, plus every parable Jesus told.",
    url: `${SITE_URL}/stories/`,
  },
};

const FEATURED_PARABLES = ["prodigal-son", "good-samaritan", "lost-sheep", "sower", "mustard-seed", "talents"];

function Chev() {
  return (
    <svg className="story-row__chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function refLabel(p: any) {
  const [book, ch, s, e] = p.ref;
  return s === e ? `${book} ${ch}:${s}` : `${book} ${ch}:${s}-${e}`;
}

export default function StoriesPage() {
  const parables = FEATURED_PARABLES
    .map((slug) => PARABLES.find((p: any) => p.slug === slug))
    .filter(Boolean) as any[];

  return (
    <div className="stories-page">
      <header className="stories-hero">
        <div className="stories-eyebrow">Scene by Scene</div>
        <h1 className="stories-title">Stories from the Bible</h1>
        <p className="stories-lede">
          Each story is retold in plain language, one short scene at a time.
          Every one is reviewed by a Lutheran pastor and tested with real
          readers before it goes up.
        </p>
      </header>

      <section className="stories-section" aria-labelledby="sbs-title">
        <div className="stories-section__head">
          <h2 className="stories-section__title" id="sbs-title">Scene by Scene</h2>
        </div>
        <div className="story-list">
          {STORIES.map((s) =>
            s.ready && s.file ? (
              <Link key={s.title} className="story-row" href={`/stories/${s.slug}/`}>
                <div className="story-row__body">
                  <div className="story-row__name">{s.title}</div>
                  <div className="story-row__desc">{s.desc}</div>
                  <div className="story-row__meta">
                    <span className="badge">{s.level}</span>
                    <span>{s.kind} · {s.ref}</span>
                  </div>
                </div>
                <Chev />
              </Link>
            ) : (
              <div key={s.title} className="story-row story-row--soon">
                <div className="story-row__body">
                  <div className="story-row__name">{s.title}</div>
                  <div className="story-row__desc">{s.desc}</div>
                  <div className="story-row__meta">
                    <span className="badge badge--quiet">In the works</span>
                    <span>{s.kind} · {s.ref}</span>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </section>

      <section className="stories-section" aria-labelledby="parables-title">
        <div className="stories-section__head">
          <h2 className="stories-section__title" id="parables-title">The parables of Jesus</h2>
          <p className="section-lede">Short stories Jesus told, grouped by what they are about.</p>
          <Link className="stories-section__link" href="/parables/">All {PARABLES.length}</Link>
        </div>
        <div className="story-list">
          {parables.map((p) => (
            <Link key={p.slug} className="story-row" href={`/parables/${p.slug}/`}>
              <div className="story-row__body">
                <div className="story-row__name">{p.title}</div>
                <div className="story-row__desc">{p.line}</div>
                <div className="story-row__meta"><span>{refLabel(p)}</span></div>
              </div>
              <Chev />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
