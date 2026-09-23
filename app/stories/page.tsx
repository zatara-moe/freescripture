import Link from "next/link";
import type { Metadata } from "next";
import { PARABLES, SITE_URL } from "@/lib/bible";
import { readableStories, plannedStories, activeLenses, LENSES, compareHref } from "@/lib/stories";
import { loadStory } from "@/lib/story";
import { Shelf, StoryCover, ParableCover } from "../Shelf";

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

const FEATURED_PARABLES = ["prodigal-son", "good-samaritan", "lost-sheep", "sower", "mustard-seed", "talents", "pharisee-and-tax-collector", "lost-coin"];

/* The Stories tab. When only one story is ready, it gets a featured
   card instead of a lonely book on a five-wide shelf. The "being
   written" row always shows as a grid, not a scrolling shelf, so
   nothing is hidden off-screen on desktop. */
export default function StoriesPage() {
  const ready = readableStories();
  const planned = plannedStories();
  const lenses = activeLenses();
  const multi = lenses.length > 1;
  const parables = FEATURED_PARABLES.map((slug) => (PARABLES as any[]).find((p) => p.slug === slug)).filter(Boolean);
  const featured = ready.length === 1 ? ready[0] : null;
  const featuredStats = featured ? loadStory(featured.slug) : null;
  const featuredMin = featuredStats ? Math.max(1, Math.round(featuredStats.words / 200)) : 0;

  return (
    <div className="stories-page">
      <header className="stories-hero">
        <h1 className="shelf__title">Stories</h1>
        <p className="stories-lede">
          Scene by Scene tells Bible stories in plain language, one short
          scene at a time, with what they mean and why they matter. Every
          story is reviewed by a Lutheran pastor. Stories marked Early
          edition are still in that review.
        </p>
      </header>

      {featured ? (
        <section className="stories-featured" aria-labelledby="feat-title">
          <h2 className="shelf__title" id="feat-title">Ready to read</h2>
          <div className="featured-card">
            <div className="featured-card__body">
              <span className="featured-card__flag">
                {featured.status === "early" ? "Early edition" : "Story"}
              </span>
              <span className="featured-card__title">{featured.title}</span>
              <span className="featured-card__desc">{featured.desc}</span>
              <span className="featured-card__meta">
                {featured.ref}
                {featuredMin > 0 ? ` · About ${featuredMin} minutes · ${featuredStats!.scenes} scenes` : ""}
                {` · ${featured.level}`}
              </span>
              <div className="featured-card__actions">
                <Link className="hero-cta" href={`/stories/${featured.slug}/`}>
                  Read {featured.title}
                </Link>
                <Link className="hero-link" href={compareHref(featured)}>
                  Read it side by side
                </Link>
              </div>
            </div>
            <div className="featured-card__cover">
              <StoryCover s={featured} />
            </div>
          </div>
        </section>
      ) : ready.length > 1 && (multi ? (
        lenses.map((l) => (
          <Shelf key={l} id={`lens-${l}`} title={LENSES[l].name}>
            {ready.filter((s) => s.lens === l).map((s) => <StoryCover key={s.slug} s={s} showLens />)}
          </Shelf>
        ))
      ) : (
        <Shelf id="ready" title="Ready to read">
          {ready.map((s) => <StoryCover key={s.slug} s={s} />)}
        </Shelf>
      ))}

      {planned.length > 0 && (
        <section className="stories-planned" aria-labelledby="soon-title">
          <h2 className="shelf__title" id="soon-title">Being written now</h2>
          <p className="stories-planned__note">
            These are on their way. Until they are ready, each one opens the
            passage in the Bible so you can read it today.
          </p>
          <div className="stories-planned__grid">
            {planned.map((s) => <StoryCover key={s.slug} s={s} />)}
          </div>
        </section>
      )}

      <Shelf id="parables" title="The parables of Jesus" more={{ href: "/parables/", label: `All ${PARABLES.length}` }}>
        {parables.map((p: any) => <ParableCover key={p.slug} p={p} />)}
      </Shelf>

      <p className="stories-cmp">
        Want to check a retelling against the Bible? <Link href="/compare/">Read side by side</Link>.
      </p>
    </div>
  );
}
