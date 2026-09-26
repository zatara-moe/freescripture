import type { Metadata } from "next";
import { booksForTranslation, TRANSLATIONS, SITE_URL } from "@/lib/bible";
import { readableStories, compareHref } from "@/lib/stories";

export const metadata: Metadata = {
  title: "Side by side",
  description: "Read any Bible chapter in two versions at once, or read a plain-language retelling next to the Bible text it comes from.",
  alternates: { canonical: `${SITE_URL}/compare/` },
};

const CLASSICS = [
  { ref: "Psalm 23", url: "/compare/psalms/23/", line: "The Lord is my shepherd." },
  { ref: "John 3", url: "/compare/john/3/", line: "For God so loved the world." },
  { ref: "1 Corinthians 13", url: "/compare/1-corinthians/13/", line: "Love is patient, love is kind." },
  { ref: "Genesis 1", url: "/compare/genesis/1/", line: "In the beginning." },
];

function Chev() {
  return <svg className="story-row__chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>;
}

export default function CompareHub() {
  const stories = readableStories();
  const books = booksForTranslation("web");
  const t = TRANSLATIONS;
  return (
    <div className="reading-column cmp-hub">
      <header className="page-head">
        <h1 className="page-title">Side by side</h1>
        <p className="page-lede">
          Read two versions at once. Put a Scene by Scene story next to the
          Bible text it retells, or see how {t.web.nick}, {t.kjv.nick}, and {t.bbe.nick} English
          say the same verse.
        </p>
      </header>

      {stories.length > 0 && (
        <section className="home2-section" aria-labelledby="cmp-stories">
          <h2 className="stories-section__title" id="cmp-stories">A story next to the Bible</h2>
          <p className="section-lede">Each scene lines up with the verses it comes from, so you can check the retelling against the text.</p>
          <div className="story-list">
            {stories.map((s) => (
              <a key={s.slug} className="story-row" href={compareHref(s)}>
                <div className="story-row__body">
                  <div className="story-row__name">{s.title}</div>
                  <div className="story-row__desc">Scene by Scene next to the {t.web.label}</div>
                  <div className="story-row__meta"><span>{s.ref}</span></div>
                </div>
                <Chev />
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="home2-section" aria-labelledby="cmp-pick">
        <h2 className="stories-section__title" id="cmp-pick">Pick any chapter</h2>
        <form className="cmp-go" data-cmp-go action="/compare/">
          <label className="cmp-pick">
            <span className="cmp-pick__label">Book</span>
            <select name="book" defaultValue="john">
              {books.map((b) => (
                <option key={b.slug} value={b.slug} data-max={b.chapters[b.chapters.length - 1]}>{b.name}</option>
              ))}
            </select>
          </label>
          <label className="cmp-pick cmp-pick--num">
            <span className="cmp-pick__label">Chapter</span>
            <input name="chapter" type="number" inputMode="numeric" min={1} defaultValue={3} />
          </label>
          <button className="rbtn" type="submit">Open side by side</button>
        </form>
      </section>

      <section className="home2-section" aria-labelledby="cmp-classics">
        <h2 className="stories-section__title" id="cmp-classics">Good places to start</h2>
        <div className="passage-rows">
          {CLASSICS.map((c) => (
            <a className="passage-row" href={c.url} key={c.ref}>
              <span className="passage-row__ref">{c.ref}</span>
              <span className="passage-row__line">{c.line}</span>
              <Chev />
            </a>
          ))}
        </div>
      </section>

      <script dangerouslySetInnerHTML={{ __html: `
(function(){
  var f=document.querySelector('[data-cmp-go]'); if(!f) return;
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var sel=f.elements.book, opt=sel.options[sel.selectedIndex];
    var max=parseInt(opt.getAttribute('data-max'),10)||1;
    var n=Math.min(Math.max(parseInt(f.elements.chapter.value,10)||1,1),max);
    location.href='/compare/'+sel.value+'/'+n+'/';
  });
})();` }} />
    </div>
  );
}
