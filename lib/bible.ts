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

export function loadBook(trans: TransSlug, slug: string): Book | null {
  const key = `${trans}/${slug}`;
  if (_bookCache.has(key)) return _bookCache.get(key)!;
  const file = path.join(DATA_DIR, "books", trans, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
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
  return v ? v.t : "";
}

// First verse of a chapter, as a short pull line.
export function firstVerse(trans: TransSlug, bookName: string, chapter: number): string {
  const b = manifest()[trans].find((x) => x.name === bookName);
  if (!b) return "";
  const book = loadBook(trans, b.slug);
  if (!book) return "";
  const ch = book.chapters.find((c) => c.num === chapter);
  if (!ch || !ch.verses.length) return "";
  return ch.verses[0].t;
}

export const SITE_URL = "https://freescripture.org";
