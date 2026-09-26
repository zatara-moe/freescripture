/* Scene by Scene: the story shelf, and the one catalog behind the
   Stories page.

   HOW THIS IS ORGANIZED
   A "story" is one retelling of one passage. A passage can have more than
   one retelling: different ages (8+, 12+ and adult) and different ways of
   reading (the lens). Retellings of the same passage share a `family`.

   TO PUBLISH A NEW STORY
   1. Save the finished Markdown (starting at "# The Story") as
      data/stories/<slug>.md. End each retelling paragraph with its verses,
      like {v: 5:3} or {v: 4:24, 5:1}. Paragraphs without a tag use the
      verses of their scene from the Map of the Story table.
   2. Add an entry below with status "early". Early editions show with a
      "New" badge, and search engines are told not to index them.
   3. When the pastor review is done, change status to "live".
   4. Give it a `memorize` line so the Memorize step has something to teach.

   NAMING RULE
   The title is the name people already know and search for ("The
   Beatitudes", "The Prodigal Son"). The subtitle says it in plain words. */

import fs from "node:fs";
import path from "node:path";
import { PARABLES, PARABLE_THEMES, NEEDS, pullRange } from "./bible";

export const SHOW_EARLY_EDITIONS = true;

/** Joins the last two words of a headline with a no-break space, so a
    headline never ends with one word alone on the last line. */
export function nw(s: string, max = 16) {
  const m = s.match(/(\S+)\s+(\S+)\s*$/);
  // Only join short pairs, so the joined words still fit a small phone.
  if (!m || m[1].length + m[2].length > max) return s;
  return s.replace(/\s+(\S+)\s*$/, "\u00A0$1");
}

export type Lens = "story" | "literal" | "technical" | "philosopher";
export type Level = "12+ and adult" | "8+";
export type Status = "live" | "early" | "planned";
export type Kind = "Story" | "Teaching" | "Poetry and Prayer";

export const LENSES: Record<Lens, { name: string; line: string }> = {
  story: { name: "Story", line: "What happened, in order, one scene at a time." },
  literal: { name: "Literal", line: "Says exactly what the text says, and flags every figure of speech." },
  technical: { name: "How it worked", line: "Maps, numbers, timelines, and how things worked back then." },
  philosopher: { name: "Big questions", line: "The ideas under the story, and the questions it leaves you with." },
};

export interface Passage { book: string; chapter: number; toChapter?: number }
export interface Memorize { ref: string; text: string; gaps: [string, string]; decoys: [string, string]; part?: boolean }

export interface StoryEntry {
  slug: string;
  family: string;
  title: string;
  subtitle: string;     // plain words, one line
  ref: string;
  kind: Kind;
  lens: Lens;
  level: Level;
  desc: string;
  cover?: string;
  status: Status;
  passage: Passage;
  feel: string[];       // FEELINGS slugs
  parable?: string;
  contentNote?: string;
  memorize?: Memorize;
  act: number;          // Older 7-part number, no longer shown. Pages use the 4 timeline parts (lib/timeline.ts), worked out from the passage.
  order: number;        // place in Bible order across the whole Big Story
}

/* ---------- Older 7-part Big Story (kept so older code still builds) ----------
   The site now uses the 4 parts of the Bible timeline in lib/timeline.ts.
   Parts are eras, not dates. Scholars disagree about exact dates, and
   readers only need to know where a story fits and what comes next. */
