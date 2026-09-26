import type { Metadata } from "next";
import { SITE_URL } from "@/lib/bible";
import { STORIES, isReadable, storyHref, storyMinutes, nw } from "@/lib/stories";
import { PARTS, ERAS, TL_CONTINUES, tlX, eraCenter, eraOfPassage, bookHref, type Era } from "@/lib/timeline";
import { Bands } from "@/lib/TimelineBands";

export const metadata: Metadata = {
  title: "Bible timeline: the whole Bible story in time order",
  description:
    "The Bible's story from the beginning to the first churches, drawn to scale in 4 parts. Key events, people, places, and every book, in plain words. Free, no account.",
  alternates: { canonical: `${SITE_URL}/timeline/` },
  openGraph: {
    title: "Bible timeline | Free Scripture",
    description: "The whole Bible story in time order, drawn to scale, in plain words.",
    url: `${SITE_URL}/timeline/`,
  },
};

/* How this page works
   Without JavaScript it is a complete page: the overview, then every part
   of the story in full, one after another. timeline.js turns it into the
   interactive version: tap a part to open it, one at a time, with the
   same sections kept open as you move through the story.
   All the words live in lib/timeline.ts. */

const SECS = ["events", "people", "places", "back", "books"] as const;

function storiesFor(e: Era) {
  return STORIES.filter((s) => eraOfPassage(s.passage)?.id === e.id).sort((a, b) => a.order - b.order);
}

function Acc({ sec, label, children }: { sec: string; label: string; children: React.ReactNode }) {
  return (
    <details className="tl-acc" data-sec={sec}>
      <summary><span className="tl-acc__icon" aria-hidden="true"></span>{label}<span className="tl-acc__act" aria-hidden="true"></span></summary>
      <div className="tl-acc__body">{children}</div>
    </details>
  );
}

