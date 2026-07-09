import Link from "next/link";
import { GENRES, NEEDS, TRANSLATIONS, TRANS_ORDER } from "@/lib/bible";

const HOME_NEEDS = ["fear", "grief", "strength", "celebrate", "thinking-of-you"];

const FAMOUS = [
  { ref: "Psalm 23", url: "/web/psalms/23/", line: "The Lord is my shepherd." },
  { ref: "John 3", url: "/web/john/3/", line: "For God so loved the world." },
  { ref: "Genesis 1", url: "/web/genesis/1/", line: "In the beginning." },
  { ref: "1 Corinthians 13", url: "/web/1-corinthians/13/", line: "Love is patient, love is kind." },
  { ref: "Romans 8", url: "/web/romans/8/", line: "Nothing can separate us." },
  { ref: "Matthew 5", url: "/web/matthew/5/", line: "Blessed are the meek." },
];

const TRANS_CARDS: { slug: string; label: string; desc: string; tag?: string }[] = [
  { slug: "web", label: "World English Bible", desc: "Modern, easy to read", tag: "Good place to start" },
  { slug: "kjv", label: "King James Version", desc: "Classic, 1600s English. Includes the Apocrypha." },
  { slug: "bbe", label: "Bible in Basic English", desc: "About 1,000 common words" },
];

const Chev = () => (
  <svg className="bookrow__chev" width="9" height="15" viewBox="0 0 9 15" fill="none" aria-hidden="true">
    <path d="M1.5 1.5L7 7.5L1.5 13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Home() {
  const needRows = NEEDS.filter((n: any) => HOME_NEEDS.includes(n.slug));

  return (
    <div className="home">
      <section className="home-hero">
        <h1 className="home-hero__title">Free Scripture</h1>
        <p className="home-hero__sub">
          Three translations of the Bible, free to read. Pick one and start.
        </p>
        <form className="home-search" action="/search/" role="search">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input
            className="home-search__input"
            type="search"
            name="q"
            placeholder="Search for a word or verse"
            aria-label="Search scripture"
          />
        </form>
      </section>

      <a className="home-cont" id="home-cont" href="#" hidden>
        <span>
          <span className="m">Where you left off</span>
          <span className="r" data-cont-ref></span>
        </span>
        <span className="a" aria-hidden="true">&rarr;</span>
      </a>

      {/* --- Start reading: translations --- */}
      <div className="home-divider" />
      <div className="section-label">Start reading</div>
      <div className="read-list" style={{ marginBottom: 0 }}>
        {TRANS_CARDS.map((tc) => (
          <Link className="bookrow bookrow--primary" href={`/${tc.slug}/`} key={tc.slug}>
            <span className="bookrow__main">
              <span className="bookrow__t">{tc.label}</span>
              <span className="bookrow__d">{tc.desc}</span>
              {tc.tag && <span className="bookrow__tag">{tc.tag}</span>}
            </span>
            <Chev />
          </Link>
        ))}
      </div>

      {/* --- Famous passages --- */}
      <div className="home-divider" />
      <div className="section-label">Jump to a famous passage</div>
      <div className="read-list">
        {FAMOUS.map((f) => (
          <Link className="bookrow" href={f.url} key={f.ref}>
            <span className="bookrow__main">
              <span className="bookrow__t">{f.ref}</span>
              <span className="bookrow__d">{f.line}</span>
            </span>
            <Chev />
          </Link>
        ))}
      </div>

      {/* --- Verses for the moment --- */}
      <div className="home-divider" />
      <div className="section-head">
        <span className="section-label">Verse for what you&apos;re going through</span>
        <Link className="section-link" href="/read/">See all &rarr;</Link>
      </div>
      <div className="read-list">
        {needRows.map((n: any) => (
          <Link className="bookrow" href={`/read/${n.slug}/`} key={n.slug}>
            <span className="bookrow__main">
              <span className="bookrow__t">{n.short}</span>
              <span className="bookrow__d">{n.card}</span>
            </span>
            <Chev />
          </Link>
        ))}
      </div>

      {/* --- Browse by kind --- */}
      <div className="home-divider" />
      <div className="section-head">
        <span className="section-label">Browse by kind of book</span>
        <Link className="section-link" href="/genre/">See all &rarr;</Link>
      </div>
      <div className="genre-pills">
        {GENRES.map((g: any) => (
          <Link className="genre-pill" href={`/genre/${g.slug}/`} key={g.slug}>
            {g.kicker}
          </Link>
        ))}
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var raw=localStorage.getItem('fs-last');if(!raw)return;var d=JSON.parse(raw);var el=document.getElementById('home-cont');if(el&&d.url){el.href=d.url;var r=el.querySelector('[data-cont-ref]');if(r)r.textContent=d.label||'Continue reading';el.hidden=false;}}catch(e){}})();`,
        }}
      />
    </div>
  );
}
