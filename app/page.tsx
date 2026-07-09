import Link from "next/link";
import { GENRES, NEEDS } from "@/lib/bible";

const HOME_NEEDS = ["fear", "grief", "strength", "celebrate", "thinking-of-you"];

const FAMOUS = [
  { ref: "Psalm 23", url: "/web/psalms/23/", line: "The Lord is my shepherd." },
  { ref: "John 3", url: "/web/john/3/", line: "For God so loved the world." },
  { ref: "1 Corinthians 13", url: "/web/1-corinthians/13/", line: "Love is patient, love is kind." },
  { ref: "Genesis 1", url: "/web/genesis/1/", line: "In the beginning." },
  { ref: "Romans 8", url: "/web/romans/8/", line: "Nothing can separate us." },
  { ref: "Matthew 5", url: "/web/matthew/5/", line: "Blessed are the meek." },
];

export default function Home() {
  const needRows = NEEDS.filter((n: any) => HOME_NEEDS.includes(n.slug));

  return (
    <div className="home">
      <section className="home-hero">
        <h1 className="home-hero__title">Free Scripture</h1>
        <p className="home-hero__sub">
          Read the whole Bible online. Three translations, every book and chapter.
        </p>
        <form className="home-search" action="/search/" role="search">
          <input
            className="home-search__input"
            type="search"
            name="q"
            placeholder="Search a word or a verse"
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

      <section className="home-sec">
        <div className="home-sec__head">
          <h2 className="home-kick">Find what you need</h2>
          <Link className="home-seeall" href="/read/">See all verses &rarr;</Link>
        </div>
        <div className="read-list">
          {needRows.map((n: any) => (
            <Link
              className="bookrow"
              href={`/read/${n.slug}/`}
              key={n.slug}
              style={{ ["--rowc" as any]: `var(--g-${n.accent})` } as React.CSSProperties}
            >
              <span className="bookrow__main">
                <span className="bookrow__t">{n.short}</span>
                {n.card && <span className="bookrow__d">{n.card}</span>}
              </span>
              <svg className="bookrow__chev" width="9" height="15" viewBox="0 0 9 15" fill="none" aria-hidden="true"><path d="M1.5 1.5L7 7.5L1.5 13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-sec">
        <div className="home-sec__head">
          <h2 className="home-kick">Browse by kind of book</h2>
          <Link className="home-seeall" href="/genre/">See all &rarr;</Link>
        </div>
        <div className="read-list">
          {GENRES.map((g: any) => (
            <Link
              className="bookrow"
              href={`/genre/${g.slug}/`}
              key={g.slug}
              style={{ ["--rowc" as any]: `var(--g-${g.accent})` } as React.CSSProperties}
            >
              <span className="bookrow__main">
                <span className="bookrow__t">{g.kicker}</span>
                <span className="bookrow__d">{g.label}</span>
              </span>
              <svg className="bookrow__chev" width="9" height="15" viewBox="0 0 9 15" fill="none" aria-hidden="true"><path d="M1.5 1.5L7 7.5L1.5 13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-sec">
        <h2 className="home-kick">Passages everyone knows</h2>
        <div className="read-list">
          {FAMOUS.map((f) => (
            <Link className="bookrow" href={f.url} key={f.ref}>
              <span className="bookrow__main">
                <span className="bookrow__t">{f.ref}</span>
                <span className="bookrow__d">{f.line}</span>
              </span>
              <svg className="bookrow__chev" width="9" height="15" viewBox="0 0 9 15" fill="none" aria-hidden="true"><path d="M1.5 1.5L7 7.5L1.5 13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-sec">
        <h2 className="home-kick">Choose a translation</h2>
        <div className="read-list">
          <Link className="bookrow" href="/web/">
            <span className="bookrow__main">
              <span className="bookrow__t">World English Bible</span>
              <span className="bookrow__d">Modern, easy to read</span>
            </span>
            <svg className="bookrow__chev" width="9" height="15" viewBox="0 0 9 15" fill="none" aria-hidden="true"><path d="M1.5 1.5L7 7.5L1.5 13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
          <Link className="bookrow" href="/kjv/">
            <span className="bookrow__main">
              <span className="bookrow__t">King James Version</span>
              <span className="bookrow__d">Classic, 1600s English, with the Apocrypha</span>
            </span>
            <svg className="bookrow__chev" width="9" height="15" viewBox="0 0 9 15" fill="none" aria-hidden="true"><path d="M1.5 1.5L7 7.5L1.5 13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
          <Link className="bookrow" href="/bbe/">
            <span className="bookrow__main">
              <span className="bookrow__t">Bible in Basic English</span>
              <span className="bookrow__d">The simplest English</span>
            </span>
            <svg className="bookrow__chev" width="9" height="15" viewBox="0 0 9 15" fill="none" aria-hidden="true"><path d="M1.5 1.5L7 7.5L1.5 13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        </div>
      </section>

      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var raw=localStorage.getItem('fs-last');if(!raw)return;var d=JSON.parse(raw);var el=document.getElementById('home-cont');if(el&&d.url){el.href=d.url;var r=el.querySelector('[data-cont-ref]');if(r)r.textContent=d.label||'Continue reading';el.hidden=false;}}catch(e){}})();`,
        }}
      />
    </div>
  );
}
