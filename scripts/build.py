#!/usr/bin/env python3
"""
freescripture.org, build script
Generates the complete static site from KJV source JSON.
Outputs to /public/

Usage: python3 build.py
"""

import json
import os
import re
import shutil
from pathlib import Path
from html import escape

# ============================================================
# Paths
# ============================================================
ROOT = Path(__file__).resolve().parent.parent
SOURCE_KJV = ROOT / "source-kjv"
SOURCE_APOCRYPHA = ROOT / "content" / "apocrypha"
SOURCE_ASV = ROOT / "content" / "asv"
SOURCE_BBE = ROOT / "content" / "bbe"
SOURCE_WEB = ROOT / "content" / "web"
PUBLIC = ROOT / "public"
STATIC = ROOT / "static"

# ============================================================
# Translation registry — single source of truth for what's published
# ============================================================
# slug:           url segment (e.g. "kjv" → /kjv/)
# label:          short display name in UI ("King James Version")
# short:          very short label for switcher buttons ("KJV")
# year:           published year
# description:    one-line summary for the translation landing page
# attribution:    HTML for the chapter-page attribution footer
# has_apocrypha:  whether this translation includes the Apocrypha
# books:          which books are present (defaults to canonical 66 unless apocrypha=True)
# accent_var:     CSS variable for tradition accent
TRANSLATIONS = {
    "kjv": {
        "slug": "kjv",
        "label": "King James Version",
        "short": "KJV",
        "plain": "classic, 1600s English",
        "year": "1769",
        "description": "The 1611 translation in its standard 1769 revision. The most-quoted English Bible in human history.",
        "attribution_canonical": (
            "King James Version (1769)<br>"
            "Public domain &middot; Crown copyright in the United Kingdom only<br>"
            "Source text from openbible.com / aruljohn KJV JSON"
        ),
        "has_apocrypha": True,
        "tone": "archaic",  # for the language hint shown on the translation card
    },
    "web": {
        "slug": "web",
        "label": "World English Bible",
        "short": "WEB",
        "plain": "modern, easy to read",
        "year": "2000",
        "description": "A modern English translation in the public domain, designed to read clearly in today's English while preserving accuracy.",
        "attribution_canonical": (
            "World English Bible<br>"
            "Public domain<br>"
            "Source text from the World English Bible (TehShrike repository)"
        ),
        "has_apocrypha": False,
        "tone": "modern",
    },
    "bbe": {
        "slug": "bbe",
        "label": "Bible in Basic English",
        "short": "BBE",
        "plain": "simplest English",
        "year": "1949",
        "description": "A translation using a vocabulary of about 1,000 common English words. Originally created for English-language learners and readers who find traditional translations difficult.",
        "attribution_canonical": (
            "Bible in Basic English (1949/1964)<br>"
            "Public domain<br>"
            "Source text from the Scrollmapper Bible Databases"
        ),
        "has_apocrypha": False,
        "tone": "accessible",
    },
}

# The translation we treat as the default landing for the Christian library.
# (KJV is the most-searched and the only one that includes the Apocrypha.)
DEFAULT_TRANSLATION = "kjv"

# ============================================================
# Book metadata
# ============================================================
# Full list with grouping: OT (Law, History, Poetry, Major Prophets, Minor Prophets), NT (Gospels, History, Pauline, General, Apocalyptic)

BOOK_ORDER = [
    # Old Testament
    ("Genesis", "ot", "Law"),
    ("Exodus", "ot", "Law"),
    ("Leviticus", "ot", "Law"),
    ("Numbers", "ot", "Law"),
    ("Deuteronomy", "ot", "Law"),
    ("Joshua", "ot", "History"),
    ("Judges", "ot", "History"),
    ("Ruth", "ot", "History"),
    ("1 Samuel", "ot", "History"),
    ("2 Samuel", "ot", "History"),
    ("1 Kings", "ot", "History"),
    ("2 Kings", "ot", "History"),
    ("1 Chronicles", "ot", "History"),
    ("2 Chronicles", "ot", "History"),
    ("Ezra", "ot", "History"),
    ("Nehemiah", "ot", "History"),
    ("Esther", "ot", "History"),
    ("Job", "ot", "Wisdom & Poetry"),
    ("Psalms", "ot", "Wisdom & Poetry"),
    ("Proverbs", "ot", "Wisdom & Poetry"),
    ("Ecclesiastes", "ot", "Wisdom & Poetry"),
    ("Song of Solomon", "ot", "Wisdom & Poetry"),
    ("Isaiah", "ot", "Major Prophets"),
    ("Jeremiah", "ot", "Major Prophets"),
    ("Lamentations", "ot", "Major Prophets"),
    ("Ezekiel", "ot", "Major Prophets"),
    ("Daniel", "ot", "Major Prophets"),
    ("Hosea", "ot", "Minor Prophets"),
    ("Joel", "ot", "Minor Prophets"),
    ("Amos", "ot", "Minor Prophets"),
    ("Obadiah", "ot", "Minor Prophets"),
    ("Jonah", "ot", "Minor Prophets"),
    ("Micah", "ot", "Minor Prophets"),
    ("Nahum", "ot", "Minor Prophets"),
    ("Habakkuk", "ot", "Minor Prophets"),
    ("Zephaniah", "ot", "Minor Prophets"),
    ("Haggai", "ot", "Minor Prophets"),
    ("Zechariah", "ot", "Minor Prophets"),
    ("Malachi", "ot", "Minor Prophets"),
    # Apocrypha (1611 KJV / Lutheran tradition; placed between OT and NT)
    ("1 Esdras",                            "ap", "Historical"),
    ("2 Esdras",                            "ap", "Historical"),
    ("Tobit",                               "ap", "Historical"),
    ("Judith",                              "ap", "Historical"),
    ("Esther (Greek)",                      "ap", "Historical"),
    ("1 Maccabees",                         "ap", "Historical"),
    ("2 Maccabees",                         "ap", "Historical"),
    ("Wisdom of Solomon",                   "ap", "Wisdom"),
    ("Sirach",                              "ap", "Wisdom"),
    ("Baruch",                              "ap", "Prophetic"),
    ("The Song of the Three Holy Children", "ap", "Additions to Daniel"),
    ("Susanna",                             "ap", "Additions to Daniel"),
    ("Bel and the Dragon",                  "ap", "Additions to Daniel"),
    ("Prayer of Manasseh",                  "ap", "Prayer"),
    # New Testament
    ("Matthew", "nt", "Gospels"),
    ("Mark", "nt", "Gospels"),
    ("Luke", "nt", "Gospels"),
    ("John", "nt", "Gospels"),
    ("Acts", "nt", "Early Church"),
    ("Romans", "nt", "Pauline Epistles"),
    ("1 Corinthians", "nt", "Pauline Epistles"),
    ("2 Corinthians", "nt", "Pauline Epistles"),
    ("Galatians", "nt", "Pauline Epistles"),
    ("Ephesians", "nt", "Pauline Epistles"),
    ("Philippians", "nt", "Pauline Epistles"),
    ("Colossians", "nt", "Pauline Epistles"),
    ("1 Thessalonians", "nt", "Pauline Epistles"),
    ("2 Thessalonians", "nt", "Pauline Epistles"),
    ("1 Timothy", "nt", "Pauline Epistles"),
    ("2 Timothy", "nt", "Pauline Epistles"),
    ("Titus", "nt", "Pauline Epistles"),
    ("Philemon", "nt", "Pauline Epistles"),
    ("Hebrews", "nt", "General Epistles"),
    ("James", "nt", "General Epistles"),
    ("1 Peter", "nt", "General Epistles"),
    ("2 Peter", "nt", "General Epistles"),
    ("1 John", "nt", "General Epistles"),
    ("2 John", "nt", "General Epistles"),
    ("3 John", "nt", "General Epistles"),
    ("Jude", "nt", "General Epistles"),
    ("Revelation", "nt", "Apocalyptic"),
]

