import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/bible";
import { nw } from "@/lib/stories";
import { PATHS, pathBySlug, pathSteps, pathMinutes, pathsData } from "@/lib/paths";

/* A reading path page. Without JavaScript it is a plain numbered list.
   With it, learn.js marks the stories you finished and sets the button
   to the next one. */

export function generateStaticParams() {
  return PATHS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = pathBySlug(slug);
  if (!p) return {};
  const description = `${p.question} Bible stories in plain words, one step at a time. Free, no account.`;
  return {
    title: `${p.title} A reading path`,
    description,
    alternates: { canonical: `${SITE_URL}/paths/${p.slug}/` },
    robots: { index: false, follow: true },
  };
}

export default async function PathPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = pathBySlug(slug);
  if (!p) notFound();
  const steps = pathSteps(p);
  if (!steps.length) notFound();
  const total = pathMinutes(p);
  const first = steps[0];

  return (
    <div className="reading-column path-page" data-path-page={p.slug}>
      <nav className="story-crumb" aria-label="Breadcrumb">
        <a href="/stories/">← Stories</a>
      </nav>

      <header className="path-head">
        <span className="path-head__kicker">Reading path · {steps.length} stories</span>
        <h1 className="path-head__title">{nw(p.title)}</h1>
        <p className="path-head__q">{p.question}</p>
        <p className="path-head__lede">{p.lede}</p>
        <p className="path-head__meta">About {total} minutes in all. About {Math.round(total / steps.length)} minutes each.</p>
      </header>

      {p.care && (
        <div className="path-care" role="note">
          <span className="path-care__label">If you need help now</span>
          <p>{p.care}</p>
        </div>
      )}

      <div className="path-progress" data-path-progress hidden>
        <div className="path-progress__bar" aria-hidden="true">
          {steps.map((s) => <span key={s.story} className="path-progress__seg" data-seg={s.story} />)}
        </div>
        <p className="path-progress__text" data-path-count aria-live="polite"></p>
      </div>

      <ol className="path-steps">
        {steps.map((s, i) => (
          <li key={s.story} className="path-step" data-step-story={s.story}>
            <a className="path-step__link" href={`/stories/${s.story}/?path=${p.slug}`}>
              <span className="path-step__n" aria-hidden="true">{i + 1}</span>
              <span className="path-step__body">
                <span className="path-step__title">{nw(s.entry.title)}</span>
                <span className="path-step__shows">{s.shows}</span>
                <span className="path-step__meta">{s.entry.ref} · About {s.minutes} min</span>
                {s.entry.contentNote && <span className="path-step__note">Heads up: {s.entry.contentNote}</span>}
                <span className="path-step__status" data-step-status></span>
              </span>
            </a>
          </li>
        ))}
      </ol>

      <a className="btn btn--primary btn--wide path-go" href={`/stories/${first.story}/?path=${p.slug}`} data-path-go>
        Start with {first.entry.title}
      </a>

      <section className="path-after" data-path-after hidden aria-labelledby="path-after-title">
        <h2 className="path-after__title" id="path-after-title">You finished this path</h2>
        <p>{p.after}</p>
        <a className="btn btn--line" href={p.afterHref}>{p.afterLabel}</a>
      </section>

      <script type="application/json" id="paths-data" dangerouslySetInnerHTML={{ __html: JSON.stringify(pathsData()).replace(/</g, "\\u003c") }} />
      <script src="/static/js/learn.js?v=4" defer></script>
    </div>
  );
}
