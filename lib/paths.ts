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
  /** Other names people search for. Site search lists the path under these. */
  also?: string[];
}

export const PATHS: ReadingPath[] = [
  {
    slug: "who-is-jesus",
    title: "Who Is Jesus?",
    question: "Five stories that each show a different side of Jesus.",
    lede: "Read them in order. Do one a day, or all at once. Your progress is saved on this device.",
    steps: [
      { story: "the-birth-of-jesus", shows: "God comes close to us, as a baby." },
      { story: "jesus-calms-the-storm", shows: "Jesus does what only God can do." },
      { story: "zacchaeus", shows: "Jesus comes looking for people who are lost." },
      { story: "the-crucifixion", shows: "Jesus dies on the cross, for us." },
      { story: "the-resurrection", shows: "Jesus rises again. Death does not get the last word." },
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
      { story: "crossing-the-red-sea", shows: "When there is no way out, God fights for you." },
      { story: "jonah", shows: "God does not give up on you, even when you run or feel angry." },
    ],
    after: "Next, try the short verses for how you feel. They are easy to send to a friend who is going through a hard time too.",
    afterHref: "/stories/?kind=Verses",
    afterLabel: "See verses for how you feel",
  },
  {
    slug: "holy-week",
    title: "Holy Week and Easter",
    question: "Seven stories from Palm Sunday to the empty tomb.",
    lede: "Read them in order. Do one a day, or all at once. Your progress is saved on this device.",
    care: "These stories include an arrest and Jesus's death on a cross. They are told plainly, without graphic detail. If they bring up big feelings, talk with a parent, pastor, or trusted adult. In the United States, you can call or text 988 any time.",
    steps: [
      { story: "palm-sunday", shows: "A humble king rides into Jerusalem, and the crowds shout Hosanna." },
      { story: "the-last-supper", shows: "Jesus gives himself to his friends: \"given for you.\"" },
      { story: "gethsemane", shows: "Jesus prays in deep sorrow, and his friends run away." },
      { story: "peter-denies-jesus", shows: "Peter fails three times. Jesus had already prayed for him." },
      { story: "jesus-before-pilate", shows: "The guilty man goes free, and Jesus takes his place." },
      { story: "the-crucifixion", shows: "Jesus dies on the cross, and prays for the people who hurt him." },
      { story: "the-resurrection", shows: "Sunday morning, the tomb is empty. He is risen." },
    ],
    after: "Next, walk with two friends to Emmaus on the same Easter day.",
    afterHref: "/stories/the-road-to-emmaus/",
    afterLabel: "Read The Road to Emmaus",
  },
  {
    slug: "miracles-of-jesus",
    title: "Miracles of Jesus",
    question: "Five signs that show who Jesus is.",
    lede: "Read them in order. Do one a day, or all at once. Your progress is saved on this device.",
    steps: [
      { story: "water-into-wine", shows: "Jesus's first sign: more than enough, and the best saved for last." },
      { story: "jesus-calms-the-storm", shows: "Even the wind and the sea obey him." },
      { story: "jesus-feeds-the-5000", shows: "A boy's lunch feeds a crowd." },
      { story: "jesus-walks-on-water", shows: "Jesus catches Peter when he sinks." },
      { story: "jesus-raises-lazarus", shows: "Jesus weeps with his friends, then calls Lazarus out of the tomb." },
    ],
    after: "Next, try the Bible timeline. It shows where each story fits in the whole Bible.",
    afterHref: "/timeline/",
    afterLabel: "See the Bible timeline",
  },
  {
    slug: "moses-and-the-exodus",
    title: "Moses and the Exodus",
    question: "Six stories, from a baby in a basket to God's ten words at the mountain.",
    lede: "Read them in order. Do one a day, or all at once. Your progress is saved on this device.",
    also: ["Moses", "The Exodus", "Exodus", "Exodus 1 to 20", "Story of Moses"],
    steps: [
      { story: "baby-moses", shows: "Brave women save a baby, and God hears his people groaning." },
      { story: "the-burning-bush", shows: "God calls Moses and tells him his name." },
      { story: "the-ten-plagues", shows: "A king says no again and again. God keeps his word." },
      { story: "the-passover", shows: "The lamb's blood marks the doors, and the slaves go free." },
      { story: "crossing-the-red-sea", shows: "When there is no way out, God makes a path through the sea." },
      { story: "the-ten-commandments", shows: "God sets his people free first, then gives them his law." },
    ],
    after: "Next, see where Moses fits in the whole Bible on the timeline.",
    afterHref: "/timeline/",
    afterLabel: "See the Bible timeline",
  },
  {
    slug: "sermon-on-the-mount",
    title: "The Sermon on the Mount",
    question: "Jesus's longest teaching, in seven short parts.",
    lede: "Matthew 5 to 7, one part at a time. Read them in order. Your progress is saved on this device.",
    also: ["Sermon on the Mount", "Matthew 5 to 7", "Matthew 5", "Matthew 6", "Matthew 7"],
    steps: [
      { story: "the-beatitudes", shows: "It starts with blessings for people who are hurting." },
      { story: "salt-and-light", shows: "You are salt and light. God made you that, first." },
      { story: "love-your-enemies", shows: "Love that prays for enemies, and never means staying unsafe." },
      { story: "the-lords-prayer", shows: "How Jesus taught us to pray." },
      { story: "do-not-worry", shows: "Your Father knows what you need." },
      { story: "ask-seek-knock", shows: "Your Father gives good gifts." },
      { story: "the-wise-and-foolish-builders", shows: "Build on the rock. The Sermon ends." },
    ],
    after: "Next, see the stories Jesus told, one at a time.",
    afterHref: "/stories/?kind=Parable",
    afterLabel: "See the parables",
  },
  {
    slug: "christmas",
    title: "Christmas",
    question: "Four stories of the first Christmas, from the angel's visit to the Wise Men.",
    lede: "Read them in order. Do one a day, or all at once. Your progress is saved on this device.",
    also: ["Christmas story", "Nativity", "Advent", "The birth of Jesus"],
    steps: [
      { story: "the-angel-visits-mary", shows: "God chooses Mary, and she sings about a God who lifts the humble." },
      { story: "josephs-dream", shows: "Joseph chooses to stay, and names the baby Jesus." },
      { story: "the-birth-of-jesus", shows: "God comes to us as a baby, and the news goes first to shepherds." },
      { story: "the-wise-men", shows: "Travelers from far away come to worship the king." },
    ],
    after: "Next, see where Christmas fits in the whole Bible on the timeline.",
    afterHref: "/timeline/",
    afterLabel: "See the Bible timeline",
  },
  {
    slug: "lost-and-found",
    title: "Lost and Found",
    question: "Three stories about a God who comes looking.",
    lede: "Read them in order. Do one a day, or all at once. Your progress is saved on this device.",
    also: ["Luke 15", "Lost and found", "The lost son"],
    steps: [
      { story: "the-lost-sheep-and-the-lost-coin", shows: "A shepherd searches, and a woman sweeps the house." },
      { story: "the-prodigal-son", shows: "A father runs to meet his lost son." },
      { story: "zacchaeus", shows: "Jesus came to seek and to save the lost." },
    ],
    after: "Next, try the verses for how you feel.",
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