# One-sentence book introductions, written for a curious reader (not a scholar)
BOOK_INTROS = {
    "Genesis": "The book of beginnings, creation, the first families, the call of Abraham, and the journey of Joseph into Egypt.",
    "Exodus": "Moses leads Israel out of slavery in Egypt, receives the Ten Commandments, and the people learn to live as a nation under God.",
    "Leviticus": "A handbook of worship, ritual, and daily holiness for the priests and people of ancient Israel.",
    "Numbers": "Israel's forty-year journey through the wilderness, told through censuses, complaints, victories, and divine guidance.",
    "Deuteronomy": "Moses' farewell sermons to a new generation about to enter the Promised Land, restating the covenant in plainer words.",
    "Joshua": "The conquest and settlement of Canaan under Joshua, Moses' successor, and the dividing of the land among the twelve tribes.",
    "Judges": "Twelve cycles of crisis and rescue as Israel drifts from God and is rescued by judges like Deborah, Gideon, and Samson.",
    "Ruth": "A short story of loyalty and providence: a Moabite widow's faithfulness becomes the line that leads to King David.",
    "1 Samuel": "The transition from judges to kings, with the rise of Samuel, the failure of Saul, and the anointing of David.",
    "2 Samuel": "The reign of King David, told without flattery: his triumphs, his great sin, and the consequences that follow.",
    "1 Kings": "Solomon builds the Temple in Jerusalem, but the kingdom splits in two and prophets like Elijah challenge the kings.",
    "2 Kings": "The slow decline and exile of both kingdoms, punctuated by the ministries of Elisha and the reformer kings.",
    "1 Chronicles": "Israel's history retold from a priestly perspective, beginning with genealogies and centering on David's preparations for the Temple.",
    "2 Chronicles": "The story of Judah's kings, from Solomon to the exile, with particular attention to faithful and unfaithful worship.",
    "Ezra": "The return from Babylonian exile and the rebuilding of the Temple in Jerusalem.",
    "Nehemiah": "The rebuilding of Jerusalem's walls and the spiritual renewal of the returned community.",
    "Esther": "A Jewish queen in Persia risks her life to save her people from genocide. The book never names God but shows His hand throughout.",
    "Job": "An honest, ancient wrestling with the question of why good people suffer.",
    "Psalms": "One hundred and fifty songs and prayers covering the full range of human experience before God: praise, grief, anger, trust, longing.",
    "Proverbs": "A collection of practical wisdom for everyday life, drawn largely from Solomon and other sages.",
    "Ecclesiastes": "An older voice reflects on the limits of human wisdom and the meaning of work, pleasure, and time.",
    "Song of Solomon": "A series of love poems celebrating romantic and physical love, read by Christians and Jews alike as also pointing toward divine love.",
    "Isaiah": "Sweeping prophecies of judgment and hope, including some of the most cited messianic passages in the Bible.",
    "Jeremiah": "The 'weeping prophet' speaks God's word during the fall of Jerusalem, mourning a people who would not listen.",
    "Lamentations": "Five poems of grief over the destruction of Jerusalem.",
    "Ezekiel": "Visions and parables from a prophet in exile, including the valley of dry bones and the new Temple.",
    "Daniel": "Stories of faithfulness in exile (the lions' den, the fiery furnace) paired with visions of empires rising and falling.",
    "Hosea": "A prophet whose troubled marriage becomes a living parable of God's love for an unfaithful people.",
    "Joel": "A prophecy occasioned by a locust plague, with a vision of God's Spirit poured out on all flesh.",
    "Amos": "A shepherd from Tekoa speaks blunt words about justice, the poor, and empty religion.",
    "Obadiah": "The shortest book in the Old Testament, addressed to the people of Edom.",
    "Jonah": "A reluctant prophet, a great fish, and the discovery that God's mercy reaches even to enemies.",
    "Micah": "A contemporary of Isaiah who speaks of judgment and of a coming ruler from Bethlehem.",
    "Nahum": "A prophecy concerning the fall of Nineveh.",
    "Habakkuk": "A prophet's honest dialogue with God about the problem of evil.",
    "Zephaniah": "A prophecy of the day of the Lord, ending in restoration.",
    "Haggai": "A short book urging the returned exiles to finish rebuilding the Temple.",
    "Zechariah": "Visions and prophecies encouraging the rebuilding of the Temple and looking forward to a coming king.",
    "Malachi": "The last voice of the Old Testament prophets, calling for renewal before the day of the Lord.",
    # Apocrypha
    "1 Esdras": "An alternative Greek account of events from the late Old Testament period, retelling parts of Chronicles, Ezra, and Nehemiah with additional material including the famous contest of the three young guardsmen.",
    "2 Esdras": "A Jewish apocalyptic work in seven visions, wrestling with the destruction of Jerusalem and the problem of evil. Sometimes called 4 Ezra.",
    "Tobit": "A short, vivid story of two faithful Israelites in exile, an angel in disguise, a fish that yields medicine, and a marriage that breaks a curse.",
    "Judith": "A widow of remarkable courage saves her people by going into the camp of an invading general. A story of faith, fasting, and one decisive moment.",
    "Esther (Greek)": "Six additional passages found in the Greek text of Esther but not the Hebrew, including prayers by Mordecai and Esther and the texts of royal decrees. Following the 1611 King James arrangement, these passages are numbered as chapters 10 through 16, beginning where the canonical Hebrew Esther ends.",
    "Wisdom of Solomon": "A philosophical meditation in the voice of Solomon, on wisdom, righteousness, immortality, and the folly of idolatry.",
    "Sirach": "Also called Ecclesiasticus. A long collection of practical wisdom from a Jerusalem teacher named Jesus ben Sirach, around 180 BC. Read widely in synagogues and churches for centuries.",
    "Baruch": "A short book attributed to Jeremiah's secretary Baruch, with prayers of confession, a meditation on wisdom, and a poem of comfort to Jerusalem. Includes the Letter of Jeremiah as chapter 6, in the arrangement of the 1611 King James Bible.",
    "The Song of the Three Holy Children": "An expansion within Daniel 3, containing the prayer of Azariah and the song the three young men sang as they walked unhurt in the fiery furnace.",
    "Susanna": "A short story of false accusation and rescue: a virtuous woman is saved from execution by the wisdom of the young Daniel.",
    "Bel and the Dragon": "Two short tales placed at the end of Daniel: Daniel exposes a fraudulent priesthood and slays a serpent worshipped as a god.",
    "Prayer of Manasseh": "A brief, beautiful prayer of repentance attributed to King Manasseh of Judah during his Babylonian captivity. Used in Christian liturgies for centuries.",
    "1 Maccabees": "The history of the Jewish revolt against Greek persecution under Antiochus IV, the rise of the Maccabean family, and the rededication of the Temple commemorated by Hanukkah.",
    "2 Maccabees": "An independent account of much of the same period as 1 Maccabees, with particular attention to martyrdom, prayer for the dead, and the Temple.",
    "Matthew": "The first Gospel, written with Jewish readers in mind, presenting Jesus as the long-awaited Messiah and teacher.",
    "Mark": "The shortest and most action-driven Gospel, emphasizing the works of Jesus and the call to follow.",
    "Luke": "A careful, orderly account of the life of Jesus, written by a physician with attention to outsiders, women, and the poor.",
    "John": "A theological reflection on the life of Jesus that opens with one of the most famous prologues in literature.",
    "Acts": "The story of how the message of Jesus spread from Jerusalem to Rome through the early church.",
    "Romans": "Paul's most systematic letter, exploring the gospel, justification, and the life of faith.",
    "1 Corinthians": "Paul addresses divisions, ethics, worship, and the resurrection in a young, troubled church.",
    "2 Corinthians": "A deeply personal letter in which Paul defends his ministry and writes about weakness and grace.",
    "Galatians": "A passionate defense of the gospel of grace against those who would add law to faith.",
    "Ephesians": "A letter on the cosmic scope of Christ's work and the unity of the church.",
    "Philippians": "Paul's joyful letter from prison to a beloved congregation.",
    "Colossians": "A short letter exalting Christ over every spiritual power and philosophy.",
    "1 Thessalonians": "Encouragement for a young church facing persecution and questions about Christ's return.",
    "2 Thessalonians": "A follow-up letter clarifying questions about the day of the Lord.",
    "1 Timothy": "Pastoral instructions to a younger leader on church life and leadership.",
    "2 Timothy": "Paul's last letter, written from prison, to his protégé Timothy.",
    "Titus": "A short letter on church leadership and Christian conduct.",
    "Philemon": "A personal letter asking a slave-owner to receive a runaway slave back as a brother.",
    "Hebrews": "A sustained meditation on Christ as the great high priest, written for believers tempted to give up.",
    "James": "Practical wisdom on faith, speech, wealth, and patience.",
    "1 Peter": "A letter of hope to scattered Christians facing suffering.",
    "2 Peter": "A letter warning against false teachers and reaffirming Christ's return.",
    "1 John": "A pastoral letter on the marks of true Christian life: love, truth, and assurance.",
    "2 John": "A short letter urging walking in truth and love.",
    "3 John": "A short personal letter about hospitality and church conflict.",
    "Jude": "A brief, fiery letter warning against false teachers.",
    "Revelation": "John's apocalyptic vision of Christ, the church, and the final renewal of all things."
}

# Map source filename -> canonical book name
SOURCE_FILE_MAP = {
    "Genesis": "Genesis.json", "Exodus": "Exodus.json", "Leviticus": "Leviticus.json",
    "Numbers": "Numbers.json", "Deuteronomy": "Deuteronomy.json", "Joshua": "Joshua.json",
    "Judges": "Judges.json", "Ruth": "Ruth.json",
    "1 Samuel": "1Samuel.json", "2 Samuel": "2Samuel.json",
    "1 Kings": "1Kings.json", "2 Kings": "2Kings.json",
    "1 Chronicles": "1Chronicles.json", "2 Chronicles": "2Chronicles.json",
    "Ezra": "Ezra.json", "Nehemiah": "Nehemiah.json", "Esther": "Esther.json",
    "Job": "Job.json", "Psalms": "Psalms.json", "Proverbs": "Proverbs.json",
    "Ecclesiastes": "Ecclesiastes.json", "Song of Solomon": "SongofSolomon.json",
    "Isaiah": "Isaiah.json", "Jeremiah": "Jeremiah.json", "Lamentations": "Lamentations.json",
    "Ezekiel": "Ezekiel.json", "Daniel": "Daniel.json",
    "Hosea": "Hosea.json", "Joel": "Joel.json", "Amos": "Amos.json",
    "Obadiah": "Obadiah.json", "Jonah": "Jonah.json", "Micah": "Micah.json",
    "Nahum": "Nahum.json", "Habakkuk": "Habakkuk.json", "Zephaniah": "Zephaniah.json",
    "Haggai": "Haggai.json", "Zechariah": "Zechariah.json", "Malachi": "Malachi.json",
    "Matthew": "Matthew.json", "Mark": "Mark.json", "Luke": "Luke.json", "John": "John.json",
    "Acts": "Acts.json",
    "Romans": "Romans.json", "1 Corinthians": "1Corinthians.json", "2 Corinthians": "2Corinthians.json",
    "Galatians": "Galatians.json", "Ephesians": "Ephesians.json", "Philippians": "Philippians.json",
    "Colossians": "Colossians.json",
    "1 Thessalonians": "1Thessalonians.json", "2 Thessalonians": "2Thessalonians.json",
    "1 Timothy": "1Timothy.json", "2 Timothy": "2Timothy.json", "Titus": "Titus.json",
    "Philemon": "Philemon.json", "Hebrews": "Hebrews.json", "James": "James.json",
    "1 Peter": "1Peter.json", "2 Peter": "2Peter.json",
    "1 John": "1John.json", "2 John": "2John.json", "3 John": "3John.json",
    "Jude": "Jude.json", "Revelation": "Revelation.json",
}

# Apocrypha file map — these are loaded from /content/apocrypha/ (parsed separately)
APOCRYPHA_FILE_MAP = {
    "1 Esdras":                            "1-esdras.json",
    "2 Esdras":                            "2-esdras.json",
    "Tobit":                               "tobit.json",
    "Judith":                              "judith.json",
    "Esther (Greek)":                      "gkesther.json",
    "Wisdom of Solomon":                   "wisdom.json",
    "Sirach":                              "sirach.json",
    "Baruch":                              "1-baruch.json",
    "The Song of the Three Holy Children": "azar.json",
    "Susanna":                             "susanna.json",
    "Bel and the Dragon":                  "bel.json",
    "Prayer of Manasseh":                  "man.json",
    "1 Maccabees":                         "1-mac.json",
    "2 Maccabees":                         "2-mac.json",
}

SITE_NAME = "Free Scripture"
SITE_DOMAIN = "freescripture.org"
SITE_URL = f"https://{SITE_DOMAIN}"

