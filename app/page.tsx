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
        <div className="home-rows">
          {needRows.map((n: any) => (
            <Link
              className="bookrow"
              href={`/read/${n.slug}/`}
              key={n.slug}
              style={{ ["--rowc" as any]: `var(--g-${n.accent})` } as React.CSSProperties}
            >
              <span className="bookrow__body">
                <span className="bookrow__title">{n.short}</span>
                {n.card && <span className="bookrow__desc">{n.card}</span>}
              </span>
              <span className="bookrow__chev" aria-hidden="true">&rsaquo;</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-sec">
        <div className="home-sec__head">
          <h2 className="home-kick">Browse by kind of book</h2>
          <Link className="home-seeall" href="/genre/">See all &rarr;</Link>
        </div>
        <div className="home-rows">
          {GENRES.map((g: any) => (
            <Link
              className="bookrow"
              href={`/genre/${g.slug}/`}
              key={g.slug}
              style={{ ["--rowc" as any]: `var(--g-${g.accent})` } as React.CSSProperties}
            >
              <span className="bookrow__body">
                <span className="bookrow__title">{g.kicker}</span>
                <span className="bookrow__desc">{g.label}</span>
              </span>
              <span className="bookrow__chev" aria-hidden="true">&rsaquo;</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-sec">
        <h2 className="home-kick">Passages everyone knows</h2>
        <div className="home-rows">
          {FAMOUS.map((f) => (
            <Link className="bookrow" href={f.url} key={f.ref}>
              <span className="bookrow__body">
                <span className="bookrow__title">{f.ref}</span>
                <span className="bookrow__desc">{f.line}</span>
              </span>
              <span className="bookrow__chev" aria-hidden="true">&rsaquo;</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-sec">
        <h2 className="home-kick">Choose a translation</h2>
        <div className="home-rows">
          <Link className="bookrow" href="/web/">
            <span className="bookrow__body">
              <span className="bookrow__title">World English Bible</span>
              <span className="bookrow__desc">Modern, easy to read</span>
            </span>
            <span className="bookrow__chev" aria-hidden="true">&rsaquo;</span>
          </Link>
          <Link className="bookrow" href="/kjv/">
            <span className="bookrow__body">
              <span className="bookrow__title">King James Version</span>
              <span className="bookrow__desc">Classic, 1600s English, with the Apocrypha</span>
            </span>
            <span className="bookrow__chev" aria-hidden="true">&rsaquo;</span>
          </Link>
          <Link className="bookrow" href="/bbe/">
            <span className="bookrow__body">
              <span className="bookrow__title">Bible in Basic English</span>
              <span className="bookrow__desc">The simplest English</span>
            </span>
            <span className="bookrow__chev" aria-hidden="true">&rsaquo;</span>
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
