/* Share image for the home page and every page that has no image of its own. */
import { shareCard, OG_SIZE, OG_TYPE } from "@/lib/og/card";

export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const alt = "Free Scripture: the Bible, one scene at a time. Bible stories in plain words, free with no account.";

export default async function Image() {
  return shareCard({
    kicker: "Bible stories in plain words",
    title: "The Bible, one scene at a time.",
    line: "Every story explained simply, with the verse beside it. Four free Bible translations.",
  });
}
