/* Search by the names people already know.

   Site search used to look only inside Bible verses. Searching "prodigal
   son" or "woman at the well" found nothing, because those words are
   section headings, not Bible text. This file lets search find things by
   their familiar names first, then show matching verses below.

   FAMILIAR is a list of well-known Bible passages that don't have a Scene
   by Scene story yet. Each one opens the passage in the Berean Standard
   Bible. Titles follow the story naming rule in lib/stories.ts: the
   wording most Bibles print as the section heading. When a story is
   written for one of these, remove it here and give the story an `also`
   list instead.

   TO ADD ONE: title, ref (as shown), book slug (see data/manifest.json),
   chapter, first verse, and `also` (other names people search for). */

import { kindLabel, STORIES, isReadable, storyHref } from "./stories";
import { PARABLES, NEEDS } from "./bible";
import { ERAS } from "./timeline";
import { PATHS } from "./paths";

export interface Familiar { title: string; ref: string; book: string; ch: number; v?: number; also: string[] }

export const FAMILIAR: Familiar[] = [
  /* ---- The beginning and the ancestors ---- */
  { title: "Jacob's Ladder", ref: "Genesis 28:10-22", book: "genesis", ch: 28, v: 10, also: ["Jacob's dream", "Stairway to heaven", "Bethel"] },

  /* ---- Moses and the wilderness ---- */

  /* ---- The promised land, judges, and kings ---- */
  { title: "Gideon", ref: "Judges 6 to 7", book: "judges", ch: 6, v: 11, also: ["Gideon's fleece", "Gideon's 300"] },
  { title: "David and Jonathan", ref: "1 Samuel 18:1-4", book: "1-samuel", ch: 18, v: 1, also: ["Jonathan", "Best friends"] },

  /* ---- Exile ---- */
  { title: "The Writing on the Wall", ref: "Daniel 5", book: "daniel", ch: 5, v: 1, also: ["Belshazzar's feast", "Handwriting on the wall"] },

  /* ---- Jesus: birth and early years ---- */

  /* ---- Jesus: calling, teaching, and healing ---- */
  { title: "Jesus Calls Matthew", ref: "Matthew 9:9-13", book: "matthew", ch: 9, v: 9, also: ["Matthew the tax collector", "Levi", "Follow me"] },
  { title: "Jesus Chooses the Twelve", ref: "Mark 3:13-19", book: "mark", ch: 3, v: 13, also: ["The twelve disciples", "The twelve apostles", "The disciples", "Peter", "Andrew", "James", "John", "Philip", "Bartholomew", "Nathanael", "Matthew", "Thomas", "James son of Alphaeus", "Thaddaeus", "Simon the Zealot", "Judas Iscariot"] },
  { title: "Healing at the Pool of Bethesda", ref: "John 5:1-15", book: "john", ch: 5, v: 1, also: ["Pool of Bethesda", "Do you want to get well?", "Pick up your mat"] },
  { title: "Mary Magdalene", ref: "Luke 8:1-3", book: "luke", ch: 8, v: 1, also: ["Mary of Magdala", "Women who followed Jesus", "Seven demons"] },

  /* ---- Holy Week ---- */

  /* ---- After Easter ---- */

  /* ---- Letters and well-known chapters ---- */
  { title: "The Fruit of the Spirit", ref: "Galatians 5:22-23", book: "galatians", ch: 5, v: 22, also: ["Love, joy, peace", "Fruits of the spirit"] },
  { title: "The Armor of God", ref: "Ephesians 6:10-18", book: "ephesians", ch: 6, v: 10, also: ["Full armor of God", "Shield of faith", "Sword of the Spirit"] },
  { title: "The Heroes of Faith", ref: "Hebrews 11", book: "hebrews", ch: 11, v: 1, also: ["Faith hall of fame", "Faith is the assurance"] },
  { title: "A New Heaven and a New Earth", ref: "Revelation 21:1-7", book: "revelation", ch: 21, v: 1, also: ["No more tears", "All things new", "New Jerusalem"] },
];

/** Extra names for people on the timeline, so "Simon Peter" finds Peter. */
const PEOPLE_ALSO: Record<string, string[]> = {
  "Peter": ["Simon Peter", "Simon", "Cephas"],
  "Paul": ["Saul of Tarsus", "Apostle Paul"],
  "Mary": ["Mary, mother of Jesus", "Virgin Mary"],
  "Mary Magdalene": ["Mary of Magdala"],
  "Jacob": ["Israel"],
  "Abraham": ["Abram"],
  "Sarah": ["Sarai"],
  "Moses": ["Lawgiver"],
};

/* ---------- One list for site search ---------- */

export type HitKind = "Story" | "Teaching" | "Prayer" | "Letter" | "Prophecy" | "Parable" | "Reading path" | "Bible passage" | "Person" | "Verses";
export interface SearchEntry {
  t: string;        // title
  s: string;        // one short line under the title
  r: string;        // Bible reference
  k: HitKind;
  u: string;        // link
  a: string[];      // other names
  n?: string;       // small note under the title (optional)
}

export function searchCatalog(): SearchEntry[] {
  const out: SearchEntry[] = [];
  const retold = new Set<string>();
  for (const s of STORIES) {
    const ready = isReadable(s);
    if (ready && s.parable) retold.add(s.parable);
    /* A story that isn't written yet is listed as its Bible passage. */
    out.push({
      t: s.title, s: ready ? s.subtitle : "Read it in the Bible", r: s.ref,
      k: !ready ? "Bible passage" : kindLabel(s.kind),
      u: storyHref(s), a: s.also || [],
    });
  }
  /* Reading paths: a big passage told in parts ("Moses and the Exodus",
     "The Sermon on the Mount") is found under its familiar name. */
  for (const p of PATHS) {
    out.push({ t: p.title, s: p.question, r: `${p.steps.length} stories`, k: "Reading path", u: `/paths/${p.slug}/`, a: p.also || [] });
  }
  for (const p of PARABLES as any[]) {
    if (retold.has(p.slug)) continue;
    const [book, ch, sv, ev] = p.ref;
    out.push({ t: p.title, s: "A parable of Jesus", r: `${book} ${ch}:${sv}-${ev}`, k: "Parable", u: `/parables/${p.slug}/`, a: p.also || [] });
  }
  for (const f of FAMILIAR) {
    out.push({ t: f.title, s: "Read it in the Bible", r: f.ref, k: "Bible passage", u: `/bsb/${f.book}/${f.ch}/${f.v && f.v > 1 ? `#v${f.v}` : ""}`, a: f.also });
  }
  for (const n of NEEDS as any[]) {
    out.push({ t: n.short, s: "Verses for how you feel", r: `${n.passages.length} passages`, k: "Verses", u: `/read/${n.slug}/`, a: [n.slug.replace(/-/g, " ")] });
  }
  const seen = new Set<string>();
  for (const e of ERAS) {
    for (const [name, line] of e.people) {
      if (seen.has(name)) continue;
      seen.add(name);
      out.push({ t: name, s: line, r: e.title, k: "Person", u: `/timeline/#${e.id}`, a: PEOPLE_ALSO[name] || [] });
    }
  }
  return out;
}
