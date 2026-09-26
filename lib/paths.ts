/* Reading paths: a few stories in order, one step at a time.
   Each step says what that story shows, so a reader knows why it is there.
   Progress is saved on the reader's device only (learn.js, "fs-done"). */
import { storyBySlug, isReadable, storyMinutes } from "./stories";

export interface PathStep { story: string; shows: string }
export interface ReadingPath {
  slug: string;
  title: string;
  question: string;
  lede: string;
  steps: PathStep[];
  after: string;
  afterHref: string;
  afterLabel: string;
  /** Shown at the top of the path page, for paths meant for hard times. */
  care?: string;
}

export const PATHS: ReadingPath[] = [
  {
    slug: "who-is-jesus",
    title: "Who Is Jesus?",
    question: "Four stories that each show a different side of Jesus.",
    lede: "Read them in order. Do one a day, or all at once. Your progress is saved on this device.",
    steps: [
      { story: "the-birth-of-jesus", shows: "God comes close to us, as a baby." },
      { story: "jesus-calms-the-storm", shows: "Jesus does what only God can do." },
      { story: "zacchaeus", shows: "Jesus comes looking for people who are lost." },
      { story: "the-empty-tomb", shows: "Jesus died for us and rose again." },
    ],
    after: "Next, try the Bible timeline. It shows where each story fits in the whole Bible.",
    afterHref: "/timeline/",
    afterLabel: "See the Bible timeline",
  },
  {
    slug: "when-life-feels-heavy",
    title: "When Life Feels Heavy",
    question: "Four stories for days when everything feels like too much.",
    lede: "They won't make hard things disappear. They show where God is in them. Read them in order, one a day or all at once. Your progress is saved on this device.",
    care: "If you are in danger or thinking about hurting yourself, please don't wait. In the United States, call or text 988 any time. If you are in danger right now, call 911 or your local emergency number. Outside the United States, findahelpline.com lists free helplines. Talking to someone you trust helps too.",
    steps: [
      { story: "the-beatitudes", shows: "God's favor rests on people who are hurting." },
      { story: "jesus-calms-the-storm", shows: "Jesus is with you when you are afraid." },
      { story: "moses-and-the-exodus", shows: "When there is no way out, God fights for you." },
      { story: "jonah", shows: "God does not give up on you, even when you run or feel angry." },
    ],
    after: "Next, try the short verses for how you feel. They are easy to send to a friend who is going through a hard time too.",
    afterHref: "/stories/?kind=Verses",
    afterLabel: "See verses for how you feel",
  },
];

export function pathBySlug(slug: string) { return PATHS.find((p) => p.slug === slug) || null; }

/** Steps with their story details. Only readable stories count. */
export function pathSteps(p: ReadingPath) {
  return p.steps
    .map((st) => ({ ...st, entry: storyBySlug(st.story) }))
    .filter((st) => st.entry && isReadable(st.entry))
    .map((st) => ({ ...st, entry: st.entry!, minutes: storyMinutes(st.story) || 1 }));
}

export function pathMinutes(p: ReadingPath) {
  return pathSteps(p).reduce((n, s) => n + s.minutes, 0);
}

/** A small copy of every path for the page scripts. */
export function pathsData() {
  return PATHS.map((p) => ({
    slug: p.slug,
    title: p.title,
    url: `/paths/${p.slug}/`,
    steps: pathSteps(p).map((s) => ({ slug: s.story, title: s.entry.title, url: `/stories/${s.story}/?path=${p.slug}`, shows: s.shows })),
  }));
}
