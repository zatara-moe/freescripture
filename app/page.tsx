import Link from "next/link";

const FAMOUS = [
  { ref: "Psalm 23",   url: "/web/psalms/23/",        line: "The Lord is my shepherd." },
  { ref: "John 3",     url: "/web/john/3/",           line: "For God so loved the world." },
  { ref: "Genesis 1",  url: "/web/genesis/1/",        line: "In the beginning." },
  { ref: "1 Cor 13",   url: "/web/1-corinthians/13/", line: "Love is patient, love is kind." },
  { ref: "Romans 8",   url: "/web/romans/8/",         line: "Nothing can separate us." },
  { ref: "Matthew 5",  url: "/web/matthew/5/",        line: "Blessed are the meek." },
];

export default function Home() {
  return (
    <div className="home">
      <section className="home-hero">
        <h1 className="home-hero__headline">The whole Bible, open to anyone.</h1>
        <p className="home-hero__sub">Three translations. No account, no ads.</p>
      </section>

      {/* One clear next step, not four equal ones. For a returning
          reader this becomes "Continue reading [X]" automatically;
          for everyone else it's a sensible, specific default rather
          than a vague "start here" button. */}
      <a className="hero-primary" id="quick-start" href="/web/psalms/23/" data-quick-start>
        <span className="hero-primary__body">
          <span className="hero-primary__label" data-quick-start-label>Start with Psalm 23</span>
          <span className="hero-primary__sub" data-quick-start-sub>The Lord is my shepherd. A good place to begin.</span>
        </span>
        <span className="hero-primary__arrow">&rarr;</span>
      </a>

      {/* A real search field — the one pattern every age group already
          knows on sight, so it doesn't need to be a labeled button. */}
      <form className="hero-search" action="/search/" role="search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
        <input
          className="hero-search__input"
          type="search"
          name="q"
          placeholder="Search for a word or verse"
          aria-label="Search scripture"
        />
      </form>

      {/* Lighter-weight paths, as plain text links rather than boxes —
          for someone who wants a different starting point without
          having to evaluate four equally-weighted options first. */}
      <nav className="hero-links" aria-label="More ways to start">
        <Link className="hero-links__link" href="/read/">
          A verse for right now <span>&rarr;</span>
        </Link>
        <Link className="hero-links__link" href="/parables/">
          The parables <span>&rarr;</span>
        </Link>
      </nav>

      <script dangerouslySetInnerHTML={{ __html:
        `(function(){try{var raw=localStorage.getItem('fs-last');if(!raw)return;var d=JSON.parse(raw);var el=document.getElementById('quick-start');if(el&&d.url){el.href=d.url;var lab=el.querySelector('[data-quick-start-label]');if(lab)lab.textContent=d.label?('Continue: '+d.label):'Continue reading';var sub=el.querySelector('[data-quick-start-sub]');if(sub)sub.textContent='Pick up where you left off.';}}catch(e){}})();`
      }} />
      <h2 className="home-h2">Pick a translation</h2>
      <div className="hcard-row hcard-row--col">
        <Link className="hcard hcard--wide" href="/web/">
          <span className="hcard__body">
            <span className="hcard__label">World English Bible</span>
            <span className="hcard__sub">Modern, easy to read &middot; <span className="hcard__tag">Good place to start</span></span>
          </span>
          <span className="hcard__arrow">&rarr;</span>
        </Link>
        <Link className="hcard hcard--wide" href="/kjv/">
          <span className="hcard__body">
            <span className="hcard__label">King James Version</span>
            <span className="hcard__sub">Classic, 1600s English. Includes the Apocrypha.</span>
          </span>
          <span className="hcard__arrow">&rarr;</span>
        </Link>
        <Link className="hcard hcard--wide" href="/bbe/">
          <span className="hcard__body">
            <span className="hcard__label">Bible in Basic English</span>
            <span className="hcard__sub">About 1,000 common words</span>
          </span>
          <span className="hcard__arrow">&rarr;</span>
        </Link>
      </div>
      <h2 className="home-h2">Go to a passage you know</h2>
      <div className="hcard-row hcard-row--3">
        {FAMOUS.map((f) => (
          <Link className="hcard hcard--passage" href={f.url} key={f.ref}>
            <span className="hcard__body">
              <span className="hcard__ref">{f.ref}</span>
              <span className="hcard__sub hcard__sub--italic">{f.line}</span>
            </span>
            <span className="hcard__arrow">&rarr;</span>
          </Link>
        ))}
      </div>
      <h2 className="home-h2">This Sunday</h2>
      <a className="hcard hcard--wide hcard--accented"
         href="https://www.digitallutheranchurch.com/word/propers"
         rel="noopener">
        <span className="hcard__body">
          <span className="hcard__label">This Sunday&apos;s readings</span>
          <span className="hcard__sub">Appointed scripture from the Revised Common Lectionary &middot; Digital Lutheran Church</span>
        </span>
        <span className="hcard__arrow">&rarr;</span>
      </a>
    </div>
  );
}
