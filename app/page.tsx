import Link from "next/link";
import { GENRES } from "@/lib/bible";

const FAMOUS = [
  { ref: "Psalm 23", url: "/web/psalms/23/", line: "The Lord is my shepherd." },
  { ref: "John 3", url: "/web/john/3/", line: "For God so loved the world." },
  { ref: "Genesis 1", url: "/web/genesis/1/", line: "In the beginning." },
  { ref: "1 Corinthians 13", url: "/web/1-corinthians/13/", line: "Love is patient, love is kind." },
  { ref: "Romans 8", url: "/web/romans/8/", line: "Nothing can separate us." },
  { ref: "Matthew 5", url: "/web/matthew/5/", line: "Blessed are the meek." },
];

export default function Home() {
  return (
    <div className="home">

      {/* Hero — matches DLC's voice: says what the site does, not what
          it costs. "Free" is discovered, not announced. */}
      <section className="home-hero">
        <h1 className="home-hero__headline">The whole Bible, open to anyone.</h1>
        <p className="home-hero__sub">
          Three public-domain translations. Read here, or take it with you.
        </p>
      </section>

      {/* Quick access — text-first link blocks, matching DLC's arrow-link
          pattern. No generic stroke icons. Background fill, not borders. */}
      <div className="home-quick">
        <a className="home-quick__card" id="quick-start" href="/web/psalms/23/" data-quick-start>
          <span className="home-quick__label" data-quick-start-label>Start reading</span>
          <span className="home-quick__arrow">&rarr;</span>
        </a>
        <Link className="home-quick__card" href="/read/">
          <span className="home-quick__label">A verse for right now</span>
          <span className="home-quick__arrow">&rarr;</span>
        </Link>
        <Link className="home-quick__card" href="/parables/">
          <span className="home-quick__label">The parables</span>
          <span className="home-quick__arrow">&rarr;</span>
        </Link>
        <Link className="home-quick__card" href="/search/">
          <span className="home-quick__label">Search</span>
          <span className="home-quick__arrow">&rarr;</span>
        </Link>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var raw=localStorage.getItem('fs-last');if(!raw)return;var d=JSON.parse(raw);var el=document.getElementById('quick-start');if(el&&d.url){el.href=d.url;var lab=el.querySelector('[data-quick-start-label]');if(lab)lab.textContent=d.label||'Continue reading';}}catch(e){}})();`,
        }}
      />

      {/* Translations */}
      <h2 className="home-section">Pick a translation</h2>
      <div className="home-translations">
        <Link className="home-trans" href="/web/">
          <span className="home-trans__name">World English Bible</span>
          <span className="home-trans__desc">Modern, easy to read</span>
          <span className="home-trans__tag">Good place to start</span>
        </Link>
        <Link className="home-trans" href="/kjv/">
          <span className="home-trans__name">King James Version</span>
          <span className="home-trans__desc">Classic, 1600s English. Includes the Apocrypha.</span>
        </Link>
        <Link className="home-trans" href="/bbe/">
          <span className="home-trans__name">Bible in Basic English</span>
          <span className="home-trans__desc">About 1,000 common words</span>
        </Link>
      </div>

      {/* Famous passages */}
      <h2 className="home-section">Go to a passage you know</h2>
      <div className="home-passages">
        {FAMOUS.map((f) => (
          <Link className="home-passage" href={f.url} key={f.ref}>
            <span className="home-passage__ref">{f.ref}</span>
            <span className="home-passage__line">{f.line}</span>
          </Link>
        ))}
      </div>

      {/* Parables */}
      <div className="home-section-row">
        <h2 className="home-section">The parables of Jesus</h2>
        <Link className="home-section__more" href="/parables/">All 37 &rarr;</Link>
      </div>
      <div className="home-parables">
        <Link className="home-parable" href="/parables/prodigal-son/">
          <span className="home-parable__title">The Prodigal Son</span>
          <span className="home-parable__line">A son spends everything and comes home.</span>
        </Link>
        <Link className="home-parable" href="/parables/good-samaritan/">
          <span className="home-parable__title">The Good Samaritan</span>
          <span className="home-parable__line">Two pass by. A foreigner stops.</span>
        </Link>
        <Link className="home-parable" href="/parables/sower/">
          <span className="home-parable__title">The Sower</span>
          <span className="home-parable__line">Four soils. One yields.</span>
        </Link>
      </div>

      {/* Browse by kind */}
      <div className="home-section-row">
        <h2 className="home-section">Browse by kind of book</h2>
        <Link className="home-section__more" href="/genre/">See all &rarr;</Link>
      </div>
      <div className="genre-pills">
        {GENRES.map((g: any) => (
          <Link className="genre-pill" href={`/genre/${g.slug}/`} key={g.slug}>
            {g.kicker}
          </Link>
        ))}
      </div>

      {/* This Sunday */}
      <h2 className="home-section">This Sunday</h2>
      <a className="home-sunday" href="https://www.digitallutheranchurch.com/word/propers" rel="noopener">
        <span className="home-sunday__label">This Sunday&apos;s readings</span>
        <span className="home-sunday__desc">The appointed scripture for this week, from the Revised Common Lectionary.</span>
        <span className="home-sunday__from">Digital Lutheran Church &rarr;</span>
      </a>

      {/* From DLC */}
      <div className="home-section-row">
        <h2 className="home-section">From Digital Lutheran Church</h2>
        <a className="home-section__more" href="https://www.digitallutheranchurch.com" rel="noopener">Visit &rarr;</a>
      </div>
      <div className="home-dlc">
        <a className="home-dlc__link" href="https://www.digitallutheranchurch.com/pray/" rel="noopener">
          Daily prayer <span>&rarr;</span>
        </a>
        <a className="home-dlc__link" href="https://www.digitallutheranchurch.com/for/" rel="noopener">
          What do you need <span>&rarr;</span>
        </a>
        <a className="home-dlc__link" href="https://www.digitallutheranchurch.com/library/" rel="noopener">
          The Lutheran library <span>&rarr;</span>
        </a>
      </div>
    </div>
  );
}