export const ACTS = [
  { n: 1, name: "Beginnings", books: "Genesis 1 to 11", href: "/bsb/genesis/1/", line: "God makes the world and people. People turn away. God keeps a promise." },
  { n: 2, name: "Promise and Rescue", books: "Genesis 12 to Deuteronomy", href: "/bsb/genesis/12/", line: "God chooses one family to bless the world, then rescues them from slavery." },
  { n: 3, name: "Kings and Prophets", books: "Joshua to Malachi", href: "/bsb/joshua/1/", line: "Israel gets kings. Prophets keep calling people back to God." },
  { n: 4, name: "Jesus Comes", books: "Matthew 1 to 4 and Luke 1 to 4", href: "/bsb/luke/1/", line: "God keeps the promise. Jesus is born." },
  { n: 5, name: "Jesus Teaches and Heals", books: "The Gospels", href: "/bsb/mark/1/", line: "Jesus teaches, heals, and welcomes people others left out." },
  { n: 6, name: "The Cross and the Empty Tomb", books: "The end of each Gospel", href: "/bsb/luke/22/", line: "Jesus dies on the cross and rises again." },
  { n: 7, name: "The Church Begins", books: "Acts to Revelation", href: "/bsb/acts/1/", line: "The Holy Spirit comes, and the good news spreads." },
];

