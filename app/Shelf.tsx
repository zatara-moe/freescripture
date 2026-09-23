import Link from "next/link";
import { STORIES, isReadable, storyHref, LENSES, type StoryEntry } from "@/lib/stories";

/* The bookshelf. Every cover uses one strict template so a row reads as
   a set: the same zones, at the same heights, on every book.

     top line   number or series on the left, status on the right
     rule
     title      two lines reserved, even for one-line titles
     mark
     cover line three lines reserved, written short enough to never be cut
     foot       pinned to the bottom: passage, then what a tap does

   Color lives only in the spine and a few small marks. Stories get the
   indigo spine, parables the sage spine. Status is words, never styling.
   A cover that isn't written yet still opens something real: the
   passage itself, or the parable page. */

const THEME_SHORT: Record<string, string> = {
  "lost-and-found": "Lost and found",
  forgiveness: "Forgiveness",
  neighbor: "The neighbor",
  kingdom: "The kingdom",
  prayer: "Prayer",
  money: "Money",
  watchfulness: "Being ready",
  reversal: "Grace",
  foundations: "The cost",
};

function Cover({ href, series, top, status, title, line, refText, action }: {
  href: string; series: "story" | "parable"; top: string; status?: string;
  title: string; line: string; refText: string; action: string;
}) {
  return (
    <Link className={`cover cover--${series}`} href={href}>
      <span className="cover__top">
        <span className="cover__num">{top}</span>
        {status ? <span className="cover__status">{status}</span> : null}
      </span>
      <span className="cover__rule" aria-hidden="true" />
      <span className="cover__title">{title}</span>
      <span className="cover__mark" aria-hidden="true" />
      <span className="cover__line">{line}</span>
      <span className="cover__foot">
        <span className="cover__ref">{refText}</span>
        <span className="cover__act">{action}</span>
      </span>
    </Link>
  );
}

export function StoryCover({ s, showLens = false }: { s: StoryEntry; showLens?: boolean }) {
  const ready = isReadable(s);
  const num = STORIES.findIndex((x) => x.slug === s.slug) + 1;
  const status = ready ? (s.status === "early" ? "Early edition" : undefined) : "In the works";
  const age = s.level === "8+" ? "Ages 8 and up" : "Ages 12 and up";
  const action = ready
    ? showLens ? `${LENSES[s.lens].name}, ${age.toLowerCase()}` : age
    : s.parable ? "Read the parable now" : "Read it in the Bible now";
  return (
    <Cover
      href={storyHref(s)} series="story" top={`No. ${num}`} status={status}
      title={s.title} line={s.cover || s.desc} refText={s.ref} action={action}
    />
  );
}

export function ParableCover({ p }: { p: any }) {
  const [book, ch, s, e] = p.ref;
  const ref = s === e ? `${book} ${ch}:${s}` : `${book} ${ch}:${s}-${e}`;
  return (
    <Cover
      href={`/parables/${p.slug}/`} series="parable" top={THEME_SHORT[p.theme] || "Parable"}
      title={p.title} line={p.cover || p.line} refText={ref} action="Read the parable"
    />
  );
}

export function Shelf({ id, title, more, children }: { id: string; title: string; more?: { href: string; label: string }; children: React.ReactNode }) {
  return (
    <section className="shelf" aria-labelledby={id}>
      <div className="shelf__head">
        <h2 className="shelf__title" id={id}>{title}</h2>
        {more && <Link className="shelf__more" href={more.href}>{more.label}</Link>}
      </div>
      <div className="shelf__row">{children}</div>
      <div className="shelf__ledge" aria-hidden="true" />
    </section>
  );
}
