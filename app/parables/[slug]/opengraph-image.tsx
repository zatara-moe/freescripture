/* Share image for one parable. */
import { shareCard, OG_SIZE, OG_TYPE } from "@/lib/og/card";
import { PARABLES } from "@/lib/bible";
import { eraById, eraCenter } from "@/lib/timeline";

export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const alt = "A parable of Jesus on Free Scripture, with the surprising point in plain words";

export function generateStaticParams() {
  return PARABLES.map((p: any) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = PARABLES.find((x: any) => x.slug === slug);
  if (!p) return shareCard({ kicker: "Parables of Jesus", title: "Free Scripture" });
  const [book, ch, s, e] = p.ref;
  const era = eraById("jesus");
  return shareCard({
    kicker: `Parable of Jesus · ${book} ${ch}:${s === e ? s : `${s}-${e}`}`,
    title: p.title,
    line: p.cover || p.line,
    here: era ? eraCenter(era) : null,
    where: "Part 4 of 4 · Jesus",
  });
}
