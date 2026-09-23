import Link from "next/link";
import { NEEDS, PARABLES, GENRES, pullVerse, TRANSLATIONS } from "@/lib/bible";
import { STORIES, readableStories, isReadable, compareHref } from "@/lib/stories";
import { loadScenes, loadStory } from "@/lib/story";
import QuickStart from "./QuickStart";
import { Shelf, StoryCover, ParableCover } from "./Shelf";

/* Homepage: a bookshelf, not a landing page.
   1. Hero: one primary action, and the first story shown open to Scene 1.
   2. The story shelf.
   3. Side by side: a real scene next to the verses it retells.
   4. The parables shelf.
   5. Verses for right now.
   6. The whole Bible, for readers who came for a translation.
   Every section sits on the same vertical rhythm. */

const FEATURED_PARABLES = ["prodigal-son", "good-samaritan", "lost-sheep", "sower", "mustard-seed", "talents"];
const HOME_NEEDS = ["fear", "alone", "racing-mind", "guilt"];

function paragraphs(html: string) {
  return html.split("</p>").map((x) => x.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim()).filter(Boolean);
}
function bookOf(ref: string) {
  return ref.replace(/\s+\d.*$/, "");
}

/* The open book in the hero: Scene 1 of the first readable story. */
function openBook() {
  const s = readableStories()[0];
  if (!s) return null;
  const sc = loadScenes(s.slug).find((x) => x.range);
  if (!sc || !sc.range) return null;
  const r = sc.range;
  const range = r.startV === r.endV ? `${r.startCh}:${r.startV}` : `${r.startCh}:${r.startV}-${r.endV}`;
  return {
    story: s.title,
    href: `/stories/${s.slug}/`,
    num: sc.num,
    title: sc.title,
    ref: `${bookOf(s.ref)} ${range}`,
    text: paragraphs(sc.html)[0] || "",
  };
}

/* The side-by-side sample: two paragraphs of a scene next to the two
   verses they retell. Falls back to one verse in two translations. */
function sideBySide() {
  const s = readableStories()[0];
  if (s) {
    const scenes = loadScenes(s.slug).filter((x) => x.range);
    const sc = scenes.find((x) => x.num === 8) || scenes[0];
    if (sc && sc.range) {
      const book = bookOf(s.ref);
      const a = sc.range.startV, ch = sc.range.startCh;
      const b = Math.min(a + 1, sc.range.endCh === ch ? sc.range.endV : a + 1);
      const verses = [a, b].filter((v, i, arr) => arr.indexOf(v) === i).map((v) => pullVerse("web", book, ch, v)).filter(Boolean);
      return {
        href: compareHref(s),
        left: { tag: "Scene by Scene", head: `Scene ${sc.num}: ${sc.title}`, text: paragraphs(sc.html).slice(0, 2) },
        right: { tag: TRANSLATIONS.web.label, head: `${book} ${ch}:${a === b ? a : `${a}-${b}`}`, text: [verses.join(" ")] },
      };
    }
  }
  return {
    href: "/compare/john/3/?a=web&b=kjv",
    left: { tag: TRANSLATIONS.web.label, head: "John 3:16", text: [pullVerse("web", "John", 3, 16)] },
    right: { tag: TRANSLATIONS.kjv.label, head: "John 3:16", text: [pullVerse("kjv", "John", 3, 16)] },
  };
}