export const STORIES: StoryEntry[] = [
  {
    slug: "the-beatitudes", family: "the-beatitudes",
    act: 5, order: 121,
    title: "The Beatitudes", subtitle: "Jesus's \"Blessed are...\" sayings",
    ref: "Matthew 4:23 to 5:12",
    kind: "Teaching", lens: "story", level: "12+ and adult",
    desc: "A crowd of sick and hurting people. Jesus tells them where God's favor rests.",
    status: "early",
    passage: { book: "matthew", chapter: 4, toChapter: 5 },
    feel: ["sad", "not-enough", "lonely"],
    memorize: { ref: "Matthew 5:4", text: "Blessed are those who mourn, for they will be comforted.", gaps: ["mourn", "comforted"], decoys: ["pray", "rewarded"] },
  },
  {
    slug: "david-and-goliath", family: "david-and-goliath",
    act: 3, order: 80,
    title: "David and Goliath", subtitle: "A shepherd boy faces a giant",
    ref: "1 Samuel 17",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "A shepherd nobody expected. A giant everyone feared.",
    status: "early",
    passage: { book: "1-samuel", chapter: 17 },
    feel: ["afraid", "not-enough"],
    contentNote: "This story includes a battle. David kills Goliath and cuts off his head.",
    memorize: { ref: "1 Samuel 17:47", text: "The battle is the LORD's.", gaps: ["battle", "LORD's"], decoys: ["army", "king's"], part: true },
  },
  { slug: "sermon-on-the-mount", family: "sermon-on-the-mount", title: "The Sermon on the Mount", subtitle: "Jesus's longest teaching", ref: "Matthew 5 to 7", kind: "Teaching", lens: "story", level: "12+ and adult", desc: "Jesus's longest teaching, one section at a time.", status: "planned", passage: { book: "matthew", chapter: 5, toChapter: 7 }, feel: ["unsure"], act: 5, order: 120 },
  {
    slug: "jonah", family: "jonah",
    act: 3, order: 90,
    title: "Jonah", subtitle: "The prophet who ran away",
    ref: "Jonah 1 to 4",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "A prophet who ran. A city God refused to give up on.",
    status: "early",
    passage: { book: "jonah", chapter: 1, toChapter: 4 },
    feel: ["angry", "guilty", "afraid"],
    contentNote: "This story includes a violent storm, and Jonah saying he wants to die.",
    memorize: { ref: "Jonah 2:9", text: "Salvation is from the LORD!", gaps: ["Salvation", "LORD!"], decoys: ["Mercy", "king!"], part: true },
  },
  { slug: "noah", family: "noah", title: "Noah", subtitle: "The flood and the promise", ref: "Genesis 6 to 9", kind: "Story", lens: "story", level: "12+ and adult", desc: "More than water and a boat.", status: "planned", passage: { book: "genesis", chapter: 6, toChapter: 9 }, feel: ["afraid"], act: 1, order: 20 },
  {
    slug: "good-samaritan", family: "good-samaritan",
    act: 5, order: 140,
    title: "The Good Samaritan", subtitle: "Who is my neighbor?",
    ref: "Luke 10:25-37",
    kind: "Teaching", lens: "story", level: "12+ and adult",
    desc: "You've heard \"be kind.\" That's not the main point.",
    status: "early",
    passage: { book: "luke", chapter: 10 }, parable: "good-samaritan",
    feel: ["lonely", "unsure", "angry"],
    contentNote: "In this story, robbers beat a man and leave him hurt by the road.",
    memorize: { ref: "Luke 10:27", text: "Love your neighbor as yourself.", gaps: ["neighbor", "yourself."], decoys: ["family", "friends."], part: true },
  },
  {
    slug: "zacchaeus", family: "zacchaeus",
    act: 5, order: 150,
    title: "Zacchaeus", subtitle: "The man in the tree",
    ref: "Luke 19:1-10",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "A tax collector climbed a tree. Everything changed.",
    status: "early",
    passage: { book: "luke", chapter: 19 },
    feel: ["lonely", "guilty", "not-enough"],
    memorize: { ref: "Luke 19:10", text: "For the Son of Man came to seek and to save the lost.", gaps: ["seek", "lost."], decoys: ["judge", "poor."] },
  },
  { slug: "joseph", family: "joseph", title: "Joseph", subtitle: "From the pit to the palace", ref: "Genesis 37 to 50", kind: "Story", lens: "story", level: "12+ and adult", desc: "Sold by his brothers. The long road from pit to palace.", status: "planned", passage: { book: "genesis", chapter: 37, toChapter: 50 }, feel: ["lonely"], act: 2, order: 40 },
  {
    slug: "the-birth-of-jesus", family: "the-birth-of-jesus",
    act: 4, order: 100,
    title: "The Birth of Jesus", subtitle: "The first Christmas",
    ref: "Luke 2:1-21",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "A king born in a feeding box. The news goes first to shepherds.",
    status: "early",
    passage: { book: "luke", chapter: 2 },
    feel: ["afraid", "lonely", "not-enough", "thankful"],
    memorize: { ref: "Luke 2:10", text: "I bring you good news of great joy that will be for all the people.", gaps: ["joy", "people."], decoys: ["peace", "kings."], part: true },
  },
  {
    slug: "creation-and-the-fall", family: "creation-and-the-fall",
    act: 1, order: 10,
    title: "Creation and the Fall", subtitle: "How it all began, and what went wrong",
    ref: "Genesis 1 to 3",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "God makes a good world. People stop trusting him. God comes looking.",
    status: "early",
    passage: { book: "genesis", chapter: 1, toChapter: 3 },
    feel: ["guilty", "not-enough", "unsure"],
    contentNote: "This story mentions being naked, pain in childbirth, and death.",
    memorize: { ref: "Genesis 1:31", text: "And God looked upon all that He had made, and indeed, it was very good.", gaps: ["made,", "good."], decoys: ["said,", "new."], part: true },
  },
  { slug: "hagar", family: "hagar", act: 2, order: 30, title: "Hagar", subtitle: "The God who sees me", ref: "Genesis 16", kind: "Story", lens: "story", level: "12+ and adult", desc: "A runaway servant in the desert. God finds her there.", status: "planned", passage: { book: "genesis", chapter: 16 }, feel: ["lonely"] },
  {
    slug: "moses-and-the-exodus", family: "moses-and-the-exodus",
    act: 2, order: 50,
    title: "Moses and the Exodus", subtitle: "God sets his people free",
    ref: "Exodus 3 to 14",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "A man with excuses. A king who won't listen. A sea that opens.",
    status: "early",
    passage: { book: "exodus", chapter: 3, toChapter: 14 },
    feel: ["not-enough", "afraid", "anxious"],
    contentNote: "This story includes slavery, plagues, the death of Egypt's firstborn sons, and an army drowning. It is told plainly, without graphic detail.",
    memorize: { ref: "Exodus 14:14", text: "The LORD will fight for you; you need only to be still.", gaps: ["fight", "still."], decoys: ["care", "strong."] },
  },
  { slug: "the-ten-commandments", family: "the-ten-commandments", act: 2, order: 60, title: "The Ten Commandments", subtitle: "God's ten words", ref: "Exodus 20", kind: "Teaching", lens: "story", level: "12+ and adult", desc: "Rescued people get ten words for living free.", status: "planned", passage: { book: "exodus", chapter: 20 }, feel: ["unsure", "guilty"] },
  { slug: "samuel-hears-god", family: "samuel-hears-god", act: 3, order: 70, title: "Samuel Hears God", subtitle: "A boy hears his name at night", ref: "1 Samuel 3", kind: "Story", lens: "story", level: "12+ and adult", desc: "A boy hears his name in the dark. It isn't who he thinks.", status: "planned", passage: { book: "1-samuel", chapter: 3 }, feel: ["unsure", "not-enough"] },
  { slug: "psalm-23", family: "psalm-23", act: 3, order: 85, title: "Psalm 23", subtitle: "The Lord is my shepherd", ref: "Psalm 23", kind: "Poetry and Prayer", lens: "story", level: "12+ and adult", desc: "A song for dark valleys, from a shepherd who became king.", status: "planned", passage: { book: "psalms", chapter: 23 }, feel: ["afraid", "sad", "anxious"] },
  { slug: "jesus-is-baptized", family: "jesus-is-baptized", act: 4, order: 110, title: "Jesus Is Baptized", subtitle: "A voice from heaven", ref: "Matthew 3:13-17", kind: "Story", lens: "story", level: "12+ and adult", desc: "Jesus steps into the river. God speaks.", status: "planned", passage: { book: "matthew", chapter: 3 }, feel: ["not-enough"] },
  {
    slug: "jesus-calms-the-storm", family: "jesus-calms-the-storm",
    act: 5, order: 130,
    title: "Jesus Calms the Storm", subtitle: "Waves, a sleeping Jesus, and a question",
    ref: "Mark 4:35-41",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "The boat is sinking. Jesus is asleep.",
    status: "early",
    passage: { book: "mark", chapter: 4 },
    feel: ["anxious", "afraid", "unsure"],
    memorize: { ref: "Mark 4:41", text: "Who is this, that even the wind and the sea obey Him?", gaps: ["wind", "obey"], decoys: ["rain", "follow"], part: true },
  },
  { slug: "the-last-supper", family: "the-last-supper", act: 6, order: 160, title: "The Last Supper", subtitle: "Jesus's last meal with his friends", ref: "Luke 22:7-23", kind: "Story", lens: "story", level: "12+ and adult", desc: "Bread, wine, and a promise on the night before the cross.", status: "planned", passage: { book: "luke", chapter: 22 }, feel: ["lonely", "sad"] },
  {
    slug: "the-empty-tomb", family: "the-empty-tomb",
    act: 6, order: 170,
    title: "The Empty Tomb", subtitle: "The cross, and Easter morning",
    ref: "Luke 23:26 to 24:12",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "Friday ends in darkness. Sunday morning, the stone is rolled away.",
    status: "early",
    passage: { book: "luke", chapter: 23, toChapter: 24 },
    feel: ["sad", "unsure", "guilty", "afraid"],
    contentNote: "This story tells how Jesus was put to death on a cross. It is told plainly, without graphic detail.",
    memorize: { ref: "Luke 24:6", text: "He is not here; He has risen!", gaps: ["here;", "risen!"], decoys: ["gone;", "sleeping!"], part: true },
  },
  { slug: "peter-is-forgiven", family: "peter-is-forgiven", act: 6, order: 180, title: "Peter Is Forgiven", subtitle: "Three questions by the sea", ref: "John 21:1-19", kind: "Story", lens: "story", level: "12+ and adult", desc: "Peter said he never knew Jesus. Jesus makes him breakfast.", status: "planned", passage: { book: "john", chapter: 21 }, feel: ["guilty", "not-enough"] },
  {
    slug: "pentecost", family: "pentecost",
    act: 7, order: 190,
    title: "Pentecost", subtitle: "The Holy Spirit comes",
    ref: "Acts 2",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "Wind, fire, and a crowd that hears in its own language.",
    status: "early",
    passage: { book: "acts", chapter: 2 },
    feel: ["lonely", "guilty", "unsure"],
    memorize: { ref: "Acts 2:21", text: "And everyone who calls on the name of the Lord will be saved.", gaps: ["everyone", "saved."], decoys: ["someone", "safe."], part: true },
  },
  { slug: "paul-on-the-road", family: "paul-on-the-road", act: 7, order: 200, title: "Paul on the Road", subtitle: "An enemy becomes a friend", ref: "Acts 9:1-19", kind: "Story", lens: "story", level: "12+ and adult", desc: "He hunted Christians. Then a light stopped him on the road.", status: "planned", passage: { book: "acts", chapter: 9 }, feel: ["guilty", "angry"] },
];

