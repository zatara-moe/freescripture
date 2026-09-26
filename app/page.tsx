import { NEEDS, PARABLES } from "@/lib/bible";
import { PATHS, pathsData, pathMinutes } from "@/lib/paths";
import { readableStories, storyMinutes, catalog, nw } from "@/lib/stories";
import { loadStory } from "@/lib/story";
import { PARTS } from "@/lib/timeline";
import { Bands } from "@/lib/TimelineBands";

/* Home: an overview, not a set of doors.
   It answers, in this order:
     1. What should I do next?     (returning readers, filled in by learn.js)
     2. I'm new. Where do I start? (one story, with what will happen)
     3. What does it look like?    (a shelf of stories people already know)
     4. How does it all fit?       (the timeline, then reading paths)
     5. What else is here?         (every area, with counts and where it goes)
   Every link says where it goes, so nothing on the next page is a surprise.
   Feeling filters stay inside Filters on the Stories page, not here. */

/* Stories most people already know, in Bible order. */
const FAMILIAR = ["noahs-ark", "david-and-goliath", "jonah", "the-birth-of-jesus", "the-prodigal-son", "the-resurrection"];
/* Three short paths that suit a first visit. */
const START_PATHS = ["who-is-jesus", "christmas", "holy-week"];

export default function Home() {
  const ready = readableStories();
  // New visitors start with a short, gentle story about who Jesus is.
  const START_SLUG = "jesus-calms-the-storm";
  const first = ready.find((s) => s.slug === START_SLUG) || ready[0];
  const firstMin = first ? storyMinutes(first.slug) : null;
  const firstStats = first ? loadStory(first.slug) : null;
  const unit = "scenes";

  const cat = catalog();
  const shelf = FAMILIAR.map((slug) => cat.find((c) => c.id === `story-${slug}`)).filter(Boolean) as ReturnType<typeof catalog>;
  const paths = START_PATHS.map((slug) => PATHS.find((p) => p.slug === slug)).filter(Boolean) as typeof PATHS;
  const storyCount = ready.length;

  const areas = [
    { href: "/stories/", title: "Bible stories", count: `${storyCount} stories`, line: "Explained scene by scene, with the verse beside each paragraph.", opens: "Opens the Stories list" },
    { href: "/parables/", title: "Parables of Jesus", count: `${PARABLES.length} parables`, line: "Short stories Jesus told, sorted by what they are about.", opens: "Opens Parables" },
    { href: "/read/", title: "Verses for how you feel", count: `${NEEDS.length} topics`, line: "A few verses for a hard day or a good one. Easy to send to a friend.", opens: "Opens Verses for how you feel" },
    { href: "/bsb/", title: "Full Bible", count: "66 books", line: "The actual text, word for word, in 4 free translations.", opens: "Opens Full Bible" },
    { href: "/memorize/", title: "Memorize", count: "Your lines", line: "Lines you are learning by heart, and when to practice next.", opens: "Opens Memorize" },
    { href: "/search/", title: "Search", count: "Stories and verses", line: "Find a story, a person, or a verse like John 3:16.", opens: "Opens Search" },
  ];

  return (
    <div className="home4">
      <section className="home4-hero" aria-labelledby="home-title">
        <div className="home4-hero__text">
          <h1 className="home4-title" id="home-title">The Bible, one scene at a time.</h1>
          <p className="home4-lede">Bible stories explained in plain words, with the Bible verse beside every paragraph. Free, with no account and no ads.</p>
        </div>

        <div className="home4-hero__side">
          <section className="next-step" data-home-next hidden aria-labelledby="next-title">
            <h2 className="home4-h2" id="next-title">Your next step</h2>
            <div className="next-step__list" data-home-next-list></div>
          </section>

          {first && (
            <section className="start-card" data-start-here aria-labelledby="start-title">
              <span className="start-card__kicker">New here? Start here</span>
              <h2 className="start-card__title" id="start-title">{nw(`Read one story in about ${firstMin} minutes`)}</h2>
              <p className="start-card__story"><strong>{first.title}</strong> <span className="nowrap">({first.ref.replace(/-/g, "\u2011")})</span>. {first.subtitle}. Here is what will happen:</p>
              <ol className="start-card__steps">
                <li><span className="start-card__n">1</span><span><strong>Story:</strong> what happened, in {firstStats?.scenes || 4} short {unit}.</span></li>
                <li><span className="start-card__n">2</span><span><strong>Meaning:</strong> hard words and key lines, explained.</span></li>
                <li><span className="start-card__n">3</span><span><strong>For you:</strong> tap an answer and see what it means for your life. No typing, no grades.</span></li>
                <li><span className="start-card__n">4</span><span><strong>Memorize:</strong> one line to learn by heart.</span></li>
              </ol>
              <a className="btn btn--primary btn--wide" href={`/stories/${first.slug}/`}>Start the story</a>
            </section>
          )}
        </div>
      </section>

      <section className="home4-section" aria-labelledby="shelf-title">
        <div className="home4-head">
          <h2 className="home4-h2" id="shelf-title">{nw("Stories you may already know")}</h2>
          <a className="home4-more" href="/stories/">See all {storyCount} stories</a>
        </div>
        <div className="home-shelf">
          <ul className="shelf2__row home-shelf__row">
            {shelf.map((c) => (
              <li key={c.id}>
                <a className={`cover2 cover2--${c.kind.toLowerCase()}`} href={c.href}>
                  <span className="cover2__spine" aria-hidden="true"></span>
                  <span className="cover2__body">
                    <span className="cover2__top"><span className="cover2__kind">{c.kind}</span></span>
                    <span className="cover2__rule" aria-hidden="true"></span>
                    <span className="cover2__title">{c.title}</span>
                    <span className="cover2__sub">{c.subtitle}</span>
                    <span className="cover2__time">{c.minutes ? `About ${c.minutes} min` : ""}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <div className="shelf2__ledge" aria-hidden="true"></div>
        </div>
        <p className="home4-note home-shelf__hint">Each cover opens that story. Slide the row to see more.</p>
      </section>

      <section className="home4-section" aria-labelledby="tl-title">
        <a className="home-tl" href="/timeline/">
          <span className="home-tl__kicker">Bible timeline</span>
          <span className="home-tl__title" id="tl-title">{nw("The whole Bible story, in 4 parts")}</span>
          <Bands />
          <span className="home-tl__parts">
            {PARTS.map((p) => (
              <span className={`home-tl__part tl-t${p.n}`} key={p.n}>
                <span className="home-tl__n">Part {p.n}</span>
                <span className="home-tl__name">{p.name}</span>
                <span className="home-tl__years">{p.years}</span>
              </span>
            ))}
          </span>
          <span className="area__opens">Opens the timeline. Every story shows where it fits.</span>
        </a>
      </section>

      <section className="home4-section" aria-labelledby="paths-title">
        <div className="home4-head">
          <h2 className="home4-h2" id="paths-title">Reading paths</h2>
          <a className="home4-more" href="/stories/#paths">See all {PATHS.length} paths</a>
        </div>
        <p className="home4-note home4-note--under">A few stories in order, one step at a time. Your progress is saved on this device.</p>
        <ul className="area-grid">
          {paths.map((p) => (
            <li key={p.slug}>
              <a className="area" href={`/paths/${p.slug}/`}>
                <span className="area__count">{p.steps.length} stories · About {pathMinutes(p)} min</span>
                <span className="area__title">{nw(p.title)}</span>
                <span className="area__line">{p.question}</span>
                <span className="area__opens">Opens the reading path</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="home4-section" aria-labelledby="all-title">
        <div className="home4-head">
          <h2 className="home4-h2" id="all-title">Everything on Free Scripture</h2>
          <p className="home4-note">Each card says where it goes.</p>
        </div>
        <ul className="area-grid">
          {areas.map((a) => (
            <li key={a.title}>
              <a className="area" href={a.href}>
                <span className="area__count">{a.count}</span>
                <span className="area__title">{nw(a.title)}</span>
                <span className="area__line">{a.line}</span>
                <span className="area__opens">{a.opens}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="home4-section home4-sunday" aria-label="This week in church">
        <a className="area area--wide" href="https://www.digitallutheranchurch.com/word/propers" rel="noopener">
          <span className="area__count">Every week</span>
          <span className="area__title">This Sunday&rsquo;s&nbsp;readings</span>
          <span className="area__line">The Bible readings many churches use this week, at Digital Lutheran Church.</span>
          <span className="area__opens">Opens another website</span>
        </a>
      </section>
      <script type="application/json" id="paths-data" dangerouslySetInnerHTML={{ __html: JSON.stringify(pathsData()).replace(/</g, "\\u003c") }} />
      <script src="/static/js/learn.js?v=4" defer></script>
    </div>
  );
}