function Panel({ e, i }: { e: Era; i: number }) {
  const p = PARTS[e.part - 1];
  const prev = ERAS[i - 1], next = ERAS[i + 1];
  const stories = storiesFor(e);
  const firstBook = e.books.find((r) => r.slug);
  return (
    <section className={`tl-panel tl-p${p.n}`} id={e.id} data-panel={e.id} aria-labelledby={`${e.id}-title`}>
      <div className="tl-panel__head">
        <div className="tl-panel__partline">
          <p className="tl-panel__part">Part {p.n} of 4 · {p.name}</p>
          <Bands mini here={eraCenter(e)} />
        </div>
        <div className="tl-panel__titles">
          <p className="tl-panel__date">{e.date}</p>
          <h2 className="tl-panel__title" id={`${e.id}-title`}>{nw(e.title)}</h2>
        </div>
      </div>
      <div className="tl-panel__body">
        <div className="tl-panel__tools"><button type="button" className="tl-panel__all" data-tl-openall hidden>Open all</button></div>
        <div className="tl-panel__cols">
          <div className="tl-panel__col">
            <h3 className="tl-zone">The story</h3>
            <p className="tl-panel__what">{e.what}</p>
            {e.notes.map((n, k) => <p key={k} className="tl-panel__note"><strong>Good to know.</strong> {n}</p>)}
            <Acc sec="events" label={`Key events (${e.events.length})`}>
              <ol className="tl-mt">
                {e.events.map((x, k) => <li key={k}>{x[0] && <span className="tl-mt__year">{x[0]}</span>}{x[1]}</li>)}
              </ol>
            </Acc>
            <Acc sec="people" label={`People (${e.people.length})`}>
              <ul className="tl-dl">{e.people.map((x, k) => <li key={k}><b>{x[0]}.</b> {x[1]}</li>)}</ul>
            </Acc>
            <Acc sec="places" label={`Places (${e.places.length})`}>
              <ul className="tl-dl">{e.places.map((x, k) => <li key={k}><b>{x[0]}.</b> {x[1]}</li>)}</ul>
            </Acc>
          </div>
          <div className="tl-panel__col">
            <div className="tl-reads">
              <h4 className="tl-reads__title">Stories from this part</h4>
              {stories.length ? (
                <ul className="tl-reads__list">
                  {stories.map((s) => {
                    const ready = isReadable(s);
                    const min = ready ? storyMinutes(s.slug) : null;
                    return (
                      <li key={s.slug}>
                        <a href={storyHref(s)}>{s.title}</a>
                        <span className="tl-reads__meta">{ready ? (min ? ` · About ${min} min` : "") : " · Coming soon"}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="tl-reads__none">No stories for this part yet.{firstBook && <> <a href={bookHref(firstBook)!}>Read {firstBook.label.replace(/ \(.*$/, "")} in the Full Bible</a>.</>}</p>
              )}
              {stories.some((s) => !isReadable(s)) && <p className="tl-reads__hint">&ldquo;Coming soon&rdquo; stories open the Bible passage for now.</p>}
            </div>
            <h3 className="tl-zone">Understand it</h3>
            <Acc sec="back" label="Back then"><p>{e.back}</p></Acc>
            <Acc sec="books" label={`Books to read (${e.books.length})`}>
              <ul className="tl-books">
                {e.books.map((r, k) => {
                  const h = bookHref(r);
                  return <li key={k}>{h ? <a href={h}>{r.label}</a> : r.label}</li>;
                })}
              </ul>
            </Acc>
            <h3 className="tl-zone">Why it matters</h3>
            <p className="tl-panel__label">Big idea</p>
            <p className="tl-panel__idea">{e.idea}</p>
          </div>
        </div>
      </div>
      <nav className="tl-panel__nav" aria-label="Move through the story">
        {prev && <a className="tl-go" href={`#${prev.id}`} data-go={prev.id}><span className="tl-go__s">← Previous · {prev.dur}</span><span className="tl-go__t">{prev.title}</span></a>}
        {next && <a className="tl-go tl-go--next" href={`#${next.id}`} data-go={next.id}><span className="tl-go__s">Next · {next.dur} →</span><span className="tl-go__t">{next.title}</span></a>}
      </nav>
    </section>
  );
}

export default function TimelinePage() {
  const ticks: [number, string, boolean][] = [[-2000, "2000 BC", false], [-1500, "1500 BC", true], [-1000, "1000 BC", false], [-500, "500 BC", true], [1, "AD 1", false]];
  return (
    <div className="tl-page app-container" data-tl>
      {/* Hides the full list for the moment before timeline.js takes over, so the page doesn't jump. Shows it again if the script never arrives. */}
      <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('tl-pre');setTimeout(function(){var r=document.querySelector('[data-tl]');if(!r||!r.classList.contains('tl-js'))document.documentElement.classList.remove('tl-pre')},6000)" }} />
      <header className="tl-intro">
        <p className="tl-kicker">Bible timeline</p>
        <h1 className="tl-title">The Bible&rsquo;s story, in time order</h1>
        <p className="tl-lede">About 2,000 years of history, from Abraham to the first churches. Told from a Christian perspective, in plain words.</p>
        <p className="tl-hint">Tap any part to read more. About 2 minutes to look through.</p>
      </header>

      <section className="tl-overview" data-tl-overview aria-label="The whole story, drawn to scale">
        <div className="tl-scale" aria-hidden="true">
          {ticks.map(([y, l, wide]) => <span key={l} className={`tl-tick${wide ? " tl-tick--wide" : ""}`} style={{ left: `${tlX(y)}%` }}>{l}</span>)}
        </div>
        <div className="tl-strip">
          <Bands />
          {ERAS.filter((e) => e.id !== "the-beginning").map((e) => (
            <a key={e.id} className="tl-seg" href={`#${e.id}`} data-era={e.id} data-pick={e.id} title={e.title} tabIndex={-1} aria-hidden="true"
              style={{ left: `${tlX(e.start)}%`, width: `${tlX(e.end) - tlX(e.start)}%` }} />
          ))}
          <span className="tl-here" data-tl-here hidden />
        </div>
        <svg className="tl-funnel" data-tl-funnel aria-hidden="true" />
        <div className="tl-parts" data-tl-parts>
          {PARTS.map((p) => (
            <section key={p.n} className={`tl-part tl-p${p.n}`} aria-labelledby={`part-${p.id}`}>
              <div className="tl-part__head">
                <p className="tl-part__n">Part {p.n} of 4</p>
                <h2 className="tl-part__name" id={`part-${p.id}`}>{p.name}</h2>
                <p className="tl-part__years">{p.years}</p>
              </div>
              <ol className={`tl-list${p.n === 4 ? " tl-list--end" : ""}`}>
                {ERAS.filter((e) => e.part === p.n).map((e) => (
                  <li key={e.id} className={`tl-row${e.gap ? " tl-row--gap" : ""}${e.mark ? " tl-row--mark" : ""}`} data-era={e.id} data-center={eraCenter(e)}>
                    <a className="tl-row__btn" href={`#${e.id}`} data-pick={e.id}>
                      <span className="tl-row__dot" aria-hidden="true"></span>
                      <span className="tl-row__date">{e.shortDate}</span>
                      <span className="tl-row__title">{e.title}</span>
                      <span className="tl-row__who">{e.short}</span>
                    </a>
                    <div className="tl-row__slot" data-slot={e.id}></div>
                  </li>
                ))}
              </ol>
              {p.n === 4 && <p className="tl-continues">{TL_CONTINUES}</p>}
            </section>
          ))}
        </div>
      </section>

      <div className="tl-legend">
        <p>The colored band is drawn to scale. Dotted parts are long gaps. The faded ends mean &ldquo;dates unknown&rdquo; and &ldquo;the story continues.&rdquo; Larger dots mark turning points.</p>
        <p>BC years count down to the birth of Jesus. AD years count up from it. A Bible groups its books by type, not by date, so this timeline puts events in time order. All dates are approximate.</p>
        <p><button type="button" className="tl-showall" data-tl-showall hidden>Show every part as one list</button></p>
      </div>

      <div className="tl-panels" data-tl-panels>
        {ERAS.map((e, i) => <Panel key={e.id} e={e} i={i} />)}
      </div>

      <section className="tl-start" aria-labelledby="tl-start-title">
        <h2 id="tl-start-title">Where to start</h2>
        <p>A reading path walks you through one topic, one story at a time.</p>
        <div className="tl-start__links">
          <a className="btn btn--primary" href="/paths/who-is-jesus/">Who is Jesus?</a>
          <a className="btn btn--line" href="/paths/when-life-feels-heavy/">When life feels heavy</a>
        </div>
      </section>
      <script src="/static/js/timeline.js?v=1" defer></script>
    </div>
  );
}
