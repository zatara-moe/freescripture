/* Share image for a reading path. */
import { shareCard, OG_SIZE, OG_TYPE } from "@/lib/og/card";
import { PATHS, pathBySlug, pathSteps } from "@/lib/paths";

export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const alt = "A reading path on Free Scripture: a few Bible stories in order";

export function generateStaticParams() {
  return PATHS.map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = pathBySlug(slug);
  if (!p) return shareCard({ kicker: "Reading path", title: "Free Scripture" });
  const n = pathSteps(p).length;
  return shareCard({ kicker: `Reading path · ${n} ${n === 1 ? "story" : "stories"} in order`, title: p.title, line: p.question });
}
