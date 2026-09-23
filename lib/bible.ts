import fs from "node:fs";
import path from "node:path";
import meta from "./meta.json";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------
export type TransSlug = "web" | "kjv" | "bbe";

export interface Verse { v: number; t: string; }
export interface Chapter { num: number; verses: Verse[]; }
export interface Book {
  name: string;
  slug: string;
  translation: TransSlug;
  chapters: Chapter[];
}
export interface TransMeta {
  slug: TransSlug;
  label: string;
  short: string;
  plain: string;
  year: string;
  description: string;
  has_apocrypha: boolean;
  nick: string; // plain name for buttons: Modern, Classic, Simple
}

interface ManifestBook { name: string; slug: string; chapters: number[]; }
type Manifest = Record<TransSlug, ManifestBook[]>;

// ------------------------------------------------------------
// Metadata (extracted from the original build, preserved verbatim)
// ------------------------------------------------------------
export const TRANSLATIONS = meta.TRANSLATIONS as Record<TransSlug, TransMeta>;
export const TRANS_ORDER: TransSlug[] = ["web", "kjv", "bbe"];
export const DEFAULT_TRANS: TransSlug = "web";

// BOOK_ORDER: [name, testament ('ot'|'ap'|'nt'), group]
export const BOOK_ORDER = meta.BOOK_ORDER as [string, string, string][];
export const GENRE_OF = meta.GENRE_OF as Record<string, string>;
export const GENRES = meta.GENRES as any[];
export const NEEDS = meta.NEEDS as any[];
export const BOOK_INTROS = meta.BOOK_INTROS as Record<string, string>;
export const BOOK_PITCHES = meta.BOOK_PITCHES as Record<string, string>;
export const PARABLES = (meta as any).PARABLES as any[];
export const PARABLE_THEMES = (meta as any).PARABLE_THEMES as any[];

// ------------------------------------------------------------
// Data directory + manifest
// ------------------------------------------------------------
const DATA_DIR = path.join(process.cwd(), "data");

let _manifest: Manifest | null = null;
export function manifest(): Manifest {
  if (!_manifest) {
    _manifest = JSON.parse(
      fs.readFileSync(path.join(DATA_DIR, "manifest.json"), "utf8")
    );
  }
  return _manifest!;
}

// ------------------------------------------------------------
// Slug helper (matches the data build)
// ------------------------------------------------------------
export function bookSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[()]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// name lookup from slug, per translation
export function bookNameFromSlug(trans: TransSlug, slug: string): string | null {
  const b = manifest()[trans].find((x) => x.slug === slug);
  return b ? b.name : null;
}

// ------------------------------------------------------------
// Loaders
// ------------------------------------------------------------
const _bookCache = new Map<string, Book>();
const _transCache = new Map<string, Record<string, any>>();

/* Each translation lives in one file, data/bible/<translation>.json,
   keyed by book slug. One file per translation keeps the whole repo
   under GitHub's 100-file web upload limit. */
function loadTranslation(trans: TransSlug): Record<string, any> {
  if (_transCache.has(trans)) return _transCache.get(trans)!;
  const file = path.join(DATA_DIR, "bible", `${trans}.json`);
  const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
  _transCache.set(trans, data);
  return data;
}

export function loadBook(trans: TransSlug, slug: string): Book | null {
  const key = `${trans}/${slug}`;
  if (_bookCache.has(key)) return _bookCache.get(key)!;
  const raw = loadTranslation(trans)[slug];
  if (!raw) return null;
  const book: Book = {
    name: raw.name,
    slug: raw.slug,
    translation: trans,
    chapters: raw.chapters.map((c: any) => ({ num: c.num, verses: c.verses })),
  };
  _bookCache.set(key, book);
  return book;
}

export function loadChapter(
  trans: TransSlug,
  slug: string,
  num: number
): { book: Book; chapter: Chapter } | null {
  const book = loadBook(trans, slug);
  if (!book) return null;
  const chapter = book.chapters.find((c) => c.num === num);
  if (!chapter) return null;
  return { book, chapter };
}