/* ---------- helpers: every page asks these questions the same way ---------- */

/** All stories in Bible order. */
export function inBibleOrder() { return [...STORIES].sort((a, b) => a.order - b.order); }
export function actOf(s: StoryEntry) { return ACTS[s.act - 1]; }
/** The story just before and just after this one in the Big Story. */
export function bibleNeighbors(s: StoryEntry) {
  const all = inBibleOrder();
  const i = all.findIndex((x) => x.slug === s.slug);
  return { before: i > 0 ? all[i - 1] : null, after: i < all.length - 1 ? all[i + 1] : null };
}
/** The next story you can read now, in Bible order (wraps to the start). */
export function nextReadableInBible(s: StoryEntry) {
  const all = inBibleOrder().filter((x) => isReadable(x) && x.slug !== s.slug);
  return all.find((x) => x.order > s.order) || all[0] || null;
}
/** Another readable story that shares a feeling with this one. */
export function sameFeeling(s: StoryEntry, not: string[] = []) {
  const others = STORIES.filter((x) => isReadable(x) && x.slug !== s.slug && !not.includes(x.slug));
  let best: StoryEntry | null = null, score = 0;
  for (const o of others) {
    const n = o.feel.filter((f) => s.feel.includes(f)).length;
    if (n > score) { best = o; score = n; }
  }
  return best ? { story: best, feel: best.feel.find((f) => s.feel.includes(f))! } : null;
}

