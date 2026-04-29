#!/usr/bin/env python3
"""
freescripture.org — Apocrypha parser

Converts the scrollmapper deuterocanonical txt format to our standard JSON
structure (matching the aruljohn KJV format). Outputs one JSON file per book
to /content/apocrypha/.

The 14 books of the 1611 KJV / Lutheran Apocrypha:
  1. 1 Esdras
  2. 2 Esdras
  3. Tobit
  4. Judith
  5. Esther (Greek additions)
  6. Wisdom of Solomon
  7. Sirach (Ecclesiasticus)
  8. Baruch (chs 1-5 from this source; Letter of Jeremiah / ch 6 stitched in
     at build time from a separate KJVA source — see baruch-6-supplement.json)
  9. Song of the Three Holy Children (Azariah)
  10. Story of Susanna
  11. Bel and the Dragon
  12. Prayer of Manasseh
  13. 1 Maccabees
  14. 2 Maccabees

Source format:
  Header line (book name), blank line, then verses like:
  [1:1] The book of the words of Tobit...
  [1:2] Who in the time of Enemessar...

Note on supplement files: build.py merges any *-supplement.json file in
/content/apocrypha/ into its target book at load time, adding chapters that
are not already present. baruch-6-supplement.json is committed alongside
the parser output and adds the Letter of Jeremiah as Baruch chapter 6.

Usage: python3 scripts/parse_apocrypha.py
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "source-deutero" / "txt"
OUT = ROOT / "content" / "apocrypha"

# Map (source-folder, output-name)
APOCRYPHA_BOOKS = [
    ("1-esdras",  "1 Esdras"),
    ("2-esdras",  "2 Esdras"),
    ("tobit",     "Tobit"),
    ("judith",    "Judith"),
    ("gkesther",  "Esther (Greek)"),
    ("wisdom",    "Wisdom of Solomon"),
    ("sirach",    "Sirach"),
    ("1-baruch",  "Baruch"),
    ("azar",      "The Song of the Three Holy Children"),
    ("susanna",   "Susanna"),
    ("bel",       "Bel and the Dragon"),
    ("man",       "Prayer of Manasseh"),
    ("1-mac",     "1 Maccabees"),
    ("2-mac",     "2 Maccabees"),
]

VERSE_TOKEN_RE = re.compile(r"\[(\d+):(\d+)\]")


def parse_book(folder, name):
    """Parse a book's txt file into our standard book structure.

    Handles two messy realities of the source format:
      1. Most verses are on their own line starting with [N:N]
      2. Occasionally two verses appear on one line (e.g. Manasseh 1:7 and 1:8)
         and the source has stray prefix cruft like 'cb' before the second marker.

    Strategy: ignore line boundaries; tokenize the whole file by [N:N] markers.
    """
    src_files = list((SOURCE / folder).glob("*.txt"))
    if not src_files:
        raise FileNotFoundError(f"No .txt file in {SOURCE / folder}")
    src = src_files[0]

    with open(src, encoding="utf-8") as f:
        full = f.read()

    # Find every verse token in document order, then take text between successive tokens
    matches = list(VERSE_TOKEN_RE.finditer(full))
    chapters = {}

    for i, m in enumerate(matches):
        ch = int(m.group(1))
        v = int(m.group(2))
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(full)
        text = full[start:end]

        # Clean: collapse whitespace, strip stray prefix/suffix cruft like 'cb',
        # and strip leading/trailing whitespace.
        text = re.sub(r"\s+", " ", text).strip()
        # Strip leading 'cb' (chapter break artifact) when it precedes a real word
        text = re.sub(r"^cb(?=\s|[A-Za-z])", "", text).strip()
        # Strip trailing 'cb' or ': cb' (the chapter break sometimes precedes the next verse marker)
        text = re.sub(r"\s*cb\s*$", "", text).strip()
        # If we ended up with a dangling colon and no continuation, normalize trailing punctuation
        text = re.sub(r":\s*$", ":", text)

        chapters.setdefault(ch, []).append({"verse": str(v), "text": text})

    # Build chapters in order
    ch_list = []
    for ch_num in sorted(chapters.keys()):
        ch_list.append({"chapter": str(ch_num), "verses": chapters[ch_num]})

    return {"book": name, "chapters": ch_list}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    summary = []

    for folder, name in APOCRYPHA_BOOKS:
        data = parse_book(folder, name)
        out_file = OUT / (folder + ".json")
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        n_chapters = len(data["chapters"])
        n_verses = sum(len(c["verses"]) for c in data["chapters"])
        summary.append((name, n_chapters, n_verses))
        print(f"  {name:38} {n_chapters:>4} ch  {n_verses:>5} v")

    total_v = sum(v for _, _, v in summary)
    total_c = sum(c for _, c, _ in summary)
    print(f"\n  {'TOTAL':38} {total_c:>4} ch  {total_v:>5} v")
    print(f"\nWrote {len(APOCRYPHA_BOOKS)} books to {OUT}")


if __name__ == "__main__":
    main()
