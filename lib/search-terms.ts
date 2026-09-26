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

import { STORIES, isReadable, storyHref } from "./stories";
import { PARABLES, NEEDS } from "./bible";
import { ERAS } from "./timeline";
import { PATHS } from "./paths";

export interface Familiar { title: string; ref: string; book: string; ch: number; v?: number; also: string[] }

export const FAMILIAR: Familiar[] = [
  /* ---- The beginning and the ancestors ---- */
  { title: "Jacob's Ladder", ref: "Genesis 28:10-22", book: "genesis", ch: 28, v: 10, also: ["Jacob's dream", "Stairway to heaven", "Bethel"] },
  { title: "Jacob Wrestles with God", ref: "Genesis 32:22-32", book: "genesis", ch: 32, v: 22, also: ["Jacob becomes Israel", "Wrestling with the angel"] },

  /* ---- Moses and the wilderness ---- */
  { title: "Manna from Heaven", ref: "Exodus 16", book: "exodus", ch: 16, v: 1, also: ["Manna", "Bread from heaven", "Quail"] },
  { title: "The Golden Calf", ref: "Exodus 32", book: "exodus", ch: 32, v: 1, also: ["Golden calf idol"] },

  /* ---- The promised land, judges, and kings ---- */
  { title: "Gideon", ref: "Judges 6 to 7", book: "judges", ch: 6, v: 11, also: ["Gideon's fleece", "Gideon's 300"] },
  { title: "Hannah's Prayer", ref: "1 Samuel 1", book: "1-samuel", ch: 1, v: 1, also: ["Hannah", "Samuel's birth"] },
  { title: "David Is Anointed", ref: "1 Samuel 16:1-13", book: "1-samuel", ch: 16, v: 1, also: ["Samuel anoints David", "God looks at the heart"] },
  { title: "David and Jonathan", ref: "1 Samuel 18:1-4", book: "1-samuel", ch: 18, v: 1, also: ["Jonathan", "Best friends"] },
  { title: "David and Bathsheba", ref: "2 Samuel 11 to 12", book: "2-samuel", ch: 11, v: 1, also: ["Bathsheba", "Nathan the prophet", "You are the man"] },
  { title: "The Wisdom of Solomon", ref: "1 Kings 3:16-28", book: "1-kings", ch: 3, v: 16, also: ["Solomon", "Two mothers and a baby", "King Solomon's judgment"] },
  { title: "Elijah Goes Up to Heaven", ref: "2 Kings 2:1-12", book: "2-kings", ch: 2, v: 1, also: ["Chariot of fire", "Elisha"] },
  { title: "Naaman Is Healed", ref: "2 Kings 5:1-19", book: "2-kings", ch: 5, v: 1, also: ["Naaman", "Wash in the Jordan"] },

  /* ---- Exile ---- */
  { title: "The Writing on the Wall", ref: "Daniel 5", book: "daniel", ch: 5, v: 1, also: ["Belshazzar's feast", "Handwriting on the wall"] },
  { title: "Ezekiel and the Dry Bones", ref: "Ezekiel 37:1-14", book: "ezekiel", ch: 37, v: 1, also: ["Valley of dry bones", "Dry bones"] },
  { title: "Job", ref: "Job 1 to 2", book: "job", ch: 1, v: 1, also: ["Why do good people suffer", "The patience of Job"] },

  /* ---- Jesus: birth and early years ---- */
  { title: "The Boy Jesus at the Temple", ref: "Luke 2:41-52", book: "luke", ch: 2, v: 41, also: ["Jesus at 12", "My Father's house"] },
  { title: "Jesus Is Tempted", ref: "Matthew 4:1-11", book: "matthew", ch: 4, v: 1, also: ["The temptation of Jesus", "Forty days in the wilderness", "Jesus and the devil"] },

  /* ---- Jesus: calling, teaching, and healing ---- */
  { title: "Jesus Calls Matthew", ref: "Matthew 9:9-13", book: "matthew", ch: 9, v: 9, also: ["Matthew the tax collector", "Levi", "Follow me"] },
  { title: "Jesus Chooses the Twelve", ref: "Mark 3:13-19", book: "mark", ch: 3, v: 13, also: ["The twelve disciples", "The twelve apostles", "The disciples", "Peter", "Andrew", "James", "John", "Philip", "Bartholomew", "Nathanael", "Matthew", "Thomas", "James son of Alphaeus", "Thaddaeus", "Simon the Zealot", "Judas Iscariot"] },
  { title: "Healing at the Pool of Bethesda", ref: "John 5:1-15", book: "john", ch: 5, v: 1, also: ["Pool of Bethesda", "Do you want to get well?", "Pick up your mat"] },
  { title: "Mary Magdalene", ref: "Luke 8:1-3", book: "luke", ch: 8, v: 1, also: ["Mary of Magdala", "Women who followed Jesus", "Seven demons"] },
  { title: "Peter Says Who Jesus Is", ref: "Matthew 16:13-20", book: "matthew", ch: 16, v: 13, also: ["Who do you say I am?", "Peter's confession", "On this rock"] },
  { title: "The Transfiguration", ref: "Matthew 17:1-13", book: "matthew", ch: 17, v: 1, also: ["Jesus on the mountain", "Moses and Elijah"] },
  { title: "Mary and Martha", ref: "Luke 10:38-42", book: "luke", ch: 10, v: 38, also: ["Martha", "Sitting at Jesus's feet"] },
  { title: "Jesus Heals Ten Lepers", ref: "Luke 17:11-19", book: "luke", ch: 17, v: 11, also: ["Ten lepers", "The one who said thank you"] },
  { title: "Jesus Heals a Man Born Blind", ref: "John 9", book: "john", ch: 9, v: 1, also: ["I was blind but now I see", "Mud on his eyes"] },
  { title: "Jesus Blesses the Children", ref: "Mark 10:13-16", book: "mark", ch: 10, v: 13, also: ["Let the little children come", "Jesus and the children"] },
  { title: "The Rich Young Man", ref: "Mark 10:17-31", book: "mark", ch: 10, v: 17, also: ["The rich young ruler", "Eye of a needle"] },
  { title: "Blind Bartimaeus", ref: "Mark 10:46-52", book: "mark", ch: 10, v: 46, also: ["Bartimaeus", "Son of David, have mercy on me"] },

  /* ---- Holy Week ---- */
  { title: "Jesus Washes the Disciples' Feet", ref: "John 13:1-17", book: "john", ch: 13, v: 1, also: ["Washing feet", "Foot washing", "Maundy Thursday"] },

  /* ---- After Easter ---- */
  { title: "The Great Commission", ref: "Matthew 28:16-20", book: "matthew", ch: 28, v: 16, also: ["Go and make disciples", "I am with you always"] },
  { title: "Jesus Goes Up to Heaven", ref: "Acts 1:6-11", book: "acts", ch: 1, v: 6, also: ["The Ascension", "Jesus ascends"] },

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

export type HitKind = "Story" | "Teaching" | "Prayer" | "Parable" | "Reading path" | "Bible passage" | "Person" | "Verses";
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
      k: !ready ? "Bible passage" : s.kind === "Teaching" ? "Teaching" : s.kind === "Poetry and Prayer" ? "Prayer" : "Story",
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
