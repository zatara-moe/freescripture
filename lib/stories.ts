/* Scene by Scene: the story shelf.
   To publish a new story:
   1. Save the finished Markdown (starting at "# The Story") as
      data/stories/<slug>.md
   2. Add an entry below with file: true.
   3. When the pastor review is done, set ready: true. Until then the
      page builds for preview but stays off the shelf and out of search. */

export interface StoryEntry {
  slug: string;
  title: string;
  ref: string;
  kind: "Story" | "Teaching" | "Poetry and Prayer";
  level: "12+ and adult" | "8+";
  desc: string;
  file: boolean;
  ready: boolean;
  contentNote?: string;
  passage?: { book: string; chapter: number };
}

export const STORIES: StoryEntry[] = [
  {
    slug: "david-and-goliath",
    title: "David and Goliath",
    ref: "1 Samuel 17",
    kind: "Story",
    level: "12+ and adult",
    desc: "A shepherd nobody expected. A giant everyone feared.",
    file: true,
    ready: false,
    contentNote: "This story includes a battle. David kills Goliath and cuts off his head.",
    passage: { book: "1-samuel", chapter: 17 },
  },
  { slug: "sermon-on-the-mount", title: "The Sermon on the Mount", ref: "Matthew 5 to 7", kind: "Teaching", level: "12+ and adult", desc: "Jesus's longest teaching, one section at a time.", file: false, ready: false, passage: { book: "matthew", chapter: 5 } },
  { slug: "jonah", title: "Jonah", ref: "Jonah 1 to 4", kind: "Story", level: "12+ and adult", desc: "A prophet who ran. A city God refused to give up on.", file: false, ready: false },
  { slug: "noah", title: "Noah", ref: "Genesis 6 to 9", kind: "Story", level: "12+ and adult", desc: "More than water and a boat.", file: false, ready: false },
  { slug: "good-samaritan", title: "The Good Samaritan", ref: "Luke 10:25-37", kind: "Teaching", level: "12+ and adult", desc: "You've heard \"be kind.\" That's not the main point.", file: false, ready: false },
  { slug: "zacchaeus", title: "Zacchaeus", ref: "Luke 19:1-10", kind: "Story", level: "12+ and adult", desc: "A tax collector climbed a tree. Everything changed.", file: false, ready: false },
  { slug: "joseph", title: "Joseph", ref: "Genesis 37 to 50", kind: "Story", level: "12+ and adult", desc: "Sold by his brothers. The long road from pit to palace.", file: false, ready: false },
];

export function storyBySlug(slug: string) {
  return STORIES.find((s) => s.slug === slug) || null;
}
