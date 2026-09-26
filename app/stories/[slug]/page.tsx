import { Fragment } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_URL, loadChapter } from "@/lib/bible";
import { nextReadableInBible, prevReadable, nextReadable, sameFeeling, FEELINGS, nw, STORIES, storyBySlug, isBuilt, isIndexed, isReadable, siblings, compareHref, storyMinutes, stepMinutes, LENSES } from "@/lib/stories";
import { eraOfPassage, partOfEra, partOfPassage, eraCenter } from "@/lib/timeline";
import { Bands } from "@/lib/TimelineBands";
import { loadStory, loadScenes, type Block, type Box } from "@/lib/story";
import { WORDS } from "@/lib/words";
import { pathsData } from "@/lib/paths";

/* A Scene by Scene story, in four steps that are the same on every story:
     1 Story     what happened, each paragraph with its verses
     2 Meaning   hard words and key lines, explained
     3 For you   what it means for your life
     4 Memorize  one line to learn by heart
   Without JavaScript all four steps show in order, like a printed page.
   With it, learn.js turns them into steps you move through. */

export function generateStaticParams() {
  return STORIES.filter(isBuilt).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = storyBySlug(slug);
  if (!s) return {};
  const title = `${s.title}: ${s.subtitle} (${s.ref})`;
  const description = `${s.desc} ${s.title} explained in plain words, one scene at a time, with every verse beside it. Free, no account.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/stories/${s.slug}/` },
    openGraph: { title: `${s.title} | Free Scripture`, description, url: `${SITE_URL}/stories/${s.slug}/`, type: "article" },
    robots: isIndexed(s) ? { index: true, follow: true } : { index: false, follow: isReadable(s) },
  };
}

const STEPS = [
  { id: "story", zone: "the-story", label: "Story", q: "What happened?" },
  { id: "meaning", zone: "understand-it", label: "Meaning", q: "What does it mean?" },
  { id: "foryou", zone: "why-it-matters", label: "For you", q: "What does it mean for me?" },
  { id: "memorize", zone: "", label: "Memorize", q: "How do I keep it?" },
];

const H = ({ html, as = "span", className }: { html: string; as?: any; className?: string }) => {
  const Tag = as;
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};
const plain = (html: string) => html.replace(/<[^>]+>/g, "");
/* Keep the last two words of a short option together, so no word sits alone. */
const nwHtml = (html: string) => html.replace(/ (\S+)$/, "&nbsp;$1");

/* "5:3" or "4:24, 5:1" or a scene range "17:1-3" becomes a list of "c:v". */
function expand(refs: string[]): string[] {
  const out: string[] = [];
  for (const r of refs) {
    const m = r.replace(/[–—]/g, "-").match(/^(\d+):(\d+)(?:-(?:(\d+):)?(\d+))?$/);
    if (!m) continue;
    const c1 = +m[1], v1 = +m[2], c2 = m[3] ? +m[3] : c1, v2 = m[4] ? +m[4] : v1;
    if (c1 === c2) for (let v = v1; v <= v2; v++) out.push(`${c1}:${v}`);
    else { out.push(`${c1}:${v1}`); out.push(`${c2}:${v2}`); }
  }
  return out;
}
function shortLabel(refs: string[]) {
  return refs.join(", ");
}

