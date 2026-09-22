import Link from "next/link";
import { NEEDS, PARABLES, PARABLE_THEMES, GENRES } from "@/lib/bible";
import { STORIES } from "@/lib/stories";
import QuickStart from "./QuickStart";

/* Homepage: one primary action, then a map of the site.
   A first-time reader should be able to see the three ways in, and
   roughly how much is behind each one, without scrolling. Each kind of
   thing looks different on purpose: a retelling, a parable, a book, and
   a verse for a moment are not the same and should not look alike. */

const PASSAGES = [
  { ref: "John 3", url: "/web/john/3/", line: "For God so loved the world." },
  { ref: "Genesis 1", url: "/web/genesis/1/", line: "In the beginning." },
  { ref: "1 Corinthians 13", url: "/web/1-corinthians/13/", line: "Love is patient, love is kind." },
  { ref: "Romans 8", url: "/web/romans/8/", line: "Nothing can separate us from God's love." },
];
const FEATURED_PARABLES = ["prodigal-son", "good-samaritan", "lost-sheep"];
const HOME_NEEDS = ["fear", "grief", "strength", "guilt"];

function Chev({ cls = "story-row__chev" }: { cls?: string }) {
  return (
    <svg className={cls} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
  );
}
function refLabel(p: any) {
  const [book, ch, s, e] = p.ref;
  return s === e ? `${book} ${ch}:${s}` : `${book} ${ch}:${s}-${e}`;
}