export function storyBySlug(slug: string) { return STORIES.find((s) => s.slug === slug) || null; }
export function isBuilt(s: StoryEntry) { return s.status !== "planned"; }
export function isReadable(s: StoryEntry) { return s.status === "live" || (s.status === "early" && SHOW_EARLY_EDITIONS); }
export function isIndexed(s: StoryEntry) { return s.status === "live"; }
export function readableStories() { return STORIES.filter(isReadable); }
export function plannedStories() { return STORIES.filter((s) => s.status === "planned"); }
export function siblings(s: StoryEntry) { return STORIES.filter((x) => x.family === s.family && x.slug !== s.slug && isReadable(x)); }
export function storyHref(s: StoryEntry) {
  if (isReadable(s)) return `/stories/${s.slug}/`;
  if (s.parable) return `/parables/${s.parable}/`;
  return `/bsb/${s.passage.book}/${s.passage.chapter}/`;
}
export function compareHref(s: StoryEntry, other = "bsb") {
  return `/compare/${s.passage.book}/${s.passage.chapter}/?a=story:${s.slug}&b=${other}`;
}
export function storiesForChapter(bookSlug: string, chapter: number) {
  return readableStories().filter(
    (s) => s.passage.book === bookSlug && chapter >= s.passage.chapter && chapter <= (s.passage.toChapter ?? s.passage.chapter)
  );
}
export function coverTone(kind: Kind) {
  return kind === "Teaching" ? "letters" : kind === "Poetry and Prayer" ? "poetry" : "narrative";
}
export function activeLenses(): Lens[] {
  const set = new Set(readableStories().map((s) => s.lens));
  return (Object.keys(LENSES) as Lens[]).filter((l) => set.has(l));
}
/* ---------- Reading time ----------
   Honest times: every word a reader will see in each step, at 150 words
   a minute (a careful pace for teens, English learners, and anyone who
   reads slowly). Drawers that start closed are not counted. */