function renderBlock(b: Block, i: number, box: Box, ctx: any) {
  switch (b.type) {
    case "scene":
      ctx.scene = b.num;
      if (ctx.breakAfter && b.num === ctx.breakAfter + 1) {
        return (
          <Fragment key={i}>
            <p className="story-break" data-story-break>
              <span className="story-break__title">Halfway there</span>
              <span className="story-break__text">This is a good place for a break. Your spot is saved on this device.</span>
            </p>
            <h3 className="story-scene" id={b.id}>
              <span className="story-scene__num">Scene {b.num}{ctx.scenes ? ` of ${ctx.scenes}` : ""}</span>
              <span className="story-scene__title">{nw(b.title)}</span>
            </h3>
          </Fragment>
        );
      }
      return (
        <h3 className="story-scene" id={b.id} key={i}>
          <span className="story-scene__num">Scene {b.num}{ctx.scenes ? ` of ${ctx.scenes}` : ""}</span>
          <span className="story-scene__title">{nw(b.title)}</span>
        </h3>
      );
    case "label":
      return <H key={i} as="p" className="story-label" html={b.html} />;
    case "key":
      return <H key={i} as="p" className="story-key" html={b.html} />;
    case "p": {
      if (box.id === "read-it") {
        return (
          <div className="story-passage" key={i}>
            <a className="story-passage__link" href={ctx.passageHref}>
              <span className="story-passage__title">Read {ctx.ref}</span>
              <span className="story-passage__sub">The full passage, word for word, in the Berean Standard Bible</span>
            </a>
            <a className="story-passage__link" href={ctx.compare}>
              <span className="story-passage__title">Read it side by side</span>
              <span className="story-passage__sub">This story next to the Bible text</span>
            </a>
          </div>
        );
      }
      if (box.id === "plain-retelling") {
        const refs = b.v && b.v.length ? b.v : ctx.sceneRange[ctx.scene] ? [ctx.sceneRange[ctx.scene]] : [];
        const keys = expand(refs);
        keys.forEach((k) => ctx.need.add(k));
        return (
          <p key={i} className="rp" data-v={keys.join(",")}>
            <span dangerouslySetInnerHTML={{ __html: b.html }} />
            {refs.length > 0 && (
              <>
                {" "}
                <button type="button" className="vchip" data-v={keys.join(",")} aria-label={`Show the Bible verse: ${ctx.bookName} ${shortLabel(refs)}`}>
                  {shortLabel(refs)}
                </button>
              </>
            )}
          </p>
        );
      }
      return <H key={i} as="p" html={b.html} />;
    }
    case "ul":
      if (box.id === "your-turn") {
        return (
          <div className="picks" key={i}>
            {b.items.map((it, j) => {
              const [opt, ans] = it.split(/\s*::\s*/);
              return (
                <details className="pick" key={j} data-pick>
                  <summary className="pick__opt"><span dangerouslySetInnerHTML={{ __html: nwHtml(opt) }} /></summary>
                  {ans && <p className="pick__ans" dangerouslySetInnerHTML={{ __html: ans }} />}
                </details>
              );
            })}
          </div>
        );
      }
      return (
        <ul className={box.id === "scene-card" ? "story-cast" : "story-list-plain"} key={i}>
          {b.items.map((it, j) => <H key={j} as="li" html={it} />)}
        </ul>
      );
    case "imagine":
      return (
        <aside className="story-imagine" key={i} aria-label="Imagine the Scene. This is imagination, not Scripture.">
          <span className="story-imagine__label">Imagine the scene <span className="story-imagine__tag">Not in the Bible text</span></span>
          <H as="p" html={b.html} />
        </aside>
      );
    case "quote":
      return (
        <blockquote className="story-quote" key={i}>
          {b.lines.map((l, j) => <H key={j} as="span" className="story-quote__line" html={l} />)}
        </blockquote>
      );
    case "table": {
      const isMap = box.id.startsWith("map-of-the");
      const heads = b.head.map(plain);
      return (
        <div className="story-table-wrap" key={i}>
          <table className={`story-table${isMap ? " story-table--map" : ""}`}>
            <thead><tr>{b.head.map((h, j) => <H key={j} as="th" html={h} />)}</tr></thead>
            <tbody>
              {b.rows.map((r, j) => (
                <tr key={j}>
                  {r.map((c, k) => {
                    if (isMap && k === 0) {
                      const n = plain(c).match(/^(\d+)\./);
                      return (
                        <td key={k} data-label={heads[k]}>
                          {n ? <a href={`#scene-${n[1]}`} data-go-scene dangerouslySetInnerHTML={{ __html: c }} /> : <span dangerouslySetInnerHTML={{ __html: c }} />}
                        </td>
                      );
                    }
                    return <td key={k} data-label={heads[k]} dangerouslySetInnerHTML={{ __html: c }} />;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  }
}

function BoxView({ box, ctx }: { box: Box; ctx: any }) {
  const blocks = box.blocks.map((b, i) => renderBlock(b, i, box, ctx));
  return (
    <section className={`story-box story-box--${box.id}`} aria-labelledby={`box-${box.id}`}>
      <h2 className="story-box__title" id={`box-${box.id}`}>
        {box.emoji && <span className="story-box__emoji" aria-hidden="true">{box.emoji}</span>}
        {box.title.replace(/\.\.\.$/, "").replace(/: "Wait, what\?"$/, "")}
      </h2>
      {box.id === "plain-retelling" ? <div className="chapter-text story-text" lang="en">{blocks}</div> : blocks}
    </section>
  );
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = storyBySlug(slug);
  if (!entry || !isBuilt(entry)) notFound();
  const story = loadStory(slug);
  if (!story) notFound();

  const minutes = storyMinutes(slug) || 1;
  const bookName = entry.ref.replace(/\s+\d.*$/, "");
  const passageHref = `/bsb/${entry.passage.book}/${entry.passage.chapter}/`;
  const compare = compareHref(entry);
  const sceneRange: Record<number, string> = {};
  for (const sc of loadScenes(slug)) {
    if (sc.range) {
      const r = sc.range;
      sceneRange[sc.num] = r.startCh === r.endCh ? (r.startV === r.endV ? `${r.startCh}:${r.startV}` : `${r.startCh}:${r.startV}-${r.endV}`) : `${r.startCh}:${r.startV}-${r.endCh}:${r.endV}`;
    }
  }
  const mins = stepMinutes(slug)!;
  // Long stories get a "Halfway there" break so they feel like two short parts.
  const breakAfter = mins.story >= 7 && story.scenes >= 6 ? Math.floor(story.scenes / 2) : 0;
  const ctx: any = { passageHref, compare, ref: entry.ref, bookName, sceneRange, scene: 0, need: new Set<string>(), scenes: story.scenes, breakAfter };

  const zoneOf = (id: string) => story.zones.find((z) => z.id === id);
  const DRAWER = ["scene-card", "before-the-story", "map-of-the-story"];
  const LEADERS = ["from-luther", "in-church"];
  const FORYOU_ORDER = ["your-turn", "you-might-have-heard", "good-news"];
  const view = (b: Box) => <Fragment key={b.id}>{BoxView({ box: b, ctx })}</Fragment>;
  // Render the zones first so ctx.need collects every verse the page uses.
  const zoneViews = STEPS.map((st) => {
    const z = st.zone ? zoneOf(st.zone) : null;
    if (!z) return null;
    if (st.id === "story") {
      const inDrawer = z.boxes.filter((b) => DRAWER.includes(b.id));
      const rest = z.boxes.filter((b) => !DRAWER.includes(b.id));
      return (
        <>
          {inDrawer.length > 0 && (
            <details className="drawer" data-drawer>
              <summary className="drawer__sum">
                <span className="drawer__title">{nw("Who’s who and what came before", 20)}</span>
                <span className="drawer__sub">{nw("People, places, and the story so far. Open it anytime.", 20)}</span>
              </summary>
              <div className="drawer__body">{inDrawer.map(view)}</div>
            </details>
          )}
          {rest.map(view)}
        </>
      );
    }
    if (st.id === "foryou") {
      const rank = (b: Box) => { const r = FORYOU_ORDER.indexOf(b.id); return r < 0 ? 99 : r; };
      const main = z.boxes.filter((b) => !LEADERS.includes(b.id)).sort((a, b) => rank(a) - rank(b));
      const lead = z.boxes.filter((b) => LEADERS.includes(b.id));
      return { main: main.map(view), lead: lead.map(view) };
    }
    return z.boxes.map(view);
  });
  const forYou = zoneViews[2] as any;

  const verses: Record<string, string> = {};
  for (const key of ctx.need as Set<string>) {
    const [c, v] = key.split(":").map(Number);
    const ch = loadChapter("bsb", entry.passage.book, c);
    const t = ch?.chapter.verses.find((x) => x.v === v)?.t;
    if (t) verses[key] = t;
  }

  // The first-visit tip uses this story's own first verse and first hard word.
  const retell = story.zones[0]?.boxes.find((b) => b.id === "plain-retelling");
  const firstP = retell?.blocks.find((b) => b.type === "p" && (b as any).v?.length) as any;
  const firstRef = firstP ? firstP.v[0] : Object.values(sceneRange)[0]?.split("-")[0] || "1:1";
  let firstTerm = "", firstAt = Infinity;
  const retellText = (retell?.blocks || []).filter((b) => b.type === "p").map((b: any) => plain(b.html)).join(" ");
  for (const w of WORDS) {
    for (const form of w.match) {
      const m = retellText.match(new RegExp(`(^|[^A-Za-z])(${form.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})(?![A-Za-z])`));
      if (m && m.index! < firstAt) { firstAt = m.index!; firstTerm = m[2]; }
    }
  }

  const era = eraOfPassage(entry.passage);
  const act = partOfEra(era);
  const before = prevReadable(entry);
  const after = nextReadable(entry);
  const next = nextReadableInBible(entry);
  const nextMin = next ? storyMinutes(next.slug) : null;
  const alike = sameFeeling(entry, next ? [next.slug] : []);
  const alikeFeel = alike ? FEELINGS.find((f) => f.slug === alike.feel)?.label : null;
  const alikeMin = alike ? storyMinutes(alike.story.slug) : null;
  const hop = (x: typeof before, dir: "before" | "after") => {
    const label = dir === "before" ? "‹ Earlier" : "Later ›";
    if (!x) {
      // Never point to a story that isn't written yet.
      return dir === "after" ? (
        <a className={`bigstrip__link bigstrip__link--${dir}`} href="/stories/">
          <span className="bigstrip__dir">That&rsquo;s the latest one</span>
          <span className="bigstrip__name">See all stories</span>
        </a>
      ) : <span />;
    }
    return (
      <a className={`bigstrip__link bigstrip__link--${dir}`} href={`/stories/${x.slug}/`}>
        <span className="bigstrip__dir">{label}</span>
        <span className="bigstrip__name">{x.title}</span>
      </a>
    );
  };
  const others = siblings(entry);
  const mem = entry.memorize;

  const data = {
    slug, title: entry.title, url: `/stories/${slug}/`, book: bookName, verses,
    memorize: mem || null,
    words: WORDS,
    paths: pathsData().filter((pp) => pp.steps.some((s) => s.slug === slug)),
  };

  return (
    <>
      <div className="reading-progress" aria-hidden="true"><div className="reading-progress__bar"></div></div>
      <article className="story-page story-v2" data-story={slug}>
        <nav className="story-crumb" aria-label="Breadcrumb">
          <a href="/stories/">← Stories</a>
        </nav>

        <header className="story-head">
          <div className="story-eyebrow">{entry.kind === "Teaching" ? "Teaching" : "Story"} · {entry.ref}</div>
          <h1 className="story-title">{nw(entry.title)}</h1>
          <p className="story-subtitle">{entry.subtitle}</p>
          <div className="story-meta">
            {entry.status === "early" && <span className="badge badge--new">New</span>}
            <span className="badge">{entry.level}</span>
            <span>About {minutes} min in all</span>
            <span>4 short steps</span>
          </div>
          <a className="path-bar" data-path-bar hidden href="/stories/">
            <span className="path-bar__kicker">Reading path</span>
            <span className="path-bar__title" data-path-bar-title></span>
            <span className="path-bar__dots" data-path-bar-dots aria-hidden="true"></span>
          </a>
          <nav className="bigstrip" aria-label="Where this story fits in the Bible">
            <Bands mini here={eraCenter(era)} />
            <span className="bigstrip__kicker"><a href={`/timeline/#${era.id}`}>Bible timeline</a></span>
            <span className="bigstrip__label">Part {act.n} of 4: {act.name} · <a href={`/timeline/#${era.id}`}>{nw(era.title, 20)}</a></span>
            <div className="bigstrip__nav">
              {hop(before, "before")}
              {hop(after, "after")}
            </div>
          </nav>
          {others.length > 0 && (
            <div className="story-versions" aria-label="Other versions of this story">
              <span className="story-versions__label">Also available:</span>
              {others.map((o) => (
                <a key={o.slug} className="chip" href={`/stories/${o.slug}/`}>
                  {o.lens === entry.lens ? `Ages ${o.level}` : `${LENSES[o.lens].name}, ${o.level}`}
                </a>
              ))}
            </div>
          )}
        </header>

        {entry.contentNote && (
          <div className="story-note" role="note">
            <span className="story-note__label">Content note</span>
            <p>{entry.contentNote}</p>
          </div>
        )}

        <div className="story-tools">
          <button className="tool-btn" type="button" data-listen aria-pressed="false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M19 5a10 10 0 0 1 0 14" /></svg>
            <span data-listen-label>Listen</span>
          </button>
          <button className="tool-btn" type="button" data-prefs-open aria-label="Display settings: text size, word help, spacing, and page color">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 7h11M4 12h16M4 17h7" /><circle cx="18" cy="7" r="2" /><circle cx="13" cy="17" r="2" /></svg>
            <span>Display</span>
          </button>
          <a className="tool-btn" href={compare}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="7.5" height="16" rx="1.5" /><rect x="13.5" y="4" width="7.5" height="16" rx="1.5" /></svg>
            <span>Side by side</span>
          </a>
        </div>

        <div className="listen-bar" data-listen-bar hidden>
          <button type="button" className="listen-bar__btn" data-listen-toggle>Pause</button>
          <div className="listen-bar__speed" role="group" aria-label="Reading speed">
            <button type="button" data-speed="0.8" aria-pressed="false">Slower</button>
            <button type="button" data-speed="1" aria-pressed="true">Normal</button>
            <button type="button" data-speed="1.2" aria-pressed="false">Faster</button>
          </div>
          <button type="button" className="listen-bar__stop" data-listen-stop>Stop</button>
          <span className="listen-bar__status" data-listen-status aria-live="polite"></span>
        </div>

        <div className="first-tip" data-first-tip hidden>
          <p className="first-tip__title">Two things you can tap</p>
          <ul>
            <li><span className="vchip vchip--demo" aria-hidden="true">{firstRef}</span> A verse number shows the Bible&rsquo;s exact words.</li>
            {firstTerm && <li><span className="term term--demo" aria-hidden="true">{firstTerm}</span> An underlined word shows what it means.</li>}
          </ul>
          <button type="button" className="first-tip__ok" data-first-tip-ok>Got it</button>
        </div>

        <nav className="steps" aria-label="Story steps" data-steps>
          {STEPS.map((st, i) => (
            <a key={st.id} className="steps__btn" href={`#step-${st.id}`} data-step={st.id}>
              <span className="steps__bar" aria-hidden="true"></span>
              <span className="steps__label"><span className="steps__num">{i + 1}</span> {st.label}</span>
            </a>
          ))}
        </nav>

        <div className="story-layout">
          <div className="story-main">
            {STEPS.map((st, i) => (
              <section key={st.id} className="step" id={`step-${st.id}`} data-step-panel={st.id} aria-labelledby={`step-h-${st.id}`}>
                <header className="step__head">
                  <span className="step__num">Step {i + 1} of 4 · About {(mins as any)[st.id]} min</span>
                  <h2 className="step__title" id={`step-h-${st.id}`}>{st.label}</h2>
                  <p className="step__q">{st.q}</p>
                </header>

                {st.id === "story" && <p className="step__hint">Tap a verse number, like <span className="vchip vchip--demo" aria-hidden="true">{firstRef}</span>, to read the Bible&rsquo;s exact words.</p>}

                {st.id === "foryou" ? forYou?.main : zoneViews[i]}

                {st.id === "foryou" && story.bigIdea && (
                  <section className="big-idea" aria-labelledby="big-idea-title">
                    <h3 className="big-idea__label" id="big-idea-title">Big Idea</h3>
                    <p className="big-idea__text" dangerouslySetInnerHTML={{ __html: story.bigIdea }} />
                  </section>
                )}
                {st.id === "foryou" && <p className="story-care">If this story brings up big feelings, talk with someone you trust, like a parent, pastor, or counselor.</p>}
                {st.id === "foryou" && forYou?.lead?.length > 0 && (
                  <details className="drawer drawer--leaders" data-drawer>
                    <summary className="drawer__sum">
                      <span className="drawer__title">For leaders and parents</span>
                      <span className="drawer__sub">{nw("Luther, church readings, and notes for teaching.", 20)}</span>
                    </summary>
                    <div className="drawer__body">
                      {forYou.lead}
                      <p className="drawer__note">We quote Luther for what he got right about grace. He also wrote terrible things about Jewish people. <a href="/about/#luther-and-the-jewish-people">Read our note on that.</a></p>
                    </div>
                  </details>
                )}

                {st.id === "memorize" && mem && (
                  <div className="mem" data-mem>
                    <p className="mem__intro">One line from this story to learn by heart. Practice a little now. It will come back later so it sticks.</p>
                    <div className="mem__card">
                      <span className="mem__ref">{mem.part ? "From " : ""}{mem.ref}</span>
                      <p className="mem__line" data-mem-line>{mem.text}</p>
                    </div>
                    <div className="mem__practice" data-mem-practice></div>
                    <div className="mem__save" data-mem-save hidden>
                      <p className="mem__save-q">How did that feel?</p>
                      <div className="mem__save-btns">
                        <button type="button" className="btn btn--primary" data-mem-got>I know it</button>
                        <button type="button" className="btn btn--line" data-mem-again>Practice again tomorrow</button>
                      </div>
                      <p className="mem__saved" data-mem-saved aria-live="polite"></p>
                    </div>
                  </div>
                )}

                {st.id === "memorize" && (
                  <div className="finish" data-finish>
                    <h3 className="finish__title">{nw(`You finished ${entry.title}.`, 22)}</h3>
                    <div className="finish__cards">
                      <a className="finish__card finish__card--path" data-path-next hidden href="/stories/">
                        <span className="finish__kicker" data-path-next-kicker></span>
                        <span className="finish__name" data-path-next-name></span>
                        <span className="finish__meta" data-path-next-meta></span>
                      </a>
                      {next && (
                        <a className="finish__card" href={`/stories/${next.slug}/`}>
                          <span className="finish__kicker">{next.order > entry.order ? "What happens next in the Bible" : "Back to the start of the Bible"}</span>
                          <span className="finish__name">{nw(next.title)}</span>
                          <span className="finish__meta">Part {partOfPassage(next.passage).n} of 4 · {next.subtitle}{nextMin ? ` · About ${nextMin} min` : ""}</span>
                        </a>
                      )}
                      {alike && (
                        <a className="finish__card" href={`/stories/${alike.story.slug}/`}>
                          <span className="finish__kicker">Another story for feeling {alikeFeel?.toLowerCase()}</span>
                          <span className="finish__name">{nw(alike.story.title)}</span>
                          <span className="finish__meta">{alike.story.subtitle}{alikeMin ? ` · About ${alikeMin} min` : ""}</span>
                        </a>
                      )}
                      <a className="finish__card" href="/stories/">
                        <span className="finish__kicker">Choose something else</span>
                        <span className="finish__name">All stories</span>
                        <span className="finish__meta">Filter by feeling, kind, or length</span>
                      </a>
                    </div>
                    {mem && <button type="button" className="btn btn--line finish__share" data-share-line>Send this line to a friend</button>}
                  </div>
                )}

                {i < 3 && (
                  <a className="btn btn--primary step__next" href={`#step-${STEPS[i + 1].id}`} data-step-go={STEPS[i + 1].id}>
                    Next: {STEPS[i + 1].label}
                  </a>
                )}
              </section>
            ))}
          </div>

          <aside className="verse-panel" data-verse-panel aria-labelledby="verse-panel-title">
            <div className="verse-panel__inner">
              <div className="verse-panel__head">
                <h2 className="verse-panel__title" id="verse-panel-title">Where does it say that?</h2>
                <button type="button" className="verse-panel__close" data-verse-close aria-label="Close">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
                </button>
              </div>
              <div className="verse-panel__body" data-verse-body aria-live="polite">
                <p className="verse-panel__empty">Tap a verse number in the story, like <span className="vchip vchip--demo" aria-hidden="true">{firstRef}</span>. The Bible&rsquo;s exact words will show here.</p>
              </div>
              <p className="verse-panel__foot">Berean Standard Bible. Public domain.</p>
            </div>
          </aside>
        </div>

        <footer className="story-credit">
          {entry.status === "early" && <p>This story is new. It has been checked line by line against the Bible text, but a Lutheran pastor has not reviewed it yet. Small changes may come.</p>}
          <p>© 2026 Hope for Americans. Written by Moses David.</p>
          <p>Free to share and adapt for non-commercial use under <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" rel="noopener">CC BY-NC-SA 4.0</a>.</p>
          <p>Bible text: Berean Standard Bible (public domain).</p>
        </footer>
      </article>

      <script type="application/json" id="story-data" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
      <script src="/static/js/chapter.js?v=9" defer></script>
      <script src="/static/js/learn.js?v=3" defer></script>
      <script dangerouslySetInnerHTML={{ __html: `window.addEventListener('beforeprint',function(){document.documentElement.classList.add('printing');document.querySelectorAll('details').forEach(function(d){d.open=true;});});` }} />
    </>
  );
}
