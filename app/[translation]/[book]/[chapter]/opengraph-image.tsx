/* Share image for one Bible chapter: the chapter, the translation, and its first verse.
   Made the first time someone shares the link, then cached, so the build stays fast. */
import { shareCard, OG_SIZE, OG_TYPE, clip } from "@/lib/og/card";
import { TRANSLATIONS, loadChapter, bookNameFromSlug, type TransSlug } from "@/lib/bible";
import { eraOfPassage, partOfEra, eraCenter } from "@/lib/timeline";

export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const alt = "A Bible chapter on Free Scripture";
export const dynamic = "force-dynamic";

/* The first verse, shortened at a word, never ending on a comma. */
function verseOpening(t: string, max: number) {
  const s = clip(t.trim(), max);
  return /[,;:]$/.test(s) ? s.replace(/[,;:]$/, "…") : s;
}

export default async function Image({ params }: { params: Promise<{ translation: string; book: string; chapter: string }> }) {
  const { translation, book, chapter } = await params;
  const trans = translation as TransSlug;
  const tmeta = TRANSLATIONS[trans];
  const name = tmeta ? bookNameFromSlug(trans, book) : null;
  const num = Number(chapter);
  const ch = name ? loadChapter(trans, book, num) : null;
  if (!tmeta || !name || !ch) return shareCard({ kicker: "Full Bible", title: "Free Scripture" });
  const ref = `${name === "Psalms" ? "Psalm" : name} ${num}`;
  const first = ch.chapter.verses[0];
  const era = eraOfPassage({ book, chapter: num });
  const part = era ? partOfEra(era) : null;
  return shareCard({
    kicker: `${tmeta.label} · Full Bible`,
    title: ref,
    line: first ? `“${verseOpening(first.t, 100)}” (${ref}:${first.v})` : undefined,
    here: era ? eraCenter(era) : null,
    where: era && part ? `Part ${part.n} of 4 · ${era.title}` : undefined,
  });
}
