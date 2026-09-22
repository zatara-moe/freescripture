import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/bible";
import { STORIES, storyBySlug } from "@/lib/stories";
import { loadStory, type Block, type Box } from "@/lib/story";

export function generateStaticParams() {
  return STORIES.filter((s) => s.file).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = storyBySlug(slug);
  if (!s) return {};
  const title = `${s.title} (${s.ref})`;
  const description = `${s.desc} ${s.title} retold scene by scene in plain language, with what it means and why it matters. Free, no account.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/stories/${s.slug}/` },
    openGraph: { title: `${title} | Scene by Scene`, description, url: `${SITE_URL}/stories/${s.slug}/`, type: "article" },
    robots: s.ready ? { index: true, follow: true } : { index: false, follow: false },
  };
}

const ZONE_QUESTION: Record<string, string> = {
  "the-story": "What happened?",
  "understand-it": "What does it mean?",
  "why-it-matters": "What does it mean for me?",
};

const H = ({ html, as = "span", className }: { html: string; as?: any; className?: string }) => {
  const Tag = as;
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};

function plain(html: string) {
  return html.replace(/<[^>]+>/g, "");
}

function renderBlock(b: Block, i: number, box: Box, extra: { passageHref?: string; bsbHref?: string; ref: string }) {
  switch (b.type) {
    case "scene":
      return (
        <h3 className="story-scene" id={b.id} key={i}>
          <span className="story-scene__num">Scene {b.num}</span>
          <span className="story-scene__title">{b.title}</span>
        </h3>
      );
    case "label":
      return <H key={i} as="p" className="story-label" html={b.html} />;
    case "key":
      return <H key={i} as="p" className="story-key" html={b.html} />;
    case "p":
      if (box.id === "read-it") {
        return (
          <div className="story-passage" key={i}>
            {extra.passageHref && (
              <Link className="story-passage__link" href={extra.passageHref}>
                <span className="story-passage__title">Read {extra.ref}</span>
                <span className="story-passage__sub">On Free Scripture, in the WEB, KJV, or BBE</span>
              </Link>
            )}
            {extra.bsbHref && (
              <a className="story-passage__link" href={extra.bsbHref} rel="noopener">
                <span className="story-passage__title">Read it in the BSB</span>
                <span className="story-passage__sub">The base text for this retelling, at Bible Hub</span>
              </a>
            )}
          </div>
        );
      }
      return <H key={i} as="p" html={b.html} />;
    case "ul":
      return (
        <ul className={box.id === "scene-card" ? "story-cast" : "story-list-plain"} key={i}>
          {b.items.map((it, j) => <H key={j} as="li" html={it} />)}
        </ul>
      );
    case "imagine":
      return (
        <aside className="story-imagine" key={i} aria-label="Imagine the Scene, imagination, not Scripture">
          <H as="span" className="story-imagine__label" html={b.label.replace(/<\/?em>/g, "")} />
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
                          {n ? <a href={`#scene-${n[1]}`} dangerouslySetInnerHTML={{ __html: c }} /> : <span dangerouslySetInnerHTML={{ __html: c }} />}
                        </td>
                      );
                    }
                    return <H key={k} as="td" html={c} />;
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

function BoxView({ box, extra }: { box: Box; extra: any }) {
  const blocks = box.blocks.map((b, i) => renderBlock(b, i, box, extra));
  return (
    <section className={`story-box story-box--${box.id}`} aria-labelledby={`box-${box.id}`}>
      <h2 className="story-box__title" id={`box-${box.id}`}>
        {box.emoji && <span className="story-box__emoji" aria-hidden="true">{box.emoji}</span>}
        {box.title}
      </h2>
      {box.id === "plain-retelling" ? <div className="chapter-text story-text" lang="en">{blocks}</div> : blocks}
    </section>
  );
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = storyBySlug(slug);
  if (!entry || !entry.file) notFound();
  const story = loadStory(slug);
  if (!story) notFound();

  const minutes = Math.max(1, Math.round(story.words / 200));
  const passageHref = entry.passage ? `/web/${entry.passage.book}/${entry.passage.chapter}/` : undefined;
  const bsbHref = entry.passage ? `https://biblehub.com/bsb/${entry.passage.book.replace(/-/g, "_")}/${entry.passage.chapter}.htm` : undefined;
  const extra = { passageHref, bsbHref, ref: entry.ref };
  const shelf = STORIES.filter((s) => s.file && (s.ready || s.slug === slug));
  const idx = shelf.findIndex((s) => s.slug === slug);
  const prev = idx > 0 ? shelf[idx - 1] : null;
  const next = idx >= 0 && idx < shelf.length - 1 ? shelf[idx + 1] : null;

  return (
    <>
      <div className="reading-progress" aria-hidden="true"><div className="reading-progress__bar"></div></div>
      <article className="story-page">
        <nav className="story-crumb" aria-label="Breadcrumb">
          <Link href="/stories/">← Stories</Link>
        </nav>

        <header className="story-head">
          <div className="story-eyebrow">Scene by Scene · {entry.kind}</div>
          <h1 className="story-title">{entry.title}</h1>
          <div className="story-meta">
            <span className="badge">{entry.level}</span>
            <span>{entry.ref}</span>
            {story.scenes > 0 && <span>{story.scenes} scenes</span>}
            <span>About {minutes} min</span>
          </div>
          {!entry.ready && (
            <p className="story-preview-note">Preview. This story is waiting for final review and isn&rsquo;t listed yet.</p>
          )}
        </header>

        {entry.contentNote && (
          <div className="story-note" role="note">
            <span className="story-note__label">⚠️ Content note</span>
            <p>{entry.contentNote}</p>
          </div>
        )}

        <div className="story-tools">
          <button className="action-btn" data-action="tts" aria-pressed="false">
            <svg className="action-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5 6 9H2v6h4l5 4z" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
            <span className="action-btn__text">Listen</span>
          </button>
          <button className="reading-settings-btn" type="button" data-prefs-open aria-label="Display settings: text size, spacing, font, and page color">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h11" /><path d="M4 12h16" /><path d="M4 17h7" /><circle cx="18" cy="7" r="2" /><circle cx="13" cy="17" r="2" /></svg>
            <span>Display</span>
          </button>
          <span className="story-tools__note">Narration by a real reader is coming. Listen uses your device&rsquo;s voice for now.</span>
        </div>

        {story.zones.map((z, zi) => {
          const head = (
            <>
              <span className="zone__num" aria-hidden="true">{zi + 1}</span>
              <span className="zone__text">
                <span className="zone__title">{z.title}</span>
                <span className="zone__q">{ZONE_QUESTION[z.id] || ""}</span>
              </span>
            </>
          );
          if (zi === 0) {
            return (
              <section className="zone zone--open" key={z.id} aria-labelledby={`zone-${z.id}`}>
                <h2 className="zone__head" id={`zone-${z.id}`}>{head}</h2>
                {z.boxes.map((b) => <BoxView key={b.id} box={b} extra={extra} />)}
              </section>
            );
          }
          return (
            <details className="zone" key={z.id}>
              <summary className="zone__head">
                {head}
                <svg className="zone__chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
              </summary>
              <div className="zone__body">
                {z.boxes.map((b) => <BoxView key={b.id} box={b} extra={extra} />)}
              </div>
            </details>
          );
        })}

        {story.bigIdea && (
          <section className="big-idea" aria-labelledby="big-idea-title">
            <h2 className="big-idea__label" id="big-idea-title"><span aria-hidden="true">💡</span> Big Idea</h2>
            <p className="big-idea__text" dangerouslySetInnerHTML={{ __html: story.bigIdea }} />
          </section>
        )}

        <p className="story-care">If this story brings up big feelings, talk with a parent, pastor, or trusted adult.</p>

        <div className="chapter-actions" role="group" aria-label="Story actions">
          <button className="action-btn" data-action="share">
            <svg className="action-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
            <span className="action-btn__text">Share</span>
          </button>
          <button className="action-btn" data-action="copy-link">
            <svg className="action-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
            <span className="action-btn__text">Copy link</span>
          </button>
        </div>

        <nav className="story-foot" aria-label="More stories">
          {prev ? <Link href={`/stories/${prev.slug}/`}><span className="arrow">← Previous story</span><span className="label">{prev.title}</span></Link> : <span />}
          <Link href="/stories/" className="story-foot__all"><span className="arrow">All stories</span><span className="label">Back to the shelf</span></Link>
          {next ? <Link href={`/stories/${next.slug}/`} className="next"><span className="arrow">Next story →</span><span className="label">{next.title}</span></Link> : <span />}
        </nav>

        <footer className="story-credit">
          <p>© 2026 Hope for Americans. Written by Moses David.</p>
          <p>Free to share and adapt for non-commercial use under <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" rel="noopener">CC BY-NC-SA 4.0</a>.</p>
          <p>Scripture base text: Berean Standard Bible (public domain).</p>
          <p className="story-credit__verse">&ldquo;Freely you have received; freely give.&rdquo; Matthew 10:8</p>
        </footer>
      </article>

      <script src="/static/js/chapter.js?v=9" defer></script>
      <script src="/static/js/pages.js?v=2" defer></script>
      <script dangerouslySetInnerHTML={{ __html: `window.addEventListener('beforeprint',function(){document.querySelectorAll('details.zone').forEach(function(d){d.open=true;});});` }} />
    </>
  );
}
