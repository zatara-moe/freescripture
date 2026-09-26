import type { Metadata } from "next";
import { SITE_URL } from "@/lib/bible";
import { catalog, FEELINGS, KIND_HELP, nw, storyBySlug, type CatItem, type CatKind } from "@/lib/stories";
import { PARTS, partOfPassage } from "@/lib/timeline";
import { PATHS, pathSteps, pathMinutes } from "@/lib/paths";

export const metadata: Metadata = {
  title: "Stories: Bible stories, parables, and verses in plain words",
  description:
    "Bible stories, the parables of Jesus, and verses for how you feel, explained in plain words. Filter by feeling, kind, or length. Free, no account.",
  alternates: { canonical: `${SITE_URL}/stories/` },
  openGraph: {
    title: "Stories | Free Scripture",
    description: "Bible stories, parables, and verses for how you feel, explained in plain words.",
    url: `${SITE_URL}/stories/`,
  },
};

/* One list with filters, not a set of doors. Every item says what it is,
   how long it takes, and what's inside before you open it.
   stories.js adds the filters, counts, and preview. Without it, this is a
   plain list of links that still works. */

const KINDS: CatKind[] = ["Story", "Teaching", "Parable", "Verses"];
const LENGTHS: [string, string][] = [["short", "Under 5 minutes"], ["mid", "5 to 10 minutes"], ["long", "Over 10 minutes"]];
const rank = (c: CatItem) => (c.status === "Coming soon" ? 3 : c.kind === "Parable" ? 2 : c.kind === "Verses" ? 1 : 0);
const lenOf = (m: number | null) => (m == null ? "" : m < 5 ? "short" : m <= 10 ? "mid" : "long");

function openLabel(c: CatItem) {
  if (c.status === "Coming soon") return "Read the Bible passage";
  if (c.kind === "Parable") return "Open the parable";
  if (c.kind === "Verses") return "Open the verses";
  return `Open the story${c.minutes ? ` (${c.minutes} min)` : ""}`;
}

