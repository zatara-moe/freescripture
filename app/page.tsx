import Link from "next/link";
import { NEEDS, PARABLES } from "@/lib/bible";
import { STORIES } from "@/lib/stories";
import QuickStart from "./QuickStart";

/* Homepage: one primary action, then three short shelves.
   Kept deliberately small: every extra equal-weight choice is a
   decision a new reader has to make before they read anything. */

const PASSAGES = [
  { ref: "John 3", url: "/web/john/3/", line: "For God so loved the world." },
  { ref: "Genesis 1", url: "/web/genesis/1/", line: "In the beginning." },
  { ref: "1 Corinthians 13", url: "/web/1-corinthians/13/", line: "Love is patient, love is kind." },
  { ref: "Romans 8", url: "/web/romans/8/", line: "Nothing can separate us from God's love." },
  { ref: "Matthew 5", url: "/web/matthew/5/", line: "Blessed are the meek." },
];

const FEATURED_PARABLES = ["prodigal-son", "good-samaritan", "lost-sheep"];
const HOME_NEEDS = ["fear", "grief", "strength", "guilt"];

function Chev() {
  return (
    <svg className="story-row__chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
  );
}

function refLabel(p: any) {
  const [book, ch, s, e] = p.ref;
  return s === e ? `${book} ${ch}:${s}` : `${book} ${ch}:${s}-${e}`;
}

export default function Home() {
  const ready = STORIES.filter((s) => s.ready && s.file).slice(0, 3);
  const parables = FEATURED_PARABLES.map((slug) => PARABLES.find((p: any) => p.slug === slug)).filter(Boolean).slice(0, 3 - ready.length) as any[];
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

      <section className="home2-section" aria-labelledby="home-stories">
        <div className="stories-section__head">
          <h2 className="stories-section__title" id="home-stories">Stories</h2>
          <Link className="stories-section__link" href="/stories/">All stories</Link>
        </div>
        <div className="story-list">
          {ready.map((s) => (
            <Link key={s.slug} className="story-row" href={`/stories/${s.slug}/`}>
              <div className="story-row__body">
                <div className="story-row__name">{s.title}</div>
                <div className="story-row__desc">{s.desc}</div>
                <div className="story-row__meta"><span className="badge">{s.level}</span><span>Scene by Scene · {s.ref}</span></div>
              </div>
              <Chev />
            </Link>
          ))}
          {parables.map((p) => (
            <Link key={p.slug} className="story-row" href={`/parables/${p.slug}/`}>
              <div className="story-row__body">
                <div className="story-row__name">{p.title}</div>
                <div className="story-row__desc">{p.line}</div>
                <div className="story-row__meta"><span>Parable · {refLabel(p)}</span></div>
              </div>
              <Chev />
            </Link>
          ))}
        </div>
      </section>

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

      <section className="home2-section" aria-labelledby="home-passages">
        <div className="stories-section__head">
          <h2 className="stories-section__title" id="home-passages">Well-known passages</h2>
          <Link className="stories-section__link" href="/web/">All books</Link>
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
            <div className="story-row__name">This Sunday&apos;s readings</div>
            <div className="story-row__desc">The appointed readings from the Revised Common Lectionary, at Digital Lutheran Church.</div>
          </div>
          <Chev />
        </a>
      </section>
    </div>
  );
}
