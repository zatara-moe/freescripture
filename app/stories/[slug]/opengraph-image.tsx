/* Share image for one story: its real title, what it is, and where it sits on the Bible timeline. */
import { shareCard, OG_SIZE, OG_TYPE } from "@/lib/og/card";
import { STORIES, isBuilt, storyBySlug, kindLabel } from "@/lib/stories";
import { eraOfPassage, partOfEra, eraCenter } from "@/lib/timeline";

export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const alt = "A Bible story from Free Scripture, explained in plain words";

export function generateStaticParams() {
  return STORIES.filter(isBuilt).map((s) => ({ slug: s.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = storyBySlug(slug);
  if (!s) return shareCard({ kicker: "Bible stories in plain words", title: "Free Scripture" });
  const era = eraOfPassage(s.passage);
  const part = era ? partOfEra(era) : null;
  return shareCard({
    kicker: `${kindLabel(s.kind)} · ${s.ref}`,
    title: s.title,
    line: s.subtitle,
    here: era ? eraCenter(era) : null,
    where: era && part ? `Part ${part.n} of 4 · ${era.title}` : undefined,
  });
}