// ------------------------------------------------------------
// Book ordering / grouping helpers
// ------------------------------------------------------------
export function booksForTranslation(trans: TransSlug): ManifestBook[] {
  return manifest()[trans];
}

export function testamentOf(name: string): string {
  const row = BOOK_ORDER.find((r) => r[0] === name);
  return row ? row[1] : "ot";
}
export function groupOf(name: string): string {
  const row = BOOK_ORDER.find((r) => r[0] === name);
  return row ? row[2] : "";
}

// Flat, canonical-ordered chapter sequence for a translation (prev/next nav).
export function flatChapters(trans: TransSlug): { name: string; slug: string; num: number }[] {
  const present = new Set(manifest()[trans].map((b) => b.name));
  const byName = new Map(manifest()[trans].map((b) => [b.name, b]));
  const out: { name: string; slug: string; num: number }[] = [];
  for (const [name] of BOOK_ORDER) {
    if (!present.has(name)) continue;
    const b = byName.get(name)!;
    for (const num of b.chapters) out.push({ name, slug: b.slug, num });
  }
  return out;
}

// Look up a single verse's text at build time (for curated pulls).
// Divine-name substitution: the upstream WEB text renders the
// Tetragrammaton as "Yahweh" (6,831 OT occurrences) and "Yah" (47).
// This site's stated policy is "the LORD" throughout, matching the
// convention readers expect from NIV/NRSV/ESV pulpit Bibles. The
// chapter renderer already applies this; pullVerse and firstVerse
// must too, or the Need pages show "Yahweh" while the chapter page
// shows "the LORD" for the same verse. See the pastoral review.
export function normalizeDivineName(text: string): string {
  return text
    .replace(/\bO Yahweh\b/g, "O LORD")
    .replace(/\bYahweh\b/g, (_, offset: number) => {
      // Sentence-start capitalization: "the LORD" at start of sentence
      if (offset === 0) return "The LORD";
      const before = text[offset - 1];
      // After sentence-ending punctuation + space
      if (before === " " && offset >= 2 && ".!?\"'".includes(text[offset - 2]))
        return "The LORD";
      return "the LORD";
    })
    .replace(/\bO Yah\b/g, "O LORD")
    .replace(/\bYah\b/g, "the LORD");
}

export function pullVerse(
  trans: TransSlug,
  bookName: string,
  chapter: number,
  verse: number
): string {
  const b = manifest()[trans].find((x) => x.name === bookName);
  if (!b) return "";
  const book = loadBook(trans, b.slug);
  if (!book) return "";
  const ch = book.chapters.find((c) => c.num === chapter);
  if (!ch) return "";
  const v = ch.verses.find((x) => x.v === verse);
  return v ? normalizeDivineName(v.t) : "";
}

// First verse of a chapter, as a short pull line.
export function firstVerse(trans: TransSlug, bookName: string, chapter: number): string {
  const b = manifest()[trans].find((x) => x.name === bookName);
  if (!b) return "";
  const book = loadBook(trans, b.slug);
  if (!book) return "";
  const ch = book.chapters.find((c) => c.num === chapter);
  if (!ch || !ch.verses.length) return "";
  return normalizeDivineName(ch.verses[0].t);
}

// A range of verses, for parables and other passages that span more than
// one verse. Returns [] if anything in the chain is missing rather than
// throwing, so a bad reference degrades to "no text" instead of a crash.
export function pullRange(
  trans: TransSlug,
  bookName: string,
  chapter: number,
  startVerse: number,
  endVerse: number
): { v: number; t: string }[] {
  const b = manifest()[trans].find((x) => x.name === bookName);
  if (!b) return [];
  const book = loadBook(trans, b.slug);
  if (!book) return [];
  const ch = book.chapters.find((c) => c.num === chapter);
  if (!ch) return [];
  return ch.verses
    .filter((x) => x.v >= startVerse && x.v <= endVerse)
    .map((x) => ({ v: x.v, t: normalizeDivineName(x.t) }));
}

export const SITE_URL = "https://freescripture.org";
