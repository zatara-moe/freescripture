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

/* Icon set for the quick-access grid and row leads. Same stroke style
   as the tab bar (1.7-2px, round caps) so the whole site reads as one
   icon language, not a mix of styles. Icons exist so someone can find
   their way by recognizing a shape, not by reading a paragraph. */
function IconBook() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M19 19H6a2 2 0 0 0-2 2" /></svg>;
}
function IconHeart() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" /></svg>;
}
function IconStory() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>;
}
function IconCross() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v18" /><path d="M7 8h10" /></svg>;
}
function IconCalendar() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18" /><path d="M8 3v4" /><path d="M16 3v4" /></svg>;
}

export default function Home() {
  return (
    <div className="home">
      <section className="home-hero">
        <h1 className="home-hero__title">Free Scripture</h1>
        <p className="home-hero__sub">
          The King James, World English, and Basic English Bibles. Free, with no account and no ads.
        </p>
      </section>

      {/* --- Quick access ---
          Four big, icon-led cards instead of a page of text to read.
          This is the actual front door for someone who does not know
          the site: recognize a picture and a few words, tap it, done.
          No scrolling past six sections to find the right link. */}
      <div className="home-divider" />
      <div className="section-label">Quick start</div>
      <div className="quick-grid">
        <a className="quick-card quick-card--start" id="quick-start" href="/web/psalms/23/" data-quick-start>
          <span className="quick-card__icon" data-quick-start-icon><IconBook /></span>
          <span className="quick-card__label" data-quick-start-label>Just start reading</span>
        </a>
        <Link className="quick-card" href="/read/">
          <span className="quick-card__icon"><IconHeart /></span>
          <span className="quick-card__label">A verse for right now</span>
        </Link>
        <Link className="quick-card" href="/parables/">
          <span className="quick-card__icon"><IconStory /></span>
          <span className="quick-card__label">Read me a story</span>
        </Link>
        <form className="quick-card quick-card--search" action="/search/" role="search">
          <span className="quick-card__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          </span>
          <input
            className="quick-card__search-input"
            type="search"
            name="q"
            placeholder="Search for a word or verse"
            aria-label="Search scripture"
          />
        </form>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var raw=localStorage.getItem('fs-last');if(!raw)return;var d=JSON.parse(raw);var el=document.getElementById('quick-start');if(el&&d.url){el.href=d.url;var lab=el.querySelector('[data-quick-start-label]');if(lab)lab.textContent=d.label?('Continue: '+d.label):'Continue reading';var ic=el.querySelector('[data-quick-start-icon]');if(ic)ic.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4a2 2 0 0 0-2 2v14l8-5 8 5V6a2 2 0 0 0-2-2z"/></svg>';}}catch(e){}})();`,
        }}
      />

      {/* --- Start reading: translations --- */}
      <div className="home-divider" />
      <div className="section-label">Start reading</div>
      <div className="read-list" style={{ marginBottom: 0 }}>
        {TRANS_CARDS.map((tc) => (
          <Link className="bookrow bookrow--primary" href={`/${tc.slug}/`} key={tc.slug}>
            <span className="bookrow__icon"><IconBook /></span>
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
      <div className="read-list read-list--grid">
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

      {/* --- Parables --- */}
      <div className="home-divider" />
      <div className="section-head">
        <span className="section-label">The parables of Jesus</span>
        <Link className="section-link" href="/parables/">All 37 &rarr;</Link>
      </div>
      <div className="read-list">
        <Link className="bookrow" href="/parables/prodigal-son/">
          <span className="bookrow__icon"><IconStory /></span>
          <span className="bookrow__main">
            <span className="bookrow__t">The Prodigal Son</span>
            <span className="bookrow__d">A son spends everything and comes home expecting to be a servant.</span>
          </span>
          <Chev />
        </Link>
        <Link className="bookrow" href="/parables/good-samaritan/">
          <span className="bookrow__icon"><IconStory /></span>
          <span className="bookrow__main">
            <span className="bookrow__t">The Good Samaritan</span>
            <span className="bookrow__d">Two religious men pass by. A foreigner stops.</span>
          </span>
          <Chev />
        </Link>
        <Link className="bookrow" href="/parables/sower/">
          <span className="bookrow__icon"><IconStory /></span>
          <span className="bookrow__main">
            <span className="bookrow__t">The Sower</span>
            <span className="bookrow__d">Seed on a path, on rock, among thorns, on good soil.</span>
          </span>
          <Chev />
        </Link>
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

      {/* --- This Sunday (DLC integration) --- */}
      <div className="home-divider" />
      <div className="section-label">This Sunday</div>
      <a className="bookrow bookrow--primary" href="https://www.digitallutheranchurch.com/word/propers" rel="noopener">
        <span className="bookrow__icon"><IconCalendar /></span>
        <span className="bookrow__main">
          <span className="bookrow__t">This Sunday&apos;s readings</span>
          <span className="bookrow__d">The appointed scripture for this week, from the Revised Common Lectionary.</span>
          <span className="bookrow__tag">Digital Lutheran Church</span>
        </span>
        <Chev />
      </a>

      {/* --- From DLC (cross-site pastoral content) --- */}
      <div className="home-divider" />
      <div className="section-head">
        <span className="section-label">From Digital Lutheran Church</span>
        <a className="section-link" href="https://www.digitallutheranchurch.com" rel="noopener">Visit &rarr;</a>
      </div>
      <div className="read-list">
        <a className="bookrow" href="https://www.digitallutheranchurch.com/pray/" rel="noopener">
          <span className="bookrow__icon"><IconCross /></span>
          <span className="bookrow__main">
            <span className="bookrow__t">Daily prayer</span>
            <span className="bookrow__d">Morning, evening, and night offices in the historic tradition.</span>
          </span>
          <Chev />
        </a>
        <a className="bookrow" href="https://www.digitallutheranchurch.com/for/" rel="noopener">
          <span className="bookrow__icon"><IconHeart /></span>
          <span className="bookrow__main">
            <span className="bookrow__t">What do you need</span>
            <span className="bookrow__d">Grief, doubt, fear, marriage, work. Sorted by what brought you here.</span>
          </span>
          <Chev />
        </a>
        <a className="bookrow" href="https://www.digitallutheranchurch.com/library/" rel="noopener">
          <span className="bookrow__icon"><IconBook /></span>
          <span className="bookrow__main">
            <span className="bookrow__t">The Lutheran library</span>
            <span className="bookrow__d">Fifty works of Luther, free to read.</span>
          </span>
          <Chev />
        </a>
      </div>
    </div>
  );
}