const CLOSED_BOXES = new Set(["scene-card", "before-the-story", "map-of-the-story", "from-luther", "in-church"]);
const WPM = 150;
function slugifyBox(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
export function stepWords(slug: string): { story: number; meaning: number; foryou: number } | null {
  const file = path.join(process.cwd(), "data", "stories", `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const out = { story: 0, meaning: 0, foryou: 0 } as Record<string, number>;
  const zoneStep: Record<string, string> = { "the-story": "story", "understand-it": "meaning", "why-it-matters": "foryou" };
  let step = "story", box = "";
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (/^# /.test(line)) { step = zoneStep[slugifyBox(line.slice(2))] || step; box = ""; continue; }
    if (/^## /.test(line)) { box = slugifyBox(line.slice(3).replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u, "").replace(/[:"'].*$/, "")); continue; }
    if (CLOSED_BOXES.has(box) || /^\|[-| ]+\|?$/.test(line)) continue;
    const clean = line.replace(/\{v:[^}]*\}/g, "").replace(/::/g, " ").replace(/[|>#*\-]/g, " ");
    out[step] += clean.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
  }
  return out as any;
}
const toMin = (w: number) => Math.max(1, Math.round(w / WPM));
export function stepMinutes(slug: string) {
  const w = stepWords(slug);
  if (!w) return null;
  const story = toMin(w.story), meaning = toMin(w.meaning), foryou = toMin(w.foryou), memorize = 2;
  return { story, meaning, foryou, memorize, total: story + meaning + foryou + memorize };
}
/** Word count of the Story step, for the listen and break markers. */
export function storyWords(slug: string) { return stepWords(slug)?.story || 0; }
/** Minutes for all four steps. */
export function storyMinutes(slug: string) { return stepMinutes(slug)?.total ?? null; }
/** The readable story just before this one in Bible order (no wrap). */
export function prevReadable(s: StoryEntry) {
  const all = inBibleOrder().filter((x) => isReadable(x) && x.order < s.order);
  return all.length ? all[all.length - 1] : null;
}
/** The readable story just after this one in Bible order (no wrap). */
export function nextReadable(s: StoryEntry) {
  return inBibleOrder().find((x) => isReadable(x) && x.order > s.order) || null;
}

/* ---------- Feelings ----------
   Words a teenager or an English learner would use. Every feeling must
   lead to at least one thing that is ready to read today. */
export const FEELINGS: { slug: string; label: string }[] = [
  { slug: "anxious", label: "Anxious" },
  { slug: "afraid", label: "Afraid" },
  { slug: "lonely", label: "Lonely" },
  { slug: "sad", label: "Sad or grieving" },
  { slug: "angry", label: "Angry" },
  { slug: "guilty", label: "Guilty" },
  { slug: "not-enough", label: "Not good enough" },
  { slug: "unsure", label: "Unsure about God" },
  { slug: "thankful", label: "Thankful" },
];

const NEED_FEEL: Record<string, string[]> = {
  fear: ["afraid", "anxious"], grief: ["sad"], strength: ["anxious", "not-enough"], guilt: ["guilty"],
  forgiveness: ["angry"], wisdom: ["unsure"], alone: ["lonely"], "racing-mind": ["anxious"],
  doubt: ["unsure"], angry: ["angry"], celebrate: ["thankful"], "new-baby": ["thankful"],
  gratitude: ["thankful"], "thinking-of-you": ["sad", "lonely"],
};
const THEME_FEEL: Record<string, string[]> = {
  "lost-and-found": ["lonely", "not-enough"], forgiveness: ["guilty", "angry"], neighbor: ["lonely"],
  kingdom: ["unsure"], prayer: ["anxious"], money: [], watchfulness: ["unsure"],
  reversal: ["not-enough"], foundations: ["unsure"],
};

/* ---------- The catalog: everything the Stories page lists ---------- */
export type CatKind = "Story" | "Teaching" | "Parable" | "Verses";
export type CatStatus = "Ready" | "New" | "Coming soon";
export interface CatItem {
  id: string; kind: CatKind; title: string; subtitle: string; ref: string; desc: string;
  minutes: number | null; size: string; status: CatStatus; feel: string[]; href: string;
  note?: string; inside: { name: string; line: string }[];
  act?: number; order?: number;
}

export const KIND_HELP: Record<CatKind, string> = {
  Story: "Something that happened",
  Teaching: "Something Jesus taught",
  Parable: "A short story Jesus told",
  Verses: "A few verses about one feeling",
};

const SBS_INSIDE = [
  { name: "1. Story:", line: "what happened, in short scenes, with each verse beside it." },
  { name: "2. Meaning:", line: "hard words and key lines, explained." },
  { name: "3. For you:", line: "tap an answer and see what it means for your life. No typing, no grades." },
  { name: "4. Memorize:", line: "one line to learn by heart." },
];

function wordsIn(verses: { t: string }[]) { return verses.reduce((n, v) => n + v.t.split(/\s+/).length, 0); }

export function catalog(): CatItem[] {
  const items: CatItem[] = [];
  for (const s of STORIES) {
    const ready = isReadable(s);
    // A planned retelling of a parable waits quietly: the parable page is already readable.
    if (!ready && s.parable) continue;
    const min = ready ? storyMinutes(s.slug) : null;
    items.push({
      id: `story-${s.slug}`, kind: s.kind === "Teaching" ? "Teaching" : "Story",
      title: s.title, subtitle: s.subtitle, ref: s.ref, desc: s.desc,
      minutes: min, size: "", status: ready ? (s.status === "early" ? "New" : "Ready") : "Coming soon",
      feel: s.feel, href: storyHref(s), note: s.contentNote, act: s.act, order: s.order,
      inside: ready ? SBS_INSIDE : [{ name: "Not written yet.", line: "For now, this opens the Bible passage so you can read it today." }],
    });
  }
  for (const p of PARABLES as any[]) {
    if (STORIES.some((s) => s.parable === p.slug && isReadable(s))) continue;
    const [book, ch, sv, ev] = p.ref;
    const verses = pullRange("bsb", book, ch, sv, ev);
    const min = Math.max(2, Math.round(wordsIn(verses) / 180) + 1);
    const theme = (PARABLE_THEMES as any[]).find((t) => t.slug === p.theme);
    items.push({
      id: `parable-${p.slug}`, kind: "Parable", title: p.title,
      subtitle: theme ? theme.label : "A parable of Jesus",
      ref: `${book} ${ch}:${sv}-${ev}`, desc: p.cover || p.line,
      minutes: min, size: `${verses.length} verses`, status: "Ready",
      feel: THEME_FEEL[p.theme] || [], href: `/parables/${p.slug}/`,
      inside: [
        { name: "The point:", line: "the surprising part, in one or two sentences." },
        { name: "The parable", line: "in the Bible's own words." },
        { name: "Other Gospels", line: "that tell it too, when there are any." },
      ],
    });
  }
  for (const n of NEEDS as any[]) {
    items.push({
      id: `verses-${n.slug}`, kind: "Verses", title: n.short, subtitle: "Verses for how you feel",
      ref: `${n.passages.length} passages`, desc: n.card, minutes: 3, size: "",
      status: "Ready", feel: NEED_FEEL[n.slug] || [], href: `/read/${n.slug}/`,
      inside: [
        { name: `${n.passages.length} short passages,`, line: "each with one line about why it helps." },
        { name: "Send one", line: "to a friend with one tap." },
      ],
    });
  }
  return items;
}
