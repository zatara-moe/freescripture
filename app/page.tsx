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
        <h1 className="home-hero__headline">The whole Bible,<br />open to anyone.</h1>
        <p className="home-hero__sub">Three translations. No account, no ads.</p>
      </section>
      <div className="hcard-row hcard-row--4">
        <a className="hcard" id="quick-start" href="/web/psalms/23/" data-quick-start>
          <span className="hcard__label" data-quick-start-label>Start reading</span>
          <span className="hcard__arrow">&rarr;</span>
        </a>
        <Link className="hcard" href="/read/">
          <span className="hcard__label">For right now</span>
          <span className="hcard__arrow">&rarr;</span>
        </Link>
        <Link className="hcard" href="/parables/">
          <span className="hcard__label">Parables</span>
          <span className="hcard__arrow">&rarr;</span>
        </Link>
        <Link className="hcard" href="/search/">
          <span className="hcard__label">Search</span>
          <span className="hcard__arrow">&rarr;</span>
        </Link>
      </div>
      <script dangerouslySetInnerHTML={{ __html:
        `(function(){try{var raw=localStorage.getItem('fs-last');if(!raw)return;var d=JSON.parse(raw);var el=document.getElementById('quick-start');if(el&&d.url){el.href=d.url;var lab=el.querySelector('[data-quick-start-label]');if(lab)lab.textContent=d.label||'Continue';}}catch(e){}})();`
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
