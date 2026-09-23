/* Scene by Scene: the story shelf.

   HOW THIS IS ORGANIZED
   A "story" is one retelling of one passage. A passage can have more than
   one retelling: different ages (8+, 12+ and adult) and different ways of
   reading (the lens). Retellings of the same passage share a `family`, so
   the site can say "Also available for ages 8+" or "Also in Literal".

   TO PUBLISH A NEW STORY
   1. Save the finished Markdown (starting at "# The Story") as
      data/stories/<slug>.md
   2. Add an entry below with status "early".
      Early editions show on the shelf with an "Early edition" badge, and
      search engines are told not to index them.
   3. When the pastor review is done, change status to "live".

   TO ADD A SECOND VERSION OF THE SAME PASSAGE (another age or lens)
   Give it its own slug (for example "david-and-goliath-8"), the same
   `family` as the first one, and its own lens and level.

   TO HIDE EARLY EDITIONS FROM THE PUBLIC
   Set SHOW_EARLY_EDITIONS to false. They still build as unlisted previews. */

export const SHOW_EARLY_EDITIONS = true;

export type Lens = "story" | "literal" | "technical" | "philosopher";
export type Level = "12+ and adult" | "8+";
export type Status = "live" | "early" | "planned";
export type Kind = "Story" | "Teaching" | "Poetry and Prayer";

/* Ways to read. A lens only appears on the site once it has a story. */
export const LENSES: Record<Lens, { name: string; line: string }> = {
  story: { name: "Story", line: "What happened, in order, one scene at a time." },
  literal: { name: "Literal", line: "Says exactly what the text says, and flags every figure of speech." },
  technical: { name: "How it worked", line: "Maps, numbers, timelines, and how things worked back then." },
  philosopher: { name: "Big questions", line: "The ideas under the story, and the questions it leaves you with." },
};

export interface Passage {
  book: string;        // slug, e.g. "1-samuel"
  chapter: number;     // first chapter
  toChapter?: number;  // last chapter, when the story spans several
}

export interface StoryEntry {
  slug: string;
  family: string;
  title: string;
  ref: string;
  kind: Kind;
  lens: Lens;
  level: Level;
  desc: string;
  cover?: string;       // short line for the shelf cover, 64 characters at most (falls back to desc)
  status: Status;
  passage: Passage;
  parable?: string;     // slug on /parables/, when the passage is a parable
  contentNote?: string;
}

export const STORIES: StoryEntry[] = [
  {
    slug: "david-and-goliath", family: "david-and-goliath",
    title: "David and Goliath", ref: "1 Samuel 17",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "A shepherd nobody expected. A giant everyone feared.",
    status: "early",
    passage: { book: "1-samuel", chapter: 17 },
    contentNote: "This story includes a battle. David kills Goliath and cuts off his head.",
  },
  { slug: "sermon-on-the-mount", family: "sermon-on-the-mount", title: "The Sermon on the Mount", ref: "Matthew 5 to 7", kind: "Teaching", lens: "story", level: "12+ and adult", desc: "Jesus's longest teaching, one section at a time.", status: "planned", passage: { book: "matthew", chapter: 5, toChapter: 7 } },
  { slug: "jonah", family: "jonah", title: "Jonah", ref: "Jonah 1 to 4", kind: "Story", lens: "story", level: "12+ and adult", desc: "A prophet who ran. A city God refused to give up on.", status: "planned", passage: { book: "jonah", chapter: 1, toChapter: 4 } },
  { slug: "noah", family: "noah", title: "Noah", ref: "Genesis 6 to 9", kind: "Story", lens: "story", level: "12+ and adult", desc: "More than water and a boat.", status: "planned", passage: { book: "genesis", chapter: 6, toChapter: 9 } },
  { slug: "good-samaritan", family: "good-samaritan", title: "The Good Samaritan", ref: "Luke 10:25-37", kind: "Teaching", lens: "story", level: "12+ and adult", desc: "You've heard \"be kind.\" That's not the main point.", status: "planned", passage: { book: "luke", chapter: 10 }, parable: "good-samaritan" },
  { slug: "zacchaeus", family: "zacchaeus", title: "Zacchaeus", ref: "Luke 19:1-10", kind: "Story", lens: "story", level: "12+ and adult", desc: "A tax collector climbed a tree. Everything changed.", status: "planned", passage: { book: "luke", chapter: 19 } },
  { slug: "joseph", family: "joseph", title: "Joseph", ref: "Genesis 37 to 50", kind: "Story", lens: "story", level: "12+ and adult", desc: "Sold by his brothers. The long road from pit to palace.", status: "planned", passage: { book: "genesis", chapter: 37, toChapter: 50 } },
];

/* ---------- helpers: every page asks these questions the same way ---------- */

export function storyBySlug(slug: string) {
  return STORIES.find((s) => s.slug === slug) || null;
}
/** Has a written file, so the page can be built (even as a preview). */
export function isBuilt(s: StoryEntry) {
  return s.status !== "planned";
}
/** Shown on the shelf and linked from other pages. */
export function isReadable(s: StoryEntry) {
  return s.status === "live" || (s.status === "early" && SHOW_EARLY_EDITIONS);
}
/** Search engines may index it. Only pastor-reviewed stories. */
export function isIndexed(s: StoryEntry) {
  return s.status === "live";
}
export function readableStories() {
  return STORIES.filter(isReadable);
}
export function plannedStories() {
  return STORIES.filter((s) => s.status === "planned");
}
/** Other versions of the same passage (other ages or lenses). */
export function siblings(s: StoryEntry) {
  return STORIES.filter((x) => x.family === s.family && x.slug !== s.slug && isReadable(x));
}
/** Where a tap goes. Planned stories open the passage itself, today. */
export function storyHref(s: StoryEntry) {
  if (isReadable(s)) return `/stories/${s.slug}/`;
  if (s.parable) return `/parables/${s.parable}/`;
  return `/web/${s.passage.book}/${s.passage.chapter}/`;
}
/** Side-by-side link: this retelling next to a Bible translation. */
export function compareHref(s: StoryEntry, other = "web") {
  return `/compare/${s.passage.book}/${s.passage.chapter}/?a=story:${s.slug}&b=${other}`;
}
/** Readable stories whose passage touches this chapter. */
export function storiesForChapter(bookSlug: string, chapter: number) {
  return readableStories().filter(
    (s) => s.passage.book === bookSlug && chapter >= s.passage.chapter && chapter <= (s.passage.toChapter ?? s.passage.chapter)
  );
}
/** Genre color used for the cover spine. */
export function coverTone(kind: Kind) {
  return kind === "Teaching" ? "letters" : kind === "Poetry and Prayer" ? "poetry" : "narrative";
}
/** Lenses that actually have something readable. */
export function activeLenses(): Lens[] {
  const set = new Set(readableStories().map((s) => s.lens));
  return (Object.keys(LENSES) as Lens[]).filter((l) => set.has(l));
}
