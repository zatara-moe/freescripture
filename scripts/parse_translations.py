#!/usr/bin/env python3
"""
freescripture.org — translation parser

Converts source data from multiple public-domain translation repositories
into our standard JSON format (one file per book, matching the aruljohn KJV layout).
Outputs to /content/<translation>/.

Supported sources:

  scrollmapper-books format:
    - source-scroll/formats/json/<NAME>.json is one big JSON with
      {"translation": "...", "books": [{"name": "Genesis", "chapters": [...]}]}
    - Used for: BBE (Bible in Basic English), ASV (American Standard Version)

  TehShrike WEB format:
    - source-web/json/<bookname>.json is a flat list of paragraph/line tokens
      with chapterNumber/verseNumber/value fields.
    - Used for: WEB (World English Bible)

Usage: python3 scripts/parse_translations.py
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE_SCROLL_JSON = ROOT / "source-scroll" / "formats" / "json"
SOURCE_WEB = ROOT / "source-web" / "json"
OUT_BASE = ROOT / "content"

# ============================================================
# Canonical 66-book name list (the names we use in our build, in order)
# ============================================================
CANONICAL_BOOKS = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
    "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
    "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles",
    "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
    "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah",
    "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
    "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah",
    "Haggai", "Zechariah", "Malachi",
    "Matthew", "Mark", "Luke", "John", "Acts", "Romans",
    "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
    "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
    "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James",
    "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation",
]

# ============================================================
# Scrollmapper book-name aliases — they use Roman numerals
# ============================================================
SCROLL_NAME_MAP = {
    "I Samuel": "1 Samuel", "II Samuel": "2 Samuel",
    "I Kings": "1 Kings", "II Kings": "2 Kings",
    "I Chronicles": "1 Chronicles", "II Chronicles": "2 Chronicles",
    "I Corinthians": "1 Corinthians", "II Corinthians": "2 Corinthians",
    "I Thessalonians": "1 Thessalonians", "II Thessalonians": "2 Thessalonians",
    "I Timothy": "1 Timothy", "II Timothy": "2 Timothy",
    "I Peter": "1 Peter", "II Peter": "2 Peter",
    "I John": "1 John", "II John": "2 John", "III John": "3 John",
    "Revelation of John": "Revelation",
}

# ============================================================
# WEB book-filename map (TehShrike format)
# ============================================================
WEB_FILENAME_MAP = {
    "Genesis": "genesis", "Exodus": "exodus", "Leviticus": "leviticus",
    "Numbers": "numbers", "Deuteronomy": "deuteronomy",
    "Joshua": "joshua", "Judges": "judges", "Ruth": "ruth",
    "1 Samuel": "1samuel", "2 Samuel": "2samuel",
    "1 Kings": "1kings", "2 Kings": "2kings",
    "1 Chronicles": "1chronicles", "2 Chronicles": "2chronicles",
    "Ezra": "ezra", "Nehemiah": "nehemiah", "Esther": "esther",
    "Job": "job", "Psalms": "psalms", "Proverbs": "proverbs",
    "Ecclesiastes": "ecclesiastes", "Song of Solomon": "songofsolomon",
    "Isaiah": "isaiah", "Jeremiah": "jeremiah", "Lamentations": "lamentations",
    "Ezekiel": "ezekiel", "Daniel": "daniel",
    "Hosea": "hosea", "Joel": "joel", "Amos": "amos", "Obadiah": "obadiah",
    "Jonah": "jonah", "Micah": "micah", "Nahum": "nahum",
    "Habakkuk": "habakkuk", "Zephaniah": "zephaniah", "Haggai": "haggai",
    "Zechariah": "zechariah", "Malachi": "malachi",
    "Matthew": "matthew", "Mark": "mark", "Luke": "luke", "John": "john",
    "Acts": "acts", "Romans": "romans",
    "1 Corinthians": "1corinthians", "2 Corinthians": "2corinthians",
    "Galatians": "galatians", "Ephesians": "ephesians",
    "Philippians": "philippians", "Colossians": "colossians",
    "1 Thessalonians": "1thessalonians", "2 Thessalonians": "2thessalonians",
    "1 Timothy": "1timothy", "2 Timothy": "2timothy",
    "Titus": "titus", "Philemon": "philemon",
    "Hebrews": "hebrews", "James": "james",
    "1 Peter": "1peter", "2 Peter": "2peter",
    "1 John": "1john", "2 John": "2john", "3 John": "3john",
    "Jude": "jude", "Revelation": "revelation",
}


# ============================================================
# Parsers
# ============================================================

def parse_scrollmapper_books(src_path, translation_label):
    """Parse a scrollmapper one-big-JSON file into per-book dicts."""
    with open(src_path, encoding="utf-8") as f:
        data = json.load(f)

    out = {}  # canonical_name -> {book, chapters}
    for b in data["books"]:
        raw_name = b["name"]
        canonical = SCROLL_NAME_MAP.get(raw_name, raw_name)
        if canonical not in CANONICAL_BOOKS:
            continue  # skip Apocrypha or anything outside our 66 (handled separately)
        chapters = []
        for ch in b["chapters"]:
            verses = []
            for v in ch["verses"]:
                verses.append({"verse": str(v["verse"]), "text": v["text"].strip()})
            chapters.append({"chapter": str(ch["chapter"]), "verses": verses})
        out[canonical] = {"book": canonical, "chapters": chapters}
    return out


def parse_web_book(src_path):
    """Parse one TehShrike WEB book file (token stream) into our format."""
    with open(src_path, encoding="utf-8") as f:
        tokens = json.load(f)

    # Aggregate all text for each (chapter, verse) pair, in order.
    chapter_verse_text = {}  # (ch_num, v_num) -> list of text chunks
    chapter_verse_order = []  # ordered list of (ch_num, v_num) as we encounter them

    for tok in tokens:
        if tok.get("type") not in ("paragraph text", "line text"):
            continue
        ch = tok.get("chapterNumber")
        v = tok.get("verseNumber")
        text = tok.get("value", "")
        if ch is None or v is None:
            continue
        key = (int(ch), int(v))
        if key not in chapter_verse_text:
            chapter_verse_text[key] = []
            chapter_verse_order.append(key)
        chapter_verse_text[key].append(text)

    # Build chapters dict
    chapters_dict = {}  # ch_num -> [verses in order]
    seen_per_chapter = {}  # ch_num -> set of verse numbers seen so far

    for (ch, v) in chapter_verse_order:
        if ch not in chapters_dict:
            chapters_dict[ch] = []
            seen_per_chapter[ch] = set()
        if v in seen_per_chapter[ch]:
            continue  # already added this verse (we'll attach the joined text later)
        joined = " ".join(t.strip() for t in chapter_verse_text[(ch, v)] if t.strip())
        joined = re.sub(r"\s+", " ", joined).strip()
        chapters_dict[ch].append({"verse": str(v), "text": joined})
        seen_per_chapter[ch].add(v)

    # Sort chapters and verses
    chapters = []
    for ch_num in sorted(chapters_dict.keys()):
        verses = sorted(chapters_dict[ch_num], key=lambda x: int(x["verse"]))
        chapters.append({"chapter": str(ch_num), "verses": verses})
    return chapters


def parse_web():
    """Parse all 66 WEB books."""
    out = {}
    for canonical, fname in WEB_FILENAME_MAP.items():
        src = SOURCE_WEB / f"{fname}.json"
        if not src.exists():
            print(f"  ⚠ MISSING: {canonical} ({src})")
            continue
        chapters = parse_web_book(src)
        out[canonical] = {"book": canonical, "chapters": chapters}
    return out


# ============================================================
# Driver
# ============================================================

def write_translation(name, label, books, out_dir):
    """Write per-book JSON files into /content/<translation>/."""
    out_dir.mkdir(parents=True, exist_ok=True)
    n_chapters = 0
    n_verses = 0
    for canonical in CANONICAL_BOOKS:
        if canonical not in books:
            print(f"  ⚠ {label}: missing {canonical}")
            continue
        book = books[canonical]
        # Filename: lowercase, hyphens for spaces (matches our slug system)
        slug = canonical.lower().replace(" ", "-")
        out_file = out_dir / f"{slug}.json"
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(book, f, ensure_ascii=False, indent=2)
        n_chapters += len(book["chapters"])
        n_verses += sum(len(c["verses"]) for c in book["chapters"])
    print(f"  {label}: {len(books)} books, {n_chapters} chapters, {n_verses:,} verses → {out_dir}")


def main():
    print("=" * 60)
    print("  Translation parser")
    print("=" * 60)

    # ASV (American Standard Version, 1901)
    print("\n[1/3] Parsing ASV...")
    asv = parse_scrollmapper_books(SOURCE_SCROLL_JSON / "ASV.json", "ASV")
    write_translation("asv", "ASV", asv, OUT_BASE / "asv")

    # BBE (Bible in Basic English, 1949)
    print("\n[2/3] Parsing BBE...")
    bbe = parse_scrollmapper_books(SOURCE_SCROLL_JSON / "BBE.json", "BBE")
    write_translation("bbe", "BBE", bbe, OUT_BASE / "bbe")

    # WEB (World English Bible)
    print("\n[3/3] Parsing WEB...")
    web = parse_web()
    write_translation("web", "WEB", web, OUT_BASE / "web")

    print("\n" + "=" * 60)
    print("  Done.")
    print("=" * 60)


if __name__ == "__main__":
    main()