export default function Home() {
  const readable = STORIES.filter(isReadable);
  const shelf = [...readable, ...STORIES.filter((s) => !isReadable(s))];
  const firstStory = readable[0];
  const firstStats = firstStory ? loadStory(firstStory.slug) : null;
  const firstMin = firstStats ? Math.max(1, Math.round(firstStats.words / 200)) : 0;
  const parables = FEATURED_PARABLES.map((slug) => (PARABLES as any[]).find((p) => p.slug === slug)).filter(Boolean);
  const needs = HOME_NEEDS.map((slug) => (NEEDS as any[]).find((n) => n.slug === slug)).filter(Boolean) as any[];
  const book = openBook();
  const sbs = sideBySide();

  return (
    <div className="home3">
      <section className={`hero${book ? "" : " hero--solo"}`} aria-labelledby="hero-title">
        <div className="hero__text">
          <p className="hero__series">Scene by Scene</p>
          <h1 className="hero__title" id="hero-title">Bible stories,<br />one scene at a time.</h1>
          <p className="hero__lede">Plain-language retellings you can read next to the Bible itself. Free, with no account and no ads.</p>
          <QuickStart
            start={firstStory && firstStats
              ? { href: `/stories/${firstStory.slug}/`, label: `Start with ${firstStory.title}`, sub: `About ${firstMin} minutes. ${firstStats.scenes} short scenes.` }
              : undefined}
          />
        </div>
        {book && (
          <Link className="hero__display" href={book.href} aria-label={`Open ${book.story} to scene ${book.num}`}>
            <span className="spread">
              <span className="spread__page spread__page--left">
                <span className="spread__story">{book.story}</span>
                <span className="spread__rule" aria-hidden="true" />
                <span className="spread__scene">Scene {book.num}</span>
                <span className="spread__title">{book.title}</span>
                <span className="spread__mark" aria-hidden="true" />
                <span className="spread__ref">{book.ref}</span>
              </span>
              <span className="spread__page spread__page--right">
                <span className="spread__text">{book.text}</span>
                <span className="spread__folio">1</span>
              </span>
            </span>
            <span className="hero__caption">Open to the first scene</span>
          </Link>
        )}
      </section>

      <Shelf id="home-stories" title="Stories" more={{ href: "/stories/", label: "See all" }}>
        {shelf.map((s) => <StoryCover key={s.slug} s={s} />)}
      </Shelf>

      <section className="band" aria-labelledby="home-sbs">
        <div className="band__inner">
          <div className="band__intro">
            <h2 className="band__title" id="home-sbs">Read it next to the Bible.</h2>
            <p className="band__lede">Every scene lines up with the verses it comes from, so you can always check the retelling against the text.</p>
            <Link className="band__link" href={sbs.href}>Open side by side</Link>
          </div>
          <div className="band__pair">
            {[sbs.left, sbs.right].map((c, i) => (
              <div className={`pagecard${i === 0 ? " pagecard--story" : ""}`} key={i}>
                <span className="pagecard__tag">{c.tag}</span>
                <span className="pagecard__head">{c.head}</span>
                {c.text.map((t, j) => <p className="pagecard__text" key={j}>{t}</p>)}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Shelf id="home-parables" title="Parables of Jesus" more={{ href: "/parables/", label: `All ${PARABLES.length}` }}>
        {parables.map((p: any) => <ParableCover key={p.slug} p={p} />)}
      </Shelf>

      <section className="home3-section" aria-labelledby="home-verses">
        <div className="shelf__head">
          <h2 className="shelf__title" id="home-verses">Verses for right now</h2>
          <Link className="shelf__more" href="/read/">See all {(NEEDS as any[]).length}</Link>
        </div>
        <div className="tiles">
          {needs.map((n) => (
            <Link key={n.slug} className="tile" href={`/read/${n.slug}/`}>
              <span className="tile__title">{n.short}</span>
              <span className="tile__line">{n.card}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home3-section" aria-labelledby="home-bible">
        <div className="shelf__head">
          <h2 className="shelf__title" id="home-bible">The whole Bible</h2>
          <Link className="shelf__more" href="/web/">All 66 books</Link>
        </div>
        <p className="home3-lede">
          Every chapter in three free translations: {TRANSLATIONS.web.nick} ({TRANSLATIONS.web.short}),
          {" "}{TRANSLATIONS.kjv.nick} ({TRANSLATIONS.kjv.short}), and {TRANSLATIONS.bbe.nick} ({TRANSLATIONS.bbe.short}).
        </p>
        <form className="hero-search" action="/search/" role="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input className="hero-search__input" type="search" name="q" placeholder="Search a word, or try John 3:16" aria-label="Search the Bible" />
        </form>
        <div className="tiles tiles--kinds">
          {(GENRES as any[]).map((g) => (
            <Link key={g.slug} className="tile tile--kind" href={`/genre/${g.slug}/`}>
              <span className="tile__title">{g.kicker}</span>
              <span className="tile__line">{g.label}</span>
            </Link>
          ))}
        </div>
        <a className="tile tile--wide" href="https://www.digitallutheranchurch.com/word/propers" rel="noopener">
          <span className="tile__title">This Sunday&apos;s readings</span>
          <span className="tile__line">The appointed readings for this week, at Digital Lutheran Church.</span>
        </a>
      </section>
    </div>
  );
}
