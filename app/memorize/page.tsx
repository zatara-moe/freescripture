import type { Metadata } from "next";
import { SITE_URL } from "@/lib/bible";
import { readableStories, storyHref } from "@/lib/stories";
import { PARTS, partOfPassage } from "@/lib/timeline";

export const metadata: Metadata = {
  title: "Memorize",
  description: "Learn a Bible line by heart, a few minutes at a time. Pick a line and practice it three ways. Saved on your device. No account.",
  alternates: { canonical: `${SITE_URL}/memorize/` },
};

/* Memorize works on this page by itself. Nothing sends you away.
     1. Your lines      the lines you saved, with the ones ready to practice first
                        (learn.js fills this in from this device)
     2. How it works    three short steps, so nothing is a surprise
     3. Lines to learn  every story's memory line, ready to practice right here
   Each line also links to its story, for anyone who wants the context. */

/* Short, well-known lines that suit a first try. */
const STARTERS = ["psalm-23", "nicodemus", "the-love-chapter", "crossing-the-red-sea", "jesus-walks-on-water", "the-resurrection"];

type Line = { slug: string; title: string; url: string; ref: string; part: boolean; text: string; gaps: string[]; decoys: string[]; bible: number };

export default function MemorizePage() {
  const lines: Line[] = readableStories()
    .filter((s) => s.memorize)
    .map((s) => ({
      slug: s.slug, title: s.title, url: storyHref(s), ref: s.memorize!.ref, part: !!s.memorize!.part,
      text: s.memorize!.text, gaps: s.memorize!.gaps, decoys: s.memorize!.decoys,
      bible: partOfPassage(s.passage)?.n ?? 4,
    }))
    .sort((a, b) => a.bible - b.bible);
  const starters = STARTERS.map((sl) => lines.find((l) => l.slug === sl)).filter(Boolean) as Line[];

  const Card = ({ l }: { l: Line }) => (
    <li className="mline" data-mline={l.slug}>
      <p className="mline__ref">{l.part ? "From " : ""}{l.ref}</p>
      <p className="mline__text" data-mline-text>{l.text}</p>
      <p className="mline__from">From the story <a href={l.url}>{l.title}</a></p>
      <div className="mline__btns">
        <button type="button" className="btn btn--primary" data-mline-practice>Practice it here</button>
        <button type="button" className="btn btn--line" data-mline-add>Add to my lines</button>
        <a className="btn btn--quiet mline__on" href="#your-lines" data-mline-on hidden>On your list ✓</a>
      </div>
      <div className="mem__practice mline__practice" data-mline-box hidden></div>
      <div className="mline__save" data-mline-save hidden>
        <p className="mline__save-q">How did that go?</p>
        <div className="mline__btns">
          <button type="button" className="btn btn--primary" data-mline-knew>I know it</button>
          <button type="button" className="btn btn--line" data-mline-again>Practice again tomorrow</button>
        </div>
      </div>
      <p className="mline__saved" data-mline-saved role="status"></p>
    </li>
  );

  return (
    <div className="mem2">
      <header className="mem2__head">
        <h1 className="cat-title ph-title">Memorize Bible verses</h1>
        <p className="cat-lede ph-lede">Learn one line by heart, a few minutes at a time. Pick a line below and practice it right here.</p>
        <p className="mem-page__private">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
          Saved on this device only. No account.
        </p>
      </header>

      <section className="mem2__mine" id="your-lines" data-mem-mine hidden aria-labelledby="mine-title">
        <div className="home4-head">
          <h2 className="home4-h2" id="mine-title">Your lines</h2>
          <p className="home4-note" data-mem-summary></p>
        </div>
        <ol className="mem-list" data-mem-list></ol>
      </section>

      <section className="mem2__how" aria-labelledby="how-title">
        <h2 className="mem2__how-title" id="how-title">How it works</h2>
        <ol className="mem2__steps">
          <li><span className="start-card__n">1</span><span><strong>Pick a line.</strong> Every story has one. Start with a short one you may already know.</span></li>
          <li><span className="start-card__n">2</span><span><strong>Practice it three ways:</strong> first letters, fill the gaps, and put the words in order. No grades.</span></li>
          <li><span className="start-card__n">3</span><span><strong>It comes back.</strong> Tomorrow, then in 3, 7, 14, and 30 days, so it sticks.</span></li>
        </ol>
      </section>

      <section className="mem2__lib" aria-labelledby="start-title">
        <div className="home4-head">
          <h2 className="home4-h2" id="start-title">Good lines to start with</h2>
          <p className="home4-note">Short and well known.</p>
        </div>
        <ul className="mline-grid">
          {starters.map((l) => <Card l={l} key={l.slug} />)}
        </ul>
      </section>

      <section className="mem2__lib" aria-labelledby="all-title">
        <div className="home4-head">
          <h2 className="home4-h2" id="all-title">Every line, in Bible order</h2>
          <p className="home4-note">{lines.length} lines, one from each story. Open a part to see its lines.</p>
        </div>
        <div className="mem2__parts">
          {PARTS.map((p) => {
            const list = lines.filter((l) => l.bible === p.n);
            if (!list.length) return null;
            return (
              <details className="mem2__part" key={p.n}>
                <summary>
                  <span className={`mem2__part-bar tl-t${p.n}`} aria-hidden="true"></span>
                  <span className="mem2__part-name">Part {p.n}: {p.name}</span>
                  <span className="mem2__part-count">{list.length} lines</span>
                </summary>
                <ul className="mline-grid">
                  {list.map((l) => <Card l={l} key={l.slug} />)}
                </ul>
              </details>
            );
          })}
        </div>
      </section>

      <script id="mem-lines" type="application/json" dangerouslySetInnerHTML={{ __html: JSON.stringify(lines).replace(/</g, "\\u003c") }} />
      <script src="/static/js/learn.js?v=5" defer></script>
    </div>
  );
}
