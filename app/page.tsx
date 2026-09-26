import { NEEDS, PARABLES } from "@/lib/bible";
import { PATHS, pathsData } from "@/lib/paths";
import { readableStories, storyMinutes, FEELINGS, nw } from "@/lib/stories";
import { loadStory } from "@/lib/story";

/* Home: an overview, not a set of doors.
   It answers three questions, in this order:
     1. What should I do next?    (returning readers, filled in by learn.js)
     2. I'm new. Where do I start? (one story, with what will happen)
     3. What's on this site?      (everything, with counts and what opens)
   Then a shortcut into Stories by feeling. */

export default function Home() {
  const ready = readableStories();
  // New visitors start with a short, gentle story about who Jesus is.
  const START_SLUG = "jesus-calms-the-storm";
  const first = ready.find((s) => s.slug === START_SLUG) || ready[0];
  const firstMin = first ? storyMinutes(first.slug) : null;
  const firstStats = first ? loadStory(first.slug) : null;
  const unit = "scenes";

  const areas = [
    { href: "/stories/?kind=Story,Teaching", title: "Bible stories", count: "New stories added often", line: "Explained scene by scene, with the verse beside each paragraph.", opens: "Opens the Stories list" },
    { href: "/stories/#paths", title: "Reading paths", count: `${PATHS.length} paths`, line: PATHS.map((pp) => `"${pp.title}"`).join(" and ") + ". A few stories in order, one step at a time.", opens: "Opens the Stories list" },
    { href: "/timeline/", title: "Bible timeline", count: "4 parts", line: "The whole Bible story in time order, drawn to scale, with where each story fits.", opens: "Opens the timeline" },
    { href: "/stories/?kind=Parable", title: "Parables of Jesus", count: `${PARABLES.length}`, line: "Short stories Jesus told, with the surprising point.", opens: "Opens the Stories list" },
    { href: "/stories/?kind=Verses", title: "Verses for how you feel", count: `${NEEDS.length} topics`, line: "A few verses about one feeling. Easy to send to a friend.", opens: "Opens the Stories list" },
    { href: "/bsb/", title: "Full Bible", count: "66 books", line: "The actual text, word for word, in 4 free translations.", opens: "Opens Full Bible" },
    { href: "/memorize/", title: "Memorize", count: "Your lines", line: "Lines you are learning by heart, and when to practice next.", opens: "Opens Memorize" },
    { href: "/search/", title: "Search", count: "Every verse", line: "Find a word, a name, or a verse like John 3:16.", opens: "Opens Search" },
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

      <section className="home4-section" aria-labelledby="all-title">
        <div className="home4-head">
          <h2 className="home4-h2" id="all-title">Everything on Free Scripture</h2>
          <p className="home4-note">Each one says what it opens. Nothing starts until you pick.</p>
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

      <section className="home4-section" aria-labelledby="feel-title">
        <div className="home4-head">
          <h2 className="home4-h2" id="feel-title">Find something for how you feel</h2>
          <p className="home4-note">Opens the Stories list, already filtered. You can change it there.</p>
        </div>
        <ul className="feel-chips">
          {FEELINGS.map((f) => (
            <li key={f.slug}><a className="feel-chip" href={`/stories/?feel=${f.slug}`}>{f.label}</a></li>
          ))}
          <li><a className="feel-chip feel-chip--plain" href="/stories/">Just curious</a></li>
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
      <script src="/static/js/learn.js?v=3" defer></script>
    </div>
  );
}