export default function Home() {
  const ready = STORIES.filter((s) => s.ready && s.file);
  const soon = STORIES.filter((s) => !s.ready).slice(0, 4);
  const parables = FEATURED_PARABLES.map((slug) => PARABLES.find((p: any) => p.slug === slug)).filter(Boolean) as any[];
  const needs = HOME_NEEDS.map((slug) => (NEEDS as any[]).find((n) => n.slug === slug)).filter(Boolean) as any[];

  return (
    <div className="home2">
      <header className="home2-hello">
        <h1 className="home2-title">The whole Bible, open to anyone.</h1>
        <p className="home2-sub">Free to read. No account, no ads.</p>
      </header>

      <QuickStart />

      <form className="hero-search" action="/search/" role="search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input className="hero-search__input" type="search" name="q" placeholder="Search a word, or try John 3:16" aria-label="Search scripture" />
      </form>

      {/* The map: three ways in, with how much is behind each */}
      <section className="doors" aria-label="Ways to read">
        <Link className="door" href="/stories/">
          <span className="door__count">{STORIES.length}</span>
          <span className="door__name">Stories</span>
          <span className="door__line">Bible stories retold in plain language, scene by scene.</span>
        </Link>
        <Link className="door" href="/web/">
          <span className="door__count">66</span>
          <span className="door__name">Books</span>
          <span className="door__line">Every chapter, in three translations.</span>
        </Link>
        <Link className="door" href="/read/">
          <span className="door__count">{(NEEDS as any[]).length}</span>
          <span className="door__name">Moments</span>
          <span className="door__line">A verse for what you are going through.</span>
        </Link>
      </section>

      {/* Scene by Scene: the retellings, given their own identity */}
      <section className="home2-section" aria-labelledby="home-sbs">
        <div className="stories-section__head">
          <h2 className="stories-section__title" id="home-sbs">Scene by Scene</h2>
          <Link className="stories-section__link" href="/stories/">See all</Link>
        </div>
        <p className="section-lede">
          Bible stories retold in plain language, one short scene at a time.
          Every story is reviewed by a Lutheran pastor and tested with
          neurodivergent readers before it goes up.
        </p>
        {ready.length > 0 ? (
          <div className="story-list">
            {ready.slice(0, 2).map((s) => (
              <Link key={s.slug} className="sbs-card" href={`/stories/${s.slug}/`}>
                <div className="sbs-card__body">
                  <div className="sbs-card__kicker">Retelling · {s.kind}</div>
                  <div className="sbs-card__name">{s.title}</div>
                  <div className="sbs-card__desc">{s.desc}</div>
                  <div className="sbs-card__meta"><span className="badge">{s.level}</span><span>{s.ref}</span></div>
                </div>
                <Chev />
              </Link>
            ))}
          </div>
        ) : (
          <div className="sbs-soon">
            <div className="sbs-soon__label">In the works</div>
            <ul className="sbs-soon__list">
              {soon.map((s) => (
                <li key={s.slug}><span className="sbs-soon__name">{s.title}</span><span className="sbs-soon__ref">{s.ref}</span></li>
              ))}
            </ul>
            <p className="sbs-soon__note">The first stories are in review now. Until they are up, the parables below are the place to start.</p>
          </div>
        )}
      </section>

      {/* Parables: a different shape, because they link into the Bible text */}
      <section className="home2-section" aria-labelledby="home-parables">
        <div className="stories-section__head">
          <h2 className="stories-section__title" id="home-parables">Parables of Jesus</h2>
          <Link className="stories-section__link" href="/parables/">All {PARABLES.length}</Link>
        </div>
        <p className="section-lede">Short stories Jesus told, grouped by what they are about.</p>
        <div className="chips">
          {(PARABLE_THEMES as any[]).slice(0, 5).map((t) => (
            <Link key={t.slug} className="chip" href={`/parables/#${t.slug}`}>{t.label}</Link>
          ))}
        </div>
        <div className="story-list">
          {parables.map((p) => (
            <Link key={p.slug} className="parable-row" href={`/parables/${p.slug}/`}>
              <span className="parable-row__body">
                <span className="parable-row__name">{p.title}</span>
                <span className="parable-row__line">{p.line}</span>
              </span>
              <span className="parable-row__ref">{refLabel(p)}</span>
              <Chev />
            </Link>
          ))}
        </div>
      </section>

      {/* Books: chips, because 66 rows is a wall */}
      <section className="home2-section" aria-labelledby="home-kinds">
        <div className="stories-section__head">
          <h2 className="stories-section__title" id="home-kinds">Kinds of book</h2>
          <Link className="stories-section__link" href="/web/">All books</Link>
        </div>
        <div className="kind-grid">
          {(GENRES as any[]).map((g) => (
            <Link key={g.slug} className="kind" href={`/genre/${g.slug}/`}>
              <span className="kind__name">{g.kicker}</span>
              <span className="kind__line">{g.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Moments */}
      <section className="home2-section" aria-labelledby="home-moment">
        <div className="stories-section__head">
          <h2 className="stories-section__title" id="home-moment">A verse for the moment</h2>
          <Link className="stories-section__link" href="/read/">See all</Link>
        </div>
        <div className="need-grid">
          {needs.map((n) => (
            <Link key={n.slug} className="need-tile" href={`/read/${n.slug}/`}>
              <span className="need-tile__name">{n.short}</span>
              <span className="need-tile__desc">{n.card}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Passages */}
      <section className="home2-section" aria-labelledby="home-passages">
        <div className="stories-section__head">
          <h2 className="stories-section__title" id="home-passages">Well-known passages</h2>
          <Link className="stories-section__link" href="/search/">Search</Link>
        </div>
        <div className="passage-rows">
          {PASSAGES.map((f) => (
            <Link className="passage-row" href={f.url} key={f.ref}>
              <span className="passage-row__ref">{f.ref}</span>
              <span className="passage-row__line">{f.line}</span>
              <Chev />
            </Link>
          ))}
        </div>
        <p className="home2-note">These open in the World English Bible. You can switch to the King James or Basic English on any chapter.</p>
      </section>

      <section className="home2-section" aria-labelledby="home-sunday">
        <h2 className="stories-section__title" id="home-sunday">This Sunday</h2>
        <a className="story-row home2-sunday" href="https://www.digitallutheranchurch.com/word/propers" rel="noopener">
          <div className="story-row__body">
            <div className="story-row__name">This week&apos;s readings</div>
            <div className="story-row__desc">The appointed readings from the Revised Common Lectionary, at Digital Lutheran Church.</div>
          </div>
          <Chev />
        </a>
      </section>
    </div>
  );
}
