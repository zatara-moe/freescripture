import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  TRANSLATIONS, TRANS_ORDER, flatChapters, loadChapter, bookNameFromSlug,
  normalizeDivineName, SITE_URL, type TransSlug,
} from "@/lib/bible";
import { storiesForChapter, LENSES } from "@/lib/stories";
import { loadScenes } from "@/lib/story";
import CompareView, { type Version } from "../../CompareView";

/* Side by side: any chapter in two versions at once.
   Built for every chapter in the World English Bible (the 66 books all
   three translations share). A Scene by Scene retelling joins the
   choices when one covers this chapter, lined up scene by scene with
   the verses it retells. */

type Params = { book: string; chapter: string };

export function generateStaticParams() {
  return flatChapters("web").map((c) => ({ book: c.slug, chapter: String(c.num) }));
}
export const dynamicParams = false;

function refLabel(name: string, num: number) {
  return `${name === "Psalms" ? "Psalm" : name} ${num}`;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { book, chapter } = await params;
  const name = bookNameFromSlug("web", book);
  if (!name) return {};
  const title = `${refLabel(name, +chapter)}, side by side`;
  return {
    title,
    description: `Read ${refLabel(name, +chapter)} in two versions at once, verse by verse. Free, no account.`,
    alternates: { canonical: `${SITE_URL}/web/${book}/${chapter}/` },
    robots: { index: false, follow: true },
  };
}

export default async function ComparePage({ params }: { params: Promise<Params> }) {
  const { book, chapter } = await params;
  const num = Number(chapter);
  const name = bookNameFromSlug("web", book);
  if (!name || !Number.isInteger(num)) notFound();

  const versions: Version[] = [];

  for (const s of storiesForChapter(book, num)) {
    const scenes = loadScenes(s.slug)
      .filter((sc) => sc.range && sc.range.startCh <= num && sc.range.endCh >= num)
      .map((sc) => {
        const r = sc.range!;
        return {
          num: sc.num, title: sc.title, html: sc.html,
          from: r.startCh === num ? r.startV : 1,
          to: r.endCh === num ? r.endV : 999,
        };
      });
    if (!scenes.length) continue;
    versions.push({
      id: `story:${s.slug}`,
      kind: "retelling",
      nick: s.lens === "story" ? "Scene by Scene" : LENSES[s.lens].name,
      name: s.title,
      note: `Plain-language retelling, ${s.level}`,
      href: `/stories/${s.slug}/`,
      scenes,
    });
  }

  for (const t of TRANS_ORDER) {
    const loaded = loadChapter(t, book, num);
    if (!loaded) continue;
    const m = TRANSLATIONS[t as TransSlug];
    versions.push({
      id: t, kind: "translation", nick: m.nick, name: m.label,
      note: `${m.short}, ${m.year}, ${m.plain}`,
      href: `/${t}/${book}/${num}/`,
      verses: loaded.chapter.verses.map((v) => ({ v: v.v, t: normalizeDivineName(v.t) })),
    });
  }
  if (versions.length < 2) notFound();

  const flat = flatChapters("web");
  const idx = flat.findIndex((c) => c.slug === book && c.num === num);
  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null;
  const hasStory = versions[0].kind === "retelling";

  return (
    <div className="cmp-page">
      <nav className="chapter-nav" aria-label="Chapter navigation">
        <div className="chapter-nav__group"><a href="/compare/">&larr; Side by side</a></div>
        <div className="chapter-nav__current">{refLabel(name, num)}</div>
        <div className="chapter-nav__group" />
      </nav>

      <header className="cmp-head">
        <h1 className="cmp-title">{refLabel(name, num)}, side by side</h1>
        <p className="cmp-lede">
          {hasStory
            ? "Our retelling next to the Bible text it comes from. Each row lines up one scene with the verses it retells."
            : "Two versions of the same chapter. Each row is one verse, so you can see how the wording changes."}
        </p>
      </header>

      <CompareView versions={versions} book={book} chapter={num} />

      <nav className="chapter-foot__nav cmp-foot" aria-label="Previous and next chapter">
        {prev ? (
          <a href={`/compare/${prev.slug}/${prev.num}/`}>
            <span className="arrow">Previous chapter</span>
            <span className="label">{refLabel(prev.name, prev.num)}</span>
          </a>
        ) : <span />}
        {next ? (
          <a href={`/compare/${next.slug}/${next.num}/`} className="next">
            <span className="arrow">Next chapter</span>
            <span className="label">{refLabel(next.name, next.num)}</span>
          </a>
        ) : <span />}
      </nav>
    </div>
  );
}