export default function StoriesPage() {
  const items = catalog().sort((a, b) => rank(a) - rank(b));
  const byOrder = (a: CatItem, b: CatItem) => (a.order || 0) - (b.order || 0);
  // Stories sit in the same 4 parts as the Bible timeline (lib/timeline.ts).
  const partOf = (c: CatItem) => {
    const s = c.id.startsWith("story-") ? storyBySlug(c.id.slice(6)) : null;
    return s ? partOfPassage(s.passage)?.n ?? 0 : 0;
  };
  const acts = PARTS.map((a) => ({
    ...a,
    ready: items.filter((c) => partOf(c) === a.n && c.status !== "Coming soon").sort(byOrder),
    soon: items.filter((c) => partOf(c) === a.n && c.status === "Coming soon").sort(byOrder),
  }));
  const shelves = [
    { id: "parables", name: "Parables of Jesus", kinds: "Parable", items: items.filter((c) => c.kind === "Parable"), pile: [] as CatItem[] },
    { id: "verses", name: "Verses for how you feel", kinds: "Verses", items: items.filter((c) => c.kind === "Verses"), pile: [] as CatItem[] },
  ];

  return (
    <div className="cat-page">
      <header className="cat-head">
        <h1 className="cat-title">Stories</h1>
        <p className="cat-lede">Bible stories, parables, and verses for how you feel, explained in plain words. Pick one to see what&rsquo;s inside before you open it.</p>
      </header>

      <div className="cat-tools">
        <label className="cat-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <span className="sr-only">Find in this list</span>
          <input type="search" data-cat-q placeholder="Find a title, like Jonah" autoComplete="off" />
        </label>
        <button type="button" className="btn btn--line cat-filter-btn" data-filters-open hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
          <span data-filter-label></span>
        </button>
      </div>

      <div className="cat-quick" role="group" aria-label="Quick filters: how you feel">
        {FEELINGS.map((f) => (
          <button key={f.slug} type="button" className="quick-chip" data-quick-feel={f.slug} aria-pressed="false">{f.label}</button>
        ))}
      </div>

      <div className="cat-active" data-active hidden></div>
      <p className="cat-count" data-result-line aria-live="polite"></p>

      <div className="cat-layout">
        <form className="cat-filters" data-filters aria-labelledby="filters-title" onSubmit={undefined}>
          <div className="cat-filters__head">
            <h2 className="cat-filters__title" id="filters-title">Filters</h2>
            <button type="button" className="link-btn" data-clear>Clear all</button>
            <button type="button" className="cat-filters__close" data-filters-close aria-label="Close filters">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
          <div className="cat-filters__body">
            <fieldset className="fgroup">
              <legend>Show</legend>
              <label className="fopt"><input type="checkbox" name="ready" value="1" /><span className="fopt__label">Only things I can read now</span></label>
            </fieldset>
            <fieldset className="fgroup">
              <legend>How you feel</legend>
              <p className="fgroup__hint">Shows anything that fits at least one.</p>
              {FEELINGS.map((f) => (
                <label className="fopt" key={f.slug}><input type="checkbox" name="feel" value={f.slug} /><span className="fopt__label">{f.label}</span><span className="fopt__n" data-n={`feel:${f.slug}`}></span></label>
              ))}
            </fieldset>
            <fieldset className="fgroup">
              <legend>Kind</legend>
              {KINDS.map((k) => (
                <label className="fopt" key={k}><input type="checkbox" name="kind" value={k} /><span className="fopt__label">{k}<span className="fopt__help">{KIND_HELP[k]}</span></span><span className="fopt__n" data-n={`kind:${k}`}></span></label>
              ))}
            </fieldset>
            <fieldset className="fgroup">
              <legend>Length</legend>
              {LENGTHS.map(([v, l]) => (
                <label className="fopt" key={v}><input type="checkbox" name="len" value={v} /><span className="fopt__label">{l}</span><span className="fopt__n" data-n={`len:${v}`}></span></label>
              ))}
            </fieldset>
          </div>
          <div className="cat-filters__foot">
            <button type="button" className="btn btn--primary btn--wide" data-filters-apply></button>
          </div>
        </form>

        <div className="cat-results">
          <div className="shelves" data-shelves>
            <section className="paths-shelf" id="paths" aria-labelledby="paths-title">
              <div className="shelf2__head">
                <h2 className="shelf2__title" id="paths-title">Reading paths</h2>
              </div>
              <p className="bigstory__lede">A few stories in order, one step at a time. Pick one.</p>
              <div className="paths-shelf__list">
            {PATHS.map((pp) => {
              const st = pathSteps(pp);
              return (
                <a key={pp.slug} className="path-card" href={`/paths/${pp.slug}/`}>
                  <span className="path-card__kicker">Reading path · {st.length} stories · About {pathMinutes(pp)} min</span>
                  <span className="path-card__title">{nw(pp.title)}</span>
                  <span className="path-card__line">{pp.question}</span>
                  <span className="path-card__list">{st.map((s) => s.entry.title).join(" → ")}</span>
                </a>
              );
            })}
              </div>
            </section>
            <section className="bigstory" aria-labelledby="bigstory-title">
              <div className="shelf2__head">
                <h2 className="shelf2__title" id="bigstory-title">The Big Story</h2>
              </div>
              <p className="bigstory__lede">The whole Bible is one big story in 4 parts. Open a part to see its stories, in the order they happened.</p>
              <p className="bigstory__timeline"><a className="btn btn--line" href="/timeline/">See the whole story on the Bible timeline</a></p>
              <ol className="acts">
                {acts.map((a) => (
                  <li key={a.n} className={`act${a.ready.length ? " act--has" : ""}`}>
                    <details className="act__details" data-act={a.n} open={a.ready.length > 0}>
                      <summary className="act__summary">
                        <span className="act__dot" aria-hidden="true">{a.n}</span>
                        <span className="act__text">
                          <span className="act__name">{a.name}</span>
                          <span className="act__meta">{a.books} · {a.ready.length ? `${a.ready.length} to read` : "Being written"}</span>
                        </span>
                        <svg className="act__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                      </summary>
                      <div className="act__body">
                        <p className="act__line">{a.line}</p>
                        {a.ready.length > 0 && (
                          <>
                            <ul className="shelf2__row act__row" data-row>
                              {a.ready.map((c) => (
                                <li key={c.id}>
                                  <a className={`cover2 cover2--${c.kind.toLowerCase()}`} href={c.href} data-cover={c.id}>
                                    <span className="cover2__spine" aria-hidden="true"></span>
                                    <span className="cover2__body">
                                      <span className="cover2__top">
                                        <span className="cover2__kind">{c.kind}</span>
                                        {c.status === "New" && <span className="cover2__new">New</span>}
                                      </span>
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
                          </>
                        )}
                        {a.soon.length > 0 && (
                          <div className="pile">
                            <h3 className="pile__title">Being written</h3>
                            <ul className="pile__stack">
                              {a.soon.map((c, i) => (
                                <li key={c.id} style={{ ["--shift" as any]: `${[0, 14, 4, 20, 8][i % 5]}px` }}>
                                  <a className="pile__book" href={c.href} data-cover={c.id}>
                                    <span className="pile__name">{c.title}</span>
                                    <span className="pile__soon">Coming soon</span>
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="act__links">
                          {a.n === 4 && <a className="act__link act__link--strong" href="/stories/?kind=Parable" data-see-kind="Parable">{`${items.filter((c) => c.kind === "Parable").length} more parables Jesus told`}</a>}
                          <a className="act__link" href={a.href}>Read this part in the Full Bible: {a.books}</a>
                        </div>
                      </div>
                    </details>
                  </li>
                ))}
              </ol>
            </section>

            {shelves.map((sh) => (
              <section key={sh.id} className={`shelf2 shelf2--${sh.id}`} aria-labelledby={`shelf-${sh.id}`}>
                <div className="shelf2__head">
                  <h2 className="shelf2__title" id={`shelf-${sh.id}`}>{sh.name}</h2>
                  <a className="shelf2__all" href={`/stories/?kind=${sh.kinds}`} data-see-kind={sh.kinds}>
                    {sh.id === "stories" ? `${sh.items.length} ready` : `See all ${sh.items.length}`}
                  </a>
                </div>
                <div className="shelf2__rowwrap">
                  <button type="button" className="shelf2__scroll shelf2__scroll--left" data-scroll="-1" aria-label={`Scroll ${sh.name} left`} hidden>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
                  </button>
                  <ul className="shelf2__row" data-row>
                    {sh.items.map((c) => (
                      <li key={c.id}>
                        <a className={`cover2 cover2--${c.kind.toLowerCase()}`} href={c.href} data-cover={c.id}>
                          <span className="cover2__spine" aria-hidden="true"></span>
                          <span className="cover2__body">
                            <span className="cover2__top">
                              <span className="cover2__kind">{c.kind}</span>
                              {c.status === "New" && <span className="cover2__new">New</span>}
                            </span>
                            <span className="cover2__rule" aria-hidden="true"></span>
                            <span className="cover2__title">{c.title}</span>
                            <span className="cover2__sub">{c.kind === "Verses" ? c.desc : c.subtitle}</span>
                            <span className="cover2__time">{c.minutes ? `About ${c.minutes} min` : ""}</span>
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                  <button type="button" className="shelf2__scroll shelf2__scroll--right" data-scroll="1" aria-label={`Scroll ${sh.name} right`} hidden>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
                  </button>
                </div>
                <div className="shelf2__ledge" aria-hidden="true"></div>
                {sh.pile.length > 0 && (
                  <div className="pile">
                    <h3 className="pile__title">Being written</h3>
                    <ul className="pile__stack">
                      {sh.pile.map((c, i) => (
                        <li key={c.id} style={{ ["--shift" as any]: `${[0, 14, 4, 20, 8][i % 5]}px` }}>
                          <a className="pile__book" href={c.href} data-cover={c.id}>
                            <span className="pile__name">{c.title}</span>
                            <span className="pile__soon">Coming soon</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            ))}
          </div>

          <ol className="cat-list" data-list>
            {items.map((c) => (
              <li key={c.id} className="cat-item" data-id={c.id} data-kind={c.kind} data-feel={c.feel.join(" ")}
                data-status={c.status} data-len={lenOf(c.minutes)} data-find={`${c.title} ${c.subtitle} ${c.ref} ${c.desc}`.toLowerCase()}>
                <a className={`cat-card cat-card--${c.kind.toLowerCase()}${c.status === "Coming soon" ? " is-soon" : ""}`} href={c.href}>
                  <span className="cat-card__spine" aria-hidden="true"></span>
                  <span className="cat-card__body">
                    <span className="cat-card__top">
                      <span className="cat-card__kind">{c.kind} · {c.ref}</span>
                      {c.status !== "Ready" && <span className={`status status--${c.status === "New" ? "new" : "soon"}`}>{c.status}</span>}
                    </span>
                    <span className="cat-card__title">{nw(c.title, 20)}</span>
                    <span className="cat-card__sub">{c.subtitle}</span>
                    <span className="cat-card__desc">{c.desc}</span>
                    <span className="cat-card__meta">{c.minutes ? `About ${c.minutes} min` : "Not written yet"}{c.size ? ` · ${c.size}` : ""}</span>
                    {c.note && <span className="cat-card__note"><strong>Content note:</strong> {c.note}</span>}
                  </span>
                </a>
                <div data-inside hidden>
                  <div className="pv">
                    <div className="pv__top">
                      <span className="pv__kind">{c.kind} · {c.ref}</span>
                      {c.status !== "Ready" && <span className={`status status--${c.status === "New" ? "new" : "soon"}`}>{c.status}</span>}
                    </div>
                    <h2 className="pv__title">{nw(c.title, 20)}</h2>
                    <p className="pv__sub">{c.subtitle}</p>
                    <p className="pv__desc">{c.desc}</p>
                    <p className="pv__meta">{c.minutes ? `About ${c.minutes} min` : "Not written yet"}{c.size ? ` · ${c.size}` : ""}</p>
                    {c.note && <p className="pv__note"><strong>Content note:</strong> {c.note}</p>}
                    <div className="pv__inside">
                      <h3 className="pv__inside-title">What&rsquo;s inside</h3>
                      <ul>{c.inside.map((x, i) => <li key={i}><strong>{x.name}</strong> {x.line}</li>)}</ul>
                    </div>
                    <a className="btn btn--primary btn--wide" href={c.href}>{openLabel(c)}</a>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <div className="cat-empty" data-empty hidden>
            <p className="cat-empty__title">Nothing matches all of these yet.</p>
            <p>Try removing one filter. The number next to each filter shows how many you would get.</p>
            <button type="button" className="btn btn--primary" data-clear>Clear all filters</button>
          </div>
        </div>

        <aside className="cat-preview" data-preview aria-labelledby="pv-label">
          <div className="cat-preview__inner">
            <div className="cat-preview__head">
              <span className="cat-preview__label" id="pv-label">Preview</span>
              <button type="button" className="cat-preview__close" data-preview-close aria-label="Close preview">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>
            <div data-preview-body>
              <p className="cat-preview__empty">Pick anything on the list to see what&rsquo;s inside before you open it.</p>
            </div>
          </div>
        </aside>
      </div>
      <script src="/static/js/stories.js?v=2" defer></script>
    </div>
  );
}