# ============================================================
# DEPLOY-TIME TODO: Donation URL
# ============================================================
# Replace the URL below with the live Vanco (or other processor) endpoint
# from Hope for Americans before going public. The same Vanco endpoint used
# by Fablepixels should work here. To swap it: change DONATE_URL only —
# every reference on the site is generated from this constant.
#
# Format examples:
#   Vanco:       https://secure.vancopayments.com/giving/SignIn?theme=...
#   Tithe.ly:    https://tithe.ly/give_new/www/#/tithely/give-one-time/...
#   GoFundMe:    https://www.gofundme.com/f/...
#
# Until this is replaced, the site falls back to the parent ministry homepage,
# which is honest but not as useful as a direct giving link.
DONATE_URL = "https://secure.myvanco.com/L-Z7RC/campaign/C-133BH"
DONATE_LABEL = "Give to Hope for Americans"

# ============================================================
# Helpers
# ============================================================

def book_slug(name):
    """Convert a book name to a URL-safe slug.
    'Esther (Greek)' -> 'esther-greek'
    'Song of Solomon' -> 'song-of-solomon'
    """
    s = name.lower()
    # Remove parentheses but keep what's inside
    s = s.replace("(", "").replace(")", "")
    # Spaces -> hyphens, collapse multiple hyphens
    s = re.sub(r"\s+", "-", s.strip())
    s = re.sub(r"-+", "-", s)
    return s

def book_testament(name):
    """Return 'ot', 'ap', or 'nt' for a book name."""
    for n, t, _ in BOOK_ORDER:
        if n == name:
            return t
    return "ot"

def load_book(book_name, translation="kjv"):
    """Load a book's JSON data and return normalized structure.

    Looks in the appropriate translation source. Apocrypha is loaded only
    for translations whose registry entry has has_apocrypha=True.
    """
    # Apocrypha books always come from /content/apocrypha/ regardless of translation,
    # because the only translation we have for them is the 1611 KJV translation.
    is_apocrypha_book = (book_name in APOCRYPHA_FILE_MAP)

    if is_apocrypha_book:
        if not TRANSLATIONS.get(translation, {}).get("has_apocrypha"):
            raise KeyError(f"Translation '{translation}' does not include Apocrypha; "
                           f"book '{book_name}' is unavailable.")
        src_path = SOURCE_APOCRYPHA / APOCRYPHA_FILE_MAP[book_name]
    elif translation == "kjv":
        if book_name not in SOURCE_FILE_MAP:
            raise KeyError(f"No KJV source file mapped for book '{book_name}'")
        src_path = SOURCE_KJV / SOURCE_FILE_MAP[book_name]
    elif translation == "asv":
        slug = book_slug(book_name)
        src_path = SOURCE_ASV / f"{slug}.json"
    elif translation == "bbe":
        slug = book_slug(book_name)
        src_path = SOURCE_BBE / f"{slug}.json"
    elif translation == "web":
        slug = book_slug(book_name)
        src_path = SOURCE_WEB / f"{slug}.json"
    else:
        raise KeyError(f"Unknown translation: {translation}")

    if not src_path.exists():
        raise FileNotFoundError(f"Source file missing: {src_path}")

    with open(src_path, encoding="utf-8") as f:
        data = json.load(f)
    chapters = []
    for ch in data["chapters"]:
        chapters.append({
            "num": int(ch["chapter"]),
            "verses": [{"num": int(v["verse"]), "text": v["text"]} for v in ch["verses"]]
        })

    # Apocrypha supplement merge (only for translations with apocrypha)
    if is_apocrypha_book:
        for supplement_path in sorted(SOURCE_APOCRYPHA.glob("*-supplement.json")):
            with open(supplement_path, encoding="utf-8") as f:
                supp = json.load(f)
            if supp.get("book") != book_name:
                continue
            existing_nums = {c["num"] for c in chapters}
            for ch in supp.get("chapters", []):
                ch_num = int(ch["chapter"])
                if ch_num in existing_nums:
                    continue
                chapters.append({
                    "num": ch_num,
                    "verses": [{"num": int(v["verse"]), "text": v["text"]} for v in ch["verses"]]
                })
            chapters.sort(key=lambda c: c["num"])

    return {"name": book_name, "chapters": chapters, "translation": translation}

