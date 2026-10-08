/* Share image for a page of verses for how you feel. */
import { shareCard, OG_SIZE, OG_TYPE } from "@/lib/og/card";
import { NEEDS } from "@/lib/bible";

export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const alt = "Bible verses for how you feel, on Free Scripture";

export function generateStaticParams() {
  return NEEDS.map((n: any) => ({ need: n.slug }));
}

export default async function Image({ params }: { params: Promise<{ need: string }> }) {
  const { need } = await params;
  const n = NEEDS.find((x: any) => x.slug === need);
  if (!n) return shareCard({ kicker: "Verses for how you feel", title: "Free Scripture" });
  return shareCard({ kicker: `Bible verses · ${n.passages.length} short passages`, title: n.h1 || n.short, line: n.card });
}
