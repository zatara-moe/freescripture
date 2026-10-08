/* Share image for the Bible timeline: the 4 parts on the band, drawn to scale. */
import { shareCard, OG_SIZE, OG_TYPE } from "@/lib/og/card";

export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const alt = "The Bible timeline on Free Scripture: the whole Bible story in time order, in 4 parts";

export default async function Image() {
  return shareCard({
    kicker: "Bible timeline",
    title: "The Bible’s story, in time order",
    line: "About 2,000 years, drawn to scale, with where each story fits.",
    bandLabels: true,
  });
}