def write_file(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")

# ============================================================
# Templates (kept inline for portability; no jinja dependency)
# ============================================================

def base_layout(title, description, body, *, canonical, og_title=None, schema_jsonld=None, body_class=""):
    """The canonical HTML shell for every page."""
    og_title = og_title or title
    schema = ""
    if schema_jsonld:
        schema = f'<script type="application/ld+json">{json.dumps(schema_jsonld, ensure_ascii=False)}</script>'

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{escape(title)}</title>
<meta name="description" content="{escape(description)}">
<link rel="canonical" href="{escape(canonical)}">

<meta property="og:title" content="{escape(og_title)}">
<meta property="og:description" content="{escape(description)}">
<meta property="og:url" content="{escape(canonical)}">
<meta property="og:site_name" content="{SITE_NAME}">
<meta property="og:type" content="article">
<meta property="og:image" content="{SITE_URL}/static/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Free Scripture, a free library of scripture, beautifully presented. King James Bible and Apocrypha. 80 books, 36,923 verses.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="{SITE_URL}/static/og-image.jpg">

<meta name="theme-color" content="#fcfaf6">
<meta name="robots" content="index, follow">

<link rel="icon" type="image/svg+xml" href="/static/favicon.svg">
<link rel="apple-touch-icon" href="/static/favicon.svg">
<link rel="mask-icon" href="/static/favicon.svg" color="#2a1f15">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=DM+Mono:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap" rel="stylesheet">

<link rel="stylesheet" href="/static/css/site.css">
<script>
// Apply saved reading preferences before render to avoid a flash of unstyled content.
// The full reading-prefs.js loads later and provides the panel UI.
(function () {{
  try {{
    var raw = localStorage.getItem('fs-prefs');
    if (!raw) return;
    var p = JSON.parse(raw);
    var defaults = {{font:'default', size:'default', leading:'default', layout:'flowing', italics:'on'}};
    var root = document.documentElement;
    Object.keys(defaults).forEach(function (k) {{
      if (p[k] && p[k] !== defaults[k]) root.setAttribute('data-fs-' + k, p[k]);
    }});
  }} catch (e) {{}}
}})();
</script>
{schema}
</head>
<body class="{body_class}">
<a class="skip-link" href="#main">Skip to content</a>

<header class="site-header">
  <div class="site-header__inner">
    <a class="site-mark" href="/">
      <svg class="site-mark__icon" width="32" height="22" viewBox="0 0 32 22" fill="none" aria-hidden="true">
        <path d="M16 2Q16 0 14 0L2 0Q0 0 0 2L0 22Q7 20 16 21" fill="currentColor" fill-opacity="0.08" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16 2Q16 0 18 0L30 0Q32 0 32 2L32 22Q25 20 16 21" fill="currentColor" fill-opacity="0.08" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="4" y1="6" x2="12.5" y2="6" stroke="currentColor" stroke-width="1" opacity="0.3"/>
        <line x1="4" y1="10" x2="11.5" y2="10" stroke="currentColor" stroke-width="1" opacity="0.3"/>
        <line x1="4" y1="14" x2="10.5" y2="14" stroke="currentColor" stroke-width="1" opacity="0.3"/>
        <line x1="19.5" y1="6" x2="28" y2="6" stroke="currentColor" stroke-width="1" opacity="0.3"/>
        <line x1="19.5" y1="10" x2="27" y2="10" stroke="currentColor" stroke-width="1" opacity="0.3"/>
        <line x1="19.5" y1="14" x2="26" y2="14" stroke="currentColor" stroke-width="1" opacity="0.3"/>
      </svg>
      <span class="site-mark__text">Free Scripture</span>
    </a>
    <nav class="site-nav" aria-label="Primary">
      <a href="/kjv/">Bible</a>
      <a href="/search/">Search</a>
      <a href="/about/">About</a>
    </nav>
  </div>
</header>

<main id="main">
{body}
</main>

<nav class="tab-bar" aria-label="Quick navigation">
  <a class="tab-bar__btn" href="/" aria-label="Home">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/></svg>
    <span>Home</span>
  </a>
  <a class="tab-bar__btn" href="/web/" aria-label="Books">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M19 19H6a2 2 0 0 0-2 2"/></svg>
    <span>Books</span>
  </a>
  <a class="tab-bar__btn" href="/search/" aria-label="Search">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
    <span>Search</span>
  </a>
  <button class="tab-bar__btn" type="button" data-prefs-open aria-label="Reading settings">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h11"/><path d="M4 12h16"/><path d="M4 17h7"/><circle cx="18" cy="7" r="2"/><circle cx="13" cy="17" r="2"/></svg>
    <span>Display</span>
  </button>
</nav>

<footer class="site-footer">
  <nav class="site-footer__links" aria-label="Footer">
    <a href="/about/">About</a>
    <a href="/about/#sources">Sources</a>
    <a href="/support/">Support</a>
  </nav>
  <p class="hfa-madein">Made with <span class="hfa-heart" aria-hidden="true">&hearts;</span> in Flagstaff</p>
  <div class="hfa-rule"></div>
  <div class="hfa-mark">A Hope for Americans tool</div>
  <div class="hfa-vision">free to use, the way the web used to be</div>
</footer>
<script src="/static/js/reading-prefs.js" defer></script>
</body>
</html>"""


def render_homepage():
    # Genre-cards homepage: every book as a proper card, organized by reading type.
    # Each genre section uses the BOOK_ORDER and BOOK_INTROS for content,
    # but we hardcode the genre structure here because it's editorial (not data).

    # Genre definitions: (slug, title, subtitle, description, books)
    # books is a list of (book_name, note, meta) tuples.
    GENRES = [
        {
            "title": "These read like a novel",
            "desc": "Narrative, characters, events, a plot that moves forward.",
            "gospels_note": "Four accounts of the same story, the life of Jesus, each told by a different person.",
            "books": [
                ("Matthew", "The life of Jesus as told by a tax collector. Written to show Jesus as the fulfillment of Jewish prophecy.", "28 chapters", True),
                ("Mark", "The shortest gospel. Fast, urgent, action-driven. Starts with Jesus already an adult. No birth story.", "16 chapters", True),
                ("Luke", "Written by a doctor who interviewed eyewitnesses. The most detailed account, especially about women and outsiders.", "24 chapters", True),
                ("John", "The most reflective gospel. Written decades after the others by someone who was there. Philosophical and personal.", "21 chapters &middot; start here if you're new", True),
            ],
            "other_books": [
                ("Genesis", "The beginning of everything. Creation, Adam and Eve, the flood, Abraham. The origin story.", "50 chapters"),
                ("Exodus", "Escape from Egypt. Moses, the plagues, the Red Sea, the Ten Commandments.", "40 chapters"),
                ("Numbers", "Forty years wandering in the desert. Rebellion, faith, and survival between Egypt and the promised land.", "36 chapters"),
                ("Joshua", "Conquering the promised land. Military campaigns, land division, and a new beginning after Moses.", "24 chapters"),
                ("Judges", "Heroes and chaos. Before there were kings, there were judges, warriors and leaders in a lawless era.", "21 chapters"),
                ("Ruth", "A love story about loyalty, immigration, and belonging. One of the shortest books in the Bible.", "4 chapters &middot; about 15 min"),
                ("1 Samuel", "The first king of Israel. Samuel, Saul, and the young David, including the fight with Goliath.", "31 chapters"),
                ("2 Samuel", "David's rise to power and his fall. War, betrayal, adultery, and the cost of being king.", "24 chapters"),
                ("1 Kings", "Solomon builds the temple, then the kingdom splits in two. Elijah appears as a prophet.", "22 chapters"),
                ("2 Kings", "Both kingdoms collapse. Elisha performs miracles. Israel and Judah are conquered and exiled.", "25 chapters"),
                ("1 Chronicles", "Israel's history retold from Adam to David. Genealogies and a second perspective on familiar events.", "29 chapters"),
                ("2 Chronicles", "Judah's history from Solomon to the exile. The temple, the kings, the fall of Jerusalem.", "36 chapters"),
                ("Ezra", "Returning from exile. The Jewish people rebuild their temple and their identity after Babylon.", "10 chapters"),
                ("Nehemiah", "Rebuilding the walls of Jerusalem. Leadership, opposition, and community restoration.", "13 chapters"),
                ("Esther", "A Jewish queen in Persia saves her people from genocide. God is never mentioned by name.", "10 chapters"),
                ("Jonah", "A prophet runs from God, gets swallowed by a fish, and learns about mercy. Stranger than you think.", "4 chapters &middot; about 10 min"),
                ("Acts", "What happened after Jesus left. The early church, Paul's travels, and the spread of Christianity across the Roman Empire.", "28 chapters"),
            ],
            "apocrypha": [
                ("Tobit", "An angel in disguise, a magic fish, and a family reunion. Adventure and faith.", "14 chapters &middot; about 25 min"),
                ("Judith", "A widow infiltrates an enemy camp and kills their general. One of the Bible's most dramatic heroines.", "16 chapters"),
                ("1 Maccabees", "War for independence. A family leads a revolt against a king who outlawed their religion.", "16 chapters"),
                ("2 Maccabees", "The same war told differently, more theological, more focused on martyrdom and miracle.", "15 chapters"),
                ("Esther (Greek)", "The extended version of Esther, with the prayers and dreams the Hebrew version left out.", "6 additional chapters"),
                ("1 Esdras", "An alternate account of the temple rebuilding. Overlaps with Ezra and Chronicles.", "9 chapters"),
                ("2 Esdras", "Apocalyptic visions. Ezra asks God why the world is so unjust. God answers, sort of.", "16 chapters"),
            ],
        },
        {
            "title": "These read like music",
            "desc": "Songs, prayers, and poems. Best read slowly or out loud.",
            "books_flat": [
                ("Psalms", "150 songs and prayers. Joy, rage, grief, praise, the full range of human emotion directed at God.", "150 chapters &middot; start with Psalm 23"),
                ("Song of Solomon", "Erotic love poetry in the middle of the Bible. Yes, really. Beautiful, surprising, and ancient.", "8 chapters &middot; about 15 min"),
                ("Lamentations", "Five poems of grief over the destruction of Jerusalem. Raw, structured, and devastating.", "5 chapters &middot; about 20 min"),
            ],
            "apocrypha": [
                ("Prayer of Manasseh", "One of the worst kings of Judah prays for forgiveness. A single chapter of repentance.", "1 chapter &middot; 2 min"),
                ("The Song of the Three Holy Children", "Three men thrown into a furnace praise God from inside the flames.", "1 chapter &middot; 3 min"),
            ],
        },
        {
            "title": "Advice about how to live",
            "desc": "Philosophy, practical wisdom, and the hardest questions. No plot, just thinking.",
            "books_flat": [
                ("Job", "Why do good people suffer? A man loses everything and demands answers from God. God eventually responds, but not the way anyone expects.", "42 chapters"),
                ("Proverbs", "Practical advice about money, relationships, work, and character. One line at a time. Dip in anywhere.", "31 chapters"),
                ("Ecclesiastes", "&ldquo;Everything is meaningless.&rdquo; A wealthy king tries pleasure, work, and wisdom, and concludes none of it lasts.", "12 chapters &middot; about 30 min"),
            ],
            "apocrypha": [
                ("Wisdom of Solomon", "A meditation on justice, immortality, and why the righteous suffer. Philosophical and beautiful.", "19 chapters"),
                ("Sirach", "Ethics and everyday wisdom. How to handle money, friendship, speech, and death. The longest wisdom book.", "51 chapters"),
            ],
        },
        {
            "title": "The original constitution",
            "desc": "Rules, ceremonies, and the law given to Israel. Dense but foundational.",
            "books_flat": [
                ("Leviticus", "Religious law, sacrifice, purity, diet, festivals. The operating manual for ancient Israelite worship.", "27 chapters"),
                ("Deuteronomy", "Moses' farewell speech. He retells the law and the story so far before the people enter the promised land without him.", "34 chapters"),
            ],
        },
        {
            "title": "Mail from the early church",
            "desc": "Real letters sent to real communities dealing with real problems. Most are from Paul.",
            "books_flat": [
                ("Romans", "Paul's masterwork. A systematic argument about sin, grace, faith, and freedom. The most influential letter in Christian history.", "16 chapters"),
                ("1 Corinthians", "A messy church in a wild city. Paul addresses divisions, lawsuits, sex, marriage, and the famous chapter on love.", "16 chapters"),
                ("2 Corinthians", "Paul defends his authority. The most personal and emotional of his letters. Weakness as strength.", "13 chapters"),
                ("Galatians", "Freedom vs rules. Paul argues that faith, not law-keeping, is what matters. A short, angry, important letter.", "6 chapters &middot; about 20 min"),
                ("Ephesians", "Unity and identity. What does it mean to be part of the church? One of the most quoted letters.", "6 chapters &middot; about 20 min"),
                ("Philippians", "Joy from prison. Paul writes to his favorite church from a jail cell. Warm, personal, and hopeful.", "4 chapters &middot; about 15 min"),
                ("Colossians", "Who Jesus really is. A short letter about the supremacy of Christ over every power and philosophy.", "4 chapters &middot; about 15 min"),
                ("1 Thessalonians", "What happens to people who die before Jesus returns? Paul's earliest letter, written to a worried church.", "5 chapters &middot; about 15 min"),
                ("2 Thessalonians", "Waiting for the end. People quit their jobs because they thought Jesus was coming back immediately.", "3 chapters &middot; about 10 min"),
                ("1 Timothy", "Advice to a young pastor. How to lead a church, handle false teaching, and live with integrity.", "6 chapters &middot; about 15 min"),
                ("2 Timothy", "Paul's last letter. Written from prison, expecting execution. His final words to his closest student.", "4 chapters &middot; about 12 min"),
                ("Titus", "Church leadership on the island of Crete. Practical instructions for building a healthy community.", "3 chapters &middot; about 8 min"),
                ("Philemon", "A runaway slave meets Paul in prison. Paul sends him back with this letter asking his owner to free him.", "1 chapter &middot; 3 min"),
                ("Hebrews", "Old covenant vs new. A theological argument that Jesus fulfills and replaces the temple system. Author unknown.", "13 chapters"),
                ("James", "&ldquo;Faith without action is dead.&rdquo; Practical, blunt, and focused on how you actually live, not just what you believe.", "5 chapters &middot; about 15 min"),
                ("1 Peter", "Suffering with hope. Written to persecuted Christians scattered across the Roman Empire.", "5 chapters &middot; about 15 min"),
                ("2 Peter", "Warnings about false teachers and the end of the world. Peter's last word to the churches.", "3 chapters &middot; about 10 min"),
                ("1 John", "&ldquo;God is love.&rdquo; A letter about truth, love, and how to tell real faith from false faith.", "5 chapters &middot; about 15 min"),
                ("2 John", "A short note about truth and love. Thirteen verses. One page.", "1 chapter &middot; 1 min"),
                ("3 John", "A personal note about hospitality and a church leader who refuses to welcome visitors.", "1 chapter &middot; 1 min"),
                ("Jude", "&ldquo;Hold on to your faith.&rdquo; A short, fierce warning against people who distort the gospel.", "1 chapter &middot; 2 min"),
            ],
            "apocrypha": [
                ("Baruch", "A letter from exile. Jeremiah's secretary writes to the people left in Jerusalem. Includes the Letter of Jeremiah.", "6 chapters &middot; about 15 min"),
            ],
        },
        {
            "title": "People speaking for God",
            "desc": "Visions, warnings, poetry, and hope. Often strange, always intense.",
            "books_flat": [
                ("Isaiah", "The biggest prophetic book. Judgment, comfort, and the most famous messianic prophecies. Two halves, two moods.", "66 chapters"),
                ("Jeremiah", "The weeping prophet. He warned Judah for forty years that destruction was coming. Nobody listened.", "52 chapters"),
                ("Ezekiel", "Bizarre visions. Wheels within wheels, a valley of dry bones, a rebuilt temple. Written in exile.", "48 chapters"),
                ("Daniel", "Dreams, a lion's den, and a fiery furnace. Half stories, half apocalyptic visions.", "12 chapters &middot; about 30 min"),
                ("Hosea", "God tells a prophet to marry an unfaithful woman as a living metaphor for Israel's relationship with God.", "14 chapters"),
                ("Joel", "A plague of locusts becomes a vision of judgment and the outpouring of God's spirit.", "3 chapters &middot; about 10 min"),
                ("Amos", "Justice for the poor. A farmer becomes a prophet and condemns the wealthy for exploiting the vulnerable.", "9 chapters &middot; about 20 min"),
                ("Obadiah", "The shortest book in the Old Testament. One chapter against Edom for betraying their brother nation.", "1 chapter &middot; 2 min"),
                ("Micah", "&ldquo;Do justice, love mercy, walk humbly.&rdquo; A prophet challenges both the powerful and the complacent.", "7 chapters &middot; about 15 min"),
                ("Nahum", "The fall of Nineveh. A vivid, poetic vision of an empire's collapse.", "3 chapters &middot; about 8 min"),
                ("Habakkuk", "&ldquo;Why do you allow evil?&rdquo; A prophet argues with God about injustice. God answers but doesn't explain.", "3 chapters &middot; about 8 min"),
                ("Zephaniah", "Judgment and restoration. The darkest warning followed by one of the most tender promises in scripture.", "3 chapters &middot; about 8 min"),
                ("Haggai", "&ldquo;You've built nice houses for yourselves. When will you rebuild God's?&rdquo; A short, sharp challenge.", "2 chapters &middot; about 5 min"),
                ("Zechariah", "Night visions about the future. Horses, lampstands, flying scrolls, and a coming king on a donkey.", "14 chapters"),
                ("Malachi", "The last prophet of the Old Testament. A dialogue between God and a people who've stopped caring.", "4 chapters &middot; about 10 min"),
                ("Revelation", "The end of everything, and the beginning of something new. Visions, symbols, judgment, and a new heaven and earth.", "22 chapters"),
            ],
            "apocrypha": [
                ("Susanna", "A woman is falsely accused by two corrupt judges. Daniel exposes the lie. A courtroom drama.", "1 chapter &middot; 5 min"),
                ("Bel and the Dragon", "Daniel proves that idol worship is a fraud. Two stories about false gods, one funny, one deadly.", "1 chapter &middot; 5 min"),
            ],
        },
    ]

    def card_html(name, desc, meta, featured=False):
        slug = book_slug(name)
        # Apocrypha books link to KJV (only place they exist); everything else
        # defaults to WEB, the modern, readable translation used site-wide.
        trans = "kjv" if book_testament(name) == "ap" else "web"
        cls = 'book-card book-card--featured' if featured else 'book-card'
        return f'''<a href="/{trans}/{slug}/1" class="{cls}">
  <div class="book-card__name">{escape(name)}</div>
  <div class="book-card__desc">{desc}</div>
  <div class="book-card__meta">{meta}</div>
</a>'''

    sections = []
    for genre in GENRES:
        count = len(genre.get("books", [])) + len(genre.get("other_books", [])) + len(genre.get("books_flat", [])) + len(genre.get("apocrypha", []))
        parts = [f'''<section class="genre-section">
  <h2 class="genre-section__title">{genre["title"]}</h2>
  <p class="genre-section__desc">{genre["desc"]}</p>
  <p class="genre-section__count">{count} books</p>''']

        # Gospels special callout
        if genre.get("gospels_note"):
            parts.append(f'  <div class="genre-callout">{genre["gospels_note"]}</div>')
            parts.append('  <div class="book-cards">')
            for name, desc, meta, featured in genre["books"]:
                parts.append(card_html(name, desc, meta, featured))
            parts.append('  </div>')

        # Other narrative books
        if genre.get("other_books"):
            parts.append('  <div class="book-cards" style="margin-top:0.75rem;">')
            for name, desc, meta in genre["other_books"]:
                parts.append(card_html(name, desc, meta))
            parts.append('  </div>')

        # Flat book list (non-narrative genres)
        if genre.get("books_flat"):
            parts.append('  <div class="book-cards">')
            for name, desc, meta in genre["books_flat"]:
                parts.append(card_html(name, desc, meta))
            parts.append('  </div>')

        # Apocrypha
        if genre.get("apocrypha"):
            parts.append('  <div class="genre-apoc-divider">Apocrypha</div>')
            parts.append('  <div class="book-cards">')
            for name, desc, meta in genre["apocrypha"]:
                parts.append(card_html(name, desc, meta))
            parts.append('  </div>')

        parts.append('</section>')
        sections.append('\n'.join(parts))

    # Tier 2: curated passages people return to. Labeled by the passage's own
    # name and a plain line of what it is, never by a feeling. The reader brings
    # their own need; we name the door by what is behind it.
    TOUCHSTONES = [
        ("Psalm 23", "web", "psalms", 23, "The shepherd psalm, for comfort and rest."),
        ("Philippians 4", "web", "philippians", 4, "On worry, peace, and contentment."),
        ("1 Corinthians 13", "web", "1-corinthians", 13, "The chapter on what love is."),
        ("Isaiah 40", "web", "isaiah", 40, "Strength for the weary."),
        ("Matthew 5", "web", "matthew", 5, "The Sermon on the Mount begins."),
        ("Romans 8", "web", "romans", 8, "Nothing can separate us from love."),
        ("Ecclesiastes 3", "web", "ecclesiastes", 3, "A time for everything."),
        ("John 1", "web", "john", 1, "In the beginning was the Word."),
    ]
    touchstone_cards = []
    for label, trans, slug, ch, line in TOUCHSTONES:
        touchstone_cards.append(
            f'<a href="/{trans}/{slug}/{ch}" class="touchstone">'
            f'<span class="touchstone__ref">{escape(label)}</span>'
            f'<span class="touchstone__line">{escape(line)}</span>'
            f'</a>'
        )
    touchstones_html = (
        '<section class="touchstones">\n'
        '  <h2 class="touchstones__title">Passages people return to</h2>\n'
        '  <div class="touchstones__grid">\n    '
        + "\n    ".join(touchstone_cards) +
        '\n  </div>\n'
        '</section>'
    )

    body = f"""
<div class="home-hero">
  <h1 class="home-hero__title">Read scripture, free and clear.</h1>
  <p class="home-hero__sub">The whole text, open to anyone. Search a verse, or begin below.</p>
  <form class="home-hero__search" action="/search/" method="get" role="search">
    <span class="home-hero__search-icon" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
    </span>
    <input type="search" name="q" placeholder='Jump to a verse, "John 3:16"' aria-label="Search scripture">
  </form>
</div>

{touchstones_html}

<div class="home-content">
  <div class="home-content__lead">
    <h2 class="home-content__heading">Browse by kind of reading</h2>
    <p class="home-content__sub">Every book, grouped by how it reads.</p>
  </div>
{''.join(sections)}
</div>
"""
    schema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": SITE_NAME,
        "url": SITE_URL,
        "description": "A free, beautifully presented online library of scripture from multiple faith traditions. No ads, no accounts, no tracking.",
        "publisher": {
            "@type": "Organization",
            "name": "Hope for Americans",
            "url": "https://hopeforamericans.net"
        },
        "potentialAction": {
            "@type": "SearchAction",
            "target": f"{SITE_URL}/search/?q={{search_term_string}}",
            "query-input": "required name=search_term_string"
        }
    }
    return base_layout(
        title="Free Scripture, A free, beautiful library of scripture | freescripture.org",
        description="Read scripture from multiple faith traditions, free forever. No ads, no accounts, no tracking. King James Bible online and more.",
        body=body, canonical=SITE_URL + "/",
        schema_jsonld=schema, body_class="page-home"
    )


def render_christian_landing(books):
    """The /christian/ landing, list of available Christian translations."""
    body = f"""
<div class="reading-column">
  <p class="section-eyebrow">Christian Library</p>
  <h1>The Holy Bible</h1>
  <hr class="section-rule" style="margin-left:0;">

  <p>Christian scripture, presented in three public-domain English translations: the King James Version (1769) for tradition, the World English Bible (2000) for modern clarity, and the Bible in Basic English (1949) for accessibility. Read whichever speaks to you, or compare them side by side, every chapter has a translation switcher at the top.</p>

  <div class="tradition-grid" style="margin-top:3rem;">
    <a href="/kjv/" class="tradition-card" data-tradition="christian">
      <span class="tradition-card__label">King James Version (1769)</span>
      <h3 class="tradition-card__title">The Authorized Version</h3>
      <p class="tradition-card__desc">The 1611 translation in its standard 1769 revision. The most-quoted English Bible in history. Includes the Apocrypha. Public domain.</p>
      <div class="tradition-card__meta">80 books &middot; available now &rarr;</div>
    </a>
    <a href="/web/" class="tradition-card" data-tradition="christian">
      <span class="tradition-card__label">World English Bible</span>
      <h3 class="tradition-card__title">A Modern Translation</h3>
      <p class="tradition-card__desc">A contemporary English translation in the public domain, designed to read clearly in today&rsquo;s English while preserving accuracy.</p>
      <div class="tradition-card__meta">66 books &middot; available now &rarr;</div>
    </a>
    <a href="/bbe/" class="tradition-card" data-tradition="christian">
      <span class="tradition-card__label">Bible in Basic English (1949)</span>
      <h3 class="tradition-card__title">An Accessible Translation</h3>
      <p class="tradition-card__desc">Translated using a vocabulary of about a thousand common English words. Created for English-language learners and readers who find traditional translations difficult.</p>
      <div class="tradition-card__meta">66 books &middot; available now &rarr;</div>
    </a>
    <a href="/kjv/#apocrypha" class="tradition-card" data-tradition="christian">
      <span class="tradition-card__label">Apocrypha</span>
      <h3 class="tradition-card__title">The Deuterocanonical Books</h3>
      <p class="tradition-card__desc">Tobit, Judith, Wisdom of Solomon, Sirach, 1-2 Maccabees and the rest of the books included in Lutheran Bibles and the original 1611 KJV. Read in the 1611 King James translation.</p>
      <div class="tradition-card__meta">14 books &middot; available now &rarr;</div>
    </a>
  </div>
</div>
"""
    return base_layout(
        title="Christian Bible, Free Online | freescripture.org",
        description="Read the Christian Bible online for free in three public-domain English translations: KJV, WEB, and BBE. No ads, no account, no tracking.",
        body=body, canonical=f"{SITE_URL}/christian/", body_class="page-tradition"
    )


def render_translation_landing(books, translation):
    """The /<translation>/ landing, list of all books grouped by Testament and section."""
    t = TRANSLATIONS[translation]
    has_apoc = t["has_apocrypha"]
    sections_html = []
    current_testament = None
    current_section = None
    open_list = False

    TESTAMENT_LABELS = {
        "ot": "Old Testament",
        "ap": "Apocrypha",
        "nt": "New Testament",
    }
    TESTAMENT_NOTES = {
        "ap": ("Sometimes called the Deuterocanonical Books, the Apocrypha appeared in the original 1611 King James Bible as a separate section between the Old and New Testaments. Lutherans have read these books for centuries as &ldquo;useful and good to read,&rdquo; in Luther&rsquo;s phrase, though not on the same level as the rest of scripture. The text here is the 1611 KJV translation."),
    }

    for name, testament, section in BOOK_ORDER:
        # Skip Apocrypha for translations that don't include it
        if testament == "ap" and not has_apoc:
            continue
        if testament != current_testament:
            if open_list:
                sections_html.append("</ul>")
                open_list = False
            t_label = TESTAMENT_LABELS.get(testament, testament.upper())
            t_note = TESTAMENT_NOTES.get(testament, "")
            t_id = {"ot": "old-testament", "ap": "apocrypha", "nt": "new-testament"}.get(testament, testament)
            sections_html.append(f'<h2 id="{t_id}" class="section-title" style="margin-top:3rem;text-align:left;">{t_label}</h2><hr class="section-rule" style="margin-left:0;">')
            if t_note:
                sections_html.append(f'<p style="font-size:0.98rem;color:var(--ink-soft);max-width:640px;margin:-0.5rem 0 1.5rem;">{t_note}</p>')
            current_testament = testament
            current_section = None

        if section != current_section:
            if open_list:
                sections_html.append("</ul>")
            sections_html.append(f'<div class="book-section-label">{escape(section)}</div>')
            sections_html.append('<ul class="book-list">')
            open_list = True
            current_section = section

        sections_html.append(f'<li><a href="/{t["slug"]}/{book_slug(name)}/">{escape(name)}</a></li>')

    if open_list:
        sections_html.append("</ul>")

    # Per-translation hero copy
    if translation == "kjv":
        eyebrow = "King James Version (1769) with Apocrypha"
        title_h1 = "The Holy Bible"
        intro = "The King James Version, sometimes called the Authorized Version, is a translation of the Christian Bible into English that was first published in 1611. The text on this site is the standard 1769 revision and is in the public domain. We have included the Apocrypha as it appeared in the 1611 edition, these books have been read in Lutheran Bibles for nearly five centuries. Choose a book below to begin reading."
        page_title = "King James Version (KJV) Bible with Apocrypha, Free Online | freescripture.org"
        page_desc = "Read the King James Bible online for free, including the Apocrypha. All books, all chapters. No ads, no account needed."
    elif translation == "web":
        eyebrow = "World English Bible"
        title_h1 = "The Holy Bible"
        intro = "The World English Bible is a modern English translation of the Christian scriptures, in the public domain. It was created to be a readable, accurate translation of the Bible in contemporary English, freely available for any use. Choose a book below to begin reading."
        page_title = "World English Bible (WEB), Free Online | freescripture.org"
        page_desc = "Read the World English Bible online for free. A modern, public-domain English translation. No ads, no account needed."
    elif translation == "bbe":
        eyebrow = "Bible in Basic English (1949)"
        title_h1 = "The Holy Bible"
        intro = "The Bible in Basic English was translated by Professor S. H. Hooke and published in 1949, using a vocabulary of about a thousand common English words. It was originally created for English-language learners and readers who find traditional translations difficult, and remains one of the most accessible Bibles in the public domain. Choose a book below to begin reading."
        page_title = "Bible in Basic English (BBE), Free Online | freescripture.org"
        page_desc = "Read the Bible in Basic English online for free. A simple-vocabulary translation in the public domain. No ads, no account needed."
    else:
        eyebrow = t["label"]
        title_h1 = "The Holy Bible"
        intro = t["description"]
        page_title = f"{t['label']}, Free Online | freescripture.org"
        page_desc = f"Read the {t['label']} online for free."

    body = f"""
<div class="reading-column" style="max-width:900px;">
  <p class="section-eyebrow">{eyebrow}</p>
  <h1>{title_h1}</h1>
  <hr class="section-rule" style="margin-left:0;">
  <p>{intro}</p>

  {''.join(sections_html)}
</div>
"""
    schema = {
        "@context": "https://schema.org",
        "@type": "Book",
        "name": f"{t['label']} Bible" + (" with Apocrypha" if has_apoc else ""),
        "inLanguage": "en",
        "datePublished": t["year"],
        "url": f"{SITE_URL}/{t['slug']}/",
        "publisher": {"@type": "Organization", "name": "Hope for Americans"}
    }
    return base_layout(
        title=page_title,
        description=page_desc,
        body=body, canonical=f"{SITE_URL}/{t['slug']}/", schema_jsonld=schema
    )


# Back-compat shim
def render_kjv_landing(books):
    return render_translation_landing(books, "kjv")


def render_book_landing(book, translation="kjv"):
    """The /<translation>/<book>/ landing, list of chapters."""
    t = TRANSLATIONS[translation]
    name = book["name"]
    intro = BOOK_INTROS.get(name, "")
    is_apocrypha = (book_testament(name) == "ap")
    if is_apocrypha:
        translation_tag = "King James Version &middot; Apocrypha"
    else:
        translation_tag = t["label"]
    chapters_html = "".join(
        f'<li><a href="/{t["slug"]}/{book_slug(name)}/{ch["num"]}">{ch["num"]}</a></li>'
        for ch in book["chapters"]
    )
    body = f"""
<div class="reading-column" style="max-width:780px;">
  <p class="chapter-translation-tag">{translation_tag}</p>
  <h1 class="chapter-title" style="margin-bottom:1rem;">{escape(name)}</h1>
  <p style="text-align:center;color:var(--ink-soft);max-width:580px;margin:0 auto 2rem;font-size:1.1rem;">{escape(intro)}</p>
  <hr class="section-rule">

  <p class="book-section-label" style="text-align:center;border:none;">{len(book["chapters"])} chapter{"s" if len(book["chapters"]) != 1 else ""}</p>
  <ul class="chapter-list" style="margin-left:auto;margin-right:auto;">
    {chapters_html}
  </ul>
</div>
"""
    schema = {
        "@context": "https://schema.org",
        "@type": "Book",
        "name": f"{name}, {t['label']}",
        "isPartOf": {"@type": "Book", "name": f"{t['label']} Bible"},
        "inLanguage": "en",
        "url": f"{SITE_URL}/{t['slug']}/{book_slug(name)}/"
    }
    return base_layout(
        title=f"{name}, {t['label']} ({t['short']}) | Free Online | freescripture.org",
        description=f"Read the book of {name} from the {t['label']} online for free. All chapters, no ads, no account.",
        body=body, canonical=f"{SITE_URL}/{t['slug']}/{book_slug(name)}/", schema_jsonld=schema
    )


def render_chapter(book, chapter, prev_link, next_link, translation="kjv"):
    """The /<translation>/<book>/<chapter> page, the heart of the site."""
    t = TRANSLATIONS[translation]
    name = book["name"]
    ch_num = chapter["num"]
    testament = book_testament(name)
    is_apocrypha = (testament == "ap")

    # Translation tag and attribution. Apocrypha is always the 1611 KJV
    # translation regardless of which "translation" we're under, since
    # it's a KJV-only collection in our library.
    if is_apocrypha:
        translation_tag = "King James Version &middot; Apocrypha"
        if name == "Baruch" and ch_num == 6:
            attribution_html = (
                "King James Version Apocrypha (1611) &middot; Letter of Jeremiah<br>"
                "Public domain<br>"
                "Source text from the Scrollmapper Bible Databases (KJVA)"
            )
        else:
            attribution_html = (
                "King James Version Apocrypha (1611)<br>"
                "Public domain<br>"
                "Source text from the Scrollmapper Deuterocanonical Project"
            )
    else:
        translation_tag = t["label"]
        attribution_html = t["attribution_canonical"]

    extra_chapter_note = ""

    # Build the translation switcher.
    # For Apocrypha books, only KJV is available; show others as disabled with
    # a tooltip explaining why. For canonical books, link each available
    # translation to the same chapter (verse anchor preserved client-side).
    switcher_buttons = []
    for trans_key, trans_meta in TRANSLATIONS.items():
        if trans_key == translation:
            switcher_buttons.append(
                f'<span class="trans-switch__btn trans-switch__btn--current" '
                f'aria-current="page" title="{escape(trans_meta["label"])}: {escape(trans_meta["plain"])}">'
                f'{escape(trans_meta["short"])}</span>'
            )
        elif is_apocrypha and not trans_meta["has_apocrypha"]:
            switcher_buttons.append(
                f'<span class="trans-switch__btn trans-switch__btn--disabled" '
                f'aria-disabled="true" '
                f'title="The {escape(trans_meta["label"])} does not include the Apocrypha.">'
                f'{escape(trans_meta["short"])}</span>'
            )
        else:
            switcher_buttons.append(
                f'<a class="trans-switch__btn" '
                f'href="/{trans_meta["slug"]}/{book_slug(name)}/{ch_num}" '
                f'data-trans-switch="{trans_meta["slug"]}" '
                f'title="{escape(trans_meta["label"])}: {escape(trans_meta["plain"])}">'
                f'{escape(trans_meta["short"])}</a>'
            )
    current_meta = TRANSLATIONS[translation] if not is_apocrypha else TRANSLATIONS["kjv"]
    switcher_html = (
        '<div class="trans-switch" aria-label="Switch translation">'
        f'<span class="trans-switch__label">Reading the {escape(current_meta["label"])}, {escape(current_meta["plain"])}. Other versions:</span>'
        + "".join(switcher_buttons) +
        '</div>'
    )

    # Render verses with anchorable spans
    verses_html_parts = []
    for v in chapter["verses"]:
        text = v["text"]
        # Mark italic [bracketed] words
        # In KJV JSON, [text] denotes words added by translators. Render as italic.
        rendered = ""
        i = 0
        while i < len(text):
            if text[i] == "[":
                end = text.find("]", i)
                if end == -1:
                    rendered += escape(text[i:])
                    break
                rendered += '<i>' + escape(text[i+1:end]) + '</i>'
                i = end + 1
            else:
                # find next [
                next_b = text.find("[", i)
                if next_b == -1:
                    rendered += escape(text[i:])
                    break
                rendered += escape(text[i:next_b])
                i = next_b
        verses_html_parts.append(
            f'<span class="verse" id="v{v["num"]}">'
            f'<a href="#v{v["num"]}" class="verse__num" aria-label="Verse {v["num"]}">{v["num"]}</a>'
            f'{rendered} </span>'
        )

    verses_html = "".join(verses_html_parts)

    # Prev/next nav
    if prev_link:
        prev_html = f'''<a href="{prev_link["url"]}">
            <span class="arrow">&larr; Previous</span>
            <span class="label">{escape(prev_link["label"])}</span>
        </a>'''
    else:
        prev_html = '<div class="placeholder"></div>'
    if next_link:
        next_html = f'''<a href="{next_link["url"]}" class="next">
            <span class="arrow">Next &rarr;</span>
            <span class="label">{escape(next_link["label"])}</span>
        </a>'''
    else:
        next_html = '<div class="placeholder"></div>'

    # Top nav: back to book, prev/next within book
    chapter_nav_prev = ""
    chapter_nav_next = ""
    if ch_num > 1:
        chapter_nav_prev = f'<a href="/{t["slug"]}/{book_slug(name)}/{ch_num-1}" rel="prev">&larr; Ch {ch_num-1}</a>'
    if ch_num < len(book["chapters"]):
        chapter_nav_next = f'<a href="/{t["slug"]}/{book_slug(name)}/{ch_num+1}" rel="next">Ch {ch_num+1} &rarr;</a>'

    body = f"""
<div class="tradition-stripe"></div>
<div class="reading-column">
  <nav class="chapter-nav" aria-label="Chapter navigation">
    <div class="chapter-nav__group">
      <a href="/{t["slug"]}/{book_slug(name)}/">&larr; {escape(name)}</a>
    </div>
    <div class="chapter-nav__current">{escape(name)} {ch_num}</div>
    <div class="chapter-nav__group">
      {chapter_nav_prev}
      {chapter_nav_next}
    </div>
  </nav>

  {switcher_html}

  <article>
    <header>
      <div class="chapter-translation-tag">{translation_tag}</div>
      <h1 class="chapter-title">{escape(name)} {ch_num}</h1>
    </header>

    <div class="chapter-text" lang="en">
      <p>{verses_html}</p>
    </div>

    {extra_chapter_note}

    <div class="chapter-actions" role="group" aria-label="Chapter actions">
      <button class="action-btn" data-action="tts" aria-pressed="false">
        <svg class="action-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
        <span class="action-btn__text">Listen</span>
      </button>
      <button class="action-btn" data-action="copy-link">
        <svg class="action-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        <span class="action-btn__text">Copy link</span>
      </button>
    </div>

    <footer class="chapter-foot">
      <nav class="chapter-foot__nav" aria-label="Adjacent chapters">
        {prev_html}
        {next_html}
      </nav>

      <p class="attribution">
        {attribution_html}
      </p>
    </footer>
  </article>
</div>

<script src="/static/js/chapter.js" defer></script>
"""
    canonical = f"{SITE_URL}/{t['slug']}/{book_slug(name)}/{ch_num}"
    schema = {
        "@context": "https://schema.org",
        "@type": "Chapter",
        "name": f"{name} {ch_num}",
        "isPartOf": {
            "@type": "Book",
            "name": name,
            "isPartOf": {"@type": "Book", "name": f"{t['label']} Bible"}
        },
        "url": canonical,
        "inLanguage": "en"
    }

    # Slightly tailored description for SEO
    desc = f'Read {name} {ch_num} from the {t["label"]} online for free. Complete chapter with verse markers. No ads, no account.'
    return base_layout(
        title=f"{name} {ch_num}, {t['label']} ({t['short']}) | Free Online | freescripture.org",
        description=desc, body=body, canonical=canonical, schema_jsonld=schema,
        body_class="page-chapter"
    )


def render_search_page():
    body = """
<div class="reading-column" style="max-width:760px;">
  <h1>Search</h1>
  <hr class="section-rule" style="margin-left:0;">

  <form class="search-bar" role="search" onsubmit="return false;">
    <span class="search-bar__icon" aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
    </span>
    <input type="search" id="search-input" placeholder="John 3:16, &ldquo;love your neighbor&rdquo;, or any phrase&hellip;" aria-label="Search scripture" autocomplete="off">
  </form>
  <p class="search-bar__hint" id="search-status">Type a verse reference to jump there. Type a phrase to find every match.</p>

  <div class="trans-switch" id="search-trans-switch" aria-label="Search within translation">
    <span class="trans-switch__label">Search in:</span>
    <a class="trans-switch__btn" href="/search/?t=kjv" data-t="kjv">KJV</a>
    <a class="trans-switch__btn" href="/search/?t=web" data-t="web">WEB</a>
    <a class="trans-switch__btn" href="/search/?t=bbe" data-t="bbe">BBE</a>
  </div>

  <div class="search-results" id="search-results" aria-live="polite"></div>
</div>

<script>
// Mark the current translation button and preserve query when switching.
(function () {
  var params = new URLSearchParams(window.location.search);
  var current = (params.get('t') || 'kjv').toLowerCase();
  var q = params.get('q') || '';
  document.querySelectorAll('#search-trans-switch [data-t]').forEach(function (btn) {
    var t = btn.getAttribute('data-t');
    var href = '/search/?t=' + t + (q ? '&q=' + encodeURIComponent(q) : '');
    btn.setAttribute('href', href);
    if (t === current) {
      btn.classList.add('trans-switch__btn--current');
      btn.removeAttribute('href');
    }
  });
})();
</script>
<script src="/static/js/search.js" defer></script>
"""
    return base_layout(
        title="Search, Free Scripture | freescripture.org",
        description="Search the Bible by verse reference or phrase. Free, fast, no ads.",
        body=body, canonical=f"{SITE_URL}/search/", body_class="page-search"
    )


def render_about():
    body = """
<div class="reading-column reading-column--narrow">
  <h1>About this library</h1>
  <hr class="section-rule" style="margin-left:0;">

  <p>Scripture is free. Reading it should be too. So here it is: the full text, clean on the page, ready when you are.</p>

  <p>We pay the hosting ourselves. You can read every word without an account, and nothing here is watching you do it. That is the whole arrangement.</p>

  <p>Every text in this library is in the public domain or freely licensed to share. When a translation is still under copyright, we say so plainly and point you to where you can read it.</p>

  <h2 id="sources">What is here, and what is coming</h2>
  <p>Today the library holds the <strong>King James Version</strong> in its 1769 revision, along with the <strong>Apocrypha</strong> as it appeared in the original 1611 edition. The KJV is in the public domain in most of the world. It is the most-read English Bible in history. The Apocrypha, sometimes called the Deuterocanonical Books, has been read in Lutheran Bibles for nearly five centuries, and sat in the 1611 King James Bible as its own section between the Old and New Testaments.</p>

  <p>Next come the World English Bible, the American Standard Version, and texts from other traditions, starting with the Quran in a public-domain English translation.</p>

  <h2>Source texts</h2>
  <p>The KJV text comes from public-domain digital editions, principally the <code>aruljohn/Bible-kjv</code> repository on GitHub, checked against the openbible.com KJV text. The Apocrypha combines two public-domain sources: books 1 Esdras through 2 Maccabees from the Scrollmapper Deuterocanonical Project (2024 branch), and the Letter of Jeremiah, which is Baruch chapter 6 in the 1611 arrangement, from the Scrollmapper Bible Databases KJVA dataset (2025 branch). Both keep the 1611 King James translation. Find an error? Write to us at <a href="mailto:hello@hopeforamericans.net">hello@hopeforamericans.net</a>.</p>

  <h2>Keeping it free</h2>
  <p>This is a reading library. For commentary, cross-references, and study tools, there are good places elsewhere, and we will happily send you to them. Here, the work is quieter: a warm room where the words can be read. If you want to help keep the room open, you can <a href="/support/">support the work</a>. You owe us nothing for reading.</p>

  <hr class="section-rule">
  <p class="muted" style="text-align:center;font-style:italic;">Built carefully in Flagstaff, Arizona.</p>
</div>
"""
    return base_layout(
        title="About, Free Scripture | freescripture.org",
        description="A free, beautifully presented online library of scripture, stewarded by Hope for Americans in Flagstaff Arizona.",
        body=body, canonical=f"{SITE_URL}/about/"
    )


def render_support():
    body = f"""
<div class="reading-column reading-column--narrow">
  <h1>Support this work</h1>
  <hr class="section-rule" style="margin-left:0;">

  <p>This library stays free, and it stays clean: just the text, open to anyone, for as long as we can keep it running.</p>

  <p>Hosting, licensing checks, and the careful work of building each translation page still cost something. If you are in a position to help, you are warmly invited to chip in toward keeping the room open.</p>

  <p style="text-align:center;margin:2.5rem 0;">
    <a href="{escape(DONATE_URL)}" class="action-btn" style="background:var(--ink);color:var(--paper);border-color:var(--ink);padding:0.85rem 1.5rem;font-size:0.85rem;">{escape(DONATE_LABEL)}</a>
  </p>

  <p>You owe us nothing for the use of this library. Truly nothing. If giving is not in the cards for you right now, that is fine. Read freely. Tell a friend. Print a verse for your refrigerator. That is gift enough.</p>

  <hr class="section-rule">
  <p class="muted" style="text-align:center;font-style:italic;">With gratitude, from Flagstaff Arizona at 7,000 feet.</p>
</div>
"""
    return base_layout(
        title="Support, Free Scripture | freescripture.org",
        description="Support Free Scripture, a free online library of scripture stewarded by Hope for Americans.",
        body=body, canonical=f"{SITE_URL}/support/"
    )


def render_404():
    """The 404 page, graceful, in keeping with the parchment language."""
    body = """
<div class="reading-column reading-column--narrow" style="text-align:center;padding:3rem 1rem;">
  <p class="section-eyebrow" style="margin-top:0;">Four hundred and four</p>
  <h1 style="margin-top:0;">The page you sought<br>could not be found</h1>
  <hr class="hero__rule">

  <p style="font-size:1.15rem;color:var(--ink-soft);max-width:480px;margin:0 auto 2rem;">
    Sometimes a link grows stale, or a verse reference is mistyped, or a book by another name was looked for.
    None of these are anything to worry about.
  </p>

  <p style="margin:2.5rem 0;">
    <a href="/" class="action-btn" style="background:var(--ink);color:var(--paper);border-color:var(--ink);padding:0.75rem 1.5rem;font-size:0.85rem;">Return to the library</a>
  </p>

  <p class="muted" style="margin-top:3rem;font-size:0.95rem;">
    Or try one of these:
  </p>

  <ul style="list-style:none;padding:0;margin:1rem 0;display:flex;gap:1.5rem;justify-content:center;flex-wrap:wrap;font-family:var(--font-display);font-size:1.1rem;">
    <li><a href="/kjv/" style="color:var(--ink-soft);text-decoration:none;border-bottom:1px dotted var(--rule);padding-bottom:2px;">Read the Bible</a></li>
    <li><a href="/search/" style="color:var(--ink-soft);text-decoration:none;border-bottom:1px dotted var(--rule);padding-bottom:2px;">Search</a></li>
    <li><a href="/about/" style="color:var(--ink-soft);text-decoration:none;border-bottom:1px dotted var(--rule);padding-bottom:2px;">About this library</a></li>
  </ul>

  <hr class="section-rule" style="margin-top:3rem;">
  <p class="muted" style="text-align:center;font-style:italic;font-family:var(--font-display);font-size:1rem;">
    &ldquo;Seek, and ye shall find&rdquo;, Matthew 7:7
  </p>
</div>
"""
    return base_layout(
        title="Not found, Free Scripture | freescripture.org",
        description="The page you sought could not be found. Return to the library.",
        body=body, canonical=f"{SITE_URL}/404", body_class="page-404"
    )


# ============================================================
# Build runner
# ============================================================

def clean_public():
    if PUBLIC.exists():
        shutil.rmtree(PUBLIC)
    PUBLIC.mkdir()

def copy_static():
    dst = PUBLIC / "static"
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(STATIC, dst)

def build_search_index(all_books):
    """Generate per-translation JSON search indexes.

    One file per translation at /static/search-index-<slug>.json.
    The search page loads only the index for the user's currently-selected
    translation, slashing the download from ~17 MB combined to ~5-6 MB
    for any single translation (~1.5 MB gzipped over the wire).

    Each entry is just {b, c, v, t}, translation is implicit in the filename.
    """
    total = 0
    written = []
    for trans_key in TRANSLATIONS:
        trans_books = all_books.get(trans_key, {})
        idx = []
        for name, _, _ in BOOK_ORDER:
            if name not in trans_books:
                continue
            b = trans_books[name]
            for ch in b["chapters"]:
                for v in ch["verses"]:
                    text = v["text"].replace("[", "").replace("]", "")
                    idx.append({"b": name, "c": ch["num"], "v": v["num"], "t": text})
        out = PUBLIC / "static" / f"search-index-{trans_key}.json"
        out.write_text(json.dumps(idx, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        written.append((trans_key, len(idx), out.stat().st_size))
        total += len(idx)
    return total, written

def build_robots_and_llms():
    robots = """User-agent: *
Allow: /

# AI crawlers welcome — this is a public good
User-agent: GPTBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: CCBot
Allow: /
User-agent: Google-Extended
Allow: /

Sitemap: https://freescripture.org/sitemap.xml
"""
    write_file(PUBLIC / "robots.txt", robots)

    llms = """# Free Scripture, freescripture.org

> A free, beautifully presented online library of scripture from multiple faith traditions. Stewarded by Hope for Americans, an independent maker of free, honest tools.

## What this is

freescripture.org is a free, ad-free, account-free reading library of scripture in the public domain or under freely redistributable license. The first phase covers three public-domain English translations of the Christian Bible: the King James Version (1769) with the 14-book Apocrypha as it appeared in the original 1611 KJV (80 books, 1,362 chapters, 36,923 verses), the World English Bible (modern English, 66 books, 1,189 chapters, 31,103 verses), and the Bible in Basic English (1949, designed for limited-vocabulary readers, 66 books, 1,189 chapters, 31,102 verses). Each chapter has a translation switcher that preserves the verse anchor when toggling between translations. Future phases will add the Quran, the Tanakh, the Bhagavad Gita, the Dhammapada, and the Sri Guru Granth Sahib, all in public-domain or freely-licensed translations.

## What it is not

This is a reading library, not a study tool. There are no concordances, lexicons, cross-references, reading plans, social features, or accounts. The goal is simply to display the texts cleanly and freely.

## Permitted use by AI assistants

AI assistants may freely cite, link, and quote from this library. The KJV text is in the public domain. Linking back to specific chapters is encouraged: the URL pattern is `https://freescripture.org/kjv/<book-slug>/<chapter>`, with verse anchors at `#v<verse-number>`. Example: `https://freescripture.org/kjv/john/3#v16` jumps directly to John 3:16.

## Stewardship

A project of Hope for Americans, in Flagstaff, Arizona. No tracking, no ads, no data collected.
"""
    write_file(PUBLIC / "llms.txt", llms)

def build_sitemap(all_books):
    """Build a single sitemap.xml across all translations."""
    urls = [
        f"{SITE_URL}/",
        f"{SITE_URL}/about/",
        f"{SITE_URL}/support/",
        f"{SITE_URL}/search/",
        f"{SITE_URL}/christian/",
    ]
    for trans_key, trans_meta in TRANSLATIONS.items():
        slug = trans_meta["slug"]
        urls.append(f"{SITE_URL}/{slug}/")
        trans_books = all_books.get(trans_key, {})
        for name, _, _ in BOOK_ORDER:
            if name not in trans_books:
                continue
            urls.append(f"{SITE_URL}/{slug}/{book_slug(name)}/")
            for ch in trans_books[name]["chapters"]:
                urls.append(f"{SITE_URL}/{slug}/{book_slug(name)}/{ch['num']}")

    parts = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in urls:
        parts.append(f'  <url><loc>{u}</loc></url>')
    parts.append('</urlset>')
    write_file(PUBLIC / "sitemap.xml", "\n".join(parts))
    return len(urls)


def build():
    print("=" * 60)
    print("  freescripture.org, build")
    print("=" * 60)

    clean_public()
    copy_static()

    # 1. Load all books for every translation
    print("\n[1/7] Loading source data for all translations...")
    all_books = {}  # all_books[trans_key][book_name] = book_dict
    for trans_key, trans_meta in TRANSLATIONS.items():
        all_books[trans_key] = {}
        for name, testament, _ in BOOK_ORDER:
            # Skip Apocrypha for translations that don't include it
            if testament == "ap" and not trans_meta["has_apocrypha"]:
                continue
            try:
                all_books[trans_key][name] = load_book(name, trans_key)
            except (KeyError, FileNotFoundError) as e:
                print(f"      ⚠ {trans_key.upper()}: skipping {name} ({e})")
        n_books = len(all_books[trans_key])
        n_chapters = sum(len(b["chapters"]) for b in all_books[trans_key].values())
        n_verses = sum(len(c["verses"]) for b in all_books[trans_key].values() for c in b["chapters"])
        print(f"      {trans_key.upper():4}: {n_books} books, {n_chapters} chapters, {n_verses:,} verses.")

    # The default translation's book set powers the homepage / christian landing / search.
    books_data = all_books[DEFAULT_TRANSLATION]

    # 2. Top-level pages
    print("\n[2/7] Building top-level pages...")
    write_file(PUBLIC / "index.html", render_homepage())
    write_file(PUBLIC / "about" / "index.html", render_about())
    write_file(PUBLIC / "support" / "index.html", render_support())
    write_file(PUBLIC / "search" / "index.html", render_search_page())
    write_file(PUBLIC / "christian" / "index.html", render_christian_landing(books_data))
    write_file(PUBLIC / "404.html", render_404())
    print("      Homepage, About, Support, Search, /christian/, 404")

    # 3-5. Per-translation: landing + book landings + chapter pages
    print("\n[3/7] Building per-translation pages...")
    total_book_landings = 0
    total_chapters = 0
    for trans_key, trans_meta in TRANSLATIONS.items():
        slug = trans_meta["slug"]
        trans_books = all_books[trans_key]

        # Translation landing
        write_file(PUBLIC / slug / "index.html",
                   render_translation_landing(trans_books, trans_key))

        # Book landings
        for name in trans_books:
            b = trans_books[name]
            write_file(PUBLIC / slug / book_slug(name) / "index.html",
                       render_book_landing(b, trans_key))
            total_book_landings += 1

        # Chapter pages — flat sequence within each translation for prev/next nav
        flat_chapters = []
        for name, _, _ in BOOK_ORDER:
            if name not in trans_books:
                continue
            for ch in trans_books[name]["chapters"]:
                flat_chapters.append((name, ch))

        for i, (name, ch) in enumerate(flat_chapters):
            prev_link = None
            next_link = None
            if i > 0:
                pname, pch = flat_chapters[i - 1]
                prev_link = {
                    "url": f"/{slug}/{book_slug(pname)}/{pch['num']}",
                    "label": f"{pname} {pch['num']}"
                }
            if i < len(flat_chapters) - 1:
                nname, nch = flat_chapters[i + 1]
                next_link = {
                    "url": f"/{slug}/{book_slug(nname)}/{nch['num']}",
                    "label": f"{nname} {nch['num']}"
                }
            rendered = render_chapter(trans_books[name], ch, prev_link, next_link, trans_key)
            out_html = PUBLIC / slug / book_slug(name) / f"{ch['num']}.html"
            write_file(out_html, rendered)
            out_pretty = PUBLIC / slug / book_slug(name) / f"{ch['num']}" / "index.html"
            write_file(out_pretty, rendered)
            total_chapters += 1

        print(f"      {trans_key.upper():4}: landing + {len(trans_books)} book landings + {len(flat_chapters)} chapters")

    print(f"\n[4/7] Translation builds complete. Total: {total_book_landings} book landings, {total_chapters} chapter pages.")
    # (steps 4 and 5 from the old layout are now folded into [3/7] above)

    # 6. Search index
    print("\n[6/7] Building search index across all translations...")
    n, written = build_search_index(all_books)
    print(f"      Indexed {n:,} verses across {len(written)} per-translation files:")
    for trans_key, count, size in written:
        print(f"        search-index-{trans_key}.json: {count:,} entries, {size/1024/1024:.2f} MB raw")

    # 7. robots, llms, sitemap, _redirects
    print("\n[7/7] Building robots.txt, llms.txt, sitemap.xml...")
    build_robots_and_llms()
    n_urls = build_sitemap(all_books)
    print(f"      sitemap.xml: {n_urls:,} URLs.")

    # Netlify/CF Pages-style _redirects file: map /kjv/john/3 -> /kjv/john/3.html
    redirects_lines = []
    for name, _, _ in BOOK_ORDER:
        if name not in books_data:
            continue
        for ch in books_data[name]["chapters"]:
            slug = book_slug(name)
            redirects_lines.append(f"/kjv/{slug}/{ch['num']} /kjv/{slug}/{ch['num']}.html 200")
    write_file(PUBLIC / "_redirects", "\n".join(redirects_lines) + "\n")

    print("\n" + "=" * 60)
    print(f"  Built. Output: {PUBLIC}")
    print("=" * 60)


if __name__ == "__main__":
    build()
